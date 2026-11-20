// 바둑DB 관리자 — 등록한 IP(ADMIN_IPS 비밀 값)에서만 열림. 다른 곳에서는 '없는 페이지(404)'로 보임
// /admin              관리자 화면
// /api/admin/ping     접속 확인 (사이트 푸터의 '관리자' 링크용)
// /api/admin/status   수집 현황
// /api/admin/news     뉴스 목록(숨긴 것 포함) + 손본 내용
// /api/admin/refresh  지금 뉴스 수집 (POST)
// /api/admin/news/set 숨기기·고정·기사 이름 고치기 (POST)
import { NAMES } from './names.js';
import { PC_JS } from './admin_pc.js';
import { FLOW_HTML } from './site_flow.js';   // FLOW_FILE_V1: tools\site_flow.ps1 이 Archify 그림으로 채움

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
  if (p === '/admin/flow.html') return FLOW_HTML ? new Response(FLOW_HTML, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } }) : new Response('', { status: 204 });
  if (p === '/admin/pc.js') return new Response(PC_JS, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
  if (p === '/api/admin/ping') return JX({ ok: true, ip });
  if (p === '/api/admin/status') {
    const [meta, list, ovr, site] = await Promise.all([
      env.NEWS_KV.get('meta', 'json'), env.NEWS_KV.get('news', 'json'), getOvr(env),
      env.ASSETS.fetch(new Request(u.origin + '/status.json')).then(r => r.ok ? r.json() : null).catch(() => null)]);
    const last = {}, count = {};
    for (const x of list || []) { count[x[0]] = (count[x[0]] || 0) + 1; if (!last[x[0]] || x[1] > last[x[0]]) last[x[0]] = x[1]; }
    return JX({ ip, now: new Date().toISOString(), meta, news: { total: (list || []).length, last, count, hidden: Object.keys(ovr.hide || {}).length, pinned: Object.keys(ovr.pin || {}).length }, site });
  }
  if (p === '/api/admin/db') {   // DB_VIEW_V1: 원장 DB(D1) meta 표만 읽음 (몇 행)
    let meta = null, err = '';
    try {
      if (env.DB) { const r = await env.DB.prepare('SELECT k, v FROM meta').all(); meta = Object.fromEntries((r.results || []).map(x => [x.k, x.v])); }
      else err = 'D1 연결 없음';
    } catch (e) { err = String((e && e.message) || e).slice(0, 200); }
    return JX({ meta, err });
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
<header><div class="wrap"><b>바둑DB 관리자</b><span class="ip" id="ip"></span><span class="sp"></span><button class="btn pri" id="vhome">현황</button><button class="btn" id="vflow">사이트 흐름도</button><button class="btn" id="vdb">DB 구조도</button><a class="btn" href="/" style="display:inline-flex;align-items:center;text-decoration:none">사이트로</a><button class="btn" id="reload">새로고침</button></div></header>
<main class="wrap" id="v-home">
<h2>수집 현황</h2><div class="grid" id="cards"><div class="card muted">불러오는 중…</div></div>
<h2>할 일</h2><div class="card" style="padding:0"><ul class="todo" id="todo"></ul></div>
<h2 style="display:flex;align-items:center;gap:10px">뉴스 수집<span style="flex:1"></span><button class="btn pri" id="refresh">지금 뉴스 수집</button></h2><div style="margin-bottom:40px"></div>
</main>
<main class="wrap" id="v-flow" hidden>
<h2>사이트 자료 흐름도 <span class="muted" style="font-size:13px;font-weight:400">수집 → 만들기 → 배포 → 방문자</span></h2>
<p class="muted" style="font-size:13px;margin:-4px 0 12px"><b style="color:#4C7DFF">파란 굵은 선</b> 주 흐름 · <b style="color:#F96161">빨간 선</b> 운영자만(등록 IP · 이 PC 안) · 점선 자동·나중에 이어 올림. PC에서 <code>사이트흐름도_만들기.bat</code>을 실행한 뒤 배포하면 이 자리에 Archify 그림이 나옵니다.</p>
<div id="flowarch" hidden style="margin-bottom:12px"><div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><span class="muted" style="font-size:13px">Archify 그림</span><span style="flex:1"></span><a class="btn" href="/admin/flow.html" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;text-decoration:none;height:30px;font-size:13px">새 창으로 크게 보기</a><button class="btn" id="flowtoggle" style="height:30px;font-size:13px">간단 그림 보기</button></div><iframe id="flowframe" title="사이트 흐름도 (Archify)" style="width:100%;height:860px;border:1px solid var(--rule);border-radius:14px;background:var(--card)"></iframe></div>
<div class="card" style="padding:12px;overflow-x:auto" id="flowsvg"></div>
<div class="grid" style="margin:12px 0 40px">
<div class="card"><div class="l">주기</div><div class="s" style="font-size:13px;line-height:1.7;color:var(--soft)">매일: 최근기록_갱신 (받기 → update.py → 배포, 3분 안팎)<br>주 1회쯤: 기보 받기 (해외·한국 따로)<br>7일마다: 실력 점수 재계산<br>뉴스: Worker 가 하루 10번 스스로 수집</div></div>
<div class="card"><div class="l">사이트 파일</div><div class="s" style="font-size:13px;line-height:1.7;color:var(--soft)">index.html(홈 미리 그림) + core·old·extra JSON + 기보 묶음 72개<br>원장 DB는 배포 때마다 새로 만들어 D1에 바뀐 행만 올림</div></div>
<div class="card"><div class="l">보안</div><div class="s" style="font-size:13px;line-height:1.7;color:var(--soft)">관리자 페이지는 등록 IP에서만 · 관리 도우미는 이 PC 안에서만<br>자료 파일은 사이트 화면에서 부를 때만(문지기) · 요청 수 제한 · 2단계 인증</div></div>
<div class="card"><div class="l">다음 단계</div><div class="s" style="font-size:13px;line-height:1.7;color:var(--soft)">12월 D단계: 방문자 화면이 JSON 대신 D1 API로 읽어 첫 화면 자료를 줄임</div></div>
</div>
</main>
<main class="wrap" id="v-db" hidden>
<h2>원장 DB 구조도 <span class="muted" style="font-size:13px;font-weight:400" id="dbinfo">불러오는 중…</span></h2>
<p class="muted" style="font-size:13px;margin:-4px 0 12px">자료 흐름: 수집 → <code>pipeline/base_data.json</code> → 원장 DB <code>kba_data/d1/baduk.sqlite</code>(배포 때마다 새로 만듦) → Cloudflare D1(바뀐 행만 올림). 칸 이름에 마우스를 올리면 설명이 나옵니다. <b style="color:#FBD23E">PK</b> 기본 키 · <b style="color:#4C7DFF">FK</b> 다른 표를 가리킴(화살표)</p>
<div class="card" style="padding:12px;overflow-x:auto" id="dbsvg"></div>
<p class="muted" style="font-size:12.5px;margin:10px 0 40px">사이트 화면은 아직 JSON 파일을 읽습니다. 12월 D단계에서 화면이 D1을 직접 읽도록 바꿀 예정입니다.</p>
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
  const cD=daysSince(si.cnl_fetched),lD=daysSince(si.wlg_fetched);
  if(si.cnl_fetched&&cD>=31)todo.push('중국 리그·세계대회 기록이 '+esc(si.cnl_fetched)+' 수집입니다. <code>중국기록_받기.bat</code> (10~20분)');
  if(si.wlg_fetched&&lD>=15)todo.push('여자바둑리그 결과가 '+esc(si.wlg_fetched)+' 수집입니다. 시즌 중이면 <code>바둑리그_받기.bat</code>');
  if([kD>=7,wD>=14,grD>=14,si.cnl_fetched&&cD>=45].filter(Boolean).length>=2)todo.push('밀린 자료가 여럿입니다. <code>전체_받기_배포.bat</code> 하나로 모두 받고 배포까지 합니다(40분~1시간).');
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
    card('중국 리그·세계대회',esc(si.cnl_fetched||'–'),si.cnl_games!=null?'중국바둑협회 · 리그 '+Number(si.cnl_games||0).toLocaleString()+'국 · '+(si.cnl_seasons||0)+'시즌':'중국기록_받기.bat',si.cnl_fetched?(daysSince(si.cnl_fetched)<31?st('ok','최신'):st('warn',daysSince(si.cnl_fetched)+'일 전')):'')+
    card('여자바둑리그',esc(si.wlg_fetched||'–'),si.wlg_seasons?si.wlg_seasons+'시즌 · w.baduk.or.kr':'바둑리그_받기.bat',si.wlg_fetched?(daysSince(si.wlg_fetched)<15?st('ok','최신'):st('warn',daysSince(si.wlg_fetched)+'일 전')):'')+
    card('바둑리그 선발',esc(si.kls_updated||'–'),si.kls_teams?si.kls_teams+'팀 · kleague.baduk.or.kr':'바둑리그_받기.bat',si.kls_teams?st('ok','입력됨'):'')+
    card('대진표 보강',si.bx_filled!=null?Number(si.bx_filled||0).toLocaleString()+'국':'–','중국 기록으로 채운 칸 · 단계 추정 '+Number(si.bs_assigned||0).toLocaleString()+'국',si.bx_filled?st('ok','적용'):'')+
    card('사이트 파일',esc(si.built||'–'),si.players?Number(si.players).toLocaleString()+'명 기사 정보':'');
  $('todo').innerHTML=todo.length?todo.map(t=>'<li><span>•</span><span>'+t+'</span></li>').join(''):'<li><span>✓</span><span>밀린 일이 없습니다.</span></li>';
}
$('reload').onclick=()=>{loadStatus();};
$('refresh').onclick=async()=>{const b=$('refresh');b.disabled=true;b.textContent='수집 중…';try{const r=await api('/api/admin/refresh',{});toast('수집 완료 — 새 기사 '+((r.meta||{}).added??0)+'건');}catch(e){toast('수집 실패');}b.disabled=false;b.textContent='지금 뉴스 수집';loadStatus();};
loadStatus().catch(()=>toast('현황을 불러오지 못했습니다'));
// DB_VIEW_V1: 원장 DB(Cloudflare D1) 구조도
const DBS={
 players:{x:20,y:20,d:'기사',c:[['pkey','TEXT','PK','기사 키: 한국기원 8자리 · CWA… 중국 · ki… 일본 · n:이름'],['name','TEXT','','사이트 표기 이름(한글)'],['name_hanja','TEXT','','한자'],['name_en','TEXT','','영문'],['country','TEXT','','나라'],['org','TEXT','','소속'],['gender','TEXT','','성별'],['dan','INTEGER','','단'],['birth','TEXT','','생년월일'],['status','TEXT','','현역·은퇴'],['kba_rating','REAL','','한국기원 레이팅(한국 기사만)'],['profile','INTEGER','','1 프로필 있음 · 0 대국 기록에만 있는 이름']]},
 player_names:{x:20,y:360,d:'기사 이름 표기',c:[['pkey','TEXT','PK FK','players.pkey'],['lang','TEXT','PK','ko 한글 · hanja · zh · ja · en · raw 대국 기록 원문'],['name','TEXT','PK','표기']]},
 rankings:{x:20,y:500,d:'랭킹',c:[['list','TEXT','PK','kba · kba_w · cn · cn_w · jp · jp_w · gor'],['month','TEXT','PK','2026-11'],['pos','INTEGER','PK','순위'],['pkey','TEXT','PK FK','players.pkey'],['name','TEXT','','이름'],['score','REAL','','점수']]},
 ratings:{x:20,y:705,d:'실력 점수(월별, 계산값)',c:[['pkey','TEXT','PK FK','players.pkey'],['ym','INTEGER','PK','202611'],['score','INTEGER','','실력 점수(WHR)'],['rnk','INTEGER','','순위']]},
 games:{x:420,y:20,d:'대국',c:[['id','TEXT','PK','대국 고유 번호(자료가 늘어도 그대로)'],['date','INTEGER','','20261119'],['tournament','TEXT','FK','tournaments.name'],['event','TEXT','FK','events.name'],['cat','TEXT','','분류'],['stage','INTEGER','','-1 모름 · 0 예선 · 1 본선 · 2 8강 · 3 4강 · 4 결승'],['winner','TEXT','FK','players.pkey'],['loser','TEXT','FK','players.pkey'],['winner_name','TEXT','','승자 이름'],['loser_name','TEXT','','패자 이름'],['result','TEXT','','결과 원문 예: 251수 백 2.5집승'],['winner_color','INTEGER','','1 승자 흑 · 2 승자 백 · 0 모름'],['win_type','INTEGER','','0 불계 · 1 집 · 2 시간패 등 · 4 무승부'],['margin','REAL','','집 차'],['moves','INTEGER','','수'],['draw','INTEGER','','1 무승부·무효'],['source','INTEGER','','0 한국기원 비공식 · 1 한국기원 · 2 중국바둑협회 · 3 일본 · 4 대만 · 5 기보 사이트']]},
 kifu:{x:420,y:500,d:'기보',c:[['game_id','TEXT','PK FK','games.id'],['src','TEXT','','i 囲碁棋譜.COM · f 야호 · h 한게임 · t 타이젬 · w 101围棋网 · g Go4Go · o 사이버오로'],['ref','TEXT','','출처의 기보 번호'],['file','TEXT','','기보 묶음 파일 또는 사이버오로 경로'],['black','INTEGER','','기보상 흑: 1 승자 · 2 패자 · 0 모름']]},
 events:{x:820,y:20,d:'대회 묶음',c:[['name','TEXT','PK','예: 삼성화재배'],['cat','TEXT','','국내기전 · 세계기전 · 리그 · 협회리그 · 해외리그 · 중국·일본·대만기전 · 기타'],['games','INTEGER','','대국 수'],['first_date','INTEGER','','첫 대국'],['last_date','INTEGER','','마지막 대국']]},
 tournaments:{x:820,y:220,d:'대회(회차·단계)',c:[['name','TEXT','PK','예: 제31회 삼성화재배 결승 1국'],['event','TEXT','FK','events.name'],['cat','TEXT','','분류'],['stage','INTEGER','','-1 모름 · 0 예선 · 1 본선 · 2 8강 · 3 4강 · 4 결승']]},
 meta:{x:820,y:400,d:'만든 정보',c:[['k','TEXT','PK','built · data_date · rows …'],['v','TEXT','','값']]}
};
const DBR=[['player_names','pkey','players','pkey','L',8],['rankings','pkey','players','pkey','L',4],['ratings','pkey','players','pkey','L',0],
 ['games','winner','players','pkey','M',370],['games','loser','players','pkey','M',385],['games','tournament','tournaments','name','M2',770],['games','event','events','name','M2',785],
 ['tournaments','event','events','name','R',1162],['kifu','game_id','games','id','B',408]];
const DW=330,HH=40,RH=22;
function dbRowY(t,col){const T=DBS[t];const i=T.c.findIndex(c=>c[0]===col);return T.y+HH+i*RH+RH/2;}
function drawDB(meta){
  const rows=(()=>{try{return JSON.parse((meta||{}).rows||'{}');}catch(e){return {};}})();
  let H=0;for(const t in DBS){const T=DBS[t];H=Math.max(H,T.y+HH+T.c.length*RH);}H+=20;
  let s='<svg viewBox="0 0 1170 '+H+'" width="100%" style="display:block;min-width:900px" xmlns="http://www.w3.org/2000/svg"><defs><marker id="dbar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="#4C7DFF" stroke-width="1.6"/></marker></defs>';
  let lines='';
  for(const [ft,fc,pt,pc,kind,v] of DBR){
    const y1=dbRowY(ft,fc),y2=dbRowY(pt,pc),F=DBS[ft],P=DBS[pt];let d;
    if(kind==='L'){const x=F.x;d='M'+x+' '+y1+' H'+(v+2)+' V'+y2+' H'+(P.x-1);}
    else if(kind==='M'){d='M'+F.x+' '+y1+' H'+v+' V'+y2+' H'+(P.x+DW+1);}
    else if(kind==='M2'){d='M'+(F.x+DW)+' '+y1+' H'+v+' V'+y2+' H'+(P.x-1);}
    else if(kind==='R'){d='M'+(F.x+DW)+' '+y1+' H'+v+' V'+y2+' H'+(P.x+DW+1);}
    else {d='M'+F.x+' '+y1+' H'+v+' V'+y2+' H'+(P.x-1);}
    lines+='<path d="'+d+'" fill="none" stroke="#4C7DFF" stroke-opacity=".75" stroke-width="1.3" marker-end="url(#dbar)"><title>'+ft+'.'+fc+' → '+pt+'.'+pc+'</title></path><circle cx="'+(kind==='M2'||kind==='R'?F.x+DW:F.x)+'" cy="'+y1+'" r="3" fill="#4C7DFF"/>';
  }
  for(const t in DBS){const T=DBS[t],h=HH+T.c.length*RH;const n=rows[t];
    s+='<g><rect x="'+T.x+'" y="'+T.y+'" width="'+DW+'" height="'+h+'" rx="10" fill="#141B2A" stroke="#263043"/>'+
      '<rect x="'+T.x+'" y="'+T.y+'" width="'+DW+'" height="'+HH+'" rx="10" fill="#1A2232"/><rect x="'+T.x+'" y="'+(T.y+HH-10)+'" width="'+DW+'" height="10" fill="#1A2232"/>'+
      '<text x="'+(T.x+14)+'" y="'+(T.y+25)+'" fill="#F8F9FC" font-size="15" font-weight="700">'+t+'</text>'+
      '<text x="'+(T.x+14+t.length*9+10)+'" y="'+(T.y+25)+'" fill="#818DA2" font-size="12.5">'+esc(T.d)+'</text>'+
      (n!=null?'<text x="'+(T.x+DW-14)+'" y="'+(T.y+25)+'" fill="#4C7DFF" font-size="12.5" text-anchor="end">'+Number(n).toLocaleString()+'행</text>':'');
    T.c.forEach((c,i)=>{const y=T.y+HH+i*RH;const pk=/PK/.test(c[2]),fk=/FK/.test(c[2]);
      s+='<g><title>'+esc(c[0]+' — '+c[3])+'</title>'+(i%2?'<rect x="'+(T.x+1)+'" y="'+y+'" width="'+(DW-2)+'" height="'+RH+'" fill="#1D2636" opacity=".45"/>':'')+
        '<text x="'+(T.x+14)+'" y="'+(y+15)+'" fill="'+(pk?'#FBD23E':'#E4E7EC')+'" font-size="13" font-weight="'+(pk?'700':'400')+'">'+c[0]+'</text>'+
        (c[2]?'<text x="'+(T.x+150)+'" y="'+(y+15)+'" fill="'+(fk?'#4C7DFF':'#FBD23E')+'" font-size="11" font-weight="700">'+c[2]+'</text>':'')+
        '<text x="'+(T.x+DW-14)+'" y="'+(y+15)+'" fill="#818DA2" font-size="11.5" text-anchor="end">'+c[1]+'</text></g>';});
    s+='</g>';}
  $('dbsvg').innerHTML=s.replace('</defs>','</defs>'+lines)+'</svg>';
  const m=meta||{};
  $('dbinfo').innerHTML=m.built?'Cloudflare D1 기준 · 원장 DB 만든 때 '+esc(String(m.built).replace('T',' '))+' · 자료 마지막 대국 '+esc(ymd(m.data_date))+(m.rows?'':' · 표별 행 수는 다음 배포 뒤 보입니다'):'D1 정보를 읽지 못했습니다'+(m.err?' ('+esc(m.err)+')':'')+' — 구조만 보여 줍니다';
}
async function loadDB(){let r={};try{r=await api('/api/admin/db');}catch(e){r={err:'연결 실패'};}drawDB(Object.assign({},r.meta||{},r.err?{err:r.err}:{}));}
// FLOW_VIEW_V1: 사이트 자료 흐름도 (산출문서/사이트흐름_archify.json 과 같은 내용)
const FX=[40,250,460,670,880,1090],FY=[40,200,360,520,680],FW=150,FH=64;
const FN=[['kifusrc','ext','기보 사이트 7곳','囲碁棋譜·101围棋网 등',1,0],['sources','ext','기록 출처','한국기원·중국협회·고레이팅',0,1],
 ['collect','be','수집 스크립트','kba/*.mjs (Node.js)',1,1],['update','be','update.py','합치기·우승·실력 점수',2,1],['base','db','base_data.json','사이트 원본 자료',3,1],
 ['build','be','파일 만들기','site_write·db_build',4,1],['agent','be','관리 도우미','admin_agent.py :47815',1,2],['deploy','be','배포.bat','검사·wrangler·GitHub',4,2],
 ['admin','ext','운영자','관리자 페이지',1,3],['worker','cf','Cloudflare Worker','정적 파일·API 문지기',4,3],['visitor','fe','방문자','baduk.rajin.live',5,2],
 ['kv','db','KV 뉴스','뉴스 목록·손본 내용',5,4],['d1','db','D1 baduk-db','원장 DB 9개 표',4,4],['news','ext','뉴스 출처','오로·타이젬·한게임·구글',3,4]];
const FE=[['kifusrc','collect','기보',''],['sources','collect','받기','main'],['collect','update','합침','main'],['update','base','저장','main'],['base','build','생성','main'],
 ['build','deploy','JSON·sqlite','main'],['deploy','worker','wrangler 배포','main'],['deploy','d1','바뀐 행만','dash',[[1030,392],[1060,392],[1060,712],[1030,712]],[1060,465]],['visitor','worker','HTTPS','',[[1165,424],[1165,552],[1030,552]]],
 ['worker','kv','뉴스 저장','',[[1015,584],[1015,640],[1165,640],[1165,680]]],['worker','news','2시간마다','dash',[[880,570],[745,570],[745,680]]],['worker','d1','관리 조회',''],['admin','worker','관리자 페이지 (등록 IP만)','sec'],
 ['admin','agent','작업 실행','sec'],['agent','collect','bat 실행','']];
const FCOL={ext:['#1A2232','#5B6577','#C9CED8'],be:['#10224A','#2F5BD8','#DCE6FF'],db:['#33280E','#B48A1F','#FBE3A1'],cf:['#2A1C47','#7A55D6','#E6DAFF'],fe:['#123222','#2E9B5E','#CDEFD9']};
const ECOL={main:'#4C7DFF',sec:'#F96161',dash:'#818DA2','':'#9AA4B6'};
function drawFlow(){
  const P={};FN.forEach(n=>P[n[0]]={x:FX[n[4]],y:FY[n[5]],n});
  const cx=p=>p.x+FW/2,cy=p=>p.y+FH/2;
  let s='<svg viewBox="0 0 1270 790" width="100%" style="display:block;min-width:900px" xmlns="http://www.w3.org/2000/svg"><defs>'+
    Object.entries(ECOL).map(([k,c])=>'<marker id="fa'+(k||'n')+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="'+c+'" stroke-width="1.6"/></marker>').join('')+'</defs>';
  const frame=(ids,label,col)=>{const ps=ids.map(i=>P[i]);const x=Math.min(...ps.map(p=>p.x))-18,y=Math.min(...ps.map(p=>p.y))-34,X=Math.max(...ps.map(p=>p.x+FW))+18,Y=Math.max(...ps.map(p=>p.y+FH))+18;
    return '<rect x="'+x+'" y="'+y+'" width="'+(X-x)+'" height="'+(Y-y)+'" rx="14" fill="none" stroke="'+col+'" stroke-dasharray="6 5" stroke-opacity=".7"/><text x="'+(x+14)+'" y="'+(y+21)+'" fill="'+col+'" font-size="12.5" font-weight="700">'+esc(label)+'</text>';};
  s+=frame(['collect','update','base','build','agent','deploy'],'내 PC (E:/AI 프로젝트/35_바둑)','#4C7DFF')+frame(['worker','kv','d1'],'Cloudflare','#9C7BEA');
  let labels='';
  for(const [a,b,lab,kind,via,lp] of FE){const A=P[a],B=P[b];let pts;
    if(via){pts=via;}
    else if(A.y===B.y){pts=A.x<B.x?[[A.x+FW,cy(A)],[B.x,cy(B)]]:[[A.x,cy(A)],[B.x+FW,cy(B)]];}
    else if(A.x===B.x){pts=A.y<B.y?[[cx(A),A.y+FH],[cx(B),B.y]]:[[cx(A),A.y],[cx(B),B.y+FH]];}
    else{const sx=B.x>A.x?A.x+FW:A.x;pts=[[sx,cy(A)],[cx(B),cy(A)],[cx(B),B.y>A.y?B.y:B.y+FH]];}
    const c=ECOL[kind||''];
    s+='<path d="M'+pts.map(p=>p.join(' ')).join(' L')+'" fill="none" stroke="'+c+'" stroke-width="'+(kind==='main'?2:1.4)+'"'+(kind==='dash'?' stroke-dasharray="5 4"':'')+' marker-end="url(#fa'+(kind||'n')+')"/>';
    let best=0,bi=0;for(let i=0;i<pts.length-1;i++){const L=Math.abs(pts[i+1][0]-pts[i][0])+Math.abs(pts[i+1][1]-pts[i][1]);if(L>best){best=L;bi=i;}}
    const mx=lp?lp[0]:(pts[bi][0]+pts[bi+1][0])/2,my=lp?lp[1]:(pts[bi][1]+pts[bi+1][1])/2,w=lab.length*11+12;
    labels+='<rect x="'+(mx-w/2)+'" y="'+(my-10)+'" width="'+w+'" height="20" rx="10" fill="#0C111D" stroke="'+c+'" stroke-opacity=".5"/><text x="'+mx+'" y="'+(my+4)+'" fill="#E4E7EC" font-size="11.5" text-anchor="middle">'+esc(lab)+'</text>';}
  for(const k in P){const p=P[k],n=p.n,c=FCOL[n[1]];
    s+='<rect x="'+p.x+'" y="'+p.y+'" width="'+FW+'" height="'+FH+'" rx="10" fill="'+c[0]+'" stroke="'+c[1]+'"/>'+
      '<text x="'+cx(p)+'" y="'+(p.y+27)+'" fill="'+c[2]+'" font-size="14" font-weight="700" text-anchor="middle">'+esc(n[2])+'</text>'+
      '<text x="'+cx(p)+'" y="'+(p.y+47)+'" fill="'+c[2]+'" fill-opacity=".75" font-size="11.5" text-anchor="middle">'+esc(n[3])+'</text>';}
  $('flowsvg').innerHTML=s+labels+'</svg>';
}
function showView(v){for(const [k,b] of [['home','vhome'],['flow','vflow'],['db','vdb']]){$('v-'+k).hidden=k!==v;$(b).classList.toggle('pri',k===v);}
  history.replaceState(null,'',v==='home'?location.pathname:'#'+v);if(v==='db'&&!$('dbsvg').firstChild)loadDB();if(v==='flow'&&!$('flowsvg').firstChild){drawFlow();fetch('/admin/flow.html',{cache:'no-store'}).then(r=>{if(r.status===200){$('flowframe').src='/admin/flow.html';$('flowarch').hidden=false;$('flowsvg').hidden=true;}}).catch(()=>{});}}
$('flowtoggle').onclick=()=>{const s=$('flowsvg');s.hidden=!s.hidden;$('flowtoggle').textContent=s.hidden?'간단 그림 보기':'간단 그림 숨기기';};
$('vdb').onclick=()=>showView('db');$('vflow').onclick=()=>showView('flow');$('vhome').onclick=()=>showView('home');
if(location.hash==='#db'||location.hash==='#flow')showView(location.hash.slice(1));

</script><script src="/admin/pc.js"></script></body></html>`;
