// 端到端模拟：填表 → 提交 → addRecord → 重新加载 → renderRecList 出现该记录
const fs = require('fs');
const html = fs.readFileSync('D:/2026-10-08-19-56-19/workbench/紫薯观影手账.html', 'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];

const RECS = [];
let added = null;

class CL {
  constructor(t) { this.tagName = t; this.children = []; this.attrs = {}; this.dataset = {}; this.style = {};
    this._html = ''; this._text = ''; this.parentNode = null; this.classes = new Set(); this._value = ''; }
  get className() { return [...this.classes].join(' '); }
  set className(v) { this.classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  set classList(v) {}
  get classList() { const s = this; return { add: c => s.classes.add(c), remove: c => s.classes.delete(c), contains: c => s.classes.has(c) }; }
  set innerHTML(v) { this._html = v; if (v === '') this.children = []; }
  get innerHTML() { return this._html; }
  set textContent(v) { this._text = String(v); this._html = ''; this.children = []; }
  get textContent() { return this._text; }
  get value() { return this._value; }
  set value(v) { this._value = String(v); }
  appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
  addEventListener(ev, fn) { (this._ev = this._ev || {})[ev] = fn; }
  removeEventListener() {}
  querySelector() { return null; } querySelectorAll() { return []; }
  scrollIntoView() {} focus() {} click() {}
  get complete() { return true; } get naturalWidth() { return 200; }
  reset() { this._value = ''; }
}

const store = {};
const skel = html.split('<script>')[0];
[...new Set([...skel.matchAll(/id="([A-Za-z0-9_-]+)"/g)].map(x => x[1]))]
  .forEach(id => { store[id] = new CL('div'); store[id].id = id; });

['f-type','f-status','filterType','filterStatus'].forEach(id => {
  const box = store[id]; box.id = id;
  const btn = new CL('button'); btn.dataset.dd = '1';
  const txt = new CL('span'); txt.className = 'dd-txt';
  const menu = new CL('div');
  btn.appendChild(txt); box.appendChild(btn); box.appendChild(menu);
  box.querySelector = s => s === '.dd-btn' ? btn : s === '.dd-menu' ? menu : s === '.dd-txt' ? txt : null;
  box.querySelectorAll = s => s === '.dd-menu' ? [menu] : [];
});

const doc = {
  _list: [],
  createElement: t => new CL(t),
  querySelector: s => (s[0] === '#' ? (store[s.slice(1)] || null) : null),
  querySelectorAll: sel => {
    if (sel === '.dd-btn[data-dd]' || sel === '.dd-btn')
      return Object.keys(store).filter(k => store[k].querySelector && store[k].querySelector('.dd-btn')).map(k => store[k].querySelector('.dd-btn'));
    if (sel === '.st-tab') return ['mod1','mod2','mod3'].map(go => { const t = new CL('div'); t.dataset.go = go; return t; });
    return [];
  },
  getElementById: id => store[id] || null,
  addEventListener: (ev, fn) => { if (ev === 'DOMContentLoaded') doc._ready = fn; }
};
global.document = doc;
global.localStorage = { _d: {}, getItem(k){return this._d[k]||null;}, setItem(k,v){this._d[k]=v;}, removeItem(k){delete this._d[k];} };
global.indexedDB = undefined;
global.window = { open: () => null };

// 假 SDK：记录写入后能被 query 读回
global.window.__SMART_PAGE__ = { database: {
  getSchema: () => Promise.resolve({ properties: [] }),
  addRecord: ({ properties }) => {
    added = properties;
    const rec = { record_id: 'r' + (RECS.length + 1) };
    Object.keys(properties).forEach(k => {
      const v = properties[k];
      rec[k] = v.text !== undefined ? v.text : (v.select ? undefined : (v.multi_select || v.date || (typeof v.number === 'number' ? v.number : '') || ''));
      if (v.select) {
        // 模拟云端把 select id 解析成选项文本
        const map = { m1:'电影', m2:'小说', m3:'影评解说', m4:'短剧', n1:'解说', n2:'正剧', n3:'正剧和解说' };
        rec[k] = map[v.select] || v.select;
      }
    });
    RECS.push(rec);
    return Promise.resolve({ record_id: rec.record_id });
  },
  query: (opts) => {
    if (global.__QUERY_BROKEN__) return Promise.resolve({ results: [], hasMore: false });
    return Promise.resolve({ results: RECS.slice(), hasMore: false });
  },
  uploadImage: () => Promise.resolve('img.jpg'),
}};

eval(code);
doc._ready();

// 模拟用户填写并提交
store['f-title'].value = '星际穿越';
store['f-feel'].value = '重看了三遍，still好看';
store['f-date'].value = '2026-10-09';
store['submitBtn'].disabled = false;

// 选中类型/状态（模拟点菜单项）
const menu = store['f-type'].querySelector('.dd-menu');
const opt = menu.children[3]; // 影评解说
opt.onclick({ stopPropagation(){} });

let submitted = false;
store['recForm'].onsubmit({ preventDefault(){}, });

setTimeout(async () => {
  const listHTML = () => store['recList'].innerHTML +
    store['recList'].children.map(c => c.innerHTML + c.children.map(x => x.innerHTML).join('')).join('');

  console.log('【场景A】云端正常返回');
  console.log('  提交写入字段   :', added ? Object.keys(added).join(', ') : '无');
  console.log('  列表含新记录   :', listHTML().includes('星际穿越') ? 'OK 是' : 'FAIL 否');
  console.log('  卡片数         :', store['recList'].children.length);
  console.log('  记录计数       :', store['recCount'].textContent);
  console.log('  提示文案       :', store['recMsg'].textContent);

  console.log('');
  console.log('【场景B】复现你的bug：addRecord成功但云端query读不到');
  RECS.length = 0;
  store['recList'].children = []; store['recList']._html = ''; store['recList'].innerHTML = '';
  store['recMsg'].textContent = '';
  global.__QUERY_BROKEN__ = true;
  store['f-title'].value = '复现测试-庆余主线';
  store['submitBtn'].disabled = false;
  store['recForm'].onsubmit({ preventDefault(){} });

  await new Promise(r => setTimeout(r, 400));
  console.log('  提示文案       :', store['recMsg'].textContent);
  console.log('  列表仍显示     :', listHTML().includes('复现测试-庆余主线') ? 'OK 是（本地即时可见）' : 'FAIL 否');
  console.log('  记录计数       :', store['recCount'].textContent);
  global.__QUERY_BROKEN__ = false;

  console.log('');
  console.log('【场景C】换一句 & 底部导航');
  const before = store['m1Talk'].textContent;
  store['talkNext1'].onclick();
  console.log('  换一句可用     :', before + ' -> ' + store['m1Talk'].textContent);
  console.log('  底部导航       :', doc.querySelectorAll('.st-tab').length + ' 个');
  process.exit(0);
}, 300);
