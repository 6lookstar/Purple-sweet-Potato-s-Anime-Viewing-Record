// 回归测试：覆盖"addRecord返回空"、"getSchema失败"、"数据加载失败"三个真实故障场景
const fs = require('fs');
const html = fs.readFileSync('D:/2026-10-08-19-56-19/workbench/紫薯观影手账.html', 'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];

const RECS = [
  { '作品名': '请回答1988', '类型': '电影', '状态': '看完', '记录日期': '2026-10-05T00:00:00Z', '评分': 9.2, record_id: 'A1' },
  { '作品名': '小王子', '类型': '小说', '状态': '看完', '记录日期': '2026-10-03T00:00:00Z', '评分': 9, record_id: 'A2' },
];

function makeEnv(opt) {
  opt = opt || {};
  const store = {};
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
    get value() { return this._value; }
    set value(v) { this._value = String(v); }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    querySelector() { return null; } querySelectorAll() { return []; }
    scrollIntoView() {} focus() {} click() {} reset() { this._value = ''; }
    addEventListener(ev, fn) { (this._ev = this._ev || {})[ev] = fn; }
    removeEventListener() {}
    get complete() { return true; } get naturalWidth() { return 200; }
  }
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
    _list: [], body: new CL('BODY'),
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
  const ls = { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = v; }, removeItem(k) { delete this._d[k]; } };
  const db = {
    getSchema: () => opt.schemaFail ? Promise.reject(new Error('schema boom')) : Promise.resolve({ properties: [] }),
    query: () => opt.queryFail ? Promise.reject(new Error('query boom')) : Promise.resolve({ results: RECS.map(r => Object.assign({}, r)), hasMore: false }),
    // 关键模拟：页面 SDK 的 addRecord 可能返回 {}（不返回 id），
    // 但写入其实已生效 —— 必须靠回读 query 来确认，而不是靠返回值。
    addRecord: ({ properties }) => {
      if (opt.addFail) return Promise.resolve({});   // 假成功：resolve 但没写入
      const rec = { record_id: 'NEW_' + (RECS.length + 1) };
      Object.keys(properties).forEach(k => {
        const v = properties[k];
        rec[k] = v.text !== undefined ? v.text
          : v.select ? v.select : v.date || (v.multi_select || (typeof v.number === 'number' ? v.number : ''));
      });
      RECS.push(rec);
      return Promise.resolve({});                     // 返回空对象，与真实 SDK 一致
    },
    uploadImage: () => Promise.resolve('u.jpg'),
  };
  return { store, doc, ls, db };
}

async function run(title, opt, check) {
  const env = makeEnv(opt);
  global.document = env.doc; global.window = { __SMART_PAGE__: { database: env.db } };
  global.localStorage = env.ls;
  try { eval(code); env.doc._ready(); } catch (e) { console.log(title + ' → 运行时异常: ' + e.message); return; }
  await new Promise(r => setTimeout(r, 250));
  const listTxt = env.store['recList'].children.map(c => c.innerHTML + c.children.map(x => x.innerHTML).join('')).join('');
  console.log('   ' + check(env, listTxt));
}

async function submitCase(title, opt, expect) {
  RECS.length = 0;
  RECS.push({ '作品名': '请回答1988', '类型': '电影', '状态': '看完', '记录日期': '2026-10-05T00:00:00Z', '评分': 9.2, record_id: 'A1' });
  const env = makeEnv(opt);
  global.document = env.doc; global.window = { __SMART_PAGE__: { database: env.db } };
  global.localStorage = env.ls;
  eval(code); env.doc._ready();
  await new Promise(r => setTimeout(r, 150));
  env.store['f-title'].value = '傲慢与偏见';
  env.store['f-feel'].value = '很好';
  env.store['submitBtn'].disabled = false;
  env.store['recForm'].onsubmit({ preventDefault(){} });
  await new Promise(r => setTimeout(r, 1600));   // 等两次回读校验完成
  const msg = env.store['recMsg'].textContent;
  const count = env.store['recCount'].textContent;
  const draft = env.ls.getItem('wb_zishu_draft_title');
  const inCloud = RECS.some(r => r['作品名'] === '傲慢与偏见');
  console.log(title);
  console.log('   提示="' + msg + '"  记录数=' + count + '  云端已入库=' + (inCloud ? '是' : '否'));
  console.log('   → ' + expect(msg, count, inCloud, draft));
}

