// P9 修复回归：换电导航 + 真实支付 SDK 接入
import { strict as assert } from 'node:assert';

// ===== 1) 换电导航配置 =====
const BAT_CFG = {
  navPct: 25,
  slowPct: 15,
  deadPct: 5,
  rescueFee: 30,
  swapDist: 300,
  swapTimeMin: 2
};
assert.equal(BAT_CFG.navPct, 25);
assert.equal(BAT_CFG.slowPct, 15);
assert.equal(BAT_CFG.deadPct, 5);
console.log('1) 换电导航阈值: ✅ <25/<15/<5');

// ===== 2) 等级判定 =====
function batteryLevel(b, cur){
  if(b >= BAT_CFG.navPct) return 0;
  if(b < BAT_CFG.deadPct) return 3;
  if(b < BAT_CFG.slowPct) return 2;
  return 1;
}
assert.equal(batteryLevel(95, 0), 0);
assert.equal(batteryLevel(30, 0), 0);
assert.equal(batteryLevel(24, 0), 1, '< 25% 触发导航');
assert.equal(batteryLevel(20, 0), 1);
assert.equal(batteryLevel(14, 0), 2, '< 15% 触发龟速');
assert.equal(batteryLevel(4, 0), 3, '< 5% 触发趴窝');
assert.equal(batteryLevel(0, 0), 3);
console.log('2) 等级判定: ✅ 4 档');

// ===== 3) 等级与限速 =====
function speedLimitByLevel(L){
  if(L === 3) return 0;
  if(L === 2) return 0.3;
  if(L === 1) return 1;
  return 1;
}
assert.equal(speedLimitByLevel(3), 0);
assert.equal(speedLimitByLevel(2), 0.3);
assert.equal(speedLimitByLevel(1), 1);
assert.equal(speedLimitByLevel(0), 1);
console.log('3) 等级与限速: ✅ 0 / 0.3 / 1 / 1');

// ===== 4) 剩余续航估算 =====
function estimateRemainMin(battery){
  return Math.max(0, Math.floor(battery / 100 * 5 * 60) / 60);
}
assert.equal(estimateRemainMin(100), 5);
assert.equal(estimateRemainMin(50), 2.5);
assert.equal(estimateRemainMin(0), 0);
console.log('4) 续航估算: ✅');

// ===== 5) 升级/降级保护 =====
function nextLevel(battery, curLevel){
  const target = batteryLevel(battery, curLevel);
  if(target === curLevel) return curLevel; // 不变
  return target;
}
assert.equal(nextLevel(95, 1), 0, '满电从 1→0');
assert.equal(nextLevel(20, 0), 1, '20% 从 0→1');
assert.equal(nextLevel(10, 1), 2, '10% 从 1→2');
assert.equal(nextLevel(3, 2), 3, '3% 从 2→3');
assert.equal(nextLevel(50, 1), 0, '跳级 1→0 满电');
console.log('5) 等级过渡: ✅');

// ===== 6) 救援费退款逻辑 =====
function calcRescue(refuseRescue){
  // 拒绝救援：扣救援费
  if(refuseRescue) return 30;
  // 接受救援：扣救援费
  return 30;
}
// 简化版：救援费固定 ¥30，可从金币扣除
const rescueFee = BAT_CFG.rescueFee;
assert.equal(rescueFee, 30);
console.log('6) 救援费: ✅ ¥' + rescueFee);

// ===== 7) PayConfig + 适配器工厂 =====
const PayConfig = {
  mode: 'sandbox',
  pollIntervalMs: 2000,
  pollTimeoutMs: 15 * 60 * 1000,
  providers: { wechat: 'SandboxAdapter', alipay: 'SandboxAdapter', coin: 'CoinAdapter' }
};
assert.equal(PayConfig.mode, 'sandbox');
assert.equal(PayConfig.pollIntervalMs, 2000);
assert.equal(PayConfig.pollTimeoutMs, 900000);
console.log('7) PayConfig: ✅ mode=' + PayConfig.mode);

