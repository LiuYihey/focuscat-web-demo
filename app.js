/* =========================================================
 * FocusCat Web Demo · app.js
 * 1:1 翻译自 Android Compose 端逻辑，保留视频轮播、首帧占位、
 *    径向渐变边缘柔化、好感度系统、专注模式、统计图表等所有细节
 * ========================================================= */

'use strict';

// ========== 数据模型 ==========
const CAT_BREEDS = {
  orange: {
    breedId: 'orange',
    displayName: '橘猫',
    description: '憨厚贪吃，亲和力满分，永远在等下一顿',
    idleVideos: [
      'assets/videos/idle/orange.mp4',
      'assets/videos/idle/orange_伸懒腰.mp4',
      'assets/videos/idle/orange_蝴蝶.mp4',
      'assets/videos/idle/orange_踩奶.mp4'
    ],
    eatingVideo: 'assets/videos/eating/orange.mp4',
    focusVideo: 'assets/videos/focus/orange.mp4',
    fallbackImage: 'assets/cats/orange.png'
  },
  ragdoll: {
    breedId: 'ragdoll',
    displayName: '布偶',
    description: '蓝眼温柔，粘人治愈，专注路上的最佳搭档',
    idleVideos: [
      'assets/videos/idle/ragdoll.mp4',
      'assets/videos/idle/ragdoll_伸懒腰.mp4',
      'assets/videos/idle/ragdoll_蝴蝶.mp4',
      'assets/videos/idle/ragdoll_踩奶.mp4'
    ],
    eatingVideo: 'assets/videos/eating/ragdoll.mp4',
    focusVideo: 'assets/videos/focus/ragdoll.mp4',
    fallbackImage: 'assets/cats/ragdoll.png'
  }
};

const FOODS = [
  { foodId: '猫粮', displayName: '猫粮', rarity: 'common', affinityBonus: 1, icon: 'assets/foods/猫粮.png' },
  { foodId: '冻干', displayName: '冻干', rarity: 'rare',   affinityBonus: 3, icon: 'assets/foods/冻干.png' },
  { foodId: '酸奶', displayName: '酸奶', rarity: 'rare',   affinityBonus: 3, icon: 'assets/foods/酸奶.png' },
  { foodId: '罐头', displayName: '罐头', rarity: 'epic',   affinityBonus: 5, icon: 'assets/foods/罐头.png' }
];

const ACHIEVEMENTS = [
  { milestone: 10,  title: '初识之友', description: '投喂 10 次，猫咪开始信任你' },
  { milestone: 50,  title: '默契伙伴', description: '投喂 50 次，猫咪与你心意相通' },
  { milestone: 100, title: '灵魂伴侣', description: '投喂 100 次，猫咪是你最忠实的专注伙伴' }
];

// 应用列表（用于添加约束应用 Modal）
const INSTALLED_APPS = [
  { pkg: 'com.tencent.mm',       name: '微信',     icon: 'chat' },
  { pkg: 'com.tencent.mobileqq', name: 'QQ',       icon: 'forum' },
  { pkg: 'com.ss.android.ugc.aweme', name: '抖音', icon: 'music_note' },
  { pkg: 'com.smile.gifmaker',   name: '快手',     icon: 'video_library' },
  { pkg: 'com.taobao.taobao',    name: '淘宝',     icon: 'shopping_bag' },
  { pkg: 'com.eg.android.AlipayGphone', name: '支付宝', icon: 'account_balance_wallet' },
  { pkg: 'tv.danmaku.bili',      name: '哔哩哔哩', icon: 'live_tv' },
  { pkg: 'com.sina.weibo',       name: '微博',     icon: 'public' },
  { pkg: 'com.zhihu.android',    name: '知乎',     icon: 'quiz' },
  { pkg: 'com.netease.cloudmusic', name: '网易云音乐', icon: 'library_music' }
];

// 反思问题（来自 SeedData）
const REFLECTION_QUESTIONS = [
  { id: 1, text: '你进入这个 app 是来做什么的？', placeholder: '写下你此刻的真实目的...' },
  { id: 2, text: '你今天的 todo list 还有哪些？', placeholder: '列出今天还没完成的任务...' }
];

