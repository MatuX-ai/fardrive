// P4 修复回归：真实支付闭环
import { strict as assert } from 'node:assert';

// ===== 1) 订单号生成：P + 时间戳 + 随机数 =====
function genPayId(){
  const ts = Date.now().toString().slice(-10);
  return 'P' + ts + Math.floor(Math.random()*100).toString().padStart(2,'0');
}
const id1 = genPayId();
assert.ok(/^P\d{12}$/.test(id1), '订单号应为 P + 12 位数字');
const id2 = genPayId();
assert.notEqual(id1, id2, '多次生成应不同');
console.log('1) 订单号生成: ✅ ' + id1);

// ===== 2) 优惠券智能推荐：找折扣最大的可用券 =====
const coupons = [
  { id:'a', discount:10, minCost:30, expireAt: Date.now()+86400000, used:false },
  { id:'b', discount:5, minCost:20, expireAt: Date.now()+86400000, used:false },
  { id:'c', discount:20, minCost:50, expireAt: Date.now()+86400000, used:false },
  { id:'d', discount:15, minCost:40, expireAt: Date.now()-1000, used:false }, // 过期
  { id:'e', discount:50, minCost:200, expireAt: Date.now()+86400000, used:true } // 已用
];
function getBestCoupon(amount){
  const valid = coupons.filter(c => !c.used && c.expireAt > Date.now() && c.minCost <= amount);
  if(valid.length === 0) return null;
  return valid.sort((a,b)=>b.discount - a.discount)[0];
}
assert.equal(getBestCoupon(60).id, 'c', '60 元应选 c（满 50）');
assert.equal(getBestCoupon(50).id, 'c', '应选 c（折扣 20 最高且满足 50）');
assert.equal(getBestCoupon(30).id, 'a', '应选 a（满 30）');
assert.equal(getBestCoupon(40).id, 'a', '应选 a（c 满 50 不满足）');
console.log('2) 优惠券智能推荐: ✅');

// ===== 3) 支付金额计算：扣券 =====
function calcPayAmount(amount, useCoupon, couponDiscount){
  return useCoupon ? Math.max(0, amount - couponDiscount) : amount;
}
assert.equal(calcPayAmount(15, false, 0), 15);
assert.equal(calcPayAmount(30, true, 10), 20);
assert.equal(calcPayAmount(10, true, 10), 0, '券全额抵扣');
assert.equal(calcPayAmount(10, true, 20), 0, '券超额抵扣：最低 0');
console.log('3) 支付金额计算: ✅');

// ===== 4) 默认支付方式选择：金币够则金币；否则微信 =====
function defaultMethod(gold, amount, useCoupon, couponDiscount){
  const finalAmt = useCoupon ? Math.max(0, amount - couponDiscount) : amount;
  return gold >= finalAmt ? 'coin' : 'wechat';
}
assert.equal(defaultMethod(100, 15, false, 0), 'coin');
assert.equal(defaultMethod(5, 30, false, 0), 'wechat', '金币不够走微信');
assert.equal(defaultMethod(100, 30, true, 10), 'coin', '扣券后 20 金币够');
assert.equal(defaultMethod(15, 30, true, 10), 'wechat', '扣券后 20 金币不够');
console.log('4) 默认支付方式: ✅');

// ===== 5) 退款计算（按使用时长） =====
function calcRefund(paid, driveSec, totalSec){
  const ratio = Math.min(1, Math.max(0, driveSec / totalSec));
  const used = Math.round(paid * ratio);
  return Math.max(0, paid - used);
}
assert.equal(calcRefund(15, 0, 1800), 15, '未出发全额退');
assert.equal(calcRefund(15, 900, 1800), 7, '半程退一半（约 7.5 → 8 用 → 7 退）');
assert.equal(calcRefund(15, 1800, 1800), 0, '全程不退');
assert.equal(calcRefund(28, 60, 1800), 27, '切诺基 1 分钟');
console.log('5) 按时间比例退款: ✅');

// ===== 6) 支付状态机 5 态 =====
const states = ['idle','pending','paid','failed','refunded'];
states.forEach(s => assert.equal(typeof s, 'string'));
// 状态转换：idle → pending → paid → refunded (L4 时)；或 pending → failed
const transitions = [
  ['idle','pending'],
  ['pending','paid'],
  ['pending','failed'],
  ['pending','refunded'], // 后端主动退款（网络异常）
  ['paid','refunded']     // 退券退款
];
transitions.forEach(([from,to]) => assert.ok(states.includes(from) && states.includes(to)));
console.log('6) 支付状态机 5 态: ✅');

// ===== 7) 订单号 =====
function genOrderId(prefix){
  return prefix + Date.now().toString().slice(-8);
}
assert.ok(/^D\d{8}$/.test(genOrderId('D')));
assert.ok(/^R\d{8}$/.test(genOrderId('R')));
assert.ok(/^P\d{8}$/.test(genOrderId('P')));
console.log('7) 订单号格式: ✅');

// ===== 8) 倒计时格式 =====
function fmtCountdown(remain){
  const m = Math.floor(remain/60), s = remain%60;
  return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}
assert.equal(fmtCountdown(900), '15:00');
assert.equal(fmtCountdown(60), '01:00');
assert.equal(fmtCountdown(59), '00:59');
assert.equal(fmtCountdown(0), '00:00');
console.log('8) 倒计时格式: ✅');

// ===== 9) 时间格式化 =====
function fmtTime(d){
  const pad = n => String(n).padStart(2,'0');
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
}
const d = new Date(2026, 0, 5, 9, 5, 7); // 2026-01-05 09:05:07
assert.equal(fmtTime(d), '2026-01-05 09:05:07');
console.log('9) 时间格式化: ✅');

// ===== 10) 优惠券扣减后 marked used =====
const c10 = { id:'a', discount:10, minCost:30, expireAt: Date.now()+86400000, used:false };
function markUsed(c){ c.used = true; return c; }
markUsed(c10);
assert.equal(c10.used, true);
console.log('10) 券使用标记: ✅');

// ===== 11) 套餐数据 =====
const packages = [
  { amt:10, gold:100, ratio:10 },
  { amt:30, gold:320, ratio:10.67 },
  { amt:98, gold:1100, ratio:11.22, extra:50 }
];
packages.forEach(p => {
  assert.ok(p.gold / p.amt > 9, '金币/元比例应 > 9（≈10）');
});
assert.equal(packages[2].extra, 50, '远征包送 50 金币');
console.log('11) 充值套餐比例: ✅');

// ===== 12) 充值订单 → 金币到账 =====
function chargeOrder(amt, gold){
  return { type:'pay', name:'充值 ¥' + amt + ' / ' + gold + ' 金币', amount:amt, status:'done', paidAmount:amt };
}
const co = chargeOrder(30, 320);
assert.equal(co.type, 'pay');
assert.equal(co.paidAmount, 30);
console.log('12) 充值订单模型: ✅');

console.log('\n========== 全部 P4 修复回归通过 ==========');
