// 独立进程测试：真实模拟"关闭页面 → 重新打开"，不共享任何闭包
// 用法: node reopen_test.js <mode>
const fs = require('fs');
const html = fs.readFileSync('D:/2026-10-08-19-56-19/workbench/紫薯观影手账.html', 'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const MODE = process.argv[2] || 'first';

const RECS = [
  { '作品名': '请回答1988', '类型': '电影', '状态': '看完', '记录日期': '2026-10-05T00:00:00Z', '评分': 9.2, record_id: 'A1' },
];
const LS_PATH = 'D:/2026-10-08-19-56-19/tmp/ls_reopen.json';

function readLS() { try { return JSON.parse(fs.readFileSync(LS_PATH, 'utf8')); } catch (e) { return {}; } }
function writeLS(o) { fs.writeFileSync(LS_PATH, JSON.stringify(o)); }

class CL {
  constructor(t) { this.tagName = t; this.nodeType = 1; this.children = []; this.dataset = {}; this.style = {};
    this._html = ''; this._text = ''; this.parentNode = null; this.classes = new Set(); this._value = ''; }
  get className() { return [...this.classes].join(' '); }
  set className(v) { this.classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get classList() { const s = this; return { add: c => s.classes.add(c), remove: c => s.classes.delete(c), contains: c => s.classes.has(c) }; }
  set innerHTML(v) { this._html = v; if (v === '') this.children = []; }
  get innerHTML() { return this._html; }
  set textContent(v) { this._text = String(v); this._html = ''; this.children = []; }
  get textContent() { return this._text; }
  get value() { return this._value; } set value(v) { this._value = String(v); }
  appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
  querySelector() { return null; } querySelectorAll() { return []; }
  scrollIntoView() {} focus() {} click() {} reset() { this._value = ''; }
  addEventListener() {} removeEventListener() {}
  get complete() { return true; } get naturalWidth() { return 200; }
}

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

const doc = {
  _list: [], body: new CL('BODY'), hidden: false,
  createElement: t => new CL(t),
  querySelector: s => (s[0] === '#' ? (store[s.slice(1)] || null) : null),
  querySelectorAll: sel => {
    if (sel === '.dd.open') return Object.keys(store).filter(k => store[k].classes.has('open')).map(k => store[k]);
    if (sel === '.dd-btn[data-dd]' || sel === '.dd-btn')
      return Object.keys(store).filter(k => store[k].querySelector && store[k].querySelector('.dd-btn')).map(k => store[k].querySelector('.dd-btn'));
    if (sel === '.st-tab') return ['mod1', 'mod2', 'mod3'].map(go => { const t = new CL('DIV'); t.dataset.go = go; return t; });
    return [];
  },
  getElementById: id => store[id] || null,
  addEventListener: (ev, fn) => { if (ev === 'DOMContentLoaded') doc._ready = fn; }
};

const lsData = readLS();
global.document = doc;
global.localStorage = {
  getItem: k => (k in lsData ? lsData[k] : null),
  setItem: (k, v) => { lsData[k] = v; writeLS(lsData); },
  removeItem: k => { delete lsData[k]; writeLS(lsData); }
};
global.window = { innerHeight: 900, addEventListener() {} };

// 场景：cloudOK 决定云端是否可用
const cloudOK = process.argv[3] !== 'nocLOUD';
global.window.__SMART_PAGE__ = {
  database: {
    getSchema: () => Promise.resolve({ properties: [] }),
    query: () => cloudOK ? Promise.resolve({ results: RECS.map(r => Object.assign({}, r)), hasMore: false })
                         : Promise.reject(new Error('network down')),
    addRecord: () => cloudOK ? Promise.resolve({}) : Promise.reject(new Error('network down')),
    uploadImage: () => Promise.resolve('u.jpg')
  }
};

console.log('启动前 localStorage keys=' + Object.keys(lsData).join(','));
console.log('启动前 mirror=' + String(lsData['wb_zishu_mirror_v1']).slice(0,120));
eval(code);
doc._ready();

const listTxt = () => store['recList'].children.map(c => c.innerHTML + c.children.map(x => x.innerHTML).join('')).join('');

setTimeout(async () => {
  if (MODE === 'first') {
    // 第一次：云端不可用，用户存一条
    store['f-title'].value = '傲慢与偏见';
    store['submitBtn'].disabled = false;
    store['recForm'].onsubmit({ preventDefault(){} });
    await new Promise(r => setTimeout(r, 1800));
    console.log('第一次打开（云端不可用）');
    console.log('  提示="' + store['recMsg'].textContent + '"');
    console.log('  记录数=' + store['recCount'].textContent);
    console.log('  同步状态="' + store['syncTxt'].textContent + '"');
    const mv = global.localStorage.getItem('wb_zishu_mirror_v1');
    console.log('  镜像内容=' + String(mv).slice(0,200));
    console.log('  recList DOM=' + String(store['recList'].innerHTML).slice(0,80));
  } else {
    // 第二次：全新页面，仍云端不可用 → 记录必须还在
    console.log('重新打开页面（云端仍不可用）');
    console.log('  记录数=' + store['recCount'].textContent);
    console.log('  含傲慢与偏见=' + (listTxt().includes('傲慢与偏见') ? 'OK 数据未丢' : 'FAIL 数据丢失'));
    console.log('  同步状态="' + store['syncTxt'].textContent + '"');
  }
  process.exit(0);
}, 300);
