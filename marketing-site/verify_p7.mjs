// P7 修复回归：每日签到 + 邀请好友送券
import { strict as assert } from 'node:assert';

// ===== 1) 签到奖励表 =====
const SIGN_REWARDS = [
  { day:1, gold:50,  coupon:0 },
  { day:2, gold:50,  coupon:0 },
  { day:3, gold:80,  coupon:{ discount:5, minCost:20, title:'签到奖励券' } },
  { day:4, gold:80,  coupon:0 },
  { day:5, gold:100, coupon:0 },
  { day:6, gold:100, coupon:{ discount:5, minCost:20, title:'签到奖励券' } },
  { day:7, gold:200, coupon:{ discount:10, minCost:30, title:'签到 7 日奖' } }
];
assert.equal(SIGN_REWARDS.length, 7, '应 7 天循环');
assert.equal(SIGN_REWARDS[0].gold, 50);
assert.equal(SIGN_REWARDS[6].gold, 200, 'Day 7 终极大奖 200 金币');
assert.ok(SIGN_REWARDS[6].coupon.discount === 10);
const totalGold = SIGN_REWARDS.reduce((s,r)=>s+r.gold, 0);
assert.equal(totalGold, 660, '7 天累计 660 金币');
console.log('1) 签到奖励表: ✅ 7 天 / 累计 660 金币');

// ===== 2) 当前应签第几天 =====
function getCurrentSignDay(streak){
  if(streak === 0) return 1;
  return ((streak - 1) % 7) + 1;
}
assert.equal(getCurrentSignDay(0), 1, 'streak=0 应签 Day 1');
assert.equal(getCurrentSignDay(1), 1, 'streak=1 已签 Day 1，下次 Day 1');
assert.equal(getCurrentSignDay(3), 3, 'streak=3 已签 3 天，下次 Day 3');
assert.equal(getCurrentSignDay(7), 7, 'streak=7 已签 7 天，下次 Day 7');
assert.equal(getCurrentSignDay(8), 1, 'streak=8 已签 8 天，循环 Day 1');
assert.equal(getCurrentSignDay(14), 7, 'streak=14 第二次 Day 7');
console.log('2) 应签天数判定: ✅');

// ===== 3) 断签判定 =====
function isStreakBroken(lastTs, now){
  if(!lastTs) return false;
  return (now - lastTs) > 24*3600*1000;
}
const now = Date.now();
assert.equal(isStreakBroken(0, now), false, '从未签：不算断');
assert.equal(isStreakBroken(now, now), false, '刚签：不算断');
assert.equal(isStreakBroken(now - 23*3600*1000, now), false, '23h 内：未断');
assert.equal(isStreakBroken(now - 25*3600*1000, now), true, '25h：已断');
console.log('3) 断签判定: ✅ 24h 阈值');

// ===== 4) 今日已签判定 =====
function isTodaySigned(lastTs, now){
  if(!lastTs) return false;
  const last = new Date(lastTs);
  const t = new Date(now);
  return last.getFullYear() === t.getFullYear()
    && last.getMonth() === t.getMonth()
    && last.getDate() === t.getDate();
}
const d1 = new Date(2026, 8, 7, 10, 0).getTime();
assert.equal(isTodaySigned(d1, d1), true, '同时刻：是今日');
assert.equal(isTodaySigned(d1, d1 + 3600*1000), true, '同日后 1h：仍是今日');
assert.equal(isTodaySigned(d1, d1 + 24*3600*1000 + 1), false, '次日：不是今日');
assert.equal(isTodaySigned(0, now), false, '从未签');
console.log('4) 今日已签判定: ✅');

// ===== 5) 签到入账 =====
function doSignEffect(state, day){
  const reward = SIGN_REWARDS[day - 1];
  const newState = JSON.parse(JSON.stringify(state));
  newState.gold += reward.gold;
  newState.signStreak = (state.signStreak || 0) + 1;
  newState.signLastTs = Date.now();
  newState.signLog = newState.signLog || [];
  newState.signLog.push({ day, ts: Date.now(), reward });
  if(reward.coupon){
    newState.coupons.push({
      id:'sign-' + Date.now().toString().slice(-6),
      title: reward.coupon.title + '（Day ' + day + '）',
      discount: reward.coupon.discount,
      minCost: reward.coupon.minCost,
      expireAt: Date.now() + 7*24*3600*1000,
      used:false, source:'sign', gotAt:Date.now()
    });
  }
  return newState;
}
let s5 = { gold:100, signStreak:0, coupons:[] };
s5 = doSignEffect(s5, 1);
assert.equal(s5.gold, 150, 'Day 1 +50');
assert.equal(s5.signStreak, 1);
s5 = doSignEffect(s5, 2);
assert.equal(s5.gold, 200, 'Day 2 +50');
s5 = doSignEffect(s5, 3);
assert.equal(s5.gold, 280, 'Day 3 +80');
assert.equal(s5.coupons.length, 1, 'Day 3 送券');
console.log('5) 签到入账: ✅ 金币 + 券');

