// 바둑DB 관리자 — 등록한 IP(ADMIN_IPS 비밀 값)에서만 열림. 다른 곳에서는 '없는 페이지(404)'로 보임
// /admin              관리자 화면
// /api/admin/ping     접속 확인 (사이트 푸터의 '관리자' 링크용)
// /api/admin/status   수집 현황
// /api/admin/news     뉴스 목록(숨긴 것 포함) + 손본 내용
// /api/admin/refresh  지금 뉴스 수집 (POST)
// /api/admin/news/set 숨기기·고정·기사 이름 고치기 (POST)
import { NAMES } from './names.js';

const NOT_FOUND = () => new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
const JX = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });

export function ipAllowed(ip, list) {
  if (!ip || !list) return false;
  return String(list).split(/[\s,]+/).filter(Boolean).some(e => e.endsWith('*') ? ip.startsWith(e.slice(0, -1)) : ip === e);
}
const CODE_NAME = (() => { const m = {}; for (const [n, k] of Object.entries(NAMES)) if (!m[k]) m[k] = n; return m; })();

// 손본 내용(숨김·고정·기사 이름)을 뉴스 목록에 적용 — /api/news 가 씀
export function applyOvr(list, ovr) {
  if (!ovr) return list;
  const hide = ovr.hide || {}, pin = ovr.pin || {}, tags = ovr.tags || {};
  const out = list.filter(x => !hide[x[4]]).map(x => tags[x[4]] ? Object.assign(x.slice(), { 6: tags[x[4]] }) : x);
  const pinned = out.filter(x => pin[x[4]]).sort((a, b) => String(pin[b[4]]).localeCompare(String(pin[a[4]])));
  return pinned.length ? pinned.concat(out.filter(x => !pin[x[4]])) : out;
}
export async function getOvr(env) { return (await env.NEWS_KV.get('news_ovr', 'json')) || { hide: {}, pin: {}, tags: {} }; }