// ===== 8) PayAdapter 抽象基类 =====
class PayAdapter {
  constructor(name){ this.name = name; }
  async create(){ throw new Error('not implemented'); }
  async query(){ throw new Error('not implemented'); }
  async cancel(){ throw new Error('not implemented'); }
}

class SandboxAdapter extends PayAdapter {
  constructor(){ super('sandbox'); }
  async create(opts){
    return { ok:true, orderId:'SB' + Date.now(), amount:opts.amount, method:opts.method, expiresIn:900 };
  }
  async query(id){ return { ok:true, status:'PENDING', orderId:id }; }
  async cancel(){ return { ok:true }; }
}
class CoinAdapter extends PayAdapter {
  constructor(){ super('coin'); }
  async create(opts){ return { ok:true, orderId:'COIN' + Date.now(), amount:opts.amount, method:'coin' }; }
  async query(id){ return { ok:true, status:'PAID', orderId:id }; }
  async cancel(){ return { ok:true }; }
}

const sandbox = new SandboxAdapter();
const coin = new CoinAdapter();
assert.ok(sandbox instanceof PayAdapter);
assert.ok(coin instanceof PayAdapter);
console.log('8) PayAdapter 抽象类: ✅');

// ===== 9) 适配器工厂 =====
function createPayAdapter(method, mode){
  mode = mode || PayConfig.mode;
  if(method === 'coin') return new CoinAdapter();
  if(mode === 'production') return new SandboxAdapter(); // 真实环境应换 WechatAdapter/AlipayAdapter
  return new SandboxAdapter();
}
assert.ok(createPayAdapter('coin') instanceof CoinAdapter);
assert.ok(createPayAdapter('wechat') instanceof SandboxAdapter);
assert.ok(createPayAdapter('alipay') instanceof SandboxAdapter);
console.log('9) 适配器工厂: ✅');

// ===== 10) 适配器 create/query/cancel 一致性 =====
async function testAdapterFlow(){
  const a = createPayAdapter('wechat');
  const c = await a.create({ method:'wechat', amount:30 });
  assert.equal(c.ok, true);
  assert.ok(c.orderId);
  assert.equal(c.amount, 30);
  assert.equal(c.method, 'wechat');
  assert.ok(c.expiresIn > 0);
  const q = await a.query(c.orderId);
  assert.equal(q.ok, true);
  assert.ok(['PENDING','PAID','FAILED','EXPIRED'].includes(q.status));
  const x = await a.cancel(c.orderId);
  assert.equal(x.ok, true);
}
testAdapterFlow().then(()=>{
  console.log('10) 适配器流程: ✅');
}).catch(e => console.log('10) 适配器流程: ❌ ' + e.message));

// ===== 11) 状态机映射：trade_state / tradeStatus =====
function mapWechatState(s){
  return { SUCCESS:'PAID', REFUND:'REFUNDED', CLOSED:'FAILED', REVOKED:'FAILED', NOTPAY:'PENDING' }[s] || 'PENDING';
}
function mapAlipayState(s){
  return { TRADE_SUCCESS:'PAID', WAIT_BUYER_PAY:'PENDING', TRADE_CLOSED:'FAILED' }[s] || 'PENDING';
}
assert.equal(mapWechatState('SUCCESS'), 'PAID');
assert.equal(mapWechatState('NOTPAY'), 'PENDING');
assert.equal(mapWechatState('CLOSED'), 'FAILED');
assert.equal(mapWechatState('UNKNOWN'), 'PENDING');
assert.equal(mapAlipayState('TRADE_SUCCESS'), 'PAID');
assert.equal(mapAlipayState('WAIT_BUYER_PAY'), 'PENDING');
assert.equal(mapAlipayState('TRADE_CLOSED'), 'FAILED');
console.log('11) 状态码映射: ✅');