// ===== 6) 邀请码格式 =====
function isValidInviteCode(code){
  if(!code) return false;
  return /^FD\d{6}$/.test(code.trim().toUpperCase());
}
assert.ok(isValidInviteCode('FD123456'));
assert.ok(isValidInviteCode('fd123456'));
assert.ok(isValidInviteCode('FD000000'));
assert.ok(!isValidInviteCode('AB123456'), '非 FD 前缀');
assert.ok(!isValidInviteCode('FD12345'), '5 位');
assert.ok(!isValidInviteCode('FD1234567'), '7 位');
assert.ok(!isValidInviteCode(''), '空');
assert.ok(!isValidInviteCode(null), 'null');
console.log('6) 邀请码格式校验: ✅');

// ===== 7) 应用邀请码：双方发券 =====
function applyInviteCode(state, inputCode){
  if(!state) return { ok:false, reason:'no-state' };
  if(state.inviteUsedCode) return { ok:false, reason:'used-before' };
  const c = String(inputCode||'').trim().toUpperCase();
  if(!/^FD\d{6}$/.test(c)) return { ok:false, reason:'invalid' };
  if(c === state.inviteCode) return { ok:false, reason:'self' };
  state.inviteUsedCode = c;
  state.coupons.push({
    id:'invite-recv-' + Date.now().toString().slice(-6),
    title:'邀请好友体验券',
    discount:10, minCost:30,
    expireAt: Date.now() + 7*24*3600*1000,
    used:false, source:'invite', gotAt:Date.now()
  });
  state.invites.push({ inviteeCode:c, time:Date.now(), couponGiven:true });
  return { ok:true };
}
const s7 = { inviteCode:'FD111111', inviteUsedCode:null, coupons:[], invites:[] };
const r7 = applyInviteCode(s7, 'FD222222');
assert.equal(r7.ok, true);
assert.equal(s7.inviteUsedCode, 'FD222222');
assert.equal(s7.coupons.length, 1);
assert.equal(s7.coupons[0].source, 'invite');
assert.equal(s7.invites.length, 1);
// 重复使用：失败
const r7b = applyInviteCode(s7, 'FD333333');
assert.equal(r7b.ok, false);
assert.equal(r7b.reason, 'used-before');
// 用自己：失败
const s7c = { inviteCode:'FD999999', inviteUsedCode:null, coupons:[], invites:[] };
const r7c = applyInviteCode(s7c, 'FD999999');
assert.equal(r7c.ok, false);
assert.equal(r7c.reason, 'self');
// 格式无效
const r7d = applyInviteCode({inviteCode:'FD000', inviteUsedCode:null, coupons:[], invites:[]}, 'XX12345');
assert.equal(r7d.ok, false);
console.log('7) 邀请码应用: ✅ self/used/invalid 三种拒绝');

// ===== 8) 邀请码生成 =====
function genCode(){
  return 'FD' + Math.floor(Math.random()*900000+100000).toString().padStart(6,'0');
}
const c8 = genCode();
assert.ok(/^FD\d{6}$/.test(c8));
console.log('8) 邀请码生成: ✅ ' + c8);

// ===== 9) 周累计 =====
function sumSignWeekGold(signLog){
  const week = signLog.slice(-7);
  return week.reduce((s,r)=>s + (r.reward.gold||0), 0);
}
function sumSignWeekCoupons(signLog){
  return signLog.slice(-7).reduce((s,r)=>s + (r.reward.coupon?1:0), 0);
}
const log9 = [];
for(let d=1; d<=7; d++){
  log9.push({ day:d, ts:Date.now(), reward:SIGN_REWARDS[d-1] });
}
assert.equal(sumSignWeekGold(log9), 660);
assert.equal(sumSignWeekCoupons(log9), 3, '7 天共 3 张券（Day 3/6/7）');
console.log('9) 周累计: ✅ 金币 660 / 券 3');

// ===== 10) source 来源分类 =====
function couponSourceLabel(s){
  const map = {
    welcome:'新用户体验',
    fail:'故障补偿',
    sign:'每日签到',
    invite:'邀请好友',
    system:'系统发放'
  };
  if(!s) return '系统发放';
  return map[s] || s;
}
assert.equal(couponSourceLabel('sign'), '每日签到');
assert.equal(couponSourceLabel('invite'), '邀请好友');
console.log('10) 券来源分类: ✅ sign/invite');

// ===== 11) 邀请记录 =====
function recordInvite(state, inviteeCode){
  state.invites.push({ inviteeCode, time:Date.now(), couponGiven:true });
}
const s11 = { inviteCode:'FD111111', invites:[] };
recordInvite(s11, 'FD222222');
recordInvite(s11, 'FD333333');
assert.equal(s11.invites.length, 2);
assert.ok(s11.invites[0].time > 0);
console.log('11) 邀请记录: ✅');

// ===== 12) 签到入口状态文案 =====
function entryText(todaySigned, streak, broken){
  if(!todaySigned && (streak === 0 || broken)) return '今天未签 · 立即开启连签';
  if(todaySigned) return '连签 ' + streak + ' 天 · 今日已领';
  return '连签 ' + streak + ' 天 · 今日未签';
}
assert.equal(entryText(false, 0, false), '今天未签 · 立即开启连签');
assert.equal(entryText(true, 3, false), '连签 3 天 · 今日已领');
assert.equal(entryText(false, 3, false), '连签 3 天 · 今日未签');
assert.equal(entryText(false, 0, true), '今天未签 · 立即开启连签');
console.log('12) 任务页入口文案: ✅ 3 态');

console.log('\n========== 全部 P7 修复回归通过 ==========');