(async () => {
  await run('【场景1】加载正常', {}, (e, l) =>
    '记录数=' + e.store['recCount'].textContent + ' 含请回答1988=' + (l.includes('请回答1988') ? 'OK' : 'FAIL'));

  await run('【场景2】getSchema失败（数据仍须显示）', { schemaFail: true }, (e, l) =>
    '记录数=' + e.store['recCount'].textContent + ' 含请回答1988=' + (l.includes('请回答1988') ? 'OK 解耦生效' : 'FAIL 记录丢失'));

  await run('【场景3】query失败（须提示而非静默0条）', { queryFail: true }, (e) =>
    '同步状态="' + e.store['syncTxt'].textContent + '" 记录数=' + e.store['recCount'].textContent +
    (e.store['syncTxt'].textContent.indexOf('失败') > -1 || e.store['syncTxt'].textContent.indexOf('离线') > -1 ? ' OK 有明确提示' : ' FAIL 静默'));

  console.log('');
  await submitCase('【场景4】写入正常（addRecord返回{}但实际入库）', {}, (msg, cnt, cloud) =>
    (msg === '记好啦！' && cloud ? 'OK 回读校验通过，判定成功' : 'FAIL msg=' + msg + ' cloud=' + cloud));

  await submitCase('【场景5】写入未生效（addRecord resolve但没入库）', { addFail: true }, (msg, cnt, cloud, draft) =>
    (msg.indexOf('已存本地') === 0 && !cloud ? 'OK 如实标注已存本地' : 'FAIL msg=' + msg) +
    '  （数据已入本地镜像，草稿可清）');

  // 场景6：本地已有镜像 + 云端查询失败 → 重进页面必须能看到之前的记录
  {
    const env1 = makeEnv({ addFail: true });
    global.document = env1.doc; global.window = { __SMART_PAGE__: { database: env1.db } };
    global.localStorage = env1.ls;
    eval(code); env1.doc._ready();
    await new Promise(r => setTimeout(r, 150));
    env1.store['f-title'].value = '傲慢与偏见';
    env1.store['submitBtn'].disabled = false;
    env1.store['recForm'].onsubmit({ preventDefault(){} });
    await new Promise(r => setTimeout(r, 1700));
    const mirror = env1.ls.getItem('wb_zishu_mirror_v1');
    console.log('   镜像内容=' + (mirror || 'null'));
    console.log('【场景6】模拟重进页面：本地有镜像 + 云端不可用');
    console.log('   镜像已写入=' + (mirror ? 'OK' : 'FAIL'));
    console.log('   镜像内容=' + String(mirror).slice(0,160));

    // 换一个全新环境（模拟重新打开页面），云端 query 失败
    const env2 = makeEnv({ queryFail: true });
    global.document = env2.doc; global.window = { __SMART_PAGE__: { database: env2.db } };
    global.localStorage = env2.ls;
    env2.ls.setItem('wb_zishu_mirror_v1', mirror);
    console.log('   env2 db存在=' + (!!(global.window.__SMART_PAGE__ && global.window.__SMART_PAGE__.database)));
    console.log('   env2读回镜像=' + String(env2.ls.getItem('wb_zishu_mirror_v1')).slice(0,60));
    eval(code); env2.doc._ready();
    await new Promise(r => setTimeout(r, 600));
    console.log('   env2 recCount元素=' + env2.store['recCount'].textContent);
    console.log('   env2 recList.innerHTML前60=' + String(env2.store['recList'].innerHTML).slice(0,60));
    console.log('   env2 recList子节点数=' + env2.store['recList'].children.length);
    const txt = env2.store['recList'].children.map(c => c.innerHTML + c.children.map(x => x.innerHTML).join('')).join('');
    console.log('   重进后记录数=' + env2.store['recCount'].textContent +
      ' 含傲慢与偏见=' + (txt.includes('傲慢与偏见') ? 'OK 数据未丢' : 'FAIL 数据丢失'));
    console.log('   同步状态="' + env2.store['syncTxt'].textContent + '"');
  }
  process.exit(0);
})();
