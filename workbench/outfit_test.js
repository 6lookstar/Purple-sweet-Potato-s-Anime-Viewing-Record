// 能量升级 + 服装解锁测试
const fs = require('fs');
const html = fs.readFileSync('D:/2026-10-08-19-56-19/workbench/紫薯观影手账.html', 'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];

const RECS = [{ '作品名': '请回答1988', '类型': '电影', '状态': '看完', '记录日期': '2026-10-05T00:00:00Z', record_id: 'A1' }];
const OUTFIT_URL = {
  m1: 'https://workbuddy-space-static.codebuddy.work/image/o0fxGS6vwst2DmvkDBCiIJ.jpg',
  m2: 'https://workbuddy-space-static.codebuddy.work/image/uC4e1pFxdfN8eZHB0LsDrp.jpg',
  m3: 'https://workbuddy-space-static.codebuddy.work/image/0GuQwHLNRNTGXeLoBz7xBN.jpg',
};
const OUTFIT_NAME = { m1: '黑色制服长裤', m2: '粉色背带裤', m3: '白色阔腿裤' };
let confirms = [];

class CL {
  constructor(t) { this.tagName = t; this.nodeType = 1; this.children = []; this.dataset = {}; this.style = {};
    this.attrs = {}; this._html = ''; this._text = ''; this.parentNode = null; this.classes = new Set();
    this._value = ''; this._src = ''; this.disabled = false; this._style = { setProperty(){}, removeProperty(){}, getPropertyValue(){ return ''; } }; }
  get style() { return this._style; }
  set style(v) { this._style = v; }
  get className() { return [...this.classes].join(' '); }
  set className(v) { this.classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get classList() { const s = this; return { add: c => s.classes.add(c), remove: c => s.classes.delete(c), contains: c => s.classes.has(c) }; }
  set innerHTML(v) { this._html = v; if (v === '') this.children = []; }
  get innerHTML() { return this._html; }
  set textContent(v) { this._text = String(v); this._html = ''; this.children = []; }
  get textContent() { return this._text; }
  get value() { return this._value; } set value(v) { this._value = String(v); }
  // src 支持 get/set，setProperty 风格
  get src() { return this._src; } set src(v) { this._src = v; }
  getAttribute(n) { return this.attrs[n] || null; }
  setAttribute(n, v) { this.attrs[n] = v; }
  appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
  querySelector(s) {
    if (s === 'img[data-outfit]') return this.children.find(c => c._isImg) || null;
    return null;
  }
  querySelectorAll() { return []; }
  scrollIntoView() {} focus() {} click() {}
  reset() { this._value = ''; }
  addEventListener() {} removeEventListener() {}
  get complete() { return true; } get naturalWidth() { return 200; }
}


// 手搓 DOM：.avt[data-char] 容器
const store = {};
const skel = html.split('<script>')[0];
[...new Set([...skel.matchAll(/id="([A-Za-z0-9_-]+)"/g)].map(x => x[1]))]
  .forEach(id => { store[id] = new CL('DIV'); store[id].id = id; });
['f-type', 'f-status', 'filterType', 'filterStatus'].forEach(id => {
  const box = store[id]; box.id = id;
  const btn = new CL('BUTTON'); btn.dataset.dd = '1';
  const txt = new CL('SPAN'); txt.className = 'dd-txt';
  const menu = new CL('DIV');
  btn.appendChild(txt); box.appendChild(btn); box.appendChild(menu);
  box.querySelector = s => s === '.dd-btn' ? btn : s === '.dd-menu' ? menu : s === '.dd-txt' ? txt : null;
  box.querySelectorAll = s => s === '.dd-menu' ? [menu] : [];
});
// 能量条容器需支持 appendChild
['eg-m1', 'eg-m2', 'eg-m3'].forEach(id => { store[id].children = []; store[id]._innerHTML = ''; });
const _setIH = Object.getOwnPropertyDescriptor(CL.prototype, 'innerHTML');
Object.defineProperty(CL.prototype, 'innerHTML', {
  get() { return this._html; },
  set(v) { this._html = v; if (v === '') this.children = []; if (v && v.indexOf('<i') === 0) this.children = { length: (v.match(/<i /g) || []).length, __isHTML: true }; }
});

// 三个 .avt[data-char] 容器（含 img[data-outfit]）
const avts = {};
['m1', 'm2', 'm3'].forEach(k => {
  const wrap = new CL('DIV');
  wrap.dataset.char = k;
  const img = new CL('IMG');
  img._isImg = true;
  img.setAttribute('data-outfit', '0');
  img.setAttribute('data-src0', 'ORIG_' + k + '.jpg');
  img.src = 'ORIG_' + k + '.jpg';
  wrap.appendChild(img);
  avts[k] = wrap;
});

const tagBox = store['tagBox'];
const doc = {
  _list: [], body: new CL('BODY'), hidden: false,
  createElement: t => new CL(t),
  querySelector: s => {
    if (s[0] === '#') return store[s.slice(1)] || null;
    const m = s.match(/^\.avt\[data-char="(m\d)"\]$/);
    if (m) return avts[m[1]];
    return null;
  },
  querySelectorAll: sel => {
    if (sel === '.dd.open') return Object.keys(store).filter(k => store[k].classes.has('open')).map(k => store[k]);
    if (sel === '.dd-btn[data-dd]' || sel === '.dd-btn')
      return Object.keys(store).filter(k => store[k].querySelector && store[k].querySelector('.dd-btn')).map(k => store[k].querySelector('.dd-btn'));
    if (sel === '.avt img[data-outfit]') return Object.keys(avts).map(k => avts[k].querySelector('img[data-outfit]'));
    if (sel === '#tagBox .tg') return tagBox.children;
    if (sel === '.st-tab') return ['mod1', 'mod2', 'mod3'].map(g => { const t = new CL('DIV'); t.dataset.go = g; return t; });
    return [];
  },
  getElementById: id => store[id] || null,
  addEventListener: (e, f) => { if (e === 'DOMContentLoaded') doc._ready = f; }
};
const lsData = {};
global.document = doc;
global.localStorage = { getItem: k => (k in lsData ? lsData[k] : null), setItem: (k, v) => { lsData[k] = v; }, removeItem: k => { delete lsData[k]; } };
global.window = { innerHeight: 900, addEventListener() {} };
global.confirm = (m) => { confirms.push(m); return false; };
global.alert = () => { };
global.window.__SMART_PAGE__ = {
  database: {
    getSchema: () => Promise.resolve({ properties: [] }),
    query: () => Promise.resolve({ results: RECS.map(r => Object.assign({}, r)), hasMore: false }),
    addRecord: () => Promise.resolve({}), updateRecord: () => Promise.resolve({ id: 'x' }),
    deleteRecord: () => Promise.resolve({}), uploadImage: () => Promise.resolve('u.jpg')
  }
};

eval(code);
doc._ready();

const energyOf = k => JSON.parse(lsData['wb_zishu_energy'] || '{}')[k] || 0;
const setEnergy = (k, v) => { const e = JSON.parse(lsData['wb_zishu_energy'] || '{}'); e[k] = v; lsData['wb_zishu_energy'] = JSON.stringify(e); };
const imgOf = k => avts[k].querySelector('img[data-outfit]');

setTimeout(async () => {
  console.log('【1】能量条格子数与初始状态');
  console.log('   能量条格子数=' + store['eg-m1'].children.length + ' ' + (store['eg-m1'].children.length === 72 ? 'OK 72格' : 'FAIL 应为72'));
  console.log('   等级显示="' + store['elv-m1'].textContent + '" ' + (store['elv-m1'].textContent === 'Lv.0' ? 'OK' : 'FAIL'));
  console.log('   换装按钮初始禁用=' + (store['dress1'].disabled ? 'OK 未解锁禁用' : 'FAIL'));
  console.log('   形象仍是原服装=' + (imgOf('m1').src === 'ORIG_m1.jpg' ? 'OK' : 'FAIL'));

  console.log('');
  console.log('【2】攒到 71 格：仍未升级');
  setEnergy('m1', 71);
  store['talkNext1'].onclick();
  await new Promise(r => setTimeout(r, 1200));
  console.log('   能量=' + energyOf('m1') + ' 等级="' + store['elv-m1'].textContent + '" ' + (store['elv-m1'].textContent === 'Lv.1' ? 'OK 升到Lv.1' : 'FAIL'));
  console.log('   换装按钮解禁=' + (!store['dress1'].disabled ? 'OK' : 'FAIL 仍禁用'));
  console.log('   徽章文案="' + store['ob-m1'].textContent + '"');
  console.log('   徽章高亮=' + (store['ob-m1'].classes.has('ready') ? 'OK' : 'FAIL'));

  console.log('');
  console.log('【3】点击换裤装');
  store['dress1'].onclick();
  await new Promise(r => setTimeout(r, 150));
  console.log('   形象已切换=' + (imgOf('m1').src === OUTFIT_URL.m1 ? 'OK' : 'FAIL src=' + imgOf('m1').src));
  console.log('   徽章="' + store['ob-m1'].textContent + '" ' + (store['ob-m1'].textContent.indexOf('已穿') === 0 ? 'OK' : 'FAIL'));
  console.log('   角色台词="' + store['m1Talk'].textContent + '"');
  console.log('   服装已持久化=' + (lsData['wb_zishu_outfit'] ? 'OK ' + lsData['wb_zishu_outfit'] : 'FAIL'));

  console.log('');
  console.log('【4】再点一次：换回原服装');
  store['dress1'].onclick();
  await new Promise(r => setTimeout(r, 150));
  console.log('   形象已换回=' + (imgOf('m1').src === 'ORIG_m1.jpg' ? 'OK' : 'FAIL'));

  console.log('');
  console.log('【5】第二个角色升到 Lv.1 并换背带裤');
  setEnergy('m2', 71);
  store['talkNext2'].onclick();
  await new Promise(r => setTimeout(r, 1200));
  console.log('   等级="' + store['elv-m2'].textContent + '" ' + (store['elv-m2'].textContent === 'Lv.1' ? 'OK' : 'FAIL'));
  store['dress2'].onclick();
  await new Promise(r => setTimeout(r, 150));
  console.log('   形象已切换=' + (imgOf('m2').src === OUTFIT_URL.m2 ? 'OK 背带裤' : 'FAIL'));
  console.log('   服装名=' + OUTFIT_NAME.m2 + ' 徽章="' + store['ob-m2'].textContent + '"');
  console.log('   按钮文案="' + store['dress2']._text + '"');
  const srcTxt = html.match(/id="dress2"[^>]*>([^<]+)</);
  console.log('   HTML里按钮文案="' + (srcTxt ? srcTxt[1] : '?') + '" ' + (srcTxt && srcTxt[1] === '换背带裤' ? 'OK' : 'FAIL'));

  console.log('');
  console.log('【6】第三角色');
  setEnergy('m3', 71);
  store['talkNext3'].onclick();
  await new Promise(r => setTimeout(r, 1200));
  store['dress3'].onclick();
  await new Promise(r => setTimeout(r, 150));
  console.log('   等级="' + store['elv-m3'].textContent + '" 形象切换=' + (imgOf('m3').src === OUTFIT_URL.m3 ? 'OK' : 'FAIL'));

  console.log('');
  console.log('【7】未解锁时点换装：给出攒能量提示');
  const fresh = JSON.parse(lsData['wb_zishu_outfit'] || '{}');
  delete fresh.m1; lsData['wb_zishu_outfit'] = JSON.stringify(fresh);
  setEnergy('m1', 5);
  eval(code.replace('document.addEventListener', '//x'));
  confirms = [];
  // 重新触发
  store['dress1'].disabled = false;
  store['dress1'].onclick();
  await new Promise(r => setTimeout(r, 100));
  console.log('   弹出提示=' + (confirms.length > 0 ? 'OK' : 'FAIL'));
  console.log('   提示内容="' + (confirms[0] || '').split('\n')[0] + '"');
  console.log('   剩余需=' + (confirms[0] || '').match(/再攒 (\d+) 格/) ? confirms[0].match(/再攒 (\d+) 格/)[1] + '格' : '?');
  process.exit(0);
}, 400);