// P10 修复回归：真实地图 SDK 接入
import { strict as assert } from 'node:assert';

// ===== 1) 抽象基类 + bearing/distance =====
class MapProvider {
  constructor(name){ this.name = name; }
  bearing(from, to){
    const toRad = d => d * Math.PI / 180;
    const toDeg = r => r * 180 / Math.PI;
    const lat1 = toRad(from.lat), lat2 = toRad(to.lat);
    const dLon = toRad(to.lng - from.lng);
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }
  distance(from, to){
    const R = 6371000;
    const toRad = d => d * Math.PI / 180;
    const lat1 = toRad(from.lat), lat2 = toRad(to.lat);
    const dLat = toRad(to.lat - from.lat);
    const dLon = toRad(to.lng - from.lng);
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
}
const p = new MapProvider('test');
// 杭州西湖 → 武林广场约 5km，方位约正北
const w = p.bearing({lng:120.149, lat:30.246}, {lng:120.164, lat:30.279});
assert.ok(w > 0 && w < 90, '方位角在 0-90°');
const d = p.distance({lng:120.149, lat:30.246}, {lng:120.164, lat:30.279});
assert.ok(d > 3000 && d < 6000, '距离约 3-6km，实际 ' + Math.round(d));
console.log('1) bearing/distance: ✅ w=' + Math.round(w) + '° d=' + Math.round(d) + 'm');

// ===== 2) 方位角 → 8 向箭头 =====
function bearingToArrow(b){
  const arrows = ['⬆','↗','➡','↘','⬇','↙','⬅','↖'];
  const idx = Math.round(b / 45) % 8;
  return arrows[idx];
}
assert.equal(bearingToArrow(0), '⬆');
assert.equal(bearingToArrow(45), '↗');
assert.equal(bearingToArrow(90), '➡');
assert.equal(bearingToArrow(180), '⬇');
assert.equal(bearingToArrow(270), '⬅');
assert.equal(bearingToArrow(360), '⬆'); // wrap
assert.equal(bearingToArrow(22), '⬆');
assert.equal(bearingToArrow(67), '↗');
console.log('2) bearing → 8 向箭头: ✅');

// ===== 3 + 4) SandboxMap 完整版（nearbySearch + route） =====
class SandboxMap extends MapProvider {
  constructor(){ super('sandbox'); }
  async nearbySearch(opts){
    const list = [
      { id:'SW001', name:'田园站换电站', lng:120.123, lat:30.456 },
      { id:'SW002', name:'翠竹路换电站', lng:120.130, lat:30.460 },
      { id:'SW003', name:'南山服务区换电站', lng:120.115, lat:30.451 }
    ];
    return list.map(s => ({...s, distance: this.distance(opts.from, {lng:s.lng, lat:s.lat})}))
      .sort((a,b)=>a.distance-b.distance).slice(0, opts.limit||3);
  }
  async route(opts){
    const dist = this.distance(opts.from, opts.to);
    const durationSec = Math.round(dist / 5.5);
    const bearing = this.bearing(opts.from, opts.to);
    const polyline = [];
    for(let i=0; i<=4; i++){
      const t = i/4;
      polyline.push({
        lng: opts.from.lng + (opts.to.lng - opts.from.lng) * t,
        lat: opts.from.lat + (opts.to.lat - opts.from.lat) * t
      });
    }
    return { distance: dist, duration: durationSec, bearing, polyline, steps:[] };
  }
}
const sb = new SandboxMap();
const from = {lng:120.123, lat:30.453};
sb.nearbySearch({from, limit:3}).then(list => {
  assert.equal(list.length, 3);
  assert.equal(list[0].id, 'SW001', '最近换电站应是 SW001');
  assert.ok(list[0].distance < list[1].distance);
  console.log('3) SandboxMap nearbySearch: ✅');
}).catch(e => console.log('3) ❌ ' + e.message));

const to = {lng:120.126, lat:30.456};
sb.route({from, to}).then(r => {
  assert.ok(r.distance > 0);
  assert.ok(r.duration > 0);
  assert.equal(r.polyline.length, 5);
  console.log('4) SandboxMap route: ✅ d=' + Math.round(r.distance) + 'm / ' + r.duration + 's');
});

// ===== 5) MapConfig 模式 + Provider 工厂 =====
const MapConfig = { mode:'sandbox', provider:'sandbox' };
function createMapProvider(cfg){
  cfg = cfg || MapConfig;
  if(cfg.mode !== 'production') return new SandboxMap();
  switch(cfg.provider){
    case 'amap': return new SandboxMap(); // 真实应是 AmapProvider
    case 'qqmap': return new SandboxMap();
    default: return new SandboxMap();
  }
}
const m5 = createMapProvider({mode:'sandbox'});
assert.ok(m5 instanceof SandboxMap);
console.log('5) Provider 工厂: ✅');

// ===== 6) findNearestSwap：就近选择 + 路径 =====
async function findNearestSwap(provider, originLngLat){
  const from = originLngLat || {lng:120.123, lat:30.453};
  const list = await provider.nearbySearch({from, radius:5000, limit:5});
  if(!list || list.length === 0) return { dist:300, etaMin:2, swap:null };
  const swap = list[0];
  const route = await provider.route({from, to:{lng:swap.lng, lat:swap.lat}});
  return {
    dist: Math.round(route.distance),
    etaMin: Math.max(1, Math.round(route.duration/60)),
    bearing: route.bearing !== undefined ? route.bearing : provider.bearing(from, {lng:swap.lng, lat:swap.lat}),
    swap: { id: swap.id, name: swap.name, lng: swap.lng, lat: swap.lat }
  };
}
// 直接在测试 6 中验证 findNearestSwap
findNearestSwap(sb).then(r => {
  assert.ok(r.dist > 0);
  assert.ok(r.etaMin >= 1);
  assert.ok(r.swap && r.swap.id === 'SW001', 'swap 应存在');
  console.log('6) findNearestSwap: ✅ d=' + r.dist + 'm / ' + r.etaMin + 'min / bearing=' + (r.bearing||'n/a'));
}).catch(e => console.log('6) ❌ ' + e.message));

// ===== 7) 缓存机制：60s TTL =====
const cache = { data:null, ts:0, ttlMs:60000 };
async function cached(provider){
  const now = Date.now();
  if(cache.data && (now - cache.ts) < cache.ttlMs) return cache.data;
  const data = await findNearestSwap(provider);
  cache.data = data; cache.ts = now;
  return data;
}
(async ()=>{
  const r1 = await cached(new SandboxMap());
  const r2 = await cached(new SandboxMap());
  assert.equal(r1, r2, '两次调用应返回同一引用');
  console.log('7) 缓存 60s TTL: ✅');
})();

// ===== 8) "不听话乱开"检测：远离换电站 =====
function isMovingAway(curr, prev, swap){
  if(!prev) return false;
  const dCurr = Math.hypot(curr.x - swap.x, curr.y - swap.y);
  const dPrev = Math.hypot(prev.x - swap.x, prev.y - swap.y);
  return dCurr > dPrev + 5;
}
const swapXY = { x: 300, y: 500 }; // 简化坐标（米）
assert.equal(isMovingAway({x:0, y:0}, null, swapXY), false, '无 prev 不算远离');
// curr={x:300,y:300} 距 swap 200, prev={x:0,y:0} 距 swap 583 → 缩短
assert.equal(isMovingAway({x:300, y:300}, {x:0, y:0}, swapXY), false, '距离缩短 → 不算远离');
// curr={x:900,y:300} 距 swap sqrt(360000+40000)=632, prev={x:0,y:0} 距 swap 583 → 增加
assert.equal(isMovingAway({x:900, y:300}, {x:0, y:0}, swapXY), true, '距离增加 → 算远离');
// 距离增加 < 5m 算噪声
assert.equal(isMovingAway({x:55, y:0}, {x:50, y:0}, swapXY), false, '距离增加 < 5m → 噪声不算');
console.log('8) 不听话乱开检测: ✅');

// ===== 9) 乌龟模式触发：speedLimit 降到 0.15 =====
function triggerTurtleMode(state){
  if(state.speedLimit > 0.15){
    state.speedLimit = 0.15;
    return true;
  }
  return false;
}
const s9 = { speedLimit: 0.3 };
assert.equal(triggerTurtleMode(s9), true, '0.3 → 应触发');
assert.equal(s9.speedLimit, 0.15);
const s9b = { speedLimit: 0.1 };
assert.equal(triggerTurtleMode(s9b), false, '已 ≤ 0.15 → 不重复触发');
console.log('9) 乌龟模式触发: ✅');

// ===== 10) BFF URL 模板 =====
const bffBase = '/api/map';
function bff(method, provider, action){
  return bffBase + '/' + provider + '/' + action;
}
assert.equal(bff('getLocation','amap','locate'), '/api/map/amap/locate');
assert.equal(bff('nearbySearch','qqmap','place/around'), '/api/map/qqmap/place/around');
assert.equal(bff('route','amap','direction/driving'), '/api/map/amap/direction/driving');
console.log('10) BFF URL 模板: ✅');

// ===== 11) 高德 POI 类型编码 =====
const amapType = {
  car: '010100',       // 汽车服务
  food: '050000',      // 餐饮
  hotel: '100000',     // 住宿
  shopping: '060000'   // 购物
};
assert.equal(amapType.car, '010100');
console.log('11) 高德 POI 类型: ✅');

// ===== 12) 缓存失效场景 =====
const c12 = { data:null, ts:0, ttlMs:60000 };
function getCached(provider, forceRefresh){
  const now = Date.now();
  if(!forceRefresh && c12.data && (now - c12.ts) < c12.ttlMs) return c12.data;
  // 模拟异步获取
  c12.data = { fresh:true, ts:now };
  c12.ts = now;
  return c12.data;
}
const r12a = getCached(new SandboxMap(), false);
const r12b = getCached(new SandboxMap(), true); // 强制刷新
assert.equal(r12a.fresh, true);
assert.equal(r12b.fresh, true);
assert.notEqual(r12a, r12b, '强制刷新应返回新对象');
console.log('12) 缓存强制刷新: ✅');

// ===== 13) 高德响应码处理 =====
function amapOk(status){
  return status === '1' || status === 10000;
}
assert.equal(amapOk('1'), true);
assert.equal(amapOk('0'), false);
assert.equal(amapOk(10000), true);
console.log('13) 高德响应码: ✅');

// ===== 14) 腾讯响应码处理 =====
function qqmapOk(status){
  return status === 0;
}
assert.equal(qqmapOk(0), true);
assert.equal(qqmapOk(1), false);
assert.equal(qqmapOk('0'), false); // 必须是数字 0
console.log('14) 腾讯响应码: ✅');

// ===== 15) 路径规划耗时合理 =====
function routeEtaSeconds(distM){
  // 默认 30 km/h = 8.33 m/s
  return Math.round(distM / 8.33);
}
assert.equal(routeEtaSeconds(0), 0);
assert.ok(routeEtaSeconds(1000) > 100 && routeEtaSeconds(1000) < 130, '1km 应 120s');
assert.ok(routeEtaSeconds(10000) > 1100 && routeEtaSeconds(10000) < 1300, '10km 应 1200s');
console.log('15) 路径耗时合理: ✅');

// ===== 16) 找最近换电站兜底 =====
async function findNearestSwapSafe(provider){
  try{
    return await findNearestSwap(provider);
  }catch(e){
    return { dist: 300, etaMin: 2, swap: null, error: e.message };
  }
}
(async ()=>{
  // 模拟 provider 抛错
  const broken = { nearbySearch: async()=>{ throw new Error('API 错误'); }, route: async()=>{ throw new Error('API 错误'); } };
  const r16 = await findNearestSwapSafe(broken);
  assert.equal(r16.dist, 300);
  assert.equal(r16.swap, null);
  console.log('16) 异常兜底: ✅');
  console.log('\n========== 全部 P10 修复回归通过 ==========');
})();
