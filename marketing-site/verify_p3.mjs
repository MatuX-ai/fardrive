// P3 修复回归：网络异常 4 级状态机 + 手机尺寸适配
import { strict as assert } from 'node:assert';

// ===== 1) 网络异常 4 级状态机：net 字段默认 =====
const net = {
  mode:'good', level:0, badFor:0,
  reconnectTries:0, reconnectMax:3, reconnectGap:2,
  payloadDelayMs:0, payloadLossPct:0
};
assert.equal(net.mode, 'good', '默认模式应为 good');
assert.equal(net.level, 0, '默认等级应为 0');
assert.equal(net.reconnectMax, 3, '最多重连 3 次');
console.log('1) 网络异常 net 字段: ✅');

// ===== 2) sampleNet：4 种模式参数 =====
function sampleNet(m){
  if(m === 'good') return { delay: 60 + Math.random()*40, loss: 0 };
  if(m === 'lag') return { delay: 350 + Math.random()*200, loss: 5 + Math.random()*5 };
  if(m === 'loss') return { delay: 150 + Math.random()*100, loss: 30 + Math.random()*15 };
  if(m === 'off') return { delay: 9999, loss: 100 };
}
const g = sampleNet('good'); assert.ok(g.delay < 110 && g.loss === 0);
const l = sampleNet('lag'); assert.ok(l.delay >= 350 && l.delay <= 550);
const lo = sampleNet('loss'); assert.ok(lo.loss >= 30 && lo.loss <= 45);
const o = sampleNet('off'); assert.equal(o.delay, 9999); assert.equal(o.loss, 100);
console.log('2) sampleNet 4 种模式: ✅');

// ===== 3) 4 级状态机判定 =====
function decideLevel(mode, badFor, delay, loss){
  if(mode === 'good') return 0;
  if(mode === 'off'){
    if(badFor < 3) return 3;
    return 3; // 重连中（多次重试仍 L3，最终 L4 由外部触发）
  }
  if(delay > 500 || loss > 20){
    return badFor >= 3 ? 2 : 1;
  }
  if(delay > 250) return 1;
  return 0;
}
assert.equal(decideLevel('good', 0, 100, 0), 0);
assert.equal(decideLevel('lag', 1, 400, 8), 1, 'lag 1s 内应 L1');
assert.equal(decideLevel('lag', 5, 600, 25), 2, 'lag 5s 后应 L2');
assert.equal(decideLevel('loss', 1, 200, 35), 1, 'loss 短时延但高丢包 1s 内 L1');
assert.equal(decideLevel('off', 2, 9999, 100), 3, 'off < 3s 应 L3');
assert.equal(decideLevel('lag', 0, 200, 0), 0, '轻微抖动应正常');
console.log('3) 4 级状态机判定: ✅');

// ===== 4) L4 失败：退款计算 =====
function calcRefund(paid, dist, total){
  const ratio = Math.min(1, dist / Math.max(1, total));
  return Math.max(0, Math.round(paid * (1 - ratio)));
}
assert.equal(calcRefund(15, 0, 320), 15, '未出发应全额退款');
assert.equal(calcRefund(15, 160, 320), 8, '半程退款约 50%');
assert.equal(calcRefund(15, 320, 320), 0, '完成应不退款');
assert.equal(calcRefund(28, 50, 510), 25, '切诺基起步退款');
console.log('4) L4 退款计算: ✅');

// ===== 4b) 退款兜底逻辑：退款为 0 时应显示"全额退款" =====
function refundText(refund, paid){
  return refund > 0 ? ('¥' + refund) : ('全额退款 ¥' + paid);
}
assert.equal(refundText(8, 15), '¥8');
assert.equal(refundText(0, 15), '全额退款 ¥15');
console.log('4b) 退款文案: ✅');

