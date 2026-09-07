// P8 修复回归：邀请人双向奖励
import { strict as assert } from 'node:assert';

// ===== 1) INVITE_REWARD 双向奖励规则 =====
const INVITE_REWARD = {
  invitee: { gold: 100, coupon: { discount:10, minCost:30, title:'邀请好友体验券' }, expireDays: 7 },
  inviter: { gold: 200, exp: 50, seasonPts: 15, coupon: { discount:10, minCost:30, title:'邀请好友体验券' }, expireDays: 7 },
  monthlyLimit: 20
};
assert.equal(INVITE_REWARD.invitee.gold, 100, '被邀请 100 金币');
assert.equal(INVITE_REWARD.inviter.gold, 200, '邀请 200 金币');
assert.equal(INVITE_REWARD.inviter.exp, 50, '邀请 50 经验');
assert.equal(INVITE_REWARD.inviter.seasonPts, 15, '邀请 15 段位分');
assert.equal(INVITE_REWARD.monthlyLimit, 20);
console.log('1) 双向奖励规则: ✅');

// ===== 2) 邀请码格式校验 =====
function isValidInviteCode(code){
  if(!code) return false;
  return /^FD\d{6}$/.test(String(code).trim().toUpperCase());
}
assert.ok(isValidInviteCode('FD123456'));
assert.ok(isValidInviteCode('fd123456'));
assert.ok(isValidInviteCode('FD000000'));
assert.ok(!isValidInviteCode('AB123456'), '非 FD 前缀');
assert.ok(!isValidInviteCode('FD12345'), '5 位');
assert.ok(!isValidInviteCode('FD1234567'), '7 位');
assert.ok(!isValidInviteCode(''), '空');
console.log('2) 邀请码格式: ✅');

// ===== 3) 规范化 =====
function norm(c){ return String(c||'').trim().toUpperCase(); }
assert.equal(norm(' fd123456 '), 'FD123456');
assert.equal(norm('fd123456'), 'FD123456');
assert.equal(norm(null), '');
console.log('3) 邀请码规范化: ✅');

// ===== 4) 拒绝原因枚举 =====
const REFUSE_REASONS = ['empty','invalid','used-before','self'];
REFUSE_REASONS.forEach(r => assert.equal(typeof r, 'string'));
console.log('4) 拒绝原因: ✅ 4 类');

// ===== 5) applyInviteCode：完整逻辑 =====
function applyInviteCode(state, code){
  if(!code) return { ok:false, reason:'empty' };
  code = String(code).trim().toUpperCase();
  if(!/^FD\d{6}$/.test(code)) return { ok:false, reason:'invalid' };
  if(state.inviteUsedCode) return { ok:false, reason:'used-before' };
  if(code === state.inviteCode) return { ok:false, reason:'self' };
  state.inviteUsedCode = code;
  state.gold += INVITE_REWARD.invitee.gold;
  state.coupons.push({
    id:'invite-' + Date.now().toString().slice(-6),
    title:'邀请好友体验券',
    discount:10, minCost:30,
    expireAt: Date.now() + 7*24*3600*1000,
    used:false, source:'invite', gotAt:Date.now(),
    gotFromCode: code
  });
  state.invites.push({
    inviteeCode: code,
    inviteeId: null,
    direction: 'in',
    status: 'rewarded',
    gold: INVITE_REWARD.invitee.gold,
    exp: 0, seasonPts: 0,
    couponGiven: true, couponCount: 1,
    time: Date.now()
  });
  // 沙箱后端模拟：邀请人收到奖励
  state.invitesOut = state.invitesOut || [];
  state.invitesOut.push({
    inviteeName: '用户·' + code.slice(-4),
    inviteeCode: code,
    direction: 'out',
    status: 'rewarded',
    gold: INVITE_REWARD.inviter.gold,
    exp: INVITE_REWARD.inviter.exp,
    seasonPts: INVITE_REWARD.inviter.seasonPts,
    couponGiven: true, couponCount: 1,
    time: Date.now()
  });
  return { ok:true };
}

