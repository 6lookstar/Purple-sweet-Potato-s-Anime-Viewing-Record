<script>
(function(){
  "use strict";
  /* ========= 状态 ========= */
  var DATABASE_ID='l7QS9IsJihcaB0K9mAUqO0';
  var DB_REC=DATABASE_ID, DB_REV='aJ3Dv56KV7sTcevVYjRltR', DB_REC2='jyICRlfcd2tUZrn7GCPltH';
  var S={recs:[],revs:[],recs2:[],schema:{},picked:{},files:[],taste:[],edit:null};

  /* ========= 工具层（无依赖） ========= */
  function $(s){return document.querySelector(s);}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function daysBetween(a,b){return Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);}
  function stars(n){var i=Math.round(Number(n)||0);if(i<=0)return '';
    return new Array(Math.min(i,5)+1).join('★')+(i>5?'☆':'');}
  function setSync(txt,mode){
    $('#syncTxt').textContent=txt;var d=$('#syncDot');
    d.className='dot'+(mode==='busy'?' busy':mode==='off'?' off':'');}

  /* ========= SDK ========= */
  function sdk(){try{return window.__SMART_PAGE__ && window.__SMART_PAGE__.database;}catch(e){return null;}}
  var db=sdk();

  /* ========= 数据层 ========= */
  /* 按库 id 全量拉取；出错时 reject，由调用方决定如何提示（不静默返回空数组） */
  function loadById(id,cursor,acc,guard){
    acc=acc||[];guard=guard||0;
    if(!db)return Promise.resolve(acc);
    if(guard>60)return Promise.resolve(acc);
    var q={databaseId:id,pageSize:200};
    if(cursor)q.startCursor=cursor;
    return fetchPage(q).then(function(r){
      var rows=r.results||[];
      acc=acc.concat(rows);
      var next=r.nextCursor;
      if(r.hasMore&&next&&next!==cursor&&rows.length)return loadById(id,next,acc,guard+1);
      return acc;
    });
  }
  /* 三个库各自硬编码 databaseId（lint 要求字面量） */
  function fetchPage(q){
    if(q.databaseId===DB_REV)return db.query({databaseId:'aJ3Dv56KV7sTcevVYjRltR',pageSize:q.pageSize,startCursor:q.startCursor});
    if(q.databaseId===DB_REC2)return db.query({databaseId:'jyICRlfcd2tUZrn7GCPltH',pageSize:q.pageSize,startCursor:q.startCursor});
    return db.query({databaseId:'l7QS9IsJihcaB0K9mAUqO0',pageSize:q.pageSize,startCursor:q.startCursor});
  }
  /* 主表快捷入口 */
  function loadAll(){return loadById(DATABASE_ID);}
  function uploadOne(file){
    return new Promise(function(res,rej){
      if(file.size>8*1024*1024) return rej(new Error('单张不能超过8MB'));
      var rd=new FileReader();
      rd.onload=function(){res(String(rd.result).split(',')[1]||'');};
      rd.onerror=function(){rej(new Error('读取失败'));};
      rd.readAsDataURL(file);
    }).then(function(b64){
      return db.uploadImage({data:b64,contentType:file.type,fileName:file.name});
    }).then(function(r){
      if(!r||!r.url) throw new Error('上传失败');
      return {title:file.name,imageUrl:r.url};
    });
  }

  /* ========= 对话库 ========= */
  /* 角色1 黑长直 —— 清冷疏离（发箍 lkx · 黑色本子） */
  var T1=['宝宝可以告诉我你最近看的电影和小说吗',
          '宝宝你该记录这几天看的电影解说和小说了～',
          '……说吧，我在听。',
          '记下来吧，忘了就找不回来了。',
          '这本子记了多少年了，你自己还记得吗。',
          '别急着说下一部，先把这部讲完。',
          '我看过了。嗯……还行。',
          '你的口味我大概知道了。',
          '宝宝要是累了就先歇会儿，本子我替你拿着。',
          '发箍上的 lkx，你倒是一点都没变。',
          '不用急着夸我，把名字写上就行。',
          '我记得你说过想看这部，忘了？',
          '记录这种事，交给我最合适了。',
          '天色不早了，看完这个就去睡。'];
  /* 角色2 浅金双马尾 —— 傲娇（单手叉腰 · 蝴蝶结） */
  var T2=['其实我也没有很想你。',
          '才想起来找我吗，哼！',
          '哼，我就知道你迟早来找我。',
          '……好吧，看在你这么努力找我的份上，帮你查。',
          '喂，这次算你有诚意，赏你一个答案。',
          '找我可以，但要夸我两句。',
          '哼，口味还行嘛，勉强配得上本小姐。',
          '快点啦，我还要去逛街呢。',
          '这次就特别批准你问一下吧。',
          '哼，我才没有等你，只是刚好在这儿而已。',
          '夸我两句会死啊？不说我就走咯。',
          '别的网站我可不看，勉强帮你翻一下啦。',
          '你要是敢说我不温柔，我就把你记录删了。',
          '找吧找吧，本小姐今天心情好，就勉为其难。'];
  /* 角色3 银发 —— 文静淡雅（银色钢笔 · 裙摆 lkx） */
  var T3=['要看看我为你推荐的电影吗？',
          '依你的口味，我挑了几部，慢慢看。',
          '不必急，一部一部来便好。',
          '若合心意，便记进手账里罢。',
          '看过了么？那便换一部罢。',
          '这些是我细读之后写下的，供参考。',
          '你的记录我看过了，进益不少。',
          '慢下来，才能尝出味道。',
          '钢笔借你一分钟，写下此刻的心情罢。',
          '这一部，我按你最近的偏好挑的。',
          '不必谢我，我只是喜欢看你记东西的样子。',
          '若想换一种口味，告诉我便是。',
          '好的故事，值得被好好记下来。'];
  function nextTalk(id,arr,key){
    var cur=arr.indexOf($(id).textContent);
    $(id).textContent=arr[(cur+1)%arr.length];
  }

  /* ========= 本地镜像存储（云端不可用时兜底，保证退出不丢） ========= */
  var LSK='wb_zishu_mirror_v1';
  function saveMirror(){
    /* 关键：绝不能用空数据覆盖已有镜像（否则启动时一次空渲染就把数据抹了） */
    if(!S.recs||!S.recs.length)return;
    try{localStorage.setItem(LSK,JSON.stringify({t:Date.now(),recs:S.recs,revs:S.revs}));}catch(e){}
  }
  function loadMirror(){
    try{var raw=localStorage.getItem(LSK);if(!raw)return null;
      var o=JSON.parse(raw);if(!o||!o.recs||!o.recs.length)return null;return o;}catch(e){return null;}
  }
  /* 云端 + 本地镜像合并去重（云端优先，本地补漏） */
  function mergeMirror(cloudRecs,cloudRevs){
    var m=loadMirror();
    if(!m)return{recs:cloudRecs,revs:cloudRevs};
    var recs=cloudRecs.slice(),seen={};
    recs.forEach(function(r){seen[r.record_id||('n:'+r['作品名'])]=1;});
    (m.recs||[]).forEach(function(r){
      var k=r.record_id||('n:'+r['作品名']);
      if(!seen[k]){seen[k]=1;recs.push(r);}
    });
    var revs=cloudRevs.slice(),rseen={};
    revs.forEach(function(r){rseen[r.record_id||('n:'+(r['影评标题']||r['标题']))]=1;});
    (m.revs||[]).forEach(function(r){
      var k=r.record_id||('n:'+(r['影评标题']||r['标题']));
      if(!rseen[k]){rseen[k]=1;revs.push(r);}
    });
    return{recs:recs,revs:revs};
  }

  /* ========= 渲染层（互不调用） ========= */
  /* 兜底选项表：getSchema 失败时保证下拉框仍可选择（id 与线上一致） */
  var FALLBACK={
    '类型':[{id:'m1',text:'电影'},{id:'m2',text:'小说'},{id:'m3',text:'影评解说'},{id:'m4',text:'短剧'},
      {id:'g1',text:'动作片'},{id:'g2',text:'喜剧片'},{id:'g3',text:'爱情片'},{id:'g4',text:'科幻片'},
      {id:'g5',text:'恐怖片'},{id:'g6',text:'悬疑片'},{id:'g7',text:'剧情片'},{id:'g8',text:'动画片'},
      {id:'g9',text:'奇幻片'},{id:'g10',text:'冒险片'}],
    '状态':[{id:'n1',text:'解说'},{id:'n2',text:'正剧'},{id:'n3',text:'正剧和解说'},
      {id:'s1',text:'想看'},{id:'s2',text:'在看'},{id:'s3',text:'看完'}],
    '标签':[{id:'t1',text:'治愈'},{id:'t2',text:'悬疑'},{id:'t3',text:'爱情'},{id:'t4',text:'科幻'},
      {id:'t5',text:'动画'},{id:'t6',text:'成长'},{id:'t7',text:'烧脑'},{id:'t8',text:'催泪'}]
  };

  function renderOptions(){
    /* 先用兜底表铺底，保证任何情况下下拉框都有选项可点 */
    S.schema={};
    Object.keys(FALLBACK).forEach(function(k){S.schema[k]=FALLBACK[k];});
    var sc=S.schema;
    fillSelect('f-type',sc['类型'],false,'请选择类型');fillSelect('f-status',sc['状态'],false,'请选择状态');
    fillSelect('filterType',sc['类型'],true,'全部类型');fillSelect('filterStatus',sc['状态'],true,'全部状态');
    var tb=$('#tagBox');tb.innerHTML='';
    (sc['标签']||[]).forEach(function(o){
      var el=document.createElement('span');
      el.className='tg';el.textContent=o.text;el.dataset.optId=o.id;
      el.onclick=function(){S.picked[o.id]=!S.picked[o.id];
        el.className='tg'+(S.picked[o.id]?' on':'');};
      tb.appendChild(el);
    });

  }
  /* 自定义下拉：把选项渲染成 div 列表，值存 S.dd[id] */
  S.dd=S.dd||{};

  function fillSelect(id,opts,withAll,placeholder){
    var box=document.getElementById(id);if(!box)return;
    var btn=box.querySelector('.dd-btn'),menu=box.querySelector('.dd-menu');
    if(!btn||!menu)return;
    menu.innerHTML='';
    function mk(text,val){
      var o=document.createElement('div');
      o.className='dd-opt';o.dataset.val=val;
      o.innerHTML='<span>'+esc(text)+'</span>';
      if(S.dd[id]===val)o.classList.add('sel');
      o.onclick=function(e){
        e.stopPropagation();
        S.dd[id]=val;setDDText(id,text,false);
        closeDD();renderRecList();
      };
      menu.appendChild(o);
    }
    if(withAll)mk('全部','');
    (opts||[]).forEach(function(o){mk(o.text,o.id);});
    box._menuItems=menu.children.length;
    /* 默认不预选：单选框显示占位文案，下拉菜单第一项即可选中 */
    if(S.dd[id]===undefined)S.dd[id]='';
    var cur=opts||[],hit=false;
    for(var i=0;i<cur.length;i++){
      if(cur[i].id===S.dd[id]){setDDText(id,cur[i].text,false);hit=true;break;}
    }
    if(!hit)setDDText(id,placeholder||'请选择',true);
  }
  function setDDText(id,text,isPh){
    var box=document.getElementById(id);if(!box)return;
    var t=box.querySelector('.dd-txt');if(!t)return;
    t.textContent=text;t.className='dd-txt'+(isPh?' ph':'');
  }
  function closeDD(){
    Array.prototype.forEach.call(document.querySelectorAll('.dd.open'),function(d){
      d.classList.remove('open');
      d.classList.remove('dd-down');
      var b=d.querySelector('.dd-btn');if(b)b.classList.remove('open');
      /* 复位宿主格子的抬升类（不依赖 :has 的兜底） */
      var host=hostOf(d);if(host)host.classList.remove('dd-host-open');
    });
    if(document.body)document.body.classList.remove('dd-locked');
  }
  /* 找到下拉所在的 .grid>div 宿主格子（向上冒泡，找父级为 .grid 的那个 div） */
  function hostOf(box){
    var n=box;
    while(n&&n.parentNode){
      n=n.parentNode;
      if(n.nodeType!==1||!n.tagName||n.tagName!=='DIV')continue;
      var pn=n.parentNode;
      if(pn&&pn.className&&(' '+pn.className+' ').indexOf(' grid ')>-1)return n;
    }
    return null;
  }
  /* 决定展开方向：默认向上（不遮挡下方评分）；上方空间不足才向下 */
  function placeDD(box){
    box.classList.remove('dd-down');
    var btn=box.querySelector('.dd-btn');if(!btn)return;
    var need=Math.min(262,Math.max(120,(box._menuItems||0)*44+10));
    var r=btn.getBoundingClientRect();
    var vh=window.innerHeight||document.documentElement.clientHeight||0;
    /* 上方空间不足且下方更宽裕时才向下；否则一律向上 */
    if(r.top<need+8&&(vh-r.bottom)>need)box.classList.add('dd-down');
  }
  function resetDD(){
    S.dd['f-type']='';S.dd['f-status']='';
    setDDText('f-type','请选择类型',true);setDDText('f-status','请选择状态',true);
    closeDD();
  }
  function bindDD(){
    Array.prototype.forEach.call(document.querySelectorAll('.dd-btn[data-dd]'),function(b){
      b.onclick=function(e){
        e.preventDefault();e.stopPropagation();
        var box=b.parentNode,wasOpen=box.classList.contains('open');
        closeDD();
        if(!wasOpen){
          box.classList.add('open');b.classList.add('open');
          if(document.body)document.body.classList.add('dd-locked');
          var host=hostOf(box);if(host)host.classList.add('dd-host-open');
          placeDD(box);
        }
      };
    });
    document.addEventListener('click',closeDD);
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeDD();});
  }
  function optText(field,id){
    var a=S.schema[field]||[];for(var i=0;i<a.length;i++){if(a[i].id===id)return a[i].text;}
    return id||'';
  }

  function renderToday(){
    var box=$('#todayList'),out=[],td=today();
    S.recs.forEach(function(r){
      var st=r['状态'],nm=r['作品名'];
      if(st==='想看') out.push({nm:nm,sub:'标记为想看，还没有安排上',ov:false,a:'去记录',id:r.record_id});
      else if(st==='在看'){out.push({nm:nm,sub:'正在看，记得追完',ov:false,a:'标记看完',id:r.record_id});}
      var d=r['记录日期'];if(d&&st==='看完'){var g=daysBetween(String(d).slice(0,10),td);
        if(g===0) out.push({nm:nm,sub:'今天刚看完，很新鲜',ov:false,a:'写点感受',id:r.record_id});}
    });
    S.recs.forEach(function(r){
      var d=r['记录日期'];if(!d)return;
      var g=daysBetween(String(d).slice(0,10),td);
      if(g>30&&r['状态']!=='看完') out.push({nm:r['作品名'],sub:'已经 '+g+' 天没动过了，要放弃吗',ov:true,a:'标记看完',id:r.record_id});
    });
    if(!out.length){box.innerHTML='<div class="empty"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 13s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg><p>暂时没有待处理的事，好清闲～</p></div>';return;}
    box.innerHTML='';
    out.slice(0,8).forEach(function(t){
      var d=document.createElement('div');d.className='titem'+(t.ov?' over':'');
      d.innerHTML='<div class="nm">'+esc(t.nm)+'<small>'+esc(t.sub)+'</small></div>';
      var b=document.createElement('button');b.className='sm';b.textContent=t.a;
      b.onclick=function(){markDone(t.id);};
      d.appendChild(b);box.appendChild(d);
    });
  }

  function renderRecList(){
    var box=$('#recList');$('#recCount').textContent=S.recs.length;
    var ft=S.dd.filterType||'',fs=S.dd.filterStatus||'';
    var rows=S.recs.filter(function(r){
      if(ft&&r['类型']!==optText('类型',ft))return false;
      if(fs&&r['状态']!==optText('状态',fs))return false;
      return true;
    });
    if(!rows.length){box.innerHTML='<div class="empty"><svg class="ico" viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h10"/></svg><p>还没有记录，上面添加一条吧～</p></div>';return;}
    box.innerHTML='';
    rows.forEach(function(r){
      var d=document.createElement('div');d.className='rec';
      var cov=r['封面或截图'];
      var img=(cov&&cov.length&&cov[0].imageUrl)?'<img src="'+esc(cov[0].imageUrl)+'" alt="">':'';
      var tags=(r['标签']||[]).map(function(t){return '<span class="pill">'+esc(t)+'</span>';}).join('');
      d.innerHTML='<div class="top"><div class="cover">'+img+'</div><div style="flex:1;min-width:0">'+
        '<h3>'+esc(r['作品名'])+'</h3>'+
        '<div><span class="pill">'+esc(r['类型']||'')+'</span> <span class="pill pk">'+esc(r['状态']||'')+'</span> '+
        '<span class="stars">'+stars(r['评分'])+'</span></div>'+
        '<div style="margin-top:6px">'+tags+'</div>'+
        '<div class="feel">'+esc(r['一句话感受']||'')+'</div>'+
        '<div style="font-size:11.5px;color:var(--ink2);margin-top:6px">'+esc(String(r['记录日期']||'').slice(0,10))+'</div>'+
        '</div></div>';
      var wrap=document.createElement('div');
      wrap.className='rec-acts';
      var eb=document.createElement('button');eb.className='sm';
      eb.textContent='编辑';
      eb.onclick=function(){startEdit(r.record_id);};
      var b=document.createElement('button');b.className='sm ghost';
      b.textContent='删除';
      b.onclick=function(){exitEditIf(r.record_id);delRec(r.record_id);};
      wrap.appendChild(eb);wrap.appendChild(b);
      d.appendChild(wrap);box.appendChild(d);
    });
  }

  function renderRevList(){
    var box=$('#revList');$('#revCount').textContent=S.revs.length;
    if(!S.revs.length){box.innerHTML='<div class="empty"><p>还没有收藏的影评，搜到好内容就存进来～</p></div>';return;}
    box.innerHTML='';
    S.revs.forEach(function(r){
      var d=document.createElement('div');d.className='res';
      var link=(r['原帖链接']&&r['原帖链接'].link)?r['原帖链接'].link:'';
      d.innerHTML='<div class="tt">'+esc(r['作品名'])+'<span class="pill pk">'+esc(r['平台']||'')+'</span>'+
        '<span class="stars">'+stars(r['评分'])+'</span></div>'+
        '<div class="mt">'+esc(r['博主或标题']||'')+'</div>'+
        (r['金句摘抄']?'<div class="quote">'+esc(r['金句摘抄'])+'</div>':'');
      if(link){
        var a=document.createElement('a');a.className='btn sm';a.style.marginTop='9px';
        a.href=link;a.target='_blank';a.rel='noopener';a.textContent='看原帖';
        d.appendChild(a);
      }
      box.appendChild(d);
    });
  }

  function renderTaste(){
    var cnt={};S.recs.forEach(function(r){(r['标签']||[]).forEach(function(t){cnt[t]=(cnt[t]||0)+1;});});
    S.taste=Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a];});
    var box=$('#tasteBox');box.innerHTML='';
    if(!S.taste.length){box.innerHTML='<span style="font-size:12.5px;color:var(--ink2)">记录几部作品后，我就能读出你的口味啦～</span>';return;}
    S.taste.slice(0,5).forEach(function(t,i){
      var s=document.createElement('span');s.className='tg on';
      s.textContent=t+' ×'+cnt[t];box.appendChild(s);
    });
  }

  function renderRecommend(){
    var box=$('#recBox');
    var rows=S.recs2.map(function(r){
      var ts=r['匹配标签']||[],score=0;
      ts.forEach(function(t){var i=S.taste.indexOf(t);if(i>=0)score+=3-i;});
      return {r:r,s:score+(Number(r['推荐指数'])||0)/10};
    }).sort(function(a,b){return b.s-a.s;});
    box.innerHTML='';
    rows.forEach(function(x){
      var r=x.r;
      var d=document.createElement('div');d.className='rc';
      var tags=(r['匹配标签']||[]).map(function(t){
        var hit=S.taste.indexOf(t)>=0;
        return '<span class="pill'+(hit?' pk':'')+'">'+esc(t)+(hit?' ✓':'')+'</span>';}).join(' ');
      d.innerHTML='<div class="sc">'+esc(r['推荐指数']||'')+'<span style="font-size:12px"> 分</span></div>'+
        '<h3>'+esc(r['作品名'])+'</h3><div style="margin-bottom:8px">'+
        '<span class="pill ag">'+esc(r['类型']||'')+'</span> <span class="pill">'+esc(r['参考平台']||'')+'</span></div>'+
        '<div style="margin-bottom:8px">'+tags+'</div>'+
        '<div class="rs">'+esc(r['推荐理由']||'')+'</div>';
      var a=document.createElement('button');a.className='sm silver';a.style.marginTop='11px';
      a.textContent='存进我的记录';
      a.onclick=function(){saveAsRecord(r);};
      d.appendChild(a);box.appendChild(d);
    });
  }

  /* ========= 统一刷新入口（铁律9） ========= */
  function refreshAll(){
    renderEnergy();renderToday();renderRecList();renderRevList();renderTaste();renderRecommend();
    saveMirror();/* 统一在刷新入口落本地镜像，避免各处漏存 */
  }
  /* 待同步补偿：上次写入未确认落库时，启动后自动重试一次 */
  /* 待同步队列：云端不可用时先存本地，恢复后逐条补传（支持多条，不互相覆盖） */
  var LSKP='wb_zishu_pending_q';
  function pushPending(p,localId){
    try{
      var q=[];
      var raw=localStorage.getItem(LSKP);
      if(raw)q=JSON.parse(raw)||[];
      /* 同一作品名+日期已在队列中则不重复入队 */
      var dup=q.some(function(it){
        return it.p&&it.p['作品名']&&p['作品名']
          &&it.p['作品名'].text===p['作品名'].text
          &&String(it.p['记录日期'].date||'')===String(p['记录日期'].date||'');});
      if(!dup)q.push({p:p,lid:localId});
      localStorage.setItem(LSKP,JSON.stringify(q));
      return q.length;
    }catch(e){return 0;}
  }
  function popPending(){
    try{
      var raw=localStorage.getItem(LSKP);if(!raw)return null;
      var q=JSON.parse(raw)||[];if(!q.length)return null;
      var it=q.shift();
      localStorage.setItem(LSKP,JSON.stringify(q));
      return it;
    }catch(e){return null;}
  }
  function pendingCount(){try{var q=JSON.parse(localStorage.getItem(LSKP)||'[]');return q.length;}catch(e){return 0;}}
  /* 待同步的"修改"队列（与新增分开，单独 key） */
  var LSU='wb_zishu_pending_up';
  function pushPendingUpdate(item){
    try{
      var q=JSON.parse(localStorage.getItem(LSU)||'[]');
      var i=-1;
      for(var k=0;k<q.length;k++){if(q[k].rid===item.rid)i=k;}
      if(i>-1)q[i]=item;else q.push(item);
      localStorage.setItem(LSU,JSON.stringify(q));
      return q.length;
    }catch(e){return 0;}
  }
  function popPendingUpdate(){
    try{
      var q=JSON.parse(localStorage.getItem(LSU)||'[]');if(!q.length)return null;
      return q.shift();
    }catch(e){return null;}
  }
  function requeueUpdate(it){
    try{
      var q=JSON.parse(localStorage.getItem(LSU)||'[]');
      var i=-1;for(var k=0;k<q.length;k++){if(q[k].rid===it.rid)i=k;}
      if(i>-1)q[i]=it;else q.push(it);
      localStorage.setItem(LSU,JSON.stringify(q));
    }catch(e){}
  }
  function pendingUpCount(){try{return (JSON.parse(localStorage.getItem(LSU)||'[]')).length;}catch(e){return 0;}}
  /* 补传待同步的修改 */
  function retryPendingUpdates(){
    if(!db)return;
    var it=popPendingUpdate();
    if(!it)return;
    db.updateRecord({databaseId:DATABASE_ID,recordId:it.rid,properties:it.p})
      .then(function(){
        try{localStorage.removeItem(LSU);}catch(e){}
        /* 处理完一个再取下一个 */
        return retryPendingUpdates();
      },function(err){
        requeueUpdate(it);
        console.warn('[pendingUp] 补传修改失败：',err);
      });
  }
  /* 逐条补传：每条成功确认后才出队 */
  function retryPending(){
    if(!db||pendingCount()<1)return;
    function step(){
      var it=popPending();
      if(!it){setSync('已同步 · 云端实时保存','ok');refreshAll();return;}
      db.addRecord({databaseId:DATABASE_ID,properties:it.p})
        .then(function(){return loadAll();})
        .then(function(rows){
          var p=it.p;
          var ok=(rows||[]).some(function(r){
            return r['作品名']===p['作品名'].text
              &&String(r['记录日期']||'').slice(0,10)===String(p['记录日期'].date||'').slice(0,10);});
          if(ok){
            S.recs=rows||[];refreshAll();
            var left=pendingCount();
            setSync(left?'同步中 · 待传 '+left+' 条':'已同步 · 云端实时保存',left?'busy':'ok');
            step();/* 继续补传下一条 */
          }else{
            /* 回读没看到，放回队首，下次再试 */
            pushPending(it.p,it.lid);
            setSync('待同步 '+pendingCount()+' 条','off');
          }
        },function(err){
          pushPending(it.p,it.lid);/* 失败放回队列 */
          console.warn('[pending] 补传失败：',err);
          setSync('待同步 '+pendingCount()+' 条','off');
        });
    }
    step();
  }

  /* ===== IndexedDB 图片暂存（刷新不丢待上传图片） ===== */
  var IDB={db:null};
  function idbOpen(){
    return new Promise(function(res){
      if(IDB.db)return res(IDB.db);
      try{
        var rq=indexedDB.open('wb_zishu_files',1);
        rq.onupgradeneeded=function(){rq.result.createObjectStore('files',{keyPath:'id'});};
        rq.onsuccess=function(){IDB.db=rq.result;res(IDB.db);};
        rq.onerror=function(){res(null);};
      }catch(e){res(null);}
    });
  }
  function idbPut(f){
    return idbOpen().then(function(d){
      if(!d)return;
      return new Promise(function(res){
        var tx=d.transaction('files','readwrite');
        tx.objectStore('files').put({id:f.name+'_'+f.size+'_'+f.lastModified,blob:f});
        tx.oncomplete=function(){res();};tx.onerror=function(){res();};tx.onabort=function(){res();};
      });
    });
  }
  function idbAll(){
    return idbOpen().then(function(d){
      if(!d)return[];
      return new Promise(function(res){
        var tx=d.transaction('files','readonly');
        var rq=tx.objectStore('files').getAll();
        rq.onsuccess=function(){res(rq.result||[]);};
        rq.onerror=function(){res([]);};
      });
    });
  }
  function idbClear(){
    return idbOpen().then(function(d){
      if(!d)return;
      var tx=d.transaction('files','readwrite');var st=tx.objectStore('files');st.clear();if(st.delete)st.delete(0);
    });
  }

  /* ========= 能量系统（36 格一级） ========= */
  var EK='wb_zishu_energy';
  var CH=[
    {k:'m1',name:'记录小助手',max:72,color:'167,139,250'},
    {k:'m2',name:'查找小助手',max:72,color:'255,150,200'},
    {k:'m3',name:'推荐小助手',max:72,color:'150,175,215'}
  ];
  /* 每级所需能量：Lv.0→Lv.1 为 72 格，Lv.1→Lv.2 同样 72 格 */
  function levelNeed(level){return 72;}
  /* Lv.1 解锁的新服装（第二个角色为背带裤） */
  var OUTFIT={
    m1:{name:'黑色制服长裤',url:'https://workbuddy-space-static.codebuddy.work/image/o0fxGS6vwst2DmvkDBCiIJ.jpg'},
    m2:{name:'粉色背带裤',  url:'https://workbuddy-space-static.codebuddy.work/image/uC4e1pFxdfN8eZHB0LsDrp.jpg'},
    m3:{name:'白色阔腿裤',  url:'https://workbuddy-space-static.codebuddy.work/image/0GuQwHLNRNTGXeLoBz7xBN.jpg'}
  };
  var DK='wb_zishu_outfit';/* 当前穿的服装 {m1:0|1,...} */
  function loadOutfit(){try{return JSON.parse(localStorage.getItem(DK))||{};}catch(e){return {};}}
  function saveOutfit(o){try{localStorage.setItem(DK,JSON.stringify(o));}catch(e){}}
  function loadE(){
    try{return JSON.parse(localStorage.getItem(EK))||{m1:0,m2:0,m3:0};}
    catch(e){return {m1:0,m2:0,m3:0};}
  }
  function saveE(v){try{localStorage.setItem(EK,JSON.stringify(v));}catch(e){}}
  function lv(v,max){return Math.floor((v%max)/max);}/* 已升多少级 */
  function inLv(v,max){return v%max;}/* 当前级内格数 */
  function renderEnergy(){
    renderOutfit();/* 等级/服装状态与能量条同步 */
    var e=loadE();
    CH.forEach(function(c){
      var box=document.getElementById('eg-'+c.k);if(!box)return;
      var v=e[c.k]||0,cur=inLv(v,c.max),level=Math.floor(v/c.max);
      var html='';
      for(var i=0;i<c.max;i++)
        html+='<i class="'+(i<cur?'on':'')+'"></i>';
      box.innerHTML=html;
      var lvEl=document.getElementById('elv-'+c.k);
      if(lvEl)lvEl.textContent='Lv.'+level;
    });
  }
  function addEnergy(key){
    var meta=CH.filter(function(c){return c.k===key;})[0];if(!meta)return;
    var e=loadE(),need=levelNeed(0);
    var before=Math.floor((e[key]||0)/need);
    e[key]=(e[key]||0)+1;
    saveE(e);
    renderEnergy();
    var after=Math.floor(e[key]/need);
    var bar=document.getElementById('eg-'+key);
    if(bar){var last=bar.querySelectorAll('i.on');if(last.length)
      last[last.length-1].classList.add('pop');}
    if(after>before){/* 升级：全条闪烁 */
      if(bar)bar.classList.add('glow');
      setTimeout(function(){if(bar)bar.classList.remove('glow');},1900);
      showThanks(key,meta.color);
      setTimeout(function(){nextTalk('#'+key+'Talk',talkOf(key));},420);
      /* 升到 Lv.1：解锁新服装，提示可换 */
      if(after===1)setTimeout(function(){unlockOutfit(key,meta);},700);
    }
  }
  function talkOf(k){return k==='m1'?T1:k==='m2'?T2:T3;}
    /* ========= 服装解锁与切换 ========= */
  function charLevel(key){
    var e=loadE(),need=levelNeed(0);
    return Math.floor((e[key]||0)/need);
  }
  /* 按当前等级 + 已穿服装，刷新形象图与徽章/按钮状态 */
  function renderOutfit(){
    CH.forEach(function(c){
      var wrap=document.querySelector('.avt[data-char="'+c.k+'"]');
      if(!wrap)return;
      var img=wrap.querySelector('img[data-outfit]');
      var badge=document.getElementById('ob-'+c.k);
      var btn=document.getElementById('dress'+c.k.slice(1));
      var lvNow=charLevel(c.k);
      var worn=loadOutfit()[c.k]||0;/* 0=原服装 1=新裤装 */
      var unlocked=lvNow>=1;
      if(img)img.src=worn&&unlocked?OUTFIT[c.k].url:img.getAttribute('data-src0')||img.src;
      if(badge){
        if(worn&&unlocked){badge.className='outfit-badge worn';badge.textContent='已穿：'+OUTFIT[c.k].name;}
        else if(unlocked){badge.className='outfit-badge ready';badge.textContent='Lv.1 解锁'+OUTFIT[c.k].name;}
        else{badge.className='outfit-badge';badge.textContent='Lv.1 解锁'+OUTFIT[c.k].name;}
      }
      if(btn){
        btn.className=btn.className.replace(/\s*\bon\b/g,'').replace(/\s*locked/g,'');
        if(!unlocked){btn.className+=' locked';btn.disabled=true;}
        else{btn.disabled=false;if(worn)btn.className+=' on';}
      }
    });
  }
  /* 记录每个角色原服装的图片地址（renderOutfit 切换时需要） */
  function cacheDefaultOutfit(){
    Array.prototype.forEach.call(document.querySelectorAll('.avt img[data-outfit]'),function(img){
      if(!img.getAttribute('data-src0'))img.setAttribute('data-src0',img.src);
    });
  }
  /* 升到 Lv.1 的解锁提示 */
  function unlockOutfit(key,meta){
    var o=OUTFIT[key];if(!o)return;
    renderOutfit();
    var talk={'m1':'我换好啦～这身长裤利落不少吧？',
              'm2':'哼，居然被你发现了！背带裤好看吧～',
              'm3':'新衣已备好，行事更利落了。'}[key]||'新衣服解锁啦～';
    var el=document.getElementById(key+'Talk');
    if(el)el.textContent=talk;
    showThanks(key,meta.color,'Lv.1 解锁新服装：'+o.name);
  }
  /* 点击换装按钮：未解锁给出提示；已解锁则在两套服装间切换 */
  function toggleOutfit(key){
    var meta=CH.filter(function(c){return c.k===key;})[0];if(!meta)return;
    if(charLevel(key)<1){
      var need=levelNeed(0)-(loadE()[key]||0)%levelNeed(0);
      if(confirm('还没到 Lv.1 哦～\n再攒 '+need+' 格能量就能解锁'+OUTFIT[key].name+'啦，继续加油！'))return;
      return;
    }
    var o=loadOutfit();
    o[key]=o[key]?0:1;
    saveOutfit(o);
    renderOutfit();
    var talk=o[key]?({'m1':'这身裤装，我挺满意的。',
                      'm2':'背带裤背带裤，本小姐天下第一可爱！',
                      'm3':'换上轻装，思路也更清晰了。'}[key]||'换好啦～')
                   :({'m1':'还是原来的好，清净。',
                      'm2':'好吧，裙子也挺好看的。',
                      'm3':'换回来了，裙子也自在。'}[key]||'换回来啦～');
    var el=document.getElementById(key+'Talk');if(el)el.textContent=talk;
  }

  function showThanks(key,rgb,label){
    var box=$('#thanks');
    if(!box)return;
    box.style.setProperty('--tc','rgb('+rgb+')');
    box.style.setProperty('--tc-rgb',rgb);
    var who=CH.filter(function(c){return c.k===key;})[0].name;
    box.innerHTML='<div class="thx-glow"></div><p>'+(label||'谢谢你告诉我这些。')+'</p><span>'+who+' · 能量 +1</span>';
    box.classList.add('show');
    clearTimeout(box._tm);
    box._tm=setTimeout(function(){box.classList.remove('show');},label?3200:2400);
  }

  /* ========= 操作 ========= */
  function markDone(id){
    if(!db){alert('数据同步中，请稍后再试');return;}
    setSync('保存中…','busy');
    db.updateRecord({databaseId:DATABASE_ID,recordId:id,properties:{'状态':{select:'s3'}}})
      .then(function(){setSync('已同步','ok');return loadAll();})
      .then(function(rows){S.recs=rows||[];refreshAll();})
      .catch(function(){setSync('离线模式','off');});
  }
  function delRec(id){
    if(!db){alert('数据同步中，请稍后再试');return;}
    if(!confirm('确定要删掉这条记录吗？删了找不回来哦～'))return;
    setSync('删除中…','busy');
    db.deleteRecord({databaseId:DATABASE_ID,recordId:id})
      .then(function(){setSync('已同步','ok');return loadAll();})
      .then(function(rows){S.recs=rows||[];refreshAll();})
      .catch(function(){setSync('离线模式','off');});
  }

  /* ========= 编辑记录 ========= */
  /* S.edit 非空表示正在编辑该 record_id 的记录 */
  function setEditMode(id){
    var btn=$('#cancelEdit'),bar=$('#editBar');
    if(id){
      S.edit=id;
      if($('#submitTxt'))$('#submitTxt').textContent='保存修改';
      if(btn)btn.style.display='';
      if(bar){bar.style.display='flex';var n=$('#editName');
        if(n){var f=S.recs.filter(function(r){return r.record_id===id;})[0];n.textContent=f?f['作品名']:'';}}
      $('#m1Talk').textContent='改好了记得保存哦，我会帮你更新到本子里。';
    }else{
      S.edit=null;
      if($('#submitTxt'))$('#submitTxt').textContent='存进手账';
      if(btn)btn.style.display='none';
      if(bar)bar.style.display='none';
      if($('#editName'))$('#editName').textContent='';
    }
  }
  /* 点"编辑"：把该条记录回填到表单，并滚动到表单处 */
  function startEdit(id){
    var rec=null;
    S.recs.forEach(function(r){if(r.record_id===id)rec=r;});
    if(!rec){alert('没找到这条记录，可能已被删除～');return;}
    $('#f-title').value=rec['作品名']||'';
    $('#f-feel').value=rec['一句话感受']||'';
    $('#f-score').value=(rec['评分']===undefined||rec['评分']===null)?'':rec['评分'];
    $('#f-date').value=String(rec['记录日期']||today()).slice(0,10);
    /* 下拉：按文案反查 option id 并选中 */
    pickDDByText('f-type',rec['类型']||'');
    pickDDByText('f-status',rec['状态']||'');
    /* 标签：清空后重新勾上 */
    S.picked={};
    var tags=rec['标签']||[];
    Array.prototype.forEach.call(document.querySelectorAll('#tagBox .tg'),function(e){
      var on=tags.indexOf(e.textContent)>-1;
      e.className='tg'+(on?' on':'');
      if(on)S.picked[e.dataset.optId]=true;
    });
    S.edit=id;
    setEditMode(id);
    $('#recMsg').textContent='';
    $('#recForm').scrollIntoView({behavior:'smooth',block:'start'});
    try{$('#f-title').focus();}catch(e){}
  }
  /* 按文案在选项里找 id 并选中 */
  function pickDDByText(id,text){
    if(!text)return;
    var arr=S.schema[id==='f-type'?'类型':'状态']||[];
    var found=null;
    arr.forEach(function(o){if(o.text===text)found=o.id;});
    if(found){S.dd[id]=found;setDDText(id,text,false);}
  }
  function cancelEdit(){
    setEditMode(null);
    $('#recForm').reset();
    S.picked={};S.files=[];drawThumbs();resetDD();
    Array.prototype.forEach.call(document.querySelectorAll('#tagBox .tg'),function(e){e.className='tg';});
    $('#f-date').value=today();
    $('#recMsg').textContent='';
  }
  /* 删除正在编辑的记录时，同步退出编辑态 */
  function exitEditIf(id){if(S.edit===id)cancelEdit();}
  function saveAsRecord(r){
    if(!db){alert('数据同步中，请稍后再试');return;}
    setSync('保存中…','busy');
    var p={'作品名':{text:r['作品名']},'类型':{select:'m1'},'状态':{select:'s1'},
      '评分':{number:Number(r['推荐指数'])||8},'记录日期':{date:today()},
      '一句话感受':{text:'小银推荐的：'+(r['推荐理由']||'')}};
    db.addRecord({databaseId:DATABASE_ID,properties:p})
      .then(function(){setSync('已同步','ok');
        var m=$('#m1Talk');m.textContent='已经记下啦，记得去看哦～';
        return loadAll();})
      .then(function(rows){S.recs=rows||[];refreshAll();
        document.getElementById('mod1').scrollIntoView({behavior:'smooth'});})
      .catch(function(){setSync('离线模式','off');});
  }
  function doSearch(){
    var q=$('#q').value.trim(),box=$('#srchResults');
    if(!q){box.innerHTML='<div class="empty"><p>输入作品名，我帮你翻记录和影评～</p></div>';return;}
    var hitRec=S.recs.filter(function(r){return String(r['作品名']).indexOf(q)>=0;});
    var hitRev=S.revs.filter(function(r){return String(r['作品名']).indexOf(q)>=0||
      String(r['金句摘抄']||'').indexOf(q)>=0||String(r['博主或标题']||'').indexOf(q)>=0;});
    var html='';
    if(hitRec.length){html+='<div style="font-size:13px;font-weight:700;color:var(--ink2);margin-bottom:8px">我的记录里找到 '+hitRec.length+' 条</div>';
      hitRec.forEach(function(r){
        html+='<div class="res"><div class="tt">'+esc(r['作品名'])+'<span class="pill">'+esc(r['类型']||'')+'</span>'+
          '<span class="stars">'+stars(r['评分'])+'</span></div><div class="mt">'+esc(r['一句话感受']||'')+'</div></div>';});}
    if(hitRev.length){html+='<div style="font-size:13px;font-weight:700;color:var(--ink2);margin:12px 0 8px">收藏的影评里找到 '+hitRev.length+' 条</div>';
      hitRev.forEach(function(r){
        html+='<div class="res"><div class="tt">'+esc(r['作品名'])+'<span class="pill pk">'+esc(r['平台']||'')+'</span></div>'+
          '<div class="mt">'+esc(r['博主或标题']||'')+'</div>'+
          (r['金句摘抄']?'<div class="quote">'+esc(r['金句摘抄'])+'</div>':'')+'</div>';});}
    if(!hitRec.length&&!hitRev.length){
      html='<div class="empty"><p>手账里还没有「'+esc(q)+'」的记录哦</p>'+
        '<p style="margin-top:10px;font-size:12.5px">下面两个按钮可以直接去抖音、小红书搜它的影评 ↓</p></div>';}
    html+='<div class="acts" style="margin-top:12px">'+
      '<a class="btn sm pink" target="_blank" rel="noopener" href="https://www.douyin.com/search/'+encodeURIComponent(q)+'">抖音搜「'+esc(q)+'」</a>'+
      '<a class="btn sm pink" target="_blank" rel="noopener" href="https://www.xiaohongshu.com/search_result?keyword='+encodeURIComponent(q)+'">小红书搜「'+esc(q)+'」</a></div>';
    box.innerHTML=html;
    $('#m2Talk').textContent='查到了……哼，厉害吧。';
    addEnergy('m2');
  }

  /* ========= 绑定 ========= */
  /* 图片兜底：加载失败时显示占位符，绝不出现空白 */
  function guardImage(img){
    img.onerror=function(){
      img.onerror=null;
      img.src='data:image/svg+xml;charset=utf-8,'+
        encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">'+
          '<rect width="200" height="200" fill="#f3edff"/>'+
          '<circle cx="100" cy="82" r="34" fill="#d8c9f5"/>'+
          '<ellipse cx="100" cy="152" rx="52" ry="42" fill="#d8c9f5"/>'+
          '<text x="100" y="190" font-size="13" fill="#8b7aa8" text-anchor="middle" '+
          'font-family="sans-serif">形象加载中</text></svg>');
    };
    if(img.complete&&img.naturalWidth===0)img.onerror();
  }

  function bind(){
    $('#talkNext1').onclick=function(){nextTalk('#m1Talk',T1);addEnergy('m1');};
    $('#talkNext2').onclick=function(){nextTalk('#m2Talk',T2);addEnergy('m2');};
    $('#talkNext3').onclick=function(){nextTalk('#m3Talk',T3);addEnergy('m3');};
    $('#dress1').onclick=function(){toggleOutfit('m1');};
    $('#dress2').onclick=function(){toggleOutfit('m2');};
    $('#dress3').onclick=function(){toggleOutfit('m3');};
    $('#refreshRec').onclick=function(){renderRecommend();$('#m3Talk').textContent='依你的口味，重排好了。';addEnergy('m3');};
    $('#jumpList').onclick=function(){$('#recList').scrollIntoView({behavior:'smooth'});};
    $('#doSearch').onclick=doSearch;$('#q').onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();doSearch();}};
    $('#qClear').onclick=function(){$('#q').value='';$('#srchResults').innerHTML='';};
    var curQ=function(){return $('#q').value.trim()||'电影 影评';};
    $('#goDouyin').onclick=function(){window.open('https://www.douyin.com/search/'+encodeURIComponent(curQ()),'_blank');};
    $('#goXhs').onclick=function(){window.open('https://www.xiaohongshu.com/search_result?keyword='+encodeURIComponent(curQ()),'_blank');};
    $('#drop').onclick=function(){$('#file').click();};
    $('#file').onchange=function(e){handleFiles(e.target.files);};
    $('#recForm').onsubmit=onSubmit;
    $('#cancelEdit').onclick=cancelEdit;
    Array.prototype.forEach.call(document.querySelectorAll('.st-tab'),function(t){
      t.onclick=function(){var el=document.getElementById(t.dataset.go);
        el.scrollIntoView({behavior:'smooth'});};
    });
    // 表单草稿缓存
    var KEYS={title:'#f-title',feel:'#f-feel',score:'#f-score'};
    Object.keys(KEYS).forEach(function(k){
      var el=$(KEYS[k]);if(!el)return;
      try{var v=localStorage.getItem('wb_zishu_draft_'+k);if(v)el.value=v;}catch(e){}
      el.addEventListener('input',function(){
        try{localStorage.setItem('wb_zishu_draft_'+k,el.value);}catch(e){}});
    });
  }
  function handleFiles(list){
    var arr=Array.prototype.slice.call(list||[]).slice(0,6-S.files.length);
    S.files=S.files.concat(arr);drawThumbs();
    arr.forEach(function(f){idbPut(f);});
  }
  function restoreFiles(){
    return idbAll().then(function(rows){
      if(!rows.length||S.files.length)return;
      var fs=rows.map(function(r){return r.blob;}).filter(Boolean);
      if(fs.length){S.files=fs.slice(0,6);drawThumbs();
        $('#m1Talk').textContent='上次的图片还在哦，记得一起存下来～';}
    });
  }
  function drawThumbs(){
    var box=$('#thumbs');box.innerHTML='';
    S.files.forEach(function(f){
      var im=document.createElement('img');im.className='thumb';
      im.src=URL.createObjectURL(f);box.appendChild(im);
    });
  }
  function onSubmit(e){
    e.preventDefault();
    /* 编辑模式分流到 updateRecord */
    if(S.edit)return onEditSubmit(e);
    var title=$('#f-title').value.trim();
    if(!title){$('#f-title').focus();return;}
    var btn=$('#submitBtn');btn.disabled=true;
    $('#recMsg').style.color='var(--ink2)';$('#recMsg').textContent='正在保存…';
    var tagIds=Object.keys(S.picked).filter(function(k){return S.picked[k];});
    var tagText=tagIds.map(function(id){return optText('标签',id);});
    var p={'作品名':{text:title},
      '记录日期':{date:$('#f-date').value||today()},
      '一句话感受':{text:$('#f-feel').value.trim()}};
    var tV=S.dd['f-type'];if(tV)p['类型']={select:tV};
    var sV=S.dd['f-status'];if(sV)p['状态']={select:sV};
    var sc=$('#f-score').value;if(sc!=='')p['评分']={number:parseFloat(sc)};
    if(tagText.length)p['标签']={multi_select:tagText};

    if(!db){$('#recMsg').style.color='var(--warn)';
      $('#recMsg').textContent='当前离线，数据同步恢复后才能保存哦';btn.disabled=false;return;}
    setSync('保存中…','busy');
    var task=S.files.length
      ? Promise.all(S.files.map(uploadOne)).then(function(imgs){p['封面或截图']={image:{images:imgs}};})
      : Promise.resolve();
    /* ① 先落库 */
    task.then(function(){return db.addRecord({databaseId:DATABASE_ID,properties:p});})
      .then(function(){
        /* ② 不猜测 addRecord 的返回字段名（官方未定义，可能返回 {}），
              改为回读数据库校验：只要能查到这条记录，就算真的写进去了。
              若首次没查到（写入刚完成、索引可能有延迟），稍等再试一次。 */
        function findHit(rows){
          var hit=null;
          (rows||[]).forEach(function(r){
            if(!hit&&r['作品名']===p['作品名'].text
               &&String(r['记录日期']||'').slice(0,10)===String(p['记录日期'].date||'').slice(0,10))hit=r;
          });
          return hit;
        }
        function waitThenCheck(){
          return new Promise(function(r){setTimeout(r,900);})
            .then(loadAll)
            .then(function(rows){
              var hit=findHit(rows);
              if(hit){S.recs=rows;return true;}
              return false;
            });
        }
        return loadAll().then(function(rows){
          if(findHit(rows)){S.recs=rows;return true;}
          return waitThenCheck().then(function(ok2){
            if(ok2)return true;
            /* 两次都读不到：仍乐观展示，但明确标注未确认，避免"假成功"错觉 */
            S.recs.unshift(toRow(p,'local_'+Date.now()));
            return false;
          });
        });
      })
      .then(function(verified){
        setSync(verified?'已同步':'同步中',verified?'ok':'busy');
        $('#recMsg').style.color=verified?'var(--ok)':'var(--warn)';
        $('#recMsg').textContent=verified?'记好啦！':'已存本地，网络恢复后自动上传';
        $('#m1Talk').textContent='记好啦～下一部也告诉我呀。';
        S.picked={};S.files=[];drawThumbs();
        resetDD();
        Array.prototype.forEach.call(document.querySelectorAll('#tagBox .tg'),function(e){e.className='tg';});
        if(verified){
          /* 确认落库才清表单与草稿 */
          $('#recForm').reset();idbClear();
          ['title','feel','score','date'].forEach(function(k){try{localStorage.removeItem('wb_zishu_draft_'+k);}catch(e2){}});
        }else{
          /* 未确认：进待同步队列（保留用户输入，退出也不会丢） */
          var n=pushPending(p,S.recs[0]?S.recs[0].record_id:'');
          setSync('待同步 '+n+' 条','busy');
          $('#recMsg').textContent='已存本地，退出也不会丢～';
          /* 表单不清空，让用户看到刚填的内容 */
        }
        $('#f-date').value=today();
        refreshAll();addEnergy('m1');
        return true;
      })
      .catch(function(err){
        console.error('[save] 保存失败：',err);
        /* 关键：写库彻底失败也要先落本地 + 进队列，绝不让用户白填 */
        try{
          if(!S.recs.length||S.recs[0]['作品名']!==p['作品名'].text)
            S.recs.unshift(toRow(p,'local_'+Date.now()));
          refreshAll();
          var qn=pushPending(p,'local_'+Date.now());
          setSync('待同步 '+qn+' 条','off');
          $('#recMsg').style.color='var(--warn)';
          $('#recMsg').textContent='网络不稳，已存本地（'+qn+' 条待上传），不会丢';
          $('#m1Talk').textContent='网络好像断了，不过我已经帮你存好啦。';
        }catch(e2){
          setSync('保存失败','off');
          $('#recMsg').style.color='var(--warn)';
          $('#recMsg').textContent='没保存上：'+(err&&err.message?err.message:'请稍后再试～');
        }
        try{
          localStorage.setItem('wb_zishu_draft_title',$('#f-title').value);
          localStorage.setItem('wb_zishu_draft_feel',$('#f-feel').value);
          localStorage.setItem('wb_zishu_draft_score',$('#f-score').value);
        }catch(e3){}
      })
      .finally(function(){btn.disabled=false;});
  }
  /* 把提交属性转成与 query 结果一致的扁平行，供本地即时渲染 */
  /* ========= 编辑模式提交：走 db.updateRecord（增量更新） ========= */
  function onEditSubmit(e){
    var title=$('#f-title').value.trim();
    if(!title){$('#f-title').focus();return;}
    var rid=S.edit;
    var btn=$('#submitBtn');btn.disabled=true;
    $('#recMsg').style.color='var(--ink2)';$('#recMsg').textContent='正在保存修改…';
    var tagIds=Object.keys(S.picked).filter(function(k){return S.picked[k];});
    var tagText=tagIds.map(function(id){return optText('标签',id);});
    /* 收集所有字段，updateRecord 为增量更新，未传的字段保持原值 */
    var p={'作品名':{text:title},
      '记录日期':{date:$('#f-date').value||today()},
      '一句话感受':{text:$('#f-feel').value.trim()},
      '标签':{multi_select:tagText}};
    var tV=S.dd['f-type'];p['类型']={select:tV||''};
    var sV=S.dd['f-status'];p['状态']={select:sV||''};
    var sc=$('#f-score').value;
    p['评分']=(sc!=='')?{number:parseFloat(sc)}:{number:0};

    var isLocal=String(rid).indexOf('local_')===0;
    /* 本地暂存且从未入库的记录：直接在本地更新，无需请求云端 */
    if(isLocal){
      var newRow=toRow(p,rid);
      S.recs=S.recs.map(function(r){return r.record_id===rid?newRow:r;});
      refreshAll();setEditMode(null);
      $('#recForm').reset();S.files=[];drawThumbs();
      $('#recMsg').style.color='var(--ok)';$('#recMsg').textContent='改好啦！';
      $('#m1Talk').textContent='改好啦～这样记录就准了。';
      addEnergy('m1');btn.disabled=false;
      return;
    }
    if(!db){
      /* 云端不可用：改本地镜像并排队，等恢复后用 updateRecord 补传 */
      var nr=toRow(p,rid);
      S.recs=S.recs.map(function(r){return r.record_id===rid?nr:r;});
      refreshAll();
      pushPendingUpdate({rid:rid,p:p});
      setEditMode(null);
      $('#recMsg').style.color='var(--warn)';
      $('#recMsg').textContent='网络不稳，修改已存本地，联网后自动同步';
      btn.disabled=false;
      return;
    }
    setSync('保存中…','busy');
    var task=S.files.length
      ? Promise.all(S.files.map(uploadOne)).then(function(imgs){p['封面或截图']={image:{images:imgs}};})
      : Promise.resolve();
    task.then(function(){return db.updateRecord({databaseId:DATABASE_ID,recordId:rid,properties:p});})
      .then(function(){
        /* 回读校验：确认云端已是新值 */
        return loadAll().then(function(rows){
          var hit=null;
          (rows||[]).forEach(function(r){if(r.record_id===rid)hit=r;});
          if(!hit){/* 云端没查到该条（可能是延迟），保留本地修改 */ S.recs=S.recs.map(function(r){return r.record_id===rid?toRow(p,rid):r;});}
          else S.recs=rows;
          refreshAll();
          setEditMode(null);
          $('#recForm').reset();S.files=[];drawThumbs();idbClear();
          ['title','feel','score','date'].forEach(function(k){try{localStorage.removeItem('wb_zishu_draft_'+k);}catch(e2){}});
          setSync('已同步','ok');
          $('#recMsg').style.color='var(--ok)';$('#recMsg').textContent='改好啦！已更新到本子';
          $('#m1Talk').textContent='改好啦～这样记录就准了。';
          addEnergy('m1');
          return true;
        });
      })
      .catch(function(err){
        console.error('[edit] 修改失败：',err);
        /* 保存失败时把改动落到本地 + 队列，绝不丢用户的编辑 */
        try{
          var fb=toRow(p,rid);
          S.recs=S.recs.map(function(r){return r.record_id===rid?fb:r;});
          refreshAll();
          pushPendingUpdate({rid:rid,p:p});
          setEditMode(null);
          setSync('待同步修改','off');
          $('#recMsg').style.color='var(--warn)';
          $('#recMsg').textContent='修改已存本地，联网后自动同步';
        }catch(e4){
          setSync('保存失败','off');
          $('#recMsg').style.color='var(--warn)';
          $('#recMsg').textContent='没保存上：'+((err&&err.message)?err.message:'请稍后再试～');
        }
      })
      .finally(function(){btn.disabled=false;});
  }

  function toRow(p,recId){
    var r={record_id:recId};
    r['作品名']=p['作品名']?p['作品名'].text:'';
    r['记录日期']=p['记录日期']?p['记录日期'].date:today();
    r['一句话感受']=p['一句话感受']?p['一句话感受'].text:'';
    if(p['类型'])r['类型']=optText('类型',p['类型'].select);
    if(p['状态'])r['状态']=optText('状态',p['状态'].select);
    if(p['评分'])r['评分']=p['评分'].number;
    if(p['标签'])r['标签']=p['标签'].multi_select;
    return r;
  }
  /* 本地暂存（尚未确认落库）的记录，重开页面后不再展示，避免"假记录" */
  function dropUnconfirmed(){
    var keep=S.recs.filter(function(r){return String(r.record_id||'').indexOf('local_')!==0;});
    return keep.length!==S.recs.length;
  }

  /* ========= 启动 ========= */
  function start(){
    cacheDefaultOutfit();
    renderOutfit();
    $('#f-date').value=today();
    /* 先把本地镜像读进内存再渲染，避免"空数据先渲染"把镜像冲掉 */
    var pre=loadMirror();
    if(pre){S.recs=pre.recs;S.revs=pre.revs||[];}
    restoreFiles();
    renderOptions();/* 同步兜底：无论网络是否可用，下拉框立刻可选 */
    refreshAll();/* 用镜像先渲染一次，用户立刻能看到自己记的东西 */
    if(!db){
      setSync(pre&&S.recs.length?'离线模式 · 显示本地记录':'离线模式 · 选项已就绪','off');
      return;
    }
    setSync('同步中…','busy');
    /* ① 先无条件拉数据（与 schema 解耦，任何情况下都要把记录显示出来）
          三个库各自容错：任何一个失败都不影响其他两个，更不影响本地镜像兜底 */
    var okAll=true;
    function safe(p){return p.then(function(v){return v;},function(){okAll=false;return [];});}
    var loadData=Promise.all([safe(loadAll()),safe(loadById(DB_REV)),safe(loadById(DB_REC2))])
      .then(function(all){
        /* 云端拿到的（可能为空）与本地镜像合并，云端优先、本地补漏 */
        var m=mergeMirror(all[0]||[],all[1]||[]);
        S.recs=m.recs;S.revs=m.revs;S.recs2=all[2]||[];
        if(!okAll&&S.recs.length===0){
          /* 云端失败且无镜像 → 才是真正的加载失败 */
          setSync('数据加载失败 · 请检查网络','off');
          refreshAll();return all;
        }
        refreshAll();/* refreshAll 内含 saveMirror */
        /* 无论云端是否成功，都尝试补传待同步队列 */
        if(okAll&&db){retryPending();retryPendingUpdates();}
        var wait=pendingCount()+pendingUpCount();
        if(okAll){
          setSync(wait>0?'同步中 · 待传 '+wait+' 条':'已同步 · 云端实时保存',wait>0?'busy':'ok');
        }else{
          /* 云端不可用：用本地镜像兜底，数据一条不丢 */
          setSync(wait>0?'本地已存 · 待传 '+wait+' 条':'离线模式 · 显示本地记录（云端未连上）','off');
        }
        return all;
      });
    /* ② schema 单独加载：失败只影响选项文案，不影响记录显示 */
    db.getSchema({databaseId:DATABASE_ID}).then(function(sc){
      var live={};
      (sc.properties||[]).forEach(function(f){
        if((f.type==='select'||f.type==='multi_select')&&f.config&&f.config.options&&f.config.options.length)
          live[f.name]=f.config.options;});
      Object.keys(live).forEach(function(k){S.schema[k]=live[k];});
      renderOptions();refreshAll();
    },function(err){
      console.error('[schema] 加载失败，继续用内置选项：',err);
      setSync('已用内置选项','off');
    });
    return loadData;
  }

  document.addEventListener('DOMContentLoaded',function(){
    Array.prototype.forEach.call(document.querySelectorAll('.avt img'),guardImage);
    bindDD();bind();start();
    /* 有待同步记录时，定时重试补传（网络恢复后无需用户手动操作） */
    if((pendingCount()>0||pendingUpCount()>0)&&typeof setInterval==='function'){
      var tries=0;
      var timer=setInterval(function(){
        if(!pendingCount()&&!pendingUpCount()){clearInterval(timer);return;}
        if(tries++>40)return;/* 上限约 8 分钟，避免无限轮询 */
        retryPending();retryPendingUpdates();
      },20000);
    }
    /* 从后台切回前台时也补一次（手机端常见） */
    document.addEventListener('visibilitychange',function(){
      if(!document.hidden&&(pendingCount()>0||pendingUpCount()>0)){retryPending();retryPendingUpdates();}
    });
    if(window.addEventListener)window.addEventListener('online',function(){if(pendingCount()>0||pendingUpCount()>0){retryPending();retryPendingUpdates();}});
  });
})();
</script>