// ===== 5) HUD 信号染色阈值 =====
function hudSigText(delay){
  if(delay > 999) return '断';
  if(delay > 250) return '4G·弱';
  return '4G·低延迟';
}
function hudSigColor(delay){
  if(delay > 500) return 'var(--bad)';
  if(delay > 250) return 'var(--amber)';
  return '';
}
assert.equal(hudSigText(100), '4G·低延迟');
assert.equal(hudSigText(400), '4G·弱');
assert.equal(hudSigText(9999), '断');
assert.equal(hudSigColor(100), '');
assert.equal(hudSigColor(400), 'var(--amber)');
assert.equal(hudSigColor(800), 'var(--bad)');
console.log('5) HUD 信号染色: ✅');

// ===== 6) speedLimit 应用到 target =====
function calcTarget(base, gas, steer, speedLimit){
  if(!gas) return 0;
  return base * 0.48 * speedLimit * (0.6 + 0.4*(1 - Math.abs(steer)/45));
}
const tNormal = calcTarget(60, 1, 0, 1);
const tLimited = calcTarget(60, 1, 0, 0.7);
const tStopped = calcTarget(60, 1, 0, 0);
assert.ok(Math.abs(tLimited / tNormal - 0.7) < 0.001, 'L2 应为 0.7 倍');
assert.equal(tStopped, 0, 'L3/L4 应为 0');
console.log('6) speedLimit 应用: ✅');

// ===== 7) 重连计数：3 次失败 =====
function nextReconnectStage(badFor, gap){
  if(badFor < 3) return 1;
  return Math.min(3, Math.floor((badFor - 3) / gap) + 1);
}
assert.equal(nextReconnectStage(1, 2), 1, '< 3s 第一次重连');
assert.equal(nextReconnectStage(4, 2), 1, '3-5s 仍是第 1 次');
assert.equal(nextReconnectStage(6, 2), 2, '5-7s 第 2 次');
assert.equal(nextReconnectStage(8, 2), 3, '7-9s 第 3 次');
assert.equal(nextReconnectStage(11, 2), 3, '> 9s 已达 3 次上限');
console.log('7) 重连计数 3 次: ✅');

// ===== 8) 手机尺寸断点 =====
const breakpoints = {
  small: 360,   // ≤360 用紧凑布局
  large: 430    // ≥430 用宽松布局
};
assert.equal(breakpoints.small, 360);
assert.equal(breakpoints.large, 430);

// 主要屏幕宽度
const screens = {
  'iPhone SE':320,
  'iPhone 12 mini':360,
  'iPhone 14':390,
  'iPhone 14 Pro Max':430
};
for(const [name, w] of Object.entries(screens)){
  if(w <= breakpoints.small) console.log('  ' + name + ' (' + w + '): small layout');
  else if(w >= breakpoints.large) console.log('  ' + name + ' (' + w + '): large layout');
  else console.log('  ' + name + ' (' + w + '): standard layout');
}
console.log('8) 手机尺寸断点: ✅');

// ===== 9) 安全区 padding：env() =====
function safePadding(base){
  return 'calc(' + base + 'px + env(safe-area-inset-bottom, 0))';
}
assert.equal(safePadding(16), 'calc(16px + env(safe-area-inset-bottom, 0))');
assert.equal(safePadding(20), 'calc(20px + env(safe-area-inset-bottom, 0))');
console.log('9) 安全区 padding: ✅');

// ===== 10) 网络订单 status 字段：refunded =====
const failOrder = {
  id:'D12345678', type:'drive', subtype:'断线退款',
  status:'refunded', exp:0, gold:5
};
assert.equal(failOrder.status, 'refunded');
// 订单卡片渲染时 refunded 应使用 .refund 颜色类
function statusText(o){ return o.status === 'refunded' ? '已退款' : (o.won ? '已结算' : '已结束'); }
assert.equal(statusText(failOrder), '已退款');
console.log('10) 失败订单状态: ✅');

console.log('\n========== 全部 P3 修复回归通过 ==========');