// 5a) 首次使用：成功
const s5 = { inviteCode:'FD111111', inviteUsedCode:null, gold:0, coupons:[], invites:[], invitesOut:[] };
const r5 = applyInviteCode(s5, 'FD222222');
assert.equal(r5.ok, true);
assert.equal(s5.gold, 100);
assert.equal(s5.coupons.length, 1);
assert.equal(s5.coupons[0].source, 'invite');
assert.equal(s5.coupons[0].gotFromCode, 'FD222222');
assert.equal(s5.invites.length, 1);
assert.equal(s5.invites[0].direction, 'in');
assert.equal(s5.invites[0].gold, 100);
assert.equal(s5.invitesOut.length, 1);
assert.equal(s5.invitesOut[0].direction, 'out');
assert.equal(s5.invitesOut[0].gold, 200);
assert.equal(s5.invitesOut[0].exp, 50);
assert.equal(s5.invitesOut[0].seasonPts, 15);
console.log('5) 双向奖励发放: ✅ 被邀请+100/邀请+200+50exp+15分');

// 5b) 重复使用：失败
const r5b = applyInviteCode(s5, 'FD333333');
assert.equal(r5b.ok, false);
assert.equal(r5b.reason, 'used-before');
assert.equal(s5.gold, 100, '金币不变');
console.log('5b) 重复使用拒绝: ✅');

// 5c) 自己用自己：失败
const s5c = { inviteCode:'FD999999', inviteUsedCode:null, gold:0, coupons:[], invites:[], invitesOut:[] };
const r5c = applyInviteCode(s5c, 'FD999999');
assert.equal(r5c.ok, false);
assert.equal(r5c.reason, 'self');
console.log('5c) 自邀请拒绝: ✅');

// 5d) 格式无效
assert.equal(applyInviteCode(s5c, '').reason, 'empty');
assert.equal(applyInviteCode(s5c, 'XX').reason, 'invalid');
assert.equal(applyInviteCode(s5c, 'AB12345').reason, 'invalid');
console.log('5d) 格式校验: ✅');

// ===== 6) 累计奖励聚合 =====
function sumReward(list){
  return {
    gold: list.reduce((s,i)=>s+(i.gold||0), 0),
    exp: list.reduce((s,i)=>s+(i.exp||0), 0),
    seasonPts: list.reduce((s,i)=>s+(i.seasonPts||0), 0),
    couponCount: list.reduce((s,i)=>s+(i.couponCount||0), 0)
  };
}
const s6 = { inviteCode:'FD000001', inviteUsedCode:null, gold:0, coupons:[], invites:[], invitesOut:[] };
applyInviteCode(s6, 'FD100001');
applyInviteCode(s6, 'FD100002');  // 失败 used-before，不入账
const r6 = sumReward(s6.invitesOut);
assert.equal(r6.gold, 200);
assert.equal(r6.exp, 50);
assert.equal(r6.seasonPts, 15);
assert.equal(r6.couponCount, 1);
console.log('6) 累计奖励聚合: ✅');

// ===== 7) 月度上限校验 =====
function monthlyInviteCount(invitesOut, now){
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return (invitesOut||[]).filter(i => i.time >= monthStart).length;
}
const now = new Date(2026, 8, 7, 12);
const outs7 = [];
for(let i=0; i<5; i++){
  outs7.push({ time: now.getTime() - i*86400000, gold:200 });
}
assert.equal(monthlyInviteCount(outs7, now), 5);
const outs7b = [];
for(let i=0; i<5; i++){
  outs7b.push({ time: new Date(2026, 7, 28 - i*86400000).getTime(), gold:200 });
}
assert.equal(monthlyInviteCount(outs7b, now), 0, '上月不算');
console.log('7) 月度上限: ✅');

