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
    selectedCar:'212'
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
    document.querySelector('#appTabs [data-tab="'+tab+'"]').classList.add('on');
    const panelId = 'pn' + (tab[0].toUpperCase()+tab.slice(1));
    const panel = $(panelId);
    if(panel) panel.classList.add('on');
    renderAll();
  }

  document.querySelectorAll('#appTabs button').forEach(btn=>{
    const tab = btn.dataset.tab;
    if(tab === 'drive' || tab === 'race') return; // 由下方单独处理
    btn.addEventListener('click', ()=>{
      // 从比赛视图返回时关闭浮层
      $('raceView').classList.remove('on');
      document.body.classList.remove('racing');
      showMain(tab);
    });
  });

  // 驾驶 Tab：提示先去地图选坐标
  const driveTabBtn = document.querySelector('#appTabs [data-tab="drive"]');
  driveTabBtn.addEventListener('click', e=>{
    e.stopPropagation();
    showMain('map');
    toast('👆 先在地图点一个坐标出发');
  });

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
  }
  $('loginBtn').addEventListener('click', doLogin);
  $('loginSkip').addEventListener('click', ()=>{ showMain('map'); toast('👋 游客模式体验'); });
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
      el.addEventListener('click', ()=> openPoint(pt));
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

  function renderAll(){ renderPlayer(); renderMap(); renderCars(); renderTasks(); renderAch(); updateRaceLobby(); }

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
    if(state.gold < c.cost){ toast('💰 金币不足，去完成任务赚金币'); closeSheet(); showMain('tasks'); return; }
    state.gold -= c.cost;
    save(); renderPlayer();
    closeSheet();
    startDrive(pendingPoint, c);
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

  // ===================== 驾驶舱（方向盘式） =====================
  let ckLoop=null, ckData=null;
  function startDrive(pt, car){
    state.inDrive = true; state.currentPoint = pt;
    document.body.classList.add('cockpit');
    $('ckView').classList.add('on');

    ckData = {
      pt:pt, car:car,
      speed:0, dist:0, steer:0, gas:0, brake:0,
      battery:100, maxSpd:0, combo:1, comboTimer:0,
      total:pt.dist, topSpeed:0, startAt:Date.now(),
      finished:false, estopped:false, driveSec:0
    };

    $('ckT1').textContent = '田园站 · 黑暗森林';
    $('ckT2').textContent = pt.name;
    $('ckT3').textContent = '目标 ' + pt.dist + 'm · 奖励 +' + pt.reward.exp + ' 经验';
    $('hudBat').innerHTML = '100<small>%</small>';
    $('hudTime').textContent = '0:00';
    $('ckDone').classList.remove('on');
    $('ckBanner').classList.remove('on');

    bindCockpit();
    ckLoop = requestAnimationFrame(driveTick);
  }

  function bindCockpit(){
    // 方向盘拖拽
    const wb=$('wheelBase'), w=$('wheel');
    let dragging=false, startX=0, startA=0;
    function setSteer(angle){ // angle -45..45
      if(!ckData) return;
      ckData.steer = clamp(angle,-45,45);
      if(w) w.style.transform = 'rotate(' + ckData.steer + 'deg)';
    }
    function onMove(e){ if(!dragging) return; const x = (e.touches?e.touches[0].clientX:e.clientX); setSteer(startA + (x-startX)*0.4); }
    function onEnd(){ dragging=false; setSteer(0); }
    wb.addEventListener('mousedown', e=>{ dragging=true; startX=e.clientX; startA=ckData.steer; });
    wb.addEventListener('touchstart', e=>{ dragging=true; startX=e.touches[0].clientX; startA=ckData.steer; }, {passive:false});
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, {passive:false});
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);

    // 方向按钮
    $('steerL').addEventListener('touchstart', e=>{ e.preventDefault(); autoSteer(-1); });
    $('steerL').addEventListener('mousedown', e=>{ autoSteer(-1); });
    $('steerR').addEventListener('touchstart', e=>{ e.preventDefault(); autoSteer(1); });
    $('steerR').addEventListener('mousedown', e=>{ autoSteer(1); });

    let steerInt=null;
    function autoSteer(dir){ if(steerInt) clearInterval(steerInt); setSteer(dir*45); steerInt=setInterval(()=>setSteer(ckData.steer*0.92),50); setTimeout(()=>{clearInterval(steerInt);setSteer(0);},600); }

    // 踏板
    bindPedal($('gas'), 'gas');
    bindPedal($('brake'), 'brake');
    function bindPedal(el, key){
      const down=e=>{ e.preventDefault(); el.classList.add('down'); if(key==='gas') ckData.gas=1; else ckData.brake=1; };
      const up=e=>{ e.preventDefault(); el.classList.remove('down'); if(key==='gas') ckData.gas=0; else ckData.brake=0; };
      el.addEventListener('mousedown', down);
      el.addEventListener('touchstart', down, {passive:false});
      el.addEventListener('mouseup', up);
      el.addEventListener('touchend', up);
      el.addEventListener('mouseleave', up);
    }

    // 退出 / 急停
    $('ckQuit').addEventListener('click', ()=>{
      if(ckData.finished) return;
      showDlg({title:'结束驾驶？', body:'退出后本次驾驶不会获得坐标点亮奖励。', ok:'结束', cancel:'继续驾驶', onOk:endDrive});
    });
    $('ckEStop').addEventListener('click', ()=>{ ckData.estopped=true; ckData.speed=0; toast('🛑 紧急制动'); });
    $('ckBackMap').addEventListener('click', ()=>{ endDrive(false); showMain('map'); });
    $('ckAgain').addEventListener('click', ()=>{ endDrive(false); startDrive(ckData.pt, ckData.car); });
  }

  function driveTick(){
    if(!ckData) return;
    const d = ckData;
    const dt = 1/60; // 真实帧时长
    d.driveSec += dt;

    // 物理模拟：速度
    const car = d.car;
    const target = d.estopped ? 0 : (d.gas * car.speed * 0.48 * (0.6 + 0.4*(1-Math.abs(d.steer)/45)));
    const accel = (d.gas ? car.acc * 0.07 : (d.brake ? -180 : -28));
    d.speed = clamp(d.speed + accel*dt, 0, target);
    if(d.brake && d.speed>0) d.speed = Math.max(0, d.speed - 140*dt);
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

    // 任务累计（驾驶秒数取整累计）

    if(success && d.pt && !state.lit.includes(d.pt.id)){
      state.lit.push(d.pt.id);
      const rew = d.pt.reward;
      const bonus = 1 + (d.combo-1)*0.15;
      const eg = Math.round(rew.exp * bonus);
      const gg = Math.round(rew.gold * bonus);
      addReward(eg, gg);

      $('ckDoneTitle').textContent = '坐标点亮成功';
      $('ckDoneSub').textContent = d.pt.name;
      $('sKm').textContent = (d.dist/1000).toFixed(2) + ' km';
      $('sTop').textContent = Math.round(d.topSpeed) + ' km/h';
      $('sCombo').textContent = '×' + d.combo;
      $('sReward').textContent = '+' + eg + ' 经验 · +' + gg + ' 金币';
      $('ckDone').classList.add('on');
      showBanner('🎯 坐标点亮成功！');
    } else if (!success) {
      $('ckDoneTitle').textContent = '电量耗尽';
      $('ckDoneSub').textContent = '车辆已自动停靠，请返回地图';
      $('sReward').textContent = '本次未获得坐标奖励';
      $('ckDone').classList.add('on');
    }
    save(); renderAll();
  }

  function endDrive(reward=true){
    closeDlg();
    if(!ckData) return;
    const d=ckData;
    if(!d.finished && reward){
      state.totalKm += d.dist/1000;
      state.driveSec += Math.floor(d.driveSec);
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
      total:1000, opSpdBase: 42 + Math.random()*6,
      opAccel: 6 + Math.random()*5,
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

    // 玩家：按住冲刺快速前进，车辆性能影响速度倍率
    const carMul = 0.85 + c.speed/200 + c.acc/300; // 约 1.0 ~ 1.4
    const meRate = r.holding ? (0.32 * carMul) : 0.05; // 每秒进度 %（按住约 3-5 秒完赛）
    r.me.speed = r.holding ? (c.speed * 0.45) : Math.max(0, r.me.speed - 80*dt);
    r.me.pos = Math.min(r.total, r.me.pos + r.total * meRate * dt);

    // 对手 AI：适度波动，给玩家获胜空间
    const opRate = 0.18 + 0.09*Math.sin(Date.now()/600); // 每秒进度 %
    r.op.speed = r.opSpdBase * (0.8 + 0.2*Math.sin(Date.now()/500));
    r.op.pos = Math.min(r.total, r.op.pos + r.total * opRate * dt);

    const elapsed = (Date.now() - r.start)/1000;
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
      state.raceStreak = 0; state.seasonPts = Math.max(0, state.seasonPts-10);
    }
    save();

    $('raceStage').classList.remove('on');
    $('raceDone').classList.add('on');
    $('rdTitle').textContent = won ? '比赛获胜' : '惜败';
    $('rdSub').textContent = '用时 ' + (Math.floor(sec/60)?Math.floor(sec/60)+':':'') + String(Math.floor(sec%60)).padStart(2,'0');
    $('rdRank').textContent = won ? '第 1 名' : '第 2 名';
    $('rdPool').textContent = won ? '+500 金币' : '+0 金币';
    $('rdPts').textContent = won ? '+25' : '-10';
    $('rdTier').textContent = '距白银 Ⅰ 晋级还差 ' + Math.max(0, 3-(state.wins%3)) + ' 胜';
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

  // ===================== 启动 =====================
  renderAll();

})();