export async function handleAdmin(req, env, ctx, u, refresh) {
  const ip = req.headers.get('CF-Connecting-IP') || '';
  if (!ipAllowed(ip, env.ADMIN_IPS)) return NOT_FOUND();
  const p = u.pathname;
  if (p === '/admin' || p === '/admin/') return new Response(ADMIN_HTML, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
  if (p === '/api/admin/ping') return JX({ ok: true, ip });
  if (p === '/api/admin/status') {
    const [meta, list, ovr, site] = await Promise.all([
      env.NEWS_KV.get('meta', 'json'), env.NEWS_KV.get('news', 'json'), getOvr(env),
      env.ASSETS.fetch(new Request(u.origin + '/status.json')).then(r => r.ok ? r.json() : null).catch(() => null)]);
    const last = {}, count = {};
    for (const x of list || []) { count[x[0]] = (count[x[0]] || 0) + 1; if (!last[x[0]] || x[1] > last[x[0]]) last[x[0]] = x[1]; }
    return JX({ ip, now: new Date().toISOString(), meta, news: { total: (list || []).length, last, count, hidden: Object.keys(ovr.hide || {}).length, pinned: Object.keys(ovr.pin || {}).length }, site });
  }
  if (p === '/api/admin/news') {
    const [list, ovr] = await Promise.all([env.NEWS_KV.get('news', 'json'), getOvr(env)]);
    const names = {};
    for (const x of list || []) for (const k of [...(x[6] || []), ...((ovr.tags || {})[x[4]] || [])]) names[k] = CODE_NAME[k] || k;
    return JX({ items: list || [], ovr, names });
  }
  if (req.method !== 'POST') return JX({ ok: false, error: 'POST 로 보내 주세요' }, 405);
  if (p === '/api/admin/refresh') return JX({ ok: true, meta: await refresh(env) });
  if (p === '/api/admin/news/set') {
    let b; try { b = await req.json(); } catch (e) { return JX({ ok: false, error: '내용이 올바르지 않음' }, 400); }
    if (!b || !b.u) return JX({ ok: false, error: '기사 주소가 없음' }, 400);
    const ovr = await getOvr(env); ovr.hide = ovr.hide || {}; ovr.pin = ovr.pin || {}; ovr.tags = ovr.tags || {};
    if ('hide' in b) { if (b.hide) ovr.hide[b.u] = 1; else delete ovr.hide[b.u]; }
    if ('pin' in b) { if (b.pin) ovr.pin[b.u] = new Date().toISOString(); else delete ovr.pin[b.u]; }
    let unknown = [];
    if ('tags' in b) {
      if (b.tags == null) delete ovr.tags[b.u];
      else {
        const codes = [];
        for (const raw of String(b.tags).split(/[,\s]+/).filter(Boolean)) { const k = NAMES[raw] || (CODE_NAME[raw] ? raw : null); if (k) { if (!codes.includes(k)) codes.push(k); } else unknown.push(raw); }
        ovr.tags[b.u] = codes;
      }
    }
    await env.NEWS_KV.put('news_ovr', JSON.stringify(ovr));
    const names = {}; for (const k of ovr.tags[b.u] || []) names[k] = CODE_NAME[k] || k;
    return JX({ ok: true, ovr, unknown, names });
  }
  return NOT_FOUND();
}

const ADMIN_HTML = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>바둑DB 관리자</title>
<style>
:root{--bg:#0C111D;--card:#141B2A;--card2:#1A2232;--ink:#F8F9FC;--soft:#E4E7EC;--mute:#818DA2;--rule:#263043;--rule2:#1D2636;--blue:#005DF9;--blue-t:#4C7DFF;--red:#F96161;--red-t:#3B1D26;--ok:#3FBF74;--ok-t:#14301F;--warn:#FBD23E;--warn-t:#3A3110}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--soft);font:14.5px/1.6 "Noto Sans KR","IBM Plex Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif}
a{color:var(--blue-t)}.wrap{max-width:1180px;margin:0 auto;padding:0 20px}
header{position:sticky;top:0;z-index:5;background:rgba(12,17,29,.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--rule)}
header .wrap{display:flex;align-items:center;gap:14px;height:60px}header b{font-size:17px;color:var(--ink)}header .ip{color:var(--mute);font-size:12.5px}
header .sp{flex:1}.btn{height:36px;padding:0 16px;border-radius:18px;border:1px solid var(--rule);background:var(--card);color:var(--ink);font:inherit;font-weight:600;cursor:pointer}
.btn:hover{border-color:var(--mute)}.btn.pri{background:var(--blue);border-color:var(--blue);color:#fff}.btn:disabled{opacity:.5;cursor:default}
h2{font-size:18px;color:var(--ink);margin:28px 0 12px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.card{background:var(--card);border:1px solid var(--rule);border-radius:14px;padding:16px 18px}
.card .l{font-size:12.5px;color:var(--mute)}.card .v{font-size:22px;font-weight:700;color:var(--ink);margin:2px 0;font-variant-numeric:tabular-nums}.card .s{font-size:12.5px;color:var(--mute)}
.st{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;border-radius:10px;padding:1px 8px}
.st.ok{color:var(--ok);background:var(--ok-t)}.st.warn{color:var(--warn);background:var(--warn-t)}.st.bad{color:var(--red);background:var(--red-t)}
.todo{list-style:none;margin:0;padding:0}.todo li{padding:10px 14px;border-bottom:1px solid var(--rule2);display:flex;gap:10px;align-items:flex-start}.todo li:last-child{border-bottom:0}
.todo code{background:var(--card2);border-radius:6px;padding:1px 6px;color:var(--ink)}
.src{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px}
.bar input,.bar select{height:36px;border-radius:8px;border:1px solid var(--rule);background:var(--card);color:var(--ink);padding:0 10px;font:inherit}
.bar input[type=search]{flex:1;min-width:200px}.bar label{display:flex;gap:6px;align-items:center;color:var(--mute);font-size:13px}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--rule);border-radius:14px;overflow:hidden}
th{font-size:12px;color:var(--mute);font-weight:500;text-align:left;padding:10px 12px;border-bottom:1px solid var(--rule)}
td{padding:9px 12px;border-bottom:1px solid var(--rule2);vertical-align:top;font-size:13.5px}tr:last-child td{border-bottom:0}
tr.hid td{opacity:.45}tr.pin td:first-child{box-shadow:inset 3px 0 0 var(--blue)}
td.d{white-space:nowrap;color:var(--mute);font-variant-numeric:tabular-nums}td.t a{color:var(--ink);text-decoration:none;font-weight:600}td.t a:hover{text-decoration:underline}
.sb{font-size:11px;font-weight:700;border-radius:4px;padding:1px 6px;background:var(--card2);color:var(--soft);white-space:nowrap}
.tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}.tags span{font-size:11.5px;color:var(--blue-t);background:#122047;border-radius:9px;padding:0 7px}
.act{white-space:nowrap;text-align:right}.act button{height:28px;padding:0 10px;border-radius:14px;border:1px solid var(--rule);background:var(--card2);color:var(--soft);font:inherit;font-size:12.5px;cursor:pointer;margin-left:4px}
.act button.on{background:var(--blue);border-color:var(--blue);color:#fff}
.ed{display:flex;gap:6px;margin-top:6px}.ed input{flex:1;height:30px;border-radius:6px;border:1px solid var(--rule);background:var(--bg);color:var(--ink);padding:0 8px;font:inherit;font-size:13px}
.msg{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--card2);border:1px solid var(--rule);color:var(--ink);padding:10px 18px;border-radius:20px;box-shadow:0 8px 24px rgba(0,0,0,.4);display:none}
.more{text-align:center;margin:12px 0 40px}.muted{color:var(--mute)}
@media(max-width:720px){td.d,th.d{display:none}.act button{margin:2px 0 0 4px}}
</style></head><body>
<header><div class="wrap"><b>바둑DB 관리자</b><span class="ip" id="ip"></span><span class="sp"></span><a class="btn" href="/" style="display:inline-flex;align-items:center;text-decoration:none">사이트로</a><button class="btn" id="reload">새로고침</button></div></header>
<main class="wrap">
<h2>수집 현황</h2><div class="grid" id="cards"><div class="card muted">불러오는 중…</div></div>
<h2>할 일</h2><div class="card" style="padding:0"><ul class="todo" id="todo"></ul></div>
<h2 style="display:flex;align-items:center;gap:10px">뉴스 관리 <span class="muted" style="font-size:13px;font-weight:400" id="ncnt"></span><span style="flex:1"></span><button class="btn pri" id="refresh">지금 뉴스 수집</button></h2>
<div class="bar"><input type="search" id="q" placeholder="제목·언론사 검색"><select id="fs"><option value="">모든 출처</option><option value="oro">사이버오로</option><option value="tyg">타이젬</option><option value="han">한게임바둑</option><option value="ggl">언론 뉴스</option></select>
<label><input type="checkbox" id="fh"> 숨긴 것만</label><label><input type="checkbox" id="fp"> 고정한 것만</label></div>
<table><thead><tr><th class="d">날짜</th><th>기사</th><th style="text-align:right">관리</th></tr></thead><tbody id="tb"></tbody></table>
<div class="more"><button class="btn" id="more">더 보기</button></div>
<p class="muted" style="font-size:12.5px;margin-bottom:40px">숨기기·고정·기사 이름 고치기는 사이트 뉴스에 바로 적용됩니다(방문자 화면은 길어야 5분 뒤). 기사 이름은 쉼표로 구분해 적습니다. 예: 신진서, 박정환</p>
</main><div class="msg" id="msg"></div>
<script>
const SRC={oro:'사이버오로',tyg:'타이젬',han:'한게임바둑',ggl:'언론 뉴스'};
const $=id=>document.getElementById(id);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=t=>{const m=$('msg');m.textContent=t;m.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>m.style.display='none',2600);};
const api=(p,b)=>fetch(p,b?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}:{cache:'no-store'}).then(r=>r.json());
const kst=iso=>{if(!iso)return '–';const d=new Date(new Date(iso).getTime()+9*36e5);return (d.getUTCMonth()+1)+'.'+d.getUTCDate()+' '+String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0');};
const ago=iso=>{if(!iso)return '';const m=Math.round((Date.now()-Date.parse(iso))/6e4);return m<60?m+'분 전':m<1440?Math.round(m/60)+'시간 전':Math.round(m/1440)+'일 전';};
const ymd=s=>{s=String(s||'');return s.length>=8?s.slice(0,4)+'.'+s.slice(4,6)+'.'+s.slice(6,8):s;};
const daysSince=s=>{s=String(s||'').replace(/-/g,'');if(s.length<8)return 999;return Math.floor((Date.now()+9*36e5-Date.UTC(+s.slice(0,4),+s.slice(4,6)-1,+s.slice(6,8)))/864e5);};
const st=(cls,t)=>'<span class="st '+cls+'">'+t+'</span>';
const card=(l,v,s,badge)=>'<div class="card"><div class="l">'+l+(badge?' '+badge:'')+'</div><div class="v">'+v+'</div><div class="s">'+(s||'')+'</div></div>';
async function loadStatus(){
  const S=await api('/api/admin/status');$('ip').textContent='접속 IP '+S.ip;
  const m=S.meta||{},n=S.news||{},si=S.site||{};const todo=[];
  const mAge=m.tried?(Date.now()-Date.parse(m.tried))/36e5:99;
  const nb=mAge<3?st('ok','정상'):mAge<8?st('warn','늦음'):st('bad','멈춤');
  if(mAge>=3)todo.push('뉴스 수집이 '+ago(m.tried)+'에 마지막으로 돌았습니다. 아래 <b>지금 뉴스 수집</b>을 눌러 보세요.');
  const srcs=(m.ok||[]).map(x=>st('ok',esc(x))).concat((m.fail||[]).map(x=>st('bad',esc(x)))).join(' ');
  if((m.fail||[]).length)todo.push('뉴스 출처 일부가 실패했습니다: '+(m.fail||[]).map(esc).join(', ')+' (다른 출처로 계속 받습니다)');
  const lastNews=Object.keys(SRC).map(k=>SRC[k]+' '+(n.last&&n.last[k]?ymd(n.last[k]).slice(5):'–')).join(' · ');
  const gD=daysSince(si.last_game),kD=daysSince(si.kba_fetched),grD=daysSince(si.goratings),wD=daysSince(si.whr);
  const now=new Date(Date.now()+9*36e5),ym=now.getUTCFullYear()+'-'+String(now.getUTCMonth()+1).padStart(2,'0');
  if(si.last_game&&kD>=3)todo.push('최근 대국이 '+ymd(si.last_game)+'까지입니다. PC에서 <code>최근기록_갱신.bat</code> → <code>배포.bat</code>');
  if(si.kba_rank&&si.kba_rank<ym&&now.getUTCDate()>=3)todo.push('한국기원 '+(now.getUTCMonth()+1)+'월 랭킹이 아직 반영되지 않았습니다(지금 '+esc(si.kba_rank)+'). 발표되면 <code>최근기록_갱신.bat</code>이 받습니다.');
  if(si.cn_rank&&si.cn_rank<ym)todo.push('중국 랭킹이 '+esc(si.cn_rank)+'입니다. 새 달 표가 나오면 <code>pipeline/cn_ranking.json</code>에 추가');
  if(wD>=7)todo.push('실력 점수 계산이 '+wD+'일 전입니다. PC에서 <code>최근기록_갱신.bat</code>을 돌리면 함께 계산됩니다(10분 안팎).');
  if(grD>=7)todo.push('고레이팅 순위가 '+esc(si.goratings)+' 기준입니다. <code>고레이팅_수집.bat</code>');
  $('cards').innerHTML=
    card('뉴스 수집',kst(m.tried),ago(m.tried)+' · 새 기사 '+(m.added??'–')+'건 · 전체 '+(n.total??'–')+'건<div class="src">'+srcs+'</div>',nb)+
    card('출처별 최신 뉴스',(n.last&&Object.values(n.last).sort().pop()?ymd(Object.values(n.last).sort().pop()):'–'),lastNews+'<br>숨김 '+(n.hidden||0)+' · 고정 '+(n.pinned||0))+
    card('최근 대국',si.last_game?ymd(si.last_game):'–',si.games?Number(si.games).toLocaleString()+'국 · 한국기원 수집 '+esc(si.kba_fetched):'status.json 없음 — 다음 배포 후 보입니다',si.last_game?(kD<3?st('ok','최신'):st('warn',kD+'일 전 수집')):'')+
    card('한국기원 랭킹',esc(si.kba_rank||'–'),'매달 초 발표',si.kba_rank?(si.kba_rank>=ym?st('ok','이번 달'):st('warn','지난달')):'')+
    card('중국 랭킹',esc(si.cn_rank||'–'),'표 이미지로 받아 넣음',si.cn_rank?(si.cn_rank>=ym?st('ok','이번 달'):st('warn','지난달')):'')+
    card('일본 랭킹',esc(si.jp_rank||'–'),'囲碁棋譜.COM 碁力 · 매달',si.jp_rank?(si.jp_rank>=ym?st('ok','이번 달'):st('warn','지난달')):'')+
    card('대국 일정',esc(si.schedule||'–'),'한국기원 일정 · 일본 대국 '+esc(si.jp_games||'–'),si.schedule?(daysSince(si.schedule)<4?st('ok','최신'):st('warn',daysSince(si.schedule)+'일 전')):'')+
    card('상금 순위',esc(si.prize||'–'),'표 이미지로 받아 넣음',si.prize?st('ok','입력됨'):'')+
    card('고레이팅',esc(si.goratings||'–'),'goratings.org 순위',si.goratings?(grD<7?st('ok','최신'):st('warn',grD+'일 전')):'')+
    card('실력 점수',esc(si.whr||'–'),'7일마다 PC에서 계산',si.whr?(wD<8?st('ok','최신'):st('warn',wD+'일 전')):'')+
    card('사이트 파일',esc(si.built||'–'),si.players?Number(si.players).toLocaleString()+'명 기사 정보':'');
  $('todo').innerHTML=todo.length?todo.map(t=>'<li><span>•</span><span>'+t+'</span></li>').join(''):'<li><span>✓</span><span>밀린 일이 없습니다.</span></li>';
}
let N={items:[],ovr:{hide:{},pin:{},tags:{}},names:{}},LIM=60,OPEN='';
async function loadNews(){N=await api('/api/admin/news');N.ovr.hide=N.ovr.hide||{};N.ovr.pin=N.ovr.pin||{};N.ovr.tags=N.ovr.tags||{};draw();}
function draw(){
  const q=$('q').value.trim(),fs=$('fs').value,fh=$('fh').checked,fp=$('fp').checked,O=N.ovr;
  let L=N.items.filter(x=>(!fs||x[0]===fs)&&(!q||(x[2]+' '+x[3]).includes(q))&&(!fh||O.hide[x[4]])&&(!fp||O.pin[x[4]]));
  L=L.filter(x=>O.pin[x[4]]).concat(L.filter(x=>!O.pin[x[4]]));
  $('ncnt').textContent=L.length.toLocaleString()+'건';
  $('tb').innerHTML=L.slice(0,LIM).map((x,i)=>{const u=x[4],h=!!O.hide[u],p=!!O.pin[u];const tg=O.tags[u]||x[6]||[];
    return '<tr class="'+(h?'hid ':'')+(p?'pin':'')+'" data-u="'+esc(u)+'"><td class="d">'+ymd(x[1])+'</td><td class="t"><span class="sb">'+SRC[x[0]]+'</span> '+(x[0]==='ggl'&&x[3]?'<span class="muted" style="font-size:12px">'+esc(x[3])+'</span> ':'')+'<br><a href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(x[2])+'</a>'+
    '<div class="tags">'+tg.map(k=>'<span>'+esc(N.names[k]||k)+'</span>').join('')+(O.tags[u]?'<span style="background:transparent;color:var(--mute)">(고침)</span>':'')+'</div>'+
    (OPEN===u?'<div class="ed"><input id="edv" value="'+esc(tg.map(k=>N.names[k]||k).join(', '))+'" placeholder="기사 이름, 쉼표로"><button class="btn" data-a="save" style="height:30px">저장</button><button class="btn" data-a="reset" style="height:30px">원래대로</button></div>':'')+
    '</td><td class="act"><button data-a="pin" class="'+(p?'on':'')+'">'+(p?'고정됨':'고정')+'</button><button data-a="hide" class="'+(h?'on':'')+'">'+(h?'숨김':'숨기기')+'</button><button data-a="tag">기사 이름</button></td></tr>';}).join('')||'<tr><td colspan="3" class="muted">해당하는 뉴스가 없습니다</td></tr>';
  $('more').style.display=L.length>LIM?'':'none';
}
$('tb').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const u=b.closest('tr').dataset.u,a=b.dataset.a,O=N.ovr;
  if(a==='tag'){OPEN=OPEN===u?'':u;draw();const v=$('edv');if(v)v.focus();return;}
  let body={u};if(a==='pin')body.pin=!O.pin[u];if(a==='hide')body.hide=!O.hide[u];if(a==='save')body.tags=$('edv').value;if(a==='reset')body.tags=null;
  b.disabled=true;const r=await api('/api/admin/news/set',body);b.disabled=false;
  if(!r.ok){toast(r.error||'실패');return;}N.ovr=r.ovr;Object.assign(N.names,r.names||{});if(a==='save'||a==='reset')OPEN='';draw();
  toast(a==='pin'?(body.pin?'맨 위에 고정했습니다':'고정을 풀었습니다'):a==='hide'?(body.hide?'사이트에서 숨겼습니다':'다시 보이게 했습니다'):(r.unknown&&r.unknown.length?'모르는 이름: '+r.unknown.join(', '):'기사 이름을 저장했습니다'));};
['q','fs','fh','fp'].forEach(id=>$(id).addEventListener(id==='q'?'input':'change',()=>{LIM=60;draw();}));
$('more').onclick=()=>{LIM+=60;draw();};
$('reload').onclick=()=>{loadStatus();loadNews();};
$('refresh').onclick=async()=>{const b=$('refresh');b.disabled=true;b.textContent='수집 중…';try{const r=await api('/api/admin/refresh',{});toast('수집 완료 — 새 기사 '+((r.meta||{}).added??0)+'건');}catch(e){toast('수집 실패');}b.disabled=false;b.textContent='지금 뉴스 수집';loadStatus();loadNews();};
loadStatus().catch(()=>toast('현황을 불러오지 못했습니다'));loadNews().catch(()=>toast('뉴스를 불러오지 못했습니다'));
</script></body></html>`;