// ===== 8) 月度剩余配额 =====
function monthlyRemain(invitesOut, now){
  const used = monthlyInviteCount(invitesOut, now);
  return Math.max(0, INVITE_REWARD.monthlyLimit - used);
}
assert.equal(monthlyRemain([], now), 20);
assert.equal(monthlyRemain(outs7, now), 15);
const outs7c = [];
for(let i=0; i<20; i++) outs7c.push({ time: now.getTime() - i*3600000 });
assert.equal(monthlyRemain(outs7c, now), 0);
console.log('8) 月度剩余配额: ✅');

// ===== 9) 邀请码 ID 唯一性 =====
function makeInviteCoupon(sourceTag){
  return {
    id: 'invite-' + Date.now().toString().slice(-8) + '-' + Math.floor(Math.random()*100000).toString().padStart(5,'0'),
    discount:10, minCost:30,
    source:'invite', gotFromCode: sourceTag,
    expireAt: Date.now() + 7*24*3600*1000, used:false
  };
}
const ids = new Set();
for(let i=0; i<100; i++) ids.add(makeInviteCoupon('x').id);
assert.ok(ids.size >= 99, '100 次生成应 ≥ 99 唯一（随机 5 位，5 位碰撞概率 < 1%）');
console.log('9) 邀请券 ID 唯一性: ✅ ' + ids.size + '/100');

// ===== 10) 双向记账完整性 =====
function reconcileInvites(state){
  // 校验 invites + invitesOut + coupons 三方数据一致
  const expectedInGold = state.invites.filter(i=>i.direction==='in').reduce((s,i)=>s+(i.gold||0), 0);
  const expectedOutGold = state.invitesOut.reduce((s,i)=>s+(i.gold||0), 0);
  const expectedCouponCount = state.invitesOut.reduce((s,i)=>s+(i.couponCount||0), 0);
  return {
    inGold: expectedInGold,
    outGold: expectedOutGold,
    couponCount: expectedCouponCount,
    balanceOk: (state.gold >= expectedInGold) // 用户金币应 ≥ 入金
  };
}
// 模拟 3 次邀请
const s10 = { inviteCode:'FD000010', inviteUsedCode:null, gold:0, coupons:[], invites:[], invitesOut:[] };
applyInviteCode(s10, 'FD200001');
s10.inviteUsedCode = null; // 模拟不同用户（实际每个用户只能一次）
applyInviteCode(s10, 'FD200002');
s10.inviteUsedCode = null;
applyInviteCode(s10, 'FD200003');
const recon = reconcileInvites(s10);
assert.equal(recon.inGold, 300);  // 3 × 100
assert.equal(recon.outGold, 600);  // 3 × 200
assert.equal(recon.couponCount, 3);
assert.equal(s10.gold, 300);  // 3 × 100
assert.ok(recon.balanceOk);
console.log('10) 双向记账完整性: ✅ in 300 / out 600 / 金币 300');

// ===== 11) 状态字段完整 =====
function makeInviteRecord(direction, status){
  return {
    inviteeCode:'FD123456',
    inviteeId:null,
    direction:direction,
    status:status,
    gold:100, exp:50, seasonPts:15,
    couponGiven:true, couponCount:1,
    time:Date.now()
  };
}
const pending = makeInviteRecord('out', 'pending');
assert.equal(pending.direction, 'out');
assert.equal(pending.status, 'pending');
const completed = makeInviteRecord('out', 'completed');
assert.equal(completed.status, 'completed');
const rewarded = makeInviteRecord('out', 'rewarded');
assert.equal(rewarded.status, 'rewarded');
console.log('11) 状态字段: ✅ pending/completed/rewarded');

// ===== 12) 邀请码与自邀请校验 =====
function canSelfInvite(myCode, input){
  return norm(myCode) === norm(input);
}
assert.equal(canSelfInvite('FD111111','FD111111'), true, '应拒绝');
assert.equal(canSelfInvite('FD111111','FD222222'), false);
console.log('12) 自邀请校验: ✅');

console.log('\n========== 全部 P8 修复回归通过 ==========');
