const $ = selector => document.querySelector(selector);
document.body.dataset.interactive = 'true';
$('#scene-loading').hidden = false;
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = motionPreference.matches;
let night = false;
let coreActive = false;
let lab;
let currentObject = null;
let opener = null;
// Object anchors measured in the captured 957 × 700 fallback, then fitted like the image.
const stillAnchors = {robot:[.451431,.268871],signal:[.543079,.335463],core:[.664983,.362709],rover:[.460837,.589436]};
function placeStillHotspots() {
  if (lab) return;
  const {width, height} = $('#lab-scene').getBoundingClientRect();
  const scale = Math.min(width / 957, height / 700);
  for (const button of document.querySelectorAll('[data-object]')) {
    const [x,y] = stillAnchors[button.dataset.object];
    button.style.left = `${(width - 957 * scale) / 2 + x * 957 * scale}px`;
    button.style.top = `${(height - 700 * scale) / 2 + y * 700 * scale}px`;
  }
}
const stillResize = new ResizeObserver(placeStillHotspots);
stillResize.observe($('#lab-scene'));
placeStillHotspots();
const objects = {
  robot: { code: 'DESK OBJECT / 001', icon: '↗', title: '有点笨，也有点可爱。', subtitle: '小小机械臂 / THE LITTLE HELPER', description: '它正认真练习一件很小的事：把夹爪放到对的位置。看着简单，背后藏着几何、控制、反馈，还有许多次重新来过。', note: '先让一个关节动起来，再弄明白它为什么会动。好奇心也可以从桌面上的几厘米开始。', action: '让它打个招呼' },
  signal: { code: 'DESK OBJECT / 002', icon: '∿', title: '看见那些看不见的。', subtitle: '信号观察站 / SIGNAL EXPLORER', description: '一条会动的曲线，也许来自电路，也许来自无线世界。先观察它，再问频率、噪声与信息之间有什么关系。', note: '屏幕里是一段可交互的模拟信号。启动角落里的核心，看看它会有什么变化。', action: '换个信号看看' },
  rover: { code: 'FLOOR OBJECT / 003', icon: '⏣', title: '去桌子以外的地方。', subtitle: '探测小车 / THE WANDERER', description: '两个小眼睛，四个轮子，带着一点「前面是什么」的好奇。给一个想法装上轮子，它就开始和真实世界打交道。', note: '这是一辆概念小车。这里的每个小装置，都是未来某次动手实验的灵感。', action: '让小车出去转转' },
  core: { code: 'THE QUIET CORNER / CORE.001', icon: '◉', title: '好玩之下，有一颗硬核的心。', subtitle: '实验室核心 / THE JAM CORE', description: '厚重外壳、散热鳍片、裸露管线，包裹着一枚安静悬浮的核心。它把整间实验室连接起来：桌上的每次小尝试，都在为更远的探索积蓄能量。', note: 'CORE.001 是 jamlab 的概念装置，代表这里对底层技术与前沿探索的执着。真实的旗舰项目，将从这颗好奇心里慢慢长出来。', action: '启动实验室核心' },
};

function updateMotion() {
  $('#motion-toggle').setAttribute('aria-pressed', String(paused));
  $('#motion-toggle').setAttribute('aria-label', paused ? '播放场景动画' : '暂停场景动画');
  $('#motion-toggle span').textContent = paused ? '播放' : '暂停';
  $('#motion-toggle svg').innerHTML = paused ? '<path d="m7 4 8 6-8 6Z" stroke="currentColor" stroke-width="1.4"/>' : '<path d="M7 5v10M13 5v10" stroke="currentColor" stroke-width="2"/>';
  lab?.setPaused(paused);
}
function setCore(value) {
  coreActive = value;
  document.body.classList.toggle('core-active', coreActive);
  $('#core-trigger').setAttribute('aria-pressed', String(coreActive));
  $('#core-trigger-text').textContent = coreActive ? '核心运行中' : '启动核心';
  $('#core-response').textContent = coreActive ? '核心已唤醒。示波器接收到了新的信号。' : '核心回到待机。好奇心仍然在线。';
  lab?.setActive(coreActive);
}
function openObject(id, source) {
  const object = objects[id];
  if (!object) return;
  opener = source; currentObject = id;
  $('#object-code').textContent = object.code;
  $('#object-icon').textContent = object.icon;
  $('#object-title').textContent = object.title;
  $('#object-subtitle').textContent = object.subtitle;
  $('#object-description').textContent = object.description;
  $('#object-note').textContent = object.note;
  $('#object-action').innerHTML = `${id === 'core' && coreActive ? '让核心回到待机' : object.action} <span aria-hidden="true">↗</span>`;
  $('#object-dialog').showModal();
  $('#dialog-close').focus();
}
for (const hotspot of document.querySelectorAll('[data-object]')) hotspot.addEventListener('click', () => openObject(hotspot.dataset.object, hotspot));
$('#dialog-close').addEventListener('click', () => $('#object-dialog').close());
$('#object-dialog').addEventListener('close', () => opener?.focus({preventScroll:true}));
$('#object-dialog').addEventListener('click', event => {
  if (event.target !== $('#object-dialog')) return;
  const r = event.target.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close();
});
$('#object-action').addEventListener('click', () => {
  const id = currentObject;
  $('#object-dialog').close();
  if (id === 'core' && lab) setCore(!coreActive);
  else if (id === 'core') $('#core-response').textContent = '当前为静态预览，装置的介绍仍可查看。';
  else {
    lab?.play(id);
    $('#core-response').textContent = !lab ? '当前为静态预览，装置的介绍仍可查看。' : paused ? '已切换装置姿态。场景动画保持暂停。' : ({robot:'小机械臂正在和你打招呼。',signal:'频率变化了。再看看屏幕里的曲线。',rover:'小车开始了它今天的小小探险。'})[id];
  }
});
$('#core-trigger').addEventListener('click', () => setCore(!coreActive));
$('#motion-toggle').addEventListener('click', () => { paused = !paused; updateMotion(); });
$('#night-toggle').addEventListener('click', () => {
  night = !night;
  document.body.classList.toggle('night-mode', night);
  $('#night-toggle').setAttribute('aria-pressed', String(night));
  $('#night-toggle span').textContent = night ? '打开灯光' : '关灯看看';
  $('#scene-mode-label').textContent = night ? 'NIGHT SHIFT' : 'DAY SHIFT';
  lab?.setNight(night);
});
motionPreference.addEventListener('change', event => { if (event.matches) { paused = true; updateMotion(); } });
updateMotion();

try {
  const { createLab } = await import('./lab-scene.mjs');
  lab = createLab($('#lab-scene'), $('#scene-hotspots'), {reducedMotion:paused});
  lab.setNight(night);
  lab.setActive(coreActive);
  lab.setPaused(paused);
  stillResize.disconnect();
  $('#scene-loading').hidden = true;
  document.body.dataset.scene = 'ready';
} catch (error) {
  $('#scene-loading').hidden = true;
  document.body.dataset.scene = 'fallback';
  $('#scene-mode-label').textContent = 'STILL CURIOUS';
  placeStillHotspots();
  $('#motion-toggle').disabled = true;
  $('#night-toggle').disabled = true;
  $('#lab-scene').setAttribute('aria-label', '实验室静态插画：桌上有小机械臂、示波器和探测小车，角落是发光的核心机器。装置介绍仍可以打开。');
}
