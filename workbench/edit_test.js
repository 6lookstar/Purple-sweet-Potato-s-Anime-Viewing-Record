// 编辑记录功能测试：回填 → 修改 → updateRecord → 列表更新 → 取消编辑
const fs = require('fs');
const html = fs.readFileSync('D:/2026-10-08-19-56-19/workbench/紫薯观影手账.html', 'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];

let RECS = [
  { '作品名': '请回答1988', '类型': '电影', '状态': '看完', '一句话感受': '双门洞的烟火气',
    '记录日期': '2026-10-05T00:00:00Z', '评分': 9.2, '标签': ['催泪', '成长'], record_id: 'R1' },
];
const OPT = {
  '类型': [{ id: 'm1', text: '电影' }, { id: 'm2', text: '小说' }, { id: 'm3', text: '影评解说' }],
  '状态': [{ id: 'n1', text: '解说' }, { id: 'n2', text: '正剧' }, { id: 's3', text: '看完' }],
  '标签': [{ id: 't1', text: '治愈' }, { id: 't6', text: '成长' }, { id: 't8', text: '催泪' }, { id: 't2', text: '悬疑' }],
};
let updCalls = [], addCalls = [];

class CL {
  constructor(t) { this.tagName = t; this.nodeType = 1; this.children = []; this.dataset = {}; this.style = {};
    this._html = ''; this._text = ''; this.parentNode = null; this.classes = new Set(); this._value = ''; this._type = 'text'; }
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
  scrollIntoView() {} focus() {} click() {}
  reset() { this._value = ''; this._text = ''; this._html = ''; this.children = []; }
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
// 标签按钮（renderOptions 会生成）
const tagBox = store['tagBox'];
OPT['标签'].forEach(o => {
  const el = new CL('SPAN');
  el.className = 'tg'; el.textContent = o.text; el.dataset.optId = o.id;
  tagBox.children.push(el);
});

const doc = {
  _list: [], body: new CL('BODY'), hidden: false,
  createElement: t => new CL(t),
  querySelector: s => (s[0] === '#' ? (store[s.slice(1)] || null) : null),
  querySelectorAll: sel => {
    if (sel === '.dd.open') return Object.keys(store).filter(k => store[k].classes.has('open')).map(k => store[k]);
    if (sel === '.dd-btn[data-dd]' || sel === '.dd-btn')
      return Object.keys(store).filter(k => store[k].querySelector && store[k].querySelector('.dd-btn')).map(k => store[k].querySelector('.dd-btn'));
    if (sel === '#tagBox .tg') return tagBox.children;
    if (sel === '.st-tab') return ['mod1', 'mod2', 'mod3'].map(go => { const t = new CL('DIV'); t.dataset.go = go; return t; });
    return [];
  },
  getElementById: id => store[id] || null,
  addEventListener: (ev, fn) => { if (ev === 'DOMContentLoaded') doc._ready = fn; }
};
const lsData = {};
global.document = doc;
global.localStorage = {
  getItem: k => (k in lsData ? lsData[k] : null),
  setItem: (k, v) => { lsData[k] = v; },
  removeItem: k => { delete lsData[k]; }
};
global.window = { innerHeight: 900, addEventListener() {} };
global.confirm = () => true;
global.alert = m => console.log('  [alert]', m);

const MAP = {};
Object.keys(OPT).forEach(f => OPT[f].forEach(o => { MAP[f + '|' + o.id] = o.text; }));

global.window.__SMART_PAGE__ = {
  database: {
    getSchema: () => Promise.resolve({ properties: [] }),
    query: () => Promise.resolve({ results: RECS.map(r => Object.assign({}, r)), hasMore: false }),
    addRecord: ({ properties }) => { addCalls.push(properties); return Promise.resolve({}); },
    updateRecord: ({ recordId, properties }) => {
      updCalls.push({ recordId, properties });
      // 模拟云端真实增量更新
      const r = RECS.find(x => x.record_id === recordId);
      if (r) {
        Object.keys(properties).forEach(k => {
          const v = properties[k];
          if (k === '标签') r[k] = v.multi_select;
          else if (k === '评分') r[k] = v.number;
          else if (k === '记录日期') r[k] = v.date;
          else if (v.select !== undefined) r[k] = MAP[k + '|' + v.select] || '';
          else r[k] = v.text;
        });
      }
      return Promise.resolve({ id: recordId });
    },
    deleteRecord: () => Promise.resolve({}),
    uploadImage: () => Promise.resolve('u.jpg')
  }
};

eval(code);
doc._ready();

const listTxt = () => store['recList'].children.map(c => c.innerHTML + c.children.map(x => x.innerHTML).join('')).join('');
const recCard = store['recList'].children[0];
// 卡片里的按钮容器
function findEditBtn(card) {
  const walk = c => {
    if (c.children && c.children.length) {
      for (const ch of c.children) {
        if (ch.children && ch.children.length) { const r = walk(ch); if (r) return r; }
        else if (ch._text === '编辑') return ch;
      }
    }
    return null;
  };
  return walk(card);
}

setTimeout(async () => {
  console.log('【1】初始渲染');
  console.log('   记录数=' + store['recCount'].textContent + ' 卡片数=' + store['recList'].children.length);
  console.log('   提交按钮文案="' + store['submitTxt'].textContent + '" 取消按钮可见=' + (store['cancelEdit'].style.display !== 'none'));

  console.log('');
  console.log('【2】点击「编辑」→ 回填表单');
  const eb = findEditBtn(store['recList'].children[0]);
  console.log('   找到编辑按钮=' + (eb ? 'OK' : 'FAIL'));
  eb.onclick();
  console.log('   作品名回填="' + store['f-title'].value + '" ' + (store['f-title'].value === '请回答1988' ? 'OK' : 'FAIL'));
  console.log('   感受回填="' + store['f-feel'].value.slice(0, 10) + '… " ' + (store['f-feel'].value.indexOf('双门洞') === 0 ? 'OK' : 'FAIL'));
  console.log('   评分回填=' + store['f-score'].value + ' ' + (store['f-score'].value === '9.2' ? 'OK' : 'FAIL'));
  console.log('   日期回填=' + store['f-date'].value + ' ' + (store['f-date'].value === '2026-10-05' ? 'OK' : 'FAIL'));
  console.log('   类型下拉="' + store['f-type'].querySelector('.dd-txt').textContent + '" ' + (store['f-type'].querySelector('.dd-txt').textContent === '电影' ? 'OK' : 'FAIL'));
  console.log('   状态下拉="' + store['f-status'].querySelector('.dd-txt').textContent + '" ' + (store['f-status'].querySelector('.dd-txt').textContent === '看完' ? 'OK' : 'FAIL'));
  console.log('   标签勾选=' + tagBox.children.filter(c => c.classes.has('on')).map(c => c.textContent).join(',') + ' ' + (tagBox.children.filter(c => c.classes.has('on')).length === 2 ? 'OK' : 'FAIL'));
  console.log('   按钮变为"' + store['submitTxt'].textContent + '" ' + (store['submitTxt'].textContent === '保存修改' ? 'OK' : 'FAIL'));
  console.log('   编辑提示条可见=' + (store['editBar'].style.display === 'flex' ? 'OK' : 'FAIL'));
  console.log('   取消按钮可见=' + (store['cancelEdit'].style.display !== 'none' ? 'OK' : 'FAIL'));

  console.log('');
  console.log('【3】修改内容并保存');
  store['f-title'].value = '请回答1988（重看）';
  store['f-feel'].value = '二刷依然会哭';
  store['f-score'].value = '9.5';
  store['submitBtn'].disabled = false;
  store['recForm'].onsubmit({ preventDefault(){} });
  await new Promise(r => setTimeout(r, 800));

  console.log('   updateRecord 调用次数=' + updCalls.length + ' ' + (updCalls.length === 1 ? 'OK' : 'FAIL'));
  console.log('   addRecord 被误调用=' + addCalls.length + ' ' + (addCalls.length === 0 ? 'OK 未误建新记录' : 'FAIL'));
  if (updCalls.length) {
    console.log('   recordId=' + updCalls[0].recordId + ' ' + (updCalls[0].recordId === 'R1' ? 'OK' : 'FAIL'));
    console.log('   提交字段=' + Object.keys(updCalls[0].properties).join(','));
  }
  console.log('   提示="' + store['recMsg'].textContent + '"');
  console.log('   云端数据已更新=' + (RECS[0]['作品名'] === '请回答1988（重看）' && RECS[0]['评分'] === 9.5 ? 'OK' : 'FAIL'));
  console.log('   列表显示新内容=' + (listTxt().includes('请回答1988（重看）') ? 'OK' : 'FAIL'));
  console.log('   记录数仍为1=' + store['recCount'].textContent + ' ' + (store['recCount'].textContent === '1' ? 'OK 未重复新增' : 'FAIL'));
  console.log('   编辑态已退出=' + (store['submitTxt'].textContent === '存进手账' && store['editBar'].style.display === 'none' ? 'OK' : 'FAIL'));

  console.log('');
  console.log('【4】取消编辑');
  const eb2 = findEditBtn(store['recList'].children[0]);
  eb2.onclick();
  console.log('   进入编辑态=' + (store['submitTxt'].textContent === '保存修改' ? 'OK' : 'FAIL'));
  store['cancelEdit'].onclick();
  console.log('   取消后按钮恢复="' + store['submitTxt'].textContent + '" ' + (store['submitTxt'].textContent === '存进手账' ? 'OK' : 'FAIL'));
  console.log('   取消后表单清空=' + (store['f-title'].value === '' ? 'OK' : 'FAIL'));
  console.log('   取消后标签清空=' + (tagBox.children.filter(c => c.classes.has('on')).length === 0 ? 'OK' : 'FAIL'));

  process.exit(0);

}, 400);