// ========== 全局状态 ==========
const state = {
  cats: {
    orange:  { name: '小橘', breedId: 'orange',  affinity: 0,  feedCount: 0, achievements: [] },
    ragdoll: { name: '咪咪', breedId: 'ragdoll', affinity: 12, feedCount: 3, achievements: [] }
  },
  currentBreedId: 'orange',
  foodInventory: { '猫粮': 5, '冻干': 0, '酸奶': 0, '罐头': 0 },
  guardedApps: [],
  guardEnabled: false,
  focusSeconds: 0,
  totalFocusMinutes: 135,    // 2h 15m
  totalBlockCount: 8,
  // 持续使用再次提醒
  recurringEnabled: false,
  recurringInterval: 30,
  // 设置开关
  bootStartup: false,
  notification: true,
  // 视频
  currentVideoMode: 'idle',  // idle / eating / focus
  idleVideoIndex: 0,
  videoReady: false,
  // 统计 mock
  stats: {
    today:   { focusMin: 25, blocks: 3 },
    week:    { focusMin: 145, blocks: 8 },
    month:   { focusMin: 540, blocks: 22 },
    trend: {
      today: [{label:'00', v:0},{label:'06', v:0},{label:'09', v:15},{label:'12', v:10},{label:'15', v:0},{label:'18', v:0},{label:'21', v:0}],
      week:  [{label:'周一',v:25},{label:'周二',v:15},{label:'周三',v:40},{label:'周四',v:0},{label:'周五',v:35},{label:'周六',v:20},{label:'周日',v:10}],
      month: [{label:'W1',v:120},{label:'W2',v:165},{label:'W3',v:140},{label:'W4',v:115}]
    },
    ranking: [
      { pkg:'com.tencent.mm', name:'微信', icon:'chat', count:5 },
      { pkg:'com.ss.android.ugc.aweme', name:'抖音', icon:'music_note', count:2 },
      { pkg:'tv.danmaku.bili', name:'哔哩哔哩', icon:'live_tv', count:1 }
    ]
  }
};

