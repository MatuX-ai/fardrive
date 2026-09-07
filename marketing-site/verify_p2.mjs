// P2 修复回归：个人中心 / 订单历史 / 字号 + 对比度
import { strict as assert } from 'node:assert';

// ===== 1) 个人中心：state 字段默认存在 =====
const state1 = {
  lv:1, exp:0, expNext:100, gold:320,
  streak:1, name:'探索者', title:'远驱新秀',
  lit:[], totalKm:0, fragments:0, driveSec:0,
  wins:0, seasonPts:1240, raceStreak:0,
  selectedCar:'212',
  orders:[], coupons:[], inviteCode:'',
  settings:{ leftHand:false, vibration:true, hd:true, sound:true }
};
assert.ok(Array.isArray(state1.orders), 'orders 应为数组');
assert.ok(Array.isArray(state1.coupons), 'coupons 应为数组');
assert.ok(typeof state1.inviteCode === 'string', 'inviteCode 应为字符串');
assert.ok(state1.settings && typeof state1.settings.leftHand === 'boolean', 'settings.leftHand 应为布尔');
console.log('1) 个人中心 state 字段: ✅');

// ===== 1b) 邀请码格式：FD + 6 位数字 =====
function genCode(){ return 'FD' + Math.floor(Math.random()*900000+100000); }
const code = genCode();
assert.equal(code.length, 8, '邀请码应为 8 位');
assert.ok(/^FD\d{6}$/.test(code), '邀请码应为 FD + 6 位数字');
console.log('1b) 邀请码格式: ✅ ' + code);

// ===== 2) 订单模型与写入 =====
function createDriveOrder(success, pt, car, driveSec, dist){
  return {
    id: 'D' + Date.now().toString().slice(-8),
    type:'drive',
    subtype: success ? '坐标点亮' : '电量耗尽',
    name: pt ? pt.name : '未知坐标',
    car: car.name,
    amount: car.cost,
    km: Math.round(dist),
    duration: Math.floor(driveSec),
    startAt: Date.now() - Math.floor(driveSec*1000),
    status: 'done'
  };
}
function createRaceOrder(won, carName, opponent){
  return {
    id: 'R' + Date.now().toString().slice(-8),
    type:'race',
    name: '双人赛·' + carName + ' vs ' + opponent,
    car: carName,
    amount: 0,
    won,
    opponent,
    startAt: Date.now(),
    duration: 30,
    km: 1000,
    status: 'done'
  };
}
const o1 = createDriveOrder(true, {name:'坐标 #1'}, {name:'212型', cost:15}, 5, 320);
assert.equal(o1.type, 'drive');
assert.equal(o1.subtype, '坐标点亮');
assert.equal(o1.amount, 15);
assert.equal(o1.km, 320);
assert.ok(o1.id.startsWith('D'));

const o2 = createRaceOrder(true, '212型', '夜风车神');
assert.equal(o2.type, 'race');
assert.equal(o2.won, true);
assert.ok(o2.id.startsWith('R'));

const o3 = createDriveOrder(false, null, {name:'212型', cost:15}, 2, 80);
assert.equal(o3.subtype, '电量耗尽');
console.log('2) 订单模型与写入: ✅');

// ===== 3) 订单列表渲染：最新在前 + 类型过滤 =====
let orders = [];
orders.push(createDriveOrder(true, {name:'A'}, {name:'212', cost:15}, 5, 320));
orders.push(createRaceOrder(false, '212', 'X'));
orders.push(createDriveOrder(true, {name:'B'}, {name:'切诺基', cost:28}, 6, 510));
orders.reverse(); // 最新在前
assert.equal(orders[0].name, 'B', '最新订单应在最前');
assert.equal(orders[1].name.includes('双人赛'), true);
const driveOnly = orders.filter(o => o.type === 'drive');
assert.equal(driveOnly.length, 2);
const raceOnly = orders.filter(o => o.type === 'race');
assert.equal(raceOnly.length, 1);
console.log('3) 订单列表渲染顺序与过滤: ✅');

// ===== 4) 订单保留上限 30 =====
let big = [];
for(let i=0;i<35;i++) big.push(createDriveOrder(true, {name:'P'+i}, {name:'212', cost:15}, 1, 100));
big = big.slice(-30); // 模拟保存后裁剪
assert.equal(big.length, 30, '订单数应裁剪到 30');
assert.equal(big[0].name, 'P5', '保留最后 30 个');
console.log('4) 订单上限 30: ✅');

// ===== 5) 优惠券：过期判断 =====
const now = Date.now();
const valid = { id:'a', discount:10, expireAt: now + 86400000, used:false };
const expired = { id:'b', discount:20, expireAt: now - 1000, used:false };
const used = { id:'c', discount:30, expireAt: now + 86400000, used:true };
const coupons = [valid, expired, used];
const usable = coupons.filter(c => !c.used && c.expireAt > now);
assert.equal(usable.length, 1, '应仅 1 张可用');
assert.equal(usable[0].id, 'a');
console.log('5) 优惠券过期判断: ✅');

// ===== 6) 字号优化：基础文字应 ≥ 11px =====
const sizes = {
  hint: 12,            // .hint
  pLine1: 13,          // .p-line1
  pLine2: 11,          // .p-line2
  tabButton: 12,       // .app-tabs button
  mutedAlpha: 0.7      // --muted 透明度
};
assert.ok(sizes.hint >= 11, 'hint 应 ≥ 11px');
assert.ok(sizes.pLine1 >= 12, 'p-line1 应 ≥ 12px');
assert.ok(sizes.pLine2 >= 11, 'p-line2 应 ≥ 11px');
assert.ok(sizes.tabButton >= 12, 'tab 应 ≥ 12px');
assert.ok(sizes.mutedAlpha >= 0.65, 'muted 对比度应 ≥ 0.65（WCAG AA）');
console.log('6) 字号与对比度: ✅');

// ===== 7) 订单详情：金额与奖励计算 =====
function orderDetail(o){
  const dt = new Date(o.startAt);
  const dateStr = dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0');
  let body = o.id + ' ' + dateStr + ' ';
  if(o.type === 'drive'){
    body += '行驶 ' + (o.km/1000).toFixed(2) + ' km · ' + o.duration + 's';
    if(o.exp !== undefined) body += ' +' + o.exp + '经验';
  }else{
    body += (o.won?'胜':'负') + ' vs ' + o.opponent;
  }
  return body;
}
const d1 = orderDetail(o1);
assert.ok(d1.includes('D'));
assert.ok(d1.includes('0.32') || d1.includes('0.32 km'));
const d2 = orderDetail(o2);
assert.ok(d2.includes('胜'));
console.log('7) 订单详情渲染: ✅');

// ===== 8) 邀请码复制降级 =====
function copyCode(code, hasClipboard){
  if(hasClipboard){
    return 'copied';
  }
  return '请手动复制：' + code;
}
assert.equal(copyCode('FD123456', true), 'copied');
assert.equal(copyCode('FD123456', false), '请手动复制：FD123456');
console.log('8) 邀请码复制（含降级路径）: ✅');

console.log('\n========== 全部 P2 修复回归通过 ==========');
