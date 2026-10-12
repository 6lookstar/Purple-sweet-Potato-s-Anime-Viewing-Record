// 用最小 DOM 桩跑内联脚本，验证 bindDD/bind/start 无异常、下拉可展开、按钮有点击处理器
const fs = require('fs');
const html = fs.readFileSync('D:/2026-10-08-19-56-19/workbench/紫薯观影手账.html', 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.log('FAIL: 未提取到内联脚本'); process.exit(1); }
const code = m[1];

// --- 极简 DOM 桩 ---
class CL {
  constructor(t) { this.tagName = t; this.nodeType = 1; this.children = []; this.attrs = {}; this.dataset = {};
    this.style = {}; this._html = ''; this._text = ''; this.parentNode = null; this.classes = new Set(); }
  get className() { return [...this.classes].join(' '); }
  set className(v) { this.classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  set classList(v) {}
  get classList() {
    const self = this;
    return { add: c => self.classes.add(c), remove: c => self.classes.delete(c),
      contains: c => self.classes.has(c), toggle: c => self.classes.has(c) ? (self.classes.delete(c), 0) : (self.classes.add(c), 1) };
  }
  set innerHTML(v) { this._html = v; if (v === '') this.children = []; }
  get innerHTML() { return this._html; }
  set textContent(v) { this._text = String(v); }
  get textContent() { return this._text; }
  appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  addEventListener() {} removeEventListener() {}
  scrollIntoView() {} focus() {} click() {}
  get complete() { return true; } get naturalWidth() { return 200; }
  get offsetHeight() { return 46; }
  getBoundingClientRect() { return { top: 300, bottom: 346, left: 0, right: 100, width: 100, height: 46 }; }
}
const store = {};
const handler = {
  get(t, k) {
    if (k in t) return t[k];
    if (k === 'value') return t._value === undefined ? '' : t._value;
    return undefined;
  },
  set(t, k, v) { t[k] = v; return true; }
};
const doc = {
  _list: [],
  body: new CL('body'),
  createElement: t => new CL(t),
  querySelector: sel => (sel[0] === '#' ? (store[sel.slice(1)] || null) : null),
  querySelectorAll: sel => {
    if (sel === '.dd.open' || sel === '.dd') {
      return Object.keys(store).filter(k => store[k] instanceof CL && store[k].querySelector('.dd-btn') && store[k].classes.has('open'))
        .map(k => store[k]);
    }
    if (sel === '.dd.open')
      return Object.keys(store).filter(k => store[k].classes && store[k].classes.has('open')).map(k => store[k]);
    if (sel === '.dd-btn[data-dd]' || sel === '.dd-btn') {
      return Object.keys(store).filter(k => store[k].querySelector && store[k].querySelector('.dd-btn')).map(k => store[k].querySelector('.dd-btn'));
    }
    if (sel === '.st-tab') return ['mod1', 'mod2', 'mod3'].map(go => { const t = new CL('DIV'); t.dataset.go = go; return t; });
    if (sel === '#tagBox .tg') return [];
    return [];
  },
  getElementById: id => store[id] || null,
  addEventListener: (ev, fn) => { if (ev === 'DOMContentLoaded') doc._ready = fn; if (ev === 'click') { (doc._clickHandlers = doc._clickHandlers || []).push(fn); } }
};
global.document = doc;
global.window = { __SMART_PAGE__: null };
global.Promise = Promise;
global.setTimeout = setTimeout;

// 预置关键元素
['todayList','recList','revList','tasteList','recList','srchResults','thumbs','tagBox',
 'f-date','f-title','f-feel','f-score','recMsg','submitBtn','recForm','q','srchResults',
 'talkNext1','talkNext2','talkNext3','m1Talk','m2Talk','m3Talk','refreshRec','jumpList',
 'doSearch','qClear','goDouyin','goXhs','drop','file','syncTxt','syncDot','eg-m1','eg-m2','eg-m3',
 'elv-m1','elv-m2','elv-m3','recCount'].forEach(id => { store[id] = new CL('DIV'); store[id].id = id; });
// 预置所有 HTML 中真实存在的元素（从 skeleton 提取 id），避免桩遗漏
const skel = html.split('<script>')[0];
const allIds = [...new Set([...skel.matchAll(/id="([A-Za-z0-9_-]+)"/g)].map(x => x[1]))];
allIds.forEach(id => { if (!store[id]) { store[id] = new CL('DIV'); store[id].id = id; } });
allIds.filter(id => /^eg-|^elv-/.test(id)).forEach(id => { store[id].children = []; });
['f-type','f-status','filterType','filterStatus'].forEach(id => {
  const box = new CL('DIV'); box.id = id;
  const btn = new CL('BUTTON'); btn.dataset.dd = '1';
  const txt = new CL('SPAN'); txt.className = 'dd-txt';
  btn.appendChild(txt); box.appendChild(btn);
  box.querySelector = sel => sel === '.dd-btn' ? btn : (sel === '.dd-menu' ? (box._menu ||= new CL('DIV')) : (sel === '.dd-txt' ? txt : null));
  box.querySelectorAll = sel => sel === '.dd-menu' ? [box._menu] : [];
  store[id] = box;
});

let err = null;
try { eval(code); if (doc._ready) doc._ready(); }
catch (e) { err = e; console.log(e.stack.split('\n').slice(0, 6).join('\n')); }

if (err) { console.log('RUNTIME ERROR:', err.message); process.exit(1); }

console.log('脚本执行        : OK（无运行时异常）');
console.log('bind 已挂载      :', ['talkNext1','doSearch','goDouyin','drop','recForm'].every(id => typeof store[id].onclick === 'function' || typeof store[id].onsubmit === 'function') ? 'OK' : 'FAIL');
console.log('bindDD 已挂载    :', ['f-type','f-status','filterType','filterStatus'].every(id => typeof store[id].querySelector('.dd-btn').onclick === 'function') ? 'OK' : 'FAIL');
console.log('兜底选项已填菜单 :', ['f-type','f-status','filterType','filterStatus'].map(id => id + '=' + store[id].querySelector('.dd-menu').children.length).join(' '));
console.log('按钮文案         :', ['f-type','f-status','filterType','filterStatus'].map(id => id + ':' + store[id].querySelector('.dd-txt').textContent).join(' | '));
console.log('标签兜底         :', store['tagBox'].children.length + ' 个');
console.log('对话条数 T1/T2/T3:', [code.split('var T1=')[1].split('];')[0], code.split('var T2=')[1].split('];')[0], code.split('var T3=')[1].split('];')[0]].map(s => (s.match(/'/g).length/2)).join('/'));

// ---- 验证：向上展开 + 宿主抬升 + 防误触 ----
global.window.innerHeight = 900;
function t(id) {
  const box = store[id];
  const btn = box.querySelector('.dd-btn');
  btn.getBoundingClientRect = () => ({ top: 500, bottom: 546, left: 0, right: 300 });
  btn.onclick({ preventDefault(){}, stopPropagation(){} });
  return box;
}
// 构造真实嵌套：.grid > div(host) > .dd(id)，让 hostOf 能真实向上查找
function wire(hostId) {
  const grid = new CL('DIV'); grid.className = 'grid';
  const host = new CL('DIV');
  const box = store[hostId];
  grid.appendChild(host); host.appendChild(box); box.parentNode = host; host.parentNode = grid;
  store['__grid_' + hostId] = grid;
}
wire('f-type'); wire('f-status');

const bt = t('f-type');
console.log('宿主格已加 dd-host-open :', store['f-type'].parentNode.classes.has('dd-host-open') ? 'OK' : 'FAIL');
const bs = t('f-status');
const hostType = store['f-type'].parentNode;
console.log('类型-向上展开(无dd-down):', bt.classList.contains('dd-down') ? 'FAIL 向下' : 'OK');
console.log('状态-向上展开(无dd-down):', bs.classList.contains('dd-down') ? 'FAIL 向下' : 'OK');
console.log('body 已加 dd-locked     :', global.document.body.classList.contains('dd-locked') ? 'OK' : 'FAIL');



// 模拟点空白关闭，验证 dd-host-open 与 dd-locked 都被清理
store['talkNext1'].onclick(); // 触发一次无关交互
const closeEvt = (doc._listeners || []).find(l => l[0] === 'click');
if (doc._clickHandlers) doc._clickHandlers.forEach(h => h());
console.log('关闭后清 dd-host-open   :', hostType.classes.has('dd-host-open') ? 'FAIL 残留' : 'OK');
console.log('关闭后清 dd-locked      :', global.document.body.classList.contains('dd-locked') ? 'FAIL 残留' : 'OK');

// 检查 CSS 关键规则
const sk = html;
console.log('CSS 向上展开(bottom:100%):', /bottom:calc\(100% \+ 6px\)/.test(sk) ? 'OK' : 'FAIL');
console.log('CSS dd-host-open 抬升    :', /dd-host-open\{z-index:80\}/.test(sk) ? 'OK' : 'FAIL');
console.log('CSS 防误触 pointer-events:', /dd-locked \.card \*/.test(sk) ? 'OK' : 'FAIL');
console.log('JS hostOf 已实现         :', /function hostOf/.test(code) ? 'OK' : 'FAIL');

console.log('\n--- 下拉方向与误触锁定 ---');
const boxT = store['f-type'], btnT = boxT.querySelector('.dd-btn');
btnT.onclick({ preventDefault(){}, stopPropagation(){} });
console.log('展开 f-type      :', boxT.classes.has('open') ? 'OK' : 'FAIL');
console.log('上方空间足则向上 :', boxT.classes.has('dd-down') ? 'FAIL(错误向下)' : 'OK(向上)');
btnT.onclick({ preventDefault(){}, stopPropagation(){} });  // 收起
console.log('再次点击可收起   :', boxT.classes.has('open') ? 'FAIL' : 'OK');
// 模拟上方空间不足 → 应转向下
btnT.getBoundingClientRect = () => ({ top: 5, bottom: 51, height: 46 });
btnT.onclick({ preventDefault(){}, stopPropagation(){} });
console.log('空间不足转向下   :', boxT.classes.has('dd-down') ? 'OK' : 'FAIL(未切换)');
console.log('CSS 已定义 dd-down:', /dd-down \.dd-menu/.test(html) ? 'OK' : 'FAIL');
console.log('CSS 向上定位      :', /bottom:calc\(100% \+ 6px\)/.test(html) ? 'OK' : 'FAIL');
console.log('CSS 误触屏蔽      :', /dd-locked/.test(html) ? 'OK' : 'FAIL');