// ========== 工具函数 ==========
function $(sel, root=document){ return root.querySelector(sel); }
function $$(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
function getCurrentCat(){ return state.cats[state.currentBreedId]; }
function getCurrentBreed(){ return CAT_BREEDS[state.currentBreedId]; }

function showToast(text, duration=2200){
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(()=>t.classList.remove('show'), duration);
}

function getEncouragement(feedCount){
  if (feedCount >= 100) return '猫咪已经离不开你了，它觉得你就是它的全世界';
  if (feedCount >= 50)  return '猫咪非常信任你，每一次专注都让它更靠近你';
  if (feedCount >= 10)  return '猫咪开始熟悉你的气息，专注的回报正在累积';
  return '猫咪刚认识你，多投喂几次，它会越来越亲近你';
}

function getAffinityTitle(affinity){
  if (affinity >= 500) return '灵魂伴侣';
  if (affinity >= 200) return '默契伙伴';
  if (affinity >= 50)  return '初识之友';
  return '初识之友';
}

function getNextMilestone(feedCount){
  for (const a of ACHIEVEMENTS){
    if (feedCount < a.milestone) return a;
  }
  return null;
}

// ========== 视频管理（双 video 交替播放，消除切换空窗）==========
// 对应 Android ExoPlayer setKeepContentOnPlayerReset(true)：
// A 播放时 B 预加载下一个视频，ended 后无缝切换到 B
const catVideoA = $('#catVideoA');
const catVideoB = $('#catVideoB');
const catFallback = $('#catFallback');
let activeVideo = catVideoA;   // 当前播放的 video 元素
let inactiveVideo = catVideoB; // 预加载用的 video 元素
let preloadedSrc = null;       // inactive 已预加载的 src

function getVideoSrc(video){
  // 取 src 属性去掉域名前缀
  const s = video.src || '';
  return s.split('/').slice(-2).join('/');
}

function showFallback(){
  state.videoReady = false;
  catFallback.style.opacity = '1';
  activeVideo.classList.remove('ready');
  inactiveVideo.classList.remove('ready');
}

function hideFallback(){
  state.videoReady = true;
  catFallback.style.opacity = '0';
  activeVideo.classList.add('ready');
}

// 在 inactive video 上预加载视频（不播放）
function preloadOnInactive(src){
  if (preloadedSrc === src) return;
  inactiveVideo.src = src;
  inactiveVideo.load();
  preloadedSrc = src;
}

// 播放 idle 视频（核心：双 video 交替）
function playIdleVideo(){
  state.currentVideoMode = 'idle';
  const breed = getCurrentBreed();
  const src = breed.idleVideos[state.idleVideoIndex % breed.idleVideos.length];

  // 如果 inactive 已预加载了这个视频且 ready，直接切换
  if (preloadedSrc === src && inactiveVideo.readyState >= 2){
    // 无缝切换：隐藏旧的，显示新的
    activeVideo.classList.remove('ready');
    activeVideo.pause();
    [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
    activeVideo.classList.add('ready');
    hideFallback();
    activeVideo.currentTime = 0;
    activeVideo.play().catch(()=>{});
  } else {
    // 首次加载或预加载未完成，直接在 active 上加载
    activeVideo.src = src;
    activeVideo.load();
    activeVideo.play().catch(()=>{});
  }

  // 预加载下一个 idle 视频（A 播放时 B 预加载）
  const nextIndex = (state.idleVideoIndex + 1) % breed.idleVideos.length;
  preloadOnInactive(breed.idleVideos[nextIndex]);
}

function playEatingVideo(){
  state.currentVideoMode = 'eating';
  const breed = getCurrentBreed();
  // eating 视频直接在 active 上加载（不需要预加载，因为是单次播放）
  activeVideo.src = breed.eatingVideo;
  activeVideo.load();
  activeVideo.play().catch(()=>{});
  preloadedSrc = null;
}

function playFocusVideo(){
  const breed = getCurrentBreed();
  const focusVideo = $('#focusVideo');
  if (focusVideo.src !== breed.focusVideo){
    focusVideo.src = breed.focusVideo;
    focusVideo.load();
  }
  focusVideo.loop = true;
  focusVideo.play().catch(()=>{});
}

function stopFocusVideo(){
  const focusVideo = $('#focusVideo');
  focusVideo.pause();
  focusVideo.removeAttribute('src');
  focusVideo.load();
}

// 视频事件绑定（对应 Android onVideoCompletion 回调）
// 两个 video 元素都绑定事件，因为 active/inactive 会交替切换
[catVideoA, catVideoB].forEach(video => {
  video.addEventListener('loadeddata', ()=>{
    // 仅当前 active video 触发时隐藏 fallback
    if (video === activeVideo) hideFallback();
  });
  video.addEventListener('ended', ()=>{
    // 仅当前 active video 触发时处理轮播
    if (video !== activeVideo) return;
    if (state.currentVideoMode === 'eating'){
      state.idleVideoIndex = 0;
      playIdleVideo();
    } else if (state.currentVideoMode === 'idle'){
      state.idleVideoIndex = (state.idleVideoIndex + 1) % getCurrentBreed().idleVideos.length;
      playIdleVideo();
    }
  });
  video.addEventListener('error', ()=>{
    if (video === activeVideo) showFallback();
  });
});

// 切换猫咪品种时，先显示 fallback，再加载新视频
function switchBreed(newBreedId){
  if (newBreedId === state.currentBreedId) return;
  state.currentBreedId = newBreedId;
  state.idleVideoIndex = 0;
  state.currentVideoMode = 'idle';
  catFallback.src = getCurrentBreed().fallbackImage;
  // 重置双 video 状态
  activeVideo.classList.remove('ready');
  inactiveVideo.classList.remove('ready');
  activeVideo.removeAttribute('src');
  inactiveVideo.removeAttribute('src');
  preloadedSrc = null;
  showFallback();
  playIdleVideo();
  renderCatInfo();
}

// ========== 渲染：猫咪信息 ==========
function renderCatInfo(){
  const cat = getCurrentCat();
  const breed = getCurrentBreed();
  $('#catName').textContent = cat.name;
  $('#catBreed').textContent = breed.displayName;
  $('#affinityLevel').textContent = cat.affinity;
  $('#affinityTitle').textContent = getAffinityTitle(cat.affinity);
  $('#encouragement').textContent = getEncouragement(cat.feedCount);

  const next = getNextMilestone(cat.feedCount);
  if (next){
    const prevMilestone = ACHIEVEMENTS.find(a => a.milestone < next.milestone)?.milestone || 0;
    const progress = ((cat.feedCount - prevMilestone) / (next.milestone - prevMilestone)) * 100;
    $('#progressFill').style.width = Math.min(100, Math.max(0, progress)) + '%';
    $('#affinityInfo').textContent = `投喂 ${cat.feedCount} / ${next.milestone} 次`;
  } else {
    $('#progressFill').style.width = '100%';
    $('#affinityInfo').textContent = `投喂 ${cat.feedCount} 次 · 已达成所有成就`;
  }
  renderAchievements();
  renderFoodInventory();
}

function renderAchievements(){
  const cat = getCurrentCat();
  const list = $('#achievementList');
  list.innerHTML = ACHIEVEMENTS.map(a => {
    const unlocked = cat.feedCount >= a.milestone;
    return `
      <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-icon">
          <span class="material-icons">${unlocked ? 'emoji_events' : 'lock'}</span>
        </div>
        <div class="achievement-info">
          <div class="achievement-title">${a.title}</div>
          <div class="achievement-desc">${a.description}</div>
        </div>
        ${unlocked ? '<span class="material-icons achievement-check">check_circle</span>' : ''}
      </div>
    `;
  }).join('');
}

function renderFoodInventory(){
  const list = $('#foodInventory');
  list.innerHTML = FOODS.map(f => {
    const count = state.foodInventory[f.foodId] || 0;
    const empty = count <= 0;
    return `
      <div class="food-card ${empty ? 'empty' : ''}" data-food="${f.foodId}">
        <div class="food-card-image-wrapper">
          <img class="food-card-image" src="${f.icon}" alt="${f.displayName}">
        </div>
        <div class="food-card-name">${f.displayName}</div>
        <div class="food-card-count">×${count}</div>
        <div class="food-card-bonus">+${f.affinityBonus} 好感</div>
      </div>
    `;
  }).join('');
  // 绑定投喂点击
  $$('.food-card', list).forEach(card => {
    card.addEventListener('click', ()=>{
      if (card.classList.contains('empty')) {
        showToast('该食物库存不足');
        return;
      }
      const foodId = card.dataset.food;
      feedCat(foodId);
    });
  });
}

// ========== 投喂交互 ==========
let feedingLock = false;
function feedCat(foodId){
  if (feedingLock) return;
  if (state.currentVideoMode === 'eating') return;
  if ((state.foodInventory[foodId] || 0) <= 0) {
    showToast('该食物库存不足');
    return;
  }
  feedingLock = true;
  state.foodInventory[foodId] -= 1;
  renderFoodInventory();

  // 切到 eating 视频（loop=false），结束后自动切回 idle
  playEatingVideo();

  // 视频结束后结算好感度（监听一次 ended）
  const onEatingEnd = ()=>{
    activeVideo.removeEventListener('ended', onEatingEnd);
    const food = FOODS.find(f => f.foodId === foodId);
    const cat = getCurrentCat();
    cat.affinity += food.affinityBonus;
    cat.feedCount += 1;
    // 飘字
    showAffinityFloat(food.affinityBonus);
    renderCatInfo();
    feedingLock = false;
    // 检查新成就
    checkAchievementUnlock(cat);
  };
  activeVideo.addEventListener('ended', onEatingEnd);

  // 安全超时（20 秒，对应 Android 端的 20s 安全超时）
  setTimeout(()=>{
    if (feedingLock){
      activeVideo.removeEventListener('ended', onEatingEnd);
      if (state.currentVideoMode === 'eating'){
        state.idleVideoIndex = 0;
        playIdleVideo();
      }
      feedingLock = false;
    }
  }, 20000);
}

function showAffinityFloat(bonus){
  const el = $('#affinityFloat');
  el.textContent = `+${bonus} 好感`;
  el.classList.remove('show');
  void el.offsetWidth; // 触发重绘
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 1500);
}

function checkAchievementUnlock(cat){
  for (const a of ACHIEVEMENTS){
    if (cat.feedCount >= a.milestone && !cat.achievements.includes(a.milestone)){
      cat.achievements.push(a.milestone);
      showToast(`🎉 成就解锁：${a.title}`);
    }
  }
}

// ========== Tab 切换（fadeIn + scaleIn）==========
// CSS 已内置过渡：.tab-content 默认 opacity:0 + scale(0.96)，.active 时 opacity:1 + scale(1)
// 对应 Android NavHost 默认过渡 fadeIn(tween(300)) + scaleIn(initialScale=0.96f)
function switchTab(route){
  const current = $('.tab-content.active');
  const target = $(`.tab-content[data-tab="${route}"]`);
  if (!target || current === target) return;

  if (current){
    current.classList.remove('active');
  }
  // 强制重排以触发进入动画
  void target.offsetWidth;
  target.classList.add('active');

  // 底部导航高亮
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.route === route));

  // 切到统计页时重绘图表
  if (route === 'stats'){
    setTimeout(()=>drawTrendChart(), 50);
  }
}