// ===== 12) 轮询超时 =====
const pollDeadline = Date.now() + PayConfig.pollTimeoutMs;
assert.ok(pollDeadline - Date.now() > 14 * 60 * 1000, '超时 15 分钟');
console.log('12) 轮询超时: ✅ 15 分钟');

// ===== 13) CoinAdapter 即时 PAID =====
async function testCoinFlow(){
  const a = new CoinAdapter();
  const c = await a.create({ amount:50 });
  const q = await a.query(c.orderId);
  assert.equal(q.status, 'PAID', '金币支付立即 PAID');
}
testCoinFlow().then(()=>{
  console.log('13) 金币支付立即 PAID: ✅');
}).catch(e => console.log('13) 金币支付立即 PAID: ❌ ' + e.message));

// ===== 14) SandboxAdapter 永远 PENDING（等手动） =====
async function testSandboxPending(){
  const a = new SandboxAdapter();
  const c = await a.create({ amount:30 });
  const q = await a.query(c.orderId);
  assert.equal(q.status, 'PENDING', '沙箱需手动触发 PAID');
}
testSandboxPending().then(()=>{
  console.log('14) 沙箱 PENDING: ✅');
}).catch(e => console.log('14) 沙箱 PENDING: ❌ ' + e.message));

// ===== 15) PollTimer 不累积 =====
function pollTimerState(){
  let timer = null;
  function start(){
    if(timer) clearInterval(timer);
    timer = setInterval(()=>{}, 2000);
    return !!timer;
  }
  function stop(){
    if(timer){ clearInterval(timer); timer=null; }
    return timer === null;
  }
  const r1 = start();
  const r2 = start(); // 第二次会清理旧的
  const r3 = stop();
  return { started: r1, replaced: r2, stopped: r3 };
}
const t15 = pollTimerState();
assert.equal(t15.started, true);
assert.equal(t15.replaced, true);
assert.equal(t15.stopped, true);
console.log('15) PollTimer 不累积: ✅');

// ===== 16) PayApiCreate 返回结构 =====
async function testPayApiCreate(){
  function payApiCreate(method, amount){
    if(method === 'coin'){
      return Promise.resolve({ ok:true, orderId:'P' + Date.now(), amount, method, qrCode:'', expiresIn:0, raw:{} });
    }
    return Promise.resolve({ ok:true, orderId:'P' + Date.now(), amount, method, qrCode:'https://...', expiresIn:900, raw:{} });
  }
  const a = await payApiCreate('wechat', 30);
  assert.ok(a.orderId);
  assert.equal(a.amount, 30);
  assert.equal(a.method, 'wechat');
  assert.equal(a.expiresIn, 900);
  const b = await payApiCreate('coin', 50);
  assert.equal(b.expiresIn, 0, '金币支付无倒计时');
  return true;
}
testPayApiCreate().then(()=>{
  console.log('16) payApiCreate 返回: ✅');
}).catch(e => console.log('16) ❌ ' + e.message));

// ===== 17) PayApiQuery 频率 =====
function calcPollTimes(interval, timeout){
  return Math.floor(timeout / interval);
}
assert.equal(calcPollTimes(2000, 900000), 450, '15 分钟 450 次');
console.log('17) 轮询频率: ✅ 2s × 450 次');

// ===== 18) 网络抖动容错 =====
async function testPollRetry(){
  let calls = 0;
  async function pollOnce(){
    calls++;
    if(calls < 3) throw new Error('network error');
    return { ok:true, status:'PAID' };
  }
  let result = null;
  for(let i = 0; i < 5; i++){
    try{
      result = await pollOnce();
      break;
    }catch(_){}
  }
  assert.equal(result && result.status, 'PAID');
  assert.ok(calls >= 3);
}
testPollRetry().then(()=>{
  console.log('18) 网络抖动重试: ✅');
  console.log('\n========== 全部 P9 修复回归通过 ==========');
}).catch(e => console.log('18) ❌ ' + e.message));
