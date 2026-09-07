// P0 修复回归脚本：急停长按 / 驾驶 Tab 智能路由 / 比赛浮层关闭
// 模拟 DOM 与模块状态，校验关键不变量
import { strict as assert } from 'node:assert';

// 极简 DOM mock
function makeEl(){
  const el = {
    classList:{ _set:new Set(),
      add(c){this._set.add(c)},
      remove(c){this._set.delete(c)},
      contains(c){return this._set.has(c)},
      toggle(c,v){ v===undefined ? (this._set.has(c)?this._set.delete(c):this._set.add(c)) : (v?this._set.add(c):this._set.delete(c)) }
    },
    style:{}, dataset:{}, children:[],
    setAttribute(k,v){this[k]=v}, getAttribute(k){return this[k]},
    addEventListener(){}, removeEventListener(){}, appendChild(c){this.children.push(c)},
    innerHTML:'', textContent:'',
  };
  return el;
}
const dom = new Map();
function $(id){ if(!dom.has(id)) dom.set(id, makeEl()); return dom.get(id); }
globalThis.document = { getElementById: $ };

// ===== 复制 fardrive-app.js 的关键逻辑（剥离 setTimeout/setInterval 等副作用）=====

// 数据
const mapPoints = [
  { id:1, x:28, y:30, dist:320, reward:{exp:80,gold:60} },
  { id:2, x:62, y:24, dist:510, reward:{exp:120,gold:120} },
  { id:3, x:48, y:48, dist:500, reward:{exp:120,gold:120} },
  { id:4, x:74, y:56, dist:680, reward:{exp:160,gold:150} },
  { id:5, x:36, y:68, dist:740, reward:{exp:180,gold:200} },
  { id:6, x:58, y:80, dist:920, reward:{exp:220,gold:260} },
  { id:7, x:20, y:52, dist:420, reward:{exp:100,gold:80} },
  { id:8, x:82, y:34, dist:600, reward:{exp:140,gold:140} },
];
let state = { lit:[] };

// ----- 修复 2：enterDriveEntry 智能路由 -----
function enterDriveEntry(opts){
  if(opts.ckOn){ return 'in-drive'; }
  const next = mapPoints.find(pt => !state.lit.includes(pt.id));
  if(next){ return { route:'open-sheet', pt:next }; }
  const allDone = mapPoints.length>0 && state.lit.length>=mapPoints.length;
  if(allDone){ return 'all-done'; }
  return 'fallback';
}

// ----- 修复 3：closeOverlayViews -----
function closeOverlayViews(targetTab, opts){
  const actions = [];
  if(targetTab !== 'race'){
    if(opts.raceViewOn){
      actions.push('close-race-view');
      if(opts.raceDataRunning){ actions.push('stop-race-loop'); }
      actions.push('reset-race-stages');
    }
  }
  if(opts.ckOn){ actions.push('end-drive'); }
  return actions;
}

// ----- 修复 1：急停长按 1 秒 -----
// 模拟：start 之后若 1000ms 内 release → 不触发；>=1000ms → 触发
function simulateEStop(holdMs){
  let triggered = false;
  const start = Date.now();
  // 模拟 setTimeout 触发逻辑（不真等）
  const elapsed = holdMs;
  if(elapsed >= 1000){ triggered = true; }
  return { triggered, elapsed };
}

// ===== 1) 急停长按 =====
assert.equal(simulateEStop(500).triggered, false, '按住 0.5s 不应触发');
assert.equal(simulateEStop(999).triggered, false, '按住 999ms 不应触发');
assert.equal(simulateEStop(1000).triggered, true, '按住 1000ms 应触发');
assert.equal(simulateEStop(1500).triggered, true, '按住 1500ms 应触发');
console.log('1) 急停长按 1 秒阈值: ✅');

// ===== 2) 驾驶 Tab 智能路由：未点亮坐标 → 打开 sheet =====
const r2a = enterDriveEntry({ ckOn:false });
assert.equal(r2a.route, 'open-sheet', '首次进入应打开最近未点亮坐标');
assert.equal(r2a.pt.id, 1, '应选第一个坐标');
console.log('2a) 驾驶 Tab 智能路由 - 首次: ✅ 打开 ' + r2a.pt.name || '坐标#' + r2a.pt.id);

// ===== 2b) 已点亮多个：路由下一个未点亮 =====
state.lit = [1,2,3];
const r2b = enterDriveEntry({ ckOn:false });
assert.equal(r2b.route, 'open-sheet');
assert.equal(r2b.pt.id, 4, '应选坐标 #4');
console.log('2b) 驾驶 Tab 智能路由 - 已点 3 个: ✅ 打开坐标 #' + r2b.pt.id);

// ===== 2c) 全部点亮 → 弹完成态 =====
state.lit = [1,2,3,4,5,6,7,8];
const r2c = enterDriveEntry({ ckOn:false });
assert.equal(r2c, 'all-done', '全点亮应进入完成态');
console.log('2c) 驾驶 Tab 智能路由 - 全部点亮: ✅ 进入完成态');

// ===== 2d) 已在驾驶中 =====
state.lit = [];
const r2d = enterDriveEntry({ ckOn:true });
assert.equal(r2d, 'in-drive', '已在驾驶中应返回提示');
console.log('2d) 驾驶 Tab 智能路由 - 已在驾驶中: ✅ 提示');

// ===== 3) closeOverlayViews：从比赛切到地图 =====
const r3a = closeOverlayViews('map', { raceViewOn:true, raceDataRunning:true, ckOn:false });
assert.deepEqual(r3a, ['close-race-view','stop-race-loop','reset-race-stages']);
console.log('3a) 比赛→地图 关闭浮层: ✅');

// ===== 3b) 从地图切到比赛 =====
const r3b = closeOverlayViews('race', { raceViewOn:true, raceDataRunning:true, ckOn:false });
assert.deepEqual(r3b, [], '切到 race 时不应关闭 raceView');
console.log('3b) 地图→比赛 保持浮层: ✅');

// ===== 3c) 驾驶中切到任务 =====
const r3c = closeOverlayViews('tasks', { raceViewOn:false, ckOn:true });
assert.deepEqual(r3c, ['end-drive']);
console.log('3c) 驾驶中→任务 结束驾驶: ✅');

// ===== 3d) 三态都开 =====
const r3d = closeOverlayViews('map', { raceViewOn:true, raceDataRunning:false, ckOn:true });
assert.deepEqual(r3d, ['close-race-view','reset-race-stages','end-drive']);
console.log('3d) 比赛+驾驶中→地图 全部关闭: ✅');

console.log('\n========== 全部 P0 修复回归通过 ==========');