$$('#bottomNav .nav-item').forEach(btn=>{
  btn.addEventListener('click', ()=>switchTab(btn.dataset.route));
});

// ========== 约束应用页 ==========
function renderGuardStatus(){
  const icon = $('#guardStatusIcon');
  const text = $('#guardStatusText');
  const desc = $('#guardStatusDesc');
  if (state.guardEnabled){
    icon.textContent = 'check_circle';
    icon.style.color = 'var(--primary)';
    text.textContent = '守护已开启';
    desc.textContent = `正在守护 ${state.guardedApps.length} 个约束应用`;
  } else {
    icon.textContent = 'warning';
    icon.style.color = 'var(--warning)';
    text.textContent = '守护已关闭';
    desc.textContent = '开启后才会拦截约束应用';
  }
}

function renderDiagnostics(){
  const list = $('#diagnosticList');
  const items = [
    { key:'protection', icon:'shield', label:'守护总开关', ok: state.guardEnabled, okText:'已开启', failText:'未开启', action:'开启守护' },
    { key:'usage', icon:'analytics', label:'使用情况访问权限', ok:true, okText:'已授权', failText:'未授权', action:'去授权' },
    { key:'overlay', icon:'layers', label:'悬浮窗权限', ok:true, okText:'已授权', failText:'未授权', action:'去授权' },
    { key:'access', icon:'accessibility', label:'无障碍服务', ok:true, okText:'已开启', failText:'未开启', action:'去开启' },
    { key:'battery', icon:'battery_full', label:'电池优化白名单', ok:true, okText:'已加入', failText:'未加入', action:'去设置' },
    { key:'apps', icon:'apps', label:'已添加约束应用', ok: state.guardedApps.length > 0, okText:`${state.guardedApps.length} 个`, failText:'未添加', action:'去添加' }
  ];
  list.innerHTML = items.map(it => `
    <div class="diagnostic-row">
      <div class="row-left">
        <span class="material-icons ${it.ok ? 'tick' : 'warn'}">${it.icon}</span>
        <span>${it.label}</span>
      </div>
      ${it.ok
        ? `<span class="diagnostic-status">${it.okText}</span>`
        : `<button class="diagnostic-action" data-key="${it.key}">${it.action}</button>`}
    </div>
  `).join('');
  $$('.diagnostic-action', list).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if (btn.dataset.key === 'protection'){
        state.guardEnabled = true;
        $('#guardSwitch').checked = true;
        renderGuardStatus();
        renderDiagnostics();
        showToast('守护已开启');
      } else if (btn.dataset.key === 'apps'){
        openAddAppModal();
      } else {
        showToast('Web 演示不支持跳转系统设置');
      }
    });
  });
}

