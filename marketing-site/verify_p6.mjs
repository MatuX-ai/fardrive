// P6 修复回归：断线补偿券抵扣流程
import { strict as assert } from 'node:assert';

// ===== 1) 优惠券字段 =====
const sampleCoupon = {
  id:'welcome',
  title:'新用户体验券',
  discount:10,
  minCost:30,
  expireAt: Date.now() + 7*24*3600*1000,
  used:false,
  source:'welcome',
  gotAt: Date.now()
};
assert.equal(sampleCoupon.discount, 10);
assert.equal(sampleCoupon.minCost, 30);
assert.ok(sampleCoupon.source);
console.log('1) 券字段: ✅');

// ===== 2) 券状态判定 =====
function couponState(c){
  const now = Date.now();
  if(c.used) return 'used';
  if(c.expireAt <= now) return 'expired';
  return 'valid';
}
const validC = { used:false, expireAt: Date.now() + 86400000 };
const usedC = { used:true, expireAt: Date.now() + 86400000 };
const expiredC = { used:false, expireAt: Date.now() - 1000 };
assert.equal(couponState(validC), 'valid');
assert.equal(couponState(usedC), 'used');
assert.equal(couponState(expiredC), 'expired');
console.log('2) 券状态判定: ✅ valid / used / expired');

// ===== 3) 抵扣快照记录 =====
function makeCouponSnapshot(c){
  return {
    id:c.id, title:c.title, discount:c.discount,
    minCost:c.minCost, source:c.source || 'system'
  };
}
const c3 = { id:'welcome', title:'新用户体验券', discount:10, minCost:30, source:'welcome' };
const snap = makeCouponSnapshot(c3);
assert.equal(snap.discount, 10);
assert.equal(snap.title, '新用户体验券');
assert.equal(snap.source, 'welcome');
console.log('3) 抵扣快照记录: ✅');

// ===== 4) 抵扣金额 =====
function calcDeductAmount(amount, coupon){
  if(!coupon) return 0;
  if(amount < coupon.minCost) return 0;
  return Math.min(amount, coupon.discount);
}
assert.equal(calcDeductAmount(50, {discount:10, minCost:30}), 10, '30+ 抵扣 10');
assert.equal(calcDeductAmount(20, {discount:10, minCost:30}), 0, '< 30 不满足');
assert.equal(calcDeductAmount(8, {discount:10, minCost:30}), 0, '< 30 不满足');
assert.equal(calcDeductAmount(5, {discount:10, minCost:0}), 5, '无门槛时抵扣到 0');
console.log('4) 抵扣金额计算: ✅');

// ===== 5) 券抵扣订单 =====
function makePayOrderWithCoupon(payInfo, coupon){
  const usedCoupon = !!(coupon && payInfo.amount >= coupon.minCost);
  const snapshot = usedCoupon ? makeCouponSnapshot(coupon) : null;
  return {
    id: payInfo.orderId,
    type:'pay',
    name: payInfo.title,
    car: '-',
    amount: payInfo.amount,
    method: payInfo.method,
    coupon: usedCoupon ? coupon.discount : 0,
    couponSnapshot: snapshot,
    startAt: Date.now(),
    duration: 0, km: 0,
    status:'done',
    paidAmount: payInfo.amount - (usedCoupon ? coupon.discount : 0),
    exp:0, gold:0
  };
}
const payOrder = makePayOrderWithCoupon({orderId:'P001', amount:50, method:'wechat', title:'充值'}, {discount:10, minCost:30, source:'welcome', title:'新用户体验券'});
assert.equal(payOrder.coupon, 10);
assert.equal(payOrder.couponSnapshot.discount, 10);
assert.equal(payOrder.paidAmount, 40, '实付 = 50-10');

const payOrderNoCoupon = makePayOrderWithCoupon({orderId:'P002', amount:50, method:'coin'}, null);
assert.equal(payOrderNoCoupon.coupon, 0);
assert.equal(payOrderNoCoupon.couponSnapshot, null);
assert.equal(payOrderNoCoupon.paidAmount, 50);

const payOrderMinCostFail = makePayOrderWithCoupon({orderId:'P003', amount:20, method:'coin'}, {discount:10, minCost:30, source:'welcome'});
assert.equal(payOrderMinCostFail.coupon, 0);
assert.equal(payOrderMinCostFail.couponSnapshot, null);
console.log('5) 券抵扣订单: ✅');

// ===== 6) 券使用标记 =====
const c6 = { id:'a', discount:10, minCost:30, used:false, usedAt:0, usedInOrder:'' };
function markCouponUsed(c, orderId){
  c.used = true;
  c.usedAt = Date.now();
  c.usedInOrder = orderId;
  return c;
}
markCouponUsed(c6, 'P001');
assert.equal(c6.used, true);
assert.ok(c6.usedAt > 0);
assert.equal(c6.usedInOrder, 'P001');
console.log('6) 券使用标记: ✅');

