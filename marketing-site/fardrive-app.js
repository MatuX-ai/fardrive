(function(){
  'use strict';

  // ===================== 数据模型 =====================
  const cars = [
    { id:'212', name:'北京吉普 212 型', tag:'入门 · 扎实耐造', cost:15, speed:60, acc:50, grip:70, lockLv:1, img:'https://aka.doubaocdn.com/s/jwOMQvUr9b' },
    { id:'cherokee', name:'切诺基型', tag:'中档 · 从容四驱', cost:28, speed:70, acc:62, grip:76, lockLv:1, img:'https://aka.doubaocdn.com/s/ZrrRkURHCO', hot:true },
    { id:'monster', name:'高性能大脚车', tag:'高性能 · 姿态拉满', cost:45, speed:88, acc:75, grip:65, lockLv:6, img:'https://aka.doubaocdn.com/s/uMSayI1QSR' },
    { id:'crawler', name:'岩石攀爬车', tag:'攀爬专精 · 陡坡克星', cost:35, speed:55, acc:48, grip:92, lockLv:4, img:'https://aka.doubaocdn.com/s/t38XfTuQrh' },
    { id:'kart', name:'沙漠卡丁车', tag:'竞速型 · 高速漂移', cost:40, speed:92, acc:85, grip:58, lockLv:8, img:'https://aka.doubaocdn.com/s/LyAhaA8Nss' },
    { id:'beast', name:'越野怪兽', tag:'顶级 · 全地形王者', cost:65, speed:95, acc:80, grip:80, lockLv:12, img:'https://aka.doubaocdn.com/s/0nsKUEzj8x' }
  ];

  const mapPoints = [
    { id:1, x:28, y:30, dist:320, reward:{exp:80,gold:60}, time:60, name:'坐标 #1 · 林中小径' },
    { id:2, x:62, y:24, dist:510, reward:{exp:120,gold:120}, time:90, name:'坐标 #2 · 河边石滩' },
    { id:3, x:48, y:48, dist:500, reward:{exp:120,gold:120}, time:90, name:'坐标 #3 · 林间空地' },
    { id:4, x:74, y:56, dist:680, reward:{exp:160,gold:150}, time:120, name:'坐标 #4 · 高坡瞭望' },
    { id:5, x:36, y:68, dist:740, reward:{exp:180,gold:200}, time:140, name:'坐标 #5 · 黑暗深处' },
    { id:6, x:58, y:80, dist:920, reward:{exp:220,gold:260}, time:170, name:'坐标 #6 · 终极地标' },
    { id:7, x:20, y:52, dist:420, reward:{exp:100,gold:80}, time:75, name:'坐标 #7 · 废弃木桥' },
    { id:8, x:82, y:34, dist:600, reward:{exp:140,gold:140}, time:110, name:'坐标 #8 · 风车灯塔' }
  ];

  const tasks = [
    { id:'t1', label:'今日首驾 3 分钟', req:180, type:'drive', rewards:{exp:80,gold:60}, claimed:false },
    { id:'t2', label:'点亮 2 个坐标', req:2, type:'light', rewards:{exp:120,gold:80}, claimed:false },
    { id:'t3', label:'完成 1 场双人赛', req:1, type:'race', rewards:{exp:200,gold:150}, claimed:false }
  ];

  const achs = [
    { id:'a1', name:'初入荒野', sub:'首次点亮坐标' },
    { id:'a2', name:'夜行者', sub:'累计驾驶 3 分钟' },
    { id:'a3', name:'点亮者', sub:'点亮 5 个坐标' },
    { id:'a4', name:'连胜新星', sub:'双人赛 3 连胜' },
    { id:'a5', name:'收藏家', sub:'集齐 5 枚车贴碎片' },
    { id:'a6', name:'荒野领主', sub:'达到 Lv.10' }
  ];

  // ===================== 玩家状态 =====================
  let state = {
    lv:1, exp:0, expNext:100, gold:320,
    streak:1, name:'探索者', title:'远驱新秀',
    lit:[], totalKm:0, fragments:0, driveSec:0,
    wins:0, seasonPts:1240, raceStreak:0,
    selectedCar:'212',
    orders:[],     // 订单历史 [{id,type,subtype,name,car,amount,reward,status,startAt,duration,km}]
    coupons:[],    // 优惠券 [{id,title,discount,expireAt,used}]
    inviteCode:'', // 邀请码
    inviteUsedCode:null, // 注册时使用的邀请码（一次性）
    invites:[],    // 邀请记录 [{inviteeName, time, couponGiven}]
    signLog:[],    // 签到记录 [{day, ts, reward:{gold,coupon,exp}}]
    signStreak:0,  // 当前连签天数
    signLastTs:0,  // 最近一次签到时间戳（用于判断是否断签）
    settings:{ leftHand:false, vibration:true, hd:true, sound:true }
  };

  const titles = {1:'远驱新秀',3:'荒野学徒',6:'远征猎人',10:'荒野领主',15:'远驱传奇'};
  function titleFor(lv){ const keys=Object.keys(titles).map(Number).sort((a,b)=>a-b); return titles[keys.filter(k=>lv>=k).pop()]; }

  // 本地存储
  function save(){ localStorage.setItem('fardrive-state', JSON.stringify(state)); }
  function load(){
    try{
      const s = JSON.parse(localStorage.getItem('fardrive-state'));
      if (s) state = Object.assign(state, s);
      // 防止任务状态全部完成无法复玩
      if (tasks.every(t=>t.done)) tasks.forEach(t=>{t.done=false;t.claim=false});
    }catch(e){}
  }
  load();
  // 初始化派生字段
  if(!state.inviteCode){ state.inviteCode = 'FD' + Math.floor(Math.random()*900000+100000); }
  // 首次使用送一张体验券（仅当优惠券列表为空时）
  if(state.coupons.length === 0){
    const expire = Date.now() + 7*24*3600*1000;
    state.coupons.push({
      id:'welcome',
      title:'新用户体验券',
      discount:10, minCost:30,
      expireAt:expire, used:false,
      source:'welcome',
      gotAt:Date.now()
    });
  }

  // ===================== 工具函数 =====================
  function $(id){ return document.getElementById(id); }
  function fmt(n){ return n.toLocaleString('zh-CN'); }
  function toast(html){
    const t=$('toastMsg'); t.innerHTML=html; t.classList.add('on');
    setTimeout(()=>t.classList.remove('on'),2100);
  }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

  // ===================== 导航 / 标签切换 =====================
  function showMain(tab){
    $('scr-login').classList.remove('on');
    $('scr-main').classList.add('on');
    document.querySelectorAll('#appTabs button').forEach(b=>b.classList.remove('on'));
    document.querySelectorAll('.scr-body').forEach(p=>p.classList.remove('on'));
    // 切 Tab 时统一清理浮层状态，避免 raceView/ckView 残留
    closeOverlayViews(tab);
    document.querySelector('#appTabs [data-tab="'+tab+'"]').classList.add('on');
    const panelId = 'pn' + (tab[0].toUpperCase()+tab.slice(1));
    const panel = $(panelId);
    if(panel) panel.classList.add('on');
    renderAll();
  }

  // 切 Tab 时统一关闭非当前所需的浮层（raceView 是全屏比赛，ckView 是驾驶舱）
  function closeOverlayViews(targetTab){
    // 关闭比赛浮层（除非目标就是 race）
    if(targetTab !== 'race'){
      if($('raceView')) $('raceView').classList.remove('on');
      document.body.classList.remove('racing');
      try{
        if(typeof raceData !== 'undefined' && raceData && raceData.running){
          raceData.running = false;
          if(typeof raceLoop !== 'undefined' && raceLoop){ cancelAnimationFrame(raceLoop); raceLoop=null; }
        }
      }catch(_){}
      // 重置比赛内部阶段
      ['raceLobby','raceStage','raceMatching','raceDone'].forEach(id=>{
        const el = $(id); if(el) el.classList.remove('on');
      });
    }
    // 关闭驾驶舱（任何切 Tab 都视为结束驾驶）
    if($('ckView') && $('ckView').classList.contains('on')){
      try{ endDrive(false); }catch(_){}
    }
  }

  document.querySelectorAll('#appTabs button').forEach(btn=>{
    const tab = btn.dataset.tab;
    if(tab === 'drive' || tab === 'race') return; // 由下方单独处理
    btn.addEventListener('click', ()=>{
      showMain(tab);
    });
  });

  // 驾驶 Tab：根据用户当前状态智能路由
  const driveTabBtn = document.querySelector('#appTabs [data-tab="drive"]');
  driveTabBtn.addEventListener('click', e=>{
    e.stopPropagation();
    enterDriveEntry();
  });

  function enterDriveEntry(){
    // 状态1：已在驾驶中
    if($('ckView').classList.contains('on')){
      toast('🎮 你正在驾驶中…');
      return;
    }
    // 状态2：地图上有未点亮的坐标
    const next = mapPoints.find(pt => !state.lit.includes(pt.id));
    if(next){
      // 自动选中并直接打开出发 sheet
      showMain('map');
      openPoint(next);
      return;
    }
    // 状态3：所有坐标已点亮
    const allDone = mapPoints.length > 0 && state.lit.length >= mapPoints.length;
    if(allDone){
      showDlg({
        title:'所有坐标已点亮 🏆',
        body:'田园站·黑暗森林的 8 个坐标全部探索完成。可以前往下一站，或与好友来一场双人赛。',
        ok:'去比赛',
        cancel:'留在地图',
        onOk:()=>{ raceTabBtn.click(); }
      });
      return;
    }
    // 状态4：异常兜底
    showMain('map');
    toast('👆 先在地图点一个坐标出发');
  }

  // 比赛 Tab：打开竞速大厅
  const raceTabBtn = document.querySelector('#appTabs [data-tab="race"]');
  raceTabBtn.addEventListener('click', e=>{
    e.stopPropagation();
    showMain('race');
    openRaceLobby();
  });

  // ===================== 登录 =====================
  function doLogin(){
    const p = $('phoneInp').value.trim();
    const c = $('codeInp').value.trim();
    if(!/^1\d{10}$/.test(p)){ toast('📱 请输入正确手机号'); $('phoneInp').focus(); return; }
    if(c !== '1234'){ toast('🔑 演示验证码为 1234'); $('codeInp').focus(); return; }
    showMain('map');
    toast('🎉 欢迎回来，探索者');
    if(!state._coachDone) setTimeout(startCoach, 400);
  }
  $('loginBtn').addEventListener('click', doLogin);
  $('loginSkip').addEventListener('click', ()=>{
    showMain('map');
    toast('👋 游客模式体验');
    // 游客模式默认显示引导；正式登录用户走"是否首次"判断
    if(!state._coachDone) setTimeout(startCoach, 400);
  });
  $('codeBtn').addEventListener('click', ()=>{
    const p=$('phoneInp').value.trim();
    if(!/^1\d{10}$/.test(p)){ toast('📱 先输入手机号'); $('phoneInp').focus(); return; }
    toast('验证码已发送：1234');
  });

  // ===================== 渲染 =====================
  function renderPlayer(){
    $('pLv').textContent = 'Lv.' + state.lv;
    $('pName').textContent = state.name;
    $('pTitle').textContent = titleFor(state.lv);
    $('pExp').textContent = fmt(state.exp);
    $('pExpNext').textContent = fmt(state.expNext);
    $('pGold').textContent = fmt(state.gold);
    $('pStreak').textContent = state.streak + ' 天';
    const pct = Math.min(100, Math.round(state.exp/state.expNext*100));
    $('pXpFill').style.width = pct + '%';
  }

  function renderMap(){
    const total = mapPoints.length;
    const lit = state.lit;
    const litCnt = lit.length;
    const explorePct = Math.round(litCnt/total*100);
    $('stName').textContent = '田园站 · 黑暗森林';
    $('stCnt').textContent = litCnt;
    $('stTotal').textContent = total;
    $('ringPct').textContent = explorePct + '%';
    $('ringArc').setAttribute('stroke-dashoffset', 169.6 - (169.6*explorePct/100));
    $('mBattery').textContent = Math.max(0, 100 - Math.floor(state.totalKm*2)) + '%';
    $('mKm').textContent = state.totalKm.toFixed(1);
    $('mFrag').textContent = state.fragments;
    $('mBar').style.width = explorePct + '%';

    const box = $('mapMarkers'); box.innerHTML = '';
    mapPoints.forEach(pt=>{
      const el = document.createElement('div');
      const isLit = lit.includes(pt.id);
      const cls = isLit ? 'lit' : 'open';
      el.className = 'map-marker ' + cls;
      el.style.left = pt.x + '%'; el.style.top = pt.y + '%';
      el.innerHTML = '<span class="dot"></span>' + (isLit ? '<span class="tag">已点亮</span>' : '<span class="tag">+' + pt.reward.gold + ' 金币</span>');
      el.addEventListener('click', (e)=>{
        // 阻止冒泡到 document，否则 sheet 会被 document 级 closeSheet 关掉
        if(e){ e.stopPropagation(); e.preventDefault(); }
        openPoint(pt);
      });
      box.appendChild(el);
    });
  }

  function renderCars(){
    const list = $('carList'); list.innerHTML='';
    cars.forEach(c=>{
      const locked = state.lv < c.lockLv;
      const sel = state.selectedCar === c.id;
      const row = document.createElement('div');
      row.className = 'car-row' + (sel?' sel':'') + (locked?' lock':'');
      row.innerHTML = `
        <img src="${c.img}" alt="${c.name}">
        <div class="cn"><b>${c.name}</b><span>${c.tag}</span></div>
        <div class="cp">${locked?'<small>未解锁</small>Lv.'+c.lockLv+' 解锁':(c.hot?'<small>推荐 · 新手之选</small>':'')+'¥'+c.cost+'/场'}</div>
        <span class="sel-tag">驾驶中</span>`;
      row.addEventListener('click', ()=>{
        if(locked){ toast('🔒 需要 Lv.' + c.lockLv + ' 解锁'); return; }
        state.selectedCar = c.id; save(); renderCars(); updateCarPanel();
      });
      list.appendChild(row);
    });
    updateCarPanel();
  }
  function updateCarPanel(){
    const c = cars.find(x=>x.id===state.selectedCar);
    $('curCarName').textContent = c.name;
    $('curCarSub').textContent = c.tag;
    $('curCarCost').textContent = '¥' + c.cost + '/场';
    $('stSpd').style.width = c.speed + '%';
    $('stAcc').style.width = c.acc + '%';
    $('stGrip').style.width = c.grip + '%';
  }

  function renderTasks(){
    const box = $('tskRows'); box.innerHTML='';
    tasks.forEach(t=>{
      const progress = t.type==='drive' ? Math.min(t.req, state.driveSec) : (t.type==='light' ? Math.min(t.req, state.lit.length) : (t.type==='race' ? Math.min(t.req, state.wins) : 0));
      const done = progress >= t.req;
      const pct = Math.round(progress/t.req*100);
      const row = document.createElement('div');
      row.className = 'task' + (t.claimed?' done':'');
      const ico = t.type==='drive'?'M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M19 5l-2.8 2.8M7.8 16.2 5 19':(t.type==='light'?'M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M19 5l-2.8 2.8M7.8 16.2 5 19':(t.type==='race'?'M7 17 17 7M7 7h10v10':''));
      row.innerHTML = `
        <div class="t-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ico}"/></svg></div>
        <div class="t-mid"><b>${t.label}</b><span>${t.claimed?'已完成 · 奖励已领取':(progress+' / ' + t.req)}</span></div>
        <div class="t-rw">+${t.rewards.exp} 经验<small>+${t.rewards.gold} 金币</small></div>
        <div class="t-ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg></div>`;
      if(!t.claimed){
        const claim = document.createElement('button');
        claim.className = 'claim' + (done?'':' done-c');
        claim.textContent = done?'领取奖励':'进行中 ' + pct + '%';
        claim.disabled = !done;
        claim.addEventListener('click', ()=>{ if(done) claimTask(t); });
        row.appendChild(claim);
      }
      box.appendChild(row);
    });
    const total = mapPoints.length;
    const litPct = Math.round(state.lit.length/total*100);
    $('seasonPct').style.width = litPct + '%';
    $('seasonTxt').textContent = state.lit.length + '/' + total;
  }

  function claimTask(t){
    if(t.claimed) return;
    t.claimed = true;
    addReward(t.rewards.exp, t.rewards.gold);
    save(); renderTasks();
    showDlg({title:'任务完成', body:t.label, rewards:t.rewards, ok:'好的'});
  }

  function renderAch(){
    const aState = {
      a1: state.lit.length >= 1,
      a2: state.driveSec >= 180,
      a3: state.lit.length >= 5,
      a4: state.raceStreak >= 3,
      a5: state.fragments >= 5,
      a6: state.lv >= 10
    };
    let unlocked = 0;
    const box = $('achGrid'); box.innerHTML='';
    achs.forEach(a=>{
      const ok = !!aState[a.id]; if(ok) unlocked++;
      const el = document.createElement('div');
      el.className = 'ach' + (ok?'':' lock');
      el.innerHTML = `<div class="a-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 8.3l6.1-.7z"/></svg></div><b>${a.name}</b><span>${a.sub}</span>`;
      box.appendChild(el);
    });
    $('achCount').textContent = '已点亮 ' + unlocked + ' / ' + achs.length;
  }

  function addReward(exp, gold){
    state.exp += exp; state.gold += gold;
    while(state.exp >= state.expNext){
      state.exp -= state.expNext; state.lv++;
      state.expNext = Math.floor(state.expNext * 1.25) + 50;
      state.name = '探索者';
      toast('🎉 升级到 Lv.' + state.lv);
    }
    if(state.fragments === 0 && Math.random() > 0.5){
      state.fragments = Math.min(5, state.fragments + 1);
    }
    save();
  }

  function renderAll(){ renderPlayer(); renderMap(); renderCars(); renderTasks(); renderAch(); updateRaceLobby(); renderMe(); }

  // ===================== 个人中心 =====================
  function renderMe(){
    // 只更新可见/已绑定节点，未绑定的跳过
    const meLv = $('meLv'); if(meLv) meLv.textContent = 'Lv.' + state.lv;
    const meName = $('meName'); if(meName) meName.textContent = state.name;
    const meTitleTag = $('meTitleTag'); if(meTitleTag) meTitleTag.textContent = titleFor(state.lv);
    const meLit = $('meLit'); if(meLit) meLit.textContent = state.lit.length;
    const meTotal = $('meTotal'); if(meTotal) meTotal.textContent = mapPoints.length;
    const meKm = $('meKm'); if(meKm) meKm.textContent = state.totalKm.toFixed(1);
    const meStreak = $('meStreak'); if(meStreak) meStreak.textContent = state.streak;
    const meGold = $('meGold'); if(meGold) meGold.textContent = fmt(state.gold);
    const meCoupon = $('meCoupon'); if(meCoupon){
      const valid = (state.coupons||[]).filter(c => !c.used && c.expireAt > Date.now()).length;
      meCoupon.textContent = valid + ' 张';
    }
    const meOrderCnt = $('meOrderCnt'); if(meOrderCnt) meOrderCnt.textContent = (state.orders||[]).length + ' 笔';
    // 任务页签到入口状态（任何时候刷新都安全）
    if(typeof refreshTaskSignEntry === 'function') refreshTaskSignEntry();
    // 徽章统计
    const aState = {
      a1: state.lit.length >= 1, a2: state.driveSec >= 180,
      a3: state.lit.length >= 5, a4: state.raceStreak >= 3,
      a5: state.fragments >= 5, a6: state.lv >= 10
    };
    const unlocked = Object.values(aState).filter(Boolean).length;
    const meMedalCnt = $('meMedalCnt'); if(meMedalCnt) meMedalCnt.textContent = unlocked + ' / ' + achs.length;
    // 渲染子面板内容（如果已激活）
    if($('meView').classList.contains('on')){
      const activePanel = document.querySelector('.me-panel.on');
      if(activePanel){
        if(activePanel.id === 'mePanelOrders') renderOrders();
        if(activePanel.id === 'mePanelMedals') renderMedalsInto(activePanel);
      }
    }
  }

  function openMe(){
    renderMe();
    $('meView').classList.add('on');
    // 重置子面板：默认只显示主面板
    document.querySelectorAll('.me-panel').forEach(p=>p.classList.remove('on'));
  }
  function closeMe(){
    $('meView').classList.remove('on');
  }

  $('atMe').addEventListener('click', openMe);
  $('meBack').addEventListener('click', closeMe);
  $('meSet').addEventListener('click', ()=>{
    showSettings();
  });

  // 子面板导航
  document.querySelectorAll('[data-me-nav]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      e.preventDefault();
      const key = el.dataset.meNav;
      showMePanel(key);
    });
  });
  document.querySelectorAll('[data-me-back]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.me-panel').forEach(p=>p.classList.remove('on'));
      window.scrollTo(0,0);
    });
  });

  function showMePanel(key){
    document.querySelectorAll('.me-panel').forEach(p=>p.classList.remove('on'));
    const scroll = document.querySelector('.me-scroll');
    if(scroll) scroll.scrollTop = 0;
    if(key === 'orders'){
      $('mePanelOrders').classList.add('on');
      renderOrders();
    }else if(key === 'medals'){
      $('mePanelMedals').classList.add('on');
      renderMedalsInto($('mePanelMedals'));
    }else if(key === 'footprints'){
      // 足迹地图：暂展示站点列表
      showDlg({
        title:'足迹地图',
        body:'已点亮站点：<b>田园站·黑暗森林</b> (' + state.lit.length + '/' + mapPoints.length + ' 个坐标)。<br>更多站点（竹林、戈壁、雪地…）将在 V2.0 上线。',
        ok:'好的'
      });
    }else if(key === 'invite'){
      // 展示"我的邀请"子面板
      renderInvitePanel();
    }
  }

  // 渲染订单列表
  let orderFilter = 'all';
  document.querySelectorAll('#meOrderTabs button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      orderFilter = btn.dataset.otype;
      document.querySelectorAll('#meOrderTabs button').forEach(b=>b.classList.toggle('on', b===btn));
      renderOrders();
    });
  });

  function renderOrders(){
    const box = $('meOrderList'); if(!box) return;
    let orders = (state.orders||[]).slice().reverse(); // 最新在前
    if(orderFilter !== 'all') orders = orders.filter(o => o.type === orderFilter);
    if(orders.length === 0){
      box.innerHTML = '<div class="me-empty">' + (orderFilter==='all' ? '暂无订单，去地图点亮坐标吧 ✨' : '该分类暂无订单') + '</div>';
      return;
    }
    box.innerHTML = '';
    orders.forEach(o=>{
      const div = document.createElement('div');
      div.className = 'me-order';
      const ico = o.type === 'race' ? '🏁' : '🚙';
      const dt = new Date(o.startAt);
      const dateStr = (dt.getMonth()+1) + '/' + dt.getDate() + ' ' + String(dt.getHours()).padStart(2,'0') + ':' + String(dt.getMinutes()).padStart(2,'0');
      const sub = o.type === 'race'
        ? (o.won ? '比赛获胜' : '比赛惜败') + ' · ' + o.opponent
        : o.subtype + ' · ' + dateStr + ' · ' + o.duration + 's · ' + o.km + 'm';
      const amt = o.type === 'race' ? (o.won ? '+500 金币' : '+0 金币') : '−' + o.amount + ' 金币';
      const status = o.status === 'refunded' ? '已退款' : (o.won ? '已结算' : '已结束');
      div.innerHTML =
        '<div class="me-o-ico">' + ico + '</div>' +
        '<div class="me-o-mid"><b>' + o.name + '</b><span>' + sub + '</span></div>' +
        '<div class="me-o-right">' +
          '<div class="me-o-amount">' + amt + '</div>' +
          '<div class="me-o-status' + (o.status==='refunded'?' refund':'') + '">' + status + '</div>' +
        '</div>';
      div.addEventListener('click', ()=> showOrderDetail(o));
      box.appendChild(div);
    });
  }

  function showOrderDetail(o){
    const dt = new Date(o.startAt);
    const dateStr = dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0')
      + ' ' + String(dt.getHours()).padStart(2,'0') + ':' + String(dt.getMinutes()).padStart(2,'0');
    const exp = o.exp || 0, gold = o.gold || 0;
    let body = '<div style="text-align:left;font-size:12px;line-height:1.8;color:var(--muted);">' +
      '<div style="color:var(--ink);font-weight:800;font-size:13px;">' + o.name + '</div>' +
      '<div>订单号：' + o.id + '</div>' +
      '<div>时间：' + dateStr + '</div>' +
      '<div>车型：' + o.car + '</div>' +
      '<div>消费：<b style="color:var(--amber)">' + o.amount + '</b> 金币</div>';
    // 优惠券抵扣明细（pay/driver 订单都可能携带）
    if(o.couponSnapshot){
      body += '<div>券抵扣：<b style="color:var(--good)">−¥' + o.couponSnapshot.discount + '</b> · ' + o.couponSnapshot.title + '</div>';
    }else if(o.coupon && o.coupon > 0){
      body += '<div>券抵扣：<b style="color:var(--good)">−¥' + o.coupon + '</b></div>';
    }
    if(o.type === 'drive'){
      body += '<div>行驶：' + (o.km/1000).toFixed(2) + ' km · 用时 ' + o.duration + ' 秒</div>';
      if(gold > 0 || exp > 0){
        body += '<div>奖励：<b style="color:var(--gold)">+' + exp + ' 经验 / +' + gold + ' 金币</b></div>';
      }else if(o.status === 'refunded'){
        body += '<div style="color:var(--bad)">本单已全额退款</div>';
      }
    }else if(o.type === 'race'){
      body += '<div>对手：' + (o.opponent||'-') + '</div>' +
        '<div>结果：' + (o.won ? '获胜' : '惜败') + '</div>';
    }else if(o.type === 'pay'){
      body += '<div>支付方式：' + (({wechat:'微信支付',alipay:'支付宝',coin:'金币支付',coupon:'券全额抵扣'})[o.method] || o.method) + '</div>';
    }
    body += '</div>';
    showDlg({ title:'订单详情', body:body, ok:'关闭' });
  }

  function renderMedalsInto(panel){
    const box = panel.querySelector('.ach-grid'); if(!box) return;
    const aState = {
      a1: state.lit.length >= 1, a2: state.driveSec >= 180,
      a3: state.lit.length >= 5, a4: state.raceStreak >= 3,
      a5: state.fragments >= 5, a6: state.lv >= 10
    };
    box.innerHTML = '';
    achs.forEach(a=>{
      const ok = !!aState[a.id];
      const el = document.createElement('div');
      el.className = 'ach' + (ok?'':' lock');
      el.innerHTML = '<div class="a-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 8.3l6.1-.7z"/></svg></div><b>' + a.name + '</b><span>' + a.sub + '</span>';
      box.appendChild(el);
    });
  }

  // 设置弹层
  function showSettings(){
    const s = state.settings;
    const leftHand = s.leftHand ? '✅' : '⬜';
    const vibration = s.vibration ? '✅' : '⬜';
    const hd = s.hd ? '✅' : '⬜';
    const sound = s.sound ? '✅' : '⬜';
    showDlg({
      title:'设置',
      body:'<div style="text-align:left;font-size:12.5px;line-height:2;color:var(--ink);">' +
        '<div style="cursor:pointer" data-set="leftHand">左手模式（操控左右对调）' + leftHand + '</div>' +
        '<div style="cursor:pointer" data-set="vibration">震动反馈 ' + vibration + '</div>' +
        '<div style="cursor:pointer" data-set="hd">高清画质（更耗流量）' + hd + '</div>' +
        '<div style="cursor:pointer" data-set="sound">音效 ' + sound + '</div>' +
        '<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);color:var(--muted);font-size:11px;">' +
        '版本：v0.9.0 · 点击对应行切换</div></div>',
      ok:'完成',
      onOk:()=>{ save(); }
    });
    // 给弹层里的选项挂事件
    setTimeout(()=>{
      const body = $('fxBody');
      if(!body) return;
      body.querySelectorAll('[data-set]').forEach(row=>{
        row.addEventListener('click', ()=>{
          const k = row.dataset.set;
          state.settings[k] = !state.settings[k];
          closeDlg();
          showSettings();
        });
      });
    }, 0);
  }

  // 邀请好友面板（已迁移至 mePanelInvite 子面板，由 renderInvitePanel 处理）

  // 充值入口（V1.0 占位）
  $('meCharge').addEventListener('click', ()=>{
    showDlg({
      title:'充值金币',
      body:'<div style="text-align:left;font-size:12.5px;line-height:2;">' +
        '<div>🌱 体验包：¥10 / 100 金币</div>' +
        '<div>🌿 探索包：¥30 / 320 金币 <b style="color:var(--bad);font-size:10px;">推荐</b></div>' +
        '<div>🌳 远征包：¥98 / 1100 金币（送 50 金币）</div>' +
        '<div style="margin-top:8px;color:var(--muted);font-size:11px;">V1.0 暂未开放充值，<br>请用完成任务获得的金币体验。</div>' +
        '</div>',
      ok:'好的'
    });
  });
  $('meCouponBtn').addEventListener('click', ()=>{
    showMePanel('coupons');
  });
  $('meCouponCell') && $('meCouponCell').addEventListener('click', ()=>{
    showMePanel('coupons');
  });

  // 优惠券 Tab 切换
  document.querySelectorAll('#meCouponTabs button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const stat = btn.dataset.cstat;
      document.querySelectorAll('#meCouponTabs button').forEach(b=>b.classList.toggle('on', b===btn));
      renderCouponList(stat);
    });
  });

  // 渲染优惠券子面板
  function couponState(c){
    const now = Date.now();
    if(c.used) return 'used';
    if(c.expireAt <= now) return 'expired';
    return 'valid';
  }
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
  function renderCouponList(stat){
    stat = stat || 'valid';
    const box = $('meCouponList'); if(!box) return;
    let list = (state.coupons||[]).slice();
    if(stat === 'valid'){
      list = list.filter(c => !c.used && c.expireAt > Date.now());
      list.sort((a,b)=>a.expireAt - b.expireAt); // 临期在前
    }else if(stat === 'used'){
      list = list.filter(c => c.used);
      list.sort((a,b)=>(b.usedAt||0)-(a.usedAt||0)); // 最近使用在前
    }else if(stat === 'expired'){
      list = list.filter(c => !c.used && c.expireAt <= Date.now());
      list.sort((a,b)=>b.expireAt - a.expireAt); // 最近过期在前
    }
    // 更新顶部 Tab 计数
    const all = state.coupons||[];
    $('meCntValid').textContent = all.filter(c=>!c.used && c.expireAt > Date.now()).length;
    $('meCntUsed').textContent = all.filter(c=>c.used).length;
    $('meCntExpired').textContent = all.filter(c=>!c.used && c.expireAt <= Date.now()).length;

    if(list.length === 0){
      const empty = stat === 'valid' ? '暂无可用优惠券，去任务页领取吧 ✨'
        : stat === 'used' ? '暂无使用记录'
        : '暂无过期优惠券';
      box.innerHTML = '<div class="me-empty">' + empty + '</div>';
      return;
    }
    box.innerHTML = '';
    list.forEach(c=>{
      const card = document.createElement('div');
      const st = couponState(c);
      card.className = 'me-coupon-card' + (st === 'used' ? ' used' : '') + (st === 'expired' ? ' expired' : '');
      const days = Math.max(0, Math.ceil((c.expireAt - Date.now())/86400000));
      const statusTag = st === 'valid'
        ? (days <= 3 ? '<span class="coupon-tag warn">临期 ' + days + ' 天</span>' : '<span class="coupon-tag">未使用</span>')
        : st === 'used'
        ? '<span class="coupon-tag muted">已使用</span>'
        : '<span class="coupon-tag muted">已过期</span>';
      const meta = c.source
        ? couponSourceLabel(c.source)
        : '系统发放';
      const usedInfo = (st === 'used' && c.usedAt)
        ? '<div class="coupon-meta">使用于订单 ' + (c.usedInOrder || '-') + ' · ' + fmtDate(c.usedAt) + '</div>'
        : '';
      card.innerHTML =
        '<div class="coupon-amount"><b>¥' + c.discount + '</b><small>' + c.minCost + ' 通用</small></div>' +
        '<div class="coupon-mid">' +
          '<b>' + c.title + '</b>' +
          '<div class="coupon-cond">' +
            statusTag +
            (st === 'valid' ? '<span class="coupon-day' + (days<=3?' warn':'') + '">剩 ' + days + ' 天</span>' : '') +
          '</div>' +
          '<div class="coupon-meta">📦 来源：' + meta + '</div>' +
          usedInfo +
        '</div>';
      box.appendChild(card);
    });
  }

  function fmtDate(ts){
    if(!ts) return '-';
    const d = new Date(ts);
    const pad = n => String(n).padStart(2,'0');
    return (d.getMonth()+1) + '/' + d.getDate() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  // 让 renderMe 同步更新个人中心所有数据（含优惠券子面板）
  // 已在原 renderMe 中添加：meCouponCell 点击、meCouponCount 显示
  // 这里只确保 coupon 子面板打开时自动渲染 valid 列表
  const _origShowMePanel = showMePanel;
  showMePanel = function(key){
    _origShowMePanel(key);
    if(key === 'coupons'){
      // 默认选中"可用"
      document.querySelectorAll('#meCouponTabs button').forEach(b=>{
        b.classList.toggle('on', b.dataset.cstat === 'valid');
      });
      renderCouponList('valid');
    }
  };

  // ===================== 支付弹层 =====================
  // 5 态：idle / pending / paid / failed / refunded
  // 三种支付方式：wechat / alipay / coin
  // 后端占位：fetch('/api/pay/...') 替换为沙箱模拟
  const pay = {
    orderId:null, amount:0, scene:'', title:'',
    method:'', couponId:null,
    useCoupon:false, couponDiscount:0,
    createdAt:0, expiresAt:0,
    countdownTimer:null,
    onPaid:null
  };

  function genPayId(){
    const ts = Date.now().toString().slice(-10);
    return 'P' + ts + Math.floor(Math.random()*100).toString().padStart(2,'0');
  }

  function getBestCoupon(amount){
    // 找到一张可用券：未用 + 未过期 + minCost 满足 + 折扣最大
    const valid = (state.coupons||[]).filter(c => !c.used && c.expireAt > Date.now() && c.minCost <= amount);
    if(valid.length === 0) return null;
    return valid.sort((a,b)=>b.discount - a.discount)[0];
  }

  // 主入口：选择支付方式
  function openPayDialog(opts){
    pay.scene = opts.scene || 'drive';
    pay.amount = opts.amount || 0;
    pay.title = opts.title || '';
    pay.onPaid = opts.onPaid || function(){};
    pay.method = '';
    pay.orderId = null;
    pay.useCoupon = false;
    pay.couponId = null;
    pay.couponDiscount = 0;
    // 优惠券智能推荐
    const bestCoupon = getBestCoupon(pay.amount);
    if(bestCoupon){
      pay.useCoupon = true;
      pay.couponId = bestCoupon.id;
      pay.couponDiscount = bestCoupon.discount;
    }
    showPayChoose();
  }

  function showPayChoose(){
    const couponBox = $('payCouponBox');
    const couponInfo = $('payCouponInfo');
    const useChk = $('payCouponUse');
    if(pay.couponId){
      const c = state.coupons.find(x=>x.id===pay.couponId);
      couponBox.style.display = 'block';
      const days = Math.max(0, Math.ceil((c.expireAt - Date.now())/86400000));
      couponInfo.textContent = '¥' + c.discount + ' 满 ¥' + c.minCost + ' 可用 · 剩 ' + days + ' 天';
      useChk.checked = pay.useCoupon;
    }else{
      couponBox.style.display = 'none';
    }
    renderPayAmount();
    // 默认选中：金币够则金币；否则微信
    const wechatEl = document.querySelector('.pay-method[data-method="wechat"]');
    const coinEl = $('payMethodCoin');
    const coinOk = state.gold >= (pay.useCoupon ? Math.max(0, pay.amount - pay.couponDiscount) : pay.amount);
    if(coinOk){
      coinEl.style.display = 'flex';
      selectPayMethod('coin');
    }else{
      coinEl.style.display = 'none';
      selectPayMethod('wechat');
    }
    // 金币余额显示
    const coinSpan = $('payCoinBalance');
    if(coinSpan){
      const payAmt = pay.useCoupon ? Math.max(0, pay.amount - pay.couponDiscount) : pay.amount;
      const need = Math.max(0, payAmt - state.gold);
      coinSpan.textContent = need > 0
        ? '金币余额 ' + state.gold + ' · 还差 ' + need + ' 金币'
        : '金币余额 ' + state.gold + '（可支付 ¥' + payAmt + '）';
      if(need > 0) coinEl.style.opacity = '.5';
      else coinEl.style.opacity = '1';
    }
    switchPayStage('choose');
    $('payView').classList.add('on');
  }

  function renderPayAmount(){
    const final = pay.useCoupon ? Math.max(0, pay.amount - pay.couponDiscount) : pay.amount;
    $('payAmt').textContent = '¥' + final;
    $('payAmtSub').textContent = (pay.title || '订单') + ' · 田园站';
    $('payConfirmAmt').textContent = '¥' + final;
    if(pay.useCoupon && pay.couponDiscount > 0){
      $('payAmtCoupon').textContent = '−¥' + pay.couponDiscount + ' 券';
    }else{
      $('payAmtCoupon').textContent = '';
    }
  }

  function selectPayMethod(m){
    pay.method = m;
    document.querySelectorAll('.pay-method').forEach(el=>{
      el.classList.toggle('sel', el.dataset.method === m);
    });
  }

  // 切换支付方式
  document.querySelectorAll('.pay-method').forEach(el=>{
    el.addEventListener('click', ()=>{
      if(el.style.display === 'none') return;
      selectPayMethod(el.dataset.method);
    });
  });

  // 优惠券开关
  $('payCouponUse').addEventListener('change', (e)=>{
    pay.useCoupon = e.target.checked;
    renderPayAmount();
    // 重新检查金币
    const finalAmt = pay.useCoupon ? Math.max(0, pay.amount - pay.couponDiscount) : pay.amount;
    const coinOk = state.gold >= finalAmt;
    if(!coinOk && pay.method === 'coin') selectPayMethod('wechat');
    if(coinOk && pay.method === ''){ selectPayMethod('coin'); }
  });

  // 确认支付
  $('payConfirm').addEventListener('click', async ()=>{
    if(!pay.method){ toast('请选择支付方式'); return; }
    const finalAmt = pay.useCoupon ? Math.max(0, pay.amount - pay.couponDiscount) : pay.amount;
    if(finalAmt <= 0){
      // ¥0 单（券全额抵扣）：直接成功
      onPaySucceed({ orderId:genPayId(), amount:0, method:'coupon' });
      return;
    }
    if(pay.method === 'coin'){
      if(state.gold < finalAmt){
        toast('💰 金币不足');
        return;
      }
      // 金币支付：直接扣
      state.gold -= finalAmt;
      save(); renderPlayer();
      onPaySucceed({ orderId:genPayId(), amount:finalAmt, method:'coin' });
      return;
    }
    // 微信/支付宝：进入待支付态，发起后端订单
    await startThirdPartyPay(pay.method, finalAmt);
  });

  // ===================== 支付 SDK 适配器（说明书 V1.0）=====================
  // PayConfig: 配置入口
  // - mode: 'sandbox' | 'production'
  // - providers: { wechat: 微信支付 SDK / alipay: 支付宝 SDK / coin: 金币 }
  const PayConfig = {
    mode: 'sandbox',                       // 生产环境改为 'production'
    pollIntervalMs: 2000,                  // 支付结果轮询间隔
    pollTimeoutMs: 15 * 60 * 1000,         // 轮询超时（与倒计时一致）
    providers: {
      wechat: 'SandboxAdapter',             // 生产替换为 'WechatAdapter'
      alipay: 'SandboxAdapter',             // 生产替换为 'AlipayAdapter'
      coin:   'CoinAdapter'                 // 金币支付无需后端
    }
  };

  // 抽象适配器基类
  class PayAdapter {
    constructor(name){ this.name = name; }
    // 创建订单 {method, amount, metadata} → {ok, orderId, qrCode, expiresIn, raw}
    async create(opts){ throw new Error('not implemented'); }
    // 查询订单 {orderId} → {ok, status: 'PENDING'|'PAID'|'FAILED'|'EXPIRED', raw}
    async query(orderId){ throw new Error('not implemented'); }
    // 取消订单 {orderId} → {ok}
    async cancel(orderId){ throw new Error('not implemented'); }
  }

  // 沙箱适配器（演示用，立即返回模拟订单 + 永不自动 PAID，需手动点"模拟支付成功"）
  class SandboxAdapter extends PayAdapter {
    constructor(){ super('sandbox'); }
    async create(opts){
      // 模拟 350ms 后端响应
      await new Promise(r => setTimeout(r, 350));
      return {
        ok: true,
        orderId: genPayId(),
        amount: opts.amount,
        method: opts.method,
        qrCode: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg"/>'),
        expiresIn: 15 * 60,
        raw: { source: 'sandbox' }
      };
    }
    async query(orderId){
      await new Promise(r => setTimeout(r, 200));
      // 沙箱不会自动支付成功；等用户点"模拟支付成功"
      return { ok: true, status: 'PENDING', orderId, raw: { source: 'sandbox' } };
    }
    async cancel(orderId){
      await new Promise(r => setTimeout(r, 200));
      return { ok: true, raw: { source: 'sandbox' } };
    }
  }

  // 微信支付适配器（生产环境骨架）
  // 真实集成：引入微信 JSAPI / H5 支付 SDK（参考 https://pay.weixin.qq.com）
  class WechatAdapter extends PayAdapter {
    constructor(cfg){
      super('wechat');
      this.appId = cfg.appId;
      this.mchId = cfg.mchId;
      this.apiKey = cfg.apiKey;
      this.notifyUrl = cfg.notifyUrl || '';
    }
    async create(opts){
      // 真实：fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', {...})
      // 响应：return_code + result_code + prepay_id + code_url
      const resp = await fetch('/api/pay/wechat/create', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ amount: opts.amount, metadata: opts.metadata })
      });
      const data = await resp.json();
      if(data.return_code !== 'SUCCESS') return { ok:false, reason:data.return_msg || 'create-failed' };
      return {
        ok: true,
        orderId: data.prepay_id,
        amount: opts.amount,
        method: 'wechat',
        qrCode: data.code_url,
        expiresIn: 15 * 60,
        raw: data
      };
    }
    async query(orderId){
      // 真实：查询订单状态
      const resp = await fetch('/api/pay/wechat/query?orderId=' + orderId);
      const data = await resp.json();
      // trade_state: SUCCESS / REFUND / NOTPAY / CLOSED / REVOKED
      const statusMap = { SUCCESS:'PAID', REFUND:'REFUNDED', CLOSED:'FAILED', REVOKED:'FAILED', NOTPAY:'PENDING' };
      return { ok: true, status: statusMap[data.trade_state] || 'PENDING', orderId, raw: data };
    }
    async cancel(orderId){
      const resp = await fetch('/api/pay/wechat/cancel', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ orderId })
      });
      const data = await resp.json();
      return { ok: data.return_code === 'SUCCESS', raw: data };
    }
  }

  // 支付宝适配器（生产环境骨架）
  class AlipayAdapter extends PayAdapter {
    constructor(cfg){
      super('alipay');
      this.appId = cfg.appId;
      this.privateKey = cfg.privateKey;
      this.alipayPublicKey = cfg.alipayPublicKey;
    }
    async create(opts){
      // 真实：调用支付宝 SDK 的 alipay.trade.precreate
      const resp = await fetch('/api/pay/alipay/create', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ amount: opts.amount, metadata: opts.metadata })
      });
      const data = await resp.json();
      if(data.code !== '10000') return { ok:false, reason:data.msg || 'create-failed' };
      return {
        ok: true,
        orderId: data.out_trade_no,
        amount: opts.amount,
        method: 'alipay',
        qrCode: data.qr_code,
        expiresIn: 15 * 60,
        raw: data
      };
    }
    async query(orderId){
      const resp = await fetch('/api/pay/alipay/query?orderId=' + orderId);
      const data = await resp.json();
      // tradeStatus: TRADE_SUCCESS / WAIT_BUYER_PAY / TRADE_CLOSED
      const statusMap = { TRADE_SUCCESS:'PAID', WAIT_BUYER_PAY:'PENDING', TRADE_CLOSED:'FAILED' };
      return { ok: true, status: statusMap[data.tradeStatus] || 'PENDING', orderId, raw: data };
    }
    async cancel(orderId){
      const resp = await fetch('/api/pay/alipay/cancel', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ orderId })
      });
      const data = await resp.json();
      return { ok: data.code === '10000', raw: data };
    }
  }

  // 金币支付适配器（无后端，扣 state.gold 即可）
  class CoinAdapter extends PayAdapter {
    constructor(){ super('coin'); }
    async create(opts){
      // 立即成功
      return {
        ok: true,
        orderId: genPayId(),
        amount: opts.amount,
        method: 'coin',
        expiresIn: 0,
        raw: { source: 'coin' }
      };
    }
    async query(orderId){
      return { ok: true, status: 'PAID', orderId, raw: { source: 'coin' } };
    }
    async cancel(orderId){
      return { ok: true, raw: { source: 'coin' } };
    }
  }

  // 适配器工厂
  function createPayAdapter(method){
    const provider = PayConfig.providers[method] || 'SandboxAdapter';
    switch(provider){
      case 'WechatAdapter': return new WechatAdapter(window.FD_PAY_CFG && window.FD_PAY_CFG.wechat || {});
      case 'AlipayAdapter': return new AlipayAdapter(window.FD_PAY_CFG && window.FD_PAY_CFG.alipay || {});
      case 'CoinAdapter':   return new CoinAdapter();
      case 'SandboxAdapter':
      default: return new SandboxAdapter();
    }
  }

  // 替换原 payApiCreate/Query/Cancel 为适配器调用
  async function payApiCreate(method, amount){
    const adapter = createPayAdapter(method);
    return adapter.create({ method, amount, metadata: { scene: pay.scene, title: pay.title } });
  }
  async function payApiQuery(orderId){
    const adapter = createPayAdapter(pay.method);
    return adapter.query(orderId);
  }
  async function payApiCancel(orderId){
    if(!pay.method){ return { ok:true }; }
    const adapter = createPayAdapter(pay.method);
    return adapter.cancel(orderId);
  }

  // 真实 SDK 轮询：每 2s 查订单状态
  // 沙箱不会自动 PAID（需手动点"模拟支付成功"），真实 SDK 会在用户扫码支付后返回 PAID
  function startPayPolling(orderId, onPaid, onFailed){
    if(payConfig.pollTimer){ clearInterval(payConfig.pollTimer); }
    const deadline = Date.now() + PayConfig.pollTimeoutMs;
    payConfig.pollTimer = setInterval(async ()=>{
      if(Date.now() > deadline){
        clearInterval(payConfig.pollTimer); payConfig.pollTimer=null;
        onFailed('轮询超时，请重试');
        return;
      }
      try{
        const resp = await payApiQuery(orderId);
        if(resp.status === 'PAID'){
          clearInterval(payConfig.pollTimer); payConfig.pollTimer=null;
          onPaid({ orderId, amount: pay.useCoupon ? Math.max(0, pay.amount - pay.couponDiscount) : pay.amount, method: pay.method });
        }else if(resp.status === 'FAILED' || resp.status === 'EXPIRED'){
          clearInterval(payConfig.pollTimer); payConfig.pollTimer=null;
          onFailed('支付失败或订单过期');
        }
      }catch(e){ /* 网络抖动：继续轮询 */ }
    }, PayConfig.pollIntervalMs);
  }
  const payConfig = { pollTimer: null };

  // 第三方支付：发起 → 待支付 UI → 倒计时
  async function startThirdPartyPay(method, amount){
    const resp = await payApiCreate(method, amount);
    if(!resp.ok){ showPayFail('下单失败：' + (resp.reason || '请稍后重试')); return; }
    pay.orderId = resp.orderId;
    pay.createdAt = Date.now();
    pay.expiresAt = pay.createdAt + resp.expiresIn*1000;
    const methodName = method === 'wechat' ? '微信支付' : '支付宝';
    $('payPendingTitle').textContent = methodName;
    $('payQrMethod').textContent = method === 'wechat' ? '微信' : '支付宝';
    $('payQrAmt').textContent = amount;
    $('payOrderId').textContent = resp.orderId;
    $('payOrderTime').textContent = fmtTime(new Date());
    switchPayStage('pending');
    startPayCountdown(resp.expiresIn);

    // 生产环境：启动轮询（沙箱不会自动 PAID，需手动点"模拟支付成功"）
    if(PayConfig.mode === 'production'){
      startPayPolling(resp.orderId,
        (info)=>{
          // PAID → 关闭支付弹层 → 走 onPaySucceed 流程
          clearInterval(payConfig.pollTimer); payConfig.pollTimer=null;
          $('payView').classList.remove('on');
          onPaySucceed(info);
        },
        (reason)=>{
          clearInterval(payConfig.pollTimer); payConfig.pollTimer=null;
          showPayFail(reason || '支付失败');
        }
      );
    }
  }

  function fmtTime(d){
    const pad = n => String(n).padStart(2,'0');
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
  }

  function startPayCountdown(seconds){
    if(pay.countdownTimer) clearInterval(pay.countdownTimer);
    let remain = seconds;
    const el = $('payCountdown');
    const tick = ()=>{
      if(remain <= 0){
        clearInterval(pay.countdownTimer); pay.countdownTimer = null;
        showPayFail('订单已过期，请重新发起支付');
        return;
      }
      const m = Math.floor(remain/60), s = remain%60;
      el.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
      el.classList.toggle('warn', remain < 60);
      remain--;
    };
    tick();
    pay.countdownTimer = setInterval(tick, 1000);
  }

  // 模拟支付成功
  $('paySimPaid').addEventListener('click', ()=>{
    if(pay.countdownTimer){ clearInterval(pay.countdownTimer); pay.countdownTimer=null; }
    onPaySucceed({ orderId:pay.orderId, amount: pay.useCoupon ? Math.max(0,pay.amount - pay.couponDiscount) : pay.amount, method:pay.method });
  });
  // 模拟支付失败
  $('paySimFail').addEventListener('click', ()=>{
    if(pay.countdownTimer){ clearInterval(pay.countdownTimer); pay.countdownTimer=null; }
    showPayFail('支付失败：余额不足或网络异常');
  });

  function onPaySucceed(info){
    // 标记券已用 + 记录使用历史
    let couponSnapshot = null;
    if(pay.useCoupon && pay.couponId){
      const c = state.coupons.find(x=>x.id===pay.couponId);
      if(c){
        c.used = true;
        c.usedAt = Date.now();
        c.usedInOrder = info.orderId;
        couponSnapshot = {
          id:c.id, title:c.title, discount:c.discount, minCost:c.minCost,
          source:c.source || 'system'
        };
      }
    }
    // 写订单（支付订单标记为已付）
    state.orders.push({
      id: info.orderId,
      type: 'pay',
      name: pay.title || '支付订单',
      car: '-',
      amount: pay.amount,
      method: info.method,
      coupon: pay.useCoupon ? pay.couponDiscount : 0,
      couponSnapshot: couponSnapshot,
      startAt: Date.now(),
      duration: 0, km: 0,
      status:'done',
      paidAmount: info.amount,
      exp:0, gold:0
    });
    if(state.orders.length > 30) state.orders = state.orders.slice(-30);
    save(); renderAll();
    // 关闭支付弹层
    $('payView').classList.remove('on');
    if(pay.useCoupon && couponSnapshot){
      toast('✅ 支付成功 ¥' + info.amount + '（已抵 ¥' + couponSnapshot.discount + '）');
    }else{
      toast('✅ 支付成功 ¥' + info.amount);
    }
    if(pay.onPaid) pay.onPaid(info);
  }

  function showPayFail(reason){
    $('payFailBody').textContent = reason;
    switchPayStage('fail');
  }

  function switchPayStage(name){
    $('payStageChoose').classList.toggle('on', name==='choose');
    $('payStagePending').classList.toggle('on', name==='pending');
    $('payStageFail').classList.toggle('on', name==='fail');
  }

  // 顶部按钮
  $('payBack').addEventListener('click', ()=>{
    $('payView').classList.remove('on');
    if(pay.countdownTimer){ clearInterval(pay.countdownTimer); pay.countdownTimer=null; }
    if(pay.orderId) payApiCancel(pay.orderId);
  });
  $('payClose').addEventListener('click', ()=>{
    $('payView').classList.remove('on');
    if(pay.countdownTimer){ clearInterval(pay.countdownTimer); pay.countdownTimer=null; }
    if(pay.orderId) payApiCancel(pay.orderId);
  });
  $('payPendingBack').addEventListener('click', ()=>{
    if(pay.countdownTimer){ clearInterval(pay.countdownTimer); pay.countdownTimer=null; }
    if(pay.orderId) payApiCancel(pay.orderId);
    switchPayStage('choose');
  });
  $('payPendingClose').addEventListener('click', ()=>{
    $('payView').classList.remove('on');
    if(pay.countdownTimer){ clearInterval(pay.countdownTimer); pay.countdownTimer=null; }
    if(pay.orderId) payApiCancel(pay.orderId);
  });
  $('payFailRetry').addEventListener('click', ()=>{
    showPayChoose();
  });
  $('payFailBack').addEventListener('click', ()=>{
    $('payView').classList.remove('on');
  });

  // 充值（个人中心 → 钱包卡"充值"按钮）
  $('meCharge').addEventListener('click', ()=>{
    showChargePackages();
  });

  function showChargePackages(){
    showDlg({
      title:'充值金币',
      body:'<div class="charge-list">' +
        '<div class="charge-item" data-amt="10" data-gold="100">' +
          '<div class="ch-ico">🌱</div>' +
          '<div class="ch-mid"><b>¥10</b><span>100 金币</span></div>' +
          '<button class="ch-btn">充值</button>' +
        '</div>' +
        '<div class="charge-item" data-amt="30" data-gold="320">' +
          '<div class="ch-ico">🌿</div>' +
          '<div class="ch-mid"><b>¥30</b><span>320 金币 · 约 1 场</span></div>' +
          '<span class="ch-extra">推荐</span>' +
          '<button class="ch-btn">充值</button>' +
        '</div>' +
        '<div class="charge-item" data-amt="98" data-gold="1100">' +
          '<div class="ch-ico">🌳</div>' +
          '<div class="ch-mid"><b>¥98</b><span>1100 金币 · 约 3 场（送 50）</span></div>' +
          '<button class="ch-btn">充值</button>' +
        '</div>' +
        '</div>',
      ok:'取消'
    });
    setTimeout(()=>{
      const body = $('fxBody');
      if(!body) return;
      body.querySelectorAll('.charge-item').forEach(item=>{
        const amt = parseInt(item.dataset.amt, 10);
        const gold = parseInt(item.dataset.gold, 10);
        const btn = item.querySelector('.ch-btn');
        if(btn){
          btn.addEventListener('click', (e)=>{
            e.preventDefault();
            e.stopPropagation();
            closeDlg();
            openPayDialog({
              scene:'charge',
              amount: amt,
              title:'充值 ¥' + amt + ' / ' + gold + ' 金币',
              onPaid:()=>{
                state.gold += gold;
                save(); renderAll();
                toast('✅ 充值成功，到账 ' + gold + ' 金币');
              }
            });
          });
        }
      });
    }, 0);
  }

  // ===================== 地图点选 & 出发面板 =====================
  let pendingPoint = null;
  function openPoint(pt){
    if(state.lit.includes(pt.id)){ toast('✨ 该坐标已点亮'); return; }
    pendingPoint = pt;
    const c = cars.find(x=>x.id===state.selectedCar);
    $('shName').textContent = pt.name;
    $('shDist').textContent = pt.dist + 'm';
    $('shReward').textContent = '点亮 +' + pt.reward.exp + ' 经验 +' + pt.reward.gold + ' 金币';
    $('shTime').textContent = '约 ' + Math.ceil(pt.time/60) + ' 分钟';
    $('shCar').textContent = c.name + ' · ¥' + c.cost + '/场';
    $('sheet').classList.add('on');
  }
  function closeSheet(){ $('sheet').classList.remove('on'); }
  document.querySelector('#sheet .sheet-grip').addEventListener('click', closeSheet);
  document.addEventListener('click', e=>{
    if(!e.isTrusted) return; // 避免自动化事件误关
    if($('sheet').classList.contains('on') && !e.target.closest('#sheet') && !e.target.closest('.map-marker')) closeSheet();
  });

  $('shGo').addEventListener('click', ()=>{
    const c = cars.find(x=>x.id===state.selectedCar);
    if(!pendingPoint) return;
    // 真实支付：弹支付弹层（包含 ¥0 兜底：金币够时直接金币支付）
    openPayDialog({
      scene:'drive',
      amount: c.cost,
      title: c.name + ' · 一场',
      onPaid:()=>{
        // 支付完成回调：扣金币（如使用金币）/记录已支付标记，开始驾驶
        if(!pendingPoint) return;
        closeSheet();
        startDrive(pendingPoint, c);
      }
    });
  });

  // ===================== 通用弹窗 =====================
  function showDlg(opts){
    const box=$('fxLayer'); const dlg=$('fxDlg');
    $('fxTitle').textContent = opts.title || '';
    $('fxBody').textContent = opts.body || '';
    const rw=$('fxRewards'); rw.innerHTML='';
    if(opts.rewards){
      rw.innerHTML = `<span>经验 <b>+${opts.rewards.exp}</b></span><span>金币 <b>+${opts.rewards.gold}</b></span>`;
      rw.style.display = 'flex';
    } else rw.style.display='none';
    const btns=$('fxBtns'); btns.innerHTML='';
    if(opts.ok){
      const b = document.createElement('button'); b.className='btn btn-amber'; b.textContent=opts.ok;
      b.addEventListener('click', ()=>{ closeDlg(); if(opts.onOk) opts.onOk(); });
      btns.appendChild(b);
    }
    if(opts.cancel){
      const b = document.createElement('button'); b.className='btn btn-ghost'; b.textContent=opts.cancel;
      b.addEventListener('click', ()=>{ closeDlg(); if(opts.onCancel) opts.onCancel(); });
      btns.appendChild(b);
    }
    box.classList.add('on');
  }
  function closeDlg(){ $('fxLayer').classList.remove('on'); }
  $('fxDim').addEventListener('click', closeDlg);

  // ===================== 网络异常 4 级状态机（前置声明，驾驶舱依赖） =====================
  // 与产品说明书 3.2.6(1) 对齐：L1 轻微 / L2 明显 / L3 重连 / L4 失败
  // 原型用模拟器驱动：setNetMode('good'|'lag'|'loss'|'off')
  const net = {
    mode:'good',
    level:0,
    badFor:0,
    reconnectTries:0,
    reconnectMax:3,
    reconnectGap:2,
    payloadDelayMs:0,
    payloadLossPct:0
  };

  function setNetMode(m){
    net.mode = m;
    net.badFor = 0;
    net.reconnectTries = 0;
    net.level = 0;
    const w = $('ckNetWarn'); if(w) w.classList.remove('on','l2');
    const r = $('ckReconnect'); if(r) r.classList.remove('on');
    const f = $('ckNetFail'); if(f) f.classList.remove('on');
    if(typeof ckData !== 'undefined' && ckData){ ckData.speedLimit = 1; ckData.controlsLocked = false; }
    document.querySelectorAll('#ckNetDebug button').forEach(b=>{
      b.classList.toggle('active', b.dataset.net === m);
    });
  }

  function sampleNet(){
    if(net.mode === 'good'){ net.payloadDelayMs = 60 + Math.random()*40; net.payloadLossPct = 0; }
    else if(net.mode === 'lag'){ net.payloadDelayMs = 350 + Math.random()*200; net.payloadLossPct = 5 + Math.random()*5; }
    else if(net.mode === 'loss'){ net.payloadDelayMs = 150 + Math.random()*100; net.payloadLossPct = 30 + Math.random()*15; }
    else if(net.mode === 'off'){ net.payloadDelayMs = 9999; net.payloadLossPct = 100; }
  }

  function setLevel(L){
    if(net.level === L) return;
    net.level = L;
    if(L === 0){
      $('ckNetWarn') && $('ckNetWarn').classList.remove('on','l2');
      $('ckReconnect') && $('ckReconnect').classList.remove('on');
      if(typeof ckData !== 'undefined' && ckData){ ckData.speedLimit = 1; ckData.controlsLocked = false; }
      return;
    }
    if(L === 1){
      $('ckNetWarn') && $('ckNetWarn').classList.remove('l2');
      $('ckNetWarnTxt').textContent = '⚠️ 信号弱（' + Math.round(net.payloadDelayMs) + 'ms）';
      $('ckNetWarn') && $('ckNetWarn').classList.add('on');
      if(typeof ckData !== 'undefined' && ckData){ ckData.speedLimit = 1; ckData.controlsLocked = false; }
    }else if(L === 2){
      $('ckNetWarn') && $('ckNetWarn').classList.add('l2');
      $('ckNetWarnTxt').textContent = '⚠️ 信号不稳定，请注意驾驶（视频降质中）';
      if(typeof ckData !== 'undefined' && ckData){ ckData.speedLimit = 0.7; ckData.controlsLocked = false; }
    }else if(L === 3){
      $('ckNetWarn') && $('ckNetWarn').classList.remove('on');
      $('ckReconnect') && $('ckReconnect').classList.add('on');
      if(typeof ckData !== 'undefined' && ckData){
        ckData.speedLimit = 0;
        ckData.controlsLocked = true;
      }
    }else if(L === 4){
      $('ckReconnect') && $('ckReconnect').classList.remove('on');
      $('ckNetWarn') && $('ckNetWarn').classList.remove('on','l2');
      $('ckNetFail') && $('ckNetFail').classList.add('on');
      if(typeof ckData !== 'undefined' && ckData){ ckData.speedLimit = 0; ckData.controlsLocked = true; }
    }
  }

  function netTick(dt){
    if(typeof ckData === 'undefined' || !ckData || ckData.finished) return;
    sampleNet();
    const sig = $('hudSig');
    if(sig){
      const delay = Math.round(net.payloadDelayMs);
      sig.innerHTML = (delay>999 ? '断' : (delay>250?'4G·弱':'4G·低延迟')) + '<small>' + (delay>999?'':'ms') + '</small>';
      sig.style.color = delay>500 ? 'var(--bad)' : (delay>250 ? 'var(--amber)' : '');
    }
    if(net.mode === 'good'){
      if(net.level !== 0){ setLevel(0); }
      net.badFor = 0; net.reconnectTries = 0;
      return;
    }
    net.badFor += dt;
    const loss = net.payloadLossPct;
    const delay = net.payloadDelayMs;
    if(net.mode === 'off'){
      // 3 秒重连尝试 + 2 秒间隔 × 3
      const stage = Math.floor((net.badFor - 3) / net.reconnectGap) + 1;
      if(net.badFor < 3){
        setLevel(3); $('ckRecCnt').textContent = '1';
      }else if(stage >= 4){
        if(net.level !== 4) showFailAndEnd();
      }else{
        setLevel(3); $('ckRecCnt').textContent = String(Math.min(stage, 3));
      }
      return;
    }
    if(delay > 500 || loss > 20){
      if(net.badFor >= 3) setLevel(2);
      else setLevel(1);
    }else if(delay > 250){
      setLevel(1);
    }else{
      if(net.level !== 0) setLevel(0);
      net.badFor = 0;
    }
  }

  function showFailAndEnd(){
    setLevel(4);
    if(!ckData) return;
    const d = ckData;
    const paid = d.car.cost;
    // 按实际使用时长/30 分钟一局的比例退款
    const totalSec = 30 * 60;
    const ratio = Math.min(1, Math.max(0, d.driveSec / totalSec));
    const used = Math.round(paid * ratio);
    const refund = Math.max(0, paid - used);
    $('ckFailKm').textContent = Math.round(d.dist) + ' m';
    $('ckFailTime').textContent = Math.floor(d.driveSec) + ' 秒';
    $('ckFailPaid').textContent = '¥' + paid;
    $('ckFailRefund').textContent = refund > 0 ? ('¥' + refund) : '全额退款 ¥' + paid;
    state.gold += refund;
    state.coupons.push({
      id:'comp-' + Date.now().toString().slice(-6),
      title:'体验保障券（断线补偿）',
      discount:10, minCost:30,
      expireAt: Date.now() + 7*24*3600*1000, used:false,
      source:'fail',
      gotAt:Date.now()
    });
    state.orders.push({
      id:'D' + Date.now().toString().slice(-8),
      type:'drive', subtype:'断线退款',
      name: d.pt ? d.pt.name : '未知坐标',
      car: d.car.name, amount: paid,
      km: Math.round(d.dist), duration: Math.floor(d.driveSec),
      startAt: d.startAt, status:'refunded',
      exp:0, gold:refund
    });
    if(state.orders.length > 30) state.orders = state.orders.slice(-30);
    save(); renderAll();
  }

  function bindNetFailBtns(){
    $('ckFailHome') && $('ckFailHome').addEventListener('click', ()=>{
      $('ckNetFail').classList.remove('on');
      setNetMode('good');
      endDrive(false);
      showMain('map');
    });
    $('ckFailSupport') && $('ckFailSupport').addEventListener('click', ()=>{
      showDlg({
        title:'联系客服',
        body:'订单已记录，<b>7 天内</b>会有客服回访。<br>也可拨打 <b style="color:var(--amber)">400-xxx-xxxx</b>，或微信扫码加客服。',
        ok:'好的'
      });
    });
  }

  function bindNetDebug(){
    const wrap = $('ckNetDebug'); if(!wrap) return;
    wrap.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        setNetMode(btn.dataset.net);
        toast('🌐 网络模式：' + btn.textContent);
      });
    });
  }

  // ===================== 车端故障状态机（说明书 3.2.6(2)）=====================
  // 6 类：cam / imu / gps / motor / servo / flip
  // 严重度：low(imu/gps 提示) / mid(motor 5s 降速) / high(cam 10s 退全) / critical(servo/flip 立即退全)
  const ckFail = {
    type:null,         // 当前故障类型
    severity:null,     // low/mid/high/critical
    since:0,           // 故障发生时间
    countdownTimer:null,
    camRestoreAt:0     // 摄像头恢复倒计时
  };

  // 故障映射表
  const FAIL_TABLE = {
    cam:   { severity:'high',     label:'摄像头信号丢失', autoEndMs: 10000, refund:'full' },
    imu:   { severity:'low',      label:'IMU 数据异常',    autoEndMs: 0,     refund:'none' },
    gps:   { severity:'low',      label:'GPS 信号弱',      autoEndMs: 0,     refund:'none' },
    motor: { severity:'mid',      label:'电机温度过高',    autoEndMs: 5000,  refund:'none' },
    servo: { severity:'critical', label:'转向舵机故障',    autoEndMs: 3000,  refund:'full' },
    flip:  { severity:'critical', label:'车辆已翻覆',      autoEndMs: 3000,  refund:'full' }
  };

  function triggerCarFail(type){
    if(!ckData || ckData.finished) return;
    const info = FAIL_TABLE[type];
    if(!info) return;
    // 同一时刻只能一个故障（保留最严重的）
    if(ckFail.type && FAIL_TABLE[ckFail.type].severity === 'critical') return;
    if(info.severity === 'low' && ckFail.type) return; // 低优故障不打断其他
    ckFail.type = type;
    ckFail.severity = info.severity;
    ckFail.since = Date.now();
    showFailUI(type, info);
  }

  function showFailUI(type, info){
    // 清除所有故障层
    $('ckCamLost') && $('ckCamLost').classList.remove('on');
    $('ckMotorHot') && $('ckMotorHot').classList.remove('on');
    $('ckEmergency') && $('ckEmergency').classList.remove('on','vibrate');
    $('ckSensorWarn') && $('ckSensorWarn').classList.remove('on');
    if(ckFail.countdownTimer){ clearInterval(ckFail.countdownTimer); ckFail.countdownTimer=null; }
    if(ckData) ckData.speedLimit = 1;

    if(type === 'cam'){
      // 高：摄像头丢失 → 黑屏 + 减速 + 10s 退全
      $('ckCamLost') && $('ckCamLost').classList.add('on');
      if(ckData){ ckData.speedLimit = 0; ckData.controlsLocked = true; }
      startFailCountdown('cam', info.autoEndMs / 1000, ()=>{
        endOrderByFail(type, info);
      });
    }else if(type === 'imu'){
      // 低：IMU 异常 → 顶部提示（不影响驾驶）
      $('ckSensorTxt').textContent = '⚠️ IMU 数据异常 · 不影响驾驶';
      $('ckSensorWarn') && $('ckSensorWarn').classList.add('on');
      // 自动消失：6s 后自动隐藏（模拟传感器自恢复）
      setTimeout(()=>{ $('ckSensorWarn') && $('ckSensorWarn').classList.remove('on'); ckFail.type=null; }, 6000);
    }else if(type === 'gps'){
      $('ckSensorTxt').textContent = '⚠️ GPS 信号弱 · 轨迹可能不完整';
      $('ckSensorWarn') && $('ckSensorWarn').classList.add('on');
      setTimeout(()=>{ $('ckSensorWarn') && $('ckSensorWarn').classList.remove('on'); ckFail.type=null; }, 5000);
    }else if(type === 'motor'){
      // 中：电机过热 → 5s 倒计时 → 限速 50%
      $('ckMotorCnt').textContent = '5';
      $('ckMotorHot') && $('ckMotorHot').classList.add('on');
      startFailCountdown('motor', info.autoEndMs / 1000, ()=>{
        // 倒计时结束：限速 50%
        if($('ckMotorHot')) $('ckMotorHot').classList.remove('on');
        if(ckData) ckData.speedLimit = 0.5;
        toast('⚠️ 电机温度过高，已自动限速至 50%');
        // 模拟 10s 后温度回落，自动恢复
        setTimeout(()=>{
          if(ckData && ckFail.type === 'motor'){
            if(ckData.speedLimit === 0.5) ckData.speedLimit = 1;
            ckFail.type = null;
            toast('✅ 电机温度已回落，限速解除');
          }
        }, 10000);
      });
    }else if(type === 'servo'){
      // 紧急：舵机故障 → 红屏 + 3s 倒计时 + 持续震动
      $('ckEmTitle').textContent = '转向舵机故障';
      $('ckEmSub').textContent = '请立即停止驾驶 · 订单将自动结束并全额退款';
      $('ckEmCnt').textContent = '3';
      $('ckEmTip').textContent = '已赠送体验保障券（满 30 减 10，7 天有效）';
      $('ckEmergency') && $('ckEmergency').classList.add('on','vibrate');
      if(ckData){ ckData.speedLimit = 0; ckData.controlsLocked = true; }
      startFailCountdown('servo', info.autoEndMs / 1000, ()=>{
        endOrderByFail(type, info);
      });
    }else if(type === 'flip'){
      $('ckEmTitle').textContent = '车辆已翻覆';
      $('ckEmSub').textContent = '请保持安全 · 订单已自动结束并全额退款（非玩家过错）';
      $('ckEmCnt').textContent = '3';
      $('ckEmTip').textContent = '现场人员正在赶来救援 · 已赠送体验保障券';
      $('ckEmergency') && $('ckEmergency').classList.add('on','vibrate');
      if(ckData){ ckData.speedLimit = 0; ckData.controlsLocked = true; }
      startFailCountdown('flip', info.autoEndMs / 1000, ()=>{
        endOrderByFail(type, info);
      });
    }
  }

  function startFailCountdown(type, seconds, onExpire){
    if(ckFail.countdownTimer) clearInterval(ckFail.countdownTimer);
    let remain = Math.ceil(seconds);
    const updateEl = (type === 'cam') ? null : (type === 'motor' ? $('ckMotorCnt') : $('ckEmCnt'));
    if(updateEl) updateEl.textContent = remain;
    ckFail.countdownTimer = setInterval(()=>{
      remain--;
      if(remain <= 0){
        clearInterval(ckFail.countdownTimer); ckFail.countdownTimer = null;
        if(onExpire) onExpire();
      }else{
        if(updateEl) updateEl.textContent = remain;
      }
    }, 1000);
  }

  // 严重故障 → 结束订单 + 全额退款 + 补偿券
  function endOrderByFail(type, info){
    if(!ckData) return;
    if(ckFail.countdownTimer){ clearInterval(ckFail.countdownTimer); ckFail.countdownTimer=null; }
    const d = ckData;
    d.finished = true;
    cancelAnimationFrame(ckLoop); ckLoop = null;
    state.inDrive = false; state.currentPoint = null;
    state.totalKm += d.dist/1000;
    state.driveSec += Math.floor(d.driveSec);
    // 全额退款
    const paid = d.car.cost;
    state.gold += paid;
    // 补偿券
    state.coupons.push({
      id:'fail-' + Date.now().toString().slice(-6),
      title:'体验保障券（' + info.label + '补偿）',
      discount:10, minCost:30,
      expireAt: Date.now() + 7*24*3600*1000, used:false,
      source:'fail',
      gotAt:Date.now()
    });
    // 写订单
    state.orders.push({
      id:'D' + Date.now().toString().slice(-8),
      type:'drive', subtype:'故障退款-' + info.label,
      name: d.pt ? d.pt.name : '未知坐标',
      car: d.car.name, amount: paid,
      km: Math.round(d.dist), duration: Math.floor(d.driveSec),
      startAt: d.startAt, status:'refunded',
      exp:0, gold:paid
    });
    if(state.orders.length > 30) state.orders = state.orders.slice(-30);
    // 关闭所有故障 UI（保留"成功结束"提示）
    $('ckCamLost') && $('ckCamLost').classList.remove('on');
    $('ckMotorHot') && $('ckMotorHot').classList.remove('on');
    $('ckEmergency') && $('ckEmergency').classList.remove('on','vibrate');
    $('ckSensorWarn') && $('ckSensorWarn').classList.remove('on');
    // 弹"已全额退款"提示
    showDlg({
      title:'订单已全额退款',
      body:'因车辆' + info.label + '，本次订单已自动结束。<br>已退回 <b style="color:var(--gold)">¥' + paid + '</b> 金币，并赠送 1 张体验保障券。',
      ok:'返回地图',
      onOk:()=>{
        ckData = null;
        document.body.classList.remove('cockpit');
        $('ckView').classList.remove('on');
        save(); renderAll();
        showMain('map');
      }
    });
    save(); renderAll();
    ckFail.type = null;
    ckFail.severity = null;
  }

  function bindFailDebug(){
    const wrap = $('ckFailDebug'); if(!wrap) return;
    wrap.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const t = btn.dataset.fail;
        triggerCarFail(t);
      });
    });
  }

  // ===================== 地图 SDK 适配器（说明书 3.3 / V1.0）=====================
  // MapConfig: 配置入口（生产环境切换 provider）
  // - provider: 'sandbox' | 'amap' | 'qqmap' | 'baidu'
  // - mode: 'sandbox' | 'production'
  // ⚠️ 注意：地图 SDK key 必须放在后端 BFF，客户端不直接调地图 API
  const MapConfig = {
    mode: 'sandbox',                 // 'production' 时启用真实地图
    provider: 'sandbox',             // 'sandbox' | 'amap' | 'qqmap' | 'baidu'
    bffBase: '/api/map',             // 后端 BFF 地址
    // 沙箱：固定换电站列表（坐标为相对值，单位米）
    sandboxSwaps: [
      { id:'SW001', name:'田园站换电站', lng:120.123, lat:30.456, distM:300 },
      { id:'SW002', name:'翠竹路换电站', lng:120.130, lat:30.460, distM:520 },
      { id:'SW003', name:'南山服务区换电站', lng:120.115, lat:30.451, distM:680 }
    ],
    // 车辆当前位置（演示用）：田园站附近
    sandboxOrigin: { lng:120.123, lat:30.453 }
  };

  // 抽象基类
  class MapProvider {
    constructor(name){ this.name = name; }
    async getLocation(){ throw new Error('not implemented'); }
    async nearbySearch(opts){ throw new Error('not implemented'); }
    async route(opts){ throw new Error('not implemented'); }
    bearing(from, to){
      // Haversine bearing 计算（0-359°）
      const toRad = d => d * Math.PI / 180;
      const toDeg = r => r * 180 / Math.PI;
      const lat1 = toRad(from.lat), lat2 = toRad(to.lat);
      const dLon = toRad(to.lng - from.lng);
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      const brng = toDeg(Math.atan2(y, x));
      return (brng + 360) % 360;
    }
    distance(from, to){
      // Haversine 距离（米）
      const R = 6371000;
      const toRad = d => d * Math.PI / 180;
      const lat1 = toRad(from.lat), lat2 = toRad(to.lat);
      const dLat = toRad(to.lat - from.lat);
      const dLon = toRad(to.lng - from.lng);
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2)**2;
      return 2 * R * Math.asin(Math.sqrt(a));
    }
  }

  // 沙箱适配器（演示用）
  class SandboxMap extends MapProvider {
    constructor(){ super('sandbox'); }
    async getLocation(){
      await new Promise(r => setTimeout(r, 100));
      return { lng: MapConfig.sandboxOrigin.lng, lat: MapConfig.sandboxOrigin.lat, accuracy: 5 };
    }
    async nearbySearch(opts){
      await new Promise(r => setTimeout(r, 200));
      const from = opts.from;
      const list = MapConfig.sandboxSwaps.map(s => ({
        ...s,
        distance: this.distance(from, { lng: s.lng, lat: s.lat })
      })).sort((a,b) => a.distance - b.distance).slice(0, opts.limit || 3);
      return list;
    }
    async route(opts){
      await new Promise(r => setTimeout(r, 250));
      const dist = this.distance(opts.from, opts.to);
      // 假设平均车速 20 km/h = 5.5 m/s
      const durationSec = Math.round(dist / 5.5);
      const bearing = this.bearing(opts.from, opts.to);
      // 生成简化折线（演示用）
      const steps = 4;
      const polyline = [];
      for(let i=0; i<=steps; i++){
        const t = i / steps;
        polyline.push({
          lng: opts.from.lng + (opts.to.lng - opts.from.lng) * t,
          lat: opts.from.lat + (opts.to.lat - opts.from.lat) * t
        });
      }
      return {
        distance: dist,
        duration: durationSec,
        bearing,
        polyline,
        steps: [
          { instruction:'直行 ' + Math.round(dist/2) + 'm', dist: dist/2 },
          { instruction:'到达换电站', dist: 0 }
        ]
      };
    }
  }

  // 高德地图适配器（生产骨架，通过 BFF 调用避免 key 泄露）
  // 真实集成：高德 JSAPI 2.0 或 Web 服务 API
  class AmapProvider extends MapProvider {
    constructor(cfg){
      super('amap');
      // 注意：key 在 BFF 后端，客户端只调 BFF
      this.bffBase = cfg.bffBase || MapConfig.bffBase;
    }
    async getLocation(){
      // 通过 BFF 高德浏览器定位
      const resp = await fetch(this.bffBase + '/amap/locate', { credentials:'include' });
      const d = await resp.json();
      if(d.status !== '1') return { lng:0, lat:0, accuracy:0 };
      return { lng: parseFloat(d.location.lng), lat: parseFloat(d.location.lat), accuracy: 10 };
    }
    async nearbySearch(opts){
      // BFF 调高德 POI 搜索（汽车服务 / 换电站 type）
      const resp = await fetch(this.bffBase + '/amap/place/around', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          location: opts.from.lng + ',' + opts.from.lat,
          keywords: '换电站|充电站|新能源',
          type: '010100',  // 高德汽车服务
          radius: opts.radius || 3000,
          limit: opts.limit || 5
        })
      });
      const d = await resp.json();
      if(d.status !== '1') return [];
      return (d.pois || []).map(p => ({
        id: p.id,
        name: p.name,
        lng: parseFloat(p.location.lng),
        lat: parseFloat(p.location.lat),
        address: p.address,
        distance: parseFloat(p.distance) || 0
      })).sort((a,b) => a.distance - b.distance);
    }
    async route(opts){
      // BFF 调高德路径规划（驾车）
      const resp = await fetch(this.bffBase + '/amap/direction/driving', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          origin: opts.from.lng + ',' + opts.from.lat,
          destination: opts.to.lng + ',' + opts.to.lat
        })
      });
      const d = await resp.json();
      if(d.status !== '1' || !d.route) throw new Error('route failed');
      const r = d.route;
      return {
        distance: parseFloat(r.distance) * 1000,  // km → m
        duration: parseFloat(r.duration),          // 秒
        bearing: this.bearing(opts.from, opts.to),
        polyline: this._decodePolyline(r.polyline || ''),
        steps: (r.steps || []).map(s => ({ instruction: s.instruction, dist: parseFloat(s.distance) }))
      };
    }
    _decodePolyline(str){
      // 简化：实际应调 polyline 解码（高德用 'lng,lat;lng,lat' 格式）
      if(!str) return [];
      return str.split(';').map(seg => {
        const [lng, lat] = seg.split(',').map(Number);
        return { lng, lat };
      });
    }
  }

  // 腾讯地图适配器
  class QQMapProvider extends MapProvider {
    constructor(cfg){
      super('qqmap');
      this.bffBase = cfg.bffBase || MapConfig.bffBase;
    }
    async getLocation(){
      const resp = await fetch(this.bffBase + '/qqmap/locate', { credentials:'include' });
      const d = await resp.json();
      if(d.status !== 0) return { lng:0, lat:0, accuracy:0 };
      return { lng: d.result.location.lng, lat: d.result.location.lat, accuracy: 10 };
    }
    async nearbySearch(opts){
      const resp = await fetch(this.bffBase + '/qqmap/place/around', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          location: opts.from.lat + ',' + opts.from.lng,
          keywords: '换电站',
          radius: opts.radius || 3000
        })
      });
      const d = await resp.json();
      if(d.status !== 0) return [];
      return (d.data || []).map(p => ({
        id: p.id,
        name: p.title,
        lng: p.location.lng,
        lat: p.location.lat,
        address: p.address,
        distance: p._distance || 0
      }));
    }
    async route(opts){
      const resp = await fetch(this.bffBase + '/qqmap/direction/driving', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          from: opts.from.lat + ',' + opts.from.lng,
          to: opts.to.lat + ',' + opts.to.lng
        })
      });
      const d = await resp.json();
      if(d.status !== 0) throw new Error('route failed');
      return {
        distance: d.result.routes[0].distance,
        duration: d.result.routes[0].duration,
        bearing: this.bearing(opts.from, opts.to),
        polyline: this._decodeQQPolyline(d.result.routes[0].polyline),
        steps: []
      };
    }
    _decodeQQPolyline(polyline){
      // 腾讯 polyline 是压缩坐标数组
      // 简化：返回空（生产环境应调腾讯的 decode）
      return [];
    }
  }

  // 工厂
  function createMapProvider(){
    if(MapConfig.mode === 'production'){
      switch(MapConfig.provider){
        case 'amap':  return new AmapProvider(window.FD_MAP_CFG || {});
        case 'qqmap': return new QQMapProvider(window.FD_MAP_CFG || {});
        default:      return new SandboxMap();
      }
    }
    return new SandboxMap();
  }

  // 当前 provider 实例（单例）
  const mapProvider = createMapProvider();

  // 查找最近换电站（含路径）
  async function findNearestSwap(originLngLat){
    try{
      const from = originLngLat || await mapProvider.getLocation();
      const candidates = await mapProvider.nearbySearch({
        from: from,
        radius: 5000,
        limit: 5
      });
      if(!candidates || candidates.length === 0){
        // 沙箱兜底
        return { dist: BAT_CFG.swapDist, etaMin: BAT_CFG.swapTimeMin, swap:null };
      }
      // 选最近的，做路径规划
      const swap = candidates[0];
      let route = null;
      try{
        route = await mapProvider.route({ from, to: { lng: swap.lng, lat: swap.lat } });
      }catch(_){
        route = { distance: swap.distance, duration: 0, bearing: mapProvider.bearing(from, { lng: swap.lng, lat: swap.lat }) };
      }
      return {
        dist: Math.round(route.distance || swap.distance || 0),
        etaMin: Math.max(1, Math.round((route.duration || 0) / 60)),
        bearing: route.bearing || 0,
        swap: {
          id: swap.id,
          name: swap.name || '换电站',
          lng: swap.lng,
          lat: swap.lat,
          address: swap.address || ''
        },
        polyline: route.polyline || []
      };
    }catch(e){
      // 任何异常：兜底
      return { dist: BAT_CFG.swapDist, etaMin: BAT_CFG.swapTimeMin, swap:null };
    }
  }

  // 缓存换电站信息（避免重复请求）
  const swapCache = { data: null, ts: 0, ttlMs: 60000 };

  async function findNearestSwapCached(originLngLat){
    const now = Date.now();
    if(swapCache.data && (now - swapCache.ts) < swapCache.ttlMs){
      return swapCache.data;
    }
    const data = await findNearestSwap(originLngLat);
    swapCache.data = data;
    swapCache.ts = now;
    return data;
  }

  // 方向判断：车是否"远离换电站"
  function isMovingAway(fromCurr, fromPrev, toSwap){
    if(!fromPrev) return false;
    const dPrev = mapProvider.distance(fromPrev, toSwap);
    const dCurr = mapProvider.distance(fromCurr, toSwap);
    return dCurr > dPrev + 5; // 距离增加超过 5m 算远离
  }

  // ===================== 换电导航（说明书 3.3）=====================
  // 3 档阈值：< 25% 导航 / < 15% 龟速 / < 5% 趴窝
  const BAT_CFG = {
    navPct: 25,    // < 25% 显示导航
    slowPct: 15,   // < 15% 限速 30%
    deadPct: 5,     // < 5% 趴窝
    rescueFee: 30,  // 救援费
    swapDist: 300,  // 沙箱：换电站距离
    swapTimeMin: 2  // 沙箱：预计步行/叫拖车时间
  };

  // 沙箱：规划最近换电站（兼容同步旧调用）
  function findNearestSwapSync(){
    // 真实环境：调用地图 SDK（高德/百度）
    return { dist: BAT_CFG.swapDist, etaMin: BAT_CFG.swapTimeMin };
  }

  // 计算"剩余续航"（分钟）：粗略 = 电量% × 5 分钟
  function estimateRemainMin(battery){
    return Math.max(0, Math.floor(battery / 100 * 5 * 60) / 60);
  }

  const batNav = {
    level: 0,           // 0 正常 / 1 导航 / 2 龟速 / 3 趴窝
    swap: null,
    countdownTimer: null,
    userConfirmedDead: false
  };

  function setBatteryLevel(L){
    if(batNav.level === L) return;
    batNav.level = L;
    // 清除所有弹层
    $('ckBatNav') && $('ckBatNav').classList.remove('on');
    $('ckLowBat') && $('ckLowBat').classList.remove('on');
    $('ckDead') && $('ckDead').classList.remove('on');
    if(batNav.countdownTimer){ clearInterval(batNav.countdownTimer); batNav.countdownTimer=null; }
    if(!ckData) return;
    if(L === 1){
      // 导航条：异步规划（含路径）
      $('ckBatNav') && $('ckBatNav').classList.add('on');
      if(ckData) ckData.speedLimit = 1; // 不限速
      findNearestSwapCached().then(swap=>{
        if(batNav.level !== 1) return; // 用户已切档
        batNav.swap = swap;
        const sub = swap.swap ? swap.swap.name + ' · 约 ' + swap.dist + 'm · 预计 ' + swap.etaMin + ' 分钟'
          : '约 ' + swap.dist + 'm · 预计 ' + swap.etaMin + ' 分钟';
        $('ckBatNavSub').textContent = sub;
        // 箭头方向：从车到换电站
        if(swap.bearing !== undefined){
          const arrows = ['⬆','↗','➡','↘','⬇','↙','⬅','↖'];
          const idx = Math.round(swap.bearing / 45) % 8;
          $('ckBatNavArrow').textContent = arrows[idx];
        }
      });
    }else if(L === 2){
      // 龟速
      $('ckLowBat') && $('ckLowBat').classList.add('on');
      if(ckData) ckData.speedLimit = 0.3;
      findNearestSwapCached().then(swap=>{
        if(batNav.level !== 2) return;
        batNav.swap = swap;
        $('ckLowBatPct').textContent = Math.round(ckData.battery) + '%';
        $('ckLowBatDist').textContent = swap.dist + 'm';
        $('ckLowBatMin').textContent = estimateRemainMin(ckData.battery);
      });
    }else if(L === 3){
      // 趴窝
      const d = ckData;
      $('ckDeadPaid').textContent = '¥' + d.car.cost;
      // 救援确认前不退款
      $('ckDeadRefund').textContent = '¥0';
      $('ckDeadFee').textContent = '¥' + BAT_CFG.rescueFee;
      $('ckDeadCnt').textContent = '10';
      $('ckDead') && $('ckDead').classList.add('on');
      if(ckData){ ckData.speedLimit = 0; ckData.controlsLocked = true; }
      // 10s 倒计时：默认救援
      let remain = 10;
      batNav.userConfirmedDead = false;
      batNav.countdownTimer = setInterval(()=>{
        remain--;
        $('ckDeadCnt').textContent = remain;
        if(remain <= 0){
          clearInterval(batNav.countdownTimer); batNav.countdownTimer = null;
          if(!batNav.userConfirmedDead) confirmRescue();
        }
      }, 1000);
    }
  }

  // 每帧检查电量阈值（由 netTick 旁边或独立调用）
  function checkBattery(dt){
    if(!ckData || ckData.finished) return;
    const b = ckData.battery;
    // 注意：如果用户在龟速/趴窝后速度被限为 0，battery 不再下降（已停止）
    if(b >= BAT_CFG.navPct && batNav.level > 0){
      setBatteryLevel(0);
    }else if(b < BAT_CFG.deadPct && batNav.level !== 3){
      setBatteryLevel(3);
    }else if(b < BAT_CFG.slowPct && batNav.level < 2){
      setBatteryLevel(2);
    }else if(b < BAT_CFG.navPct && batNav.level === 0){
      setBatteryLevel(1);
    }
    // 沙箱模拟：每帧更新车位置（locX/locY += 速度方向）
    if(batNav.level !== 3){ // 趴窝时不移动
      // 简化：车以 speedLimit 系数向"前方"移动
      const speed = (ckData.speed || 0) * 0.1;
      ckData.locX += speed * (Math.random() > 0.5 ? 1 : -0.3); // 30% 概率往反方向开（制造"不听话"）
      ckData.locY += speed * 0.6;
    }
    // 不听话乱开检测：< 15% 状态下，距离换电站 > 上一次距离
    if(batNav.level >= 1 && batNav.swap && batNav.swap.swap && ckData.prevLocation){
      const dCurr = Math.hypot(ckData.locX - batNav.swap.swap.lng * 1000, ckData.locY - batNav.swap.swap.lat * 1000);
      const dPrev = Math.hypot(ckData.prevLocation.x - batNav.swap.swap.lng * 1000, ckData.prevLocation.y - batNav.swap.swap.lat * 1000);
      if(dCurr > dPrev + 10){
        // 触发"乌龟模式"：速度进一步限制
        if(ckData.speedLimit > 0.15){
          ckData.speedLimit = 0.15;
          toast('🐢 检测到您远离换电站，已开启乌龟模式');
        }
      }
    }
    ckData.prevLocation = { x: ckData.locX, y: ckData.locY };
    // HUD 电量更新
    $('ckBatNavBat') && (b >= 0) && ($('ckBatNavBat').textContent = Math.round(b) + '%');
  }

  // 用户选择"确认救援"
  function confirmRescue(){
    batNav.userConfirmedDead = true;
    if(batNav.countdownTimer){ clearInterval(batNav.countdownTimer); batNav.countdownTimer=null; }
    // 救援费：按实际使用时长/30 分钟一局的比例分摊 → 全额 = 救援费
    // V1.0 简化：救援费 ¥30 直接扣金币
    const fee = BAT_CFG.rescueFee;
    if(state.gold >= fee){
      state.gold -= fee;
      toast('🛻 已呼叫救援，扣 ¥' + fee + ' 金币');
    }else{
      toast('🛻 已呼叫救援（金币不足，救援费挂账）');
    }
    endDrive(false);
    $('ckDead').classList.remove('on');
    setBatteryLevel(0);
    showMain('map');
  }

  // 用户选择"直接结束（不退款）"
  function endDirectNoRefund(){
    batNav.userConfirmedDead = true;
    if(batNav.countdownTimer){ clearInterval(batNav.countdownTimer); batNav.countdownTimer=null; }
    endDrive(false);
    $('ckDead').classList.remove('on');
    setBatteryLevel(0);
    showMain('map');
    toast('已结束订单 · 车辆等待现场回收');
  }

  function bindBatteryDebug(){
    const wrap = $('ckBatDebug'); if(!wrap) return;
    wrap.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(!ckData) return;
        const v = btn.dataset.bat;
        if(v === 'full'){ ckData.battery = 95; setBatteryLevel(0); toast('🔋 满电'); }
        else if(v === 'low'){ ckData.battery = 20; setBatteryLevel(1); toast('⚡ 低电（导航）'); }
        else if(v === 'critical'){ ckData.battery = 12; setBatteryLevel(2); toast('🐢 龟速模式'); }
        else if(v === 'dead'){ ckData.battery = 3; setBatteryLevel(3); toast('🪫 触发趴窝'); }
      });
    });
    $('ckLowBatOk') && $('ckLowBatOk').addEventListener('click', ()=>{
      toast('🧭 已规划路径到最近换电站 · 300m');
      $('ckLowBat') && $('ckLowBat').classList.remove('on');
    });
    $('ckDeadRescue') && $('ckDeadRescue').addEventListener('click', confirmRescue);
    $('ckDeadEnd') && $('ckDeadEnd').addEventListener('click', endDirectNoRefund);
  }

  // ===================== 每日签到 =====================
  // 7 天奖励阶梯（每天 1 次）
  const SIGN_REWARDS = [
    { day:1, gold:50,  coupon:0 },
    { day:2, gold:50,  coupon:0 },
    { day:3, gold:80,  coupon:{ discount:5, minCost:20, title:'签到奖励券' } },
    { day:4, gold:80,  coupon:0 },
    { day:5, gold:100, coupon:0 },
    { day:6, gold:100, coupon:{ discount:5, minCost:20, title:'签到奖励券' } },
    { day:7, gold:200, coupon:{ discount:10, minCost:30, title:'签到 7 日奖' } }
  ];

  // 判断今天是否已签
  function isTodaySigned(){
    if(!state.signLastTs) return false;
    const last = new Date(state.signLastTs);
    const now = new Date();
    return last.getFullYear() === now.getFullYear()
      && last.getMonth() === now.getMonth()
      && last.getDate() === now.getDate();
  }

  // 判断连签是否断了（>24h 未签 → 重置）
  function isStreakBroken(){
    if(!state.signLastTs) return false;
    return (Date.now() - state.signLastTs) > 24*3600*1000;
  }

  // 计算当前"应签第几天"（1-7）
  function getCurrentSignDay(){
    if(state.signStreak === 0) return 1;
    return ((state.signStreak - 1) % 7) + 1; // 已签 N 天，下次应签第 (N%7)+1
  }

  // 主入口：打开签到弹层
  function openSignView(){
    renderSignGrid();
    $('signView').classList.add('on');
  }
  function closeSignView(){
    $('signView').classList.remove('on');
  }

  // 渲染 7 日日历
  function renderSignGrid(){
    const grid = $('signGrid'); if(!grid) return;
    grid.innerHTML = '';
    const today = new Date();
    const todayStr = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    const todaySigned = isTodaySigned();
    // 计算"当前应签第几天"
    const todayDay = isStreakBroken() ? 1 : getCurrentSignDay();
    // 显示最近 7 天的状态（含今天）
    // 为了让 UI 显示真实日历，取最近 7 天的签到状态
    // 这里简化为：按"第 N 天"显示单元格，最近 7 天 = 当前周期的 day 1-7
    const now = new Date();
    const dayMs = 24*3600*1000;
    for(let i = 0; i < 7; i++){
      const cell = document.createElement('div');
      const day = i + 1;
      const reward = SIGN_REWARDS[i];
      cell.className = 'sign-cell';
      // 已签状态：根据 signLog 推算（最近 7 天）
      const isDone = (function(){
        if(state.signLog.length === 0) return false;
        if(isStreakBroken()) return false;
        // 当前应签 = todayDay，已签的应该是 day 1..(todayDay-1)
        return day < todayDay;
      })();
      const isToday = (day === todayDay);
      if(isDone) cell.classList.add('done');
      if(isToday && !todaySigned) cell.classList.add('today');
      if(isToday && todaySigned) cell.classList.add('done');
      let rewardHtml = '';
      if(reward.gold > 0) rewardHtml += '+' + reward.gold + ' 金币';
      if(reward.coupon) rewardHtml += '<br><span class="reward coupon">+' + reward.coupon.discount + ' 元券</span>';
      cell.innerHTML = '<div class="day">Day ' + day + '</div><div class="reward">' + rewardHtml + '</div>';
      grid.appendChild(cell);
    }
    // 顶部连签 + 状态
    const streak = isStreakBroken() ? 0 : state.signStreak;
    $('signStreak').textContent = '连签 ' + streak + ' 天';
    $('signStat').textContent = '本周累计 +' + sumSignWeekGold() + ' 金币 · ' + sumSignWeekCoupons() + ' 张券';
    // 按钮
    const btn = $('signBtn');
    if(todaySigned){
      btn.textContent = '✅ 今日已签到';
      btn.classList.add('done-c');
      btn.disabled = true;
    }else{
      btn.textContent = '立即签到 · 领 ' + rewardTextOf(todayDay);
      btn.classList.remove('done-c');
      btn.disabled = false;
    }
  }

  function rewardTextOf(day){
    const r = SIGN_REWARDS[day - 1];
    let s = r.gold + ' 金币';
    if(r.coupon) s += ' + ¥' + r.coupon.discount + ' 券';
    return s;
  }
  function sumSignWeekGold(){
    const week = state.signLog.slice(-7);
    return week.reduce((s,r)=>s + (r.reward.gold||0), 0);
  }
  function sumSignWeekCoupons(){
    const week = state.signLog.slice(-7);
    return week.reduce((s,r)=>s + (r.reward.coupon?1:0), 0);
  }

  // 签到动作
  function doSign(){
    if(isTodaySigned()){ toast('今天已签到啦'); return; }
    const day = isStreakBroken() ? 1 : getCurrentSignDay();
    const reward = SIGN_REWARDS[day - 1];
    // 入账
    state.gold += reward.gold;
    if(reward.coupon){
      state.coupons.push({
        id:'sign-' + Date.now().toString().slice(-6),
        title: reward.coupon.title + '（Day ' + day + '）',
        discount: reward.coupon.discount,
        minCost: reward.coupon.minCost,
        expireAt: Date.now() + 7*24*3600*1000,
        used:false,
        source:'sign',
        gotAt: Date.now()
      });
    }
    // 写日志
    state.signLog.push({
      day: day,
      ts: Date.now(),
      reward:{ gold:reward.gold, coupon:reward.coupon }
    });
    if(state.signLog.length > 30) state.signLog = state.signLog.slice(-30);
    // 连签数 +1
    state.signStreak = (isStreakBroken() ? 0 : state.signStreak) + 1;
    state.signLastTs = Date.now();
    save(); renderAll();
    renderSignGrid();
    toast('✅ 签到成功 +' + reward.gold + ' 金币' + (reward.coupon ? ' + ¥' + reward.coupon.discount + ' 券' : ''));
  }

  $('signBtn') && $('signBtn').addEventListener('click', doSign);
  $('signBack') && $('signBack').addEventListener('click', closeSignView);

  // 任务页签到入口
  function refreshTaskSignEntry(){
    const btn = $('taskSignBtn');
    const sub = $('taskSignSub');
    if(!btn) return;
    const todaySigned = isTodaySigned();
    const streak = isStreakBroken() ? 0 : state.signStreak;
    if(todaySigned){
      btn.textContent = '✅ 已签到';
      btn.classList.add('done-c');
    }else{
      btn.textContent = '去签到';
      btn.classList.remove('done-c');
    }
    if(sub){
      if(streak === 0 && !todaySigned) sub.textContent = '今天未签 · 立即开启连签';
      else if(todaySigned) sub.textContent = '连签 ' + streak + ' 天 · 今日已领';
      else sub.textContent = '连签 ' + streak + ' 天 · 今日未签';
    }
  }
  $('taskSignBtn') && $('taskSignBtn').addEventListener('click', openSignView);

  // ===================== 邀请好友 =====================
  // 双向奖励规则
  const INVITE_REWARD = {
    invitee: {                   // 被邀请人（新用户）获得
      gold: 100,
      coupon: { discount:10, minCost:30, title:'邀请好友体验券' },
      expireDays: 7
    },
    inviter: {                   // 邀请人获得
      gold: 200,
      exp: 50,
      seasonPts: 15,
      coupon: { discount:10, minCost:30, title:'邀请好友体验券' },
      expireDays: 7
    },
    monthlyLimit: 20             // 每月最多邀请 20 人（防刷）
  };

  // 校验邀请码格式
  function isValidInviteCode(code){
    if(!code) return false;
    return /^FD\d{6}$/.test(String(code).trim().toUpperCase());
  }

  // 规范化邀请码
  function normInviteCode(code){
    return String(code||'').trim().toUpperCase();
  }

  // 生成 ¥10 体验券快照
  function makeInviteCoupon(sourceTag){
    return {
      id: 'invite-' + Date.now().toString().slice(-8) + '-' + Math.floor(Math.random()*100000).toString().padStart(5,'0'),
      title: '邀请好友体验券',
      discount: 10, minCost: 30,
      expireAt: Date.now() + 7*24*3600*1000,
      used: false, source: 'invite',
      gotAt: Date.now(),
      gotFromCode: sourceTag || ''
    };
  }

  // 计算本月已邀请次数
  function monthlyInviteCount(){
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return (state.invites||[]).filter(i => i.time >= monthStart).length;
  }

  // 应用邀请码（注册时）：新用户视角
  function applyInviteCode(code){
    if(!code) return { ok:false, reason:'empty' };
    code = normInviteCode(code);
    if(!isValidInviteCode(code)) return { ok:false, reason:'invalid' };
    if(state.inviteUsedCode) return { ok:false, reason:'used-before' };
    if(code === state.inviteCode) return { ok:false, reason:'self' };

    // 沙箱：直接接受；真实环境应调后端校验邀请码是否注册过 / 已存在
    // 1) 给当前用户（新用户）发奖励
    state.inviteUsedCode = code;
    state.gold += INVITE_REWARD.invitee.gold;
    state.coupons.push(makeInviteCoupon(code));

    // 2) 写邀请记录
    state.invites.push({
      inviteeCode: code,           // 对方邀请码（即"邀请人"标识）
      inviteeId: null,            // 沙箱：对方真实 ID 留空
      direction: 'in',             // 方向：被邀请
      status: 'rewarded',          // 已发奖励
      gold: INVITE_REWARD.invitee.gold,
      exp: 0,
      seasonPts: 0,
      couponGiven: true,
      couponCount: 1,
      time: Date.now()
    });

    // 3) 沙箱：模拟"邀请人"实时收到奖励回调
    // 真实环境：后端异步推送 / WebSocket 通知邀请人
    simulateInviterReward(code);
    save(); renderAll();
    return { ok:true };
  }

  // 沙箱后端：模拟邀请人收到奖励（被邀请人输入邀请码后）
  function simulateInviterReward(inviteeCode){
    // 在沙箱中，"邀请人"可以是当前用户之外的任意注册用户
    // 这里演示：如果当前用户就是邀请人（自邀请场景的相反路径）：
    // - 用 state.inviteCode 反向邀请自己 → 不触发
    // - 我们用一个独立的"模拟邀请人"数据结构记录
    // 真实环境：后端会找到该邀请码对应的真实用户账号，给 ta 发奖励
    // 原型演示：把奖励记到 state.invitesOut（发出的邀请）的最新一条上
    const outList = state.invitesOut = state.invitesOut || [];
    outList.push({
      inviteeName: '用户·' + inviteeCode.slice(-4),  // 沙箱：用邀请码后 4 位模拟
      inviteeCode: inviteeCode,
      direction: 'out',                               // 方向：邀请出去
      status: 'rewarded',
      gold: INVITE_REWARD.inviter.gold,
      exp: INVITE_REWARD.inviter.exp,
      seasonPts: INVITE_REWARD.inviter.seasonPts,
      couponGiven: true,
      couponCount: 1,
      time: Date.now()
    });
    // 注意：实际后端会给"邀请码拥有者"加金币；这里只做记录展示
    // 不直接修改 state.gold（避免逻辑混乱：演示者不是真邀请人）
  }

  // 邀请子面板渲染
  function renderInvitePanel(){
    // 邀请码
    $('inviteCodeVal').textContent = state.inviteCode;
    // 邀请统计（我邀请了别人）
    const outs = (state.invitesOut || []);
    const inList = (state.invites || []).filter(i => i.direction === 'in');
    $('inviteCnt').textContent = outs.length;        // 我邀请了多少人
    $('inviteCouponCnt').textContent = outs.length;   // 累计获得券数（每邀请 1 人 1 张）
    // 累计奖励
    const outGold = outs.reduce((s,i)=>s+(i.gold||0), 0);
    const outExp = outs.reduce((s,i)=>s+(i.exp||0), 0);
    const outSeason = outs.reduce((s,i)=>s+(i.seasonPts||0), 0);
    if($('inviteGoldTotal')) $('inviteGoldTotal').textContent = '+' + outGold;
    if($('inviteExpTotal')) $('inviteExpTotal').textContent = '+' + outExp;
    if($('inviteSeasonTotal')) $('inviteSeasonTotal').textContent = '+' + outSeason;
    // 本月剩余
    const remain = Math.max(0, INVITE_REWARD.monthlyLimit - monthlyInviteCount());
    if($('inviteLimit')) $('inviteLimit').textContent = '本月还可邀请 ' + remain + ' 人';
    // 邀请明细列表（最近 10 条）
    const list = $('inviteList'); if(list){
      if(outs.length === 0){
        list.innerHTML = '<div class="me-empty" style="padding:18px 14px;">还没邀请过朋友 · 分享上方邀请码开启奖励 ✨</div>';
      }else{
        list.innerHTML = '';
        outs.slice().reverse().slice(0, 10).forEach(i=>{
          const div = document.createElement('div');
          div.className = 'invite-row';
          div.innerHTML =
            '<div class="invite-avatar">' + (i.inviteeName||'?').slice(-1) + '</div>' +
            '<div class="invite-row-mid">' +
              '<div class="invite-row-name">' + i.inviteeName + '</div>' +
              '<div class="invite-row-time">' + fmtInviteTime(i.time) + ' · <span class="invite-row-st">已发奖</span></div>' +
            '</div>' +
            '<div class="invite-row-rw">' +
              '<b>+¥' + (i.gold||0) + '</b>' +
              (i.exp?'<small>+'+i.exp+'经验</small>':'') +
              '<small>+¥10 券</small>' +
            '</div>';
          list.appendChild(div);
        });
      }
    }
  }

  function fmtInviteTime(ts){
    if(!ts) return '-';
    const d = new Date(ts);
    const pad = n => String(n).padStart(2,'0');
    return (d.getMonth()+1) + '/' + d.getDate() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  $('inviteCopyBtn') && $('inviteCopyBtn').addEventListener('click', ()=>{
    try{
      if(navigator.clipboard){
        navigator.clipboard.writeText(state.inviteCode);
        toast('✅ 邀请码已复制');
      }else{
        toast('请手动复制：' + state.inviteCode);
      }
    }catch(_){ toast('请手动复制：' + state.inviteCode); }
  });
  document.querySelectorAll('.invite-share-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const t = btn.dataset.share;
      if(t === 'wechat'){
        toast('💬 请复制邀请码通过微信分享');
      }else if(t === 'link'){
        try{
          const link = 'https://fardrive.cn/invite/' + state.inviteCode;
          if(navigator.clipboard){
            navigator.clipboard.writeText(link);
            toast('✅ 邀请链接已复制');
          }else{
            toast('链接：' + link);
          }
        }catch(_){ toast('请手动复制链接'); }
      }else if(t === 'poster'){
        toast('🖼️ 海报功能开发中');
      }
    });
  });

  // 登录页输入邀请码弹窗
  $('loginInvite') && $('loginInvite').addEventListener('click', ()=>{
    // 已用过：直接展示已用邀请码
    if(state.inviteUsedCode){
      showDlg({
        title:'已使用过邀请码',
        body:'<div style="font-size:12px;color:var(--muted);line-height:1.7;text-align:left;">你已使用过邀请码：<br><b style="color:var(--amber);font-family:DIN Alternate,monospace;letter-spacing:.08em;">' + state.inviteUsedCode + '</b><br>每位新用户只能使用一次。</div>',
        ok:'好的'
      });
      return;
    }
    showDlg({
      title:'输入好友邀请码',
      body:'<div style="font-size:12px;color:var(--muted);line-height:1.7;text-align:left;">' +
        '🎁 你将获得：<b style="color:var(--gold)">+' + INVITE_REWARD.invitee.gold + ' 金币</b> + 1 张 <b style="color:var(--amber)">满 30 减 10</b> 体验券<br>' +
        '🎁 好友将获得：<b style="color:var(--gold)">+' + INVITE_REWARD.inviter.gold + ' 金币 + ' + INVITE_REWARD.inviter.exp + ' 经验 + 15 段位分</b> + 1 张体验券<br>' +
        '<input id="inviteInp" type="text" placeholder="FD123456" maxlength="8" style="width:100%;margin-top:14px;padding:11px 12px;background:var(--panel);border:1px solid var(--line);border-radius:10px;color:var(--ink);font-size:15px;font-family:DIN Alternate,monospace;letter-spacing:.1em;text-align:center;text-transform:uppercase;text-transform:uppercase;"></div>',
      ok:'使用邀请码',
      cancel:'暂不',
      onOk:()=>{
        const v = ($('inviteInp') && $('inviteInp').value || '').trim();
        if(!v){ toast('请输入邀请码'); return; }
        const r = applyInviteCode(v);
        if(r.ok){
          toast('✅ 邀请码生效 · +' + INVITE_REWARD.invitee.gold + ' 金币 + ¥10 券');
        }else{
          const msg = {
            'empty':'请输入邀请码',
            'invalid':'邀请码格式无效（应为 FD + 6 位数字）',
            'used-before':'已使用过邀请码',
            'self':'不能使用自己的邀请码'
          }[r.reason] || '邀请码无效';
          toast(msg);
        }
      }
    });
  });

  // 紧急弹窗按钮
  $('ckEmConfirm') && $('ckEmConfirm').addEventListener('click', ()=>{
    const info = FAIL_TABLE[ckFail.type];
    if(info) endOrderByFail(ckFail.type, info);
  });
  $('ckEmReport') && $('ckEmReport').addEventListener('click', ()=>{
    showDlg({
      title:'一键报修',
      body:'故障已自动上报至加盟商，<b>2 小时内</b>会有维修人员联系。<br>车端状态已锁定，订单已自动结束。',
      ok:'好的'
    });
  });
  $('ckMotorNow') && $('ckMotorNow').addEventListener('click', ()=>{
    if(ckFail.countdownTimer){ clearInterval(ckFail.countdownTimer); ckFail.countdownTimer=null; }
    $('ckMotorHot') && $('ckMotorHot').classList.remove('on');
    if(ckData) ckData.speedLimit = 0.5;
    toast('⚠️ 已立即降速至 50%');
  });

  // ===================== 驾驶舱（方向盘式） =====================
  let ckLoop=null, ckData=null;
  let cockpitBound = false; // 一次性绑定守卫
  let cockpitShared = null; // 跨多次 startDrive 共享的状态（dragging 等）

  function startDrive(pt, car){
    state.inDrive = true; state.currentPoint = pt;
    document.body.classList.add('cockpit');
    $('ckView').classList.add('on');

    ckData = {
      pt:pt, car:car,
      speed:0, dist:0, steer:0, gas:0, brake:0,
      battery:100, maxSpd:0, combo:1, comboTimer:0,
      total:pt.dist, topSpeed:0, startAt:Date.now(),
      finished:false, estopped:false, driveSec:0,
      speedLimit:1,        // 网络异常时调整：L2=0.7, L3/L4=0
      controlsLocked:false, // 网络异常时锁定操控
      // 换电导航字段
      prevLocation: null,   // 上一次位置（用于判断"远离换电站"）
      locX: 0,               // 沙箱模拟坐标 X（米）
      locY: 0                // 沙箱模拟坐标 Y（米）
    };
    // 沙箱：随机初始化车位置
    ckData.locX = (Math.random() - 0.5) * 100;  // ±50m
    ckData.locY = (Math.random() - 0.5) * 100;

    $('ckT1').textContent = '田园站 · 黑暗森林';
    $('ckT2').textContent = pt.name;
    $('ckT3').textContent = '目标 ' + pt.dist + 'm · 奖励 +' + pt.reward.exp + ' 经验';
    $('hudBat').innerHTML = '100<small>%</small>';
    $('hudTime').textContent = '0:00';
    $('hudSpeed').innerHTML = '0<small>km/h</small>';
    $('comboVal').textContent = '×1';
    $('gasLvl').textContent = '0';
    $('ckDone').classList.remove('on');
    $('ckBanner').classList.remove('on');
    $('ckEStopActive') && $('ckEStopActive').classList.remove('on');
    $('ckEStop') && $('ckEStop').classList.remove('ck-estop-pressing','ck-estop-armed');

    bindCockpit();      // 内部用 cockpitBound 守卫，只生效一次
    // 网络异常：每次进入驾驶舱重置
    if(typeof setNetMode === 'function') setNetMode('good');
    if(typeof bindNetDebug === 'function') bindNetDebug();
    if(typeof bindNetFailBtns === 'function') bindNetFailBtns();
    if(typeof bindFailDebug === 'function') bindFailDebug();
    if(typeof bindBatteryDebug === 'function') bindBatteryDebug();
    ckLoop = requestAnimationFrame(driveTick);
  }

  function bindCockpit(){
    if(cockpitBound) return;
    cockpitBound = true;
    cockpitShared = { dragging:false, startX:0, startA:0, steerInt:null };

    // 方向盘拖拽
    const wb=$('wheelBase'), w=$('wheel');
    function setSteer(angle){
      if(!ckData) return;
      ckData.steer = clamp(angle,-45,45);
      if(w) w.style.transform = 'rotate(' + ckData.steer + 'deg)';
    }
    function onMove(e){
      if(!cockpitShared.dragging) return;
      const x = (e.touches?e.touches[0].clientX:e.clientX);
      // 限制单次变化速率：单帧最多 ±5°，防猛划
      const target = cockpitShared.startA + (x-cockpitShared.startX)*0.4;
      const cur = ckData ? ckData.steer : 0;
      const next = clamp(target, cur-5, cur+5);
      setSteer(next);
    }
    function onEnd(){ cockpitShared.dragging=false; setSteer(0); }
    wb.addEventListener('mousedown', e=>{ cockpitShared.dragging=true; cockpitShared.startX=e.clientX; cockpitShared.startA=ckData?ckData.steer:0; });
    wb.addEventListener('touchstart', e=>{ cockpitShared.dragging=true; cockpitShared.startX=e.touches[0].clientX; cockpitShared.startA=ckData?ckData.steer:0; }, {passive:false});
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, {passive:false});
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);

    // 方向按钮
    $('steerL').addEventListener('touchstart', e=>{ e.preventDefault(); autoSteer(-1); });
    $('steerL').addEventListener('mousedown', e=>{ autoSteer(-1); });
    $('steerR').addEventListener('touchstart', e=>{ e.preventDefault(); autoSteer(1); });
    $('steerR').addEventListener('mousedown', e=>{ autoSteer(1); });

    function autoSteer(dir){
      if(cockpitShared.steerInt) clearInterval(cockpitShared.steerInt);
      setSteer(dir*45);
      cockpitShared.steerInt=setInterval(()=>setSteer(ckData?ckData.steer*0.92:0),50);
      setTimeout(()=>{clearInterval(cockpitShared.steerInt);setSteer(0);},600);
    }

    // 踏板
    bindPedal($('gas'), 'gas');
    bindPedal($('brake'), 'brake');
    function bindPedal(el, key){
      const down=e=>{ e.preventDefault(); el.classList.add('down'); if(ckData){ if(key==='gas') ckData.gas=1; else ckData.brake=1; } };
      const up=e=>{ e.preventDefault(); el.classList.remove('down'); if(ckData){ if(key==='gas') ckData.gas=0; else ckData.brake=0; } };
      el.addEventListener('mousedown', down);
      el.addEventListener('touchstart', down, {passive:false});
      el.addEventListener('mouseup', up);
      el.addEventListener('touchend', up);
      el.addEventListener('mouseleave', up);
    }

    // 退出 / 急停（长按1秒，防误触）
    $('ckQuit').addEventListener('click', ()=>{
      if(!ckData || ckData.finished) return;
      showDlg({title:'结束驾驶？', body:'退出后本次驾驶不会获得坐标点亮奖励。', ok:'结束', cancel:'继续驾驶', onOk:endDrive});
    });
    bindEStop();
    $('ckBackMap').addEventListener('click', ()=>{ endDrive(false); showMain('map'); });
    $('ckAgain').addEventListener('click', ()=>{ if(ckData) startDrive(ckData.pt, ckData.car); });
  }

  // 紧急制动：长按 1 秒触发，与产品说明书 3.2.5(3) 一致
  let eStopTimer=null, eStopStartAt=0, eStopHolding=false;
  function bindEStop(){
    const btn = $('ckEStop'), arc = $('ckEStopArc');
    if(!btn || btn._estopBound) return; btn._estopBound = true;
    const DASH = 163.36; // 2π·r ≈ 163.36
    let rafId = null;
    function tickArc(){
      if(!eStopHolding){ arc.setAttribute('stroke-dashoffset', DASH); return; }
      const p = Math.min(1, (Date.now()-eStopStartAt)/1000);
      arc.setAttribute('stroke-dashoffset', DASH * (1-p));
      if(p < 1) rafId = requestAnimationFrame(tickArc);
    }
    function start(e){
      if(e){ e.preventDefault(); }
      if(ckData && ckData.finished) return;
      if(ckData && ckData.estopped) return; // 已制动状态，长按=解除
      eStopHolding = true; eStopStartAt = Date.now();
      btn.classList.add('ck-estop-pressing');
      rafId = requestAnimationFrame(tickArc);
      eStopTimer = setTimeout(triggerEStop, 1000);
    }
    function cancel(){
      eStopHolding = false;
      if(eStopTimer){ clearTimeout(eStopTimer); eStopTimer=null; }
      btn.classList.remove('ck-estop-pressing');
      arc.setAttribute('stroke-dashoffset', DASH);
      if(rafId){ cancelAnimationFrame(rafId); rafId=null; }
    }
    function triggerEStop(){
      if(!ckData) return;
      ckData.estopped = true;
      ckData.speed = 0;
      btn.classList.remove('ck-estop-pressing');
      btn.classList.add('ck-estop-armed');
      const banner = $('ckEStopActive');
      if(banner) banner.classList.add('on');
      toast('🛑 紧急制动已触发');
    }
    function releaseEStop(){
      if(!ckData || !ckData.estopped) return;
      ckData.estopped = false;
      btn.classList.remove('ck-estop-armed');
      const banner = $('ckEStopActive');
      if(banner) banner.classList.remove('on');
      toast('✅ 已解除紧急制动');
    }
    // 鼠标
    btn.addEventListener('mousedown', start);
    window.addEventListener('mouseup', ()=>{
      if(eStopHolding && ckData && ckData.estopped){ releaseEStop(); }
      cancel();
    });
    // 触屏
    btn.addEventListener('touchstart', start, {passive:false});
    btn.addEventListener('touchend', (e)=>{ e.preventDefault();
      if(eStopHolding && ckData && ckData.estopped){ releaseEStop(); }
      cancel();
    }, {passive:false});
    btn.addEventListener('touchcancel', cancel);
    // 离开按钮区域也算取消
    btn.addEventListener('mouseleave', ()=>{
      if(eStopHolding && (!ckData || !ckData.estopped)) cancel();
    });
  }

  function driveTick(){
    if(!ckData) return;
    const d = ckData;
    const dt = 1/60; // 真实帧时长
    d.driveSec += dt;

    // 物理模拟：速度
    const car = d.car;
    const speedLimit = (typeof d.speedLimit === 'number') ? d.speedLimit : 1;
    const target = d.estopped ? 0 : (d.gas * car.speed * 0.48 * speedLimit * (0.6 + 0.4*(1-Math.abs(d.steer)/45)));
    const accel = (d.gas ? car.acc * 0.07 : (d.brake ? -180 : -28));
    d.speed = clamp(d.speed + accel*dt, 0, target);
    if(d.brake && d.speed>0) d.speed = Math.max(0, d.speed - 140*dt);
    // 网络异常时强制减速（L2 限速 70%；L3/L4 直接刹停）
    if(speedLimit === 0 && d.speed > 0){
      d.speed = Math.max(0, d.speed - 80*dt);
    }
    d.topSpeed = Math.max(d.topSpeed, d.speed);

    // 里程（km/h → m/s：/3.6），游戏化加速 12x 让单点驾驶 4-6 秒完成
    d.dist += (d.speed / 3.6) * dt * 12;

    // 电量消耗
    d.battery -= d.speed*dt*0.004 + 0.01;
    if(d.battery<0) d.battery=0;

    // 连击：连续给油 3s ×2, 6s ×3
    if(d.gas>0.1) d.comboTimer += dt; else d.comboTimer = Math.max(0, d.comboTimer - dt*2);
    const prev = d.combo;
    d.combo = d.comboTimer > 6 ? 3 : (d.comboTimer > 3 ? 2 : 1);
    if(d.combo > prev && d.combo > 1) showBanner('连击 ×' + d.combo + ' · 金币加成 +' + ((d.combo-1)*15) + '%');

    // HUD
    $('hudSpeed').innerHTML = Math.round(d.speed) + '<small>km/h</small>';
    $('hudBat').innerHTML = Math.round(d.battery) + '<small>%</small>';
    const used = Math.floor(d.driveSec);
    $('hudTime').textContent = Math.floor(used/60) + ':' + String(used%60).padStart(2,'0');
    $('comboVal').textContent = '×' + d.combo;
    $('gasLvl').textContent = Math.round(d.gas*100);

    // 坐标抵达
    if(d.dist >= d.total && !d.finished) finishDrive(true);
    else if(d.battery <= 0 && !d.finished) finishDrive(false);

    // 网络异常状态机
    if(typeof netTick === 'function') netTick(dt);
    // 换电导航状态机
    if(typeof checkBattery === 'function') checkBattery(dt);

    ckLoop = requestAnimationFrame(driveTick);
  }

  function showBanner(txt){
    const b=$('ckBanner'); b.textContent=txt; b.classList.add('on');
    setTimeout(()=>b.classList.remove('on'), 1600);
  }

  function finishDrive(success){
    const d = ckData; d.finished=true;
    cancelAnimationFrame(ckLoop); ckLoop=null;
    state.inDrive=false; state.currentPoint=null;
    state.totalKm += d.dist/1000;
    state.driveSec += Math.floor(d.driveSec);

    // 写入订单历史
    const order = {
      id: 'D' + Date.now().toString().slice(-8),
      type:'drive',
      subtype: success ? '坐标点亮' : '电量耗尽',
      name: d.pt ? d.pt.name : '未知坐标',
      car: d.car.name,
      amount: d.car.cost,
      km: Math.round(d.dist),
      duration: Math.floor(d.driveSec),
      startAt: d.startAt,
      status: success ? 'done' : 'done'
    };

    if(success && d.pt && !state.lit.includes(d.pt.id)){
      state.lit.push(d.pt.id);
      const rew = d.pt.reward;
      const bonus = 1 + (d.combo-1)*0.15;
      const eg = Math.round(rew.exp * bonus);
      const gg = Math.round(rew.gold * bonus);
      addReward(eg, gg);

      order.exp = eg; order.gold = gg;

      $('ckDoneTitle').textContent = '坐标点亮成功';
      $('ckDoneSub').textContent = d.pt.name;
      $('sKm').textContent = (d.dist/1000).toFixed(2) + ' km';
      $('sTop').textContent = Math.round(d.topSpeed) + ' km/h';
      $('sCombo').textContent = '×' + d.combo;
      $('sReward').textContent = '+' + eg + ' 经验 · +' + gg + ' 金币';
      $('ckDone').classList.add('on');
      showBanner('🎯 坐标点亮成功！');
    } else if (!success) {
      order.exp = 0; order.gold = 0;
      $('ckDoneTitle').textContent = '电量耗尽';
      $('ckDoneSub').textContent = '车辆已自动停靠，请返回地图';
      $('sReward').textContent = '本次未获得坐标奖励';
      $('ckDone').classList.add('on');
    }
    state.orders.push(order);
    // 只保留最近 30 笔
    if(state.orders.length > 30) state.orders = state.orders.slice(-30);
    save(); renderAll();
  }

  // 主动结束驾驶：写入订单（仅按行驶比例退款，未抵达不奖励）
  function endDrive(reward=true){
    closeDlg();
    if(!ckData) return;
    const d=ckData;
    if(!d.finished && reward){
      state.totalKm += d.dist/1000;
      state.driveSec += Math.floor(d.driveSec);
    }
    // 未完成的驾驶也写一笔订单（标记为'canceled'），方便玩家回溯
    if(!d.finished){
      state.orders.push({
        id: 'D' + Date.now().toString().slice(-8),
        type:'drive',
        subtype:'主动结束',
        name: d.pt ? d.pt.name : '未知坐标',
        car: d.car.name,
        amount: d.car.cost,
        km: Math.round(d.dist),
        duration: Math.floor(d.driveSec),
        startAt: d.startAt,
        status:'canceled',
        exp:0, gold:0
      });
      if(state.orders.length > 30) state.orders = state.orders.slice(-30);
    }
    state.inDrive=false; state.currentPoint=null;
    cancelAnimationFrame(ckLoop);
    document.body.classList.remove('cockpit');
    $('ckView').classList.remove('on');
    ckData=null; save(); renderAll();
  }

  // ===================== 双人竞速 =====================
  let raceLoop=null, raceData=null;
  const opNames = ['夜风车神','山丘之王','电量告急','沙丘行者','森林幽灵'];
  function updateRaceLobby(){
    $('rWins').textContent = state.wins;
    $('rPts').textContent = fmt(state.seasonPts);
    $('rNeed').textContent = (3 - (state.wins % 3)) + ' 胜';
    const c = cars.find(x=>x.id===state.selectedCar);
    $('meRankCar').textContent = c ? c.name : '';
    $('meRankPts').textContent = fmt(state.seasonPts);
  }

  function openRaceLobby(){
    $('raceView').classList.add('on');
    document.body.classList.add('racing');
    $('raceLobby').classList.add('on');
    $('raceStage').classList.remove('on');
    $('raceMatching').classList.remove('on');
    $('raceDone').classList.remove('on');
  }

  $('raceStart').addEventListener('click', startRaceMatch);

  function startRaceMatch(){
    $('raceLobby').classList.remove('on');
    $('raceMatching').classList.add('on');
    const op = opNames[Math.floor(Math.random()*opNames.length)];
    $('rmOp').textContent = op;
    setTimeout(()=>{
      $('raceMatching').classList.remove('on');
      startRaceRun(op);
    }, 1800);
  }

  function startRaceRun(opName){
    $('raceStage').classList.add('on');
    const c = cars.find(x=>x.id===state.selectedCar);
    $('raceModeTag').textContent = c.name + ' vs 对手';
    $('lMeName').textContent = '我 · ' + c.name;
    $('lOpName').textContent = opName + ' · 卡丁车';
    $('raceTimer').textContent = '0:00';
    $('barMe').textContent='0m'; $('barOp').textContent='0m';
    $('barMe').style.width='0%'; $('barOp').style.width='0%';
    $('posMe').textContent='角逐中'; $('posOp').textContent='领先';

    raceData = {
      me:{pos:0, speed:0}, op:{pos:0, speed:0},
      total:1000,
      // AI 难度匹配：玩家车型 speed 越高，opSpdBase 越高
      // speed 范围约 55~95 → opSpdBase 约 38~52，叠加波动给玩家一定空间
      opSpdBase: 30 + c.speed * 0.22 + (Math.random()*4-2),
      start:Date.now(), running:true, holding:false, won:false
    };
    bindRace();
    raceLoop = requestAnimationFrame(raceTick);
  }

  function bindRace(){
    const hold = $('raceHold');
    const start = e=>{ e.preventDefault(); raceData.holding=true; hold.classList.add('down'); };
    const end = e=>{ e.preventDefault(); raceData.holding=false; hold.classList.remove('down'); };
    hold.addEventListener('mousedown', start);
    hold.addEventListener('touchstart', start, {passive:false});
    hold.addEventListener('mouseup', end);
    hold.addEventListener('touchend', end);
    hold.addEventListener('mouseleave', end);
  }

  function raceTick(){
    if(!raceData || !raceData.running) return;
    const r = raceData; const dt=1/60;
    const c = cars.find(x=>x.id===state.selectedCar);
    const elapsed = (Date.now() - r.start)/1000;

    // 玩家：按住冲刺快速前进，车辆性能影响速度倍率
    const carMul = 0.85 + c.speed/200 + c.acc/300; // 约 1.0 ~ 1.4
    const meRate = r.holding ? (0.32 * carMul) : 0.05;
    r.me.speed = r.holding ? (c.speed * 0.45) : Math.max(0, r.me.speed - 80*dt);
    r.me.pos = Math.min(r.total, r.me.pos + r.total * meRate * dt);

    // 对手 AI：基准来自车型匹配的 opSpdBase，叠加 6 秒长波 + 抖动
    const wave = Math.sin(elapsed/6) * 0.05 + Math.sin(elapsed*7.3) * 0.02;
    const opRate = (r.opSpdBase / 1000) * (1 + wave);
    r.op.speed = r.opSpdBase * (0.85 + 0.15 * Math.sin(elapsed*4.1));
    r.op.pos = Math.min(r.total, r.op.pos + r.total * opRate * dt);

    $('raceTimer').textContent = Math.floor(elapsed/60) + ':' + String(Math.floor(elapsed%60)).padStart(2,'0');
    $('lMeSpd').textContent = Math.round(r.me.speed) + ' km/h';
    $('lOpSpd').textContent = Math.round(r.op.speed) + ' km/h';

    const pctMe = Math.min(100, r.me.pos/r.total*100);
    const pctOp = Math.min(100, r.op.pos/r.total*100);
    $('barMe').style.width = pctMe + '%'; $('barMe').textContent = Math.round(r.me.pos) + 'm';
    $('barOp').style.width = pctOp + '%'; $('barOp').textContent = Math.round(r.op.pos) + 'm';

    const meLead = r.me.pos >= r.op.pos;
    $('posMe').textContent = meLead ? '领先' : '追赶';
    $('posOp').textContent = meLead ? '追赶中' : '领先';

    if(r.me.pos >= r.total || r.op.pos >= r.total){
      r.won = r.me.pos >= r.op.pos;
      finishRace(r.won, elapsed);
      return;
    }
    raceLoop = requestAnimationFrame(raceTick);
  }

  function finishRace(won, sec){
    if(!raceData) return; raceData.running=false;
    cancelAnimationFrame(raceLoop);

    // 比赛任务进度由 state.wins 自动满足，领取仍需用户在任务页手动点击

    if(won){
      state.wins++; state.raceStreak++; state.seasonPts += 25;
      const gold = 500;
      state.gold += gold;
      toast('🏆 双人赛获胜 +500 金币');
    } else {
      state.raceStreak = 0;
      // 输了不再扣段位分（产品要求：输了保留积分，鼓励复玩）
      // 段位分只通过胜场累积增长
    }
    // 写入订单历史
    const c = cars.find(x=>x.id===state.selectedCar);
    state.orders.push({
      id: 'R' + Date.now().toString().slice(-8),
      type:'race',
      name: '双人赛·' + c.name + ' vs ' + (raceData.opName || '对手'),
      car: c.name,
      amount: 0, // 比赛免费入场（奖金池另算）
      won: won,
      opponent: raceData.opName || '对手',
      startAt: raceData.start,
      duration: Math.floor(sec),
      km: 1000, // 比赛固定 1000m
      status: 'done'
    });
    if(state.orders.length > 30) state.orders = state.orders.slice(-30);
    save();

    // 结算后刷新 UI：让任务/成就/排行同步最新状态
    renderAll();

    $('raceStage').classList.remove('on');
    $('raceDone').classList.add('on');
    $('rdTitle').textContent = won ? '比赛获胜' : '惜败';
    $('rdSub').textContent = '用时 ' + (Math.floor(sec/60)?Math.floor(sec/60)+':':'') + String(Math.floor(sec%60)).padStart(2,'0');
    $('rdRank').textContent = won ? '第 1 名' : '第 2 名';
    $('rdPool').textContent = won ? '+500 金币' : '+0 金币';
    $('rdPts').textContent = won ? '+25' : '+0（输了不扣段位，再来！）';
    $('rdTier').textContent = won
      ? '距白银 Ⅰ 晋级还差 ' + Math.max(0, 3-(state.wins%3)) + ' 胜'
      : '段位分不变 · 再来一局';
  }

  $('raceRetry').addEventListener('click', startRaceMatch);
  function closeRaceView(){
    if(raceData && raceData.running){ raceData.running=false; cancelAnimationFrame(raceLoop); }
    $('raceView').classList.remove('on');
    document.body.classList.remove('racing');
    showMain('race'); // 回到比赛标签页，展示大厅
  }
  $('raceExit').addEventListener('click', closeRaceView);
  $('raceBack').addEventListener('click', closeRaceView);
  $('raceBack2').addEventListener('click', closeRaceView);

  // ===================== Coach Marks 新手引导 =====================
  const coachSteps = [
    {
      title:'选一个坐标出发',
      body:'点击地图上任意一个会闪烁的光点，查看坐标详情。距离你越近越安全，越远奖励越丰厚。',
      spot:()=>{
        const el = document.querySelector('.map-marker.open');
        return el ? el.getBoundingClientRect() : null;
      },
      cardPos:'bottom'
    },
    {
      title:'确认出发',
      body:'点击底部面板的"出发·点亮坐标"按钮。本次将消耗对应金币，驾驶完成后可获得奖励。',
      spot:()=>{
        const el = $('shGo');
        if(!el || !$('sheet').classList.contains('on')) return null;
        return el.getBoundingClientRect();
      },
      requireOpenSheet:true,
      cardPos:'top'
    },
    {
      title:'完成任务赚金币',
      body:'金币不足？去"任务"页完成每日任务，首驾、点亮坐标、参加比赛都能领金币。',
      spot:()=>{
        const el = document.querySelector('#appTabs [data-tab="tasks"]');
        return el ? el.getBoundingClientRect() : null;
      },
      cardPos:'top'
    }
  ];
  let coachIdx = 0;

  function startCoach(){
    coachIdx = 0;
    showCoachStep();
  }
  function endCoach(){
    state._coachDone = true; save();
    $('coachMask').classList.remove('on');
    $('coachSpot').style.display = 'none';
  }
  function showCoachStep(){
    const step = coachSteps[coachIdx];
    const mask = $('coachMask');
    const spot = $('coachSpot');
    const card = $('coachCard');

    // 第 2 步要求 sheet 已打开；如果没打开就自动帮用户打开 sheet
    if(step.requireOpenSheet && !$('sheet').classList.contains('on')){
      const next = mapPoints.find(pt => !state.lit.includes(pt.id));
      if(next){
        showMain('map');
        openPoint(next);
        // 等待 sheet 出现
        setTimeout(showCoachStep, 280);
        return;
      }
    }
    // 第 3 步自动切到地图 Tab
    if(coachIdx === 2 && !$('scr-main').classList.contains('on')){
      showMain('map');
    }

    const r = step.spot ? step.spot() : null;
    if(!r){
      // 元素未就绪（罕见），跳到下一步
      coachIdx++;
      if(coachIdx >= coachSteps.length){ endCoach(); return; }
      showCoachStep();
      return;
    }
    // 放置高亮框
    spot.style.display = 'block';
    spot.style.left = (r.left - 8) + 'px';
    spot.style.top = (r.top - 8) + 'px';
    spot.style.width = (r.width + 16) + 'px';
    spot.style.height = (r.height + 16) + 'px';

    // 放置说明卡片（顶部 / 底部）
    const pad = 16;
    if(step.cardPos === 'top'){
      card.style.top = 'auto';
      card.style.bottom = (window.innerHeight - r.top + pad) + 'px';
    }else{
      card.style.bottom = 'auto';
      card.style.top = (r.top + r.height + pad) + 'px';
      // 防止超出屏幕
      if(parseInt(card.style.top) + 200 > window.innerHeight){
        card.style.top = (window.innerHeight - 220) + 'px';
      }
    }

    $('coachStep').textContent = '第 ' + (coachIdx+1) + ' 步 / 共 ' + coachSteps.length + ' 步';
    $('coachTitle').textContent = step.title;
    $('coachBody').textContent = step.body;
    // 更新圆点
    document.querySelectorAll('#coachDots .d').forEach((d,i)=>{
      d.classList.toggle('on', i === coachIdx);
    });
    $('coachNext').textContent = coachIdx === coachSteps.length-1 ? '开始探索 →' : '下一步 →';

    mask.classList.add('on');

    // 在第 2 步：用户实际点 sheet 出发按钮后，提前结束引导
    if(step.requireOpenSheet){
      const shGo = $('shGo');
      const onGoClick = ()=>{
        shGo.removeEventListener('click', onGoClick);
        setTimeout(endCoach, 600);
      };
      shGo.addEventListener('click', onGoClick);
    }
  }

  $('coachNext').addEventListener('click', ()=>{
    coachIdx++;
    if(coachIdx >= coachSteps.length){ endCoach(); return; }
    showCoachStep();
  });
  // 点击 mask 空白区也进入下一步（更宽松的引导）
  $('coachMask').addEventListener('click', (e)=>{
    if(e.target.id === 'coachMask'){
      coachIdx++;
      if(coachIdx >= coachSteps.length){ endCoach(); return; }
      showCoachStep();
    }
  });

  // ===================== 启动 =====================
  renderAll();

})();