function renderProtectedApps(){
  const list = $('#protectedAppsList');
  $('#protectedCount').textContent = state.guardedApps.length;
  if (state.guardedApps.length === 0){
    list.innerHTML = `
      <div class="empty-apps">
        <span class="material-icons empty-icon">shield</span>
        <div class="empty-title">还没有添加约束应用</div>
        <div class="empty-desc">把容易让你分心的应用加进来<br>每次打开都会先弹反思问答</div>
        <button class="primary-btn" id="emptyAddAppBtn">
          <span class="material-icons">add</span>
          <span>添加约束应用</span>
        </button>
      </div>
    `;
    $('#emptyAddAppBtn').addEventListener('click', openAddAppModal);
  } else {
    list.innerHTML = state.guardedApps.map(app => `
      <div class="protected-app-item">
        <div class="app-icon-box">
          <span class="material-icons">${app.icon}</span>
        </div>
        <div class="protected-app-info">
          <div class="protected-app-name">${app.name}</div>
          <div class="protected-app-block">已拦截 0 次</div>
        </div>
        <button class="delete-btn" data-pkg="${app.pkg}">
          <span class="material-icons">close</span>
        </button>
      </div>
    `).join('');
    $$('.delete-btn', list).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        state.guardedApps = state.guardedApps.filter(a => a.pkg !== btn.dataset.pkg);
        renderProtectedApps();
        renderDiagnostics();
        showToast('已移除');
      });
    });
  }
}

// 守护总开关
$('#guardSwitch').addEventListener('change', e => {
  state.guardEnabled = e.target.checked;
  renderGuardStatus();
  renderDiagnostics();
  showToast(state.guardEnabled ? '守护已开启' : '守护已关闭');
});

// FAB 添加约束应用
$('#fabAddApp').addEventListener('click', openAddAppModal);

// ========== 添加约束应用 Modal ==========
function openAddAppModal(){
  $('#addAppModal').classList.add('active');
  renderAppList('');
  setTimeout(()=>$('#appSearchInput').focus(), 100);
}
function closeAddAppModal(){
  $('#addAppModal').classList.remove('active');
  $('#appSearchInput').value = '';
}
function renderAppList(query){
  const list = $('#appList');
  const q = (query || '').trim().toLowerCase();
  const filtered = INSTALLED_APPS.filter(a => !q || a.name.toLowerCase().includes(q));
  list.innerHTML = filtered.map(app => {
    const added = state.guardedApps.some(a => a.pkg === app.pkg);
    return `
      <div class="app-list-item ${added ? 'added' : ''}" data-pkg="${app.pkg}">
        <div class="app-icon-box">
          <span class="material-icons">${app.icon}</span>
        </div>
        <div class="app-list-item-info">
          <div class="app-list-item-name">${app.name}</div>
          <div class="app-list-item-pkg">${app.pkg}</div>
        </div>
        <button class="add-app-btn" ${added ? 'disabled' : ''}>
          ${added ? '已添加' : '添加'}
        </button>
      </div>
    `;
  }).join('');
  $$('.app-list-item', list).forEach(row=>{
    row.addEventListener('click', ()=>{
      const pkg = row.dataset.pkg;
      if (state.guardedApps.some(a => a.pkg === pkg)) return;
      const app = INSTALLED_APPS.find(a => a.pkg === pkg);
      state.guardedApps.push(app);
      renderProtectedApps();
      renderDiagnostics();
      renderAppList(q);
      showToast(`已添加 ${app.name}`);
    });
  });
}
$('#appSearchInput').addEventListener('input', e => renderAppList(e.target.value));
// 点击 Modal 外部关闭
$('#addAppModal').addEventListener('click', e => {
  if (e.target.id === 'addAppModal') closeAddAppModal();
});