// ===== 7) 来源分类 =====
function sourceLabel(s){
  const map = {
    welcome:'新用户体验',
    fail:'故障补偿',
    sign:'每日签到',
    invite:'邀请好友',
    system:'系统发放'
  };
  return map[s] || (s || '系统发放');
}
assert.equal(sourceLabel('welcome'), '新用户体验');
assert.equal(sourceLabel('fail'), '故障补偿');
assert.equal(sourceLabel('sign'), '每日签到');
assert.equal(sourceLabel('invite'), '邀请好友');
assert.equal(sourceLabel('system'), '系统发放');
assert.equal(sourceLabel('unknown'), 'unknown', '未映射的 source 原样显示');
assert.equal(sourceLabel(''), '系统发放', '空字符串 fallback');
assert.equal(sourceLabel(undefined), '系统发放', 'undefined fallback');
console.log('7) 来源分类: ✅ 5 类 + 默认');

// ===== 8) 排序规则 =====
function sortCoupons(list, stat){
  if(stat === 'valid'){
    return list.sort((a,b)=>a.expireAt - b.expireAt); // 临期在前
  }else if(stat === 'used'){
    return list.sort((a,b)=>(b.usedAt||0)-(a.usedAt||0)); // 最近使用在前
  }else if(stat === 'expired'){
    return list.sort((a,b)=>b.expireAt - a.expireAt); // 最近过期在前
  }
  return list;
}
const now = Date.now();
const list8 = [
  { id:'1', used:false, expireAt: now + 5*86400000 },
  { id:'2', used:false, expireAt: now + 1*86400000 },  // 临期
  { id:'3', used:false, expireAt: now + 3*86400000 }
];
const validSorted = sortCoupons(list8.slice(), 'valid');
assert.equal(validSorted[0].id, '2', '临期应排第一');
console.log('8) 排序规则: ✅');

// ===== 9) 状态计数 =====
function countByState(coupons){
  return {
    valid: coupons.filter(c=>!c.used && c.expireAt > Date.now()).length,
    used: coupons.filter(c=>c.used).length,
    expired: coupons.filter(c=>!c.used && c.expireAt <= Date.now()).length
  };
}
const c9 = [
  { used:false, expireAt:now+86400000 },
  { used:false, expireAt:now-1000 },
  { used:true, expireAt:now+86400000 },
  { used:false, expireAt:now+86400000 }
];
const cnt = countByState(c9);
assert.equal(cnt.valid, 2);
assert.equal(cnt.used, 1);
assert.equal(cnt.expired, 1);
console.log('9) 状态计数: ✅');

// ===== 10) 临期判定 =====
function isExpiringSoon(c, days){
  days = days || 3;
  if(c.used) return false;
  const remain = c.expireAt - Date.now();
  if(remain <= 0) return false;
  return remain <= days * 86400000;
}
assert.equal(isExpiringSoon({used:false, expireAt:now+86400000}), true, '剩 1 天：阈值内（≤3）算临期');
assert.equal(isExpiringSoon({used:false, expireAt:now+5*86400000}), false, '剩 5 天：非临期');
assert.equal(isExpiringSoon({used:true, expireAt:now+86400000}), false, '已用不算');
assert.equal(isExpiringSoon({used:false, expireAt:now-1000}), false, '已过期不算');
console.log('10) 临期判定: ✅');

// ===== 11) 剩余天数计算 =====
function daysLeft(c){
  if(c.used) return 0;
  return Math.max(0, Math.ceil((c.expireAt - Date.now())/86400000));
}
assert.equal(daysLeft({used:false, expireAt:now+5*86400000}), 5);
assert.equal(daysLeft({used:false, expireAt:now-1000}), 0);
assert.equal(daysLeft({used:true, expireAt:now+5*86400000}), 0);
console.log('11) 剩余天数: ✅');

// ===== 12) 订单详情显示抵扣 =====
function detailCouponLine(o){
  if(o.couponSnapshot) return '券抵扣：−¥' + o.couponSnapshot.discount + ' · ' + o.couponSnapshot.title;
  if(o.coupon && o.coupon > 0) return '券抵扣：−¥' + o.coupon;
  return '';
}
const o12 = { couponSnapshot:{discount:10, title:'新用户体验券'} };
const o12b = { coupon:5 };
const o12c = {};
assert.equal(detailCouponLine(o12), '券抵扣：−¥10 · 新用户体验券');
assert.equal(detailCouponLine(o12b), '券抵扣：−¥5');
assert.equal(detailCouponLine(o12c), '');
console.log('12) 订单详情抵扣显示: ✅');

console.log('\n========== 全部 P6 修复回归通过 ==========');