// ========== 统计页 ==========
function renderStats(){
  const period = $('.period-tab.active').dataset.period;
  const data = state.stats[period];
  const periodLabel = period === 'today' ? '今日' : period === 'week' ? '近 7 天' : '近 30 天';
  $('#periodFocusTitle').textContent = `${periodLabel}专注`;
  $('#periodFocusValue').textContent = data.focusMin + 'm';
  $('#periodBlockTitle').textContent = `${periodLabel}拦截`;
  $('#periodBlockValue').textContent = data.blocks;
  $('#totalFocusValue').textContent = formatMinutes(state.totalFocusMinutes);
  $('#totalBlockValue').textContent = state.totalBlockCount;
  drawTrendChart();
  renderRanking();
}
function formatMinutes(min){
  if (min < 60) return min + 'm';
  const h = Math.floor(min/60), m = min%60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
function drawTrendChart(){
  const canvas = $('#trendChart');
  if (!canvas) return;
  const period = $('.period-tab.active').dataset.period;
  const data = state.stats.trend[period];
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  if (!data || data.length === 0) return;
  const maxV = Math.max(...data.map(d=>d.v), 1);
  const padL = 30, padR = 16, padT = 16, padB = 32;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barW = chartW / data.length * 0.55;
  const gap = chartW / data.length;

  // 网格线
  ctx.strokeStyle = 'rgba(99,75,45,0.08)';
  ctx.lineWidth = 1;
  for (let i=0; i<=4; i++){
    const y = padT + chartH * i / 4;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
  }

  // 柱
  data.forEach((d, i)=>{
    const h = (d.v / maxV) * chartH;
    const x = padL + gap * i + (gap - barW)/2;
    const y = padT + chartH - h;
    const grad = ctx.createLinearGradient(0, y, 0, y+h);
    grad.addColorStop(0, '#FF9F43');
    grad.addColorStop(1, '#FFB978');
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, barW, h, 6);
    ctx.fill();
    // 数值
    if (d.v > 0){
      ctx.fillStyle = '#6B5E51';
      ctx.font = '11px PingFang SC, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.v + 'm', x + barW/2, y - 4);
    }
  });

  // x 轴标签
  ctx.fillStyle = '#8C7E6E';
  ctx.font = '11px PingFang SC, sans-serif';
  ctx.textAlign = 'center';
  data.forEach((d, i)=>{
    const x = padL + gap * i + gap/2;
    ctx.fillText(d.label, x, H - 10);
  });

  // 渲染 labels（备用）
  const labelsEl = $('#trendLabels');
  labelsEl.innerHTML = data.map(d=>`<span>${d.label}</span>`).join('');
}
function roundRect(ctx, x, y, w, h, r){
  if (h < 0){ y += h; h = -h; }
  if (h < r) r = h;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
}
function renderRanking(){
  const list = $('#rankingList');
  list.innerHTML = state.stats.ranking.map((r, i)=>`
    <div class="ranking-row">
      <div class="row-left" style="display:flex;align-items:center;gap:10px;">
        <span class="app-icon-box" style="width:32px;height:32px;">
          <span class="material-icons" style="font-size:16px;">${r.icon}</span>
        </span>
        <span>${r.name}</span>
      </div>
      <span class="rank-value">${r.count} 次</span>
    </div>
  `).join('');
}
$$('#periodTabs .period-tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$('#periodTabs .period-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderStats();
  });
});

// ========== 设置页 ==========
$('#switchCatRow').addEventListener('click', ()=>{
  renderCatSwitchGrid();
  $('#catSwitchScreen').classList.add('active');
});
$('#catSwitchBackBtn').addEventListener('click', closeCatSwitchScreen);
$('#confirmSwitchBtn').addEventListener('click', ()=>{
  const selected = $('.cat-switch-card.selected');
  if (!selected){
    showToast('请先选择一只猫咪');
    return;
  }
  const newBreedId = selected.dataset.breed;
  switchBreed(newBreedId);
  closeCatSwitchScreen();
  showToast('已切换猫咪');
});

function renderCatSwitchGrid(){
  const grid = $('#catSwitchGrid');
  grid.innerHTML = Object.keys(state.cats).map(breedId => {
    const cat = state.cats[breedId];
    const breed = CAT_BREEDS[breedId];
    const selected = breedId === state.currentBreedId;
    return `
      <div class="cat-switch-card ${selected ? 'selected' : ''}" data-breed="${breedId}">
        <div class="cat-switch-check"><span class="material-icons">check</span></div>
        <img src="${breed.fallbackImage}" alt="${breed.displayName}">
        <div class="cat-switch-name">${cat.name}</div>
        <div class="cat-switch-affinity">${breed.displayName} · 好感 ${cat.affinity}</div>
      </div>
    `;
  }).join('');
  $$('.cat-switch-card', grid).forEach(card=>{
    card.addEventListener('click', ()=>{
      $$('.cat-switch-card', grid).forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });
}
function closeCatSwitchScreen(){
  $('#catSwitchScreen').classList.remove('active');
}

// 后台保活引导折叠
$('#keepaliveCard').addEventListener('click', ()=>{
  const body = $('#keepaliveBody');
  const card = $('#keepaliveCard');
  const expanded = card.classList.toggle('expanded');
  if (expanded){
    body.innerHTML = `
      <div class="keepalive-step">
        <div class="keepalive-step-num">1</div>
        <div>
          <div class="keepalive-step-title">关闭电池优化</div>
          <div class="keepalive-step-desc">进入手机「设置 → 应用 → 专注猫 → 电池」，选择「不限制后台运行」</div>
        </div>
      </div>
      <div class="keepalive-step">
        <div class="keepalive-step-num">2</div>
        <div>
          <div class="keepalive-step-title">锁定最近任务</div>
          <div class="keepalive-step-desc">在「最近任务」列表中，长按专注猫卡片，点击「锁定」图标</div>
        </div>
      </div>
      <div class="keepalive-step">
        <div class="keepalive-step-num">3</div>
        <div>
          <div class="keepalive-step-title">加入自启动白名单</div>
          <div class="keepalive-step-desc">部分机型需进入「自启动管理」，将专注猫加入自启动白名单</div>
        </div>
      </div>
    `;
  } else {
    body.innerHTML = '';
  }
});

// 开机自启动 / 守护通知
$('#bootStartupSwitch').addEventListener('change', e=>{
  state.bootStartup = e.target.checked;
  showToast(state.bootStartup ? '已开启开机自启动' : '已关闭开机自启动');
});
$('#notifSwitch').addEventListener('change', e=>{
  state.notification = e.target.checked;
  showToast(state.notification ? '已开启守护通知' : '已关闭守护通知');
});

// 持续使用再次提醒（通过 .ios-group.expanded 控制展开/折叠，对应 CSS 中 .ios-group.expanded .recurring-input-area）
$('#recurringSwitch').addEventListener('change', e=>{
  state.recurringEnabled = e.target.checked;
  const group = $('#recurringSwitch').closest('.ios-group');
  if (state.recurringEnabled){
    group.classList.add('expanded');
  } else {
    group.classList.remove('expanded');
  }
  showToast(state.recurringEnabled ? '已开启再次提醒' : '已关闭再次提醒');
});

$('#recurringInput').addEventListener('input', e=>{
  const val = parseInt(e.target.value, 10);
  const hint = $('#recurringHint');
  if (isNaN(val)){
    hint.textContent = '范围 5-120 分钟，0 = 关闭';
    hint.classList.remove('error');
    return;
  }
  if (val === 0){
    hint.textContent = '已设为关闭';
    hint.classList.remove('error');
    state.recurringInterval = 0;
  } else if (val < 5 || val > 120){
    hint.textContent = '请输入 5-120 之间的数字，或 0 关闭';
    hint.classList.add('error');
  } else {
    hint.textContent = `已设置：每 ${val} 分钟再次提醒`;
    hint.classList.remove('error');
    state.recurringInterval = val;
  }
});

$('#recurringInput').addEventListener('change', e=>{
  const val = parseInt(e.target.value, 10);
  if (!isNaN(val) && val !== 0 && (val < 5 || val > 120)){
    e.target.value = state.recurringInterval || 30;
    $('#recurringHint').textContent = '范围 5-120 分钟，0 = 关闭';
    $('#recurringHint').classList.remove('error');
  }
});

// 反思问题管理
$('#reflectionQuestionsRow').addEventListener('click', ()=>{
  renderReflectionList();
  $('#reflectionScreen').classList.add('active');
});
$('#reflectionBackBtn').addEventListener('click', ()=>{
  $('#reflectionScreen').classList.remove('active');
});
function renderReflectionList(){
  const list = $('#reflectionList');
  list.innerHTML = REFLECTION_QUESTIONS.map(q => `
    <div class="reflection-item">
      <div class="reflection-item-text">${q.text}</div>
      <div class="reflection-item-placeholder">${q.placeholder}</div>
      <textarea class="recurring-input" style="width:100%;margin-top:8px;min-height:60px;" placeholder="在此输入..."></textarea>
      <div class="recurring-hint" style="padding:6px 0 0;">所有问题必答，无法跳过</div>
    </div>
  `).join('');
}

// 导出数据
$('#exportDataRow').addEventListener('click', ()=>{
  const data = {
    cats: state.cats,
    foodInventory: state.foodInventory,
    guardedApps: state.guardedApps,
    totalFocusMinutes: state.totalFocusMinutes,
    totalBlockCount: state.totalBlockCount,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'focuscat-data.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('数据已导出');
});

// ========== 专注模式 ==========
const focusScreen = $('#focusScreen');
let focusTimer = null;

$('#startFocusBtn').addEventListener('click', enterFocus);

function enterFocus(){
  focusScreen.classList.add('active');
  state.focusSeconds = 0;
  updateFocusTimer();
  playFocusVideo();
  focusTimer = setInterval(()=>{
    state.focusSeconds += 1;
    updateFocusTimer();
    // 每 5 分钟奖励一次（演示中加速为 30 秒）
    if (state.focusSeconds % 30 === 0 && state.focusSeconds > 0){
      rewardFood();
    }
  }, 1000);
}

function updateFocusTimer(){
  const m = Math.floor(state.focusSeconds / 60);
  const s = state.focusSeconds % 60;
  $('#focusTimer').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function rewardFood(){
  // 奖励 1 个猫粮
  state.foodInventory['猫粮'] = (state.foodInventory['猫粮'] || 0) + 1;
  renderFoodInventory();
  const banner = $('#rewardBanner');
  $('#rewardText').textContent = '为猫咪赢得 猫粮 ×1';
  banner.classList.add('show');
  setTimeout(()=>banner.classList.remove('show'), 2500);
}

$('#focusBackBtn').addEventListener('click', ()=>{
  $('#exitFocusModal').classList.add('active');
});
$('#exitFocusCancel').addEventListener('click', ()=>{
  $('#exitFocusModal').classList.remove('active');
});
$('#exitFocusConfirm').addEventListener('click', ()=>{
  $('#exitFocusModal').classList.remove('active');
  exitFocus();
});
function exitFocus(){
  clearInterval(focusTimer);
  focusTimer = null;
  stopFocusVideo();
  focusScreen.classList.remove('active');
  state.totalFocusMinutes += Math.floor(state.focusSeconds / 60);
  renderStats();
  // 恢复 idle 视频
  state.currentVideoMode = 'idle';
  state.idleVideoIndex = 0;
  playIdleVideo();
  showToast(`本次专注 ${Math.floor(state.focusSeconds/60)} 分钟`);
}

// ========== 录屏页加载提示 ==========
const recordingVideo = $('#recordingVideo');
recordingVideo.addEventListener('loadeddata', ()=>{
  $('#recordingLoading').classList.add('hidden');
});
recordingVideo.addEventListener('error', ()=>{
  $('#recordingLoading').textContent = '视频加载失败';
});

// ========== 启动初始化 ==========
function init(){
  // 初始 fallback 图片
  catFallback.src = getCurrentBreed().fallbackImage;
  showFallback();
  // 渲染各页
  renderCatInfo();
  renderGuardStatus();
  renderDiagnostics();
  renderProtectedApps();
  renderStats();
  // 设置开关初始状态
  $('#guardSwitch').checked = state.guardEnabled;
  $('#bootStartupSwitch').checked = state.bootStartup;
  $('#notifSwitch').checked = state.notification;
  $('#recurringSwitch').checked = state.recurringEnabled;
  $('#recurringInput').value = state.recurringInterval;
  // 启动 idle 视频
  playIdleVideo();
  // 确保 fallback 在视频可用前显示
  if (activeVideo.readyState < 2){
    showFallback();
  }
}

document.addEventListener('DOMContentLoaded', init);

// ========== 移动端视频自动播放解锁 ==========
// iOS Safari 即使 muted 也可能需要首次用户手势才能播放
// 监听首次 touchend/click，强制触发视频播放
(function unlockAutoplay(){
  function unlockVideos(){
    [catVideoA, catVideoB, $('#focusVideo'), $('#recordingVideo')].forEach(v => {
      if (!v) return;
      v.muted = true;
      if (v.readyState >= 2 && v.paused) v.play().catch(()=>{});
    });
    document.removeEventListener('touchend', unlockVideos);
    document.removeEventListener('click', unlockVideos);
  }
  document.addEventListener('touchend', unlockVideos, { once: false });
  document.addEventListener('click', unlockVideos, { once: false });
})();
