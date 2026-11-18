/* ROUTE_V2 (구조화 C) — 주소를 '#/…' 대신 진짜 경로(/players/…)로 씀.
   앱 안의 화면 코드는 예전처럼 '#/…' 문자열로 주소를 만들고, 아래 함수들이 진짜 경로로 바꿔 줌.
   예전 '#/…' 북마크·공유 주소는 처음 열 때 진짜 경로로 바뀜. */
const routeH=()=>'#'+location.pathname+location.search;
function routePath(x){x=String(x==null?'':x);if(x.startsWith('#'))x=x.slice(1);if(!x.startsWith('/'))x='/'+x;return x;}
function routeRS(x){try{history.replaceState(null,'',routePath(x));}catch(e){}}
function routeGo(x,rep){const p=routePath(x);
  if(!rep&&p===location.pathname+location.search){window.dispatchEvent(new Event('hashchange'));return;}
  try{history[rep?'replaceState':'pushState'](null,'',p);}catch(e){location.href=p;return;}
  window.dispatchEvent(new Event('hashchange'));}
if(location.hash.startsWith('#/'))routeRS(location.hash);
window.addEventListener('popstate',()=>window.dispatchEvent(new Event('hashchange')));
const ROUTE_INT=/^\/(?!d\/|k\/|g\/|gr\/|api\/|kifu|admin|robots|favicon|icon-|apple-|site\.)/;
['mousedown','focusin','contextmenu','touchstart'].forEach(ev=>document.addEventListener(ev,e=>{const a=e.target&&e.target.closest&&e.target.closest('a[href^="#/"]');if(a)a.setAttribute('href',routePath(a.getAttribute('href')));},{capture:true,passive:true}));
document.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a||(a.target&&a.target!=='_self')||a.hasAttribute('download'))return;
  let h=a.getAttribute('href');if(h.startsWith('#/'))h=routePath(h);else if(!ROUTE_INT.test(h))return;
  e.preventDefault();routeGo(h);});

(function(){
'use strict';
const X=window.DATA;
const {P,N,NK,T,TC,TG,TS,G,GP,CATS,R,RP,RJ,D,TT,W,L,RR,CH,WR,WS,LEG,META}=X;const OF=X.OF||[],NC=X.NC||[],KR=X.KR||{},KO=X.KO||{},GR=X.GR||null;
/* ---------- basics ---------- */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n==null||isNaN(n)?'–':Number(n).toLocaleString('ko-KR');
const pct=(a,b)=>b?(a/b*100).toFixed(1)+'%':'–';
const dstr=d=>{const s=String(d);return s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8);};
const ymstr=ym=>{const s=String(ym);return s.slice(0,4)+'.'+s.slice(4,6);};
const calc=(tip,txt='계산값')=>`<span class="calc" title="${esc(tip)}">${txt}</span>`;
const cov=p=>`<span class="cov">채움 ${p}</span>`;
const CODE={'세계기전':'W','국내기전':'M','리그':'L','협회리그':'A','해외리그':'O','기타':'U','중국기전':'C','일본기전':'J','대만기전':'T'};
const CLABEL={'세계기전':'세계기전','국내기전':'국내기전','리그':'리그','협회리그':'협회리그','해외리그':'해외리그','기타':'기타/미분류','중국기전':'중국기전','일본기전':'일본기전','대만기전':'대만기전'};
const badge=c=>`<span class="badge b-${CODE[c]}">${CLABEL[c]}</span>`;
const SPLIT=c=>c==='세계기전'?'세계':c==='국내기전'?'국내':(c==='리그'||c==='협회리그'||c==='해외리그')?'리그':'미분류';
const STAGE=['예선','본선','8강','4강','결승'];
const WT=['불계승','집승','기권승','시간승','기타'];
const kst=()=>{const n=new Date(Date.now()+9*3600e3);return {y:n.getUTCFullYear(),m:n.getUTCMonth()+1,d:n.getUTCDate()};};
const store={get(k,def){try{const v=localStorage.getItem(k);return v==null?def:JSON.parse(v);}catch(e){return def;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};

/* ---------- players / keys ---------- */
const PBY={};P.forEach((p,i)=>{p.i=i;if(p.dn){p.n0=p.n;p.n=p.dn;}PBY[p.k]=p;});P.forEach(p=>(p.alias||[]).forEach(a=>{if(!PBY[a])PBY[a]=p;}));
const KEYN=N.map((n,i)=>NK[i]||('n:'+n));
const KNAME={};
const nameOf=k=>{const p=PBY[k];if(p){if(p.dn)return p.n;if(p.c!=='한국'&&KNAME[k])return KNAME[k].replace(/\((국내|자국|객원|부전)\)/,'');return p.n;}if(KNAME[k])return KNAME[k];return k.startsWith('n:')?k.slice(2):k;};
/* ---------- games ---------- */
/* INIT_FAST_V1: 대국 31만여 건을 한 번만 훑으면서 GAMES·BYK·연도·이름 표기를 함께 만듦(예전엔 네 번 훑음) */
const GAMES=new Array(D.length);
const BYK={},_YS=new Set(),_NL=new Int32Array(N.length).fill(-1),_ofn=OF.length>0;
for(let i=0;i<D.length;i++){
  const t=TT[i],r=RR[i],wi=W[i],li=L[i],wk=KEYN[wi],lk=KEYN[li];
  const y=(D[i]/10000)|0;let rp=RP[r];if(y<2021&&rp[0])rp=[0,rp[1],rp[2],rp[3]];
  const g={i,d:D[i],y,ti:t,g:TG[t],c:CATS[TC[t]],s:TS[t],wk,lk,wn:N[wi],ln:N[li],r:rp,rs:R[r],j:RJ[r],of:_ofn?OF[i]:1,wc:NC[wi]||'',lc:NC[li]||''};
  GAMES[i]=g;_NL[wi]=2*i;_NL[li]=2*i+1;_YS.add(y);
  const bw=BYK[wk];if(bw)bw.push(g);else BYK[wk]=[g];
  if(lk!==wk){const bl=BYK[lk];if(bl)bl.push(g);else BYK[lk]=[g];}
}
// 이름 표기: 기사마다 쓰인 모든 표기(KALL)와, 가장 최근 대국의 표기(KNAME, 예전과 같은 순서 규칙)
const KALL={};{const _o=[];for(let j=0;j<N.length;j++)if(_NL[j]>=0)_o.push(j);_o.sort((a,b)=>_NL[a]-_NL[b]);
  for(const j of _o){const k=KEYN[j];KNAME[k]=N[j];(KALL[k]||(KALL[k]=new Set())).add(N[j]);}}
if(X.DX&&X.DX.xn)for(const k in X.DX.xn)if(!KNAME[k])KNAME[k]=X.DX.xn[k];   // 이 사이트에 대국 기록이 없는 일본·중국 옛 기사의 한글 표기
const YEARS=[..._YS].sort((a,b)=>a-b);
/* 기록 범위 SCOPE_V2: kr = 한국기원 기록(OF 0·1)만, cn/jp/tw = 모든 기록(중국바둑협회 OF 2 · 일본 OF 3 · 대만 OF 4 포함) · 순위표는 그 나라 기사 */
const GK=GAMES.filter(g=>g.of<2);
const SCOPES=[['kr','🇰🇷 한국 기사','한국','한국기원 기록으로 집계'],['cn','🇨🇳 중국 기사','중국','중국바둑협회 기록(중국 기사끼리 둔 대국)까지 합쳐 집계'],['jp','🇯🇵 일본 기사','일본','일본 기사끼리 둔 대국(일본기원 결과·go4go)까지 합쳐 집계'],['tw','🇹🇼 대만 기사','대만','대만 기사끼리 둔 대국까지 합쳐 집계']];
let SCOPE=(()=>{try{const v=localStorage.getItem('scope');return SCOPES.some(x=>x[0]===v)?v:'kr';}catch(e){return 'kr';}})();
let GSC=SCOPE==='kr'?GK:GAMES;
const SCOPE_C=()=>(SCOPES.find(x=>x[0]===SCOPE)||SCOPES[0])[2];
const inSC=k=>((PBY[k]||{}).c||'')===SCOPE_C();
const SRCB={2:['中','중국바둑협회 기록'],3:['日','일본 기사끼리 — 고레이팅(일본기원 결과·go4go)'],4:['臺','대만 기사끼리 — 고레이팅(go4go)']};
function setScope(s){SCOPE=SCOPES.some(x=>x[0]===s)?s:'kr';try{localStorage.setItem('scope',SCOPE);}catch(e){}GSC=SCOPE==='kr'?GK:GAMES;YAGG=null;RECS=null;BH=null;for(const k in SZS)delete SZS[k];AGEC={};['pairs','ups','fin','ms'].forEach(k=>delete FX[k]);buildYR();
  const h=routeH().replace(/([?&])c=[^&]*&?/,'$1').replace(/[?&]$/,'');if(h!==routeH())routeRS(h||'#/');route();}
document.addEventListener('click',e=>{const b=e.target.closest('.scopebar [data-sc]');if(b)setScope(b.dataset.sc);});
function scopeBar(){const cur=SCOPES.find(x=>x[0]===SCOPE)||SCOPES[0];return `<div class="scopebar" role="radiogroup" aria-label="기록 범위"><span class="l">기록 범위</span>${SCOPES.map(([v,l,,s])=>`<button type="button" role="radio" aria-checked="${SCOPE===v}" class="${SCOPE===v?'on':''}" data-sc="${v}" title="${s}">${l}</button>`).join('')}<span class="d">${cur[2]} 기사 순위 · ${cur[3]}</span></div>`;}
const LASTD=D[D.length-1];
/* champions */
const CHAMP=CH.map(c=>({g:c[0],ed:c[1],d:c[2],ck:c[3]>=0?KEYN[c[3]]:null,rk:c[4]>=0?KEYN[c[4]]:null,st:c[5],gi:c[6]}));
const CHB={};CHAMP.forEach(c=>{if(c.st===0){(CHB[c.ck]=CHB[c.ck]||[]).push(c);}});
const RUB={};CHAMP.forEach(c=>{if(c.st===0&&c.rk){(RUB[c.rk]=RUB[c.rk]||[]).push(c);}});
const CHG={};CHAMP.forEach(c=>{(CHG[c.g]=CHG[c.g]||[]).push(c);});
/* per-key quick record */
const RECC={};
/* 통산 전적: 한국기원 기사 코드가 있는 기사는 기록실과 같은 기준(그 코드로 기록된 공식 대국)으로 셈.
   j: 1 무승부, 2 무효, 3 양자패(한국기원 집계상 두 기사 모두 패) */
function cntRec(a,k){let w=0,l=0,dr=0,v=0;for(const g of a){if(g.j===1)dr++;else if(g.j===2)v++;else if(g.j===3)l++;else if(g.wk===k)w++;else l++;}return {g:a.length,w,l,dr,v};}
function rec(k){
  if(RECC[k])return RECC[k];
  const gs=BYK[k]||[];const all=cntRec(gs,k);
  const coded=gs.filter(g=>(g.wk===k&&g.wc===k)||(g.lk===k&&g.lc===k));
  let r;
  const kt=META.kba&&META.kba.kt?META.kba.kt[k]:null;
  if(kt)r={g:kt[0],w:kt[1],dr:kt[2],l:kt[3],v:kt[4],off:true,un:kt[5]};   // 한국기원 기록실 표시값 그대로
  else if(coded.length){const off=coded.filter(g=>g.of===1);r=Object.assign(cntRec(off,k),{off:true,un:coded.length-off.length});}
  else r=Object.assign({},all,{off:false,un:gs.filter(g=>g.of===0).length});
  r.all=all;r.first=gs.length?gs[0].d:null;r.last=gs.length?gs[gs.length-1].d:null;
  return RECC[k]=r;
}
const wpct=r=>pct(r.w,r.w+r.l);
/* display helpers */
const isNK=k=>k.startsWith('n:');
const altNames=p=>{const nz=x=>x.replace(/\((국내|자국|객원|부전)\)/,'').replace(/\(.*?\)$/,'').replace(/\s/g,'');const me=nz(p.n);const o=[...new Set([...(KALL[p.k]||[])].map(x=>x.replace(/\((국내|자국|객원|부전)\)/,'').trim()).filter(x=>nz(x)!==me))].slice(0,3);const out=[];if(p.n0&&p.c!=='한국'&&/^[가-힣]+$/.test(p.n0)&&nz(p.n0)!==me&&!o.includes(p.n0)&&['중국','일본','대만'].includes(p.c)&&!/^(1|2)\d{7}$/.test(p.k))out.push('한자음 '+p.n0);if(o.length)out.push('기록 표기 '+o.join(', '));return out.join(' · ');};
const nkLabel=k=>k.includes('(챌린지)')?'팀(릴레이 대국)':k.includes('(아마')?'아마추어':'한국기원 명단 외 기사';
const plink=(k,cls='')=>`<a class="pl ${cls} ${isNK(k)?'nk':''}" href="#/players/${encodeURIComponent(k)}">${esc(nameOf(k))}</a>`;
const resText=g=>{const [col,wt,mg,mv]=g.r;if(g.j)return esc(g.rs||'');return [mv?mv+'수':'',col===1?'흑':col===2?'백':'',(mg!=null?mg+'집승':WT[wt])].filter(Boolean).join(' ');};
const stone=g=>g.r[0]===1?'<span class="stone b" aria-label="흑"></span>':g.r[0]===2?'<span class="stone w" aria-label="백"></span>':'';
const h2hCount=(a,b)=>{const ga=BYK[a]||[],gb=BYK[b]||[];const src=ga.length<gb.length?ga:gb;let x=0,y=0;for(const g of src){if(g.j)continue;if(g.wk===a&&g.lk===b)x++;else if(g.wk===b&&g.lk===a)y++;}return [x,y];};
const h2hBadge=(a,b)=>{const [x,y]=h2hCount(a,b);return `<a class="h2hb" href="#/players/compare?p1=${encodeURIComponent(a)}&p2=${encodeURIComponent(b)}" title="두 기사의 통산 맞대결(무승부·무효 제외)">통산 ${x}:${y}</a>`;};
const initial=n=>(n||'?').replace(/\(.*?\)/,'').trim().slice(0,1);
function photo(p,name){
  if(p&&p.ph)return `<img src="${esc(p.ph)}"${p.ph0?` data-fb="${esc(p.ph0)}"`:''} alt="${esc(p.n)} 사진" loading="lazy" referrerpolicy="no-referrer" data-ini="${esc(initial(p.n))}">`;
  return `<span class="ini" aria-hidden="true">${esc(initial(p?p.n:name))}</span>`;
}
document.addEventListener('error',e=>{const t=e.target;if(t.tagName==='IMG'&&t.dataset.fb){t.src=t.dataset.fb;t.removeAttribute('data-fb');return;}if(t.tagName==='IMG'&&t.dataset.ini!=null){const s=document.createElement('span');s.className='ini';s.textContent=t.dataset.ini;t.replaceWith(s);}},true);
function ageAt(birth,d){if(!birth)return null;const b=birth.split('-').map(Number);if(!b[0])return null;const y=(d/10000)|0,m=((d/100)|0)%100,dd=d%100;let a=y-b[0];if(m<(b[1]||1)||(m===(b[1]||1)&&dd<(b[2]||1)))a--;return a;}
const nowD=()=>{const t=kst();return t.y*10000+t.m*100+t.d;};
const ageNow=b=>ageAt(b,nowD());
const gname=g=>G[g];
/* WHR helpers */
const ws=k=>WS[k]||null;
function whrAt(k,ym){const c=WR[k];if(!c)return null;let lo=0,hi=c.length-1,ans=null;while(lo<=hi){const m=(lo+hi)>>1;if(c[m][0]<=ym){ans=c[m];lo=m+1;}else hi=m-1;}return ans;}
const ymOf=d=>(d/100)|0;
const RANK_MIN=META.whr.min_games, UNC_MAX=META.whr.max_unc;
function eligible(k,asOfYm){const s=ws(k);if(!s)return false;if(s[7]<RANK_MIN)return false;return true;}

/* ---------- charts ---------- */
let charts=[];
const killCharts=()=>{charts.forEach(c=>{try{c.destroy();}catch(e){}});charts=[];};
const cssv=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function mkChart(id,cfg){const el=document.getElementById(id);if(!el)return null;if(!window.Chart){el.parentElement.innerHTML='<div class="empty">일시적으로 차트를 불러오지 못했습니다. 새로고침해 주세요.</div>';return null;}
  Chart.defaults.color=cssv('--muted-2');Chart.defaults.font.family='"Inter","IBM Plex Sans KR",sans-serif';Chart.defaults.font.size=12;Chart.defaults.plugins.legend.labels.boxWidth=10;Chart.defaults.borderColor=cssv('--rule-2');
  const c=new Chart(el,cfg);charts.push(c);return c;}
const gridY=()=>({grid:{color:cssv('--rule-2')},border:{display:false},ticks:{precision:0}});
const noGrid=()=>({grid:{display:false},border:{color:cssv('--ink')}});
const CAT_VAR={'국내기전':'--cat1','세계기전':'--cat2','리그':'--cat3','협회리그':'--cat4','해외리그':'--cat5','기타':'--cat6'};const CAT_COLOR=new Proxy({},{get:(t,c)=>cssv(CAT_VAR[c]||'--cat6')});

/* ---------- favourites ---------- */
const favs=()=>store.get('bdb-fav',[]);
const isFav=k=>favs().includes(k);
function toggleFav(k){const f=favs();const i=f.indexOf(k);if(i>=0)f.splice(i,1);else f.unshift(k);store.set('bdb-fav',f.slice(0,50));return i<0;}
document.getElementById('favbtn').onclick=e=>{
  const pop=document.getElementById('favpop');if(!pop.hidden){pop.hidden=true;return;}
  const f=favs();
  pop.innerHTML=`<div class="favbox">${f.length?f.map(k=>k.startsWith('t:')?`<div style="padding:4px 0"><a class="pl" href="#/tournaments/${k.slice(2)}">${esc(G[+k.slice(2)])}</a> <span class="muted small">대회</span></div>`:`<div style="padding:4px 0">${plink(k)}</div>`).join(''):'즐겨찾기한 기사가 없습니다.'}<div class="note">이 브라우저에만 저장됩니다. 다른 기기·브라우저와는 동기화되지 않습니다.</div></div>`;
  pop.hidden=false;
};
document.addEventListener('click',e=>{const pop=document.getElementById('favpop');if(!pop.hidden&&!e.target.closest('#favpop')&&e.target.id!=='favbtn')pop.hidden=true;});
/* ---------- theme ---------- */
(function(){const t=store.get('bdb-theme-b','light');document.documentElement.dataset.theme=t;
  document.getElementById('themebtn').onclick=()=>{const cur=document.documentElement.dataset.theme||'light';const nx=cur==='dark'?'light':'dark';document.documentElement.dataset.theme=nx;store.set('bdb-theme-b',nx);route();};})();

(function(){const el=document.getElementById('mdate');if(!el)return;const k=kst(),wd=['일','월','화','수','목','금','토'][new Date(Date.UTC(k.y,k.m-1,k.d)).getUTCDay()];const d=String(LASTD);const ds=`${k.y}년 ${k.m}월 ${k.d}일 ${wd}요일 · ${+d.slice(4,6)}월 ${+d.slice(6)}일 대국까지`;el.textContent=ds;const ap=document.getElementById('app');const sync=()=>{const c=ap.querySelector('.crumb');if(c){el.innerHTML='<div class="mcrumb" role="navigation" aria-label="현재 위치">'+c.innerHTML+'</div>';c.remove();}else if(!ap.querySelector('.crumb')&&!el.dataset.keep){}};new MutationObserver(()=>{if(ap.querySelector('.crumb'))sync();}).observe(ap,{childList:true,subtree:true});window.addEventListener('hashchange',()=>{el.textContent=ds;setTimeout(()=>{if(ap.querySelector('.crumb'))sync();},0);});sync();})();
/* ---------- quick search ---------- */
const QS=[];
P.forEach(p=>QS.push({k:p.k,label:p.n,sub:[p.hn,p.en,p.c].filter(Boolean).join(' · '),hay:(p.n+' '+p.n.replace(/\s/g,'')+' '+(p.n0||'')+' '+(p.hn||'')+' '+(p.en||'')+' '+[...(KALL[p.k]||[])].join(' ')).toLowerCase(),href:'#/players/'+encodeURIComponent(p.k)}));
Object.keys(BYK).filter(isNK).forEach(k=>QS.push({k,label:k.slice(2),sub:nkLabel(k),hay:k.slice(2).toLowerCase(),href:'#/players/'+encodeURIComponent(k)}));
G.forEach((g,i)=>QS.push({k:'t:'+i,label:g,sub:'대회',hay:g.toLowerCase(),href:'#/tournaments/'+i}));
(function(){const inp=document.getElementById('qsi'),box=document.getElementById('qsl');let tmr,sel=-1,items=[];
  const draw=()=>{box.innerHTML=items.map((x,i)=>`<a href="${x.href}" class="${i===sel?'on':''}">${esc(x.label)}<span>${esc(x.sub)}</span></a>`).join('')||'<div style="padding:8px 10px" class="muted small">일치하는 기사·대회가 없습니다</div>';box.hidden=false;};
  inp.addEventListener('input',()=>{clearTimeout(tmr);tmr=setTimeout(()=>{const q=inp.value.trim().toLowerCase();if(!q){box.hidden=true;return;}
    items=QS.filter(x=>x.hay.includes(q)).sort((a,b)=>(a.label.toLowerCase().startsWith(q)?0:1)-(b.label.toLowerCase().startsWith(q)?0:1)||(rec(b.k).g||0)-(rec(a.k).g||0)).slice(0,12);sel=-1;draw();},250);});
  inp.addEventListener('keydown',e=>{if(box.hidden)return;if(e.key==='ArrowDown'){sel=Math.min(items.length-1,sel+1);draw();e.preventDefault();}else if(e.key==='ArrowUp'){sel=Math.max(0,sel-1);draw();e.preventDefault();}else if(e.key==='Enter'){const x=items[Math.max(0,sel)];if(x){routeGo(x.href);box.hidden=true;inp.value='';}}else if(e.key==='Escape'){box.hidden=true;}});
  document.addEventListener('click',e=>{if(!e.target.closest('.qs'))box.hidden=true;});
  box.addEventListener('click',()=>{box.hidden=true;inp.value='';});})();

/* ---------- shared UI ---------- */
const app=document.getElementById('app');
const crumb=parts=>`<div class="crumb">${parts.map(([l,h])=>h?`<a href="${h}">${esc(l)}</a>`:esc(l)).join(' <span class="sep">&gt;</span> ')}</div>`;
function rankList(arr,max,valFmt=v=>v,sub){
  if(!arr.length)return '<div class="empty">표시할 기록이 없습니다</div>';
  const top=arr[0][1]||1;
  return arr.slice(0,max).map(([k,v],i)=>`<div class="rk"><span class="i">${i+1}</span><span class="nm">${plink(k)}${sub?`<small>${esc(sub(k)||'')}</small>`:''}</span><span class="bar"><i style="width:${Math.max(0,v)/top*100}%"></i></span><span class="v">${valFmt(v)}</span></div>`).join('');
}
function pagedTable(holder,rows,head,rowFn,per=50,opts={}){
  let page=0;const pages=Math.max(1,Math.ceil(rows.length/per));
  const draw=()=>{holder.innerHTML=`<div class="tw ${opts.sticky?'sticky':''}"><table${opts.colw?` class="fx" style="min-width:${opts.minw||0}px"`:''}>${opts.colw?`<colgroup>${opts.colw.map(w=>`<col${w?` style="width:${w}px"`:''}>`).join('')}</colgroup>`:''}<thead><tr>${head.map((h,i)=>`<th scope="col" class="${opts.thcls?opts.thcls[i]:''}">${h}</th>`).join('')}</tr></thead><tbody>${rowFn(rows.slice(page*per,(page+1)*per))}</tbody></table></div>`+
    (pages>1?`<div class="pager"><span>${fmt(rows.length)}건 중 ${fmt(page*per+1)}–${fmt(Math.min(rows.length,(page+1)*per))}</span><span><button data-p="-1" ${page===0?'disabled':''}>이전</button> <span style="margin:0 8px">${page+1} / ${pages}</span> <button data-p="1" ${page>=pages-1?'disabled':''}>다음</button></span></div>`:'');
    holder.querySelectorAll('.pager button').forEach(b=>b.onclick=()=>{page+=+b.dataset.p;draw();holder.scrollIntoView({block:'start'});});
    {const tr=holder.querySelector('tbody tr'),ths=holder.querySelectorAll('thead th');if(tr)[...tr.children].forEach((td,i)=>{if(ths[i]&&td.classList.contains('r'))ths[i].classList.add('r');});}};
  if(!rows.length){holder.innerHTML=`<div class="empty">${opts.empty||'조건에 맞는 대국이 없습니다'}</div>`;return;}
  draw();
}
function gameRows(gs,me,showWhr){
  return gs.map(g=>{
    if(me){const won=g.wk===me;const opp=won?g.lk:g.wk;const res=g.j===1?'<span class="rd">무</span>':g.j===2?'<span class="rd">무효</span>':g.j===3?'<span class="rl" title="양자패 — 한국기원 집계상 두 기사 모두 패">양패</span>':won?'<span class="rw">승</span>':'<span class="rl">패</span>';
      let ow='';if(showWhr){const r=whrAt(opp,ymOf(g.d));ow=`<td class="n">${r?fmt(r[1]):'<span class="muted small">점수 없음</span>'}</td>`;}
      return `<tr><td class="d">${dstr(g.d)}</td><td>${res}</td><td>${plink(opp)}</td>${ow}<td class="tname" title="${esc(T[g.ti])}${g.of===0?' — 한국기원 비공식 대국':''}">${g.of===0?'<span class="unof">비공식</span>':SRCB[g.of]?`<span class="unof cnsrc" title="${SRCB[g.of][1]}">${SRCB[g.of][0]}</span>`:''}${esc(T[g.ti])}</td><td class="n"><a class="glink" href="#/games/g/${g.i}">${stone(g)}${resText(g)}</a>${kfBtn(g)}</td></tr>`;}
    return `<tr><td class="d">${dstr(g.d)}</td><td>${badge(g.c)}</td><td class="tname" title="${esc(T[g.ti])}${g.of===0?' — 한국기원 비공식 대국':''}">${g.of===0?'<span class="unof">비공식</span>':SRCB[g.of]?`<span class="unof cnsrc" title="${SRCB[g.of][1]}">${SRCB[g.of][0]}</span>`:''}${esc(T[g.ti])}</td><td>${plink(g.wk,'w')}${g.j?` <span class="rd small">${g.j===1?'무승부':g.j===3?'양패':'무효'}</span>`:''}</td><td>${plink(g.lk)}</td><td class="n"><a class="glink" href="#/games/g/${g.i}">${stone(g)}${resText(g)}</a>${kfBtn(g)}</td></tr>`;
  }).join('');
}
const GAME_HEAD=['날짜','분류','대회','승(앞)','패(뒤)','내용'];
/* streaks for a key (skip draws/voids) */
function streaks(k){
  const gs=BYK[k]||[];let cw=0,cl=0,bw=0,bl=0,bwS=null,bwE=null,blS=null,blE=null,sW=null,sL=null;
  for(const g of gs){if(g.j)continue;if(g.wk===k){if(cw===0)sW=g.d;cw++;cl=0;if(cw>bw){bw=cw;bwS=sW;bwE=g.d;}}else{if(cl===0)sL=g.d;cl++;cw=0;if(cl>bl){bl=cl;blS=sL;blE=g.d;}}}
  return {bw,bwS,bwE,bl,blS,blE,cur:cw?['연승',cw]:cl?['연패',cl]:['',0]};
}

/* ---------- scoreboard strip ---------- */
function renderBoard(){
  const el=document.getElementById('board');if(!el)return;
  const last=GK.slice(-18).reverse();const d0=last.length?last[0].d:LASTD;
  const cells=last.map((g,i)=>{const nd=i&&g.d!==last[i-1].d?`<div class="lbl sm"><b>${dstr(g.d).slice(5).replace('-','.')}</b></div>`:'';
    return nd+`<a class="sb" href="#/players/compare?p1=${encodeURIComponent(g.wk)}&p2=${encodeURIComponent(g.lk)}" title="${esc(T[g.ti])}"><div class="t">${esc(T[g.ti])}</div><div class="r w"><span>${esc(nameOf(g.wk))}</span><small>${g.j?'무':'승'}</small></div><div class="r l"><span>${esc(nameOf(g.lk))}</span><small>${g.j?'':resText(g).replace(/^\d+수 /,'')}</small></div></a>`;}).join('');
  el.innerHTML=`<div class="in"><div class="lbl"><b>최근 결과</b>${dstr(d0).replace(/-/g,'.')}<a href="#/games">전체 보기 ›</a></div>${cells}</div>`;
}
/* movement: rank now vs rank N months before */
let RANKCACHE={};
function rankAt(ym){
  if(RANKCACHE[ym])return RANKCACHE[ym];
  const rows=[];
  for(const k in WS){const s=WS[k];if(s[7]<RANK_MIN)continue;const w=whrAt(k,ym);if(!w)continue;if((ym/100|0)-(w[0]/100|0)>=META.active_window)continue;if(w[2]>UNC_MAX)continue;rows.push([k,w[1]]);}
  rows.sort((a,b)=>b[1]-a[1]);const m={};rows.forEach(([k],i)=>m[k]=i+1);return RANKCACHE[ym]=m;
}
const mvHtml=(now,prev)=>prev==null?'<span class="mv new">NEW</span>':now<prev?`<span class="mv up">▲${prev-now}</span>`:now>prev?`<span class="mv dn">▼${now-prev}</span>`:'<span class="mv">–</span>';

(function(){const m=document.querySelector('.gnav .more');if(!m)return;const b=m.querySelector('button'),d=m.querySelector('.dd');
const place=()=>{if(getComputedStyle(d).position!=='fixed'){d.style.left='';d.style.top='';return;}const r=b.getBoundingClientRect();const w=Math.max(170,d.offsetWidth||170);d.style.top=r.bottom+'px';d.style.left=Math.max(8,Math.min(r.left,window.innerWidth-w-8))+'px';};
const open=()=>{m.classList.add('open');place();b.setAttribute('aria-expanded','true');};const close=()=>{m.classList.remove('open');b.setAttribute('aria-expanded','false');};
const hov=matchMedia('(hover:hover)').matches;let ot=0;b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(m.classList.contains('open')&&Date.now()-ot>400)close();else open();});
if(hov){let t;m.addEventListener('mouseenter',()=>{clearTimeout(t);if(!m.classList.contains('open')){ot=Date.now();open();}});m.addEventListener('mouseleave',()=>{t=setTimeout(close,180);});d.addEventListener('mouseenter',()=>clearTimeout(t));d.addEventListener('mouseleave',()=>{t=setTimeout(close,180);});}
document.addEventListener('click',e=>{if(!e.target.closest('.gnav .more'))close();});d.addEventListener('click',close);
window.addEventListener('hashchange',close);window.addEventListener('resize',()=>{if(m.classList.contains('open'))place();});
document.querySelector('#nav').addEventListener('scroll',()=>{if(m.classList.contains('open'))place();},{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});})();

/* ---------- country flags (inline SVG; Windows에서 국기 이모지가 안 보여서 직접 그림) ---------- */
const FLAG=(()=>{
  const star=(cx,cy,r,rot=0)=>{let d='';for(let i=0;i<10;i++){const a=(rot-90+i*36)*Math.PI/180,rr=i%2?r*0.382:r;d+=(i?'L':'M')+(cx+rr*Math.cos(a)).toFixed(2)+' '+(cy+rr*Math.sin(a)).toFixed(2);}return `<path d="${d}Z"/>`;};
  const bars=(o)=>`<path d="M-6 ${o}h12v2h-12zM-6 ${o+3}h12v2h-12zM-6 ${o+6}h12v2h-12z"/>`;
  const kr=`<svg viewBox="-36 -24 72 48" aria-hidden="true"><rect x="-36" y="-24" width="72" height="48" fill="#fff"/><g transform="rotate(-56.31)">${bars(-26)}${bars(18)}<path stroke="#fff" stroke-width="1" d="M0 17v10"/><path fill="#cd2e3a" d="M0-12A12 12 0 0 1 0 12z"/><path fill="#0047a0" d="M0-12A12 12 0 0 0 0 12 6 6 0 0 0 0 0z"/><circle cy="-6" fill="#cd2e3a" r="6"/></g><g transform="rotate(-123.69)">${bars(-26)}${bars(18)}<path stroke="#fff" stroke-width="1" d="M0-23.5v3M0 17v3.5M0 23.5v3"/></g></svg>`;
  const cn=`<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#ee1c25"/><g fill="#ffde00">${star(5,5,3)}${star(10,2,1,23)}${star(12,4,1,46)}${star(12,7,1,70)}${star(10,9,1,21)}</g></svg>`;
  const jp=`<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#bc002d"/></svg>`;
  const tw=`<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#fe0000"/><rect width="15" height="10" fill="#000095"/><g fill="#fff">${star(7.5,5,3.6)}</g><circle cx="7.5" cy="5" r="1.9" fill="#000095"/><circle cx="7.5" cy="5" r="1.5" fill="#fff"/></svg>`;
  return {'한국':kr,'중국':cn,'일본':jp,'대만':tw};
})();
const flag=c=>FLAG[c]?`<span class="flag" title="${c}">${FLAG[c]}</span>`:'';
const cflag=c=>c?(FLAG[c]?`<span class="cty">${flag(c)}<span class="sr">${esc(c)}</span></span>`:`<span class="cty">${esc(c)}</span>`):'';

/* =============== HOME =============== */
function heroSearch(){const f=document.getElementById('hqf'),inp=document.getElementById('hqs'),box=document.getElementById('hqsl');if(!f)return;let tmr,items=[],sel=-1;
  const draw=()=>{box.innerHTML=items.map((x,i)=>`<a href="${x.href}" class="${i===sel?'on':''}">${esc(x.label)}<span>${esc(x.sub)}</span></a>`).join('')||'<div style="padding:8px 10px" class="muted small">일치하는 기사·대회가 없습니다</div>';box.hidden=false;};
  const find=()=>{const q=inp.value.trim().toLowerCase();if(!q){items=[];box.hidden=true;return;}items=QS.filter(x=>x.hay.includes(q)).sort((a,b)=>(a.label.toLowerCase().startsWith(q)?0:1)-(b.label.toLowerCase().startsWith(q)?0:1)||(rec(b.k).g||0)-(rec(a.k).g||0)).slice(0,10);sel=-1;draw();};
  inp.addEventListener('input',()=>{clearTimeout(tmr);tmr=setTimeout(find,250);});
  inp.addEventListener('keydown',e=>{if(box.hidden)return;if(e.key==='ArrowDown'){sel=Math.min(items.length-1,sel+1);draw();e.preventDefault();}else if(e.key==='ArrowUp'){sel=Math.max(0,sel-1);draw();e.preventDefault();}else if(e.key==='Escape')box.hidden=true;});
  f.addEventListener('submit',e=>{e.preventDefault();clearTimeout(tmr);find();const x=items[Math.max(0,sel)];if(x){routeGo(x.href);}});
  document.addEventListener('click',e=>{if(!e.target.closest('#hqf'))box.hidden=true;},{once:false});}
function currentTop(filter,n){
  const out=[];for(const k in WS){const s=WS[k];if(s[7]<RANK_MIN)continue;if(s[1]>UNC_MAX)continue;const lastY=(s[2]/100)|0;if(lastY<META.active_since_year)continue;if(filter&&!filter(k))continue;out.push([k,s[0]]);}
  return out.sort((a,b)=>b[1]-a[1]).slice(0,n);
}
function pHome(){
  const t=kst();const mmdd=String(t.m).padStart(2,'0')+'-'+String(t.d).padStart(2,'0');
  const bday=P.filter(p=>p.b&&p.b.slice(5)===mmdd&&(p.st||'').includes('현역'));
  const yr=YEARS[YEARS.length-1];const A=yaggY(yr)||{w:{},n:{}};
  const champTop=Object.entries(CHB).map(([k,v])=>[k,v.length]).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const yChamps=CHAMP.filter(c=>c.st===0&&((c.d/10000)|0)===yr).sort((a,b)=>b.d-a.d).slice(0,6);
  const rPrev=rankAt((LASTD/100|0)-100);
  const top=currentTop(null,10),topW=currentTop(k=>(PBY[k]||{}).g==='여자',5);
  const wins=Object.entries(A.w).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const season=Object.keys(A.n).map(k=>{const w=A.w[k]||0,n=A.n[k];return {k,w,l:n-w,n,p:w/n};}).filter(x=>x.n>=10).sort((a,b)=>b.w-a.w||b.p-a.p).slice(0,10);
  season.forEach(x=>{x.cur=streaks(x.k).cur;});   // 연승·연패는 보여 줄 10명만 계산
  // 뉴스: 사진 있는 기사 → 톱 기사 1 + 작은 기사 3, 나머지는 헤드라인
  const pic=[],seen=new Set();
  for(const n of NEWSL){if(n.s==='ggl'||!n.img)continue;if(seen.has(n.s)&&pic.length<3)continue;seen.add(n.s);pic.push(n);if(pic.length>=4)break;}
  const recentG=GK.filter(g=>!g.j).slice(-40).reverse();
  const heads=NEWSL.filter(n=>!pic.includes(n)).slice(0,30);
  const xf=(i,base)=>i>=base?' class="xf"':'';
  const grRows=(typeof GR!=='undefined'&&GR&&GR.rows)?GR.rows.slice(0,50):[];
  const lead=pic[0],subs=pic.slice(1);
  const nlink=(n,inner,cls='')=>`<a class="${cls}" href="${esc(n.u)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
  const card=(title,href,body,more)=>`<section class="ec"><header><h2>${title}</h2>${href?`<a href="${href}">${more||'전체 보기'}</a>`:''}</header>${body}</section>`;
  const rk=(rows,val,mv)=>`<ol class="erk">${rows.map((r,i)=>`<li><span class="i">${i+1}</span><span class="f">${flag((PBY[r[0]]||{}).c)||'<i></i>'}</span><span class="nm">${plink(r[0])}</span>${mv?mv(r,i):''}<span class="v">${val(r)}</span></li>`).join('')}</ol>`;
  const mv=(r,i)=>{const m=rPrev[r[0]];return `<span class="m">${m==null?'<span class="mv new">NEW</span>':m>i+1?`<span class="mv up">▲${m-i-1}</span>`:m<i+1?`<span class="mv dn">▼${i+1-m}</span>`:'<span class="mv">–</span>'}</span>`;};
  const links=[['#/players','기사 목록','👤'],['#/players/feed','기사 소식','🆕'],['#/rankings','랭킹','🏅'],['#/players/compare','상대전적','⚔'],['#/games','최근 대국','🗒'],['#/records','기록','📋'],['#/tournaments','대회','🏆'],['#/tournaments/intl','국제기전','🌏'],['#/tournaments/open','국내 종합기전','🗂'],['#/tournaments/women','여자기전','♛'],['#/tournaments/limited','제한기전','🎫'],['#/seasons/'+yr,yr+' 시즌','📅'],['#/games/calendar','대국 달력','🗓'],['#/games/search','조건 검색','🔎'],['#/news','뉴스','📰']];
  app.innerHTML=`<h1 class="sr">바둑DB 홈</h1>
  <div class="e3">
    <aside class="e3-l">
      ${card('바로 가기','','<nav class="eql">'+links.map(([h,l,ic])=>`<a href="${h}"><span class="ic" aria-hidden="true">${ic}</span>${l}</a>`).join('')+'</nav>')}
      ${card('실력 점수 순위','#/rankings/all',rk(top,r=>fmt(r[1]),mv)+'<p class="efoot">현역 · 이 사이트 계산값 · 화살표는 1년 전 대비</p>')}
      ${topW.length?card('여자 실력 점수','#/rankings/all?g=w',rk(topW,r=>fmt(r[1]))):''}
      ${grRows.length?card('고레이팅 세계 순위','#/rankings/goratings','<ol class="erk efill">'+grRows.map((r,i)=>`<li${xf(i,5)}><span class="i">${r[0]}</span><span class="f">${flag(GRCC[r[4]])||'<i></i>'}</span><span class="nm">${r[6]?plink(r[6]):esc(r[1])}</span><span class="v">${fmt(r[5])}</span></li>`).join('')+'</ol>'):''}
      ${(()=>{const b=fxToday();return b?card('오늘의 바둑사','',b):'';})()}
      ${bday.length?card('오늘 생일','','<ul class="ehl">'+bday.slice(0,8).map(p=>`<li>${plink(p.k)} <span class="s">${p.b.slice(0,4)}년생 · 만 ${ageNow(p.b)}세</span></li>`).join('')+'</ul>'):''}
    </aside>
    <div class="e3-c">
      ${NEWS_PENDING?nSkel(420,0):''}${lead&&!NEWS_PENDING?`<article class="etop">${nlink(lead,`<span class="img">${nImg(lead)}<span class="eph">${NSRC[lead.s][0]}</span></span>`,'eimg')}<div class="tx"><div class="meta">${nsBadge(lead.s)}<span>${dstr(lead.d).replace(/-/g,'.')}</span></div><h2>${nlink(lead,esc(nTitle(lead).t))}</h2>${lead.sm?`<p>${esc(lead.sm)}</p>`:''}</div></article>`:''}
      ${subs.length&&!NEWS_PENDING?`<div class="esubs">${subs.map(n=>nlink(n,`<span class="img">${nImg(n)}<span class="eph">${NSRC[n.s][0]}</span></span><span class="meta">${nsBadge(n.s)}<span>${nWhen(n.d)}</span></span><b>${esc(nTitle(n).t)}</b>`,'esub')).join('')}</div>`:''}
      ${homeHolders(card)}
      ${card(`${yr} 우승`,'#/tournaments','<div class="ech">'+(yChamps.length?yChamps.map(c=>`<a class="echc" href="#/tournaments/${c.g}"><span class="t">${esc(G[c.g])}</span><span class="ed">${esc(c.ed)} · ${dstr(c.d).slice(5).replace('-','.')}</span><span class="w">${flag((PBY[c.ck]||{}).c)} ${esc(nameOf(c.ck))}</span></a>`).join(''):'<div class="empty">올해 판정된 우승이 아직 없습니다</div>')+'</div>','대회 전체')}
      ${card(`${yr} 시즌 다승`,'#/seasons/'+yr,`<div class="tw"><table class="hseason"><thead><tr><th class="c">순위</th><th>기사</th><th class="r">대국</th><th class="r">승</th><th class="r">패</th><th class="r">승률</th><th>흐름</th><th class="r">실력 점수</th></tr></thead><tbody>${season.map((x,i)=>{const s=ws(x.k);return `<tr><td class="n c">${i+1}</td><td><span class="pfl">${flag((PBY[x.k]||{}).c)||'<i></i>'}</span>${plink(x.k)}</td><td class="n r">${x.n}</td><td class="n r"><b>${x.w}</b></td><td class="n r">${x.l}</td><td class="n r">${(x.p*100).toFixed(1)}%</td><td>${x.cur[1]?`<span class="${x.cur[0]==='연승'?'rw':'rl'}">${x.cur[1]}${x.cur[0]}</span>`:''}</td><td class="n r">${s?fmt(s[0]):dash}</td></tr>`;}).join('')}</tbody></table></div><p class="efoot">${yr}년 10국 이상 · 무승부·무효 제외</p>`,'시즌 전체')}
      ${card('최근 대국','#/games','<ul class="egm efill">'+recentG.map((g,i)=>`<li${xf(i,6)}><span class="d">${dstr(g.d).slice(5).replace('-','.')}</span><span class="t" title="${esc(T[g.ti])}">${esc(T[g.ti])}</span><span class="p">${stone(g)||'<span class="stone none"></span>'}<a href="#/players/${encodeURIComponent(g.wk)}">${esc(nameOf(g.wk))}</a><em>승</em><a class="l" href="#/players/${encodeURIComponent(g.lk)}">${esc(nameOf(g.lk))}</a></span><span class="r">${resText(g).replace(/^\d+수 /,"")}</span></li>`).join('')+'</ul>','대국 목록')}
    </div>
    <aside class="e3-r">
      ${NEWS_PENDING?card('헤드라인','#/news',nSkel(300,8),'뉴스 전체'):heads.length?card('헤드라인','#/news','<ul class="ehl ehn efill">'+heads.map((n,i)=>`<li${xf(i,8)}>${nlink(n,esc(nTitle(n).t))}</li>`).join('')+'</ul>','뉴스 전체'):''}
      ${card(`${yr} 다승`,'#/seasons/'+yr,rk(wins,r=>r[1]+'승'))}
      ${typeof IX!=='undefined'&&IX?card('메이저 국제기전 우승','#/tournaments/intl/players',rk(Object.entries(ixAgg()).filter(([,o])=>o.major).map(([k,o])=>[k,o.major,(ixMru(k)||[0])[0]]).sort((a,b)=>b[1]-a[1]||b[2]-a[2]).slice(0,8),r=>r[1]+'회')):''}
      ${card('통산 우승','#/records?by=titles',rk(champTop.slice(0,8),r=>r[1]+'회'))}
      ${card('최근 갱신','#/about/changelog','<ul class="ehl">'+META.changelog.slice(0,3).map(c=>`<li><span class="small">${esc(c[1])}</span><span class="s">${esc(c[0])}</span></li>`).join('')+'</ul>','갱신 이력')}
    </aside>
  </div>`;
  homeFill();setTimeout(homeFill,600);
}
// 홈: 지금 타이틀 보유자 (국내 종합 · 여자 · 국제 메이저, 진행 중인 기전의 가장 최근 우승자)
function homeHolders(card){
  const cols=[];
  if(typeof DX!=='undefined'&&DX){
    for(const [sec,lbl,grp] of [['open','국내 종합기전',null],['women','여자기전','women']]){
      const L=DX.se.filter(s=>s[3]===sec&&s[5]&&s[6].length&&(!grp||s[4]===grp)&&s[6][s[6].length-1][1]>=(LASTD/10000-3|0)*10000).map(s=>({n:s[1],r:s[6][s[6].length-1],h:dxGid(s)})).sort((a,b)=>b.r[1]-a.r[1]).slice(0,7);
      if(L.length)cols.push([lbl,'#/tournaments/'+sec,L.map(x=>[x.n,x.r[2],(x.r[1]/10000)|0,x.h])]);
    }
  }
  if(typeof IX!=='undefined'&&IX){const L=IX.ev.filter(e=>e[4]==='major'&&e[7]).map(e=>({n:e[1],r:e[10][e[10].length-1],h:e[9]&&e[9].length?'#/tournaments/'+e[9][e[9].length-1]:''})).sort((a,b)=>(b.r[1]||0)-(a.r[1]||0)).slice(0,7);
    if(L.length)cols.push(['국제 메이저','#/tournaments/intl',L.map(x=>[x.n,x.r[2],x.r[1],x.h])]);}
  if(!cols.length)return '';
  return card('지금 타이틀 보유자','',`<div class="hhold">${cols.map(([l,h,L])=>`<div class="hcol2"><h3><a href="${h}">${l} ›</a></h3><ul>${L.map(([n,k,y,h])=>`<li><span class="t">${h?`<a class="pl" href="${h}">${esc(n)}</a>`:esc(n)}</span><span class="w">${flag((PBY[k]||{}).c)}${isNK(k)?esc(k.slice(2)):plink(k)}</span><span class="y">${y||''}</span></li>`).join('')}</ul></div>`).join('')}</div>`);
}
// 홈 세 단 높이 맞추기: 짧은 단의 목록(최근 대국·헤드라인·고레이팅)을 한 줄씩 더 보여 줌
function homeFill(){
  const e3=document.querySelector('.e3');if(!e3)return;
  e3.classList.remove('bal');e3.querySelectorAll('.efill>.xf.on').forEach(x=>x.classList.remove('on'));
  const cols=[...e3.children];if(getComputedStyle(e3).gridTemplateColumns.split(' ').length<3)return;
  const nat=c=>[...c.children].reduce((h,x,i)=>h+x.getBoundingClientRect().height+(i?16:0),0);
  const target=Math.max(...cols.map(nat));
  for(const c of cols){for(const li of c.querySelectorAll('.efill>.xf')){li.classList.add('on');if(nat(c)>target+2){li.classList.remove('on');break;}}}
  e3.classList.add('bal');
}
{let t;window.addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(homeFill,150);});window.addEventListener('load',homeFill);}
// 홈 검색창: 머리글 검색과 같은 목록(QS)에서 찾기
function homeSearch(){
  const inp=document.getElementById('hq'),box=document.getElementById('hsl');if(!inp)return;let sel=-1,items=[],tmr;
  const draw=()=>{box.innerHTML=items.map((x,i)=>`<a href="${x.href}" class="${i===sel?'on':''}">${esc(x.label)}<span>${esc(x.sub)}</span></a>`).join('')||'<div class="none">일치하는 기사·대회가 없습니다</div>';box.hidden=false;};
  inp.addEventListener('input',()=>{clearTimeout(tmr);tmr=setTimeout(()=>{const q=inp.value.trim().toLowerCase();if(!q){box.hidden=true;return;}
    items=QS.filter(x=>x.hay.includes(q)).sort((a,b)=>(a.label.toLowerCase().startsWith(q)?0:1)-(b.label.toLowerCase().startsWith(q)?0:1)||(rec(b.k).g||0)-(rec(a.k).g||0)).slice(0,8);sel=-1;draw();},180);});
  inp.addEventListener('keydown',e=>{if(box.hidden)return;if(e.key==='ArrowDown'){sel=Math.min(items.length-1,sel+1);draw();e.preventDefault();}else if(e.key==='ArrowUp'){sel=Math.max(0,sel-1);draw();e.preventDefault();}else if(e.key==='Enter'){const x=items[Math.max(0,sel)];if(x)routeGo(x.href);}else if(e.key==='Escape')box.hidden=true;});
  document.addEventListener('click',e=>{if(!e.target.closest('.hsearch'))box.hidden=true;});
}

/* =============== PLAYERS LIST =============== */
const pst={q:'',c:'all',org:'all',st:'all',g:'all',era:'all',act:false,sort:'rank',page:0};
const ERAS=[['all','전체'],['1950','1950년대 이전'],['1960','1960년대'],['1970','1970년대'],['1980','1980년대'],['1990','1990년대'],['2000','2000년대'],['2010','2010년대'],['2020','2020년대']];
const eraOf=k=>{const r=rec(k);if(!r.g)return null;return r;};
const NONP=new Set(['양자패','기권승']);   // 부전·기권 표기(기사가 아님)
function pPlayers(q){
  if(q.org)pst.org=q.org;if(q.c)pst.c=q.c;if(q.q!=null){pst.q=q.q.trim();pst.page=0;}
  const orgs=[...new Set(P.map(p=>p.o).filter(Boolean))].sort();
  app.innerHTML=crumb([['홈','#/'],['기사']])+`<h1 class="pt">기사</h1><p class="lede">기사 정보 ${fmt(P.length)}명과 기사 정보에 연결되지 않은 대국 표기를 함께 찾습니다. <a class="pl" href="#/players/feed">입단·승단·첫 우승 소식 보기 ›</a></p>
  <div class="ctabs" id="pc" role="group" aria-label="국가">${[['all','전체'],['한국','한국'],['중국','중국'],['일본','일본'],['대만','대만'],['기타','기타']].map(([v,l])=>`<button type="button" data-v="${v}" aria-pressed="${pst.c===v}">${flag(v)}<span>${l}</span><em></em></button>`).join('')}</div>
  <div class="fbar">
    <div class="fg w"><label class="sr" for="pq">이름 검색</label><input class="q" id="pq" type="search" placeholder="이름·한자·영문" value="${esc(pst.q)}"></div>
    
    <div class="fg"><span class="fl">소속</span><select class="q" id="po" style="min-width:110px"><option value="all">전체</option>${orgs.map(o=>`<option ${pst.org===o?'selected':''}>${esc(o)}</option>`).join('')}</select></div>
    <div class="fg"><span class="fl">현역</span><select class="q" id="ps" style="min-width:80px"><option value="all">전체</option><option ${pst.st==='현역'?'selected':''}>현역</option><option ${pst.st==='은퇴'?'selected':''}>은퇴</option></select></div>
    <div class="fg"><span class="fl">성별</span><select class="q" id="pg" style="min-width:80px"><option value="all">전체</option><option ${pst.g==='남자'?'selected':''}>남자</option><option ${pst.g==='여자'?'selected':''}>여자</option></select></div>
    <div class="fg"><span class="fl">시대</span><select class="q" id="pe" style="min-width:110px">${ERAS.map(([v,l])=>`<option value="${v}" ${pst.era===v?'selected':''}>${l}</option>`).join('')}</select></div>
    <div class="fg"><span class="fl">정렬</span><select class="q" id="pso" style="min-width:110px"><option value="rank">랭킹</option><option value="whr">실력 점수</option><option value="games">통산 대국</option><option value="wins">통산 승</option><option value="titles">우승</option><option value="recent">최근 활동</option><option value="name">이름</option></select></div>
  </div>
  <div class="note" id="pcount" style="margin-top:12px"></div>
  <div id="plist"></div><div id="ppager"></div>`;
  document.getElementById('pc').insertAdjacentHTML('beforebegin','<div id="pdash"></div>');
  const bind=(id,key,ev='change')=>{const el=document.getElementById(id);el.addEventListener(ev,()=>{pst[key]=el.value.trim?el.value.trim():el.value;pst.page=0;draw();});};
  ['po:org','ps:st','pg:g','pe:era','pso:sort'].forEach(s=>{const [i,k]=s.split(':');bind(i,k);});
  document.getElementById('pso').value=pst.sort;
  document.getElementById('pc').onclick=e=>{const b=e.target.closest('button');if(!b)return;pst.c=b.dataset.v;pst.page=0;document.querySelectorAll('#pc button').forEach(x=>x.setAttribute('aria-pressed',x===b));draw();};
  {const cnt={all:P.length,'기타':0};P.forEach(p=>{if(['한국','중국','일본','대만'].includes(p.c))cnt[p.c]=(cnt[p.c]||0)+1;else cnt['기타']++;});document.querySelectorAll('#pc button').forEach(b=>b.querySelector('em').textContent=fmt(cnt[b.dataset.v]||0));}
  let tm;document.getElementById('pq').addEventListener('input',e=>{clearTimeout(tm);tm=setTimeout(()=>{pst.q=e.target.value.trim();pst.page=0;try{routeRS('#/players'+(pst.q?'?q='+encodeURIComponent(pst.q):''));}catch(_){}draw();},250);});
  draw();
  function draw(){
    const q=pst.q.toLowerCase();
    const items=[];
    const keyset=new Set();
    P.forEach(p=>{keyset.add(p.k);
      if(pst.c!=='all'&&(pst.c==='기타'?['한국','중국','일본','대만'].includes(p.c):p.c!==pst.c))return;
      if(pst.org!=='all'&&p.o!==pst.org)return;
      if(pst.st!=='all'&&!(p.st||'').includes(pst.st))return;
      if(pst.g!=='all'&&p.g!==pst.g)return;
      if(q&&!(p.n.toLowerCase().includes(q)||p.n.replace(/\s/g,'').includes(pst.q.replace(/\s/g,''))||(p.n0||'').includes(pst.q)||[...(KALL[p.k]||[])].some(x=>x.includes(pst.q))||(p.hn||'').includes(pst.q)||(p.en||'').toLowerCase().includes(q)||(KNAME[p.k]||'').includes(pst.q)))return;
      items.push(p.k);});
    if(pst.org==='all'&&pst.st==='all'&&pst.g==='all'&&pst.c==='all')Object.keys(BYK).forEach(k=>{if(isNK(k)&&!NONP.has(k.slice(2))&&(!q||k.slice(2).toLowerCase().includes(q)))items.push(k);});
    let list=items;
    if(pst.era!=='all'){const e=+pst.era;list=list.filter(k=>{const r=rec(k);if(!r.g)return false;const fy=(r.first/10000)|0,ly=(r.last/10000)|0;return e===1950?fy<1960:(fy<e+10&&ly>=e);});}
    pDash(pst.c);const RK=pRankMap(pst.c);
    const S={rank:k=>RK[k]?1e7-RK[k][0]:((ws(k)||[0])[0]||-1e9)-1e7,whr:k=>(ws(k)||[0])[0]||-1e9,games:k=>rec(k).g,wins:k=>rec(k).w,titles:k=>(CHB[k]||[]).length,recent:k=>rec(k).last||0};
    if(pst.sort==='name')list.sort((a,b)=>nameOf(a).localeCompare(nameOf(b),'ko'));else{const f=S[pst.sort];list.sort((a,b)=>f(b)-f(a)||nameOf(a).localeCompare(nameOf(b),'ko'));}
    const per=60,pages=Math.max(1,Math.ceil(list.length/per));if(pst.page>=pages)pst.page=0;
    const nk=list.filter(isNK).length;
    {const am=list.filter(k=>isNK(k)&&k.includes('(아마')).length,tm=list.filter(k=>isNK(k)&&k.includes('(챌린지)')).length,ex=nk-am-tm;document.getElementById('pcount').innerHTML=`총 ${fmt(list.length)}명${nk?` · 기사 정보 없는 이름 ${fmt(nk)}개 포함 (아마추어 ${fmt(am)} · 한국기원 명단 외 기사 ${fmt(ex)}${tm?' · 팀 '+fmt(tm):''})`:''}`;}
    const el=document.getElementById('plist');
    if(!list.length){el.innerHTML='<div class="empty" style="margin-top:14px">조건에 맞는 기사가 없습니다. <button class="linkbtn" id="preset">필터 초기화</button></div>';document.getElementById('preset').onclick=()=>{Object.assign(pst,{q:'',c:'all',org:'all',st:'all',g:'all',era:'all',page:0});pPlayers({});};document.getElementById('ppager').innerHTML='';return;}
    el.innerHTML=`<div class="cards">${list.slice(pst.page*per,(pst.page+1)*per).map(k=>{const p=PBY[k],r=rec(k),s=ws(k);
      return `<a class="card" href="#/players/${encodeURIComponent(k)}"><div class="ph">${p&&p.ph?photo(p,nameOf(k)).replace(/data-ini="[^"]*"/,`data-ini="${esc(initial(nameOf(k)))}"`):`<span class="ini" aria-hidden="true">${esc(initial(nameOf(k)))}</span>`}</div><div class="nm">${esc(nameOf(k))}<span>${p&&p.dan?p.dan+'단':''}</span></div><div class="meta">${p?flag(p.c)+(FLAG[p.c]?'<span class="sr">'+esc(p.c)+'</span> ':' '):''}${esc(p?[FLAG[p.c]?'':p.c,p.o!==p.c?p.o:'',(p.st||'')].filter(Boolean).join(' · '):nkLabel(k))}</div><div class="rec">${RK[k]?`<b class="prk">${RK[k][1]} ${RK[k][0]}위</b> · `:''}${r.g?`통산 ${fmt(r.w)}승 ${fmt(r.l)}패`:'대국 기록 없음'}${s&&s[7]>=RANK_MIN?` · ${fmt(s[0])}`:''}</div></a>`;}).join('')}</div>`;
    const pg=document.getElementById('ppager');
    pg.innerHTML=pages>1?`<div class="pager"><span>${pst.page+1} / ${pages} 페이지</span><span><button data-p="-1" ${pst.page===0?'disabled':''}>이전</button> <button data-p="1" ${pst.page>=pages-1?'disabled':''}>다음</button></span></div>`:'';
    pg.querySelectorAll('button').forEach(b=>b.onclick=()=>{pst.page+=+b.dataset.p;draw();window.scrollTo(0,0);});
  }
}

/* =============== YEAR AGGREGATES (for ranks) =============== */
let YAGG=null;
function yagg(){ if(YAGG)return YAGG; YAGG={};
  for(const g of GSC){if(g.j)continue;const a=YAGG[g.y]=YAGG[g.y]||{w:{},n:{}};a.w[g.wk]=(a.w[g.wk]||0)+1;a.n[g.wk]=(a.n[g.wk]||0)+1;a.n[g.lk]=(a.n[g.lk]||0)+1;}
  // YAGG_LAZY_V1: 순위표(rw·rn·rp)는 그 해를 처음 볼 때 만듦(홈은 올해만 봄)
  const lz=(a,f,fn)=>Object.defineProperty(a,f,{configurable:true,enumerable:true,get(){const v=fn();Object.defineProperty(a,f,{value:v,writable:true,enumerable:true,configurable:true});return v;}});
  for(const y in YAGG){const a=YAGG[y];lz(a,'rw',()=>rankMap(a.w));lz(a,'rn',()=>rankMap(a.n));lz(a,'rp',()=>{const pr={};for(const k in a.n){if(a.n[k]>=20)pr[k]=(a.w[k]||0)/a.n[k];}return rankMap(pr);});}
  return YAGG;}
// 한 해만 필요할 때(홈 점수판): 전체 YAGG 를 만들지 않고 그해만 셈. 결과 모양은 yagg()[y] 와 같음
let YAGG1={};
function yaggY(y){if(YAGG)return YAGG[y];if(YAGG1.s===GSC&&y in YAGG1.v)return YAGG1.v[y];if(YAGG1.s!==GSC)YAGG1={s:GSC,v:{}};
  let a=null;for(const g of GSC){if(g.j||g.y!==y)continue;if(!a)a={w:{},n:{}};a.w[g.wk]=(a.w[g.wk]||0)+1;a.n[g.wk]=(a.n[g.wk]||0)+1;a.n[g.lk]=(a.n[g.lk]||0)+1;}
  if(a){a.rw=rankMap(a.w);a.rn=rankMap(a.n);const pr={};for(const k in a.n){if(a.n[k]>=20)pr[k]=(a.w[k]||0)/a.n[k];}a.rp=rankMap(pr);}
  return YAGG1.v[y]=a||undefined;}
function rankMap(obj){const arr=Object.entries(obj).sort((a,b)=>b[1]-a[1]);const m={};let r=0,prev=null;arr.forEach(([k,v],i)=>{if(v!==prev){r=i+1;prev=v;}m[k]=r;});return m;}

/* =============== PLAYER PROFILE =============== */
/* 한국기원이 발표한 공식 통산 기록(보도 기준). 이 사이트 집계는 대국결과 목록에 실린 대국만 셉니다. */
const OFFICIAL={'10000001':{w:2000,l:830,d:1,date:20261026,note:'세계 최초 통산 2,000승 — 2026 쏘팔코사놀 레전드리그 11라운드, 최명훈 9단에게 207수 흑 불계승',src:'한국기원 발표(뉴스핌·한국일보 보도)',url:'https://www.hankookilbo.com/news/article/A2026102615340003371'}};
function offBar(k,r){const o=OFFICIAL[k];if(!o)return '';
  return `<div class="offb"><div class="ob1"><span class="obk">한국기원 발표</span><b>통산 ${fmt(o.w)}승</b><span class="obs">${dstr(o.date).replace(/-/g,'.')}</span></div>
  <div class="ob2">${esc(o.note)} <a href="${o.url}" target="_blank" rel="noopener noreferrer">${esc(o.src)}</a></div></div>`;}
function kbaLine(k,r){if(!r.off)return '';
  return `<div class="kbal"><span>한국기원 기록실 <b>공식 ${fmt(r.g)}전 ${fmt(r.w)}승${r.dr?' '+fmt(r.dr)+'무':''} ${fmt(r.l)}패</b>${r.v?' · 무효 '+fmt(r.v):''}</span>${r.un?`<span>비공식 ${fmt(r.un)}국</span>`:''}</div>`;}
const PTABS=[['','개요'],['season','시즌별 기록'],['tournaments','대회별'],['games','대국 로그'],['rivals','상대전적'],['timeline','타임라인'],['elo','점수 변동'],['records','기록·수상'],['gor','고레이팅']];
function awardsOf(p){if(!p)return [];return p.nt.filter(x=>/바둑대상|수상|상$|상\s*\(|MVP|다승상|신인/.test(x)&&!/문하|출신|도장|존경/.test(x));}
function pPlayer(k,tab,q){{const al={};P.forEach(p=>(p.alias||[]).forEach(x=>al[x]=p.k));if(al[k])k=al[k];}if(!PTABS.some(t=>t[0]===tab))tab='';
  const p=PBY[k];const gs=BYK[k]||[];
  if(!p&&!gs.length){app.innerHTML=crumb([['홈','#/'],['기사','#/players']])+`<div class="empty" style="margin-top:24px">${esc(isNK(k)?k.slice(2):k)}을(를) 찾을 수 없습니다. <a class="pl" href="#/players">기사 목록에서 찾기</a></div>`;return;}
  const name=nameOf(k);const r=rec(k);const s=ws(k);
  const titles=CHB[k]||[];const byG={};titles.forEach(c=>{byG[c.g]=(byG[c.g]||0)+1;});
  const chips=Object.entries(byG).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([g,n])=>`<span class="award" title="계산값: 결승·도전기 다승자 판정">${esc(G[g])} <b>${n}회</b> 우승</span>`);
  {const ic=ixPlayerChip(k);if(ic)chips.unshift(ic);}
  chips.push(...worldChips(k));
  const aw=awardsOf(p);if(aw.length)chips.push(`<span class="award" title="특기사항에서 추출한 수상 기록">수상 기록 <b>${aw.length}건</b></span>`);
  const info=p?[['단',p.dan?p.dan+'단':'정보 없음'],['국가',p.c||'정보 없음'],['소속',p.o||'정보 없음'],['현역 여부',p.st||'정보 없음'],['생년월일',p.b?p.b.replace(/-/g,'.'):'정보 없음'],['나이',p.b?'만 '+ageNow(p.b)+'세':'정보 없음'],['성별',p.g||'정보 없음'],['한국기원 레이팅',p.r?fmt(Math.round(p.r)):'정보 없음']]:[];
  const fav=isFav(k);
  const bio=p?[['단',p.dan?p.dan+'단':'정보 없음'],['국가',p.c||'정보 없음'],['소속',p.o||'정보 없음'],['상태',p.st||'정보 없음'],['생년',p.b?p.b.replace(/-/g,'.')+(ageNow(p.b)!=null?' (만 '+ageNow(p.b)+'세)':''):'정보 없음'],['성별',p.g||'정보 없음'],['첫 대국',r.first?dstr(r.first):'–'],['마지막 대국',r.last?dstr(r.last):'–']]:[['첫 대국',r.first?dstr(r.first):'–'],['마지막 대국',r.last?dstr(r.last):'–']];
  const rNow=rankAt(LASTD/100|0);
  app.innerHTML=crumb([['홈','#/'],['기사','#/players'],[name,tab?'#/players/'+encodeURIComponent(k):null]].concat(tab?[[PTABS.find(t=>t[0]===tab)[1]]]:[]))+`
  <div class="phead">
    <div class="ph">${photo(p,name)}</div>
    <div>
      <h1>${esc(name)} <button class="fav" id="favt" aria-pressed="${fav}" title="이 브라우저에만 저장됩니다">${fav?'★ 즐겨찾기됨':'☆ 즐겨찾기'}</button></h1>
      <div class="alt">${p?esc([p.hn||'',p.en||'',altNames(p)].filter(Boolean).join(' · ')):(nkLabel(k)==='아마추어'?'아마추어 — 한국기원 기사 정보가 없어 대국 기록만 표시합니다':nkLabel(k)==='팀(릴레이 대국)'?'팀 이름으로 기록된 릴레이 대국 — 개인 기사가 아닙니다':'한국기원 기사 명단에 없는 기사(관서기원·해외·은퇴 등) — 대국 기록만 표시합니다')}${p&&nameOf(k)!==p.n?` · 기사 정보 표기: ${esc(p.n)}`:''}</div>
      <div class="bio">${bio.map(([a,b])=>`<span>${a}<b>${a==='국가'&&FLAG[b]?flag(b)+'<span class="sr">'+esc(b)+'</span>':esc(b)}</b></span>`).join('')}</div>
      ${chips.length?`<div class="awards">${chips.join('')}</div>`:''}
      ${extLinks(k,p)}${fxTeacherHtml(k)}
    </div>
    <div class="rating"><div class="k">실력 점수 ${calc('WHR 계산값')}</div><div class="v">${s?fmt(s[0]):'–'}</div><div class="s">${s?`±${s[1]} · ${rNow[k]?'현재 '+rNow[k]+'위':'랭킹 제외'}`:'표본 없음'}</div></div>
  </div>
  <div class="stats">
    <div><div class="v">${fmt(r.g)}</div><div class="k">${r.off?'공식 대국':'통산 대국'}</div></div><div><div class="v">${fmt(r.w)}</div><div class="k">승</div></div><div><div class="v">${fmt(r.l)}</div><div class="k">패</div></div><div><div class="v">${wpct(r)}</div><div class="k">승률</div></div><div><div class="v">${titles.length}</div><div class="k">우승</div></div><div><div class="v">${s?fmt(s[3]):'–'}</div><div class="k">역대 최고점</div></div>
  </div>
  <div class="fx-sum" id="fxsum" hidden></div>
  ${kbaLine(k,r)}${offBar(k,r)}
  <nav class="tabs" role="tablist">${PTABS.map(([t,l])=>`<a role="tab" href="#/players/${encodeURIComponent(k)}${t?'/'+t:''}" class="${(tab||'')===t?'on':''}" aria-selected="${(tab||'')===t}">${l}</a>`).join('')}</nav>
  <div id="ptab"></div>`;
  document.getElementById('favt').onclick=e=>{const on=toggleFav(k);e.target.setAttribute('aria-pressed',on);e.target.textContent=on?'★ 즐겨찾기됨':'☆ 즐겨찾기';};
  const el=document.getElementById('ptab');
  ({'':tOverview,season:tSeason,tournaments:tTour,timeline:tTimeline,elo:tElo,games:tGames,rivals:tRivals,records:tRecords,gor:tGor}[tab||'']||tOverview)(el,k,p,gs,q);
  if(!tab&&gs.length)el.insertAdjacentHTML('afterbegin',fxRecentTour(k,gs));
  setTimeout(()=>fxSummary(k),30);
}
function tOverview(el,k,p,gs){
  const r=rec(k),s=ws(k),st=streaks(k);const titles=(CHB[k]||[]).slice().sort((a,b)=>b.d-a.d);const runs=RUB[k]||[];
  const sp={세계:[0,0],국내:[0,0],리그:[0,0],미분류:[0,0]};let bW=0,bG=0,wW=0,wG=0;
  gs.forEach(g=>{if(g.j)return;const c=SPLIT(g.c);const won=g.wk===k;won?sp[c][0]++:sp[c][1]++;if(g.r[0]){const my=won?g.r[0]:(g.r[0]===1?2:1);if(my===1){bG++;if(won)bW++;}else{wG++;if(won)wW++;}}});
  const nd=gs.filter(g=>!g.j);const last=n=>{const x=nd.slice(-n);const w=x.filter(g=>g.wk===k).length;return [w,x.length-w];};const [w10,l10]=last(10),[w30,l30]=last(30);
  const riv=rivalsOf(k).filter(x=>x.n>=10).sort((a,b)=>b.idx-a.idx).slice(0,3);
  el.innerHTML=`
  <div class="grid g31">
    <div style="display:grid;gap:16px;align-content:start">
      <div class="mod"><div class="hd"><span>실력 점수 변화 ${calc('WHR(w²='+META.whr.w2+') — 한국기원 공인전'+(META.whr.extra?'에 해외 대국을 더해 계산':' 기준')+', 계산 기준일 '+dstr(META.whr.asof||LASTD))}</span><span class="desc">${s?`최고 ${fmt(s[3])} (${ymstr(s[4])}) · 최저 ${s[5]!=null?fmt(s[5])+' ('+ymstr(s[6])+')':'표본 부족'}`:''}</span></div><div class="bd">${s?'<div class="chart"><canvas id="wc"></canvas></div>':'<div class="empty">실력 점수 없음 — 승부가 난 대국이 없거나 표본이 부족합니다</div>'}</div></div>
      <div class="mod"><div class="hd"><span>스플릿 ${calc('무승부·무효 제외 승÷(승+패)')}</span><span class="desc">대회 구분·흑백·최근 흐름</span></div><div class="bd"><div class="tw"><table><thead><tr><th>구분</th><th class="r">국</th><th class="r">승</th><th class="r">패</th><th class="r">승률</th></tr></thead><tbody>
        ${Object.entries(sp).map(([c,[w,l]])=>`<tr><td>${c==='미분류'?'기타/미분류 대회':c+(c==='리그'?'':'대회')}</td><td class="n r">${w+l}</td><td class="n r">${w}</td><td class="n r">${l}</td><td class="n r">${pct(w,w+l)}</td></tr>`).join('')}
        <tr><td>흑번 <span class="cov">2021년 이후</span></td><td class="n r">${bG}</td><td class="n r">${bW}</td><td class="n r">${bG-bW}</td><td class="n r">${pct(bW,bG)}</td></tr><tr><td>백번 <span class="cov">2021년 이후</span></td><td class="n r">${wG}</td><td class="n r">${wW}</td><td class="n r">${wG-wW}</td><td class="n r">${pct(wW,wG)}</td></tr>
        <tr><td>최근 10국</td><td class="n r">${w10+l10}</td><td class="n r">${w10}</td><td class="n r">${l10}</td><td class="n r">${pct(w10,w10+l10)}</td></tr><tr><td>최근 30국</td><td class="n r">${w30+l30}</td><td class="n r">${w30}</td><td class="n r">${l30}</td><td class="n r">${pct(w30,w30+l30)}</td></tr></tbody></table></div>
        <div class="note">세계·국내 구분은 한국기원 공식 기전 목록과 일치하는 대회만 적용했습니다(잠정치). 분류되지 않은 ${fmt(sp.미분류[0]+sp.미분류[1])}국은 '기타/미분류'로 따로 둡니다.</div></div></div>
      <div class="mod"><div class="hd"><span>우승 ${calc('결승·도전기 다승자 판정')}</span><span class="desc">우승 ${titles.length} · 준우승 ${runs.length}</span></div><div class="bd flush">${titles.length?`<div class="tw scrollbox"><table><thead><tr><th>연도</th><th>대회</th><th>회차</th><th>결승 상대</th></tr></thead><tbody>${titles.map(c=>`<tr><td class="d">${(c.d/10000)|0}</td><td><a class="pl" href="#/tournaments/${c.g}">${esc(G[c.g])}</a></td><td class="d">${esc(c.ed)}</td><td>${c.rk?plink(c.rk):'–'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">판정된 우승 기록이 없습니다</div>'}</div></div>
    </div>
    <div style="display:grid;gap:16px;align-content:start">
      <div class="mod"><div class="hd"><span>연승·연패 ${calc('무승부·무효는 건너뜀')}</span></div><div class="bd"><div class="split" style="grid-template-columns:1fr 1fr"><div><div class="k">최다 연승</div><div class="v">${st.bw}</div><div class="s">${st.bwS?dstr(st.bwS).slice(0,7)+' ~ '+dstr(st.bwE).slice(0,7):''}</div></div><div><div class="k">최다 연패</div><div class="v">${st.bl}</div><div class="s">${st.blS?dstr(st.blS).slice(0,7)+' ~ '+dstr(st.blE).slice(0,7):''}</div></div><div><div class="k">현재</div><div class="v">${st.cur[1]?st.cur[1]+st.cur[0]:'–'}</div><div class="s">마지막 ${r.last?dstr(r.last):''}</div></div><div><div class="k">첫 대국 나이</div><div class="v">${p&&p.b&&r.first?'만 '+ageAt(p.b,r.first):'–'}</div><div class="s">${r.first?dstr(r.first):''}</div></div></div></div></div>
      <div class="mod"><div class="hd"><span>라이벌 ${calc('맞대결 수 × (1 − |승률−0.5|×2), 10국 이상')}</span><a class="more" href="#/players/${encodeURIComponent(k)}/rivals">전체 →</a></div><div class="bd">${riv.length?riv.map((x,i)=>`<div class="rk"><span class="i">${i+1}</span><span class="nm">${plink(x.o)}<small>${x.n}국</small></span><span class="v"><span class="rw">${x.w}</span>-<span class="rl">${x.l}</span></span></div>`).join(''):'<div class="empty">10국 이상 맞대결한 상대가 없습니다</div>'}</div></div>
      <div class="mod"><div class="hd"><span>최근 10국</span><a class="more" href="#/players/${encodeURIComponent(k)}/games">대국 로그 →</a></div><div class="bd">${gs.slice(-10).reverse().map(g=>{const won=g.wk===k,o=won?g.lk:g.wk;return `<div class="gl"><span class="d">${dstr(g.d).slice(2)}</span><span><span class="${g.j?'rd':won?'rw':'rl'}">${g.j?'무':won?'승':'패'}</span> ${plink(o)}<div class="t">${esc(T[g.ti])}</div></span></div>`;}).join('')||'<div class="empty">대국 기록 없음</div>'}</div></div>
      ${playerNews(k)}
      ${p&&p.pr.length?`<div class="mod"><div class="hd"><span>승단 이력</span><span class="desc">${esc(p.ps||'원본')}</span></div><div class="bd"><ul class="tl">${p.pr.map(([dn,dt,rs])=>`<li><b>${dn}단</b><span class="d">${esc(dt)}</span>${esc(rs)}</li>`).join('')}</ul></div></div>`:''}
    </div>
  </div>
  ${p&&(p.nt.length||p.cr.length)?`<div class="grid g2" style="margin-top:16px">${p.nt.length?`<div class="mod"><div class="hd"><span>특기사항</span><span class="desc">${esc(p.ps||'원본')}</span></div><div class="bd"><ul style="margin:0;padding-left:18px;font-size:12.5px;color:var(--ink-soft)">${p.nt.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div>`:'<div></div>'}${p.cr.length?`<div class="mod career"><div class="hd"><span>커리어</span><span class="desc">${p.ps?esc(p.ps)+' 기전 경력':'원본 경력사항'} · ${p.cr.length}개 연도</span></div><div class="bd" style="max-height:420px;overflow:auto">${[...p.cr].reverse().map(([y,items],i)=>`<details ${i<2?'open':''}><summary>${esc(y||'기타')}${y?'년':''} <span class="muted" style="font-weight:400">· ${items.length}</span></summary><ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`).join('')}</div></div>`:''}</div>`:''}`;
  if(s){const c=WR[k];mkChart('wc',{type:'line',data:{labels:c.map(x=>ymstr(x[0])),datasets:[{label:'실력 점수',data:c.map(x=>x[1]),borderColor:cssv('--link'),pointRadius:0,borderWidth:2,tension:.2},{label:'오차 상단',data:c.map(x=>x[1]+x[2]),borderColor:'transparent',backgroundColor:'rgba(11,92,173,.12)',pointRadius:0,fill:'+1'},{label:'오차 하단',data:c.map(x=>x[1]-x[2]),borderColor:'transparent',pointRadius:0,fill:false}]},options:{maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{filter:i=>i.datasetIndex===0}},scales:{x:{...noGrid(),ticks:{maxTicksLimit:8}},y:gridY()}}});}
}
function tSeason(el,k,p,gs){
  const A=yagg();const by={};gs.forEach(g=>{const o=by[g.y]=by[g.y]||{w:0,l:0,d:0};if(g.j)o.d++;else g.wk===k?o.w++:o.l++;});
  const ys=Object.keys(by).map(Number).sort((a,b)=>b-a);
  el.innerHTML=`<section class="panel"><h2 class="sec"><span>연도별 성적</span><span class="desc">${ys.length}개 연도</span></h2><div class="chart t"><canvas id="sc"></canvas></div></section>
  <section class="panel"><div class="tw sticky"><table><thead><tr><th>연도</th><th class="r">대국</th><th class="r">승</th><th class="r">패</th><th class="r">무·무효</th><th class="r">승률</th><th class="r">연말 실력 점수 ${calc('그 해 마지막 시점의 WHR')}</th><th>그 해 순위 ${calc('그 해 전체 기사 중 순위, 승률은 20국 이상만')}</th></tr></thead><tbody>${ys.map(y=>{const o=by[y],a=A[y]||{rw:{},rn:{},rp:{}};const wr=whrAt(k,y*100+12);const rk=[a.rw[k]?`다승 ${a.rw[k]}위`:'',a.rp[k]?`승률 ${a.rp[k]}위`:'',a.rn[k]?`대국 ${a.rn[k]}위`:''].filter(Boolean).join(' · ');
    return `<tr><td class="n"><a class="pl" href="#/seasons/${y}">${y}</a></td><td class="n r">${o.w+o.l+o.d}</td><td class="n r">${o.w}</td><td class="n r">${o.l}</td><td class="n r">${o.d}</td><td class="n r">${pct(o.w,o.w+o.l)}</td><td class="n r">${wr&&((wr[0]/100)|0)===y?fmt(wr[1]):wr?'<span class="muted">'+fmt(wr[1])+'</span>':'–'}</td><td class="small">${rk}</td></tr>`;}).join('')}</tbody></table></div><div class="note">연말 실력 점수가 흐리게 표시된 해는 그 해 대국이 없어 이전 시점 점수를 보여준 것입니다.</div></section>`;
  const asc=[...ys].reverse();
  mkChart('sc',{data:{labels:asc,datasets:[{type:'bar',label:'승',data:asc.map(y=>by[y].w),backgroundColor:cssv('--win'),stack:'s',yAxisID:'y'},{type:'bar',label:'패',data:asc.map(y=>by[y].l),backgroundColor:cssv('--loss'),stack:'s',yAxisID:'y'},{type:'line',label:'연말 실력 점수',data:asc.map(y=>{const w=whrAt(k,y*100+12);return w?w[1]:null;}),borderColor:cssv('--ink'),pointRadius:2,borderWidth:1.5,yAxisID:'y2',spanGaps:true}]},options:{maintainAspectRatio:false,plugins:{legend:{position:'bottom'}},scales:{x:{...noGrid(),stacked:true},y:{...gridY(),stacked:true,title:{display:true,text:'대국'}},y2:{position:'right',grid:{display:false},title:{display:true,text:'실력 점수'}}}}});
}
function tTour(el,k,p,gs){
  const nd=gs.filter(g=>!g.j);const last=n=>{const x=nd.slice(-n);const w=x.filter(g=>g.wk===k).length;return [w,x.length-w];};
  const [w10,l10]=last(10),[w30,l30]=last(30);
  const bt={};gs.forEach(g=>{const o=bt[g.g]=bt[g.g]||{c:g.c,w:0,l:0,d:0,ys:new Set(),best:-1};o.ys.add(g.y);if(g.j)o.d++;else g.wk===k?o.w++:o.l++;if(g.s>o.best)o.best=g.s;});
  const tc={},ru={};(CHB[k]||[]).forEach(c=>tc[c.g]=(tc[c.g]||0)+1);(RUB[k]||[]).forEach(c=>ru[c.g]=(ru[c.g]||0)+1);
  const rows=Object.entries(bt).sort((a,b)=>(tc[b[0]]||0)-(tc[a[0]]||0)||(b[1].w+b[1].l)-(a[1].w+a[1].l));
  el.innerHTML=`<section class="panel"><h2 class="sec"><span>최근 흐름</span><span class="desc">무승부·무효 제외</span></h2><div class="split"><div><div class="k">최근 10국</div><div class="v">${w10}승 ${l10}패</div><div class="s">승률 ${pct(w10,w10+l10)}</div></div><div><div class="k">최근 30국</div><div class="v">${w30}승 ${l30}패</div><div class="s">승률 ${pct(w30,w30+l30)}</div></div><div><div class="k">통산</div><div class="v">${fmt(rec(k).w)}승 ${fmt(rec(k).l)}패</div><div class="s">승률 ${wpct(rec(k))}</div></div><div><div class="k">참가 대회</div><div class="v">${rows.length}</div><div class="s">정리된 대회명 기준</div></div></div></section>
  <section class="panel"><h2 class="sec"><span>대회별 성적</span><span class="desc">우승 많은 순 · 제목을 누르면 정렬 · 대회를 누르면 대회 페이지</span></h2><div class="tw sticky"><table class="srt"><thead><tr><th>대회</th><th>분류</th><th class="r">참가 연도</th><th class="r">대국</th><th class="r">승</th><th class="r">패</th><th class="r">승률</th><th class="r">우승 ${calc('결승·도전기 다승자')}</th><th class="r">준우승</th><th>최고 단계</th></tr></thead><tbody>${rows.map(([g,o])=>`<tr><td><a class="pl" href="#/tournaments/${g}">${esc(G[g])}</a></td><td>${badge(o.c)}</td><td class="n r">${o.ys.size}</td><td class="n r">${o.w+o.l+o.d}</td><td class="n r">${o.w}</td><td class="n r">${o.l}</td><td class="n r" data-v="${o.w+o.l?o.w/(o.w+o.l):-1}">${pct(o.w,o.w+o.l)}</td><td class="n r">${tc[g]||''}</td><td class="n r">${ru[g]||''}</td><td class="small" data-v="${tc[g]?99:o.best}">${tc[g]?'우승':o.best>=0?STAGE[o.best]:'<span class="muted">단계 정보 없음</span>'}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function tTimeline(el,k,p,gs,q){
  if(!gs.length){el.innerHTML='<div class="empty">대국 기록이 없습니다</div>';return;}
  q=q||{};
  const y0=gs[0].y,y1=gs[gs.length-1].y;const years=[];for(let y=y0;y<=y1;y++)years.push(y);
  const STL=v=>v==null?'':v>=5?'우승':v>=4.5?'준우승':v>=4?'결승':v>=3?'4강':v>=2?'8강':v>=1?'본선':v>=0?'예선':'단계 정보 없음';
  const STS=v=>v>=5?'우':v>=4.5?'준':v>=4?'결':v>=3?'4':v>=2?'8':v>=1?'본':v>=0?'예':'?';
  const cls=v=>v==null?'':v>=5?'s5':v>=4?'s45':v>=3?'s3':v>=2?'s2':v>=1?'s1':v>=0?'s0':'sx';
  // ---- 연도별 묶음 ----
  const Y={};years.forEach(y=>Y[y]={g:0,w:0,l:0,win:[],run:[],pr:[],best:{}});
  gs.forEach(g=>{const a=Y[g.y];a.g++;if(g.j===1||g.j===2){}else if(g.j===3)a.l++;else if(g.wk===k)a.w++;else a.l++;
    if(g.s!=null&&g.s>=3){const b=a.best[g.g];if(b==null||g.s>b)a.best[g.g]=g.s;}});
  (CHB[k]||[]).forEach(c=>{const y=(c.d/10000)|0;if(Y[y])Y[y].win.push(c);});
  (RUB[k]||[]).forEach(c=>{const y=(c.d/10000)|0;if(Y[y])Y[y].run.push(c);});
  ((p&&p.pr)||[]).forEach(r=>{const y=+String(r[1]).slice(0,4);if(Y[y])Y[y].pr.push(r);});
  const by=p&&p.b&&/^\d{4}/.test(p.b)?+p.b.slice(0,4):null;
  const isW=p&&p.g==='여자';
  const krRank=(y,w)=>{if(typeof KRH==='undefined'||!KRH)return null;const H=w?KRH.w:KRH;if(!H||!H.ye[y])return null;const i=H.ye[y].findIndex(x=>x[0]===k);return i>=0?i+1:null;};
  const tn=c=>`<a href="#/tournaments/${c.g}">${esc(G[c.g])}</a>${c.ed?` <span class="muted">${esc(c.ed)}</span>`:''}`;
  const rowY=y=>{const a=Y[y];if(!a.g&&!a.win.length&&!a.pr.length)return '';
    const dec=a.w+a.l,pc=dec?Math.round(a.w/dec*1000)/10:null;
    const r1=krRank(String(y),false),rw=isW?krRank(String(y),true):null;
    const rk=[r1?`<span class="ctl-rk${r1<=3?' top':''}">한국 ${r1}위</span>`:'',rw?`<span class="ctl-rk${rw<=3?' top':''}">여자 ${rw}위</span>`:''].join('');
    const ev=[];
    a.win.sort((x,z)=>x.d-z.d).forEach(c=>ev.push(`<span class="ctl-ev win">🏆 ${tn(c)} 우승</span>`));
    a.run.sort((x,z)=>x.d-z.d).forEach(c=>ev.push(`<span class="ctl-ev run">준우승 · ${tn(c)}</span>`));
    const won=new Set(a.win.concat(a.run).map(c=>c.g));
    const semi=Object.entries(a.best).filter(([g,s])=>s>=3&&s<4.5&&!won.has(+g)).map(([g])=>`<a href="#/tournaments/${g}">${esc(G[g])}</a>`);
    if(semi.length)ev.push(`<span class="ctl-ev semi">4강·결승 진출 · ${semi.join(', ')}</span>`);
    a.pr.forEach(r=>ev.push(`<span class="ctl-ev pr">${/입단/.test(r[2])?'입단':r[0]+'단 승단'} <span class="muted">${esc(String(r[1]))}</span></span>`));
    return `<li><div class="ctl-y"><b>${y}</b>${by?`<span>${y-by}세</span>`:''}</div>
      <div class="ctl-b"><div class="ctl-s">${a.g?`<span>${fmt(a.g)}국</span><span><b class="w">${a.w}승</b> <b class="l">${a.l}패</b></span>${pc!=null?`<span class="ctl-bar" title="승률 ${pc}%"><i style="width:${pc}%"></i></span><span>승률 ${pc}%</span>`:''}`:'<span class="muted">대국 없음</span>'}${rk}</div>
      ${ev.length?`<div class="ctl-e">${ev.join('')}</div>`:''}</div></li>`;};
  // ---- 대회별 성적표 ----
  const cell={},cnt={};gs.forEach(g=>{const key=g.g+'|'+g.y;cnt[key]=(cnt[key]||0)+1;const v=g.s;if(cell[key]==null||v>cell[key])cell[key]=v;});
  (RUB[k]||[]).forEach(c=>{const key=c.g+'|'+((c.d/10000)|0);cell[key]=Math.max(cell[key]??-1,4.5);});
  (CHB[k]||[]).forEach(c=>{const key=c.g+'|'+((c.d/10000)|0);cell[key]=5;});
  const groups={};gs.forEach(g=>{(groups[g.c]=groups[g.c]||{})[g.g]=(groups[g.c][g.g]||0)+1;});
  const order=['세계기전','국내기전','리그','협회리그','해외리그','기타'];
  const st={all:q.all==='1'};
  el.innerHTML=`<section class="panel"><h2 class="sec"><span>연도별 경력</span><span class="desc">${y0}–${y1} · 최근 해부터</span></h2>
    <p class="ctl-help">해마다 몇 판을 두어 몇 번 이겼는지, 그해 우승·준우승한 대회, 4강 이상 오른 대회, 승단을 한 줄로 모았습니다. 순위는 그해 말 한국기원 방식 랭킹(계산값, 20위 안일 때만)입니다.</p>
    <ol class="ctl">${years.slice().reverse().map(rowY).join('')}</ol></section>
  <section class="panel"><h2 class="sec"><span>대회별 성적표 ${calc('대회명의 단계 표기(예선/본선/8강/4강/결승)와 우승 판정으로 계산')}</span><span class="desc">${y0}–${y1}</span></h2>
    <p class="ctl-help">줄은 대회, 칸은 연도입니다. 칸 안의 글자는 그해 그 대회에서 올라간 <b>가장 높은 단계</b>입니다 — <b>우</b> 우승 · <b>준</b> 준우승 · <b>결</b> 결승 · <b>4</b> 4강 · <b>8</b> 8강 · <b>본</b> 본선 · <b>예</b> 예선 · <b>?</b> 단계 정보 없음. 빈칸은 그해 그 대회에 나가지 않은 것입니다. 칸에 마우스를 대면 대국 수가 나옵니다.</p>
    <div class="fbar"><div class="fg"><span class="fl">보기</span><div class="pills" id="tlv"><button class="pill" data-v="0" aria-pressed="${!st.all}">본선 이상 오른 대회만</button><button class="pill" data-v="1" aria-pressed="${st.all}">모든 대회</button></div></div>
    <div class="legend"><span><i class="s5"></i>우승</span><span><i class="s45"></i>준우승·결승</span><span><i class="s3"></i>4강</span><span><i class="s2"></i>8강</span><span><i class="s1"></i>본선</span><span><i class="s0"></i>예선</span></div></div>
    <div class="tw sticky"><table class="hm hm2" id="tlt"></table></div>
    <div class="note">대회명에 단계 표기가 없는 대국(전체의 약 ${META.stage_unknown_pct}%)은 '?'로 표시하고 추정하지 않습니다. 공식 기전 목록에 없는 대회는 '기타/미분류' 묶음에 모았습니다.</div></section>`;
  const draw=()=>{
    let rows='';
    order.forEach(c=>{if(!groups[c])return;
      const list=Object.entries(groups[c]).map(([g,n])=>{let b=-2;years.forEach(y=>{const v=cell[g+'|'+y];if(v!=null&&v>b)b=v;});return [g,n,b];})
        .filter(x=>st.all||x[2]>=1).sort((a,b)=>b[2]-a[2]||b[1]-a[1]);
      if(!list.length)return;
      rows+=`<tr class="grp"><td class="lab">${CLABEL[c]}</td>${years.map(()=>'<td class="e"></td>').join('')}</tr>`;
      list.forEach(([g,n,b])=>{rows+=`<tr><td class="lab" title="${esc(G[g])}"><a class="pl" href="#/tournaments/${g}">${esc(G[g])}</a></td>${years.map(y=>{const v=cell[g+'|'+y];return v==null?'<td></td>':`<td class="${cls(v)}" title="${y}년 · ${esc(G[g])} · ${STL(v)} (${cnt[g+'|'+y]||0}국)">${STS(v)}</td>`;}).join('')}</tr>`;});});
    document.getElementById('tlt').innerHTML=`<thead><tr><th class="lab"></th>${years.map(y=>`<th title="${y}년">${String(y).slice(2)}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td class="lab muted">본선에 오른 대회가 없습니다</td></tr>`}</tbody>`;
  };
  bindPills('tlv',v=>{st.all=v==='1';draw();});
  draw();
}
function tGames(el,k,p,gs,q){
  const myGroups=[...new Set(gs.map(g=>g.g))].sort((a,b)=>G[a].localeCompare(G[b],'ko'));
  const st={opp:'',oc:'all',g:'',c:'all',y0:'',y1:'',res:'all',col:'all'};
  el.innerHTML=`<div class="fbar">
    <div class="fg w"><input class="q" id="go" type="search" placeholder="상대 이름"></div>
    <div class="fg"><span class="fl">상대 국가</span><select class="q" id="goc" style="min-width:80px"><option value="all">전체</option><option>한국</option><option>중국</option><option>일본</option><option>대만</option><option value="none">정보 없음</option></select></div>
    <div class="fg w"><select class="q" id="gg"><option value="">대회 전체</option>${myGroups.map(g=>`<option value="${g}">${esc(G[g])}</option>`).join('')}</select></div>
    <div class="fg"><span class="fl">분류</span><select class="q" id="gc" style="min-width:90px"><option value="all">전체</option>${CATS.map(c=>`<option value="${c}">${CLABEL[c]}</option>`).join('')}</select></div>
    <div class="fg"><span class="fl">기간</span><input class="q n" id="gy0" inputmode="numeric" placeholder="${gs.length?gs[0].y:''}"> ~ <input class="q n" id="gy1" inputmode="numeric" placeholder="${gs.length?gs[gs.length-1].y:''}"></div>
    <div class="fg"><span class="fl">결과</span><select class="q" id="gr" style="min-width:80px"><option value="all">전체</option><option value="w">승</option><option value="l">패</option><option value="d">무승부·무효</option></select></div>
    <div class="fg"><span class="fl">흑백</span><select class="q" id="gcol" style="min-width:70px"><option value="all">전체</option><option value="1">흑</option><option value="2">백</option></select><span class="cov">흑백 채움 ${META.color_pct}%</span></div>
  </div><div id="gsum" class="note" style="margin-top:10px"></div><div id="gl" style="margin-top:6px"></div>`;
  const $=id=>document.getElementById(id);let tm;
  const upd=()=>{st.opp=$('go').value.trim();st.oc=$('goc').value;st.g=$('gg').value;st.c=$('gc').value;st.y0=+$('gy0').value||0;st.y1=+$('gy1').value||9999;st.res=$('gr').value;st.col=$('gcol').value;draw();};
  $('go').oninput=()=>{clearTimeout(tm);tm=setTimeout(upd,250);};['goc','gg','gc','gy0','gy1','gr','gcol'].forEach(i=>$(i).onchange=upd);
  upd();
  function draw(){
    const F=gs.filter(g=>{const won=g.wk===k,opp=won?g.lk:g.wk;
      if(st.opp&&!nameOf(opp).includes(st.opp))return false;
      if(st.oc!=='all'){const op=PBY[opp];if(st.oc==='none'?!!op:(!op||op.c!==st.oc))return false;}
      if(st.g&&String(g.g)!==st.g)return false;if(st.c!=='all'&&g.c!==st.c)return false;
      if(g.y<st.y0||g.y>st.y1)return false;
      if(st.res==='w'&&(g.j||!won))return false;if(st.res==='l'&&(g.j||won))return false;if(st.res==='d'&&!g.j)return false;
      if(st.col!=='all'){const myc=won?g.r[0]:(g.r[0]===1?2:g.r[0]===2?1:0);if(String(myc)!==st.col)return false;}
      return true;}).reverse();
    const w=F.filter(g=>!g.j&&g.wk===k).length,l=F.filter(g=>!g.j&&g.lk===k).length;
    $('gsum').innerHTML=`${fmt(F.length)}국 · ${w}승 ${l}패 · 승률 ${pct(w,w+l)}${st.col!=='all'?` · 흑백 정보가 있는 대국만 해당(전체의 ${META.color_pct}%)`:''}`;
    pagedTable($('gl'),F,['날짜','결과','상대','상대 당시 실력 점수','대회','내용'],x=>gameRows(x,k,true),40,{empty:st.col!=='all'?`조건에 맞는 대국이 없습니다. 흑백 정보는 전체 대국의 ${META.color_pct}%에만 기록되어 있습니다.`:'조건에 맞는 대국이 없습니다'});
  }
}
function rivalsOf(k){
  const op={};(BYK[k]||[]).forEach(g=>{if(g.j)return;const won=g.wk===k,o=won?g.lk:g.wk;const x=op[o]=op[o]||{w:0,l:0};won?x.w++:x.l++;});
  return Object.entries(op).map(([o,x])=>{const n=x.w+x.l,p=x.w/n;return {o,w:x.w,l:x.l,n,idx:n*(1-Math.abs(p-.5)*2)};});
}
function tRivals(el,k){
  const all=rivalsOf(k);const elig=all.filter(x=>x.n>=10).sort((a,b)=>b.idx-a.idx);
  el.innerHTML=`<section class="panel"><h2 class="sec"><span>라이벌 추천 ${calc('라이벌 지수 = 맞대결 수 × (1 − |승률−0.5| × 2), 맞대결 10국 이상만')}</span><span class="desc">우리가 정의한 계산 방식</span></h2>
  ${elig.length?`<div class="rcards">${elig.slice(0,6).map((x,i)=>`<div class="rcard"><h3><span>${i+1}. ${plink(x.o)}</span><span class="muted small">지수 ${x.idx.toFixed(1)}</span></h3><div class="small">맞대결 ${x.n}국 · <span class="rw">${x.w}승</span> <span class="rl">${x.l}패</span> · 승률 ${pct(x.w,x.n)}</div><div style="margin-top:6px"><a class="linkbtn" href="#/players/compare?p1=${encodeURIComponent(k)}&p2=${encodeURIComponent(x.o)}">1:1 비교 →</a></div></div>`).join('')}</div>`:'<div class="empty">10국 이상 맞대결한 상대가 아직 없습니다</div>'}
  <div class="note">많이 만났고 승패가 팽팽할수록 지수가 높습니다. 표본 왜곡을 막으려고 맞대결 10국 미만인 상대는 추천에서 뺐습니다(아래 전체 상대 전적에는 그대로 나옵니다). 무승부·무효는 제외했습니다.</div></section>
  <section class="panel"><h2 class="sec"><span>전체 상대 전적</span><span class="desc">${all.length}명 · 맞대결 많은 순</span></h2><div id="rv"></div></section>`;
  const rows=all.sort((a,b)=>b.n-a.n||b.w-a.w);
  pagedTable(document.getElementById('rv'),rows,['상대','국가','맞대결','승','패','승률','라이벌 지수',''],x=>x.map(r=>`<tr><td>${plink(r.o)}</td><td class="d">${cflag((PBY[r.o]||{}).c)}</td><td class="n r">${r.n}</td><td class="n r">${r.w}</td><td class="n r">${r.l}</td><td class="n r">${pct(r.w,r.n)}</td><td class="n r">${r.n>=10?r.idx.toFixed(1):'<span class="muted small">10국 미만</span>'}</td><td class="r"><a class="linkbtn" href="#/players/compare?p1=${encodeURIComponent(k)}&p2=${encodeURIComponent(r.o)}">비교</a></td></tr>`).join(''),30,{sticky:true,empty:'승부가 난 대국이 없습니다'});
}
function tRecords(el,k,p,gs){
  const r=rec(k),st=streaks(k),s=ws(k);
  // per-opponent best win streak
  const cur={},best={};gs.forEach(g=>{if(g.j)return;const won=g.wk===k,o=won?g.lk:g.wk;if(won){cur[o]=(cur[o]||0)+1;if(cur[o]>(best[o]||[0])[0])best[o]=[cur[o],g.d];}else cur[o]=0;});
  const bo=Object.entries(best).sort((a,b)=>b[1][0]-a[1][0])[0];
  const miles=[100,300,500,1000,1500].map(n=>{let c=0;for(const g of gs){if(!g.j&&g.wk===k){c++;if(c===n)return [n,g.d];}}return null;}).filter(Boolean);
  const longest=gs.reduce((a,g)=>g.r[3]&&(!a||g.r[3]>a.r[3])?g:a,null);
  const opp=rivalsOf(k).sort((a,b)=>b.n-a.n)[0];
  const t=(CHB[k]||[]).slice().sort((a,b)=>a.d-b.d);
  const items=[
    ['최다 연승',st.bw+'연승',st.bwS?dstr(st.bwS)+' ~ '+dstr(st.bwE):''],['최다 연패',st.bl+'연패',st.blS?dstr(st.blS)+' ~ '+dstr(st.blE):''],['현재 연속 기록',st.cur[1]?st.cur[1]+st.cur[0]:'–','마지막 대국 '+(r.last?dstr(r.last):'')],
    ['특정 상대 최다 연승',bo?bo[1][0]+'연승':'–',bo?'상대 '+nameOf(bo[0])+' · '+dstr(bo[1][1])+'까지':''],
    ['실력 점수 최고점',s?fmt(s[3]):'–',s?ymstr(s[4]):''],['실력 점수 최저점',s&&s[5]!=null?fmt(s[5]):'표본 부족',s&&s[5]!=null?ymstr(s[6]):'통산 '+RANK_MIN+'국 이후만'],
    ['최다 맞대결 상대',opp?nameOf(opp.o):'–',opp?opp.n+'국 '+opp.w+'승 '+opp.l+'패':''],['최장 수순 대국',longest?longest.r[3]+'수':'–',longest?dstr(longest.d)+' · '+T[longest.ti]:''],
    ['첫 대국',r.first?dstr(r.first):'–',p&&p.b&&r.first?'당시 만 '+ageAt(p.b,r.first)+'세':''],['첫 우승',t.length?dstr(t[0].d):'–',t.length?G[t[0].g]+(p&&p.b?' · 만 '+ageAt(p.b,t[0].d)+'세':''):'']
  ].concat(miles.map(([n,d])=>[`통산 ${n}승 달성`,dstr(d),p&&p.b?'당시 만 '+ageAt(p.b,d)+'세':'']));
  el.innerHTML=`<section class="panel"><h2 class="sec"><span>기록 ${calc('대국 기록을 날짜순으로 집계, 무승부·무효 제외')}</span></h2><div class="rcards">${items.map(([a,b,c])=>`<div class="rcard"><h3><span>${a}</span></h3><div style="font-size:20px;font-weight:800">${esc(b)}</div><div class="small muted">${esc(c)}</div></div>`).join('')}</div>
  <div class="note">수순은 결과 문장에 수순이 적힌 대국(전체의 ${META.moves_pct}%)에서만 계산했습니다.</div></section>${ixPlayerSection(k)}${jpOfficialSection(k)}${jpProfileSection(k)}`;
}

/* ---------- 고레이팅 탭 (goratings.org 레이팅, 열 때 불러옴) ---------- */
const GRK=X.GRK||{};
const ymd=d=>{const s=String(d);return s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8);};
/* GR_B1 고레이팅 자료는 32묶음(/g/)으로 합쳐 둠 — 기사 키의 해시로 묶음을 고름(site_write.py bhash 와 같은 계산) */
function bh(s){let h=0;for(let i=0;i<s.length;i++)h=(Math.imul(h,31)+s.charCodeAt(i))>>>0;return h;}
const GRBM={};
async function grLoad(gid){const k=String(gid).replace(/\//g,'_');const B=window.__GB;
  if(!B)return (await fetch('gr/'+encodeURIComponent(gid)+'.json')).json();
  const f=B[bh(k)%B.length];if(!f)throw new Error('묶음 없음');
  if(!GRBM[f])GRBM[f]=fetch('/g/'+f).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});
  let m;try{m=await GRBM[f];}catch(e){delete GRBM[f];throw e;}
  if(!m[k])throw new Error('자료 없음');return m[k];}
async function tGor(el,k){
  const gid=GRK[k];
  if(!gid){el.innerHTML=`<div class="empty">고레이팅(goratings.org)에 이 기사 자료가 없거나 아직 연결되지 않았습니다.</div>`;return;}
  el.innerHTML='<div class="empty">고레이팅 자료를 불러오는 중…</div>';
  let o;try{o=await grLoad(gid);}catch(e){el.innerHTML='<div class="empty">고레이팅 자료를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.</div>';return;}
  if(!document.body.contains(el))return;
  const h=o.h||[];
  const cur=h.length?h[h.length-1]:null;const pk=h.reduce((a,x)=>x[1]>(a?a[1]:-1)?x:a,null);
  const row=GR&&GR.rows.find(r=>r[2]===gid);
  const s=ws(k);
  el.innerHTML=`<div class="kpis k4">
    <div class="kpi"><div class="num">${cur?fmt(cur[1]):'–'}</div><div class="lbl">현재 고레이팅</div><div class="muted small" style="margin-top:2px">${cur?ymd(cur[0])+' 기준':''}</div></div>
    <div class="kpi"><div class="num">${row?row[0]+'위':'–'}</div><div class="lbl">고레이팅 세계 순위</div><div class="muted small" style="margin-top:2px">${row?GR.date+' 발표':'현재 순위표 밖'}</div></div>
    <div class="kpi"><div class="num">${pk?fmt(pk[1]):'–'}</div><div class="lbl">최고 고레이팅</div><div class="muted small" style="margin-top:2px">${pk?ymd(pk[0]):''}</div></div>
    <div class="kpi"><div class="num">${s?fmt(s[0]):'–'}</div><div class="lbl">이 사이트 실력 점수</div><div class="muted small" style="margin-top:2px">${s?'최고 '+fmt(s[3]):''}</div></div></div>
  <div class="mod"><div class="hd"><span>레이팅 변화</span><span class="desc">고레이팅과 이 사이트 실력 점수(월말)</span></div><div class="bd"><div style="height:300px"><canvas id="grc"></canvas></div></div></div>
  <div class="note">출처 <a href="https://www.goratings.org/ko/players/${encodeURIComponent(gid)}.html" target="_blank" rel="noopener">goratings.org 기사 페이지</a> — goratings.org(레미 쿨롬)가 go4go·u-go 기보로 계산한 WHR 레이팅입니다. 이 사이트의 전적·대국 기록은 한국기원 기록실 기준이며, 고레이팅의 대국 목록은 쓰지 않습니다.</div>`;
  const mon={};for(const [d,r] of h)mon[Math.floor(d/100)]=r;
  const wr={};for(const [m,r] of (WR[k]||[]))wr[m]=r;
  const g0=Math.min(...Object.keys(mon).map(Number));
  const ms=[...new Set([...Object.keys(mon),...Object.keys(wr)].map(Number))].sort((a,b)=>a-b);
  if(!ms.length)return;
  let lg=null,lw=null;const A=[],B=[];
  for(const m of ms){if(mon[m]!=null)lg=mon[m];if(wr[m]!=null)lw=wr[m];A.push(m>=g0?lg:null);B.push(lw);}
  mkChart('grc',{type:'line',data:{labels:ms.map(m=>String(m).slice(0,4)+'.'+String(m).slice(4)),datasets:[{label:'고레이팅',data:A,borderColor:cssv('--accent'),pointRadius:0,borderWidth:2,tension:.2,spanGaps:true},{label:'이 사이트 실력 점수',data:B,borderColor:cssv('--link'),pointRadius:0,borderWidth:1.5,borderDash:[4,3],tension:.2,spanGaps:true}]},options:{maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom'}},scales:{x:{...noGrid(),ticks:{maxTicksLimit:8}},y:gridY()}}});
}

/* 기사 외부 링크 (고레이팅 기사 페이지에서 가져온 위키백과·일본기원·Sensei's, 고레이팅) */
const LKLAB={ko:'위키백과',zh:'위키백과(中文)',ja:'위키백과(日本語)',en:'Wikipedia',nk:'일본기원',ss:"Sensei's Library"};
const LKURL={ko:v=>'https://ko.wikipedia.org/wiki/'+encodeURIComponent(v),zh:v=>'https://zh.wikipedia.org/wiki/'+encodeURIComponent(v),ja:v=>'https://ja.wikipedia.org/wiki/'+encodeURIComponent(v),en:v=>'https://en.wikipedia.org/wiki/'+encodeURIComponent(v.replace(/ /g,'_')),nk:v=>'https://www.nihonkiin.or.jp/player/htm/'+encodeURIComponent(v)+'.html',ss:v=>'https://senseis.xmp.net/?'+encodeURIComponent(v)};
function extLinks(k,p){
  const L=((p&&p.lk)||[]).filter(([t])=>LKURL[t]).sort((a,b)=>Object.keys(LKLAB).indexOf(a[0])-Object.keys(LKLAB).indexOf(b[0]));
  const gid=(X.GRK||{})[k];
  const a=L.map(([t,v])=>`<a href="${esc(LKURL[t](v))}" target="_blank" rel="noopener">${LKLAB[t]}</a>`);
  if(gid)a.push(`<a href="https://www.goratings.org/ko/players/${encodeURIComponent(gid)}.html" target="_blank" rel="noopener">고레이팅</a>`);
  return a.length?`<div class="plinks">${a.join('')}</div>`:'';
}

/* =============== RANKINGS =============== */
/* 모든 탭이 같은 틀: 탭 → 설명 한 줄 → 필터 막대(한 줄, 칸 고정) → 상위 3명 카드(높이 고정) → 표(열 너비 고정) → 계산 기준 */
const RSUB=[['','한국기원 랭킹'],['trend','한국랭킹 추이'],['china','중국 랭킹'],['japan','일본 랭킹'],['goratings','고레이팅'],['all','실력 점수'],['prize','상금']];
// 통산 기록·국제 우승·역대 1위·GOAT 는 '기록' 메뉴로 옮김 (예전 주소는 그쪽으로 넘김)
const RMOVED={overall:'',intl:'intl',legacy:'legacy',goat:'goat'};
const RALIAS={kr:['all',{c:'한국'}],cn:['all',{c:'중국'}],jp:['all',{c:'일본'}],women:['all',{g:'w'}]};
const RDESC={trend:'한국기원 랭킹 산정 방식을 2000년 이전 기록부터 그대로 적용해 다시 계산한 한국 기사 랭킹의 변화입니다(계산값). 한국기원이 지금 방식을 쓴 2009년 이전은 당시 발표와 다를 수 있습니다.',
  '':'한국기원이 매달 발표하는 공식 랭킹입니다. \'실시간 환산\'은 같은 방식으로 최근 대국까지 반영해 본 계산값입니다.',
  china:'중국바둑협회(中国围棋协会)가 매달 발표하는 등급분(等级分) 순위입니다. 활동 기사 전체와 여자 기사 순위를 봅니다.',
  japan:'일본은 협회 공식 랭킹이 없어, 囲碁棋譜.COM이 대국 결과로 매기는 碁力(기력) 점수 순위를 매달 받아 옵니다.',
  prize:'한국기원이 매달 발표하는 프로기사 상금 순위(그해 누적 상금)입니다.',
  all:'시대가 다른 기사도 비교할 수 있게 한국기원 기록 전체에 중국·일본 기사의 자국 대국을 더해 계산한 실력 점수(WHR) 순위입니다.',
  goratings:'goratings.org(레미 쿨롬)가 매일 발표하는 세계 바둑 기사 레이팅 순위입니다.',
  overall:'통산 승수·대국 수·승률·우승 횟수 순위입니다.',
  intl:'메이저 국제기전(후지쯔·응씨·LG·삼성화재·춘란 등)과 그 밖의 국제 대회·통합 타이틀전·초청전 우승 횟수 순위입니다.',
  legacy:'해마다 연말 실력 점수 1위였던 기사와 1위를 가장 오래 지킨 기사, 그리고 고레이팅 역대 1~3위입니다.',
  goat:'우승·최고 실력 점수·연말 1위·정상급 맞대결·통산 승수를 함께 따진 역대 순위(계산값)입니다.'};
const CTRY_OPTS=[['all','전체'],['한국','한국'],['중국','중국'],['일본','일본'],['대만','대만']];
/* 열 종류별 고정 너비 — 모든 랭킹 표가 같은 값을 씀 */
const RCW={rk:60,mv:76,pl:0,ct:96,num:120,sp:116};
/* 미니 차트 — pts=[[라벨(YYYYMM 등), 값, 덧붙일 말]], 왼쪽이 옛날. 오른쪽 끝 점이 지금 */
function rkSpark(pts,o={}){
  pts=(pts||[]).filter(p=>p&&p[1]!=null&&isFinite(p[1]));
  if(pts.length<2)return '<span class="muted small">–</span>';
  const W=96,H=26,P=3,v=pts.map(p=>+p[1]);let lo=Math.min(...v),hi=Math.max(...v);if(hi-lo<1e-9){lo-=1;hi+=1;}
  const x=i=>P+(W-2*P)*i/(pts.length-1),y=val=>{const t=(val-lo)/(hi-lo);return o.inv?P+(H-2*P)*t:H-P-(H-2*P)*t;};
  const d=pts.map((p,i)=>`${x(i).toFixed(1)},${y(+p[1]).toFixed(1)}`).join(' ');
  const a=v[0],b=v[v.length-1],better=o.inv?b<a:b>a,worse=o.inv?b>a:b<a,cls=better?'up':worse?'dn':'eq';
  const f=o.f||(n=>fmt(Math.round(n))),lb=o.lab||(l=>typeof l==='number'&&l>99999?ymstr(l):String(l));
  const tip=`${o.t||'추이'} ${lb(pts[0][0])} ${f(a)}${o.u||''} → ${lb(pts[pts.length-1][0])} ${f(b)}${o.u||''} (최고 ${f(o.inv?lo:hi)} · 최저 ${f(o.inv?hi:lo)}, ${pts.length}개 시점)`;
  return `<span class="spk ${cls}" title="${esc(tip)}"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><polyline points="${d}"/><circle cx="${x(pts.length-1).toFixed(1)}" cy="${y(b).toFixed(1)}" r="2.4"/></svg></span>`;
}
/* 한국기원 공식 랭킹 기사별 점수·순위 이력 */
let KOS=null;function koSeries(k,upto,n){if(!KOS){KOS={};Object.keys(KO).sort().forEach(m=>KO[m].forEach(r=>(KOS[r[1]]=KOS[r[1]]||[]).push([+m.replace('-',''),r[2],r[0]])));}
  const a=(KOS[k]||[]).filter(p=>!upto||p[0]<=upto);return a.slice(-(n||12));}
/* 실력 점수(WHR) 월별 이력 — upto(YYYYMM) 까지 최근 n개월 */
function whrSeries(k,upto,n){const a=WR[k];if(!a)return [];const lim=upto||a[a.length-1][0],from=(()=>{const y=(lim/100)|0,m=lim%100;const t=y*12+m-1-(n||24);return ((t/12)|0)*100+t%12+1;})();return a.filter(p=>p[0]<=lim&&p[0]>from).map(p=>[p[0],p[1]]);}
const rkTd=i=>`<td class="n c rkn${i<=3?' t'+i:''}"><i>${i}</i></td>`;
const dash='<span class="muted">–</span>';
const pf=k=>`<span class="pfl">${flag((PBY[k]||{}).c)||'<i></i>'}</span>${plink(k)}`;
function rkTable(holder,rows,cols,rowFn){
  const colw=cols.map(c=>RCW[c[1]]),thcls=cols.map(c=>c[1]==='num'?'r':c[1]==='rk'||c[1]==='mv'?'c':'');
  const minw=colw.reduce((a,w)=>a+(w||170),0);
  pagedTable(holder,rows,cols.map(c=>c[0]),rowFn,50,{sticky:true,colw,thcls,minw,empty:'조건에 맞는 기사가 없습니다'});
}
const pillGroup=(id,label,opts,cur)=>`<div class="fg"><span class="fl">${label}</span><div class="pills" id="${id}">${opts.map(([v,l])=>`<button class="pill" data-v="${v}" aria-pressed="${String(cur)===String(v)}">${l}</button>`).join('')}</div></div>`;
const selSlot=(id,label)=>`<div class="fg"><span class="fl" id="${id}l">${label}</span><select class="q rsel" id="${id}"></select></div>`;
function fillSel(id,label,opts,cur,on){const s=document.getElementById(id);document.getElementById(id+'l').textContent=label;s.innerHTML=opts.map(([v,l])=>`<option value="${v}" ${String(cur)===String(v)?'selected':''}>${l}</option>`).join('');s.disabled=!on;}
function bindPills(id,fn){const el=document.getElementById(id);if(!el)return;el.onclick=e=>{const b=e.target.closest('button');if(!b)return;el.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));fn(b.dataset.v);};}
function rkShell(el,filters){el.innerHTML=`<div class="fbar rfbar">${filters}</div><div id="rpod" class="goat3 rpod"></div><div id="rtab" class="rtab"></div><div class="note" id="rnote"></div>`;}
function podium(items){
  const cards=items.slice(0,3).map((x,i)=>{const p=PBY[x.k];const nk=isNK(x.k);const tag=nk?'div':'a';const nm=nameOf(x.k);
    return `<${tag} class="gcard" ${nk?'':`href="#/players/${encodeURIComponent(x.k)}"`} title="${esc(nm+' — '+(x.t||x.s||'').replace(/<[^>]+>/g,''))}"><span class="gr">${i+1}</span><div class="ph">${photo(p,nm)}</div><div class="gk-b"><div class="gk-n">${flag((p||{}).c)} ${esc(nm)}</div><div class="gk-s">${x.v}<small>${x.u||''}</small></div><div class="gk-l">${x.s||''}</div></div></${tag}>`;});
  while(cards.length<3)cards.push('<div class="gcard gempty"></div>');
  document.getElementById('rpod').innerHTML=cards.join('');
}
const mvTxt=(now,prev)=>prev==null?'새로 진입':now<prev?'▲'+(prev-now):now>prev?'▼'+(now-prev):'변동 없음';
/* 같은 조건(국가·성별)으로 다시 줄 세운 과거 순위 */
function rerank(map,keep){const m={};Object.keys(map).filter(keep).sort((a,b)=>map[a]-map[b]).forEach((k,i)=>m[k]=i+1);return m;}
function pRankings(sub,q){
  sub=sub||'';q=q||{};
  if(RMOVED.hasOwnProperty(sub)){routeGo('#/records'+(RMOVED[sub]?'/'+RMOVED[sub]:'')+(routeH().includes('?')?routeH().slice(routeH().indexOf('?')):''),1);return;}
  if(RALIAS[sub]){q={...RALIAS[sub][1],...q};sub=RALIAS[sub][0];}
  if(!RSUB.some(t=>t[0]===sub))sub='';
  app.innerHTML=crumb([['홈','#/'],['랭킹']])+`<h1 class="pt">랭킹</h1><nav class="tabs">${RSUB.map(([s,l])=>`<a href="#/rankings${s?'/'+s:''}" class="${sub===s?'on':''}">${l}</a>`).join('')}</nav>${sub==='all'?scopeBar():''}<p class="lede rdesc">${RDESC[sub]}</p><div id="rk"></div>`;
  ({'':rkKba,trend:rkTrend,china:rkCnr,japan:rkJpr,prize:rkPrize,all:rkSkill,goratings:rkGoratings,overall:rkOverall,intl:rkIntl,legacy:rkLegacy,goat:rkGoat})[sub](document.getElementById('rk'),q);
}
function rkKba(el,q){
  const months=Object.keys(KO).sort();const latest=months[months.length-1];
  if(!latest){el.innerHTML='<div class="empty">한국기원 랭킹 자료가 아직 없습니다</div>';return;}
  const st={v:q.v==='live'?'live':'off',m:q.m&&KO[q.m]?q.m:latest,g:q.g==='w'?'w':'all'};
  const ym=m=>m.slice(0,4)+'년 '+(+m.slice(5))+'월';
  const offRank={};KO[latest].forEach(r=>offRank[r[1]]=r);
  const live=Object.entries(KR).sort((a,b)=>b[1][0]-a[1][0]);const liveRank={};live.forEach(([k],i)=>liveRank[k]=i+1);
  const lastD=dstr(META.krank?META.krank.asof:LASTD);
  rkShell(el,pillGroup('kv','보기',[['off','공식 랭킹'],['live','실시간 환산']],st.v)+selSlot('km','발표')+pillGroup('kg','대상',[['all','전체'],['w','여자']],st.g));
  const sel=()=>st.v==='off'?fillSel('km','발표',months.slice().reverse().map(m=>[m,ym(m)]),st.m,true):fillSel('km','반영',[['',lastD+'까지']],'',false);
  bindPills('kv',v=>{st.v=v;sel();draw();});
  bindPills('kg',v=>{st.g=v;draw();});
  document.getElementById('km').onchange=e=>{st.m=e.target.value;draw();};
  const isW=k=>{const p=PBY[k];return p?p.g==='여자':/\(여\)/.test(k);};
  const chg=v=>v>0?`<span class="mv up">▲${v}</span>`:v<0?`<span class="mv dn">▼${-v}</span>`:'<span class="mv">–</span>';
  const sc=v=>v>0?`<span class="mv up">+${fmt(v)}</span>`:v<0?`<span class="mv dn">${fmt(v)}</span>`:'<span class="muted">0</span>';
  sel();draw();
  function draw(){
    const el2=document.getElementById('rtab'),nt=document.getElementById('rnote');
    if(st.v==='off'){
      // 여자: 한국기원이 따로 발표하는 여자 랭킹(순위·변동)이 있으면 그것을 씀
      const KW=st.g==='w'&&KOW[st.m]?KOW[st.m]:null;const allR={};KO[st.m].forEach(r=>allR[r[1]]=r[0]);
      let rows=KO[st.m];if(st.g==='w')rows=KW||rows.filter(r=>isW(r[1]));
      const rk=r=>st.g==='w'&&!KW?rows.indexOf(r)+1:r[0];const allOf=r=>st.g==='w'&&KW?(allR[r[1]]||'–'):r[0];
      podium(rows.slice(0,3).map(r=>({k:r[1],v:fmt(r[2]),u:'점',s:`랭킹 점수 · 지난달 대비 ${r[3]>0?'▲'+r[3]:r[3]<0?'▼'+(-r[3]):'변동 없음'}<br>${st.g==='w'?'전체 '+allOf(r)+'위 · ':''}실시간 환산 ${liveRank[r[1]]?liveRank[r[1]]+'위':'–'}`})));
      const um=+st.m.replace('-','');
      rkTable(el2,rows,[['순위','rk'],['변동','mv'],['기사','pl'],['랭킹 점수','num'],['12개월 추이','sp'],['점수 변동','num'],['실시간 환산','num'],['최근 대국','num']],x=>x.map(r=>`<tr>${rkTd(rk(r))}<td class="c">${chg(r[3])}</td><td class="pc">${pf(r[1])}${st.g==='w'?` <span class="muted small">전체 ${allOf(r)}위</span>`:''}</td><td class="n r"><b>${fmt(r[2])}</b></td><td class="c">${rkSpark(koSeries(r[1],um),{t:'랭킹 점수',u:'점'})}</td><td class="n r">${sc(r[4])}</td><td class="n r">${liveRank[r[1]]?liveRank[r[1]]+'위':dash}</td><td class="n r">${KR[r[1]]?dstr(KR[r[1]][2]):dash}</td></tr>`).join(''));
      nt.innerHTML=`한국기원이 발표한 ${ym(st.m)} 공식 ${KW?'여자 ':''}랭킹 그대로입니다. 변동은 지난달 대비이고, '12개월 추이'는 발표된 달마다의 랭킹 점수입니다. '실시간 환산'은 '보기 › 실시간 환산'의 순위입니다.`;
    }else{
      let rows=live;if(st.g==='w')rows=rows.filter(([k])=>isW(k));
      const offW=st.g==='w'?KO[latest].filter(r=>isW(r[1])).map(r=>r[1]):null;
      const orOf=k=>{const o=offRank[k];if(!o)return null;return offW?offW.indexOf(k)+1:o[0];};
      podium(rows.slice(0,3).map(([k,v])=>{const or=orOf(k);return {k,v:fmt(v[0]),u:'점',s:`환산 점수 · ${or?'공식 '+or+'위':'공식 순위 없음'}<br>최근 대국 ${dstr(v[2])}`};}));
      rkTable(el2,rows,[['순위','rk'],['변동','mv'],['기사','pl'],['환산 점수','num'],['추이','sp'],['공식 점수','num'],['공식 순위','num'],['최근 대국','num']],x=>x.map(([k,v])=>{const i=rows.findIndex(z=>z[0]===k)+1;const o=offRank[k];const or=orOf(k);return `<tr>${rkTd(i)}<td class="c">${or?mvHtml(i,or):'<span class="mv new">NEW</span>'}</td><td class="pc">${pf(k)}</td><td class="n r"><b>${fmt(v[0])}</b></td><td class="c">${rkSpark(koSeries(k,0,11).concat([['지금',v[0]]]),{t:'공식 점수 → 실시간 환산',u:'점'})}</td><td class="n r">${o?fmt(o[2]):dash}</td><td class="n r">${or?or+'위':dash}</td><td class="n r">${dstr(v[2])}</td></tr>`;}).join(''));
      nt.innerHTML=`실시간 환산 ${calc('한국기원 랭킹과 같은 Elo 방식(K='+(META.krank?META.krank.k:14)+'), 공식 점수 눈금에 맞춤. 공식 순위와 순위 상관 0.99')} — 한국기원 랭킹과 같은 방식으로 ${lastD}까지의 대국을 반영해 계산했습니다. 변동은 ${ym(latest)} 공식 순위 대비입니다. 최근 2년 안에 대국이 있는 한국 기사만 넣었습니다.`;
    }
  }
}
function rkSkill(el,q){
  const st={mode:['now','at','peak'].includes(q.mode)?q.mode:'now',y:+q.y||YEARS[YEARS.length-1],c:q.c||SCOPE_C(),g:q.g==='w'?'w':'all',era:q.era||'all'};
  rkShell(el,pillGroup('rm','기준',[['now','지금'],['at','연도 말'],['peak','역대 최고']],st.mode)+selSlot('rs','연도')+pillGroup('rc','국가',CTRY_OPTS,st.c)+pillGroup('rg','대상',[['all','전체'],['w','여자']],st.g));
  const sel=()=>st.mode==='at'?fillSel('rs','연도',YEARS.slice().reverse().map(y=>[y,y+'년']),st.y,true):st.mode==='peak'?fillSel('rs','시대',ERAS,st.era,true):fillSel('rs','연도',[['',dstr(META.whr.asof||LASTD).slice(0,7)+' 기준']],'',false);
  bindPills('rm',v=>{st.mode=v;sel();draw();});
  bindPills('rc',v=>{st.c=v;draw();});bindPills('rg',v=>{st.g=v;draw();});
  document.getElementById('rs').onchange=e=>{if(st.mode==='at')st.y=+e.target.value;else st.era=e.target.value;draw();};
  sel();draw();
  function draw(){
    const women=st.g==='w';const keep=k=>{const p=PBY[k];if(women&&!(p&&p.g==='여자'))return false;if(st.c!=='all'&&!(p&&p.c===st.c))return false;return true;};
    const rows=[];
    for(const k in WS){const s=WS[k];if(s[7]<RANK_MIN||!keep(k))continue;
      if(st.mode==='now'){if(s[1]>UNC_MAX||((s[2]/100)|0)<META.active_since_year)continue;rows.push([k,s[0],s[1],s[2]]);}
      else if(st.mode==='peak'){if(st.era!=='all'){const py=(s[4]/100)|0,e=+st.era;if(e===1950?py>=1960:(py<e||py>=e+10))continue;}rows.push([k,s[3],null,s[4]]);}
      else{const w=whrAt(k,st.y*100+12);if(!w)continue;const ly=(w[0]/100)|0;if(st.y-ly>=META.active_window)continue;if(w[2]>UNC_MAX)continue;
        let n=0;for(const g of BYK[k]){if(g.y>st.y)break;if(!g.j)n++;}if(n<RANK_MIN)continue;rows.push([k,w[1],w[2],w[0]]);}
    }
    rows.sort((a,b)=>b[1]-a[1]);
    const now=st.mode==='now',peak=st.mode==='peak';
    const prev=peak?null:rerank(now?rankAt((LASTD/100|0)-100):rankAt((st.y-1)*100+12),keep);
    const cmp=now?'1년 전 대비':(st.y-1)+'년 말 대비';
    podium(rows.slice(0,3).map((r,i)=>({k:r[0],v:fmt(r[1]),u:'점',s:peak?`역대 최고 실력 점수 · ${ymstr(r[3])} 기록<br>통산 ${fmt(rec(r[0]).g)}국`:`${now?'실력 점수':st.y+'년 말 실력 점수'} ±${r[2]}<br>${cmp} ${mvTxt(i+1,prev[r[0]])}`})));
    document.getElementById('rnote').innerHTML=`실력 점수 ${calc('WHR(w²='+META.whr.w2+') 계산값')} — 통산 ${RANK_MIN}국 이상·오차 ±${UNC_MAX} 이내 기사만 순위에 넣습니다. 계산 기준일 ${dstr(META.whr.asof||LASTD)}. ${META.whr.extra?`중국·일본 기사의 자국 대국 ${fmt(META.whr.extra.n)}국(${esc(META.whr.extra.src)}, ${esc(META.whr.extra.at)} 기준)을 계산에 함께 넣었습니다. `:''}${now?`'지금'은 최근 ${META.active_window}년 안에 대국이 있는 기사입니다. `:''}${peak?'':`변동은 ${now?'1년 전':'전년 말'} 같은 조건(국가·대상) 순위와 비교한 값입니다. `}${women?`여자는 성별 정보가 '여자'인 기사만 다시 줄 세운 것입니다(중국기원 소속 ${fmt(META.cn_no_gender)}명은 성별 정보가 없어 빠질 수 있음). `:''}한국기원에 기록된 대국 기준이라 중국·일본 국내 대회는 일부만 반영됩니다.`;
    const el2=document.getElementById('rtab');
    if(!rows.length&&st.mode==='at'&&st.y<1956){el2.innerHTML='<div class="empty">이 시기는 기록이 부족해 순위를 내지 않습니다(표본 부족).</div>';return;}
    const upto=now?0:peak?null:st.y*100+12;
    const ser=r=>peak?(()=>{const y=(r[3]/100)|0,m=r[3]%100;return whrSeries(r[0],(y+2)*100+m,48);})():whrSeries(r[0],upto,24);
    rkTable(el2,rows,[['순위','rk'],['변동','mv'],['기사','pl'],['실력 점수','num'],[peak?'최고점 앞뒤 2년':'2년 추이','sp'],[peak?'기록 시기':'오차','num'],['통산 대국','num'],['역대 최고 순위','num']],x=>x.map(r=>{const i=rows.indexOf(r)+1;return `<tr>${rkTd(i)}<td class="c">${peak?'<span class="mv">–</span>':mvHtml(i,prev[r[0]])}</td><td class="pc">${pf(r[0])}</td><td class="n r"><b>${fmt(r[1])}</b></td><td class="c">${rkSpark(ser(r),{t:'실력 점수'})}</td><td class="n r">${r[2]!=null?'±'+r[2]:ymstr(r[3])}</td><td class="n r">${fmt(rec(r[0]).g)}</td><td class="n r">${peakRank(r[0],women)}위</td></tr>`;}).join(''));
  }
}
const PEAKR={};function peakRank(k,women){const key=women?'w':'a';if(!PEAKR[key]){const m={};Object.entries(WS).filter(([x,s])=>s[7]>=RANK_MIN&&(!women||(PBY[x]&&PBY[x].g==='여자'))).sort((a,b)=>b[1][3]-a[1][3]).forEach(([x],i)=>m[x]=i+1);PEAKR[key]=m;}return PEAKR[key][k]||'–';}
function rkOverall(el,q){
  const BY=[['wins','승수'],['games','대국 수'],['pct','승률'],['titles','우승']];
  const st={by:BY.some(b=>b[0]===q.by)?q.by:'wins',scope:q.scope==='all'?'all':'active',c:q.c||SCOPE_C()};
  rkShell(el,pillGroup('ob','기준',BY,st.by)+pillGroup('os','범위',[['active','현역'],['all','전체(은퇴·작고 포함)']],st.scope)+pillGroup('oc','국가',CTRY_OPTS,st.c));
  bindPills('ob',v=>{st.by=v;draw();});bindPills('os',v=>{st.scope=v;draw();});bindPills('oc',v=>{st.c=v;draw();});
  document.getElementById('rnote').innerHTML=`현역 여부는 기사 정보의 '현역' 표기 기준입니다(표기가 없으면 '전체'에서만 나옵니다). 승률은 통산 ${RANK_MIN}국 이상, 무승부·무효 제외. 우승은 결승·도전기 다승자 판정 ${calc('결승 대국으로 판정한 우승, 동점 미확정 제외')}입니다.`;
  draw();
  function draw(){
    let keys=Object.keys(BYK);if(st.scope==='active')keys=keys.filter(k=>PBY[k]&&(PBY[k].st||'').includes('현역'));
    if(st.c!=='all')keys=keys.filter(k=>PBY[k]&&PBY[k].c===st.c);
    const val={wins:k=>rec(k).w,games:k=>rec(k).g,pct:k=>{const r=rec(k);return r.w+r.l>=RANK_MIN?r.w/(r.w+r.l):-1;},titles:k=>(CHB[k]||[]).length}[st.by];
    const rows=keys.map(k=>[k,val(k)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
    const big=k=>{const r=rec(k);return st.by==='wins'?[fmt(r.w),'승']:st.by==='games'?[fmt(r.g),'국']:st.by==='pct'?[wpct(r),'']:[(CHB[k]||[]).length,'회'];};
    podium(rows.slice(0,3).map(([k])=>{const r=rec(k);const [v,u]=big(k);return {k,v,u,s:`통산 ${fmt(r.g)}국 ${fmt(r.w)}승 ${fmt(r.l)}패<br>승률 ${wpct(r)} · 우승 ${(CHB[k]||[]).length}회`};}));
    const b=(f,v)=>st.by===f?'<b>'+v+'</b>':v;
    rkTable(document.getElementById('rtab'),rows,[['순위','rk'],['기사','pl'],['통산 대국','num'],['승','num'],['패','num'],['승률','num'],['우승','num']],x=>x.map(([k])=>{const r=rec(k);const i=rows.findIndex(z=>z[0]===k)+1;return `<tr>${rkTd(i)}<td class="pc">${pf(k)}</td><td class="n r">${b('games',fmt(r.g))}</td><td class="n r">${b('wins',fmt(r.w))}</td><td class="n r">${fmt(r.l)}</td><td class="n r">${b('pct',wpct(r))}</td><td class="n r">${b('titles',(CHB[k]||[]).length||dash)}</td></tr>`;}).join(''));
  }
}
/* GOAT — 우승·정점·전성기·정상급 맞대결·통산을 합친 역대 순위(계산값, 시대 보정 포함) */
let GOATC=null;
function goatData(){
  if(GOATC)return GOATC;
  const gcat={};{const cnt={};for(let t=0;t<T.length;t++){const g=TG[t],c=CATS[TC[t]];(cnt[g]=cnt[g]||{})[c]=(cnt[g][c]||0)+1;}for(const g in cnt)gcat[g]=Object.entries(cnt[g]).sort((a,b)=>b[1]-a[1])[0][0];}
  // 시대 보정: 그해 연말 실력 점수 상위 10명 평균으로 '경쟁 수준'을 재서 0.5~1.0 배율
  const yrs=YEARS.filter(y=>y>=1956&&y<YEARS[YEARS.length-1]);const yr={},str={};
  for(const y of yrs){const m=rankAt(y*100+12);yr[y]=m;const top=Object.keys(m).filter(k=>m[k]<=10).map(k=>whrAt(k,y*100+12)[1]);str[y]=top.length?top.reduce((a,b)=>a+b,0)/top.length:0;}
  const sv=Object.values(str).filter(Boolean),smx=Math.max(...sv),smn=Math.min(...sv);
  const ef=y=>str[y]?0.5+0.5*(str[y]-smn)/(smx-smn):1;
  const rows=[];
  for(const k in BYK){const s=WS[k];const r=rec(k);const tl=CHB[k]||[];if(r.g<300&&!tl.length)continue;
    const ia=IX?ixAgg()[k]:null;let w=0,dm=0,ot=0,dadj=0;tl.forEach(c=>{const ct=gcat[c.g],y=(c.d/10000)|0;if(ct==='세계기전'){if(!IX)w++;}else if(ct==='국내기전'){dm++;dadj+=ef(y);}else{ot++;dadj+=0.3*ef(y);}});
    let no1=0,no1n=0,t3=0;for(const y of yrs){const rk=yr[y][k];if(rk===1){no1+=ef(y);no1n++;}if(rk&&rk<=3)t3+=ef(y);}
    if(IX)w=ia?ia.major:0;rows.push({k,w,dm,ot,dadj,peak:s&&s[7]>=100?s[3]:0,pkym:s?s[4]:0,no1,no1n,t3,wins:r.w,g:r.g});}
  // 정상급 맞대결: 우승·정점 기준 상위 25명끼리의 승률
  const E=new Set(rows.slice().sort((a,b)=>(b.w*8+b.dadj+(b.peak-3000)/20)-(a.w*8+a.dadj+(a.peak-3000)/20)).slice(0,25).map(x=>x.k));
  const hw={},hn={};for(const k of E){for(const g of BYK[k]||[]){if(g.j)continue;const o=g.wk===k?g.lk:g.wk;if(!E.has(o)||o===k)continue;hn[k]=(hn[k]||0)+1;if(g.wk===k)hw[k]=(hw[k]||0)+1;}}
  rows.forEach(x=>{x.hw=hw[x.k]||0;x.hn=hn[x.k]||0;x.h2h=E.has(x.k)?(x.hw+5)/(x.hn+10):0;});
  const mx=f=>Math.max(1e-9,...rows.map(f));const MX={w:mx(x=>x.w),dadj:mx(x=>x.dadj),no1:mx(x=>x.no1),t3:mx(x=>x.t3),wins:mx(x=>x.wins),h2h:mx(x=>x.h2h)};
  const pk=rows.map(x=>x.peak).filter(Boolean);const pmax=Math.max(...pk),pmin=pmax-900;
  rows.forEach(x=>{x.n={w:x.w/MX.w,d:x.dadj/MX.dadj,peak:x.peak?Math.max(0,(x.peak-pmin)/(pmax-pmin)):0,no1:x.no1/MX.no1,t3:x.t3/MX.t3,wins:x.wins/MX.wins,h2h:x.h2h/MX.h2h};});
  return GOATC=rows;
}
const GOATW={bal:['균형',{w:30,d:15,peak:15,no1:15,t3:5,wins:10,h2h:10}],title:['우승 중심',{w:40,d:25,peak:10,no1:10,t3:5,wins:5,h2h:5}],peak:['정점 중심',{w:15,d:5,peak:30,no1:20,t3:10,wins:5,h2h:15}]};
const GOATL={w:'메이저 국제기전 우승',d:'국내 기전 우승(시대 보정)',peak:'최고 실력 점수',no1:'연말 1위(시대 보정)',t3:'연말 3위 안(시대 보정)',wins:'통산 승수',h2h:'정상급 맞대결 승률'};
function rkGoat(el,q){
  const st={w:GOATW[q.w]?q.w:'bal',c:q.c||SCOPE_C()};
  rkShell(el,pillGroup('gw','가중치',Object.entries(GOATW).map(([v,[l]])=>[v,l]),st.w)+pillGroup('gc','국가',CTRY_OPTS,st.c));
  bindPills('gw',v=>{st.w=v;draw();});bindPills('gc',v=>{st.c=v;draw();});
  draw();
  function draw(){
    const W8=GOATW[st.w][1];
    let rows=goatData().map(x=>({...x,sc:Object.keys(W8).reduce((a,f)=>a+W8[f]*x.n[f],0)}));
    if(st.c!=='all')rows=rows.filter(x=>(PBY[x.k]||{}).c===st.c);
    rows.sort((a,b)=>b.sc-a.sc);rows=rows.slice(0,100);
    const full=x=>[x.w?`메이저 국제기전 우승 ${x.w}회`:'',x.dm?`국내 기전 우승 ${x.dm}회`:'',x.peak?`최고 실력 점수 ${fmt(x.peak)}(${ymstr(x.pkym)})`:'',x.no1n?`연말 1위 ${x.no1n}회`:'',`통산 ${fmt(x.wins)}승`].filter(Boolean).join(' · ');
    podium(rows.slice(0,3).map(x=>({k:x.k,v:x.sc.toFixed(1),u:'점',t:full(x),s:`메이저 우승 ${x.w}회 · 국내 우승 ${x.dm}회<br>연말 1위 ${x.no1n}회 · 통산 ${fmt(x.wins)}승`})));
    rkTable(document.getElementById('rtab'),rows,[['순위','rk'],['기사','pl'],['GOAT 점수','num'],['메이저 우승','num'],['국내 우승','num'],['최고 실력 점수','num'],['연말 1위','num'],['정상급 맞대결','num'],['통산 승','num']],x=>x.map(r=>{const i=rows.indexOf(r)+1;return `<tr>${rkTd(i)}<td class="pc">${pf(r.k)}</td><td class="n r"><b>${r.sc.toFixed(1)}</b></td><td class="n r">${r.w||dash}</td><td class="n r">${r.dm||dash}</td><td class="n r">${r.peak?fmt(r.peak):dash}</td><td class="n r">${r.no1n||dash}</td><td class="n r">${r.hn?r.hw+'-'+(r.hn-r.hw):dash}</td><td class="n r">${fmt(r.wins)}</td></tr>`;}).join(''));
    document.getElementById('rnote').innerHTML=`GOAT 점수 ${calc('각 항목을 최고 기록 대비 0~1로 바꾼 뒤 가중치를 곱해 더한 값(100점 만점)')} = ${Object.entries(W8).map(([f,v])=>GOATL[f]+' '+v+'%').join(' + ')}.<br>
    <b>시대 보정</b> — 그해 연말 실력 점수 상위 10명의 평균으로 경쟁 수준을 재서, 국내 기전 우승과 연말 순위에 0.5~1.0배를 곱합니다(1960~80년대 약 0.6, 지금 1.0). 메이저 국제기전 우승은 보정 없이 그대로 셉니다(국제기전 우승 정리표 기준 — 한국기원 기록에 없는 후지쯔배 등도 포함, <a href="#/records/intl">국제 우승 순위</a>).<br>
    <b>정상급 맞대결</b> — 우승·최고 점수 기준 상위 25명끼리 둔 대국의 승률입니다.<br>
    우승은 결승 대국으로 판정한 계산값이고, 실력 점수·연말 순위는 WHR 계산값입니다. <b>중국·일본 기사의 자국 국내 기전 우승은 아직 넣지 않았습니다</b> — 국내 기전·연말 순위·통산 승수는 한국기원 기록에 실린 대국만 반영해 중국·일본 기사가 실제보다 낮게 나옵니다. 통산 300국 이상이거나 우승이 있는 기사만 넣었습니다.`;
  }
}
function rkLegacy(el,q){
  const GH=X.GH||null;
  const views=[['year','연도별 1위'],['reign','연속 재위']].concat(GH?[['gor','고레이팅 1~3위'],['gorw','고레이팅 여자 1~3위']]:[]);
  const st={v:views.some(v=>v[0]===q.v)?q.v:'year'};
  const runs=[];LEG.forEach(([y,k])=>{const last=runs[runs.length-1];if(k&&last&&last.k===k&&last.y1===y-1)last.y1=y;else if(k)runs.push({k,y0:y,y1:y});});
  const cnt={};LEG.forEach(([y,k])=>{if(k)cnt[k]=(cnt[k]||0)+1;});
  const best={};runs.forEach(r=>{const n=r.y1-r.y0+1;if(!best[r.k]||n>best[r.k].y1-best[r.k].y0+1)best[r.k]=r;});
  rkShell(el,pillGroup('lv','보기',views,st.v));
  bindPills('lv',v=>{st.v=v;draw();});
  const gname=x=>x?(x[1]?pf(x[1]):`<span class="pfl"><i></i></span>${esc(x[0])}`):dash;
  draw();
  function draw(){
    const el2=document.getElementById('rtab'),nt=document.getElementById('rnote');
    if(st.v==='gor'||st.v==='gorw'){
      const rows=(GH[st.v==='gor'?'m':'w']||[]).slice().reverse();
      const c1={};rows.forEach(r=>{const x=r[1];if(x){const id=x[1]||'n:'+x[0];(c1[id]=c1[id]||{x,n:0}).n++;}});
      podium(Object.entries(c1).sort((a,b)=>b[1].n-a[1].n).slice(0,3).map(([id,o])=>({k:o.x[1]||'n:'+o.x[0],v:o.n,u:'회',s:`고레이팅 1월 1일 기준 1위 횟수<br>${st.v==='gor'?'전체':'여자'} 역대 순위`})));
      const legY={};LEG.forEach(([y,k])=>legY[y]=k);
      rkTable(el2,rows,[['연도','rk'],['1위','pl'],['2위','pl'],['3위','pl']].concat(st.v==='gor'?[['이 사이트 전년 말 1위','pl']]:[]),x=>x.map(r=>`<tr><td class="n c">${r[0].slice(0,4)}</td><td class="pc">${gname(r[1])}</td><td class="pc">${gname(r[2])}</td><td class="pc">${gname(r[3])}</td>${st.v==='gor'?`<td class="pc">${legY[+r[0].slice(0,4)-1]?pf(legY[+r[0].slice(0,4)-1]):dash}</td>`:''}</tr>`).join(''));
      nt.innerHTML=`출처 <a href="https://www.goratings.org/ko/${st.v==='gor'?'history':'ladies'}/" target="_blank" rel="noopener">goratings.org 역대 ${st.v==='gor'?'':'여성 '}레이팅</a> — 해마다 1월 1일 기준 고레이팅 1~3위입니다(연도는 1월 1일이 속한 해).${st.v==='gor'?" '이 사이트 전년 말 1위'는 이 사이트 실력 점수로 계산한 바로 앞 해 연말 1위로, 같은 시점을 비교한 것입니다.":''}`;
      return;
    }
    podium(Object.entries(cnt).sort((a,b)=>b[1]-a[1]||best[b[0]].y1-best[a[0]].y1).slice(0,3).map(([k,n])=>{const b=best[k];return {k,v:n,u:'회',s:`연말 1위 횟수<br>최장 연속 ${b.y1-b.y0+1}년(${b.y0}–${b.y1})`};}));
    nt.innerHTML=`연말 1위 ${calc('그해 말 기준 실력 점수(WHR) 1위, 그 시점 통산 '+RANK_MIN+'국 이상')} — 위 카드는 연말 1위 횟수 순입니다. 시대가 다르면 1위 점수 자체가 달라지므로(비교 대상 기사가 달라짐) 점수보다 '그 시점 1위'라는 순위로 보는 것을 권합니다.`;
    if(st.v==='year'){
      const rows=LEG.slice().reverse();
      const nth={};{let prev=null,c=0;LEG.forEach(([y,k])=>{c=k&&k===prev?c+1:1;prev=k;nth[y]=c;});}
      rkTable(el2,rows,[['연도','rk'],['1위','pl'],['실력 점수','num'],['연속','num']],x=>x.map(([y,k,r])=>`<tr><td class="n c"><a class="pl" href="#/seasons/${y}">${y}</a></td><td class="pc">${k?pf(k):'<span class="muted">표본 부족</span>'}</td><td class="n r">${k?'<b>'+fmt(r)+'</b>':dash}</td><td class="n r">${k?nth[y]+'년째':dash}</td></tr>`).join(''));
    }else{
      const rows=runs.slice().sort((a,b)=>(b.y1-b.y0)-(a.y1-a.y0)||b.y1-a.y1);
      rkTable(el2,rows,[['순위','rk'],['기사','pl'],['재위 기간','num'],['연속','num']],x=>x.map(r=>{const i=rows.indexOf(r)+1;return `<tr>${rkTd(i)}<td class="pc">${pf(r.k)}</td><td class="n r">${r.y0===r.y1?r.y0:r.y0+'–'+r.y1}</td><td class="n r"><b>${r.y1-r.y0+1}년</b></td></tr>`;}).join(''));
    }
  }
}

/* =============== RECORDS =============== */
let RECS=null;
function buildRecords(){
  if(RECS)return RECS;
  const st={};for(const k in BYK)st[k]=streaks(k);
  const A=yagg();
  const ys=[];for(const y in A){const a=A[y];for(const k in a.n){ys.push({k,y:+y,w:a.w[k]||0,n:a.n[k]});}}
  const pairs={};for(const g of GSC){if(g.j)continue;const [a,b]=g.wk<g.lk?[g.wk,g.lk]:[g.lk,g.wk];const id=a+'|'+b;pairs[id]=(pairs[id]||0)+1;}
  const champAge=CHAMP.filter(c=>c.st===0&&PBY[c.ck]&&PBY[c.ck].b).map(c=>({k:c.ck,a:ageAt(PBY[c.ck].b,c.d),d:c.d,g:c.g})).filter(x=>x.a!=null&&x.a>5);
  const debut=Object.keys(BYK).filter(k=>PBY[k]&&PBY[k].b).map(k=>({k,a:ageAt(PBY[k].b,rec(k).first),d:rec(k).first})).filter(x=>x.a!=null&&x.a>5);
  const span=Object.keys(BYK).map(k=>{const r=rec(k);return {k,yrs:((r.last/10000)|0)-((r.first/10000)|0),d0:r.first,d1:r.last};});
  const longG=GSC.filter(g=>g.r[3]).sort((a,b)=>b.r[3]-a.r[3]).slice(0,30);
  const w1000=[];for(const k in BYK){const p=PBY[k];if(!p||!p.b)continue;let c=0;for(const g of BYK[k]){if(!g.j&&g.wk===k){c++;if(c===1000){w1000.push({k,a:ageAt(p.b,g.d),d:g.d});break;}}}}
  RECS={st,ys,pairs,champAge,debut,span,longG,w1000};return RECS;
}
const RECTABS=[['','대국 목록'],['history','역대 기록']];
const recTabs=sub=>`<nav class="tabs">${RECTABS.map(([t,l])=>`<a href="#/records${t?'/'+t:''}" class="${sub===t?'on':''}">${l}</a>`).join('')}</nav>`;
function pRecords(q){
  app.innerHTML=recHead('streaks')+`<p class="lede">대국 기록을 날짜순으로 훑어 계산한 연속·최다 기록입니다. ${calc('무승부·무효는 연속 기록에서 건너뜀')}</p>
  <div class="fbar"><div class="fg"><span class="fl">시대</span><select class="q" id="xe" style="min-width:110px">${ERAS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div><div class="fg"><span class="fl">국가</span><select class="q" id="xc" style="min-width:90px"><option value="all">전체</option>${['한국','중국','일본','대만'].map(c=>`<option>${c}</option>`).join('')}</select></div></div><div id="xr"><div class="skel" style="margin-top:16px"></div></div>`;
  const $=id=>document.getElementById(id);$('xc').value=SCOPE_C();
  setTimeout(()=>{buildRecords();draw();},20);
  $('xe').onchange=draw;$('xc').onchange=draw;
  function draw(){
    const R=buildRecords();const era=$('xe').value,cc=$('xc').value;
    const inEra=d=>{if(era==='all')return true;const y=(d/10000)|0,e=+era;return e===1950?y<1960:(y>=e&&y<e+10);};
    const okC=k=>cc==='all'||(PBY[k]&&PBY[k].c===cc);
    const top=(arr,n=10)=>arr.slice(0,n);
    const cards=[
      ['최다 연승',top(Object.entries(R.st).filter(([k,s])=>okC(k)&&s.bw&&inEra(s.bwE)).sort((a,b)=>b[1].bw-a[1].bw)).map(([k,s])=>[k,s.bw+'연승',dstr(s.bwS)+' ~ '+dstr(s.bwE)])],
      ['최다 연패',top(Object.entries(R.st).filter(([k,s])=>okC(k)&&s.bl&&inEra(s.blE)).sort((a,b)=>b[1].bl-a[1].bl)).map(([k,s])=>[k,s.bl+'연패',dstr(s.blS)+' ~ '+dstr(s.blE)])],
      ['한 해 최다승',top(R.ys.filter(x=>okC(x.k)&&inEra(x.y*10000+101)).sort((a,b)=>b.w-a.w)).map(x=>[x.k,x.w+'승',x.y+'년 · '+x.n+'국'])],
      ['한 해 최다 대국',top(R.ys.filter(x=>okC(x.k)&&inEra(x.y*10000+101)).sort((a,b)=>b.n-a.n)).map(x=>[x.k,x.n+'국',x.y+'년 · '+x.w+'승'])],
      ['한 해 최고 승률 (40국 이상)',top(R.ys.filter(x=>x.n>=40&&okC(x.k)&&inEra(x.y*10000+101)).sort((a,b)=>b.w/b.n-a.w/a.n)).map(x=>[x.k,pct(x.w,x.n),x.y+'년 · '+x.w+'승 '+(x.n-x.w)+'패'])],
      ['최연소 우승',top(R.champAge.filter(x=>okC(x.k)&&inEra(x.d)).sort((a,b)=>a.a-b.a||a.d-b.d)).map(x=>[x.k,'만 '+x.a+'세',dstr(x.d)+' · '+G[x.g]])],
      ['최고령 우승',top(R.champAge.filter(x=>okC(x.k)&&inEra(x.d)).sort((a,b)=>b.a-a.a||a.d-b.d)).map(x=>[x.k,'만 '+x.a+'세',dstr(x.d)+' · '+G[x.g]])],
      ['최연소 첫 대국',top(R.debut.filter(x=>okC(x.k)&&inEra(x.d)).sort((a,b)=>a.a-b.a)).map(x=>[x.k,'만 '+x.a+'세',dstr(x.d)])],
      ['가장 긴 활동 기간',top(R.span.filter(x=>okC(x.k)&&inEra(x.d1)).sort((a,b)=>b.yrs-a.yrs)).map(x=>[x.k,x.yrs+'년',dstr(x.d0).slice(0,4)+' ~ '+dstr(x.d1).slice(0,4)])],
      ['통산 최다승',top(Object.keys(BYK).filter(okC).map(k=>[k,rec(k).w]).sort((a,b)=>b[1]-a[1])).map(([k,v])=>[k,fmt(v)+'승',fmt(rec(k).g)+'국'])],
      ['통산 최다 우승',top(Object.entries(CHB).filter(([k])=>okC(k)).map(([k,v])=>[k,v.filter(c=>inEra(c.d)).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1])).map(([k,v])=>[k,v+'회',''])],
      ['최연소 1000승',top(R.w1000.filter(x=>okC(x.k)&&inEra(x.d)).sort((a,b)=>a.a-b.a)).map(x=>[x.k,'만 '+x.a+'세',dstr(x.d)])],
      ['가장 많이 만난 상대',top(Object.entries(R.pairs).filter(([id])=>{const [a,b]=id.split('|');return okC(a)||okC(b);}).sort((a,b)=>b[1]-a[1])).map(([id,n])=>{const [a,b]=id.split('|');return [a,n+'국','상대 '+nameOf(b),b];})],
      ['가장 긴 대국(수순)',top(R.longG.filter(g=>inEra(g.d)&&(okC(g.wk)||okC(g.lk)))).map(g=>[g.wk,g.r[3]+'수',dstr(g.d)+' · '+T[g.ti]])],
      ['실력 점수 역대 최고점',top(Object.entries(WS).filter(([k,s])=>s[7]>=RANK_MIN&&okC(k)&&inEra(s[4]*100+1)).sort((a,b)=>b[1][3]-a[1][3])).map(([k,s])=>[k,fmt(s[3]),ymstr(s[4])])],
    ];
    $('xr').innerHTML=`<div class="rcards">${cards.map(([t,list],ci)=>`<div class="rcard"><h3><span>${t}</span></h3>${list.length?`<ol>${list.map((x,i)=>`<li data-i="${i}" ${i>=3?'hidden':''}><span class="i">${i+1}</span><span>${plink(x[0])}${x[3]?' · '+plink(x[3]):''}<span class="s">${esc(x[2])}</span></span><span class="v">${esc(x[1])}</span></li>`).join('')}</ol>${list.length>3?`<button class="linkbtn" data-more="${ci}" style="margin-top:6px">더보기</button>`:''}`:'<div class="empty">이 조건에 해당하는 기록이 없습니다</div>'}</div>`).join('')}</div>
    <div class="note">나이 기록은 생년월일이 있는 기사만 대상이며 만 나이입니다. 수순 기록은 결과 문장에 수순이 적힌 대국(${META.moves_pct}%)만 대상입니다.</div>`;
    $('xr').querySelectorAll('[data-more]').forEach(b=>b.onclick=()=>{const ol=b.previousElementSibling;const hid=[...ol.querySelectorAll('li[hidden]')];if(hid.length){hid.forEach(li=>li.hidden=false);b.textContent='접기';}else{[...ol.querySelectorAll('li')].forEach((li,i)=>li.hidden=i>=3);b.textContent='더보기';}});
  }
}

/* =============== COMPARE =============== */
function keyFromInput(v){v=(v||'').trim();if(!v)return '';if(PBY[v]||BYK[v])return v;const p=P.find(p=>p.n===v||KNAME[p.k]===v);if(p)return p.k;if(BYK['n:'+v])return 'n:'+v;return '?'+v;}
function pCompare(q){
  const a=q.p1||'',b=q.p2||'';
  app.innerHTML=crumb([['홈','#/'],['상대전적']])+`<h1 class="pt">상대전적</h1><p class="lede">두 기사의 맞대결을 대회별·시대별로 비교합니다. 주소를 그대로 공유할 수 있습니다.</p>
  <div class="pick2"><input class="q" id="ca" list="cl" placeholder="기사 A" value="${esc(a&&!a.startsWith('?')?nameOf(a):a.replace(/^\?/,''))}"><span class="vs">VS</span><input class="q" id="cb" list="cl" placeholder="기사 B" value="${esc(b&&!b.startsWith('?')?nameOf(b):b.replace(/^\?/,''))}"><datalist id="cl">${Object.keys(BYK).filter(k=>rec(k).g>=20).map(k=>`<option value="${esc(nameOf(k))}">`).join('')}</datalist></div>
  <div id="cr"></div>`;
  const $=id=>document.getElementById(id);
  const go=()=>{const ka=keyFromInput($('ca').value),kb=keyFromInput($('cb').value);if(ka&&kb)routeGo(`#/players/compare?p1=${encodeURIComponent(ka)}&p2=${encodeURIComponent(kb)}`);};
  $('ca').onchange=go;$('cb').onchange=go;
  const el=$('cr');
  if(!a||!b){el.innerHTML='<div class="empty">두 기사의 이름을 입력하거나 아래 기록에서 고르세요.</div>'+bestH2H();return;}
  for(const x of [a,b])if(x.startsWith('?')||(!PBY[x]&&!BYK[x])){el.innerHTML=`<div class="empty">${esc(x.replace(/^\?|^n:/,''))}을(를) 찾을 수 없습니다. <a class="pl" href="#/players">기사 목록에서 찾기</a></div>`;return;}
  const gs=(BYK[a]||[]).filter(g=>(g.wk===a&&g.lk===b)||(g.wk===b&&g.lk===a));
  const aw=gs.filter(g=>!g.j&&g.wk===a).length,bw=gs.filter(g=>!g.j&&g.wk===b).length,dr=gs.filter(g=>g.j).length;
  const jn=v=>gs.filter(g=>g.j===v).length,unof=gs.filter(g=>g.of!==1).length;
  const midx=[jn(1)?`무승부 ${jn(1)}`:'',jn(2)?`무효 ${jn(2)}`:'',jn(3)?`양자패 ${jn(3)}`:'',unof?`비공식 ${unof}국 포함`:''].filter(Boolean).join(' · ');
  const ra=rec(a),rb=rec(b),sa=ws(a),sb=ws(b);
  const byT={},byE={};gs.forEach(g=>{if(g.j)return;const t=byT[g.g]=byT[g.g]||[0,0];const e=byE[Math.floor(g.y/10)*10]=byE[Math.floor(g.y/10)*10]||[0,0];if(g.wk===a){t[0]++;e[0]++;}else{t[1]++;e[1]++;}});
  el.innerHTML=`<div class="cmp"><div class="side a"><div class="nm">${plink(a)}</div><div class="sc">${aw}</div></div><div class="mid">${gs.length?gs.length+'국'+(midx?' · '+midx:''):'맞대결 없음'}</div><div class="side b"><div class="nm">${plink(b)}</div><div class="sc">${bw}</div></div></div>
  ${gs.length?`<div class="bar2"><span class="a" style="width:${aw/gs.length*100}%"></span><span class="c" style="width:${dr/gs.length*100}%"></span><span class="b" style="width:${bw/gs.length*100}%"></span></div>`:''}
  <div style="display:flex;justify-content:flex-end"><button class="btn" id="share">이 비교 링크 복사</button></div>
  ${fxPredict(a,b)}
  <section class="panel"><h2 class="sec"><span>나란히 보기</span></h2><div class="tw sticky"><table><thead><tr><th>항목</th><th class="r">${esc(nameOf(a))}</th><th class="r">${esc(nameOf(b))}</th></tr></thead><tbody>
  ${[['통산 전적',`${fmt(ra.w)}승 ${fmt(ra.l)}패`,`${fmt(rb.w)}승 ${fmt(rb.l)}패`],['통산 승률',wpct(ra),wpct(rb)],['우승 '+calc('결승·도전기 다승자'),(CHB[a]||[]).length,(CHB[b]||[]).length],['현재 실력 점수 '+calc('WHR'),sa?fmt(sa[0]):'–',sb?fmt(sb[0]):'–'],['역대 최고점',sa?fmt(sa[3])+' ('+ymstr(sa[4])+')':'–',sb?fmt(sb[3])+' ('+ymstr(sb[4])+')':'–'],['활동 기간',ra.first?dstr(ra.first).slice(0,4)+'–'+dstr(ra.last).slice(0,4):'–',rb.first?dstr(rb.first).slice(0,4)+'–'+dstr(rb.last).slice(0,4):'–']].map(([k,x,y])=>`<tr><td>${k}</td><td class="n r">${x}</td><td class="n r">${y}</td></tr>`).join('')}</tbody></table></div></section>
  ${gs.length?`<div class="g2"><section class="panel"><h2 class="sec"><span>대회별 맞대결</span></h2><div class="tw sticky"><table><thead><tr><th>대회</th><th class="r">${esc(nameOf(a))}</th><th class="r">${esc(nameOf(b))}</th></tr></thead><tbody>${Object.entries(byT).sort((x,y)=>(y[1][0]+y[1][1])-(x[1][0]+x[1][1])).map(([g,[x,y]])=>`<tr><td><a class="pl" href="#/tournaments/${g}">${esc(G[g])}</a></td><td class="n r">${x}</td><td class="n r">${y}</td></tr>`).join('')}</tbody></table></div></section>
  <section class="panel"><h2 class="sec"><span>시대별 맞대결</span></h2><div class="tw"><table><thead><tr><th>시대</th><th class="r">${esc(nameOf(a))}</th><th class="r">${esc(nameOf(b))}</th></tr></thead><tbody>${Object.entries(byE).sort().map(([e,[x,y]])=>`<tr><td>${e}년대</td><td class="n r">${x}</td><td class="n r">${y}</td></tr>`).join('')}</tbody></table></div>
  <h3 style="font-size:14px;margin:16px 0 4px">최근 맞대결 흐름</h3><div class="seq">${gs.slice(-20).map(g=>g.j?'<i class="c" title="무">–</i>':g.wk===a?`<i class="a" title="${dstr(g.d)} ${esc(nameOf(a))} 승">A</i>`:`<i class="b" title="${dstr(g.d)} ${esc(nameOf(b))} 승">B</i>`).join('')}</div><div class="small muted">왼쪽이 오래된 대국 · A=${esc(nameOf(a))} 승, B=${esc(nameOf(b))} 승</div></section></div>
  <section class="panel"><h2 class="sec"><span>맞대결 목록</span><span class="desc">${gs.length}국 · 최신순</span></h2><div id="cg"></div></section>`:'<div class="empty" style="margin-top:12px">두 기사는 맞대결 기록이 없습니다.</div>'}`;
  $('share').onclick=()=>{const u=location.href;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>{$('share').textContent='복사했습니다';},()=>{prompt('이 주소를 복사하세요',u);});};
  if(gs.length)pagedTable($('cg'),gs.slice().reverse(),['날짜','결과','상대','대회','내용'],x=>gameRows(x,a),30);
}

/* best head-to-head records */
let BH=null;
function bestH2H(){
  if(!BH){const pair={},cur={},best={};
    for(const g of GSC){if(g.j)continue;const a=g.wk<g.lk?g.wk:g.lk,b=a===g.wk?g.lk:g.wk;const id=a+'|'+b;const o=pair[id]=pair[id]||{a,b,n:0,aw:0,last:0};o.n++;if(g.wk===a)o.aw++;o.last=g.d;
      const wkey=g.wk+'>'+g.lk,lkey=g.lk+'>'+g.wk;cur[wkey]=(cur[wkey]||0)+1;cur[lkey]=0;if(cur[wkey]>(best[wkey]||[0])[0])best[wkey]=[cur[wkey],g.d];}
    const arr=Object.values(pair);
    BH={most:arr.slice().sort((x,y)=>y.n-x.n).slice(0,20),
      rival:arr.filter(x=>x.n>=20).map(x=>({...x,idx:x.n*(1-Math.abs(x.aw/x.n-.5)*2)})).sort((x,y)=>y.idx-x.idx).slice(0,20),
      lop:arr.filter(x=>x.n>=15).map(x=>({...x,d:Math.max(x.aw,x.n-x.aw)/x.n})).sort((x,y)=>y.d-x.d||y.n-x.n).slice(0,20),
      streak:Object.entries(best).sort((x,y)=>y[1][0]-x[1][0]).slice(0,20).map(([k,v])=>{const [w,l]=k.split('>');return {w,l,n:v[0],d:v[1]};}),
      recent:arr.filter(x=>x.n>=10).sort((x,y)=>y.last-x.last).slice(0,20)};}
  const B=BH;const lk=(a,b)=>`<a class="pl" style="font-weight:400" href="#/players/compare?p1=${encodeURIComponent(a)}&p2=${encodeURIComponent(b)}">비교</a>`;
  let RI=0;const row=(x,v,s)=>`<div class="rk"><span class="i">${(RI=RI%20+1)}</span><span class="nm">${plink(x.a)} <span class="muted">vs</span> ${plink(x.b)}<small>${s}</small></span><span class="v">${v} ${lk(x.a,x.b)}</span></div>`;
  return `<div class="grid g3" style="margin-top:16px">
  <div class="mod"><div class="hd"><span>최다 맞대결</span><span class="desc">무승부·무효 제외</span></div><div class="bd">${B.most.map((x,i)=>row(x,x.n+'국',x.aw+'-'+(x.n-x.aw))).join('')}</div></div>
  <div class="mod"><div class="hd"><span>최고 라이벌 ${calc('맞대결 수 × (1 − |승률−0.5|×2), 20국 이상')}</span></div><div class="bd">${B.rival.map(x=>row(x,x.idx.toFixed(1),x.n+'국 '+x.aw+'-'+(x.n-x.aw))).join('')}</div></div>
  <div class="mod"><div class="hd"><span>특정 상대 최다 연승</span></div><div class="bd">${B.streak.map(x=>`<div class="rk"><span class="i"></span><span class="nm">${plink(x.w)} <span class="muted">→</span> ${plink(x.l)}<small>${dstr(x.d).slice(0,7)}까지</small></span><span class="v">${x.n}연승 ${lk(x.w,x.l)}</span></div>`).join('')}</div></div>
  <div class="mod"><div class="hd"><span>가장 일방적인 맞대결</span><span class="desc">15국 이상 · 승률 순</span></div><div class="bd">${B.lop.map(x=>{const [w,l]=x.aw*2>=x.n?[x.a,x.b]:[x.b,x.a];const ww=Math.max(x.aw,x.n-x.aw);return `<div class="rk"><span class="i"></span><span class="nm">${plink(w)} <span class="muted">vs</span> ${plink(l)}<small>${x.n}국</small></span><span class="v"><span class="rw">${ww}</span>-<span class="rl">${x.n-ww}</span> ${lk(w,l)}</span></div>`;}).join('')}</div></div>
  <div class="mod"><div class="hd"><span>최근에 이어진 맞대결</span><span class="desc">10국 이상</span></div><div class="bd">${B.recent.map(x=>row(x,x.aw+'-'+(x.n-x.aw),'마지막 '+dstr(x.last))).join('')}</div></div>
  </div><div class="note">모두 한국기원 기록에 남은 대국(공식·비공식 포함)으로 센 계산값이고, 무승부·무효는 뺐습니다. 이름을 누르면 기사 페이지, '비교'를 누르면 두 기사의 상대전적으로 갑니다.</div>`;
}

/* =============== 고레이팅 (goratings.org) =============== */
const GRCC={kr:'한국',cn:'중국',jp:'일본',tw:'대만',na:'북미',egf:'유럽'};
function rkGoratings(el,q){
  if(!GR||!GR.rows||!GR.rows.length){el.innerHTML='<div class="empty">고레이팅 자료가 아직 없습니다</div>';return;}
  const st={c:['kr','cn','jp','tw','etc'].includes(q.c)?q.c:'all',g:q.g==='w'?'w':'all'};
  {const d=document.querySelector('.rdesc');if(d)d.textContent+=` ${GR.date} 발표 기준입니다.`;}
  rkShell(el,pillGroup('gc','국가',[['all','전체'],['kr','한국'],['cn','중국'],['jp','일본'],['tw','대만'],['etc','기타']],st.c)+pillGroup('gg','대상',[['all','전체'],['w','여자']],st.g));
  bindPills('gc',v=>{st.c=v;draw();});bindPills('gg',v=>{st.g=v;draw();});
  document.getElementById('rnote').innerHTML=`출처 <a href="https://www.goratings.org/ko/" target="_blank" rel="noopener">goratings.org</a> — go4go·u-go 기보로 계산한 WHR 레이팅이며 매일 갱신됩니다. 이 사이트에는 최근 기록을 갱신할 때 함께 받아 옵니다(${GR.date} 기준, ${fmt(GR.rows.length)}명). '실력 점수'는 이 사이트가 한국기원 기록으로 따로 계산한 값입니다. '12개월 추이'는 goratings.org 기사별 점수 기록의 월말 값입니다. 이름을 누르면 이 사이트의 기사 페이지로, '↗'를 누르면 goratings.org 기사 페이지로 갑니다.`;
  const nmHtml=r=>{const c=GRCC[r[4]]||'';const f=flag(c)||'<i></i>';return `<span class="pfl">${f}</span>${r[6]?`<a class="pl" href="#/players/${encodeURIComponent(r[6])}">${esc(r[1])}</a>`:esc(r[1])}`;};
  const ext=r=>`<a class="muted" href="https://www.goratings.org/ko/players/${encodeURIComponent(r[2])}.html" target="_blank" rel="noopener" title="goratings.org 기사 페이지">↗</a>`;
  const sk=k=>{const s=k&&WS[k];return s?fmt(s[0]):dash;};
  draw();
  function draw(){
    let rows=GR.rows;
    if(st.c==='etc')rows=rows.filter(r=>!['kr','cn','jp','tw'].includes(r[4]));else if(st.c!=='all')rows=rows.filter(r=>r[4]===st.c);
    if(st.g==='w')rows=rows.filter(r=>r[3]===1);
    podium(rows.slice(0,3).map(r=>({k:r[6]||'n:'+r[1],v:fmt(r[5]),u:'점',s:`고레이팅 · 세계 ${r[0]}위${r[3]?' · 여자':''}<br>이 사이트 실력 점수 ${r[6]&&WS[r[6]]?fmt(WS[r[6]][0]):'–'}`})));
    const GRH=X.GRH||{},gm=+GR.date.slice(0,7).replace('-','');
    const gser=r=>{const a=(GRH[r[2]]||[]).filter(p=>p[0]<gm).slice(-11);return a.length?a.concat([[gm,+r[5]]]):[];};
    rkTable(document.getElementById('rtab'),rows,[['순위','rk'],['기사','pl'],['레이팅','num'],['12개월 추이','sp'],['세계 순위','num'],['실력 점수','num'],['원문','num']],x=>x.map(r=>{const i=rows.indexOf(r)+1;return `<tr>${rkTd(i)}<td class="pc">${nmHtml(r)}</td><td class="n r"><b>${fmt(r[5])}</b></td><td class="c">${rkSpark(gser(r),{t:'고레이팅'})}</td><td class="n r">${r[0]}위</td><td class="n r">${sk(r[6])}</td><td class="n r">${ext(r)}</td></tr>`;}).join(''));
  }
}


/* 한국랭킹 추이 — 한국기원 랭킹 산정 방식으로 다시 계산한 2000년 이후 한국 기사 순위(계산값) */
let KRH=X.KRH||null;
function rkTrend(el,q){
  if(!KRH||!KRH.mo||!KRH.mo.length){el.innerHTML='<div class="empty">한국랭킹 추이 자료가 아직 없습니다</div>';return;}
  const G=q.g==='w'&&KRH.w?'w':'all',H=G==='w'?{...KRH,...KRH.w}:KRH,MP=H.mpos||[10,50],allY=H.yrs.map(String).filter(y=>H.ye[y]),ay=(H.asof/100)|0,am=H.asof%100,Y0=+allY[0],Y1=+allY[allY.length-1];
  const ylab=y=>+y===ay&&am!==12?`${y}.${am}`:String(y);
  const aD=H.asofD||H.asof*100+31,part=((aD/100)|0)===H.asof,cur=`${am}월 ${aD%100}일`;
  const mlab=m=>part&&m===H.asof?`${cur}까지`:ymstr(m)+'월말';
  const anno=m=>part&&m===H.asof?'현재':ymstr(nx(m));
  const endLab={id:'endLab',afterDatasetsDraw(c){const ctx=c.ctx,ar=c.chartArea,it=[];
    c.data.datasets.forEach((ds,i)=>{if(!c.isDatasetVisible(i))return;let j=ds.data.length-1;while(j>=0&&ds.data[j]==null)j--;if(j<0)return;const pt=c.getDatasetMeta(i).data[j];if(pt)it.push({x:pt.x,y:pt.y,t:ds.label,c:ds.borderColor});});
    it.sort((a,b)=>a.y-b.y);const put=[];it.forEach(a=>{let y=a.y;for(let g=0;g<20;g++){const hit=put.find(b=>Math.abs(b.x-a.x)<70&&Math.abs(b.y-y)<13);if(!hit)break;y=hit.y+13;}a.y=Math.min(y,ar.bottom+6);put.push(a);});
    ctx.save();ctx.font=`700 12px ${getComputedStyle(document.body).fontFamily}`;ctx.textBaseline='middle';
    put.forEach(a=>{ctx.lineWidth=3;ctx.strokeStyle=cssv('--card')||'#fff';ctx.strokeText(a.t,a.x+6,a.y);ctx.fillStyle=a.c;ctx.fillText(a.t,a.x+6,a.y);});ctx.restore();}};
  const nx=m=>{let y=(m/100)|0,mm=m%100+1;if(mm>12){y++;mm=1;}return y*100+mm;};
  const yend=y=>+y===ay?H.asof:+y*100+12;
  // 기사별 월별 [월,순위,점수] → 찾기 표
  const PM={};Object.entries(H.ps).forEach(([k,a])=>{const m={};a.forEach(p=>m[p[0]]=p);PM[k]=m;});
  const yr={};allY.forEach(y=>{yr[y]={};H.ye[y].forEach((x,i)=>yr[y][x[0]]=i+1);});
  const rankAtY=(k,y)=>{const p=PM[k]&&PM[k][yend(y)];return p?p[1]:(yr[y][k]||null);};
  const ever1=[];H.mo.forEach(r=>{if(!ever1.includes(r[1]))ever1.push(r[1]);});
  const cand=Object.keys(H.ps).sort((a,b)=>nameOf(a).localeCompare(nameOf(b),'ko'));
  const okY=v=>{v=+v;return v>=Y0&&v<=Y1?v:null;};
  const st={c:['bump','score','top'].includes(q.c)?q.c:'bump',f:okY(q.from)||Y0,t:okY(q.to)||Y1,
    p:(q.p?String(q.p).split(',').filter(k=>H.ps[k]):[]).slice(0,10)};
  if(st.f>st.t)[st.f,st.t]=[st.t,st.f];
  const presetSel=()=>{const ms=H.mo.filter(r=>r[0]>=st.f*100+1&&r[0]<=st.t*100+12),o=[];ms.forEach(r=>{if(!o.includes(r[1]))o.push(r[1]);});
    if(o.length<4)ys().forEach(y=>H.ye[y].slice(0,3).forEach(x=>{if(o.length<6&&!o.includes(x[0])&&H.ps[x[0]])o.push(x[0]);}));return o.slice(0,10);};
  const ys=()=>allY.filter(y=>+y>=st.f&&+y<=st.t);
  if(!st.p.length)st.p=presetSel();
  const tip=`한국기원 랭킹 산정 방식(승률기대치 800 기준, k 14·21·28, 기전 가중치 1.0~2.5, 대국마다 +${H.rule.alpha})을 1941년 기록부터 적용. 공식 발표와 점수 중앙값을 맞추려고 +${fmt(H.off)}점`;
  const yopts=allY.map(y=>[y,ylab(y)]);
  el.innerHTML=`<div class="fbar rfbar">${pillGroup('kg','대상',[['all','전체'],['w','여자']],G)}${selSlot('kf','시작')}${selSlot('kt','끝')}<div class="fg"><span class="fl">빠른 선택</span><div class="pills" id="kq">${[['all','전체'],['2000','2000년대'],['2010','2010년대'],['2020','2020년대'],['10y','최근 10년']].map(([v,l])=>`<button class="pill" data-v="${v}" aria-pressed="false">${l}</button>`).join('')}</div></div></div>
  <div id="rpod" class="goat3 rpod"></div>
  <div class="mod"><div class="hd"><span>랭킹 추이 ${calc(tip)}</span><span class="desc" id="khd"></span></div><div class="bd">
    <div class="fbar rfbar">${pillGroup('kc','차트',[['bump','연말 순위'],['score','월별 점수'],['top',`1위·${MP[0]}위·${MP[1]}위 점수`]],st.c)}</div>
    <div class="krh-pick" id="kpk"><div class="krh-chips" id="kch"></div>
      <div class="krh-add"><input class="q" id="kin" list="kdl" placeholder="기사 이름으로 추가 (최대 10명)" autocomplete="off"><datalist id="kdl">${cand.map(k=>`<option value="${esc(nameOf(k))}">`).join('')}</datalist>
      <button class="pill" id="kp1" type="button">1위 경험자</button><button class="pill" id="kp5" type="button">기간 끝 TOP 5</button><button class="pill" id="kp0" type="button">모두 지우기</button></div></div>
    <div class="chart tall"><canvas id="khc"></canvas></div></div></div>
  <div class="mod krh-sec"><div class="hd"><span>연말 랭킹 TOP 10 추이표</span><span class="desc">위: 기사 · 아래: 랭킹 점수 · 고른 기사는 굵게</span></div><div class="bd flush"><div class="tw"><table class="krh-t" id="kt10"></table></div></div></div>
  <div class="mod krh-sec"><div class="hd"><span>기사별 연도별 순위</span><span class="desc" id="kpld"></span></div><div class="bd flush"><div class="tw"><table class="krh-t" id="kpl"></table></div></div></div>
  <div class="mod krh-sec"><div class="hd"><span>월별 1위 변천</span><span class="desc">발표월 = 전달 말까지 대국 반영</span></div><div class="bd flush"><div class="tw"><table class="krh-t" id="kn1"></table></div></div></div>
  <div class="mod krh-sec"><div class="hd"><span>연도별 요약</span></div><div class="bd flush"><div class="tw"><table class="krh-t" id="ksum"></table></div></div></div>
  <div class="note" id="rnote"></div>`;
  const cols=['--cat1','--cat2','--cat3','--cat4','--cat5','--cat6','--cat7','--cat8'].map(cssv);
  const colOf=k=>{const i=st.p.indexOf(k);return cols[i%8];};
  const fillY=()=>{fillSel('kf','시작',yopts,String(st.f),true);fillSel('kt','끝',yopts,String(st.t),true);};
  fillY();
  const setLink=()=>{const qs=new URLSearchParams();if(G==='w')qs.set('g','w');if(st.c!=='bump')qs.set('c',st.c);if(st.f!==Y0)qs.set('from',st.f);if(st.t!==Y1)qs.set('to',st.t);qs.set('p',st.p.join(','));routeRS('#/rankings/trend?'+qs.toString());};
  const setRange=(f,t)=>{st.f=Math.max(Y0,Math.min(f,t));st.t=Math.min(Y1,Math.max(f,t));fillY();all();};
  document.getElementById('kf').onchange=e=>setRange(+e.target.value,st.t);
  document.getElementById('kt').onchange=e=>setRange(st.f,+e.target.value);
  document.getElementById('kq').onclick=e=>{const b=e.target.closest('button');if(!b)return;const v=b.dataset.v;
    if(v==='all')setRange(Y0,Y1);else if(v==='10y')setRange(Y1-9,Y1);else setRange(+v,+v+9);};
  bindPills('kc',v=>{st.c=v;chart();setLink();});
  bindPills('kg',v=>{routeGo('#/rankings/trend'+(v==='w'?'?g=w':''));});
  const inp=document.getElementById('kin');
  const addBy=()=>{const n=inp.value.trim();if(!n)return;const k=cand.find(x=>nameOf(x)===n)||cand.find(x=>nameOf(x).includes(n));
    if(k&&!st.p.includes(k)){if(st.p.length>=10)st.p.shift();st.p.push(k);}inp.value='';chips();chart();tables();setLink();};
  inp.onchange=addBy;inp.onkeydown=e=>{if(e.key==='Enter')addBy();};
  document.getElementById('kp1').onclick=()=>{st.p=presetSel();chips();chart();tables();setLink();};
  document.getElementById('kp5').onclick=()=>{const y=String(st.t);st.p=H.ye[y].slice(0,5).map(x=>x[0]).filter(k=>H.ps[k]);chips();chart();tables();setLink();};
  document.getElementById('kp0').onclick=()=>{st.p=[];chips();chart();tables();setLink();};
  document.getElementById('kch').onclick=e=>{const b=e.target.closest('button[data-k]');if(!b)return;st.p=st.p.filter(k=>k!==b.dataset.k);chips();chart();tables();setLink();};
  function chips(){document.getElementById('kch').innerHTML=st.p.length?st.p.map(k=>`<button class="krh-chip" type="button" data-k="${esc(k)}" title="빼기"><i style="background:${colOf(k)}"></i>${esc(nameOf(k))} ×</button>`).join(''):'<span class="muted small">고른 기사가 없습니다 — 이름을 입력하거나 위 단추를 누르세요</span>';}
  function podiumRange(){const ms=H.mo.filter(r=>r[0]>=st.f*100+1&&r[0]<=st.t*100+12);const tot={},best={};
    ms.forEach(r=>{tot[r[1]]=(tot[r[1]]||0)+1;if(!best[r[1]]||r[2]>best[r[1]][0])best[r[1]]=[r[2],r[0]];});
    podium(Object.entries(tot).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,n])=>({k,v:fmt(n),u:'개월',s:`${st.f}~${ylab(st.t)} ${G==='w'?'여자 ':''}월별 1위 기간<br>최고 ${fmt(best[k][0])}점 (${mlab(best[k][1])})`})));}
  function chart(){
    charts.forEach(c=>{if(c.canvas&&c.canvas.id==='khc')c.destroy();});
    document.getElementById('kpk').hidden=st.c==='top';
    const hd=document.getElementById('khd'),Y=ys(),ms=H.mo.map(r=>r[0]).filter(m=>m>=st.f*100+1&&m<=st.t*100+12);
    const xtk=n=>{const w=((document.getElementById('khc')||{}).parentElement||{}).clientWidth||900,stp=Math.max(1,Math.ceil(n/Math.max(4,Math.floor(w/80))));
      return {...noGrid(),ticks:{maxRotation:0,autoSkip:false,callback:function(v,i){const L=this.getLabelForValue(v);return i===n-1||(i%stp===0&&n-1-i>=stp*0.9)?L:'';}}};};
    if(st.c==='bump'){
      const rs=st.p.flatMap(k=>Y.map(y=>rankAtY(k,y))).filter(v=>v);const mx=Math.min(100,Math.ceil(Math.max(10,...rs,1)/5)*5);
      hd.textContent=`${st.f}~${ylab(st.t)} · 고른 ${st.p.length}명의 연말 순위`;
      mkChart('khc',{type:'line',data:{labels:Y.map(ylab),datasets:st.p.map(k=>({label:nameOf(k),data:Y.map(y=>rankAtY(k,y)),borderColor:colOf(k),backgroundColor:colOf(k),borderDash:st.p.indexOf(k)>=8?[5,3]:undefined,borderWidth:2.2,pointRadius:3.5,pointHoverRadius:6,tension:0,spanGaps:false}))},
        plugins:[endLab],options:{maintainAspectRatio:false,layout:{padding:{right:74}},interaction:{mode:'nearest',intersect:false},plugins:{legend:{display:false},tooltip:{callbacks:{title:c=>{const y=Y[c[0].dataIndex];return +y===ay&&part?`${y}년 (${cur}까지)`:`${y}년 말`;},label:c=>{const k=st.p[c.datasetIndex],y=Y[c.dataIndex],p=PM[k]&&PM[k][yend(y)];return `${c.dataset.label} ${c.parsed.y}위${p?' · '+fmt(p[2])+'점':''}`;}}}},scales:{x:xtk(Y.length),y:{reverse:true,min:1,max:mx,ticks:{autoSkip:true,maxTicksLimit:10,precision:0,callback:v=>v+'위'},grid:{color:cssv('--rule-2')},border:{display:false}}}}});
    }else if(st.c==='score'){
      hd.textContent=`${st.f}~${ylab(st.t)} · 고른 ${st.p.length}명의 월말 랭킹 점수 (100위 안일 때, 마지막은 ${cur}까지)`;
      mkChart('khc',{type:'line',data:{labels:ms.map(ymstr),datasets:st.p.map(k=>({label:nameOf(k),data:ms.map(x=>PM[k][x]?PM[k][x][2]:null),borderColor:colOf(k),backgroundColor:colOf(k),borderDash:st.p.indexOf(k)>=8?[5,3]:undefined,borderWidth:1.8,pointRadius:ms.length<40?2:0,pointHoverRadius:4,tension:0,spanGaps:false}))},
        plugins:[endLab],options:{maintainAspectRatio:false,layout:{padding:{right:74}},interaction:{mode:'nearest',intersect:false},plugins:{legend:{display:false},tooltip:{callbacks:{title:c=>mlab(ms[c[0].dataIndex]),label:c=>{const p=PM[st.p[c.datasetIndex]][ms[c.dataIndex]];return `${c.dataset.label} ${fmt(c.parsed.y)}점 · ${p?p[1]+'위':''}`;}}}},scales:{x:xtk(ms.length),y:gridY()}}});
    }else{
      hd.textContent=`${st.f}~${ylab(st.t)} · ${G==='w'?'여자 ':''}월말 1위·${MP[0]}위·${MP[1]}위 랭킹 점수`;
      const mo=H.mo.filter(r=>ms.includes(r[0]));
      mkChart('khc',{type:'line',data:{labels:ms.map(ymstr),datasets:[[2,'1위',cols[0]],[5,MP[0]+'위',cols[1]],[6,MP[1]+'위',cols[2]]].map(([j,l,c])=>({label:l,data:mo.map(r=>r[j]),borderColor:c,backgroundColor:c,borderWidth:2,pointRadius:0,pointHoverRadius:4,tension:0}))},
        plugins:[endLab],options:{maintainAspectRatio:false,layout:{padding:{right:50}},interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{callbacks:{title:c=>mlab(ms[c[0].dataIndex])+' · 1위 '+nameOf(mo[c[0].dataIndex][1]),label:c=>`${c.dataset.label} ${fmt(c.parsed.y)}점`}}},scales:{x:xtk(ms.length),y:gridY()}}});
    }
  }
  function tables(){
    const Y=ys(),ry=Y.slice().reverse(),sel=new Set(st.p);
    document.getElementById('kt10').innerHTML=`<thead><tr><th class="l">연도</th>${[1,2,3,4,5,6,7,8,9,10].map(i=>`<th>${i}위</th>`).join('')}</tr></thead><tbody>${ry.map(y=>`<tr><td class="l"><b>${ylab(y)}</b></td>${H.ye[y].slice(0,10).map(x=>`<td class="${sel.has(x[0])?'on':''}">${plink(x[0])}<span class="sc">${fmt(x[1])}</span></td>`).join('')}</tr>`).join('')}</tbody>`;
    const pl={};Y.forEach(y=>H.ye[y].slice(0,10).forEach((x,i)=>{const p=pl[x[0]]||(pl[x[0]]={k:x[0],b:99,n:0,f:+y});p.b=Math.min(p.b,i+1);p.n++;}));
    st.p.forEach(k=>{if(!pl[k]){const r=Y.map(y=>rankAtY(k,y)).filter(v=>v);pl[k]={k,b:r.length?Math.min(...r):99,n:0,f:9999};}});
    const pls=Object.values(pl).sort((a,b)=>(sel.has(b.k)-sel.has(a.k))||a.b-b.b||b.n-a.n||a.f-b.f);
    document.getElementById('kpld').textContent=`고른 기사 + 기간 안에 연말 10위 안에 든 기사 · 100위 밖·랭킹 제외는 빈칸`;
    const hc=r=>r==null?'':r===1?'h1':r<=3?'h3':r<=10?'h10':'';
    document.getElementById('kpl').innerHTML=`<thead><tr><th class="l">기사</th><th>최고</th><th>10위 안</th>${Y.map(y=>`<th>${+y===ay&&am!==12?ylab(y).slice(2):String(y).slice(2)}</th>`).join('')}</tr></thead><tbody>${pls.map(p=>`<tr class="${sel.has(p.k)?'on':''}"><td class="l">${sel.has(p.k)?`<i class="krh-dot" style="background:${colOf(p.k)}"></i>`:''}${plink(p.k)}</td><td>${p.b<99?p.b+'위':''}</td><td>${p.n}년</td>${Y.map(y=>{const r=rankAtY(p.k,y);return `<td class="${hc(r)}">${r||''}</td>`;}).join('')}</tr>`).join('')}</tbody>`;
    const lo=st.f*100+1,hi=st.t*100+12,per=[];
    H.mo.filter(r=>r[0]>=lo&&r[0]<=hi).forEach(r=>{const p=per[per.length-1];if(p&&p.k===r[1]){p.to=r[0];p.n++;p.mx=Math.max(p.mx,r[2]);}else per.push({k:r[1],fr:r[0],to:r[0],n:1,mx:r[2]});});
    document.getElementById('kn1').innerHTML=`<thead><tr><th>#</th><th class="l">기사</th><th>시작</th><th>끝</th><th>개월</th><th>기간 중 최고점</th></tr></thead><tbody>${per.map((p,i)=>[i,p]).reverse().map(([i,p])=>`<tr class="${sel.has(p.k)?'on':''}"><td>${i+1}</td><td class="l">${plink(p.k)}</td><td>${anno(p.fr)}</td><td>${anno(p.to)}</td><td>${p.n}</td><td>${fmt(p.mx)}</td></tr>`).join('')}</tbody>`;
    document.getElementById('ksum').innerHTML=`<thead><tr><th class="l">연도</th><th>${G==='w'?'여자 기사 공식 대국':'한국 기사 공식 대국'}</th><th>랭킹 대상</th><th class="l">1위</th><th>1위 점수</th><th>1·2위 차</th><th>10위 점수</th><th>20위 점수</th></tr></thead><tbody>${ry.map(y=>{const a=H.ye[y];return `<tr><td class="l"><b>${ylab(y)}</b></td><td>${fmt(H.gc[y]||0)}</td><td>${fmt(H.ycnt[y]||0)}</td><td class="l">${plink(a[0][0])}</td><td>${fmt(a[0][1])}</td><td>${fmt(a[0][1]-a[1][1])}</td><td>${a[9]?fmt(a[9][1]):''}</td><td>${a[19]?fmt(a[19][1]):''}</td></tr>`;}).join('')}</tbody>`;
  }
  function all(){podiumRange();chips();chart();tables();setLink();}
  all();
  const vr=H.val||[],rho=vr.length?vr.reduce((a,v)=>a+(v[1]||0),0)/vr.length:null,mae=vr.length?vr.reduce((a,v)=>a+v[3],0)/vr.length:null,t10=vr.length?vr.reduce((a,v)=>a+v[2],0)/vr.length:null;
  document.getElementById('rnote').innerHTML=`계산 방법 — 승률기대치 = 1/(1+10^((상대 점수−내 점수)/${H.rule.div})), 점수 변동 = (결과−기대치)×k×가중치+${H.rule.alpha}. k는 그달 초 순위 1~50위 14, 51~100위 21, 101위 아래 28. 가중치는 제한기전 1.0, 종합기전 1.5, 바둑리그·중국 갑조리그 2.0, 세계대회 2.5(대회 이름으로 자동 분류). 3번기는 기대치 상한 0.65, 5번기 0.58. 랭킹 대상은 한국 기사 중 통산 ${H.rule.prov}국 이상이고 최근 1년 안에 대국한 기사. 공식 대국만 쓰고 무승부·무효는 뺐습니다. Elo 점수는 그때 기사들 사이의 상대 점수이고 대국마다 조금씩 더해지는 점수 때문에 해가 갈수록 전체 점수대가 오르므로, 시대가 다른 기사는 점수보다 순위로 비교하는 것이 맞습니다. ${G==='w'?'여자 순위는 같은 점수로 한국 여자 기사만 다시 줄 세운 것으로, 한국기원 여자 랭킹과 같은 방식입니다. ':''}고를 수 있는 기사는 2000년 이후 ${G==='w'?'여자 순위 ':''}월말 10위 안에 든 적 있는 ${cand.length}명입니다. 연말 기준이며 ${ay}년은 ${part?cur+'까지 대국을 반영한 현재 값':am+'월말 기준'}입니다. 월별 1위 변천의 '현재'는 이번 달 진행 중인 값입니다.${vr.length?` <br>검증 — 같은 계산을 한국기원 공식 ${G==='w'?'여자 ':''}랭킹 ${vr.length}개월(${vr[0][0]}~${vr[vr.length-1][0]})과 비교하면 상위 100명 순위 상관 평균 ${rho.toFixed(3)}, 상위 10명 일치 평균 ${t10.toFixed(1)}명, 상위 50명 점수 차 평균 ${mae.toFixed(1)}점입니다.`:''}`;
}

/* 중국 랭킹 — 중국바둑협회 월간 공식 랭킹(표로 받은 상위 30명·여자 상위 10명) */
let CNR=X.CNR||null;
function rkCnr(el,q){
  const months=CNR?Object.keys(CNR.months).sort():[];const latest=months[months.length-1];
  if(!latest){el.innerHTML='<div class="empty">중국 랭킹 자료가 아직 없습니다</div>';return;}
  const st={m:q.m&&CNR.months[q.m]?q.m:latest,g:q.g==='w'?'w':'all'};
  const ym=m=>m.slice(0,4)+'년 '+(+m.slice(5))+'월';
  const grOf={};if(GR)GR.rows.forEach(r=>{if(r[6])grOf[r[6]]=r;});
  rkShell(el,selSlot('cm','발표')+pillGroup('cg','대상',[['all','전체'],['w','여자']],st.g));
  fillSel('cm','발표',months.slice().reverse().map(m=>[m,ym(m)]),st.m,months.length>1);
  bindPills('cg',v=>{st.g=v;draw();});
  document.getElementById('cm').onchange=e=>{st.m=e.target.value;draw();};
  const chg=v=>v>0?`<span class="mv up">▲${v}</span>`:v<0?`<span class="mv dn">▼${-v}</span>`:'<span class="mv">–</span>';
  const f1=v=>Number(v).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1});
  const sc=v=>v>0?`<span class="mv up">+${f1(v)}</span>`:v<0?`<span class="mv dn">${f1(v)}</span>`:'<span class="muted">0</span>';
  const who=r=>r[2]&&PBY[r[2]]?pf(r[2]):`<span class="pfl">${flag('중국')}</span><span>${esc(r[1])}</span>`;
  const gr=r=>{const g=r[2]&&grOf[r[2]];return g?`${g[0]}위 <span class="muted small">${fmt(g[5])}</span>`:dash;};
  const CNS={};months.forEach(mm=>CNR.months[mm].open.forEach(r=>{const id=r[2]||'n:'+r[1];(CNS[id]=CNS[id]||[]).push([+mm.replace('-',''),+r[3],r[0]]);}));
  const cser=r=>(CNS[r[2]||'n:'+r[1]]||[]).filter(p=>p[0]<=+st.m.replace('-','')).slice(-12);
  const f1s=v=>Number(v).toLocaleString('ko-KR',{maximumFractionDigits:1});
  draw();
  function draw(){
    const m=CNR.months[st.m],el2=document.getElementById('rtab'),nt=document.getElementById('rnote');
    const rows=st.g==='w'?m.women:m.open;
    podium(rows.slice(0,3).filter(r=>r[2]&&PBY[r[2]]).map(r=>({k:r[2],v:f1(r[3]),u:'점',s:st.g==='w'?`여자 ${r[0]}위 · 남녀 통합 ${r[5]}위`:`랭킹 점수 · 지난달 대비 ${r[4]>0?'▲'+r[4]:r[4]<0?'▼'+(-r[4]):'변동 없음'}`})));
    if(st.g==='w')rkTable(el2,rows,[['순위','rk'],['변동','mv'],['기사','pl'],['랭킹 점수','num'],['12개월 추이','sp'],['남녀 통합 순위','num'],['통합 순위 변동','num'],['고레이팅','num']],x=>x.map(r=>`<tr>${rkTd(r[0])}<td class="c">${chg(r[4])}</td><td class="pc">${who(r)}</td><td class="n r"><b>${f1(r[3])}</b></td><td class="c">${rkSpark(cser(r),{t:'랭킹 점수',f:f1s})}</td><td class="n r">${r[5]}위</td><td class="n r">${chg(r[6])}</td><td class="n r">${gr(r)}</td></tr>`).join(''));
    else rkTable(el2,rows,[['순위','rk'],['변동','mv'],['기사','pl'],['랭킹 점수','num'],['12개월 추이','sp'],['점수 변동','num'],['고레이팅','num']],x=>x.map(r=>`<tr>${rkTd(r[0])}<td class="c">${chg(r[4])}</td><td class="pc">${who(r)}</td><td class="n r"><b>${f1(r[3])}</b></td><td class="c">${rkSpark(cser(r),{t:'랭킹 점수',f:f1s})}</td><td class="n r">${sc(r[5])}</td><td class="n r">${gr(r)}</td></tr>`).join(''));
    nt.innerHTML=`중국바둑협회가 발표한 ${ym(st.m)} 랭킹입니다${m.cycle?`(${String(m.cycle).slice(0,4)}년 ${+String(m.cycle).slice(4)}월 성적 기준, 활동 기사 ${m.open.length}명)`:''}. 변동은 지난달 대비이고, 여자 랭킹의 '남녀 통합 순위'는 전체 중국 랭킹에서의 순위입니다. 고레이팅은 goratings.org 세계 순위(${GR?esc(GR.date):'–'} 기준)입니다.`;
  }
}

/* =============== TOURNAMENTS =============== */
let TAGG=null;
function tagg(){if(TAGG)return TAGG;TAGG={};for(const g of GAMES){const a=TAGG[g.g]=TAGG[g.g]||{g:g.g,c:g.c,n:0,ps:new Set(),y0:g.y,y1:g.y,last:g.d};a.n++;a.ps.add(g.wk);a.ps.add(g.lk);if(g.y<a.y0)a.y0=g.y;if(g.y>a.y1)a.y1=g.y;if(g.d>a.last)a.last=g.d;}return TAGG;}
const TTABS=[['domestic','국내',['국내기전']],['world','세계',['세계기전']],['league','리그',['리그','협회리그','해외리그']],['etc','기타/미분류',['기타']]];
// 대회 페이지 위: 기전 기록 페이지 바로 가기
function tHubCards(){
  const C=[];
  if(typeof IX!=='undefined'&&IX){const M=IX.ev.filter(e=>e[4]==='major');C.push(['#/tournaments/intl','국제기전',`메이저 ${M.length}개 대회 ${M.reduce((a,e)=>a+e[10].length,0)}회 · 기타 국제 ${IX.ev.filter(e=>e[4]!=='major').reduce((a,e)=>a+e[10].length,0)}회`,'1988~ 후지쯔·응씨·LG·삼성화재·춘란…']);}
  if(typeof DX!=='undefined'&&DX)for(const [s,l,d] of [['open','국내 종합기전','국수·명인·왕위·기성·GS칼텍스…'],['women','여자기전','여자국수·여류명인·여자기성·최고기사…'],['limited','제한기전','신인·시니어·입신·프로아마 오픈'],['world','세계 여자·시니어·신예','오청원배·센코컵·궁륭산병성배·글로비스배·페어…'],['team','단체전·리그','농심신라면배·바둑리그·여자리그·정관장배…']]){const ss=DX.se.filter(x=>x[3]===s);C.push(['#/tournaments/'+s,l,`${ss.length}개 계열 · 우승 ${fmt(ss.reduce((a,x)=>a+x[6].length,0))}회`,d]);}
  return C.length?`<div class="thub">${C.map(([h,l,n,d])=>`<a href="${h}"><b>${l} ›</b><span class="n">${n}</span><span class="d">${d}</span></a>`).join('')}</div>`:'';
}
/* ---------- 대회 허브: 현황판 ---------- */
const tHf=k=>{if(!k)return '';const p=PBY[k];return (p&&FLAG[p.c]?flag(p.c)+' ':'')+dxNm(k);};
function tHolders(){
  const cols=[];const last=s=>s[6][s[6].length-1];
  if(typeof IX!=='undefined'&&IX){const L=IX.ev.filter(e=>e[4]==='major'&&e[7]&&e[10].length).map(e=>{const r=e[10][e[10].length-1];return {n:e[1],k:r[2],y:r[4]?(r[4]/10000)|0:r[1],h:e[9]&&e[9].length?'#/tournaments/'+e[9][e[9].length-1]:'#/tournaments/intl'};}).sort((a,b)=>b.y-a.y);cols.push(['세계 메이저','#/tournaments/intl',L]);}
  if(typeof DX!=='undefined'&&DX){
    const mk=(f)=>DX.se.filter(s=>s[5]&&s[6].length&&f(s)).map(s=>({n:s[1],k:last(s)[2],y:dxY(last(s)),h:dxGid(s)})).sort((a,b)=>b.y-a.y);
    cols.push(['한국','#/tournaments/open',mk(s=>(s[3]==='open'&&s[4]==='main')||(s[3]==='women'&&s[4]==='women')).slice(0,10)]);
    if(DX.sections.jp)cols.push(['일본','#/tournaments/jp',mk(s=>s[3]==='jp'&&(s[4]==='jp7'||s[4]==='jpw'))]);
    if(DX.sections.cn)cols.push(['중국','#/tournaments/cn',mk(s=>s[3]==='cn'&&s[4]==='cnmain').slice(0,10)]);
  }
  return `<div class="thold">${cols.map(([t,h,L])=>`<section><header><h3>${t}</h3><a href="${h}">전체 ›</a></header><ul>${L.map(x=>`<li><span class="t">${x.h?`<a class="pl" href="${x.h}">${esc(x.n)}</a>`:esc(x.n)}</span><span class="w">${tHf(x.k)}</span><span class="y">${x.y}</span></li>`).join('')}</ul></section>`).join('')}</div>`;
}
function tMap(){
  const C=[];const cnt=sec=>{const ss=DX.se.filter(x=>x[3]===sec);return `${ss.length}개 기전 · 우승 ${fmt(ss.reduce((a,x)=>a+x[6].length,0))}회`;};
  const W=[],K=[],J=[],N=[];
  if(typeof IX!=='undefined'&&IX){const M=IX.ev.filter(e=>e[4]==='major');W.push(['#/tournaments/intl','메이저 국제기전',`${M.length}개 대회 · 우승 ${M.reduce((a,e)=>a+e[10].length,0)}회`]);W.push(['#/tournaments/intl/events','그 밖의 국제·초청전',`우승 ${IX.ev.filter(e=>e[4]!=='major').reduce((a,e)=>a+e[10].length,0)}회`]);}
  if(typeof DX!=='undefined'&&DX){
    W.push(['#/tournaments/world','세계 여자·시니어·신예',cnt('world')]);
    K.push(['#/tournaments/open','종합기전',cnt('open')],['#/tournaments/women','여자기전',cnt('women')],['#/tournaments/limited','제한기전',cnt('limited')],['#/tournaments/team','단체전·리그',cnt('team')]);
    if(DX.sections.jp){J.push(['#/tournaments/jp','일본 기전 개요',cnt('jp')],['#/tournaments/jp/years','7대 타이틀 연도표','1941년 본인방전부터'],['#/tournaments/jp/events','기전별 역대 우승','여류 타이틀 포함'],['#/tournaments/jp/players','우승 순위','']);}
    if(DX.sections.cn){N.push(['#/tournaments/cn','중국 기전 개요',cnt('cn')],['#/tournaments/cn/years','연도표','1987년 천원전부터'],['#/tournaments/cn/events','기전별 역대 우승',''],['#/tournaments/cn/players','우승 순위','']);}
  }
  const col=(t,f,L)=>L.length?`<section><h2>${f?flag(f)+' ':''}${t}</h2>${L.map(([h,l,d])=>`<a href="${h}"><b>${l}</b>${d?`<span>${d}</span>`:''}</a>`).join('')}</section>`:'';
  return `<nav class="tmap" aria-label="기전 기록 바로 가기">${col('세계','',W)}${col('한국','한국',K)}${col('일본','일본',J)}${col('중국','중국',N)}</nav>`;
}
function tLive(){
  const toD=d=>Date.UTC((d/10000)|0,((d/100)|0)%100-1,d%100);const t1=toD(LASTD);const by={};
  for(let i=GAMES.length-1;i>=0;i--){const g=GAMES[i];if(t1-toD(g.d)>21*864e5)continue;const o=by[g.g]=by[g.g]||{g:g.g,n:0,d:0,ti:g.ti};o.n++;if(g.d>o.d){o.d=g.d;o.ti=g.ti;}}
  const L=Object.values(by).sort((a,b)=>b.d-a.d||b.n-a.n).slice(0,10);
  const rd=o=>{let s=T[o.ti]||'';const gn=G[o.g]||'';const i=s.indexOf(gn);if(i>=0)s=s.slice(i+gn.length);return s.replace(/^[\s·\-]+/,'').trim();};
  return L.length?`<ul class="tlive">${L.map(o=>`<li><a class="pl" href="#/tournaments/${o.g}">${esc(G[o.g])}</a><span class="r">${esc(rd(o))}</span><span class="y">${dstr(o.d).slice(5).replace('-','.')}</span></li>`).join('')}</ul>`:'<div class="empty">최근 3주 동안 열린 대회가 없습니다</div>';
}
function tFinals(){
  const L=CHAMP.filter(c=>c.st===0&&c.ck).sort((a,b)=>b.d-a.d).slice(0,10);
  return `<ul class="tlive tfin">${L.map(c=>`<li><a class="pl" href="#/tournaments/${c.g}">${esc(G[c.g])}</a><span class="r">${tHf(c.ck)}${c.rk?` <span class="muted">· ${esc(nameOf(c.rk))}</span>`:''}</span><span class="y">${dstr(c.d).slice(2).replace(/-/g,'.')}</span></li>`).join('')}</ul>`;
}
function pTournaments(q){
  const tab=q.tab||'domestic';const A=tagg();const def=TTABS.find(t=>t[0]===tab)||TTABS[0];
  const list=Object.values(A).filter(a=>def[2].includes(a.c)).sort((a,b)=>b.y1-a.y1||b.n-a.n);
  const tot=(typeof IX!=='undefined'&&IX?IX.ev.reduce((a,e)=>a+e[10].length,0):0)+(typeof DX!=='undefined'&&DX?DX.se.reduce((a,s)=>a+s[6].length,0):0);
  app.innerHTML=crumb([['홈','#/'],['대회']])+`<h1 class="pt">대회</h1>
  <p class="lede">세계·한국·일본·중국 기전의 역대 우승 기록 ${fmt(tot)}건과, 대국 기록이 있는 대회 ${fmt(G.length)}개를 모았습니다.</p>
  <p class="fx-links"><a href="#/tournaments/timeline">📅 시즌 타임라인 — 한 해의 우승을 달력으로</a><a href="#/tournaments/sim">🎯 우승 확률 계산기 — 남은 기사로 우승 확률 계산</a><a href="#/tournaments/bracket">🗂 대진표 — 토너먼트 흐름</a><a href="#/tournaments/league">📊 리그 시즌 기록 — 바둑리그 개인 성적·라운드 결과</a><a href="#/tournaments/wleague">👥 여자바둑리그 — 팀 순위·팀 명단</a></p>
  ${tMap()}
  <section class="tsec"><header><h2>지금 타이틀을 가진 기사</h2><span class="desc">진행 중인 기전의 가장 최근 우승자 · 오른쪽은 우승한 해</span></header>${tHolders()}</section>
  <div class="t2"><section class="tsec"><header><h2>요즘 열리는 대회</h2><span class="desc">최근 3주 대국 기준 · 가장 최근에 둔 단계</span></header>${tLive()}</section>
  <section class="tsec"><header><h2>최근 결승</h2><span class="desc">우승자 · 준우승자</span></header>${tFinals()}</section></div>
  <section class="tsec" id="tfind"><header><h2>대회 찾기</h2><span class="desc">등급은 한국기원 기전정보 분류 기준 · <a class="pl" href="#/tournaments/grades">분류 기준 보기</a></span></header>
  <nav class="tabs">${TTABS.map(([t,l,cs])=>`<a href="#/tournaments?tab=${t}&keep=1" class="${t===def[0]?'on':''}">${l} <span class="muted small">${Object.values(A).filter(a=>cs.includes(a.c)).length}</span></a>`).join('')}</nav>
  <div class="fbar"><div class="fg w"><input class="q" id="tq" type="search" placeholder="대회명 검색" aria-label="대회명 검색"></div></div><div id="tl"></div></section>`;
  const draw=()=>{const qq=document.getElementById('tq').value.trim();const L=list.filter(a=>!qq||G[a.g].includes(qq));
    pagedTable(document.getElementById('tl'),L,['대회','등급','최근 개최','기간','대국','참가 기사','우승 판정'],x=>x.map(a=>{const ch=CHG[a.g]||[];const ok=ch.filter(c=>c.st===0).length;return `<tr><td><a class="pl" href="#/tournaments/${a.g}">${esc(G[a.g])}</a></td><td>${badge(a.c)}</td><td class="d">${dstr(a.last)}</td><td class="d">${a.y0}–${a.y1}</td><td class="n r">${fmt(a.n)}</td><td class="n r">${fmt(a.ps.size)}</td><td class="d">${ch.length?ok+'/'+ch.length+'회':'–'}</td></tr>`;}).join(''),25,{sticky:true,empty:'조건에 맞는 대회가 없습니다'});};
  let tm;document.getElementById('tq').oninput=()=>{clearTimeout(tm);tm=setTimeout(draw,250);};draw();
}
function pTournamentsOld(q){
  const tab=q.tab||'domestic';const A=tagg();const def=TTABS.find(t=>t[0]===tab)||TTABS[0];
  const list=Object.values(A).filter(a=>def[2].includes(a.c)).sort((a,b)=>b.y1-a.y1||b.n-a.n);
  app.innerHTML=crumb([['홈','#/'],['대회']])+`<h1 class="pt">대회</h1>${tHubCards()}<p class="lede">정리된 대회명 ${fmt(G.length)}개. 등급은 한국기원 공식 기전정보 분류(국내기전·세계기전·리그) 기준이며, 공식 목록 밖 대회는 '기타/미분류'로 둡니다. <a class="pl" href="#/tournaments/grades">분류 기준 보기</a></p>
  <nav class="tabs">${TTABS.map(([t,l,cs])=>`<a href="#/tournaments?tab=${t}" class="${t===def[0]?'on':''}">${l} <span class="muted small">${Object.values(A).filter(a=>cs.includes(a.c)).length}</span></a>`).join('')}</nav>
  <div class="fbar"><div class="fg w"><input class="q" id="tq" type="search" placeholder="대회명 검색"></div></div><div id="tl"></div>`;
  const draw=()=>{const qq=document.getElementById('tq').value.trim();const L=list.filter(a=>!qq||G[a.g].includes(qq));
    pagedTable(document.getElementById('tl'),L,['대회','등급','한국기원 pkey','최근 개최','기간','대국','참가 기사','우승 판정'],x=>x.map(a=>{const ch=CHG[a.g]||[];const ok=ch.filter(c=>c.st===0).length;return `<tr><td><a class="pl" href="#/tournaments/${a.g}">${esc(G[a.g])}</a></td><td>${badge(a.c)}</td><td class="d">${esc(GP[a.g]||'–')}</td><td class="d">${dstr(a.last)}</td><td class="d">${a.y0}–${a.y1}</td><td class="n r">${fmt(a.n)}</td><td class="n r">${fmt(a.ps.size)}</td><td class="d">${ch.length?ok+'/'+ch.length+'회':'–'}</td></tr>`;}).join(''),50,{sticky:true,empty:'조건에 맞는 대회가 없습니다'});};
  let tm;document.getElementById('tq').oninput=()=>{clearTimeout(tm);tm=setTimeout(draw,250);};draw();
}
function pGrades(){
  app.innerHTML=crumb([['홈','#/'],['대회','#/tournaments'],['분류 기준']])+`<h1 class="pt">대회 분류 기준</h1><div class="prose">
  <p>지금 사이트의 대회 분류는 한국기원 기전정보(국내기전·세계기전·리그, 현행·중단 포함 ${META.official_count}개)를 기준으로 합니다. 대국 기록의 대회명에 공식 기전명이 들어 있거나, 같은 기전의 예전 이름(예: "삼성화재배 세계바둑오픈" → 삼성화재배 월드바둑마스터스, "하이원리조트배 명인전" → SG배 한국일보 명인전)이면 해당 기전으로 묶습니다.</p>
  <table><thead><tr><th>뱃지</th><th>뜻</th></tr></thead><tbody>
  <tr><td>${badge('세계기전')}</td><td>한국기원 공식 목록의 세계기전</td></tr><tr><td>${badge('국내기전')}</td><td>한국기원 공식 목록의 국내기전</td></tr><tr><td>${badge('리그')}</td><td>한국기원 공식 목록의 리그(KB국민은행 바둑리그 등)</td></tr><tr><td>${badge('협회리그')}</td><td>한국 프로기사협회 리그 — 공식 목록 밖</td></tr><tr><td>${badge('해외리그')}</td><td>중국 갑조·을조리그 등 해외 리그 — 공식 목록 밖</td></tr><tr><td>${badge('기타')}</td><td>그 밖의 대회(승단대회, 과거 타이틀전, 이벤트 대회 등). 세계/국내 구분이 끝나지 않아 억지로 넣지 않고 따로 둡니다</td></tr></tbody></table>
  <p>PRD의 대회 등급(세계대회·국내메이저·리그·승단대회) 초안(B-3)이 확정되면 이 분류와 뱃지 색상을 바꿉니다. 그때까지 '기타/미분류'는 숨기지 않고 별도 구간으로 보여줍니다.</p></div>`;
}
function pTournament(gid,tab,q){
  gid=+gid;q=q||{};if(!(gid>=0&&gid<G.length)){app.innerHTML='<div class="empty">대회를 찾을 수 없습니다</div>';return;}
  const gs=GAMES.filter(g=>g.g===gid);const a=tagg()[gid];const ch=(CHG[gid]||[]).slice().sort((x,y)=>y.d-x.d);
  const tc={};ch.forEach(c=>{if(c.st===0)tc[c.ck]=(tc[c.ck]||0)+1;});const tw={};gs.forEach(g=>{if(!g.j)tw[g.wk]=(tw[g.wk]||0)+1;});
  const byY={};gs.forEach(g=>byY[g.y]=(byY[g.y]||0)+1);const ys=Object.keys(byY).map(Number).sort((x,y)=>x-y);
  const fav=isFav('t:'+gid);
  if(tab==='bracket'){app.innerHTML=crumb([['홈','#/'],['대회','#/tournaments'],[G[gid],'#/tournaments/'+gid],['대진표']])+`<h1 class="pt" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${esc(G[gid])} ${badge(a.c)}</h1>${fxTourTabs(gid,'bracket')}<div id="bw"></div>`;fxBracketView(document.getElementById('bw'),gid,q.e,e=>'#/tournaments/'+gid+'/bracket?e='+encodeURIComponent(e));return;}
  app.innerHTML=crumb([['홈','#/'],['대회','#/tournaments'],[G[gid]]])+`<h1 class="pt" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${esc(G[gid])} ${badge(a.c)} <button class="fav" id="favt" aria-pressed="${fav}">${fav?'★ 즐겨찾기됨':'☆ 즐겨찾기'}</button></h1>${fxTourTabs(gid,'')}
  <div class="kpis"><div class="kpi"><div class="num">${fmt(a.n)}</div><div class="lbl">대국</div></div><div class="kpi"><div class="num">${fmt(a.ps.size)}</div><div class="lbl">참가 기사</div></div><div class="kpi"><div class="num">${a.y0}–${a.y1}</div><div class="lbl">기간</div></div><div class="kpi"><div class="num">${ch.filter(c=>c.st===0).length}</div><div class="lbl">우승 판정 회차</div></div><div class="kpi"><div class="num">${esc(GP[gid]||'–')}</div><div class="lbl">한국기원 pkey</div></div></div>
  <div class="g2"><section class="panel"><h2 class="sec"><span>회차별 우승 ${calc('같은 대회·같은 회차의 결승·도전기 대국에서 더 많이 이긴 기사')}</span><span class="desc">${ch.length}회차</span></h2>
  ${ch.length?`<div class="tw sticky scrollbox"><table><thead><tr><th>회차</th><th>연도</th><th>우승</th><th>준우승</th><th>근거 대국</th></tr></thead><tbody>${ch.map(c=>`<tr><td class="d">${esc(c.ed)}</td><td class="d">${(c.d/10000)|0}</td><td>${c.st===0?plink(c.ck,'w'):`<span class="badge b-U">${c.st===1?'미확정(동점)':'미확정(진행·근거 부족)'}</span>`}</td><td>${c.st===0&&c.rk?plink(c.rk):''}</td><td><button class="linkbtn" data-ch="${CHAMP.indexOf(c)}">${c.gi.length}국 보기</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">결승·도전기 단계가 기록된 대국이 없어 우승을 판정하지 않았습니다(리그·단체전은 판정 대상에서 제외)</div>'}
  <div id="chg"></div></section>
  <section class="panel"><h2 class="sec"><span>최다 우승</span></h2>${rankList(Object.entries(tc).sort((x,y)=>y[1]-x[1]),8,v=>v+'회')}<h2 class="sec" style="margin-top:20px"><span>최다승 기사</span></h2>${rankList(Object.entries(tw).sort((x,y)=>y[1]-x[1]),8,v=>v+'승')}</section></div>
  <section class="panel"><h2 class="sec"><span>연도별 대국 수</span></h2><div class="chart s"><canvas id="ty"></canvas></div></section>
  <section class="panel"><h2 class="sec"><span>대국 목록</span><span class="desc">최신순</span></h2><div id="tg"></div></section>`;
  document.getElementById('favt').onclick=e=>{const on=toggleFav('t:'+gid);e.target.setAttribute('aria-pressed',on);e.target.textContent=on?'★ 즐겨찾기됨':'☆ 즐겨찾기';};
  app.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>{const c=CHAMP[+b.dataset.ch];document.getElementById('chg').innerHTML=`<h3 style="font-size:13.5px;margin:14px 0 4px">${esc(c.ed)} 판정 근거</h3><div class="tw"><table><tbody>${gameRows(c.gi.map(i=>GAMES[i]))}</tbody></table></div>`;});
  mkChart('ty',{type:'bar',data:{labels:ys,datasets:[{data:ys.map(y=>byY[y]),backgroundColor:CAT_COLOR[a.c]}]},options:{maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:noGrid(),y:gridY()}}});
  pagedTable(document.getElementById('tg'),gs.slice().reverse(),GAME_HEAD,x=>gameRows(x),50);
}

/* =============== SEASONS =============== */
/* =============== GAMES LIST =============== */
const gst={y:'all',c:'all',t:'',p:''};
function pGames(q){
  if(Object.keys(q).length){gst.y=q.y||'all';gst.c=q.c||'all';gst.t=q.t||'';gst.p=q.p||'';}
  app.innerHTML=gHead('list')+`<p class="lede">한국기원 기록실의 대국 전체를 연도·분류·기사·대회로 골라 봅니다. 여러 조건을 섞어 찾고 내려받으려면 <a class="pl" href="#/games/search">조건 검색</a>을 쓰세요.</p>
  <div class="fbar"><div class="fg"><span class="fl">연도</span><select class="q" id="gy" style="min-width:90px"><option value="all">전체</option>${YEARS.slice().reverse().map(y=>`<option ${String(y)===String(gst.y)?'selected':''}>${y}</option>`).join('')}</select></div>
  <div class="fg"><span class="fl">분류</span><select class="q" id="gc" style="min-width:100px"><option value="all">전체</option>${CATS.map(c=>`<option value="${c}" ${gst.c===c?'selected':''}>${CLABEL[c]}</option>`).join('')}</select></div>
  <div class="fg w"><input class="q" id="gp" type="search" placeholder="기사 이름" value="${esc(gst.p)}"></div><div class="fg w"><input class="q" id="gt" type="search" placeholder="대회명" value="${esc(gst.t)}"></div></div>
  <div class="note" id="gn" style="margin-top:10px"></div><div id="gl"></div>`;
  const $=id=>document.getElementById(id);let tm;
  const upd=()=>{gst.y=$('gy').value;gst.c=$('gc').value;gst.p=$('gp').value.trim();gst.t=$('gt').value.trim();draw();};
  $('gy').onchange=upd;$('gc').onchange=upd;$('gp').oninput=$('gt').oninput=()=>{clearTimeout(tm);tm=setTimeout(upd,250);};
  draw();
  function draw(){const F=[];for(let i=GAMES.length-1;i>=0;i--){const g=GAMES[i];if(gst.y!=='all'&&g.y!==+gst.y)continue;if(gst.c!=='all'&&g.c!==gst.c)continue;if(gst.p&&!(nameOf(g.wk).includes(gst.p)||nameOf(g.lk).includes(gst.p)))continue;if(gst.t&&!T[g.ti].includes(gst.t))continue;F.push(g);}
    $('gn').textContent=`${fmt(F.length)}국`;pagedTable($('gl'),F,GAME_HEAD,x=>gameRows(x),50);}
}

/* =============== SEARCH =============== */
const SFIELDS=['p','o','oc','t','c','s','y0','y1','j','res','col','mv0','mv1'];
function pSearch(q){
  const v=k=>q[k]||'';
  app.innerHTML=gHead('search')+`<p class="lede">조건을 조합해 대국을 찾고 집계·내려받습니다. 같은 칸에 쉼표로 여러 값을 넣으면 '또는'(OR), 서로 다른 칸은 '그리고'(AND)로 묶습니다. 검색 주소를 그대로 공유할 수 있습니다.</p>
  <form id="sf" class="cond" autocomplete="off">
    <fieldset><legend>기사</legend><label for="s_p">기사 (승·패 어느 쪽이든)</label><input class="q" id="s_p" value="${esc(v('p'))}" placeholder="예: 이창호, 조훈현"><label for="s_o">상대</label><input class="q" id="s_o" value="${esc(v('o'))}"><label for="s_oc">상대 국가</label><select class="q" id="s_oc"><option value="">전체</option>${['한국','중국','일본','대만'].map(c=>`<option ${v('oc')===c?'selected':''}>${c}</option>`).join('')}</select></fieldset>
    <fieldset><legend>대회</legend><label for="s_t">대회명 (원본·정리명)</label><input class="q" id="s_t" value="${esc(v('t'))}" placeholder="예: 국수전, 응씨배"><label for="s_c">분류</label><select class="q" id="s_c"><option value="">전체</option>${CATS.map(c=>`<option value="${c}" ${v('c')===c?'selected':''}>${CLABEL[c]}</option>`).join('')}</select><label for="s_s">단계 <span class="cov">채움 ${100-META.stage_unknown_pct}%</span></label><select class="q" id="s_s"><option value="">전체</option>${STAGE.map((s,i)=>`<option value="${i}" ${v('s')===String(i)?'selected':''}>${s}</option>`).join('')}</select></fieldset>
    <fieldset><legend>기간</legend><label>연도</label><div class="row"><input class="q n" id="s_y0" value="${esc(v('y0'))}" placeholder="${YEARS[0]}" inputmode="numeric"> ~ <input class="q n" id="s_y1" value="${esc(v('y1'))}" placeholder="${YEARS[YEARS.length-1]}" inputmode="numeric"></div><label for="s_j">판정</label><select class="q" id="s_j"><option value="">전체</option><option value="0" ${v('j')==='0'?'selected':''}>정상</option><option value="1" ${v('j')==='1'?'selected':''}>무승부</option><option value="2" ${v('j')==='2'?'selected':''}>무효</option></select></fieldset>
    <fieldset><legend>결과</legend><label for="s_res">승부 방식 <span class="cov">채움 ${META.wt_pct}%</span></label><select class="q" id="s_res"><option value="">전체</option>${WT.slice(0,4).map((w,i)=>`<option value="${i}" ${v('res')===String(i)?'selected':''}>${w}</option>`).join('')}</select><label for="s_col">승자 색 <span class="cov">채움 ${META.color_pct}%</span></label><select class="q" id="s_col"><option value="">전체</option><option value="1" ${v('col')==='1'?'selected':''}>흑 승</option><option value="2" ${v('col')==='2'?'selected':''}>백 승</option></select><label>수순 <span class="cov">채움 ${META.moves_pct}%</span></label><div class="row"><input class="q n" id="s_mv0" value="${esc(v('mv0'))}" inputmode="numeric"> ~ <input class="q n" id="s_mv1" value="${esc(v('mv1'))}" inputmode="numeric"></div></fieldset>
  </form>
  <div style="display:flex;gap:8px;margin:12px 0;flex-wrap:wrap"><button class="btn pri" id="sgo">검색</button><button class="btn" id="sclr">조건 초기화</button></div>
  <div id="sres"></div>`;
  const $=id=>document.getElementById(id);
  $('sgo').onclick=e=>{e.preventDefault();const qs=new URLSearchParams();SFIELDS.forEach(f=>{const x=$('s_'+f).value.trim();if(x)qs.set(f,x);});routeGo('#/games/search?'+qs.toString());};
  $('sf').onsubmit=e=>{e.preventDefault();$('sgo').click();};
  $('sclr').onclick=()=>routeGo('#/games/search');
  const has=SFIELDS.some(f=>q[f]);
  if(!has){$('sres').innerHTML='<div class="empty">조건을 하나 이상 넣고 검색하세요.</div>';return;}
  const list=s=>s?s.split(',').map(x=>x.trim()).filter(Boolean):[];
  const P1=list(q.p),O1=list(q.o),T1=list(q.t);const y0=+q.y0||0,y1=+q.y1||9999,mv0=+q.mv0||0,mv1=+q.mv1||99999;
  const F=GAMES.filter(g=>{
    if(g.y<y0||g.y>y1)return false;
    if(q.c&&g.c!==q.c)return false;if(q.s!==undefined&&q.s!==''&&String(g.s)!==q.s)return false;if(q.j!==undefined&&q.j!==''&&String(g.j)!==q.j)return false;
    if(q.res!==undefined&&q.res!==''&&(g.j||String(g.r[1])!==q.res))return false;if(q.col&&String(g.r[0])!==q.col)return false;
    if((q.mv0||q.mv1)&&!(g.r[3]&&g.r[3]>=mv0&&g.r[3]<=mv1))return false;
    if(T1.length&&!T1.some(t=>T[g.ti].includes(t)||G[g.g].includes(t)))return false;
    const wn=nameOf(g.wk),ln=nameOf(g.lk);
    if(P1.length){const pw=P1.some(x=>wn.includes(x)),pl=P1.some(x=>ln.includes(x));if(!pw&&!pl)return false;
      if(O1.length){const ok=(pw&&O1.some(x=>ln.includes(x)))||(pl&&O1.some(x=>wn.includes(x)));if(!ok)return false;}}
    else if(O1.length&&!O1.some(x=>wn.includes(x)||ln.includes(x)))return false;
    if(q.oc){const opp=P1.length?(P1.some(x=>wn.includes(x))?g.lk:g.wk):g.lk;const op=PBY[opp];if(!op||op.c!==q.oc)return false;}
    return true;}).reverse();
  const chips=SFIELDS.filter(f=>q[f]).map(f=>`<span class="chip">${({p:'기사',o:'상대',oc:'상대 국가',t:'대회',c:'분류',s:'단계',y0:'시작',y1:'끝',j:'판정',res:'승부 방식',col:'승자 색',mv0:'수순≥',mv1:'수순≤'})[f]}: ${esc(f==='s'?STAGE[+q[f]]:f==='res'?WT[+q[f]]:f==='j'?['정상','무승부','무효'][+q[f]]:f==='col'?(q[f]==='1'?'흑 승':'백 승'):f==='c'?CLABEL[q[f]]:q[f])}<button aria-label="조건 해제" data-f="${f}">×</button></span>`).join('');
  const lowcov=[['s',META.stage_unknown_pct,'단계'],['res',100-META.wt_pct,'승부 방식'],['col',100-META.color_pct,'흑백'],['mv0',100-META.moves_pct,'수순'],['mv1',100-META.moves_pct,'수순']].filter(([f])=>q[f]);
  const ps=new Set();F.forEach(g=>{ps.add(g.wk);ps.add(g.lk);});
  $('sres').innerHTML=`<div class="chips">${chips}</div>
  <div class="kpis" style="margin-top:12px"><div class="kpi"><div class="num">${fmt(F.length)}</div><div class="lbl">대국</div></div><div class="kpi"><div class="num">${F.length?(F[F.length-1].y+'–'+F[0].y):'–'}</div><div class="lbl">기간</div></div><div class="kpi"><div class="num">${fmt(ps.size)}</div><div class="lbl">관련 기사</div></div><div class="kpi"><div class="num">${fmt(new Set(F.map(g=>g.g)).size)}</div><div class="lbl">관련 대회</div></div><div class="kpi"><div class="num"><button class="btn" id="scsv">CSV 내려받기</button></div><div class="lbl">조건 기록 포함</div></div></div>
  ${!F.length&&lowcov.length?`<div class="empty">조건에 맞는 대국이 없습니다. ${lowcov.map(([f,p,l])=>`'${l}' 정보는 전체 대국 중 약 ${100-p}%에만 기록되어 있어 나머지는 제외됐습니다. <button class="linkbtn" data-f="${f}">이 조건만 빼기</button>`).join(' ')}</div>`:''}
  <nav class="tabs" id="sv"><a href="javascript:void 0" data-v="list" class="on">목록</a><a href="javascript:void 0" data-v="player">기사별</a><a href="javascript:void 0" data-v="tour">대회별</a><a href="javascript:void 0" data-v="year">연도별</a><a href="javascript:void 0" data-v="stage">단계별</a></nav><div id="sl" style="margin-top:8px"></div>`;
  $('sres').querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{const qs=new URLSearchParams();SFIELDS.forEach(f=>{if(q[f]&&f!==b.dataset.f)qs.set(f,q[f]);});routeGo('#/games/search?'+qs);});
  const show=vw=>{$('sv').querySelectorAll('a').forEach(a=>a.classList.toggle('on',a.dataset.v===vw));const el=$('sl');
    if(vw==='list')return pagedTable(el,F,GAME_HEAD,x=>gameRows(x),50);
    const agg={};const add=(k,w)=>{const o=agg[k]=agg[k]||[0,0,0];o[0]++;if(w===1)o[1]++;else if(w===0)o[2]++;};
    F.forEach(g=>{if(vw==='player'){add(g.wk,g.j?2:1);add(g.lk,g.j?2:0);}else if(vw==='tour')add(g.g,2);else if(vw==='year')add(g.y,2);else add(g.s,2);});
    const rows=Object.entries(agg).sort((a,b)=>vw==='year'?b[0]-a[0]:b[1][0]-a[1][0]);
    const lab=k=>vw==='player'?plink(k):vw==='tour'?`<a class="pl" href="#/tournaments/${k}">${esc(G[k])}</a>`:vw==='stage'?(+k>=0?STAGE[+k]:'단계 정보 없음'):k;
    pagedTable(el,rows,vw==='player'?['기사','대국','승','패','승률']:['항목','대국'],x=>x.map(([k,o])=>vw==='player'?`<tr><td>${lab(k)}</td><td class="n r">${o[0]}</td><td class="n r">${o[1]}</td><td class="n r">${o[2]}</td><td class="n r">${pct(o[1],o[1]+o[2])}</td></tr>`:`<tr><td>${lab(k)}</td><td class="n r">${fmt(o[0])}</td></tr>`).join(''),50,{sticky:true});};
  $('sv').onclick=e=>{const a=e.target.closest('a');if(a)show(a.dataset.v);};show('list');
  $('scsv').onclick=()=>{const cond=SFIELDS.filter(f=>q[f]).map(f=>f+'='+q[f]).join('; ');
    downloadCSV(`바둑DB_검색_${dstr(LASTD)}.csv`,[[`# 바둑DB 검색 결과 · 조건: ${cond||'없음'} · 기준일 ${dstr(LASTD)} · 출처 한국기원 · 정리된 대회명·분류·단계·판정은 계산값`]],['날짜','대회(원본)','대회(정리)','분류','단계(계산)','승','패','결과(원본)','판정(계산)','승 pkey','패 pkey'],F.map(g=>[dstr(g.d),T[g.ti],G[g.g],CLABEL[g.c],g.s>=0?STAGE[g.s]:'',nameOf(g.wk),nameOf(g.lk),g.rs,['정상','무승부','무효'][g.j],isNK(g.wk)?'':g.wk,isNK(g.lk)?'':g.lk]));};
}
function csvCell(x){x=x==null?'':String(x);return /[",\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x;}
function downloadCSV(name,pre,head,rows){
  const parts=['﻿'];pre.forEach(r=>parts.push(r.map(csvCell).join(',')+'\n'));parts.push(head.map(csvCell).join(',')+'\n');
  for(let i=0;i<rows.length;i+=10000){parts.push(rows.slice(i,i+10000).map(r=>r.map(csvCell).join(',')).join('\n')+'\n');}
  const url=URL.createObjectURL(new Blob(parts,{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},500);
}

/* =============== NEWS =============== */
const NSRC={oro:['사이버오로','https://www.cyberoro.com/news/'],tyg:['타이젬','https://news.tygem.com/news/tnews/'],han:['한게임바둑','https://baduk.hangame.com/news.nhn?category=all'],ggl:['언론 뉴스','https://news.google.com/search?q=%EB%B0%94%EB%91%91&hl=ko&gl=KR&ceid=KR:ko']};
const nMap=x=>({s:x[0],d:+x[1],t:x[2],sm:x[0]==='ggl'?'':x[3],pub:x[0]==='ggl'?x[3]:'',u:x[4],img:x[5],fb:x[7]||'',k:x[6]||[]});
const NEWSL=(typeof NEWS!=='undefined'?NEWS:[]).map(nMap);
const NEWS_BY={};let NEWS_DATE=0,NEWS_UPD='';
function newsIndex(){for(const k in NEWS_BY)delete NEWS_BY[k];NEWSL.forEach(n=>n.k.forEach(k=>(NEWS_BY[k]=NEWS_BY[k]||[]).push(n)));NEWS_DATE=NEWSL.length?NEWSL[0].d:0;}
newsIndex();
// 배포된 사이트에서는 Cloudflare가 하루 10번 모은 최신 뉴스를 불러옵니다(실패하면 내장 목록 사용).
// 처음 뜰 때 내장 목록(빌드할 때의 뉴스)이 잠깐 보였다가 최신 뉴스로 바뀌는 것을 막기 위해
//  - 지난번에 받은 최신 뉴스를 브라우저에 저장해 두었다가 바로 보여 주고
//  - 저장된 것이 없으면(첫 방문) 뉴스 자리를 '불러오는 중'으로 두었다가 최신 뉴스가 오면 그립니다(3초 안에 안 오면 내장 목록).
const NWZ='bk_news_v1';
let NEWS_PENDING=false,NEWS_FB=null;
(function(){
  if(location.protocol==='file:')return;
  // NEWS_EARLY_V1: 로더가 자료와 함께 미리 받아 둔 최신 뉴스가 있으면 그것으로 바로 그림(다시 그리기 없음)
  const J=window.__NEWSJ;
  if(J&&Array.isArray(J.items)&&J.items.length){NEWSL.length=0;J.items.forEach(x=>NEWSL.push(nMap(x)));newsIndex();if(J.meta&&J.meta.updated)NEWS_UPD=J.meta.updated;
    try{localStorage.setItem(NWZ,JSON.stringify({at:Date.now(),items:J.items,meta:J.meta?{updated:J.meta.updated}:{}}));}catch(e){}
    window.__NEWSUSED=1;return;}
  let c=null;try{c=JSON.parse(localStorage.getItem(NWZ)||'null');}catch(e){}
  if(c&&Array.isArray(c.items)&&c.items.length){
    const L=c.items.map(nMap);
    const fresh=c.at&&Date.now()-c.at<2*3600e3;   // 2시간 안에 받아 둔 것만 바로 보여 줌
    if(fresh&&(!NEWSL.length||L[0].d>=NEWSL[0].d)){NEWSL.length=0;L.forEach(x=>NEWSL.push(x));newsIndex();if(c.meta&&c.meta.updated)NEWS_UPD=c.meta.updated;}
    else{NEWS_PENDING=true;if(!NEWSL.length||L[0].d>=NEWSL[0].d)NEWS_FB=c;}   // 오래된 저장본은 최신 뉴스를 못 받을 때만 씀
  }else NEWS_PENDING=true;
})();
function newsRedraw(){const r=parseHash().parts[0]||'home';if(r==='home'||r==='news'||r==='players'){const y=window.scrollY;route();window.scrollTo(0,y);}}
function loadLiveNews(){
  if(location.protocol==='file:')return;
  const sig=()=>NEWSL.slice(0,16).map(n=>n.u+n.d).join('|');
  const done=()=>{if(NEWS_PENDING){NEWS_PENDING=false;if(NEWS_FB){NEWSL.length=0;NEWS_FB.items.forEach(x=>NEWSL.push(nMap(x)));newsIndex();if(NEWS_FB.meta&&NEWS_FB.meta.updated)NEWS_UPD=NEWS_FB.meta.updated;}newsRedraw();}};
  if(window.__NEWSUSED)return;   // 이미 최신 뉴스로 그림
  setTimeout(done,6000);
  (window.__NEWSP||fetch('/api/news').then(r=>r.ok?r.json():null)).then(j=>{
    if(!j||!Array.isArray(j.items)||!j.items.length){done();return;}
    try{localStorage.setItem(NWZ,JSON.stringify({at:Date.now(),items:j.items,meta:j.meta?{updated:j.meta.updated}:{}}));}catch(e){}
    const was=NEWS_PENDING,before=sig();
    NEWSL.length=0;j.items.forEach(x=>NEWSL.push(nMap(x)));newsIndex();
    if(j.meta&&j.meta.updated)NEWS_UPD=j.meta.updated;
    NEWS_PENDING=false;
    if(was||sig()!==before)newsRedraw();
  }).catch(done);
}
const nSkel=(h,lines)=>`<div class="nskel" style="min-height:${h}px" aria-busy="true"><span>최신 뉴스 불러오는 중…</span>${'<i></i>'.repeat(lines||0)}</div>`;
const nUpd=()=>{if(!NEWS_UPD)return '수집일 '+dstr(NEWS_DATE);const d=new Date(new Date(NEWS_UPD).getTime()+9*3600e3);return `마지막 갱신 ${d.getUTCMonth()+1}.${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')} · 하루 10번 자동 갱신`;};
const nsBadge=s=>`<span class="nsb ns-${s}">${NSRC[s][0]}</span>`;
const nImg=n=>n.img?`<img src="${esc(n.img)}"${n.fb?` data-fb="${esc(n.fb)}"`:''} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="if(this.dataset.fb){this.src=this.dataset.fb;this.removeAttribute('data-fb');}else this.remove()">`:'';
const nTitle=n=>{const m=n.t.match(/^\[([^\]]{1,20})\]\s*(.*)$/);return m?{tag:m[1],t:m[2]}:{tag:'',t:n.t};};
const nWhen=d=>{const s=String(d);return s.slice(4,6)+'.'+s.slice(6,8);};
function newsItem(n,opt={}){
  const tt=nTitle(n);
  const chips=n.k.filter(k=>k!==opt.self).slice(0,4).map(k=>`<a class="nchip" href="#/players/${encodeURIComponent(k)}">${esc(nameOf(k))}</a>`).join('');
  return `<article class="nitem${n.img?'':' noimg'}"><a class="nth" href="${esc(n.u)}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">${nImg(n)}<span class="ph">${NSRC[n.s][0].slice(0,1)}</span></a>
  <div class="nb"><div class="nmeta">${nsBadge(n.s)}${tt.tag?`<span class="ntag">${esc(tt.tag)}</span>`:''}${n.pub?`<span class="npub">${esc(n.pub)}</span>`:''}<span class="d">${dstr(n.d)}</span></div>
  <h3><a href="${esc(n.u)}" target="_blank" rel="noopener noreferrer">${esc(tt.t)}<span class="ext" aria-label="새 창">↗</span></a></h3>
  ${n.sm&&!opt.compact?`<p>${esc(n.sm)}</p>`:''}${chips?`<div class="nchips">${chips}</div>`:''}</div></article>`;
}
function pNews(q){
  if(NEWS_PENDING){app.innerHTML=crumb([['홈','#/'],['뉴스']])+'<h1 class="pt">뉴스</h1>'+nSkel(640,12);return;}
  const st={s:q.s||'all',p:q.p||'',q:q.q||'',n:40};
  const cnt={all:NEWSL.length};NEWSL.forEach(n=>cnt[n.s]=(cnt[n.s]||0)+1);
  const hot=Object.entries(NEWS_BY).map(([k,a])=>[k,a.length]).sort((a,b)=>b[1]-a[1]).slice(0,14);
  app.innerHTML=crumb([['홈','#/'],['뉴스']])+`<h1 class="pt">뉴스</h1>
  <p class="lede">사이버오로·타이젬·한게임바둑의 바둑 뉴스와 언론사 기사('바둑' 뉴스 검색 — 구글 뉴스, 안 될 때는 Bing 뉴스)를 모았습니다. 제목을 누르면 원문 사이트로 이동합니다. 기사 제목·요약에 나온 기사(棋士)는 이름을 눌러 기록을 볼 수 있습니다.</p>
  <div class="ctabs" id="nsrc">${[['all','전체'],['oro','사이버오로'],['tyg','타이젬'],['han','한게임바둑'],['ggl','언론 뉴스']].map(([v,l])=>`<button type="button" data-v="${v}" aria-pressed="${st.s===v}">${v==='all'?'':`<i class="nsdot ns-${v}"></i>`}<span>${l}</span><em>${fmt(cnt[v]||0)}</em></button>`).join('')}</div>
  <div class="grid g31" style="align-items:start;margin-top:4px"><div style="min-width:0">
    <div class="fbar"><div class="fg w"><label class="sr" for="nq">뉴스 검색</label><input class="q" id="nq" type="search" placeholder="제목·요약에서 찾기 (예: 농심배, 김은지)" value="${esc(st.q)}"></div><div class="fg" id="npw" style="${st.p?'':'display:none'}"><span class="chip" id="npc"></span><button class="linkbtn" id="npx" type="button">해제</button></div></div>
    <div class="note" id="ncount" style="margin-top:12px"></div><div id="nlist"></div><div id="nmore"></div>
  </div><aside class="nside">
    <div class="mod"><div class="hd"><span>뉴스에 많이 나온 기사</span><span class="desc">수집 기간 기준</span></div><div class="bd">${hot.map(([k,c],i)=>`<div class="rk"><span class="i">${i+1}</span><span class="nm"><a class="pl" href="#/news?p=${encodeURIComponent(k)}">${esc(nameOf(k))}</a> ${flag((PBY[k]||{}).c)}</span><span class="bar"><i style="width:${c/hot[0][1]*100}%"></i></span><span class="v">${c}건</span></div>`).join('')}</div></div>
    <div class="mod"><div class="hd"><span>출처</span></div><div class="bd">${Object.entries(NSRC).map(([s,[l,u]])=>`<div class="gl" style="grid-template-columns:1fr auto"><span>${nsBadge(s)} ${l}</span><a class="more" href="${u}" target="_blank" rel="noopener noreferrer">원문 사이트 ↗</a></div>`).join('')}<div class="small" style="margin-top:8px;color:var(--muted)">${nUpd()} · ${dstr(NEWSL.length?Math.min(...NEWSL.map(n=>n.d)):0)}부터. 요약은 목록에 공개된 첫 문장 일부이며, 기사 전문과 저작권은 각 언론사·사이트에 있습니다.</div></div></div>
  </aside></div>`;
  const $=id=>document.getElementById(id);
  $('nsrc').onclick=e=>{const b=e.target.closest('button');if(!b)return;st.s=b.dataset.v;st.n=40;$('nsrc').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));draw();};
  let tm;$('nq').addEventListener('input',e=>{clearTimeout(tm);tm=setTimeout(()=>{st.q=e.target.value.trim();st.n=40;draw();},200);});
  $('npx').onclick=()=>{st.p='';$('npw').style.display='none';routeRS('#/news');draw();};
  if(st.p)$('npc').textContent=nameOf(st.p)+' 관련';
  draw();
  function draw(){
    const qq=st.q.toLowerCase();
    const list=NEWSL.filter(n=>(st.s==='all'||n.s===st.s)&&(!st.p||n.k.includes(st.p))&&(!qq||(n.t+' '+n.sm+' '+n.pub).toLowerCase().includes(qq)));
    $('ncount').textContent=`${fmt(list.length)}건`;
    if(!list.length){$('nlist').innerHTML='<div class="empty" style="margin-top:12px">조건에 맞는 뉴스가 없습니다.</div>';$('nmore').innerHTML='';return;}
    let h='',last=0;
    list.slice(0,st.n).forEach(n=>{if(n.d!==last){h+=`<div class="nday">${dstr(n.d)} <span>${'일월화수목금토'[new Date(String(n.d).replace(/(\d{4})(\d\d)(\d\d)/,'$1-$2-$3')).getDay()]}요일</span></div>`;last=n.d;}h+=newsItem(n,{self:st.p});});
    $('nlist').innerHTML=h;
    $('nmore').innerHTML=list.length>st.n?`<div style="text-align:center;margin-top:14px"><button class="pill" style="border:1px solid var(--rule);padding:8px 18px" id="nmb">더 보기 (${fmt(list.length-st.n)}건 남음)</button></div>`:'';
    if($('nmb'))$('nmb').onclick=()=>{st.n+=40;draw();};
  }
}
function homeNews(){
  if(NEWS_PENDING)return `<div class="mod" style="margin-top:16px"><div class="hd"><span>바둑 뉴스</span></div><div class="bd">${nSkel(220,6)}</div></div>`;
  if(!NEWSL.length)return '';
  const pic=[];const seen=new Set();
  for(const n of NEWSL){if(n.s==='ggl'||!n.img)continue;if(seen.has(n.s)&&pic.length<3)continue;seen.add(n.s);pic.push(n);if(pic.length>=4)break;}
  const pool={};NEWSL.filter(n=>!pic.includes(n)).forEach(n=>(pool[n.s]=pool[n.s]||[]).push(n));
  const rest=[];for(let i=0;rest.length<8&&i<20;i++)for(const sc of ['oro','tyg','han','ggl']){const x=(pool[sc]||[])[i];if(x&&rest.length<8)rest.push(x);}
  rest.sort((a,b)=>b.d-a.d);
  return `<div class="mod" style="margin-top:16px"><div class="hd"><span>바둑 뉴스</span><span class="desc">${nUpd()}</span><a class="more" href="#/news">뉴스 전체 →</a></div><div class="bd"><div class="ncards">${pic.map(n=>{const tt=nTitle(n);return `<a class="ncard" href="${esc(n.u)}" target="_blank" rel="noopener noreferrer"><span class="nth">${nImg(n)}<span class="ph">${NSRC[n.s][0].slice(0,1)}</span></span><span class="nmeta">${nsBadge(n.s)}<span class="d">${nWhen(n.d)}</span></span><b>${esc(tt.t)}</b></a>`;}).join('')}</div>
  <ul class="nlines">${rest.map(n=>{const tt=nTitle(n);return `<li><span class="d">${nWhen(n.d)}</span>${nsBadge(n.s)}<a href="${esc(n.u)}" target="_blank" rel="noopener noreferrer">${esc(tt.t)}</a>${n.pub?`<span class="npub">${esc(n.pub)}</span>`:''}</li>`;}).join('')}</ul></div></div>`;
}
function playerNews(k){
  const a=NEWS_BY[k];if(!a||!a.length)return '';
  return `<div class="mod"><div class="hd"><span>관련 뉴스</span><a class="more" href="#/news?p=${encodeURIComponent(k)}">${a.length}건 →</a></div><div class="bd">${a.slice(0,5).map(n=>{const tt=nTitle(n);return `<div class="nline2"><div class="nmeta">${nsBadge(n.s)}<span class="d">${dstr(n.d)}</span></div><a href="${esc(n.u)}" target="_blank" rel="noopener noreferrer">${esc(tt.t)}</a></div>`;}).join('')}</div></div>`;
}

/* ---------- 뉴스 드로어: 뉴스 제목을 누르면 오른쪽에서 열리고 기사 본문을 바로 보여 줌 ---------- */
// 사이버오로·타이젬·한게임바둑 기사는 /api/news/article 이 원문 페이지에서 본문(문단·사진)을 뽑아 줍니다.
// 구글 뉴스(언론사) 기사나 본문을 못 가져온 경우에는 요약과 '원문 기사 보기'를 보여 줍니다.
let NDR=null,NDR_LAST=null,NDR_CUR=null;const NART=new Map();
function newsByUrl(u){for(const n of NEWSL)if(n.u===u)return n;return null;}
function ndrOpen(n){
  if(!NDR){NDR=document.createElement('div');NDR.className='ndr';NDR.hidden=true;
    NDR.innerHTML='<div class="ndr-scrim" data-x="1"></div><aside class="ndr-panel" role="dialog" aria-modal="true" aria-labelledby="ndr-t" tabindex="-1"></aside>';
    document.body.appendChild(NDR);
    NDR.addEventListener('click',e=>{if(e.target.closest('[data-x]')){ndrClose();return;}
      if(e.target.closest('[data-retry]')){e.preventDefault();if(NDR_CUR){NART.delete(NDR_CUR.u);ndrFill(NDR_CUR);}return;}
      if(e.target.closest('a[href^="#/"]'))ndrClose();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&NDR&&!NDR.hidden)ndrClose();});}
  NDR_LAST=document.activeElement;ndrFill(n);NDR.hidden=false;document.documentElement.classList.add('ndr-on');
  requestAnimationFrame(()=>{NDR.classList.add('show');NDR.querySelector('.ndr-panel').focus();});
}
function ndrClose(){if(!NDR||NDR.hidden)return;NDR.classList.remove('show');document.documentElement.classList.remove('ndr-on');setTimeout(()=>{NDR.hidden=true;},280);if(NDR_LAST&&NDR_LAST.focus)NDR_LAST.focus();}
const NART_OK={oro:1,tyg:1,han:1};
function ndrArt(n){
  if(!NART_OK[n.s])return Promise.resolve(null);
  if(!NART.has(n.u))NART.set(n.u,fetch('/api/news/article?u='+encodeURIComponent(n.u)).then(r=>r.ok?r.json():null).then(j=>j&&j.ok?j:null).catch(()=>null));
  return NART.get(n.u);
}
function ndrBlocks(a){
  return a.blocks.map(b=>b[0]==='img'?`<figure class="ndr-fig"><img src="${esc(b[1])}" alt="${esc(b[2]||'')}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('figure').remove()">${b[2]?`<figcaption>${esc(b[2])}</figcaption>`:''}</figure>`
    :b[0]==='h'?`<p class="ndr-hd">${esc(b[1])}</p>`
    :b[0]==='cap'?`<p class="ndr-cap">${esc(b[1])}</p>`
    :`<p>${esc(b[1])}</p>`).join('');
}
function ndrFallback(n,why){
  return `${n.img?`<figure class="ndr-fig ndr-lead">${nImg(n)}</figure>`:''}
    ${n.sm?`<p class="ndr-sm">${esc(n.sm)}</p>`:''}
    <p class="ndr-miss">${why}</p>`;
}
function ndrFill(n){
  NDR_CUR=n;
  const tt=nTitle(n),p=NDR.querySelector('.ndr-panel'),d=String(n.d),src=NSRC[n.s][0];
  const day=`${d.slice(0,4)}.${d.slice(4,6)}.${d.slice(6,8)}`;
  p.innerHTML=`<header class="ndr-h"><span class="nmeta">${nsBadge(n.s)}${tt.tag?`<span class="ntag">${esc(tt.tag)}</span>`:''}<span class="d">${day}</span></span>
    <span class="ndr-hr"><a class="ndr-orig" href="${esc(n.u)}" target="_blank" rel="noopener noreferrer" data-raw="1">원문 <span aria-hidden="true">↗</span></a><button class="ndr-x" type="button" data-x="1" aria-label="닫기">×</button></span></header>
  <article class="ndr-b">
    <h2 id="ndr-t">${esc(tt.t)}</h2>
    <div class="ndr-by"><span>${esc(n.pub||src)}</span><span class="ndr-w"></span></div>
    <div class="ndr-art" aria-busy="true">${NART_OK[n.s]
      ?`${n.img?`<figure class="ndr-fig ndr-lead">${nImg(n)}</figure>`:''}<div class="ndr-load"><i></i><i></i><i></i><span>기사 본문을 불러오는 중…</span></div>`
      :ndrFallback(n,`${esc(n.pub||'언론사')} 기사는 본문을 이곳에 가져오지 않습니다. 위의 <b>원문</b>이나 아래 버튼으로 기사 전체를 볼 수 있습니다.`)}</div>
    ${n.k.length?`<section class="ndr-sec"><h3>기사에 나온 기사(棋士)</h3><div class="ndr-chips">${n.k.slice(0,10).map(k=>`<a class="nchip" href="#/players/${encodeURIComponent(k)}">${flag((PBY[k]||{}).c)} ${esc(nameOf(k))}${WS[k]?` <small>${fmt(WS[k][0])}</small>`:''}</a>`).join('')}</div></section>`:''}
    <div class="ndr-foot"><a class="ndr-go" href="${esc(n.u)}" target="_blank" rel="noopener noreferrer" data-raw="1">${esc(src)}에서 원문 보기 <span aria-hidden="true">↗</span></a>
    <p class="ndr-note">출처 ${esc(src)}${n.pub&&n.pub!==src?' · '+esc(n.pub):''}. 기사의 저작권은 원 언론사에 있습니다.</p></div>
  </article>`;
  p.scrollTop=0;
  if(!NART_OK[n.s])return;
  ndrArt(n).then(a=>{
    if(NDR_CUR!==n)return;
    const box=p.querySelector('.ndr-art');if(!box)return;box.removeAttribute('aria-busy');
    if(!a){box.innerHTML=ndrFallback(n,`본문을 불러오지 못했습니다. <a href="#" data-retry="1">다시 시도</a> 하거나 원문에서 확인해 주세요.`);return;}
    if(a.writer)p.querySelector('.ndr-w').textContent=a.writer;
    box.innerHTML=(a.sub?`<p class="ndr-lede">${esc(a.sub)}</p>`:'')+ndrBlocks(a);
  });
}
// 사이트 어디서든 뉴스 링크를 누르면 드로어로 (Ctrl·⌘·가운데 클릭은 원래대로 새 탭)
document.addEventListener('click',e=>{
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const a=e.target.closest('a[href]');if(!a||a.dataset.raw||a.closest('.ndr'))return;
  const n=newsByUrl(a.getAttribute('href'));if(!n)return;
  e.preventDefault();ndrOpen(n);
});

/* =============== SEASON DASHBOARD =============== */
const YRANGE={};function buildYR(){for(const k in YRANGE)delete YRANGE[k];const A=GSC;let s=0;for(let i=1;i<=A.length;i++){if(i===A.length||A[i].y!==A[s].y){YRANGE[A[s].y]=[s,i];s=i;}}}buildYR();
const yGames=(y,mmdd=1231)=>{const r=YRANGE[y];if(!r)return [];const out=[];for(let i=r[0];i<r[1];i++){if(GSC[i].d%10000>mmdd)break;out.push(GSC[i]);}return out;};
const FIRSTY={};for(const k in BYK){const g=BYK[k][0];if(g)FIRSTY[k]=g.y;}
const isTeam=k=>isNK(k)&&k.includes('(챌린지)');
const isAma=k=>isNK(k)&&k.includes('(아마');
const SZS={};
function seasonSum(y,mmdd=1231){
  const key=y+':'+mmdd;if(SZS[key])return SZS[key];
  const gs=yGames(y,mmdd);const pl=new Set();let res=0,half=0,mvS=0,mvN=0,ok=0,bw=0,bn=0;
  for(const g of gs){pl.add(g.wk);pl.add(g.lk);if(g.j)continue;ok++;if(g.r[1]===0)res++;if(g.r[2]===0.5)half++;if(g.r[3]){mvS+=g.r[3];mvN++;}if(g.y>=2021&&g.r[0]){bn++;if(g.r[0]===1)bw++;}}
  const ch=CHAMP.filter(c=>c.st===0&&((c.d/10000)|0)===y&&c.d%10000<=mmdd);
  let debut=0;pl.forEach(k=>{if(FIRSTY[k]===y&&!isNK(k))debut++;});
  return SZS[key]={n:gs.length,pl:pl.size,debut,ch:ch.length,chp:new Set(ch.map(c=>c.ck)).size,res:ok?res/ok:null,half:ok?half/ok:null,mv:mvN>=30?mvS/mvN:null,mvN,black:bn>=100?bw/bn:null,bn};
}
function spark(vals){
  const v=vals.map(x=>x==null?null:x);const nums=v.filter(x=>x!=null);if(nums.length<2)return '';
  const mn=Math.min(...nums),mx=Math.max(...nums),W=120,H=30,p=3;const sx=i=>p+i*(W-2*p)/(v.length-1),sy=x=>H-p-(mx===mn?0.5:(x-mn)/(mx-mn))*(H-2*p);
  let d='';v.forEach((x,i)=>{if(x==null)return;d+=(d?'L':'M')+sx(i).toFixed(1)+' '+sy(x).toFixed(1);});
  const li=v.length-1;
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/>${v[li]!=null?`<circle cx="${sx(li).toFixed(1)}" cy="${sy(v[li]).toFixed(1)}" r="3"/>`:''}</svg>`;
}
function delta(a,b,isPct){
  if(a==null||b==null||b===0)return '<span class="dl">–</span>';
  const d=isPct?(a-b)*100:(a-b)/b*100;const s=(d>0?'▲':d<0?'▼':'')+Math.abs(d).toFixed(1)+(isPct?'%p':'%');
  return `<span class="dl ${d>0.05?'up':d<-0.05?'dn':''}">${s}</span>`;
}
/* 달력 히트맵: 날짜별 대국 수 */
function calHeat(y,gs,lastD){
  const cnt={};gs.forEach(g=>cnt[g.d]=(cnt[g.d]||0)+1);
  const start=new Date(Date.UTC(y,0,1)),dow0=start.getUTCDay();
  const days=((Date.UTC(y+1,0,1)-start)/864e5)|0;
  const vals=Object.values(cnt).sort((a,b)=>a-b);const q=p=>vals.length?vals[Math.min(vals.length-1,Math.floor(p*vals.length))]:1;
  const cut=[q(.25),q(.5),q(.75),q(.92)];
  const lvl=c=>!c?0:c<=cut[0]?1:c<=cut[1]?2:c<=cut[2]?3:c<=cut[3]?4:5;
  const S=12,G=3,X0=28,Y0=18;let cells='',mon='';let lastM=-1;
  for(let i=0;i<days;i++){
    const dt=new Date(start.getTime()+i*864e5);const m=dt.getUTCMonth(),dd=dt.getUTCDate();
    const key=y*10000+(m+1)*100+dd;const w=((i+dow0)/7)|0,r=(i+dow0)%7;
    const c=cnt[key]||0;const fut=lastD&&key>lastD;
    cells+=`<rect x="${X0+w*(S+G)}" y="${Y0+r*(S+G)}" width="${S}" height="${S}" rx="2.5" class="h${fut?'x':lvl(c)}"><title>${m+1}월 ${dd}일 · ${c?fmt(c)+'국':'대국 없음'}</title></rect>`;
    if(m!==lastM&&dd<=7){mon+=`<text x="${X0+w*(S+G)}" y="11">${m+1}월</text>`;lastM=m;}
  }
  const wl=['일','월','화','수','목','금','토'].map((t,i)=>i%2?`<text x="0" y="${Y0+i*(S+G)+10}">${t}</text>`:'').join('');
  const W=X0+54*(S+G),H=Y0+7*(S+G);
  const busiest=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
  const active=Object.keys(cnt).length;
  const byDow=[0,0,0,0,0,0,0];Object.entries(cnt).forEach(([k,c])=>{const d=new Date(Date.UTC((k/10000)|0,((k/100)|0)%100-1,k%100));byDow[d.getUTCDay()]+=c;});
  const mxd=Math.max(...byDow,1);
  return `<div class="calw"><svg class="calhm" viewBox="0 0 ${W} ${H}" role="img" aria-label="${y}년 날짜별 대국 수">${mon}${wl}${cells}</svg></div>
  <div class="calf"><div class="callg"><span>적음</span>${[1,2,3,4,5].map(i=>`<i class="h${i}"></i>`).join('')}<span>많음</span></div>
  <div class="cals"><span>대국이 있었던 날 <b>${fmt(active)}</b>일</span>${busiest?`<span>가장 많았던 날 <b>${dstr(+busiest[0]).slice(5).replace('-','.')}</b> ${fmt(busiest[1])}국</span>`:''}<span class="dows">${['일','월','화','수','목','금','토'].map((t,i)=>`<span title="${t}요일 ${fmt(byDow[i])}국"><i style="height:${Math.max(2,byDow[i]/mxd*22)}px"></i>${t}</span>`).join('')}</span></div></div>`;
}
/* 연도 선택: 10년 단위 바로가기 + 연도별 대국 수 막대(누르면 그해로 이동) */
function yearPicker(y){
  const cnt=YEARS.map(x=>[x,YRANGE[x]?YRANGE[x][1]-YRANGE[x][0]:0]);const mx=Math.max(...cnt.map(c=>c[1]),1);
  const iy=YEARS.indexOf(y),prev=YEARS[iy-1],next=YEARS[iy+1];
  const decs=[...new Set(YEARS.map(x=>Math.floor(x/10)*10))].reverse();const cd=Math.floor(y/10)*10;
  const lastIn=d=>Math.max(...YEARS.filter(x=>x>=d&&x<d+10));
  return `<div class="ypk">
  <div class="ypk-top">
    <div class="ypk-nav">${prev?`<a class="ypk-btn" href="#/seasons/${prev}" aria-label="${prev}년">‹</a>`:'<span class="ypk-btn off">‹</span>'}
      <label class="sr" for="ysel">시즌 선택</label><select id="ysel">${YEARS.slice().reverse().map(x=>`<option value="${x}" ${x===y?'selected':''}>${x}</option>`).join('')}</select>
      ${next?`<a class="ypk-btn" href="#/seasons/${next}" aria-label="${next}년">›</a>`:'<span class="ypk-btn off">›</span>'}</div>
    <div class="ypk-dec">${decs.map(d=>`<a href="#/seasons/${lastIn(d)}" class="${d===cd?'on':''}">${d}<small>년대</small></a>`).join('')}</div>
  </div>
  <div class="ypk-bars" id="ys">${cnt.map(([x,n])=>`<a href="#/seasons/${x}" class="${x===y?'on':''}${x%10===0?' d0':''}" title="${x}년 · ${fmt(n)}국"><i style="height:${Math.max(3,Math.sqrt(n/mx)*100)}%"></i><span>${x===y||x%10===0?x:''}</span></a>`).join('')}</div>
  </div>`;
}
function pSeason(y){
  y=+y||YEARS[YEARS.length-1];
  if(!YRANGE[y])y=YEARS[YEARS.length-1];
  const iy=YEARS.indexOf(y),isCur=y===YEARS[YEARS.length-1];
  const mmdd=isCur?LASTD%10000:1231;
  const gs=yGames(y);const ok=gs.filter(g=>!g.j);
  const S=seasonSum(y,1231),Sp=YRANGE[y-1]?seasonSum(y-1,mmdd):null,Sc=seasonSum(y,mmdd);
  const span=YEARS.filter(x=>x<=y).slice(-12);
  const sp=f=>spark(span.map(x=>f(seasonSum(x,1231))));
  const thin=gs.length<300;
  const person=k=>!isTeam(k)&&inSC(k);
  /* ---- aggregates ---- */
  const W={},Nn={},Ls={},half={},res={},cw={},best={},cl={},worst={};
  const allKeys=[...new Set(gs.flatMap(g=>[g.wk,g.lk]))].filter(person);
  for(const g of gs){if(g.of!==1)continue;Nn[g.wk]=(Nn[g.wk]||0)+1;Nn[g.lk]=(Nn[g.lk]||0)+1;if(g.j){if(g.j===3){Ls[g.wk]=(Ls[g.wk]||0)+1;Ls[g.lk]=(Ls[g.lk]||0)+1;}continue;}W[g.wk]=(W[g.wk]||0)+1;Ls[g.lk]=(Ls[g.lk]||0)+1;if(g.r[2]===0.5)half[g.wk]=(half[g.wk]||0)+1;if(g.r[1]===0)res[g.wk]=(res[g.wk]||0)+1;
    for(const [k,win] of [[g.wk,1],[g.lk,0]]){if(win){cw[k]=(cw[k]||0)+1;cl[k]=0;if(!best[k]||cw[k]>best[k][0])best[k]=[cw[k],g.d];}else{cw[k]=0;cl[k]=(cl[k]||0)+1;if(!worst[k]||cl[k]>worst[k][0])worst[k]=[cl[k],g.d];}}}
  const rec_=k=>`${W[k]||0}-${Ls[k]||0}`;
  const keys=Object.keys(Nn).filter(person);
  const winsL=keys.filter(k=>W[k]).map(k=>[k,W[k]]).sort((a,b)=>b[1]-a[1]||(Nn[a[0]]-Nn[b[0]]));
  const pctL=keys.filter(k=>(W[k]||0)+(Ls[k]||0)>=20&&!isNK(k)).map(k=>[k,(W[k]||0)/((W[k]||0)+(Ls[k]||0))]).sort((a,b)=>b[1]-a[1]||(W[b[0]]||0)-(W[a[0]]||0));
  const gamesL=keys.map(k=>[k,Nn[k]]).sort((a,b)=>b[1]-a[1]);
  const endYm=isCur?((LASTD/100)|0):y*100+12, startYm=(y-1)*100+12;
  const riseL=[];for(const k of keys){if(Nn[k]<10||!WR[k])continue;const a=whrAt(k,startYm),b=whrAt(k,endYm);if(!a||!b||b[0]<y*100+1||b[2]>UNC_MAX)continue;riseL.push([k,b[1]-a[1],b[1]]);}
  riseL.sort((a,b)=>b[1]-a[1]);
  const champs=CHAMP.filter(c=>((c.d/10000)|0)===y).sort((a,b)=>a.d-b.d);
  const chCnt={};champs.filter(c=>c.st===0).forEach(c=>(chCnt[c.ck]=chCnt[c.ck]||[]).push(c));
  const chL=Object.entries(chCnt).map(([k,a])=>[k,a.length]).sort((a,b)=>b[1]-a[1]);
  const lastDay=gs.length?gs[gs.length-1].d:y*10000+1231;
  const womenL=winsL.filter(([k])=>(PBY[k]||{}).g==='여자');
  const youthL=winsL.filter(([k])=>{const p=PBY[k];if(!p||!p.b)return false;const a=ageAt(p.b,lastDay);return a!=null&&a<=20;});
  const streakL=Object.entries(best).filter(([k])=>person(k)).map(([k,v])=>[k,v[0],v[1]]).sort((a,b)=>b[1]-a[1]||a[2]-b[2]);
  const lb=(title,desc,rows,val,sub,tone='')=>`<div class="mod lbm ${tone}"><div class="hd"><span>${title}</span>${desc?`<span class="desc">${desc}</span>`:''}</div><div class="bd">${rows.length?rows.slice(0,10).map((r,i)=>{return `<div class="lb${i<3?' top':''}"><span class="i">${i+1}</span><span class="nm">${plink(r[0])} ${flag((PBY[r[0]]||{}).c)}</span><span class="v">${val(r)}</span><span class="s">${sub(r)}</span></div>`;}).join(''):'<div class="empty">기록 없음</div>'}</div></div>`;
  /* ---- national matchups ---- */
  const CT=['한국','중국','일본','대만'];
  function natAgg(onlyWorld){const m={};for(const g of ok){if(onlyWorld&&g.c!=='세계기전')continue;const a=(PBY[g.wk]||{}).c,b=(PBY[g.lk]||{}).c;if(!CT.includes(a)||!CT.includes(b)||a===b)continue;const [x,z]=CT.indexOf(a)<CT.indexOf(b)?[a,b]:[b,a];const o=m[x+z]=m[x+z]||{a:x,b:z,wa:0,wb:0};if(a===x)o.wa++;else o.wb++;}return Object.values(m).filter(o=>o.wa+o.wb>=3).sort((p,q)=>(q.wa+q.wb)-(p.wa+p.wb));}
  const natHtml=list=>list.length?list.map(o=>{const t=o.wa+o.wb,pa=o.wa/t*100;return `<div class="nat"><span class="na">${flag(o.a)}${o.a}</span><span class="nbw"><span class="nbar"><i class="na" style="width:${pa}%"></i><i class="nb" style="width:${100-pa}%"></i></span><span class="ns"><b>${o.wa}</b><em>${t}국</em><b>${o.wb}</b></span></span><span class="nb2">${o.b}${flag(o.b)}</span></div>`;}).join(''):'<div class="empty">국가 간 대국이 충분하지 않습니다</div>';
  /* 국가별 성적(다른 나라 기사와의 대국만) */
  const ctab={};for(const g of ok){const a=(PBY[g.wk]||{}).c,b=(PBY[g.lk]||{}).c;if(!a||!b||a===b)continue;for(const [c,w] of [[a,1],[b,0]]){if(!CT.includes(c))continue;const o=ctab[c]=ctab[c]||{w:0,n:0};o.n++;o.w+=w;}}
  const cpl={};allKeys.forEach(k=>{const c=(PBY[k]||{}).c;if(CT.includes(c))cpl[c]=(cpl[c]||0)+1;});
  /* ---- upsets ---- */
  const ups=[];for(const g of ok){if(isNK(g.wk)||isNK(g.lk))continue;const ym=((g.d/100)|0);const pm=ym%100===1?ym-89:ym-1;const a=whrAt(g.wk,pm),b=whrAt(g.lk,pm);if(!a||!b||a[2]>UNC_MAX*1.5||b[2]>UNC_MAX)continue;const gap=b[1]-a[1];if(gap>150)ups.push([g,gap,a[1],b[1]]);}
  ups.sort((p,q)=>q[1]-p[1]);
  /* ---- win type / margin / age ---- */
  const WTL=['불계승','집승','시간승','기권승','기타·미기재'],WTC=['--cat1','--cat3','--cat4','--cat5','--rule-dot'];
  const wtIdx=g=>g.r[1]===0?0:g.r[1]===1?1:g.r[1]===3?2:g.r[1]===2?3:4;
  const wtRows=['전체',...CATS].map(c=>{const a=[0,0,0,0,0];ok.forEach(g=>{if(c==='전체'||g.c===c)a[wtIdx(g)]++;});return [c==='전체'?'전체':CLABEL[c],a];}).filter(r=>r[1].reduce((x,y)=>x+y,0)>=20);
  const wtHtml=wtRows.map(([lab,a])=>{const t=a.reduce((x,y)=>x+y,0);return `<div class="wtr"><span class="wl">${lab}</span><span class="wbar">${a.map((v,i)=>v?`<i style="width:${v/t*100}%;background:var(${WTC[i]})" title="${WTL[i]} ${fmt(v)}국 (${pct(v,t)})"></i>`:'').join('')}</span><span class="wn">${fmt(t)}</span></div>`;}).join('');
  const MB=['0.5','1.5','2.5','3.5','4.5','5.5','6.5','7.5','8.5','9.5','10.5+'];const mh=new Array(MB.length).fill(0);let mcount=0;
  ok.forEach(g=>{const m=g.r[2];if(m==null||g.r[1]!==1)return;mcount++;mh[Math.min(10,Math.max(0,Math.floor(m)))]++;});
  const AG=['19세 이하','20–24세','25–29세','30–39세','40–49세','50세 이상'];const agi=a=>a<20?0:a<25?1:a<30?2:a<40?3:a<50?4:5;
  const ag=AG.map(()=>({w:0,n:0}));ok.forEach(g=>{for(const [k,w] of [[g.wk,1],[g.lk,0]]){const p=PBY[k];if(!p||!p.b)continue;const a=ageAt(p.b,g.d);if(a==null||a<6)continue;const o=ag[agi(a)];o.n++;o.w+=w;}});
  const agHtml=ag.map((o,i)=>`<div class="agr"><span class="al">${AG[i]}</span><span class="abar"><i style="width:${o.n?o.w/o.n*100:0}%"></i><b class="mid"></b></span><span class="av">${o.n?(o.w/o.n*100).toFixed(1)+'%':'–'}</span><span class="an">${fmt(o.n)}국</span></div>`).join('');
  /* 대회별 대국 수 */
  const byG={};gs.forEach(g=>{byG[g.g]=(byG[g.g]||0)+1;});
  const gL=Object.entries(byG).sort((a,b)=>b[1]-a[1]).slice(0,10);const gmx=gL.length?gL[0][1]:1;
  /* ---- highlights ---- */
  const bestS=streakL[0];
  const worstS=Object.entries(worst).filter(([k])=>person(k)&&!isNK(k)).sort((a,b)=>b[1][0]-a[1][0])[0];
  const halfL=Object.entries(half).filter(([k])=>person(k)).sort((a,b)=>b[1]-a[1])[0];
  const resL=Object.entries(res).filter(([k])=>person(k)).sort((a,b)=>b[1]-a[1])[0];
  const longG=ok.filter(g=>g.r[3]).sort((a,b)=>b.r[3]-a.r[3])[0];
  const bigM=ok.filter(g=>g.r[2]!=null&&g.r[2]<100).sort((a,b)=>b.r[2]-a.r[2])[0];
  let young=null;for(const g of ok){const p=PBY[g.wk];if(!p||!p.b)continue;const a=ageAt(p.b,g.d);if(a==null||a<6)continue;if(!young||a<young[1]||(a===young[1]&&p.b>PBY[young[0].wk].b))young=[g,a];}
  let old=null;for(const g of ok){const p=PBY[g.wk];if(!p||!p.b)continue;const a=ageAt(p.b,g.d);if(a==null)continue;if(!old||a>old[1])old=[g,a];}
  let youngC=null;champs.filter(c=>c.st===0).forEach(c=>{const p=PBY[c.ck];if(!p||!p.b)return;const a=ageAt(p.b,c.d);if(a!=null&&a>5&&(!youngC||a<youngC[1]))youngC=[c,a];});
  const card=(lab,main,sub,href,ic)=>`<a class="hlc" ${href?`href="${href}"`:''}><span class="l"><i class="hic">${ic}</i>${lab}</span><b>${main}</b><span class="s">${sub}</span></a>`;
  const pl_=k=>'#/players/'+encodeURIComponent(k);
  const hl=[
    bestS?card('시즌 최장 연승',`${esc(nameOf(bestS[0]))} <em>${bestS[1]}연승</em>`,`${dstr(bestS[2]).slice(5)} 도달 · 시즌 안에서만 계산`,pl_(bestS[0]),'▲'):'',
    youngC?card('최연소 우승',`${esc(nameOf(youngC[0].ck))} <em>만 ${youngC[1]}세</em>`,`${esc(G[youngC[0].g])} ${esc(youngC[0].ed)}`,pl_(youngC[0].ck),'★'):'',
    young?card('최연소 승리',`${esc(nameOf(young[0].wk))} <em>만 ${young[1]}세</em>`,`${dstr(young[0].d).slice(5)} · ${esc(T[young[0].ti]).slice(0,24)}`,pl_(young[0].wk),'◆'):'',
    old?card('최고령 승리',`${esc(nameOf(old[0].wk))} <em>만 ${old[1]}세</em>`,`${dstr(old[0].d).slice(5)} · ${esc(T[old[0].ti]).slice(0,24)}`,pl_(old[0].wk),'◇'):'',
    halfL?card('반집승 최다',`${esc(nameOf(halfL[0]))} <em>${halfL[1]}번</em>`,'0.5집 차이로 이긴 대국',pl_(halfL[0]),'½'):'',
    resL?card('불계승 최다',`${esc(nameOf(resL[0]))} <em>${resL[1]}번</em>`,`이긴 대국의 ${pct(resL[1],W[resL[0]])}`,pl_(resL[0]),'●'):'',
    longG?card('최장 수수 대국',`<em>${longG.r[3]}수</em>`,`${esc(nameOf(longG.wk))} 승 · ${esc(nameOf(longG.lk))} · ${dstr(longG.d).slice(5)}`,'#/players/compare?p1='+encodeURIComponent(longG.wk)+'&p2='+encodeURIComponent(longG.lk),'⌛'):'',
    bigM?card('최대 집차 승',`<em>${bigM.r[2]}집</em>`,`${esc(nameOf(bigM.wk))} 승 · ${esc(nameOf(bigM.lk))} · ${dstr(bigM.d).slice(5)}`,'#/players/compare?p1='+encodeURIComponent(bigM.wk)+'&p2='+encodeURIComponent(bigM.lk),'⇡'):'',
  ].filter(Boolean);
  /* ---- rookies & pairs ---- */
  const rook=allKeys.filter(k=>FIRSTY[k]===y&&!isNK(k)).map(k=>[k,W[k]||0]).sort((a,b)=>b[1]-a[1]||(Nn[b[0]]||0)-(Nn[a[0]]||0));
  const pairs={};for(const g of ok){if(!person(g.wk)||!person(g.lk))continue;const [a,b]=g.wk<g.lk?[g.wk,g.lk]:[g.lk,g.wk];const o=pairs[a+'|'+b]=pairs[a+'|'+b]||{a,b,wa:0,wb:0};if(g.wk===a)o.wa++;else o.wb++;}
  const pairL=Object.values(pairs).filter(o=>o.wa+o.wb>=3).sort((p,q)=>(q.wa+q.wb)-(p.wa+p.wb)).slice(0,10);
  /* ---- champions table ---- */
  const score=c=>{if(!c.gi||!c.ck||!c.rk)return '';let a=0,b=0;c.gi.forEach(i=>{const g=GAMES[i];if(!g||g.j)return;if(g.wk===c.ck&&g.lk===c.rk)a++;else if(g.wk===c.rk&&g.lk===c.ck)b++;});return a+b?`${a}-${b}`:'';};
  let lastM=0;const chRows=champs.map(c=>{const m=((c.d/100)|0)%100;const head=m!==lastM?`<tr class="mrow"><td colspan="5">${m}월</td></tr>`:'';lastM=m;const gcat=(GAMES[(c.gi||[])[0]]||{}).c;
    return head+`<tr><td class="d">${dstr(c.d).slice(5)}</td><td class="tname">${gcat?badge(gcat):''} <a class="pl" href="#/tournaments/${c.g}">${esc(G[c.g])}</a> <span class="muted small">${esc(c.ed)}</span></td><td>${c.st===0?plink(c.ck,'w')+' '+flag((PBY[c.ck]||{}).c):'<span class="badge b-U">미확정</span>'}</td><td class="n r">${c.st===0?score(c):''}</td><td>${c.rk?plink(c.rk):''}</td></tr>`;}).join('');
  /* ---- render ---- */
  const kt=(lab,val,dl,sp,tip)=>`<div class="kt"><div class="l">${lab}${tip?' '+calc(tip):''}</div><div class="v">${val}</div><div class="f">${dl}${sp}</div></div>`;
  const cmpLab=Sp?(isCur?`작년 같은 기간(~${String(mmdd).padStart(4,'0').replace(/(\d\d)(\d\d)/,'$1.$2')}) 대비`:'작년 대비'):'';
  const sec=(t,d)=>`<div class="szsec"><h2>${t}</h2>${d?`<span>${d}</span>`:''}</div>`;
  app.innerHTML=crumb([['홈','#/'],['시즌'],[String(y)]])+scopeBar()+`
  <section class="szh">
    ${yearPicker(y)}
    <div class="szt"><div><div class="k">시즌 대시보드</div><h1 class="pt">${y} 시즌</h1><div class="sub">${dstr(gs[0]?gs[0].d:y*10000+101).slice(5).replace('-','.')} – ${dstr(lastDay).slice(5).replace('-','.')} ${isCur?'· <b class="live">진행 중</b>':''} · 한국기원 기록 대국 기준</div></div>
    </div>
    ${thin?'<div class="note" style="margin:10px 20px 0">이 시기는 기록이 부족합니다. 순위와 점수는 참고용으로만 보세요.</div>':''}
    <div class="kts">
      ${kt('대국',fmt(S.n),Sp?delta(Sc.n,Sp.n):'',sp(s=>s.n))}
      ${kt('출전 기사',fmt(S.pl),Sp?delta(Sc.pl,Sp.pl):'',sp(s=>s.pl))}
      ${kt('첫 대국 기사',fmt(S.debut),Sp?delta(Sc.debut,Sp.debut):'',sp(s=>s.debut),'기사 정보에 연결된 기사 중 그해에 첫 대국 기록이 있는 기사')}
      ${kt('우승 판정',`${S.ch}<small>회 · ${S.chp}명</small>`,Sp?delta(Sc.ch,Sp.ch):'',sp(s=>s.ch),'결승·도전기 다승자 판정')}
      ${kt('불계승 비율',S.res!=null?(S.res*100).toFixed(1)+'<small>%</small>':'–',Sp?delta(Sc.res,Sp.res,1):'',sp(s=>s.res))}
      ${kt('반집 승부',S.half!=null?(S.half*100).toFixed(1)+'<small>%</small>':'–',Sp?delta(Sc.half,Sp.half,1):'',sp(s=>s.half))}
      ${kt('평균 수수',S.mv?S.mv.toFixed(0)+'<small>수</small>':'–',Sp&&Sc.mv&&Sp.mv?delta(Sc.mv,Sp.mv):'',sp(s=>s.mv),'수수가 기록된 대국만')}
      ${kt('흑 승률',S.black!=null?(S.black*100).toFixed(1)+'<small>%</small>':'<small>2021년부터</small>',Sp&&Sc.black!=null&&Sp.black!=null?delta(Sc.black,Sp.black,1):'',sp(s=>s.black),'흑백이 기록된 대국만, 2021년 이후(원본 기준)')}
    </div>
    ${cmpLab?`<div class="small kfoot">증감: ${cmpLab} · 작은 그래프: 최근 ${span.length}년 추이</div>`:''}
  </section>
  ${sec('시즌 리더','공식 대국 기준(한국기원 부문별 순위와 같은 기준) · 승패는 무승부·무효 제외')}
  <div class="grid g4">
    ${lb('다승','',winsL,r=>r[1]+'승',r=>rec_(r[0]))}
    ${lb('승률','승패 20국 이상',pctL,r=>(r[1]*100).toFixed(1)+'%',r=>rec_(r[0]))}
    ${lb('실력 점수 상승 '+calc('WHR, 전년 12월 → '+(isCur?'최근':'12월')),'10국 이상',riseL,r=>(r[1]>0?'+':'')+fmt(Math.round(r[1])),r=>fmt(Math.round(r[2])),'tg')}
    ${lb('우승 '+calc('결승·도전기 다승자 판정'),'',chL,r=>r[1]+'회',r=>esc(chCnt[r[0]].map(c=>G[c.g]).slice(0,2).join(', ')),'tgold')}
  </div>
  <div class="grid g4" style="margin-top:16px">
    ${lb('최다 대국','공식 대국 · 무승부 포함',gamesL,r=>r[1]+'국',r=>rec_(r[0]),'tm')}
    ${lb('여자 기사 다승','',womenL,r=>r[1]+'승',r=>rec_(r[0]),'tw')}
    ${lb('20세 이하 다승','시즌 말 나이 기준',youthL,r=>r[1]+'승',r=>{const p=PBY[r[0]];return '만 '+ageAt(p.b,lastDay)+'세 · '+rec_(r[0]);},'ty')}
    ${lb('최장 연승','시즌 안에서만',streakL,r=>r[1]+'연승',r=>dstr(r[2]).slice(5)+' 도달','tm')}
  </div>
  ${sec('하이라이트','')}
  <div class="hls">${hl.join('')}</div>
  ${sec('흐름','')}
  <div class="mod"><div class="hd"><span>대국 달력</span><span class="desc">날짜별 대국 수 · 칸에 마우스를 올리면 숫자가 보입니다</span></div><div class="bd">${calHeat(y,gs,isCur?LASTD:0)}</div></div>
  <div class="grid g21" style="margin-top:16px">
    <div class="mod"><div class="hd"><span>월별 랭킹 변동 ${calc('WHR 월말 순위, 해당 월 기준 랭킹 대상 기사')}</span><span class="desc">${isCur?'최근':'연말'} 상위 8명</span></div><div class="bd"><div class="chart bump"><canvas id="sbump"></canvas></div></div></div>
    <div class="mod"><div class="hd"><span>국가 대항 전적</span><div class="pills" id="natp"><button class="pill" data-v="0" aria-pressed="true">전체</button><button class="pill" data-v="1" aria-pressed="false">세계기전</button></div></div><div class="bd"><div id="natb">${natHtml(natAgg(false))}</div>
      <table class="ctt"><thead><tr><th>국가</th><th class="r">출전 기사</th><th class="r">국제 대국</th><th class="r">승률</th></tr></thead><tbody>${CT.filter(c=>cpl[c]||ctab[c]).map(c=>{const o=ctab[c]||{w:0,n:0};return `<tr><td>${cflag(c)}</td><td class="n r">${fmt(cpl[c]||0)}</td><td class="n r">${fmt(o.n)}</td><td class="n r">${pct(o.w,o.n)}</td></tr>`;}).join('')}</tbody></table>
      <div class="small" style="color:var(--muted);margin-top:8px">기사 정보의 국가 기준 · 국제 대국은 다른 나라 기사와 둔 대국</div></div></div>
  </div>
  <div class="grid g3" style="margin-top:16px">
    <div class="mod"><div class="hd"><span>월별 대국 · 분류</span></div><div class="bd"><div class="chart"><canvas id="sm"></canvas></div></div></div>
    <div class="mod"><div class="hd"><span>승리 방식</span><span class="desc">분류별 비율</span></div><div class="bd"><div class="wtl">${WTL.map((l,i)=>`<span><i style="background:var(${WTC[i]})"></i>${l}</span>`).join('')}</div>${wtHtml||'<div class="empty">기록 없음</div>'}</div></div>
    <div class="mod"><div class="hd"><span>집 차이 분포</span><span class="desc">집승 ${fmt(mcount)}국</span></div><div class="bd"><div class="chart"><canvas id="smg"></canvas></div></div></div>
  </div>
  ${sec('기록','')}
  <div class="grid g21" style="align-items:start">
    <div class="mod"><div class="hd"><span>우승 일정표 ${calc('결승·도전기 다승자 판정')}</span><span class="desc">${champs.length}회차 · 스코어는 결승 대국 기준</span></div><div class="bd flush">${champs.length?`<div class="tw scrollbox" style="max-height:520px"><table class="cht"><thead><tr><th>날짜</th><th>대회</th><th>우승</th><th class="r">스코어</th><th>준우승</th></tr></thead><tbody>${chRows}</tbody></table></div>`:'<div class="empty">이 해에 판정된 우승 기록이 없습니다</div>'}</div></div>
    <div class="mod"><div class="hd"><span>최대 이변 ${calc('직전 월 실력 점수(WHR)가 더 낮은 기사가 이긴 대국, 점수 차 순')}</span></div><div class="bd">${ups.length?ups.slice(0,8).map(([g,gap,a,b])=>`<div class="upr"><div class="gap">+${fmt(Math.round(gap))}</div><div><div>${plink(g.wk,'w')} <span class="muted small">${fmt(Math.round(a))}</span> <span class="muted">→</span> ${plink(g.lk)} <span class="muted small">${fmt(Math.round(b))}</span></div><div class="small muted">${dstr(g.d).slice(5)} · ${esc(T[g.ti]).slice(0,30)}</div></div></div>`).join(''):'<div class="empty">점수 차 150 이상인 이변이 없습니다</div>'}</div></div>
  </div>
  <div class="grid g3" style="margin-top:16px">
    <div class="mod"><div class="hd"><span>연령대별 승률</span><span class="desc">생년이 있는 기사의 모든 대국</span></div><div class="bd">${agHtml}<div class="small" style="color:var(--muted);margin-top:8px">가운데 선이 50%입니다. 대국 당시 만 나이 기준</div></div></div>
    <div class="mod"><div class="hd"><span>대국이 많은 대회</span><span class="desc">상위 10</span></div><div class="bd">${gL.map(([gi,c])=>`<div class="gbr"><a class="pl" href="#/tournaments/${gi}">${esc(G[gi])}</a><span class="gb"><i style="width:${c/gmx*100}%"></i></span><span class="v">${fmt(c)}</span></div>`).join('')}</div></div>
    <div class="mod"><div class="hd"><span>가장 많이 만난 맞대결</span></div><div class="bd">${pairL.length?pairL.map(o=>`<a class="pr" href="#/players/compare?p1=${encodeURIComponent(o.a)}&p2=${encodeURIComponent(o.b)}"><span class="${o.wa>=o.wb?'w':''}">${esc(nameOf(o.a))}</span><b>${o.wa} : ${o.wb}</b><span class="${o.wb>=o.wa?'w':''}">${esc(nameOf(o.b))}</span></a>`).join(''):'<div class="empty">기록 없음</div>'}</div></div>
  </div>
  <div class="grid g2" style="margin-top:16px">
    <div class="mod"><div class="hd"><span>올해 첫 기록 기사</span><span class="desc">공식 대국 승수 순 · ${fmt(rook.length)}명</span></div><div class="bd cols2">${rook.length?rook.slice(0,16).map(([k,w])=>{const p=PBY[k];const a=p&&p.b?ageAt(p.b,lastDay):null;return `<div class="lb2"><span class="nm">${plink(k)} ${flag((p||{}).c)}</span><span class="s">${a!=null?'만 '+a+'세':''}</span><span class="v">${rec_(k)}</span></div>`;}).join(''):'<div class="empty">기록 없음</div>'}</div></div>
    <div class="mod"><div class="hd"><span>최장 연패</span><span class="desc">기사 정보가 있는 기사 · 시즌 안에서만</span></div><div class="bd">${worstS?(()=>{const L2=Object.entries(worst).filter(([k])=>person(k)&&!isNK(k)).map(([k,v])=>[k,v[0],v[1]]).sort((a,b)=>b[1]-a[1]).slice(0,8);return L2.map(([k,n,d])=>`<div class="lb2"><span class="nm">${plink(k)} ${flag((PBY[k]||{}).c)}</span><span class="s">${dstr(d).slice(5)} 도달</span><span class="v">${n}연패</span></div>`).join('');})():'<div class="empty">기록 없음</div>'}</div></div>
  </div>`;
  {const bx=document.getElementById('ys'),on=bx&&bx.querySelector('a.on');if(on)bx.scrollLeft=on.offsetLeft-bx.clientWidth/2;}
  const ysel=document.getElementById('ysel');if(ysel)ysel.onchange=()=>{routeGo('#/seasons/'+ysel.value);};
  window.scrollTo(0,0);
  document.getElementById('natp').onclick=e=>{const b=e.target.closest('button');if(!b)return;document.querySelectorAll('#natp button').forEach(x=>x.setAttribute('aria-pressed',x===b));document.getElementById('natb').innerHTML=natHtml(natAgg(b.dataset.v==='1'));};
  /* charts */
  const ms=[1,2,3,4,5,6,7,8,9,10,11,12];
  mkChart('sm',{type:'bar',data:{labels:ms.map(m=>m+'월'),datasets:CATS.map(c=>({label:CLABEL[c],data:ms.map(m=>gs.filter(g=>g.c===c&&((g.d/100)|0)%100===m).length),backgroundColor:CAT_COLOR[c],borderColor:cssv('--card'),borderWidth:{top:2},borderSkipped:false,stack:'s'}))},options:{maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:10,boxHeight:10,font:{size:11}}}},scales:{x:{...noGrid(),stacked:true,ticks:{maxRotation:0,autoSkip:false,font:{size:10.5}}},y:{...gridY(),stacked:true}}}});
  mkChart('smg',{type:'bar',data:{labels:MB,datasets:[{label:'대국',data:mh,backgroundColor:cssv('--cat1'),borderRadius:{topLeft:4,topRight:4},maxBarThickness:28}]},options:{maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${fmt(c.parsed.y)}국 (${pct(c.parsed.y,mcount)})`}}},scales:{x:{...noGrid(),title:{display:true,text:'집 차이',font:{size:11}},ticks:{maxRotation:0,autoSkip:false,font:{size:10.5}}},y:gridY()}}});
  const lastMo=isCur?((LASTD/100)|0)%100:12;const months=ms.filter(m=>m<=lastMo);
  const rk=months.map(m=>rankAt(y*100+m));
  const top=Object.entries(rk[rk.length-1]||{}).sort((a,b)=>a[1]-b[1]).slice(0,8).map(x=>x[0]);
  if(top.length){
    const cols=['--cat1','--cat2','--cat3','--cat4','--cat5','--cat6','--cat7','--cat8'].map(cssv);
    const maxR=Math.min(20,Math.max(10,...rk.flatMap(r=>top.map(k=>r[k]||0)).filter(v=>v<=20)));
    mkChart('sbump',{type:'line',data:{labels:months.map(m=>m+'월'),datasets:top.map((k,i)=>({label:nameOf(k),data:rk.map(r=>r[k]&&r[k]<=maxR?r[k]:null),borderColor:cols[i],backgroundColor:cols[i],borderWidth:2.2,pointRadius:3.5,pointHoverRadius:6,pointBorderColor:cssv('--card'),pointBorderWidth:1.5,tension:.25,spanGaps:false}))},
      options:{maintainAspectRatio:false,layout:{padding:{right:6}},interaction:{mode:'nearest',intersect:false},plugins:{legend:{position:'right',labels:{usePointStyle:true,pointStyle:'circle',boxWidth:8,font:{size:12}}},tooltip:{callbacks:{label:c=>`${c.dataset.label} ${c.parsed.y}위`}}},scales:{x:noGrid(),y:{reverse:true,min:1,max:maxR,ticks:{stepSize:1,callback:v=>v+'위'},grid:{color:cssv('--rule-2')},border:{display:false}}}}});
  }else document.getElementById('sbump').parentElement.innerHTML='<div class="empty">이 시기는 랭킹을 계산하지 않습니다(표본 부족)</div>';
}
/* =============== 로고타입 =============== */
const BRAND={"h_light": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 451.2 103.3\" role=\"img\" aria-label=\"바둑DB\"><circle cx=\"24.30\" cy=\"24.30\" r=\"24.30\" fill=\"#0C111D\"/><circle cx=\"78.99\" cy=\"24.30\" r=\"21.87\" fill=\"#FFFFFF\" stroke=\"#0C111D\" stroke-width=\"4.86\"/><circle cx=\"24.30\" cy=\"78.99\" r=\"21.87\" fill=\"#FFFFFF\" stroke=\"#0C111D\" stroke-width=\"4.86\"/><circle cx=\"78.99\" cy=\"78.99\" r=\"24.30\" fill=\"#005DF9\"/><g transform=\"translate(125.56 89.00) scale(1.0000)\"><path fill=\"#0C111D\" d=\"M5.9 -77.30000000000001V-11.8H52.5V-77.30000000000001H36.5V-55.5H21.900000000000002V-77.30000000000001ZM21.900000000000002 -43.1H36.5V-24.6H21.900000000000002ZM61.6 -84.30000000000001V9.5H77.80000000000001V-37.300000000000004H90.4V-50.5H77.80000000000001V-84.30000000000001ZM102.9 -21.700000000000003V-9.1H152.6V9.600000000000001H168.7V-21.700000000000003H144.0V-28.8H178.60000000000002V-41.5H93.7V-28.8H127.9V-21.700000000000003ZM103.7 -80.7V-47.2H169.5V-59.800000000000004H119.7V-68.10000000000001H168.7V-80.7Z\"/><path fill=\"#005DF9\" d=\"M222.421875 0.0C244.541015625 0.0 258.212890625 -13.671875 258.212890625 -36.376953125C258.212890625 -59.08203125 244.541015625 -72.75390625 222.421875 -72.75390625H195.6640625V0.0ZM212.900390625 -14.74609375V-58.0078125H221.4453125C234.189453125 -58.0078125 240.9765625 -52.1484375 240.9765625 -36.376953125C240.9765625 -20.60546875 234.189453125 -14.74609375 221.689453125 -14.74609375ZM265.9296875 0.0H298.3515625C314.46484375 0.0 323.595703125 -8.59375 323.595703125 -20.3125C323.595703125 -30.859375 315.978515625 -37.451171875 307.23828125 -37.79296875V-38.57421875C315.1484375 -40.185546875 320.763671875 -45.947265625 320.763671875 -54.296875C320.763671875 -65.283203125 312.365234375 -72.75390625 296.10546875 -72.75390625H265.9296875ZM283.166015625 -13.916015625V-31.591796875H294.640625C301.427734375 -31.591796875 305.626953125 -27.9296875 305.626953125 -22.265625C305.626953125 -17.08984375 302.013671875 -13.916015625 294.298828125 -13.916015625ZM283.166015625 -42.7734375V-58.984375H293.46875C299.42578125 -58.984375 303.185546875 -55.908203125 303.185546875 -51.025390625C303.185546875 -45.80078125 298.986328125 -42.7734375 293.17578125 -42.7734375Z\"/></g></svg>", "v_light": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 319.7 309.9\" role=\"img\" aria-label=\"바둑DB\"><circle cx=\"117.59\" cy=\"37.56\" r=\"37.56\" fill=\"#0C111D\"/><circle cx=\"202.10\" cy=\"37.56\" r=\"33.80\" fill=\"#FFFFFF\" stroke=\"#0C111D\" stroke-width=\"7.51\"/><circle cx=\"117.59\" cy=\"122.07\" r=\"33.80\" fill=\"#FFFFFF\" stroke=\"#0C111D\" stroke-width=\"7.51\"/><circle cx=\"202.10\" cy=\"122.07\" r=\"37.56\" fill=\"#005DF9\"/><g transform=\"translate(-5.90 300.27) scale(1.0000)\"><path fill=\"#0C111D\" d=\"M5.9 -77.30000000000001V-11.8H52.5V-77.30000000000001H36.5V-55.5H21.900000000000002V-77.30000000000001ZM21.900000000000002 -43.1H36.5V-24.6H21.900000000000002ZM61.6 -84.30000000000001V9.5H77.80000000000001V-37.300000000000004H90.4V-50.5H77.80000000000001V-84.30000000000001ZM102.9 -21.700000000000003V-9.1H152.6V9.600000000000001H168.7V-21.700000000000003H144.0V-28.8H178.60000000000002V-41.5H93.7V-28.8H127.9V-21.700000000000003ZM103.7 -80.7V-47.2H169.5V-59.800000000000004H119.7V-68.10000000000001H168.7V-80.7Z\"/><path fill=\"#005DF9\" d=\"M222.421875 0.0C244.541015625 0.0 258.212890625 -13.671875 258.212890625 -36.376953125C258.212890625 -59.08203125 244.541015625 -72.75390625 222.421875 -72.75390625H195.6640625V0.0ZM212.900390625 -14.74609375V-58.0078125H221.4453125C234.189453125 -58.0078125 240.9765625 -52.1484375 240.9765625 -36.376953125C240.9765625 -20.60546875 234.189453125 -14.74609375 221.689453125 -14.74609375ZM265.9296875 0.0H298.3515625C314.46484375 0.0 323.595703125 -8.59375 323.595703125 -20.3125C323.595703125 -30.859375 315.978515625 -37.451171875 307.23828125 -37.79296875V-38.57421875C315.1484375 -40.185546875 320.763671875 -45.947265625 320.763671875 -54.296875C320.763671875 -65.283203125 312.365234375 -72.75390625 296.10546875 -72.75390625H265.9296875ZM283.166015625 -13.916015625V-31.591796875H294.640625C301.427734375 -31.591796875 305.626953125 -27.9296875 305.626953125 -22.265625C305.626953125 -17.08984375 302.013671875 -13.916015625 294.298828125 -13.916015625ZM283.166015625 -42.7734375V-58.984375H293.46875C299.42578125 -58.984375 303.185546875 -55.908203125 303.185546875 -51.025390625C303.185546875 -45.80078125 298.986328125 -42.7734375 293.17578125 -42.7734375Z\"/></g></svg>", "m_light": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 170.0 170.0\" role=\"img\" aria-label=\"바둑DB 심볼\"><circle cx=\"40.00\" cy=\"40.00\" r=\"40.00\" fill=\"#0C111D\"/><circle cx=\"130.00\" cy=\"40.00\" r=\"36.00\" fill=\"#FFFFFF\" stroke=\"#0C111D\" stroke-width=\"8.00\"/><circle cx=\"40.00\" cy=\"130.00\" r=\"36.00\" fill=\"#FFFFFF\" stroke=\"#0C111D\" stroke-width=\"8.00\"/><circle cx=\"130.00\" cy=\"130.00\" r=\"40.00\" fill=\"#005DF9\"/></svg>", "w_light": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 319.7 93.9\" role=\"img\" aria-label=\"바둑DB\"><g transform=\"translate(-5.90 84.30) scale(1.0000)\"><path fill=\"#0C111D\" d=\"M5.9 -77.30000000000001V-11.8H52.5V-77.30000000000001H36.5V-55.5H21.900000000000002V-77.30000000000001ZM21.900000000000002 -43.1H36.5V-24.6H21.900000000000002ZM61.6 -84.30000000000001V9.5H77.80000000000001V-37.300000000000004H90.4V-50.5H77.80000000000001V-84.30000000000001ZM102.9 -21.700000000000003V-9.1H152.6V9.600000000000001H168.7V-21.700000000000003H144.0V-28.8H178.60000000000002V-41.5H93.7V-28.8H127.9V-21.700000000000003ZM103.7 -80.7V-47.2H169.5V-59.800000000000004H119.7V-68.10000000000001H168.7V-80.7Z\"/><path fill=\"#005DF9\" d=\"M222.421875 0.0C244.541015625 0.0 258.212890625 -13.671875 258.212890625 -36.376953125C258.212890625 -59.08203125 244.541015625 -72.75390625 222.421875 -72.75390625H195.6640625V0.0ZM212.900390625 -14.74609375V-58.0078125H221.4453125C234.189453125 -58.0078125 240.9765625 -52.1484375 240.9765625 -36.376953125C240.9765625 -20.60546875 234.189453125 -14.74609375 221.689453125 -14.74609375ZM265.9296875 0.0H298.3515625C314.46484375 0.0 323.595703125 -8.59375 323.595703125 -20.3125C323.595703125 -30.859375 315.978515625 -37.451171875 307.23828125 -37.79296875V-38.57421875C315.1484375 -40.185546875 320.763671875 -45.947265625 320.763671875 -54.296875C320.763671875 -65.283203125 312.365234375 -72.75390625 296.10546875 -72.75390625H265.9296875ZM283.166015625 -13.916015625V-31.591796875H294.640625C301.427734375 -31.591796875 305.626953125 -27.9296875 305.626953125 -22.265625C305.626953125 -17.08984375 302.013671875 -13.916015625 294.298828125 -13.916015625ZM283.166015625 -42.7734375V-58.984375H293.46875C299.42578125 -58.984375 303.185546875 -55.908203125 303.185546875 -51.025390625C303.185546875 -45.80078125 298.986328125 -42.7734375 293.17578125 -42.7734375Z\"/></g></svg>", "h_dark": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 451.2 103.3\" role=\"img\" aria-label=\"바둑DB\"><circle cx=\"24.30\" cy=\"24.30\" r=\"24.30\" fill=\"#FFFFFF\"/><circle cx=\"78.99\" cy=\"24.30\" r=\"21.87\" fill=\"#0C111D\" stroke=\"#FFFFFF\" stroke-width=\"4.86\"/><circle cx=\"24.30\" cy=\"78.99\" r=\"21.87\" fill=\"#0C111D\" stroke=\"#FFFFFF\" stroke-width=\"4.86\"/><circle cx=\"78.99\" cy=\"78.99\" r=\"24.30\" fill=\"#005DF9\"/><g transform=\"translate(125.56 89.00) scale(1.0000)\"><path fill=\"#FFFFFF\" d=\"M5.9 -77.30000000000001V-11.8H52.5V-77.30000000000001H36.5V-55.5H21.900000000000002V-77.30000000000001ZM21.900000000000002 -43.1H36.5V-24.6H21.900000000000002ZM61.6 -84.30000000000001V9.5H77.80000000000001V-37.300000000000004H90.4V-50.5H77.80000000000001V-84.30000000000001ZM102.9 -21.700000000000003V-9.1H152.6V9.600000000000001H168.7V-21.700000000000003H144.0V-28.8H178.60000000000002V-41.5H93.7V-28.8H127.9V-21.700000000000003ZM103.7 -80.7V-47.2H169.5V-59.800000000000004H119.7V-68.10000000000001H168.7V-80.7Z\"/><path fill=\"#005DF9\" d=\"M222.421875 0.0C244.541015625 0.0 258.212890625 -13.671875 258.212890625 -36.376953125C258.212890625 -59.08203125 244.541015625 -72.75390625 222.421875 -72.75390625H195.6640625V0.0ZM212.900390625 -14.74609375V-58.0078125H221.4453125C234.189453125 -58.0078125 240.9765625 -52.1484375 240.9765625 -36.376953125C240.9765625 -20.60546875 234.189453125 -14.74609375 221.689453125 -14.74609375ZM265.9296875 0.0H298.3515625C314.46484375 0.0 323.595703125 -8.59375 323.595703125 -20.3125C323.595703125 -30.859375 315.978515625 -37.451171875 307.23828125 -37.79296875V-38.57421875C315.1484375 -40.185546875 320.763671875 -45.947265625 320.763671875 -54.296875C320.763671875 -65.283203125 312.365234375 -72.75390625 296.10546875 -72.75390625H265.9296875ZM283.166015625 -13.916015625V-31.591796875H294.640625C301.427734375 -31.591796875 305.626953125 -27.9296875 305.626953125 -22.265625C305.626953125 -17.08984375 302.013671875 -13.916015625 294.298828125 -13.916015625ZM283.166015625 -42.7734375V-58.984375H293.46875C299.42578125 -58.984375 303.185546875 -55.908203125 303.185546875 -51.025390625C303.185546875 -45.80078125 298.986328125 -42.7734375 293.17578125 -42.7734375Z\"/></g></svg>", "v_dark": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 319.7 309.9\" role=\"img\" aria-label=\"바둑DB\"><circle cx=\"117.59\" cy=\"37.56\" r=\"37.56\" fill=\"#FFFFFF\"/><circle cx=\"202.10\" cy=\"37.56\" r=\"33.80\" fill=\"#0C111D\" stroke=\"#FFFFFF\" stroke-width=\"7.51\"/><circle cx=\"117.59\" cy=\"122.07\" r=\"33.80\" fill=\"#0C111D\" stroke=\"#FFFFFF\" stroke-width=\"7.51\"/><circle cx=\"202.10\" cy=\"122.07\" r=\"37.56\" fill=\"#005DF9\"/><g transform=\"translate(-5.90 300.27) scale(1.0000)\"><path fill=\"#FFFFFF\" d=\"M5.9 -77.30000000000001V-11.8H52.5V-77.30000000000001H36.5V-55.5H21.900000000000002V-77.30000000000001ZM21.900000000000002 -43.1H36.5V-24.6H21.900000000000002ZM61.6 -84.30000000000001V9.5H77.80000000000001V-37.300000000000004H90.4V-50.5H77.80000000000001V-84.30000000000001ZM102.9 -21.700000000000003V-9.1H152.6V9.600000000000001H168.7V-21.700000000000003H144.0V-28.8H178.60000000000002V-41.5H93.7V-28.8H127.9V-21.700000000000003ZM103.7 -80.7V-47.2H169.5V-59.800000000000004H119.7V-68.10000000000001H168.7V-80.7Z\"/><path fill=\"#005DF9\" d=\"M222.421875 0.0C244.541015625 0.0 258.212890625 -13.671875 258.212890625 -36.376953125C258.212890625 -59.08203125 244.541015625 -72.75390625 222.421875 -72.75390625H195.6640625V0.0ZM212.900390625 -14.74609375V-58.0078125H221.4453125C234.189453125 -58.0078125 240.9765625 -52.1484375 240.9765625 -36.376953125C240.9765625 -20.60546875 234.189453125 -14.74609375 221.689453125 -14.74609375ZM265.9296875 0.0H298.3515625C314.46484375 0.0 323.595703125 -8.59375 323.595703125 -20.3125C323.595703125 -30.859375 315.978515625 -37.451171875 307.23828125 -37.79296875V-38.57421875C315.1484375 -40.185546875 320.763671875 -45.947265625 320.763671875 -54.296875C320.763671875 -65.283203125 312.365234375 -72.75390625 296.10546875 -72.75390625H265.9296875ZM283.166015625 -13.916015625V-31.591796875H294.640625C301.427734375 -31.591796875 305.626953125 -27.9296875 305.626953125 -22.265625C305.626953125 -17.08984375 302.013671875 -13.916015625 294.298828125 -13.916015625ZM283.166015625 -42.7734375V-58.984375H293.46875C299.42578125 -58.984375 303.185546875 -55.908203125 303.185546875 -51.025390625C303.185546875 -45.80078125 298.986328125 -42.7734375 293.17578125 -42.7734375Z\"/></g></svg>", "m_dark": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 170.0 170.0\" role=\"img\" aria-label=\"바둑DB 심볼\"><circle cx=\"40.00\" cy=\"40.00\" r=\"40.00\" fill=\"#FFFFFF\"/><circle cx=\"130.00\" cy=\"40.00\" r=\"36.00\" fill=\"#0C111D\" stroke=\"#FFFFFF\" stroke-width=\"8.00\"/><circle cx=\"40.00\" cy=\"130.00\" r=\"36.00\" fill=\"#0C111D\" stroke=\"#FFFFFF\" stroke-width=\"8.00\"/><circle cx=\"130.00\" cy=\"130.00\" r=\"40.00\" fill=\"#005DF9\"/></svg>", "w_dark": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 319.7 93.9\" role=\"img\" aria-label=\"바둑DB\"><g transform=\"translate(-5.90 84.30) scale(1.0000)\"><path fill=\"#FFFFFF\" d=\"M5.9 -77.30000000000001V-11.8H52.5V-77.30000000000001H36.5V-55.5H21.900000000000002V-77.30000000000001ZM21.900000000000002 -43.1H36.5V-24.6H21.900000000000002ZM61.6 -84.30000000000001V9.5H77.80000000000001V-37.300000000000004H90.4V-50.5H77.80000000000001V-84.30000000000001ZM102.9 -21.700000000000003V-9.1H152.6V9.600000000000001H168.7V-21.700000000000003H144.0V-28.8H178.60000000000002V-41.5H93.7V-28.8H127.9V-21.700000000000003ZM103.7 -80.7V-47.2H169.5V-59.800000000000004H119.7V-68.10000000000001H168.7V-80.7Z\"/><path fill=\"#005DF9\" d=\"M222.421875 0.0C244.541015625 0.0 258.212890625 -13.671875 258.212890625 -36.376953125C258.212890625 -59.08203125 244.541015625 -72.75390625 222.421875 -72.75390625H195.6640625V0.0ZM212.900390625 -14.74609375V-58.0078125H221.4453125C234.189453125 -58.0078125 240.9765625 -52.1484375 240.9765625 -36.376953125C240.9765625 -20.60546875 234.189453125 -14.74609375 221.689453125 -14.74609375ZM265.9296875 0.0H298.3515625C314.46484375 0.0 323.595703125 -8.59375 323.595703125 -20.3125C323.595703125 -30.859375 315.978515625 -37.451171875 307.23828125 -37.79296875V-38.57421875C315.1484375 -40.185546875 320.763671875 -45.947265625 320.763671875 -54.296875C320.763671875 -65.283203125 312.365234375 -72.75390625 296.10546875 -72.75390625H265.9296875ZM283.166015625 -13.916015625V-31.591796875H294.640625C301.427734375 -31.591796875 305.626953125 -27.9296875 305.626953125 -22.265625C305.626953125 -17.08984375 302.013671875 -13.916015625 294.298828125 -13.916015625ZM283.166015625 -42.7734375V-58.984375H293.46875C299.42578125 -58.984375 303.185546875 -55.908203125 303.185546875 -51.025390625C303.185546875 -45.80078125 298.986328125 -42.7734375 293.17578125 -42.7734375Z\"/></g></svg>", "fav": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" rx=\"14\" fill=\"#FFFFFF\"/><circle cx=\"18\" cy=\"18\" r=\"12\" fill=\"#0C111D\"/><circle cx=\"46\" cy=\"18\" r=\"10.5\" fill=\"#FFFFFF\" stroke=\"#0C111D\" stroke-width=\"3\"/><circle cx=\"18\" cy=\"46\" r=\"10.5\" fill=\"#FFFFFF\" stroke=\"#0C111D\" stroke-width=\"3\"/><circle cx=\"46\" cy=\"46\" r=\"12\" fill=\"#005DF9\"/></svg>", "fav_dark": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" rx=\"14\" fill=\"#0C111D\"/><circle cx=\"18\" cy=\"18\" r=\"12\" fill=\"#FFFFFF\"/><circle cx=\"46\" cy=\"18\" r=\"10.5\" fill=\"#0C111D\" stroke=\"#FFFFFF\" stroke-width=\"3\"/><circle cx=\"18\" cy=\"46\" r=\"10.5\" fill=\"#0C111D\" stroke=\"#FFFFFF\" stroke-width=\"3\"/><circle cx=\"46\" cy=\"46\" r=\"12\" fill=\"#005DF9\"/></svg>"};
function brandSvgDl(name,svg){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
function brandPngDl(name,svg,h,bg){
  const vb=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);const W=+vb[1],H=+vb[2];const pad=bg?Math.round(h*0.25):0;
  const ch=h,cw=Math.round(h*W/H);const img=new Image();
  img.onload=()=>{const c=document.createElement('canvas');c.width=cw+pad*2;c.height=ch+pad*2;const x=c.getContext('2d');if(bg){x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);}x.drawImage(img,pad,pad,cw,ch);
    c.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);},'image/png');};
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
function pBrand(){
  const B=BRAND;
  const dlb=(id,label)=>`<button type="button" class="bdl" data-dl="${id}">${label}</button>`;
  const card=(title,desc,light,dark,key)=>`<div class="bcard"><div class="bhd"><b>${title}</b><span>${desc}</span></div>
    <div class="bpair"><div class="bpv bl">${light}</div><div class="bpv bd">${dark}</div></div>
    <div class="bft">${dlb(key+'_light.svg','밝은 배경 SVG')}${dlb(key+'_dark.svg','어두운 배경 SVG')}${dlb(key+'_light.png','PNG')}</div></div>`;
  const sw=(hex,name,use,dark)=>`<div class="bsw"><div class="bchip" style="background:${hex}${hex==='#FFFFFF'?';box-shadow:inset 0 0 0 1px var(--rule)':''}"></div><div><b>${name}</b><code>${hex}</code><span>${use}</span></div></div>`;
  const dont=(label,inner,style)=>`<figure class="bdont"><div class="bpv bl" style="${style||''}">${inner}</div><figcaption><span class="bx" aria-hidden="true">✕</span>${label}</figcaption></figure>`;
  app.innerHTML=crumb([['홈','#/'],['로고타입']])+`<h1 class="pt">로고타입</h1>
  <p class="lede">바둑DB 로고의 구성, 색, 여백과 쓰는 법입니다. 내려받는 파일은 글자를 도형으로 바꾼 벡터라 글꼴이 없어도 똑같이 보입니다.</p>
  <section class="bhero"><div class="bpv bl big">${B.h_light}</div><div class="bpv bd big">${B.h_dark}</div></section>
  <h2 class="sec"><span>로고 종류</span></h2>
  <div class="bgrid">
    ${card('가로형 (기본)','사이트 상단, 문서 머리글 등 대부분의 자리',B.h_light,B.h_dark,'h')}
    ${card('세로형','정사각 공간, 표지, 프로필 이미지',B.v_light,B.v_dark,'v')}
    ${card('심볼','공간이 아주 좁을 때, 아이콘',B.m_light,B.m_dark,'m')}
    ${card('워드마크','심볼이 이미 보이는 곳의 글자 표기',B.w_light,B.w_dark,'w')}
  </div>
  <h2 class="sec"><span>구성</span></h2>
  <div class="bgrid b2">
    <div class="bcard"><div class="bpv bl" style="height:150px">${B.m_light}</div><div class="btx"><b>심볼 — 네 점 체크</b><p>흑돌·백돌·백돌·파란 돌 네 점을 2×2로 놓은 모양입니다. 흑과 백의 대국과, 그 기록이 쌓인 데이터(빨간 돌)를 함께 나타냅니다. 흑돌은 왼쪽 위, 빨간 돌은 오른쪽 아래에 놓이며 자리는 바꾸지 않습니다.</p></div></div>
    <div class="bcard"><div class="bpv bl" style="height:150px">${B.w_light}</div><div class="btx"><b>워드마크</b><p>'바둑'은 Noto Sans KR Black, 'DB'는 Inter ExtraBold입니다. 두 글자 사이 간격은 글자 크기의 8%, 자간은 −2%입니다. 'DB'에만 빨강을 씁니다.</p></div></div>
  </div>
  <h2 class="sec"><span>색</span></h2>
  <div class="bsws">
    ${sw('#0C111D','남색','흑돌, 밝은 배경의 글자, 어두운 배경')}
    ${sw('#FFFFFF','백','백돌, 어두운 배경의 글자')}
    ${sw('#005DF9','파랑','DB 글자, 파란 돌')}
  </div>
  <h2 class="sec"><span>여백과 최소 크기</span></h2>
  <div class="bgrid b2">
    <div class="bcard"><div class="bpv bl" style="padding:28px"><div class="bclear">${B.h_light}</div></div><div class="btx"><b>여백</b><p>로고 둘레에는 심볼 높이의 절반 이상을 비워 둡니다(점선). 다른 글자나 그림이 이 안에 들어오지 않게 합니다.</p></div></div>
    <div class="bcard"><div class="bpv bl bmin"><div style="height:20px">${B.h_light}</div><div style="height:16px">${B.m_light}</div></div><div class="btx"><b>최소 크기</b><p>가로형은 높이 20px(인쇄 6mm), 심볼은 16px(인쇄 4mm)보다 작게 쓰지 않습니다. 더 작으면 파비콘을 씁니다.</p></div></div>
  </div>
  <h2 class="sec"><span>파비콘</span></h2>
  <div class="bcard bfc"><div class="bfav">${[16,32,48,64,180].map(s=>`<div><div style="width:${s}px;height:${s}px">${B.fav}</div><span>${s}px</span></div>`).join('')}<div><div style="width:64px;height:64px">${B.fav_dark}</div><span>어두운 화면</span></div></div>
    <div class="btx"><p>브라우저 탭과 홈 화면 아이콘에 씁니다. 작은 크기에서도 네 점이 구분되도록 돌 사이를 띄웠습니다. 사이트에는 남색 바탕(어두운 화면) 파비콘을 씁니다.</p></div>
    <div class="bft">${dlb('fav.svg','SVG')}${dlb('fav_180.png','PNG 180px')}${dlb('fav_32.png','PNG 32px')}</div></div>
  <h2 class="sec"><span>이렇게 쓰지 않습니다</span></h2>
  <div class="bgrid b4">
    ${dont('늘리거나 줄이지 않기',`<div style="transform:scaleX(1.45);width:60%">${B.h_light}</div>`)}
    ${dont('색 바꾸지 않기',`<div style="width:80%;filter:hue-rotate(110deg)">${B.h_light}</div>`)}
    ${dont('돌 자리 바꾸지 않기',`<div style="width:30%;transform:rotate(90deg)">${B.m_light}</div>`)}
    ${dont('복잡한 배경 위에 두지 않기',`<div style="width:80%">${B.h_light}</div>`,'background:repeating-linear-gradient(45deg,#d6dbe4 0 8px,#9aa7bd 8px 16px)')}
  </div>`;
  const files={h_light:B.h_light,h_dark:B.h_dark,v_light:B.v_light,v_dark:B.v_dark,m_light:B.m_light,m_dark:B.m_dark,w_light:B.w_light,w_dark:B.w_dark,fav:B.fav};
  app.querySelectorAll('.bdl').forEach(b=>b.onclick=()=>{const id=b.dataset.dl;const [base,ext]=id.split('.');const fn='baduk-db_'+id;
    if(ext==='svg')return brandSvgDl(fn,files[base]);
    if(base==='fav_180')return brandPngDl(fn,B.fav,180);if(base==='fav_32')return brandPngDl(fn,B.fav,32);
    brandPngDl(fn,files[base],base.startsWith('v')?600:300,'#FFFFFF');});
}

/* =============== 개요 대시보드 시안 (#/overview) =============== */
const OVC={teal:'#1b7a68',tealL:'#cfe6df',gold:'#c4961a',goldL:'#f3e6bf',ink:'#16191d',mute:'#6b7280',grid:'#e7e9ec',grey:'#b9bec6'};
function pOverview(q){
  q=q||{};const st={f:['all','kr','w'].includes(q.f)?q.f:'all'};
  app.innerHTML=`<div class="ov">
  <header class="ov-h"><div><h1>바둑 기록 개요</h1><p id="ovsub"></p></div>
  <div class="ov-seg" role="group" aria-label="대상"><span>대상</span>${[['all','전체'],['kr','한국'],['w','여자']].map(([v,l])=>`<button data-v="${v}" aria-pressed="${st.f===v}">${l}</button>`).join('')}</div></header>
  <div class="ov-kpis" id="ovk"></div>
  <div class="ov-row r21"><section class="ov-card"><h2>하루 대국 수</h2><p class="ov-d">최근 12개월, 굵은 선은 7일 평균</p><div id="ova"></div></section>
    <section class="ov-card"><h2>나이별 승률</h2><p class="ov-d">대국 당시 나이, 무승부·무효 제외. 색칠한 구간은 2016년 이후 승률이 가장 높은 나이</p><div id="ovb"></div></section></div>
  <div class="ov-row r11"><section class="ov-card"><h2>올해 많이 둔 기사</h2><p class="ov-d">최근 12개월, 나라별로 묶고 원 크기는 대국 수</p><div id="ovc"></div></section>
    <section class="ov-card"><h2>1년 사이 순위 변동</h2><p class="ov-d">실력 점수 순위, 지금과 1년 전 비교</p><div id="ovd"></div></section></div>
  <p class="ov-foot">이 화면은 홈 시안입니다. 모든 수치는 한국기원 기록실 대국으로 계산했습니다.</p></div>`;
  document.querySelector('.ov-seg').onclick=e=>{const b=e.target.closest('button');if(!b)return;st.f=b.dataset.v;document.querySelectorAll('.ov-seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));draw();};
  draw();
  function draw(){
    const inG=k=>{const p=PBY[k];if(st.f==='kr')return !!p&&p.c==='한국';if(st.f==='w')return !!p&&p.g==='여자';return true;};
    const gIn=g=>st.f==='all'||inG(g.wk)||inG(g.lk);
    const dn=d=>Date.UTC((d/10000)|0,((d/100)|0)%100-1,d%100||1)/864e5;
    const end=dn(LASTD),start=end-364;
    const win=GAMES.filter(g=>{const x=dn(g.d);return x>=start&&x<=end&&gIn(g);});
    const fl=st.f==='kr'?'한국 기사가 둔':st.f==='w'?'여자 기사가 둔':'모든';
    const ppl=new Set();win.forEach(g=>{if(inG(g.wk))ppl.add(g.wk);if(inG(g.lk))ppl.add(g.lk);});
    document.getElementById('ovsub').textContent=`기사 ${fmt(ppl.size)}명, 대국 ${fmt(win.length)}국, ${ymd2(start)} ~ ${dstr(LASTD).replace(/-/g,'.')}`;
    // ---- KPI
    const day={};win.forEach(g=>{const x=dn(g.d);day[x]=(day[x]||0)+1;});
    const bd=Object.entries(day).sort((a,b)=>b[1]-a[1])[0]||[end,0];
    const col=win.filter(g=>!g.j&&g.r[0]&&(g.r[1]===0||(g.r[1]===1&&g.r[2]!=null)));const bw=col.filter(g=>g.r[0]===1).length;
    const nd=win.filter(g=>!g.j);const res=nd.filter(g=>g.r[1]===0).length;
    const kc=nd.filter(g=>{const a=(PBY[g.wk]||{}).c,b=(PBY[g.lk]||{}).c;return (a==='한국'&&b==='중국')||(a==='중국'&&b==='한국');});const kcw=kc.filter(g=>(PBY[g.wk]||{}).c==='한국').length;
    const tops=currentTop(null,400).filter(([k])=>inG(k));const t1=tops[0],t2=tops[1];
    const K=(lab,v,sub,cls='')=>`<div class="ov-k ${cls}"><div class="l">${lab}</div><div class="v">${v}</div><div class="s">${sub}</div></div>`;
    document.getElementById('ovk').innerHTML=
      K('대국, 최근 12개월',fmtK(win.length),`${fl} 대국, 모든 대회`)+
      K('가장 많이 둔 날',fmt(bd[1]),wd(+bd[0]))+
      K('흑번 승률',pc(bw,col.length),`불계승·집수가 적힌 ${fmt(col.length)}국 기준`)+
      K('불계승',pc(res,nd.length),`끝까지 계가한 대국은 ${pc(nd.filter(g=>g.r[1]===1).length,nd.length)}`,'gold')+
      K('한중전 한국 승률',pc(kcw,kc.length),`${fmt(kc.length)}국 중 ${fmt(kcw)}승`,'gold')+
      K('실력 점수 1위',t1?fmt(t1[1]):'–',t1?`${esc(nameOf(t1[0]))}, 2위와 ${t2?fmt(t1[1]-t2[1]):'–'}점 차`:'','teal');
    chartDaily(document.getElementById('ova'),day,start,end);
    chartAge(document.getElementById('ovb'),inG);
    chartBubbles(document.getElementById('ovc'),win,inG);
    chartMoves(document.getElementById('ovd'),inG);
  }
}
const fmtK=n=>n>=10000?(n/1000).toFixed(n>=100000?0:1)+'K':fmt(n);
const pc=(a,b)=>b?(a/b*100).toFixed(1).replace(/\.0$/,'')+'%':'–';
const ymd2=x=>{const d=new Date(x*864e5);return `${d.getUTCFullYear()}.${String(d.getUTCMonth()+1).padStart(2,'0')}.${String(d.getUTCDate()).padStart(2,'0')}`;};
const wd=x=>{const d=new Date(x*864e5);return `${d.getUTCFullYear()}년 ${d.getUTCMonth()+1}월 ${d.getUTCDate()}일 (${'일월화수목금토'[d.getUTCDay()]})`;};
const svgEl=(w,h,body)=>`<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" style="display:block;overflow:visible">${body}</svg>`;
function niceTicks(max,n=6){const raw=max/n,p=Math.pow(10,Math.floor(Math.log10(raw||1))),m=[1,2,2.5,5,10].find(x=>x*p>=raw)*p;const t=[];for(let v=0;v<=max+1e-9;v+=m)t.push(v);if(t[t.length-1]<max)t.push(t[t.length-1]+m);return t;}
function chartDaily(el,day,start,end){
  const W=760,H=290,L=40,R=64,T=26,B=28;const xs=[];for(let x=start;x<=end;x++)xs.push(x);
  const v=xs.map(x=>day[x]||0);const ma=v.map((_,i)=>{const s=v.slice(Math.max(0,i-6),i+1);return s.reduce((a,b)=>a+b,0)/s.length;});
  const mx=Math.max(...v,1);const ticks=niceTicks(mx,5);const ymax=ticks[ticks.length-1];
  const X=i=>L+i/(xs.length-1)*(W-L-R),Y=y=>T+(1-y/ymax)*(H-T-B);
  let s=ticks.map(t=>`<line x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}" stroke="${OVC.grid}"/><text x="${L-8}" y="${Y(t)+4}" text-anchor="end" class="ax">${fmt(t)}</text>`).join('');
  xs.forEach((x,i)=>{const d=new Date(x*864e5);if(d.getUTCDate()===1&&d.getUTCMonth()%2===0)s+=`<text x="${X(i)}" y="${H-6}" text-anchor="middle" class="ax">${d.getUTCMonth()+1}월</text>`;});
  s+=`<polyline fill="none" stroke="${OVC.grey}" stroke-width="1" points="${v.map((y,i)=>X(i).toFixed(1)+','+Y(y).toFixed(1)).join(' ')}"/>`;
  s+=`<polyline fill="none" stroke="${OVC.teal}" stroke-width="2.6" stroke-linejoin="round" points="${ma.map((y,i)=>X(i).toFixed(1)+','+Y(y).toFixed(1)).join(' ')}"/>`;
  const bi=v.indexOf(mx);const bx=X(bi),by=Y(mx);
  s+=`<circle cx="${bx}" cy="${by}" r="4.5" fill="#fff" stroke="${OVC.ink}" stroke-width="1.6"/><text x="${bx+(bx>W*0.7?-8:8)}" y="${by+4}" text-anchor="${bx>W*0.7?'end':'start'}" class="an">가장 많은 날 ${new Date(xs[bi]*864e5).getUTCMonth()+1}/${new Date(xs[bi]*864e5).getUTCDate()}, ${mx}국</text>`;
  const le=ma[ma.length-1];s+=`<circle cx="${X(xs.length-1)}" cy="${Y(le)}" r="3.5" fill="${OVC.teal}"/><text x="${X(xs.length-1)+8}" y="${Y(le)-2}" class="an b">${le.toFixed(1)}</text><text x="${X(xs.length-1)+8}" y="${Y(le)+12}" class="ax">7일 평균</text>`;
  el.innerHTML=svgEl(W,H,s);
}
let AGEC={};
function chartAge(el,inG){
  const key=inG.toString().length+'|'+document.querySelector('.ov-seg [aria-pressed="true"]').dataset.v;
  const eras=[['1990~2005년',g=>g.y>=1990&&g.y<=2005,OVC.grey],['2016년 이후',g=>g.y>=2016,OVC.teal]];
  if(!AGEC[key]){AGEC[key]=eras.map(([,f])=>{const w={},n={};for(const g of GSC){if(g.j||!f(g))continue;for(const [k,won] of [[g.wk,1],[g.lk,0]]){if(!inG(k))continue;const p=PBY[k];if(!p||!p.b)continue;const a=g.y-(+p.b.slice(0,4));if(a<12||a>50)continue;n[a]=(n[a]||0)+1;w[a]=(w[a]||0)+won;}}return {w,n};});}
  const D=AGEC[key];const ages=[];for(let a=13;a<=48;a++)ages.push(a);
  const ser=D.map(({w,n})=>ages.map(a=>{let ww=0,nn=0;for(let d=-2;d<=2;d++){ww+=w[a+d]||0;nn+=n[a+d]||0;}return nn>=400?ww/nn*100:null;}));
  const all=ser.flat().filter(x=>x!=null);if(!all.length){el.innerHTML='<div class="empty">표본이 부족합니다</div>';return;}
  const lo=Math.floor(Math.min(...all)/5)*5,hi=Math.ceil(Math.max(...all)/5)*5;
  const W=380,H=290,L=34,R=12,T=34,B=28;const X=a=>L+(a-13)/35*(W-L-R),Y=y=>T+(1-(y-lo)/(hi-lo))*(H-T-B);
  let s='';for(let t=lo;t<=hi;t+=5)s+=`<line x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}" stroke="${t===50?'#c5cad1':OVC.grid}"/><text x="${L-6}" y="${Y(t)+4}" text-anchor="end" class="ax">${t}%</text>`;
  for(const a of [15,20,25,30,35,40,45])s+=`<text x="${X(a)}" y="${H-6}" text-anchor="middle" class="ax">${a}세</text>`;
  // 전성기 구간: 2016년 이후 곡선이 최고점에서 2%p 안
  const m=ser[1];const pk=Math.max(...m.filter(x=>x!=null));const band=ages.filter((a,i)=>m[i]!=null&&m[i]>=pk-1);
  if(band.length){const a0=band[0],a1=band[band.length-1];s+=`<rect x="${X(a0)}" y="${T}" width="${X(a1)-X(a0)}" height="${H-T-B}" fill="${OVC.tealL}" opacity=".6"/><text x="${(X(a0)+X(a1))/2}" y="${T-10}" text-anchor="middle" class="an b">${a0}~${a1}세</text>`;}
  ser.forEach((arr,j)=>{const pts=arr.map((y,i)=>y==null?null:`${X(ages[i]).toFixed(1)},${Y(y).toFixed(1)}`);let path='',on=false;pts.forEach(p=>{if(!p){on=false;return;}path+=(on?'L':'M')+p;on=true;});
    s+=`<path d="${path}" fill="none" stroke="${eras[j][2]}" stroke-width="${j?2.6:2}" stroke-linejoin="round"/>`;
    let iL=-1;arr.forEach((y,i)=>{if(y!=null)iL=i;});if(iL>=0)s+=`<text x="${X(ages[iL])}" y="${Y(arr[iL])+(j?-10:16)}" text-anchor="end" class="an ${j?'b':''}" fill="${j?OVC.teal:OVC.mute}">${eras[j][0]}</text>`;});
  el.innerHTML=svgEl(W,H,s);
}
function chartBubbles(el,win,inG){
  const n={};win.forEach(g=>{for(const k of [g.wk,g.lk])if(inG(k)&&PBY[k])n[k]=(n[k]||0)+1;});
  const gOf0=k=>{const c=(PBY[k]||{}).c;return ['한국','중국','일본'].includes(c)?c:'기타';};
  const cap={'한국':20,'중국':14,'일본':10,'기타':8};const cnt={};
  const ps=Object.entries(n).sort((a,b)=>b[1]-a[1]).filter(([k])=>{const g=gOf0(k);cnt[g]=(cnt[g]||0)+1;return cnt[g]<=cap[g];});
  const tot={};Object.keys(n).forEach(k=>{const g=gOf0(k);tot[g]=(tot[g]||0)+1;});
  if(!ps.length){el.innerHTML='<div class="empty">조건에 맞는 기사가 없습니다</div>';return;}
  const W=560,H=360;
  const kk=Math.sqrt(0.17*W*H/ps.reduce((a,[,v])=>a+Math.PI*v,0));const rOf=v=>kk*Math.sqrt(v);
  const groups=[['한국',OVC.teal,[W*0.28,H*0.48]],['중국',OVC.gold,[W*0.7,H*0.34]],['일본','#8d96a3',[W*0.66,H*0.78]],['기타','#b4bac3',[W*0.9,H*0.72]]];
  const gOf=k=>{const c=(PBY[k]||{}).c;return ['한국','중국','일본'].includes(c)?c:'기타';};
  let s='',top='';
  for(const [gname,color,[cx,cy]] of groups){
    const mem=ps.filter(([k])=>gOf(k)===gname);if(!mem.length)continue;const placed=[];
    for(const [k,v] of mem){const r=rOf(v);let best=null;
      for(let t=0;t<6000&&!best;t++){const ang=t*0.5,rad=Math.sqrt(t)*2.2;const x=cx+Math.cos(ang)*rad,y=cy+Math.sin(ang)*rad*0.85;
        if(placed.every(p=>Math.hypot(p.x-x,p.y-y)>=p.r+r+2.5))best={x,y,r,k,v};}
      if(best)placed.push(best);}
    const ext=placed.reduce((m,p)=>Math.max(m,Math.hypot(p.x-cx,p.y-cy)+p.r),0)+10;
    s+=`<circle cx="${cx}" cy="${cy}" r="${ext}" fill="none" stroke="${color}" stroke-width="1.2" stroke-dasharray="${placed.length>3?'':'3 3'}" opacity=".8"/>`;
    s+=`<text x="${cx}" y="${cy-ext-8}" text-anchor="middle" class="grp" fill="${color}">${gname}</text>`;
    placed.forEach((p,i)=>{s+=`<a href="#/players/${encodeURIComponent(p.k)}"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" fill="${color}" opacity="${i<2?1:.72}"><title>${esc(nameOf(p.k))} ${p.v}국</title></circle></a>`;
      if(i<(gname==='한국'?2:1))top+=p.r>16?`<text x="${p.x.toFixed(1)}" y="${(p.y+4).toFixed(1)}" text-anchor="middle" class="bl">${esc(nameOf(p.k))}</text>`:`<text x="${p.x.toFixed(1)}" y="${(p.y+p.r+13).toFixed(1)}" text-anchor="middle" class="an b">${esc(nameOf(p.k))}</text>`;});
  }
  const vmax=ps[0][1],v2=Math.round(vmax/2/10)*10||10;
  s+=top+`<g transform="translate(${W-46},${rOf(vmax)+18})"><text x="0" y="${-rOf(vmax)-8}" text-anchor="middle" class="ax">대국 수</text>${[vmax,v2].map(v=>`<circle cx="0" cy="${rOf(vmax)-rOf(v)}" r="${rOf(v)}" fill="none" stroke="#7b8290" stroke-width=".8"/><text x="${rOf(vmax)+5}" y="${rOf(vmax)-2*rOf(v)+4}" class="ax">${v}</text>`).join('')}</g>`;
  el.innerHTML=svgEl(W,H,s)+`<p class="ov-d" style="margin-top:6px">나라마다 가장 많이 둔 기사(한국 20명, 중국 14명, 일본 10명까지). 원을 누르면 기사 페이지로 갑니다.</p>`;
}
function chartMoves(el,inG){
  const now=rankAt(LASTD/100|0),prev=rankAt((LASTD/100|0)-100);
  const keep=k=>inG(k);
  const re=(m)=>{const ks=Object.keys(m).filter(keep).sort((a,b)=>m[a]-m[b]);const o={};ks.forEach((k,i)=>o[k]=i+1);return o;};
  const N=re(now),Pv=re(prev);
  const rows=Object.keys(N).filter(k=>N[k]<=100&&Pv[k]).map(k=>[k,Pv[k]-N[k]]);
  const up=rows.filter(r=>r[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,8),dn=rows.filter(r=>r[1]<0).sort((a,b)=>a[1]-b[1]).slice(0,8);
  const list=[...dn.reverse(),...up.reverse()].sort((a,b)=>a[1]-b[1]);
  if(!list.length){el.innerHTML='<div class="empty">비교할 순위가 없습니다</div>';return;}
  const mx=Math.max(...list.map(r=>Math.abs(r[1])));
  const W=560,rowH=19,T=8,H=T+list.length*rowH+8,LW=110,z0=LW+50,z1=W-44,cx=(z0+z1)/2,half=(z1-z0)/2-14;
  let s=`<line x1="${cx}" x2="${cx}" y1="${T-4}" y2="${H-4}" stroke="#c5cad1"/>`;
  list.forEach(([k,d],i)=>{const y=T+i*rowH+rowH/2;const x=cx+d/mx*half;const c=d>0?OVC.teal:OVC.gold;
    s+=`<a href="#/players/${encodeURIComponent(k)}"><text x="${LW-10}" y="${y+4}" text-anchor="end" class="nm">${esc(nameOf(k))}</text></a><text x="${LW+2}" y="${y+4}" class="ax">${N[k]}위</text>
    <line x1="${cx}" x2="${x}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity=".35"/><circle cx="${x}" cy="${y}" r="4" fill="${c}"/>
    <text x="${x+(d>0?9:-9)}" y="${y+4}" text-anchor="${d>0?'start':'end'}" class="an b" fill="${c}">${d>0?'+':''}${d}</text>`;});
  el.innerHTML=svgEl(W,H,s)+`<p class="ov-d" style="margin-top:6px">초록은 순위가 오른 기사, 노랑은 내려간 기사입니다. 현재 100위 안 기사만 넣었습니다.</p>`;
}

/* =============== 국제기전 (메이저 · 기타 국제 · 초청전) =============== */
// IX.ev[i] = [id, 이름, 한자, 그룹, 분류, 주최국, 기간, 진행 중, 메모, 이 사이트 대회 번호들, rows]
// rows[j] = [회차, 개최 연도, 기사 키, 원문 이름, 결승 날짜(한국기원 기록과 연결된 경우), 준우승 키, CH 번호]
const IX=X.IX||null;
const IXCLS={major:'메이저',minor:'기타 국제',m3:'3인 초청',m2:'양국 대항'};
const IXGRPK={'Grand Major':'메이저','International':'국제 대회','Mind-sports':'종합 대회','Masters':'통합 타이틀전','Invitational':'초청전'};
const IXHOST={kr:'한국',cn:'중국',jp:'일본',tw:'대만'};
const IXCC={'한국':'kr','중국':'cn','일본':'jp','대만':'tw'};
const IXC4=['한국','중국','일본','대만'];
let IXA=null;
// 기사별 집계: major/minor/m3/m2 + 기타 국제 세부(국제·종합·통합)
function ixAgg(){
  if(IXA)return IXA;const by={};
  if(IX)for(const e of IX.ev)for(const r of e[10]){const k=r[2];if(!k)continue;
    const o=by[k]=by[k]||{major:0,minor:0,m3:0,m2:0,intl:0,mind:0,tri:0,list:[]};
    o[e[4]]++;if(e[4]==='minor'){if(e[3]==='International')o.intl++;else if(e[3]==='Mind-sports')o.mind++;else o.tri++;}o.list.push([e,r]);}
  return IXA=by;
}
const ixYear=r=>r[1]||(r[4]?(r[4]/10000|0):null);
const ixBadge=c=>`<span class="ixb ixb-${c}">${IXCLS[c]}</span>`;
const ixCtry=k=>(PBY[k]||{}).c||'';
const ixBorn=k=>(IX&&IX.born&&IX.born[k])||((PBY[k]||{}).b?+PBY[k].b.slice(0,4):null);
const ixMru=k=>(IX&&IX.mru&&IX.mru[k])||null;
const ixNm=(k,raw)=>k?(isNK(k)?`<span>${esc(k.slice(2))}</span>`:`<a class="pl" href="#/players/${encodeURIComponent(k)}">${esc(nameOf(k))}</a>`):esc(raw||'');
const ixFl=k=>`<span class="pfl">${flag(ixCtry(k))||'<i></i>'}</span>`;
const ixMajors=()=>IX.ev.filter(e=>e[4]==='major');
const ixDot=k=>`<i class="ixd ixd-${IXCC[ixCtry(k)]||'x'}"></i>`;
const ixShort=n=>n.replace(/배$/,'');

/* ---------- 라우팅: #/tournaments/intl/<탭> ---------- */
const IXTABS=[['','개요'],['years','메이저 연도표'],['events','대회'],['players','기사 순위']];
function pIntl(v,q){
  if(!IX){app.innerHTML='<div class="empty">국제기전 우승 기록이 아직 없습니다</div>';return;}
  if(!IXTABS.some(t=>t[0]===v))v='';q=q||{};
  app.innerHTML=crumb([['홈','#/'],['대회','#/tournaments'],['국제기전',v?'#/tournaments/intl':null]])+`<h1 class="pt">국제기전</h1>
  <p class="lede">1988년 후지쯔배부터 메이저 국제기전 ${ixMajors().length}개 대회의 우승 ${ixMajors().reduce((a,e)=>a+e[10].length,0)}회와, 그 밖의 국제 대회·종합 대회·통합 타이틀전·초청전 우승 ${IX.ev.filter(e=>e[4]!=='major').reduce((a,e)=>a+e[10].length,0)}회입니다.</p>
  ${typeof DX!=='undefined'&&DX?dxNav().replace('data-s="intl"','data-s="intl" class="on"'):''}<nav class="tabs">${IXTABS.map(([s,l])=>`<a href="#/tournaments/intl${s?'/'+s:''}" class="${s===v?'on':''}">${l}</a>`).join('')}</nav>
  <div id="ix"></div><p class="note ixsrc">${esc(IX.src)}. 한국기원 기록에 결승이 있는 ${IX.chk.linked}건은 결승 대국과 대조했습니다. 연도는 대회가 열린(시작한) 해입니다.</p>`;
  const el=document.getElementById('ix');
  ({'':ixOverview,years:ixYears,events:ixEventsTab,players:ixPlayersTab})[v](el,q);
}
const ixSec=(title,desc,body,more)=>`<section class="ec ixsec"><header><h2>${title}</h2>${more||''}</header>${desc?`<p class="ixdesc">${desc}</p>`:''}${body}</section>`;
const ixLegend=()=>`<div class="ixlg">${IXC4.map(c=>`<span>${ixDot0(c)}${c}</span>`).join('')}</div>`;
const ixDot0=c=>`<i class="ixd ixd-${IXCC[c]}"></i>`;

/* ---------- 1. 개요 ---------- */
function ixOverview(el){
  const M=ixMajors(),A=ixAgg();const tot=M.reduce((a,e)=>a+e[10].length,0);
  const cc={};M.forEach(e=>e[10].forEach(r=>{const c=ixCtry(r[2]);cc[c]=(cc[c]||0)+1;}));
  // 시대별 국가 비중
  const ERA=[[1988,1999,'1988–1999'],[2000,2009,'2000년대'],[2010,2019,'2010년대'],[2020,2099,'2020년대']];
  const eraRows=ERA.map(([a,b,l])=>{const c={};let n=0;M.forEach(e=>e[10].forEach(r=>{if(r[1]>=a&&r[1]<=b){const x=ixCtry(r[2]);c[x]=(c[x]||0)+1;n++;}}));return {l,c,n};});
  const bar=(c,n)=>`<div class="ixbar">${IXC4.filter(x=>c[x]).map(x=>`<span class="ixseg ixd-${IXCC[x]}" style="flex:${c[x]}" title="${x} ${c[x]}회 (${Math.round(c[x]/n*100)}%)">${c[x]/n>=.09?c[x]:''}</span>`).join('')}</div>`;
  // 다관왕
  const lead=Object.entries(A).filter(([,o])=>o.major).map(([k,o])=>({k,o,m:ixMru(k)||[0,0]})).sort((a,b)=>b.o.major-a.o.major||b.m[0]-a.m[0]||b.m[1]-a.m[1]).slice(0,15);
  const mx=lead[0]?lead[0].o.major:1;
  // 최근 결승
  const E={};IX.ev.forEach(e=>E[e[0]]=e);const rec=IX.recent.filter(r=>r[2]).slice().reverse();
  const active=M.filter(e=>e[7]).map(e=>({e,r:e[10][e[10].length-1]}));
  const tm=IX.team;
  el.innerHTML=`<div class="kpis ixkpi"><div class="kpi"><div class="num">${tot}</div><div class="lbl">메이저 우승</div></div><div class="kpi"><div class="num">${M.length}</div><div class="lbl">메이저 대회 (진행 중 ${active.length})</div></div>${IXC4.map(c=>`<div class="kpi"><div class="num">${cc[c]||0}</div><div class="lbl">${ixDot0(c)}${c}</div></div>`).join('')}</div>
  <div class="ixov">
    <div class="ixcol">
      ${ixSec('메이저 다관왕','우승 횟수 막대 · 오른쪽 숫자는 준우승/4강',`<ol class="ixlead">${lead.map((x,i)=>`<li><span class="i">${i&&lead[i-1].o.major===x.o.major?'':i+1}</span><span class="nm">${ixFl(x.k)}${ixNm(x.k)}</span><span class="bw"><span class="b ixd-${IXCC[ixCtry(x.k)]||'x'}" style="width:${x.o.major/mx*100}%"></span><b>${x.o.major}</b></span><span class="sub">${x.m[0]} / ${x.m[1]}</span></li>`).join('')}</ol>`,`<a href="#/tournaments/intl/players">전체 순위 ›</a>`)}
      ${ixSec('시대별 국가 비중','메이저 우승을 대회가 열린 해로 묶었습니다.',`<div class="ixeras">${eraRows.map(r=>`<div class="ixera"><span class="l">${r.l}</span>${bar(r.c,r.n)}<span class="n">${r.n}</span></div>`).join('')}<div class="ixera tot"><span class="l">전체</span>${bar(cc,tot)}<span class="n">${tot}</span></div></div>${ixLegend()}`)}
    </div>
    <div class="ixcol">
      ${ixSec('진행 중인 메이저 · 최근 우승자','',`<ul class="ixact">${active.sort((a,b)=>(b.r[1]||0)-(a.r[1]||0)).map(({e,r})=>`<li><span class="t">${esc(e[1])} <small>${e[10].length}회</small></span><span class="w">${ixFl(r[2])}${ixNm(r[2],r[3])}</span><span class="y">${r[1]}</span></li>`).join('')}</ul>`,`<a href="#/tournaments/intl/years">연도표 ›</a>`)}
      ${ixSec('최근 메이저 결승','2019년 이후 · 우승 – 준우승 · 4강',`<ul class="ixfin" id="ixfin">${rec.map((r,i)=>`<li${i>=10?' hidden':''}><span class="y">${r[0]}</span><span class="t">${esc(E[r[1]]?ixShort(E[r[1]][1]):r[1])}</span><span class="m">${ixFl(r[2])}<b>${ixNm(r[2])}</b> <span class="vs">–</span> ${ixNm(r[3])}</span><span class="s">${[r[4],r[5]].filter(Boolean).map(k=>ixNm(k)).join(', ')}</span></li>`).join('')}</ul>${rec.length>10?`<button class="ixmore" id="ixfinm" type="button">${rec.length-10}개 더 보기</button>`:''}`)}
      ${tm?ixSec(esc(tm.n),`${tm.since}년부터 ${tm.eds}회 · 다승은 통산 승수, 결정은 팀 우승을 확정한 판 수`,`<table class="ixtm"><thead><tr><th>기사</th><th class="r">다승</th><th class="r">결정</th></tr></thead><tbody>${Object.entries(tm.p).sort((a,b)=>b[1][0]-a[1][0]).map(([k,v])=>`<tr><td>${ixFl(k)}${ixNm(k)}</td><td class="n r">${v[0]}</td><td class="n r">${v[1]||'–'}</td></tr>`).join('')}</tbody></table>`):''}
    </div>
  </div>`;
  const fm=document.getElementById('ixfinm');if(fm)fm.onclick=()=>{document.querySelectorAll('#ixfin li[hidden]').forEach(li=>li.hidden=false);fm.remove();};
}

/* ---------- 2. 메이저 연도표 ---------- */
function ixYears(el,q){
  const M=ixMajors();const cell={};let y0=9999,y1=0;
  M.forEach((e,j)=>e[10].forEach(r=>{const y=r[1];if(!y)return;y0=Math.min(y0,y);y1=Math.max(y1,y);(cell[y]=cell[y]||{})[j]=r;}));
  const A=ixAgg();const winners=Object.entries(A).filter(([,o])=>o.major).sort((a,b)=>b[1].major-a[1].major||nameOf(a[0]).localeCompare(nameOf(b[0]),'ko'));
  let hi=q.p&&A[q.p]?q.p:'';
  const ys=[];for(let y=y1;y>=y0;y--)ys.push(y);
  el.innerHTML=`<div class="fbar"><div class="fg"><span class="fl">기사 강조</span><select class="q" id="ixhi"><option value="">선택 안 함</option>${winners.map(([k,o])=>`<option value="${esc(k)}" ${k===hi?'selected':''}>${esc(nameOf(k))} (${o.major})</option>`).join('')}</select></div><div class="fg">${ixLegend()}</div></div>
  <div class="tw sticky ixgw"><table class="ixg" id="ixg"><thead><tr><th class="c">연도</th>${M.map(e=>`<th title="${esc(e[1]+(e[2]?' ('+e[2]+')':'')+' · '+e[6])}" class="${e[7]?'act':''}">${esc(ixShort(e[1]))}<small>${e[10].length}</small></th>`).join('')}</tr></thead>
  <tbody>${ys.map(y=>`<tr><th class="n c" scope="row">${y}</th>${M.map((e,j)=>{const r=(cell[y]||{})[j];if(!r)return '<td></td>';
    return `<td data-k="${esc(r[2])}" title="${esc(e[1]+' 제'+r[0]+'회'+(r[4]?' · 결승 '+dstr(r[4]):'')+(r[5]?' · 준우승 '+nameOf(r[5]):''))}">${ixDot(r[2])}${ixNm(r[2],r[3])}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>
  <p class="note">점 색은 우승자 국적, 굵은 대회명은 지금도 열리는 대회입니다. 칸에 마우스를 올리면 회차·결승 날짜·준우승자가 보입니다. '기사 강조'로 한 기사의 우승 칸만 진하게 볼 수 있습니다.</p>`;
  const paint=()=>{document.querySelectorAll('#ixg td[data-k]').forEach(td=>td.classList.toggle('on',!!hi&&td.dataset.k===hi));document.getElementById('ixg').classList.toggle('dim',!!hi);};
  document.getElementById('ixhi').onchange=e=>{hi=e.target.value;paint();routeRS('#/tournaments/intl/years'+(hi?'?p='+encodeURIComponent(hi):''));};
  paint();
}

/* ---------- 3. 대회 ---------- */
function ixEventsTab(el){
  const grps=['Grand Major','International','Mind-sports','Masters','Invitational'];
  const top=e=>{const c={};e[10].forEach(r=>{if(r[2])c[r[2]]=(c[r[2]]||0)+1;});const b=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];return b&&b[1]>1?`${ixFl(b[0])}${ixNm(b[0])} <span class="muted">${b[1]}회</span>`:'<span class="muted">–</span>';};
  const rng=e=>{const a=e[10].map(r=>r[0]).filter(x=>x!=null);return a.length?(a[0]===a[a.length-1]?'제'+a[0]+'회':'제'+a[0]+'~'+a[a.length-1]+'회'):e[10].map(r=>r[1]).join(', ');};
  el.innerHTML=`<div class="tw ixgw"><table class="ixev2"><thead><tr><th>대회</th><th>구분</th><th>기간</th><th class="r">우승</th><th>최다 우승</th><th>최근 우승</th></tr></thead><tbody>
  ${grps.map(g=>{const evs=IX.ev.filter(e=>e[3]===g);return `<tr class="ixgh"><th colspan="6">${IXGRPK[g]} <span class="muted small">${g} · ${evs.length}개 대회 · 우승 ${evs.reduce((a,e)=>a+e[10].length,0)}회${(IX.notes||{})[g]?' · '+esc(IX.notes[g]):''}</span></th></tr>`+
    evs.map(e=>{const r=e[10][e[10].length-1];return `<tr class="ixer" data-id="${e[0]}" tabindex="0"><td><span class="ixtg">›</span><b>${esc(e[1])}</b>${e[2]?` <span class="muted small">${esc(e[2])}</span>`:''}${e[7]?' <span class="ixlive">진행 중</span>':''}</td><td>${ixBadge(e[4])}</td><td class="n">${esc(e[6]||rng(e))}</td><td class="n r">${e[10].length}</td><td>${top(e)}</td><td>${ixFl(r[2])}${ixNm(r[2],r[3])} <span class="muted">${ixYear(r)||''}</span></td></tr>
    <tr class="ixdet" data-for="${e[0]}" hidden><td colspan="6">${e[8]?`<p class="ixm">${esc(e[8])}</p>`:''}<ol class="ixwl">${e[10].map(r=>`<li><span class="e">${r[0]!=null?r[0]+'회':''}${ixYear(r)?` <span class="muted">${ixYear(r)}</span>`:''}</span>${ixFl(r[2])}${ixNm(r[2],r[3])}${r[5]?` <span class="muted">· 준우승 ${esc(nameOf(r[5]))}</span>`:''}</li>`).join('')}</ol>${e[9].length?`<a class="more" href="#/tournaments/${e[9][0]}">이 대회의 대국 기록 ›</a>`:''}</td></tr>`;}).join('');}).join('')}
  </tbody></table></div><p class="note">줄을 누르면 회차별 우승자가 펼쳐집니다. 메이저의 동양증권배 제1·2회는 초청 규모라 국제 대회로, 봉황고성배(남방장성배) 제1~8회는 한중 정상전이라 초청전으로 나눴습니다.</p>`;
  el.querySelectorAll('.ixer').forEach(tr=>{const tog=()=>{const d=el.querySelector(`.ixdet[data-for="${tr.dataset.id}"]`);d.hidden=!d.hidden;tr.classList.toggle('open',!d.hidden);};tr.onclick=e=>{if(e.target.closest('a'))return;tog();};tr.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tog();}};});
}

/* ---------- 4. 기사 순위 ---------- */
function ixPlayersTab(el,q){
  const A=ixAgg();
  const ERA=[['all','전체'],['old','1980년 이전'],['80','80년대'],['90','90년대'],['00','2000년 이후']];
  const SORT=[['major','메이저'],['tot','메이저+기타 국제'],['all','초청전 포함']];
  const st={c:q.c||'all',era:ERA.some(e=>e[0]===q.era)?q.era:'all',s:SORT.some(s=>s[0]===q.s)?q.s:'major'};
  el.innerHTML=`<div class="fbar">${pillGroup('ic','국가',CTRY_OPTS,st.c)}${pillGroup('ie','출생',ERA,st.era)}${pillGroup('is','정렬',SORT,st.s)}</div><div id="ixrk" style="margin-top:12px"></div>
  <p class="note"><b>메이저</b> 준우승·4강은 정리표(${esc(IX.mru_asof||'')} 기준) 값으로, 메이저 우승자만 있습니다. <b>기타 국제</b> = 국제 대회(참가 16명 미만 등) + 종합 대회(아시안게임 등) + 삼국 통합 타이틀전(TV바둑아시아 등). <b>초청전</b> = 3인 초청 + 양국 대항(두 나라 타이틀 보유자 대결·2인 초청). 같은 기록이면 같은 순위입니다.</p>`;
  bindPills('ic',v=>{st.c=v;draw();});bindPills('ie',v=>{st.era=v;draw();});bindPills('is',v=>{st.s=v;draw();});
  const eraOk=k=>{if(st.era==='all')return true;const y=ixBorn(k);if(!y)return false;return st.era==='old'?y<1980:st.era==='80'?y>=1980&&y<1990:st.era==='90'?y>=1990&&y<2000:y>=2000;};
  draw();
  function draw(){
    let rows=Object.entries(A).map(([k,o])=>{const m=ixMru(k)||[0,0];return {k,o,ru:m[0],sf:m[1],tot:o.major+o.minor,all:o.major+o.minor+o.m3+o.m2};});
    if(st.c!=='all')rows=rows.filter(x=>ixCtry(x.k)===st.c);rows=rows.filter(x=>eraOk(x.k));
    const S=st.s==='major'?x=>[x.o.major,x.ru,x.sf,x.tot,x.all]:st.s==='tot'?x=>[x.tot,x.o.major,x.ru,x.sf,x.all]:x=>[x.all,x.tot,x.o.major,x.ru,x.sf];
    rows.sort((a,b)=>{const p=S(a),r=S(b);for(let i=0;i<p.length;i++)if(r[i]!==p[i])return r[i]-p[i];return (ixBorn(a.k)||0)-(ixBorn(b.k)||0);});
    rows.forEach((x,i)=>x.rk=i&&S(rows[i-1]).join()===S(x).join()?rows[i-1].rk:i+1);
    const n=v=>v?v:'<span class="muted">·</span>';const hl=c=>st.s===c?' ixon':'';
    document.getElementById('ixrk').innerHTML=`<div class="tw sticky ixgw"><table class="ixk"><thead>
    <tr class="ixgrp"><th colspan="3"></th><th colspan="3" class="c${hl('major')}">메이저</th><th colspan="3" class="c">기타 국제</th><th colspan="2" class="c">초청전</th><th colspan="2" class="c">합계</th></tr>
    <tr><th class="c">순위</th><th>기사</th><th class="c">출생</th><th class="r${hl('major')}">우승</th><th class="r">준우승</th><th class="r">4강</th><th class="r">국제</th><th class="r">종합</th><th class="r">통합</th><th class="r">3인</th><th class="r">양국</th><th class="r${hl('tot')}">메이저+기타</th><th class="r${hl('all')}">전체</th></tr></thead><tbody>
    ${rows.map((x,i)=>`<tr><td class="n c">${i&&rows[i-1].rk===x.rk?'':x.rk}</td><td>${ixFl(x.k)}${ixNm(x.k)}</td><td class="n c">${ixBorn(x.k)||''}</td><td class="n r${hl('major')}"><b>${n(x.o.major)}</b></td><td class="n r">${n(x.ru)}</td><td class="n r">${n(x.sf)}</td><td class="n r">${n(x.o.intl)}</td><td class="n r">${n(x.o.mind)}</td><td class="n r">${n(x.o.tri)}</td><td class="n r">${n(x.o.m3)}</td><td class="n r">${n(x.o.m2)}</td><td class="n r${hl('tot')}"><b>${x.tot||''}</b></td><td class="n r${hl('all')}">${x.all}</td></tr>`).join('')}</tbody></table></div>`;
  }
}
/* 랭킹 › 국제 우승 */
function rkIntl(el,q){if(!IX){el.innerHTML='<div class="empty">국제기전 우승 기록이 아직 없습니다</div>';return;}ixPlayersTab(el,q);el.insertAdjacentHTML('beforeend','<p class="note"><a href="#/tournaments/intl">국제기전 개요·연도표·대회별 우승자 보기 ›</a></p>');}

/* ---------- 기사 페이지 ---------- */
function ixPlayerChip(k){const o=IX&&ixAgg()[k];if(!o)return '';const parts=[o.major?`메이저 국제기전 <b>${o.major}회</b>`:'',o.minor?`기타 국제 <b>${o.minor}회</b>`:''].filter(Boolean);return parts.length?`<span class="award ixaw" title="국제기전 우승 정리표 기준">${parts.join(' · ')} 우승</span>`:'';}
function ixPlayerSection(k){
  const o=IX&&ixAgg()[k];if(!o)return '';
  const L=o.list.slice().sort((a,b)=>(ixYear(a[1])||0)-(ixYear(b[1])||0));
  return `<section class="panel"><h2 class="sec"><span>국제기전 우승</span><span class="desc">메이저 ${o.major} · 기타 국제 ${o.minor} · 초청전 ${o.m3+o.m2} <a class="more" href="#/tournaments/intl/players">순위 ›</a></span></h2>
  <div class="tw"><table><thead><tr><th class="c">연도</th><th>대회</th><th class="c">회차</th><th>분류</th><th>결승 상대</th></tr></thead><tbody>${L.map(([e,r])=>`<tr><td class="n c">${ixYear(r)||''}</td><td>${e[9].length?`<a class="pl" href="#/tournaments/${e[9][0]}">${esc(e[1])}</a>`:esc(e[1])}</td><td class="n c">${r[0]!=null?r[0]:''}</td><td>${ixBadge(e[4])}</td><td>${r[5]?pf(r[5]):'<span class="muted">–</span>'}</td></tr>`).join('')}</tbody></table></div></section>`;
}

/* =============== 국내 기전 우승 (종합기전 · 여자기전 · 제한기전) =============== */
// DX.se[i] = [id, 이름, 설명, 구역(open/women/limited), 묶음, 진행 중, rows]
// rows[j] = [회차, 결승 날짜, 우승 키, 준우승 키, 대회 번호, 출처('k' 한국기원 기록 | 'm' 수동 | 'b' 한국기원 기전정보), 메모(출처 'm') 또는 결승 스코어]
const DX=X.DX||null;
const DXSEC=[['open','국내 종합기전'],['women','여자기전'],['limited','제한기전'],['world','세계 여자·시니어·신예'],['team','단체전·리그'],['jp','일본 기전'],['cn','중국 기전']];
const DXTABS=[['','개요'],['years','연도표'],['events','기전별'],['players','기사 순위']];
const dxSe=sec=>DX.se.filter(s=>s[3]===sec);
const dxY=r=>(r[1]/10000)|0;
const dxD=r=>r[1]%100?dstr(r[1]):r[1]%10000?dxY(r)+'-'+String((r[1]/100|0)%100).padStart(2,'0'):String(dxY(r));
const dxNm=k=>k?(isNK(k)?`<span>${esc(k.slice(2))}</span>`:`<a class="pl" href="#/players/${encodeURIComponent(k)}">${esc(nameOf(k))}</a>`):'';
function dxAgg(sec){
  const by={};for(const s of dxSe(sec))for(const r of s[6]){const k=r[2];const o=by[k]=by[k]||{n:0,g:{},y0:9999,y1:0,list:[]};o.n++;o.g[s[4]]=(o.g[s[4]]||0)+1;const y=dxY(r);o.y0=Math.min(o.y0,y);o.y1=Math.max(o.y1,y);o.list.push([s,r]);}
  return by;
}
function dxNav(){return `<div class="ixsub">${DXSEC.map(([s,l])=>`<a href="#/tournaments/${s}" data-s="${s}">${l}</a>`).join('')}<a href="#/tournaments/intl" data-s="intl">국제기전</a></div>`;}
function pDom(sec,v,q){
  if(!DX||!DX.sections[sec]){app.innerHTML='<div class="empty">기전 우승 기록이 아직 없습니다</div>';return;}
  if(!DXTABS.some(t=>t[0]===v))v='';q=q||{};
  const S=DX.sections[sec],ss=dxSe(sec);const tot=ss.reduce((a,s)=>a+s[6].length,0);
  app.innerHTML=crumb([['홈','#/'],['대회','#/tournaments'],[S.n,v?'#/tournaments/'+sec:null]])+`<h1 class="pt">${esc(S.n)}</h1>
  <p class="lede">${esc(S.lede)} 기전 ${ss.length}개 계열, 우승 ${fmt(tot)}회.</p>${dxNav().replace(`data-s="${sec}"`,`data-s="${sec}" class="on"`)}
  <nav class="tabs">${DXTABS.map(([s,l])=>`<a href="#/tournaments/${sec}${s?'/'+s:''}" class="${s===v?'on':''}">${s==='players'&&S.who?'우승 순위':l}</a>`).join('')}</nav>
  <div id="dx"></div><p class="note ixsrc">${esc(['jp','cn'].includes(sec)&&DX.fsrc?DX.fsrc:DX.src)}. 연도는 결승이 끝난 해입니다. 이름이 바뀐 기전은 같은 계열로 묶었습니다(기전별 탭에서 확인).${['world','team'].includes(sec)?' 이 구역은 한국기원 기전정보 역대우승을 기준으로 하고, 한국기원 기록에 결승 대국이 있는 회차는 결승 날짜를 붙였습니다.':''}</p>`;
  const el=document.getElementById('dx');
  ({'':dxOverview,years:dxYears,events:dxEvents,players:dxPlayers})[v](el,sec,q);
}
/* 개요 */
function dxOverview(el,sec){
  const ss=dxSe(sec),A=dxAgg(sec),S=DX.sections[sec];
  const tot=ss.reduce((a,s)=>a+s[6].length,0);const act=ss.filter(s=>s[5]&&s[6].length);
  const lead=Object.entries(A).sort((a,b)=>b[1].n-a[1].n||a[1].y0-b[1].y0).slice(0,15);const mx=lead.length?lead[0][1].n:1;
  // 시대별 1인자
  const all=ss.flatMap(s=>s[6].map(r=>[s,r]));const ys=all.map(([,r])=>dxY(r));const d0=Math.floor(Math.min(...ys)/10)*10,d1=Math.floor(Math.max(...ys)/10)*10;
  const decs=[];for(let d=d0;d<=d1;d+=10){const c={};let n=0;all.forEach(([,r])=>{const y=dxY(r);if(y>=d&&y<d+10){c[r[2]]=(c[r[2]]||0)+1;n++;}});const top=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,3);if(n)decs.push({d,n,top});}
  const recent=all.slice().sort((a,b)=>b[1][1]-a[1][1]).slice(0,10);
  el.innerHTML=`<div class="kpis"><div class="kpi"><div class="num">${fmt(tot)}</div><div class="lbl">우승</div></div><div class="kpi"><div class="num">${ss.length}</div><div class="lbl">기전 계열 (진행 중 ${act.length})</div></div><div class="kpi"><div class="num">${Object.keys(A).length}</div><div class="lbl">우승자</div></div><div class="kpi"><div class="num">${lead.length?lead[0][1].n:0}</div><div class="lbl">최다 우승 · ${lead.length?esc(nameOf(lead[0][0])):''}</div></div><div class="kpi"><div class="num">${Math.min(...ys)}</div><div class="lbl">첫 우승 기록</div></div></div>
  <div class="ixov">
    <div class="ixcol">
      ${ixSec('최다 우승','막대는 우승 횟수 · 오른쪽은 첫 우승–마지막 우승 연도',`<ol class="ixlead dxlead">${lead.map(([k,o],i)=>`<li><span class="i">${i&&lead[i-1][1].n===o.n?'':i+1}</span><span class="nm">${dxNm(k)}</span><span class="bw"><span class="b" style="width:${o.n/mx*100}%"></span><b>${o.n}</b></span><span class="sub">${o.y0===o.y1?o.y0:o.y0+'–'+o.y1}</span></li>`).join('')}</ol>`,`<a href="#/tournaments/${sec}/players">전체 순위 ›</a>`)}
      ${ixSec('시대별 최다 우승','10년 단위로 우승을 가장 많이 한 세 명',`<ul class="dxdec">${decs.map(x=>`<li><span class="d">${x.d}년대</span><span class="t">${x.top.map(([k,n],i)=>`<span class="${i?'':'f'}">${dxNm(k)} <b>${n}</b></span>`).join('')}</span><span class="n">${x.n}회</span></li>`).join('')}</ul>`)}
    </div>
    <div class="ixcol">
      ${act.length?ixSec('진행 중인 기전 · 현재 보유자','',`<ul class="ixact">${act.map(s=>({s,r:s[6][s[6].length-1]})).sort((a,b)=>b.r[1]-a.r[1]).map(({s,r})=>`<li><span class="t">${esc(s[1])} <small>${s[6].length}회</small></span><span class="w">${dxNm(r[2])}</span><span class="y">${dxY(r)}</span></li>`).join('')}</ul>`,`<a href="#/tournaments/${sec}/years">연도표 ›</a>`):''}
      ${ixSec('최근 우승','',`<ul class="ixact">${recent.map(([s,r])=>`<li><span class="t">${esc(s[1])} <small>${esc(r[0])}</small></span><span class="w">${dxNm(r[2])}${r[3]?` <span class="muted small">– ${esc(nameOf(r[3]))}</span>`:''}</span><span class="y">${dxD(r).slice(2).replace(/-/g,'.')}</span></li>`).join('')}</ul>`)}
    </div>
  </div>`;
}
/* 연도표 */
function dxYears(el,sec,q){
  const S=DX.sections[sec];const grps=Object.keys(S.grp);let g=grps.includes(q.g)?q.g:grps[0];
  const A=dxAgg(sec);let hi=q.p&&A[q.p]?q.p:'';
  const draw=()=>{
    const ss=dxSe(sec).filter(s=>s[4]===g&&s[6].length);const cell={};let y0=9999,y1=0;
    ss.forEach((s,j)=>s[6].forEach(r=>{const y=dxY(r);y0=Math.min(y0,y);y1=Math.max(y1,y);((cell[y]=cell[y]||{})[j]=cell[y][j]||[]).push(r);}));
    const ys=[];for(let y=y1;y>=y0;y--)ys.push(y);
    const win=Object.entries(A).filter(([,o])=>o.g[g]).sort((a,b)=>b[1].g[g]-a[1].g[g]);
    el.innerHTML=`<div class="fbar">${grps.length>1?pillGroup('dg','구분',grps.map(x=>[x,S.grp[x]]),g):''}<div class="fg"><span class="fl">기사 강조</span><select class="q" id="dxhi"><option value="">선택 안 함</option>${win.map(([k,o])=>`<option value="${esc(k)}" ${k===hi?'selected':''}>${esc(nameOf(k))} (${o.g[g]})</option>`).join('')}</select></div></div>
    <div class="tw sticky ixgw"><table class="ixg dxg" id="dxg" style="min-width:${Math.max(600,ss.length*84+60)}px"><thead><tr><th class="c">연도</th>${ss.map(s=>`<th title="${esc(s[1]+(s[2]?' — '+s[2]:''))}" class="${s[5]?'act':''}">${esc(s[1].replace(/(배|전)$/,''))}<small>${s[6].length}</small></th>`).join('')}</tr></thead>
    <tbody>${ys.map(y=>`<tr><th class="n c" scope="row">${y}</th>${ss.map((s,j)=>{const rs=(cell[y]||{})[j];if(!rs)return '<td></td>';return `<td>${rs.map(r=>`<div data-k="${esc(r[2])}" title="${esc(s[1]+' '+r[0]+' · '+dxD(r)+(r[3]?' · 준우승 '+nameOf(r[3]):'')+(r[6]?' · '+r[6]:'')+(r[5]==='b'?' · 한국기원 기전정보 기준':''))}">${dxNm(r[2])}${r[5]==='m'?'<sup>*</sup>':''}</div>`).join('')}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="note">굵은 기전명은 지금도 열리는 기전입니다. 한 해에 두 번 결승이 끝난 기전은 칸에 두 이름이 들어갑니다. <sup>*</sup>는 한국기원 기록에 결승 대국이 없거나 일부만 있어 정리표·보도로 넣은 우승입니다(마우스를 올리면 근거).</p>`;
    const paint=()=>{el.querySelectorAll('#dxg [data-k]').forEach(x=>x.classList.toggle('on',!!hi&&x.dataset.k===hi));document.getElementById('dxg').classList.toggle('dim',!!hi);};
    document.getElementById('dxhi').onchange=e=>{hi=e.target.value;paint();};
    bindPills('dg',v=>{g=v;hi='';draw();});paint();
  };
  draw();
}
/* 기전별 */
function dxEvents(el,sec,q){
  const S=DX.sections[sec];
  const top=s=>{const c={};s[6].forEach(r=>c[r[2]]=(c[r[2]]||0)+1);const b=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];return b&&b[1]>1?`${dxNm(b[0])} <span class="muted">${b[1]}회</span>`:'<span class="muted">–</span>';};
  el.innerHTML=`<div class="tw ixgw"><table class="ixev2"><thead><tr><th>기전</th><th>기간</th><th class="r">우승</th><th>최다 우승</th><th>최근 우승</th></tr></thead><tbody>
  ${Object.entries(S.grp).map(([g,gl])=>{const ss=dxSe(sec).filter(s=>s[4]===g&&s[6].length);return `<tr class="ixgh"><th colspan="5">${esc(gl)} <span class="muted small">${ss.length}개 계열 · 우승 ${ss.reduce((a,s)=>a+s[6].length,0)}회</span></th></tr>`+
    ss.map(s=>{const r=s[6][s[6].length-1],y0=dxY(s[6][0]),y1=dxY(r);return `<tr class="ixer" data-id="${s[0]}" tabindex="0"><td><span class="ixtg">›</span><b>${esc(s[1])}</b>${s[5]?' <span class="ixlive">진행 중</span>':''}${s[2]?`<div class="muted small dxsub">${esc(s[2])}</div>`:''}</td><td class="n">${y0===y1?y0:y0+'–'+y1}</td><td class="n r">${s[6].length}</td><td>${top(s)}</td><td>${dxNm(r[2])} <span class="muted">${y1}</span></td></tr>
    <tr class="ixdet" data-for="${s[0]}" hidden><td colspan="5"><ol class="ixwl">${s[6].map(r=>`<li><span class="e">${esc(r[0])} <span class="muted">${dxY(r)}</span></span>${dxNm(r[2])}${r[3]?` <span class="muted">· ${esc(nameOf(r[3]))}</span>`:''}${r[5]!=='m'&&r[6]&&/^\d+[-:]\d+$/.test(r[6])?` <span class="muted small">${esc(r[6])}</span>`:''}${r[5]==='m'?` <span class="muted" title="${esc(r[6])}">*</span>`:''}</li>`).join('')}</ol>${[...new Set(s[6].map(r=>r[4]).filter(x=>x>=0))].map(gid=>`<a class="more" href="#/tournaments/${gid}">${esc(G[gid])} 대국 기록 ›</a>`).join(' ')}</td></tr>`;}).join('');}).join('')}
  </tbody></table></div><p class="note">줄을 누르면 회차별 우승자(· 준우승자)가 펼쳐집니다.</p>`;
  el.querySelectorAll('.ixer').forEach(tr=>{const tog=()=>{const d=el.querySelector(`.ixdet[data-for="${tr.dataset.id}"]`);d.hidden=!d.hidden;tr.classList.toggle('open',!d.hidden);};tr.onclick=e=>{if(e.target.closest('a'))return;tog();};tr.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tog();}};});
  if(q&&q.open){const tr=el.querySelector(`.ixer[data-id="${CSS.escape(q.open)}"]`);if(tr){tr.click();tr.classList.add('hit');setTimeout(()=>tr.scrollIntoView({block:'center'}),60);}}
}
/* 기사 순위 */
function dxPlayers(el,sec){
  const S=DX.sections[sec],A=dxAgg(sec),grps=Object.keys(S.grp);
  const rows=Object.entries(A).map(([k,o])=>({k,o})).sort((a,b)=>b.o.n-a.o.n||grps.reduce((s,g,i)=>s||((b.o.g[g]||0)-(a.o.g[g]||0)),0)||a.o.y0-b.o.y0);
  rows.forEach((x,i)=>x.rk=i&&rows[i-1].o.n===x.o.n?rows[i-1].rk:i+1);
  const n=v=>v?v:'<span class="muted">·</span>';
  el.innerHTML=`<div class="tw sticky ixgw"><table class="ixk"><thead><tr><th class="c">순위</th><th>${esc(S.who||'기사')}</th><th class="r">합계</th>${grps.length>1?grps.map(g=>`<th class="r">${esc(S.grp[g])}</th>`).join(''):''}<th class="c">첫 우승</th><th class="c">마지막 우승</th><th>가장 많이 우승한 기전</th></tr></thead><tbody>
  ${rows.map((x,i)=>{const bs={};x.o.list.forEach(([s])=>bs[s[1]]=(bs[s[1]]||0)+1);const b=Object.entries(bs).sort((a,b)=>b[1]-a[1])[0];
    return `<tr><td class="n c">${i&&rows[i-1].rk===x.rk?'':x.rk}</td><td>${dxNm(x.k)}</td><td class="n r ixon"><b>${x.o.n}</b></td>${grps.length>1?grps.map(g=>`<td class="n r">${n(x.o.g[g])}</td>`).join(''):''}<td class="n c">${x.o.y0}</td><td class="n c">${x.o.y1}</td><td>${esc(b[0])} <span class="muted">${b[1]}회</span></td></tr>`;}).join('')}</tbody></table></div>
  <p class="note">같은 횟수면 같은 순위입니다. 기사 이름을 누르면 우승 목록이 있는 기사 페이지로 갑니다.</p>`;
}

/* =============== 대국 — 최근 대국(일지) · 달력 · 대국 목록 · 조건 검색 =============== */
// 메뉴 정리: '대국'은 어떤 대국이 있었는지(날짜·대회·기사로 찾기), '랭킹'은 지금 순위, '기록'은 역대·통산 기록.
const GTABS=[['','최근 대국'],['schedule','대국 일정'],['calendar','달력'],['japan','일본 대국'],['list','대국 목록'],['search','조건 검색']];
const gHead=sub=>crumb([['홈','#/'],['대국','#/games']].concat(sub?[[(GTABS.find(t=>t[0]===sub)||['',''])[1]]]:[]))+`<h1 class="pt">대국</h1><nav class="tabs">${GTABS.map(([t,l])=>`<a href="#/games${t?'/'+t:''}" class="${sub===t?'on':''}">${l}</a>`).join('')}</nav>`;
const WDAY=['일','월','화','수','목','금','토'];
function dayLabel(d){const y=(d/10000)|0,m=((d/100)|0)%100,dd=d%100;const w=new Date(Date.UTC(y,m-1,dd)).getUTCDay();return {y,m,dd,w:WDAY[w]};}
// 같은 대회 묶음 안에서 대회명의 공통 앞부분을 제목으로, 나머지를 단계로
function splitTitles(names){
  const u=[...new Set(names)];if(u.length===1)return {head:u[0],rest:n=>''};
  let p=u[0];for(const s of u)while(p&&!s.startsWith(p))p=p.slice(0,-1);
  const cut=p.lastIndexOf(' ');const head=(cut>0?p.slice(0,cut):'').trim();
  return head.length>=4?{head,rest:n=>n.slice(head.length).trim()}:{head:'',rest:n=>n};
}
function pDiary(q){
  const st={r:REGS.some(x=>x[0]===q.r)?q.r:'all',n:10};
  app.innerHTML=gHead('')+`<div id="gdash"></div>
  <div class="dlay"><div class="dmain">
  <div class="fbar">${pillGroup('dr','구분',REGS.map(([v,l])=>[v,l]),st.r)}</div>
  <div id="dy" class="diary"></div><div class="dmore"><button type="button" class="pill" id="dmore">이전 날짜 더 보기</button></div></div>
  <aside class="dside">${schedPeek(true)}<p class="dnote">한국기원 기록실·중국바둑협회·일본·대만 기록을 날짜별·대회별로 모은 대국 일지입니다.</p></aside></div>`;
  bindPills('dr',v=>{st.r=v;st.n=10;try{routeRS('#/games'+(v==='all'?'':'?r='+v));}catch(_){}draw();});
  document.getElementById('dmore').onclick=()=>{st.n+=10;draw(true);};
  draw();
  function draw(keep){
    document.getElementById('gdash').innerHTML=gDash(st.r);
    const days=[];let cur=null,more=false;
    for(let i=GAMES.length-1;i>=0;i--){const g=GAMES[i];if(st.r!=='all'&&regOf(g.c)!==st.r)continue;
      if(!cur||cur.d!==g.d){if(days.length>=st.n){more=true;break;}cur={d:g.d,gs:[]};days.push(cur);}cur.gs.push(g);}
    const y0=window.scrollY;
    document.getElementById('dy').innerHTML=days.length?days.map(day=>{
      const L=dayLabel(day.d);const gs=day.gs.slice().reverse();
      let body;
      if(st.r==='all'){const by={};gs.forEach(g=>{const r=regOf(g.c);(by[r]=by[r]||[]).push(g);});
        body=REGS.slice(1).filter(([r])=>by[r]).map(([r,l])=>`<div class="dreg"><h3 class="dreg-h"><span>${l}</span><em>${by[r].length}국</em></h3>${dayGroupsHtml(by[r])}</div>`).join('');}
      else body=dayGroupsHtml(gs);
      return `<section class="dday"><h2 class="dday-h"><span class="dd">${L.m}월 ${L.dd}일</span><span class="dw">${L.w}요일</span><span class="dn">${gs.length}국</span><a class="dcal" href="#/games/calendar?y=${L.y}&m=${L.m}&d=${L.dd}&keep=1">달력</a></h2>${body}</section>`;}).join(''):'<div class="empty">조건에 맞는 대국이 없습니다</div>';
    document.getElementById('dmore').hidden=!more;
    if(keep)window.scrollTo(0,y0);
  }
}
/* UI9_V1 — 구분(지역)·대국 묶음·미니 대시보드·정렬 표 */
const REGS=[['all','전체'],['kr','한국'],['w','세계'],['cn','중국'],['jp','일본'],['tw','대만']];
const REGL={kr:'한국',w:'세계',cn:'중국',jp:'일본',tw:'대만'};
function regOf(c){return c==='세계기전'?'w':(c==='중국기전'||c==='해외리그')?'cn':c==='일본기전'?'jp':c==='대만기전'?'tw':'kr';}
function dayGroupsHtml(gs){
  const grp=new Map();gs.forEach(g=>{if(!grp.has(g.g))grp.set(g.g,[]);grp.get(g.g).push(g);});
  return [...grp.entries()].map(([gid,a])=>{const sp=splitTitles(a.map(g=>T[g.ti]));const off=a.every(g=>g.of===0);
    return `<div class="dgrp"><div class="dgrp-h"><a href="#/tournaments/${gid}">${esc(sp.head||G[gid])}</a>${badge(a[0].c)}${off?'<span class="unof">비공식</span>':''}<span class="muted small">${a.length}국</span></div>
    <ul class="dgl${a.every(g=>!sp.rest(T[g.ti]))?' nost':''}">${a.map(g=>{const s=sp.rest(T[g.ti]);const jt=g.j?(g.j===1?'무승부':g.j===3?'양패':'무효'):'';
      return `<li><span class="ds" title="${esc(T[g.ti])}">${esc(s)}</span><span class="dw">${plink(g.wk,'w')}<em>${jt||'승'}</em></span><span class="dl">${plink(g.lk)}</span><span class="dr"><a class="glink" href="#/games/g/${g.i}">${stone(g)}${resText(g)}</a>${kfBtn(g)}</span><a class="dh" href="#/players/compare?p1=${encodeURIComponent(g.wk)}&p2=${encodeURIComponent(g.lk)}" title="두 기사 통산 맞대결 (무승부·무효 제외)">${(()=>{const c=h2hCount(g.wk,g.lk);return '통산 '+c[0]+':'+c[1];})()}</a></li>`;}).join('')}</ul></div>`;}).join('');
}
const ymdAdd=(d,n)=>{const x=new Date(Date.UTC((d/10000)|0,((d/100)|0)%100-1,d%100+n));return x.getUTCFullYear()*10000+(x.getUTCMonth()+1)*100+x.getUTCDate();};
const mdLabel=d=>`${((d/100)|0)%100}.${d%100}`;
// 막대 몇 개짜리 작은 추이 그림
function miniBars(vals,labels,hi){const mx=Math.max(1,...vals),w=8,g=3,h=34;
  return `<svg class="mspk" viewBox="0 0 ${vals.length*(w+g)} ${h}" width="${vals.length*(w+g)}" height="${h}" aria-hidden="true">${vals.map((v,i)=>`<rect x="${i*(w+g)}" y="${h-Math.max(1.5,v/mx*h)}" width="${w}" height="${Math.max(1.5,v/mx*h)}" rx="1.5" class="${i===vals.length-1||i===hi?'on':''}"><title>${labels[i]} ${fmt(v)}</title></rect>`).join('')}</svg>`;}
function mdTile(lbl,val,sub,extra){return `<div class="md-t"><div class="md-l">${lbl}</div><div class="md-v">${val}</div>${sub?`<div class="md-s">${sub}</div>`:''}${extra||''}</div>`;}
// 대국 미니 대시보드
const GDC={};
function gDash(r){
  if(GDC[r])return GDC[r];
  const inR=g=>r==='all'||regOf(g.c)===r;
  let last=0;for(let i=GAMES.length-1;i>=0;i--){if(inR(GAMES[i])){last=GAMES[i].d;break;}}
  if(!last)return GDC[r]='';
  const Y=(last/10000)|0,M=(last/100)|0,d7=ymdAdd(last,-6),y0=(Y-1)*10000+(M%100)*100;
  let nLast=0,n7=0,nM=0,nY=0;const wins={},mon={};
  for(let i=GAMES.length-1;i>=0;i--){const g=GAMES[i];if(g.d<=y0)break;if(!inR(g))continue;
    const mm=(g.d/100)|0;mon[mm]=(mon[mm]||0)+1;
    if(g.y===Y){nY++;if(!g.j)wins[g.wk]=(wins[g.wk]||0)+1;}
    if(mm===M)nM++;if(g.d>=d7)n7++;if(g.d===last)nLast++;}
  const ms=[];for(let k=11;k>=0;k--){let yy=Y,mo=(M%100)-k;while(mo<1){mo+=12;yy--;}ms.push(yy*100+mo);}
  const top=Object.entries(wins).filter(([k])=>!isNK(k)).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const sc=SCHED?(()=>{const tn=todayN();return SCHED.rows.filter(x=>x[0]>=tn&&x[0]<=ymdAdd(tn,6)).length;})():0;
  const L=dayLabel(last);
  return GDC[r]=`<div class="mdash">${mdTile('가장 최근 대국',`${L.m}.${L.dd} <small>(${L.w})</small>`,`${fmt(nLast)}국 · ${r==='all'?'전체':REGL[r]}`)}
  ${mdTile('최근 7일',fmt(n7)+'<small>국</small>',`${mdLabel(d7)}–${mdLabel(last)}`)}
  ${mdTile(`${M%100}월`,fmt(nM)+'<small>국</small>',`${Y}년 ${fmt(nY)}국`)}
  ${mdTile('월별 대국',`<span class="md-sp">${miniBars(ms.map(m=>mon[m]||0),ms.map(m=>`${(m/100)|0}.${m%100}`))}</span>`,'최근 12개월')}
  ${mdTile(`${Y} 다승`,top.length?plink(top[0][0]):'–',top.length?top.map(([k,v],i)=>i?`${esc(nameOf(k))} ${v}`:`${v}승`).join(' · '):'')}
  ${r==='all'||r==='kr'?mdTile('앞으로 7일 일정',fmt(sc)+'<small>건</small>','<a href="#/games/schedule">대국 일정 ›</a>'):''}</div>`;
}
// 기사 목록 랭킹: 국가 탭이면 그 나라 공식 랭킹, 전체·기타는 고레이팅 세계 순위
const PRKC={};
function pRankMap(c){
  if(PRKC[c])return PRKC[c];const m={};
  const add=(rows,ki,ri,lbl)=>(rows||[]).forEach(r=>{const k=r[ki];if(k&&PBY[k]&&!m[k])m[k]=[r[ri],lbl];});
  if(c==='한국'){const ms=Object.keys(KO).sort();add(KO[ms[ms.length-1]],1,0,'한국기원');}
  else if(c==='중국'&&CNR&&CNR.months&&CNR.last)add(CNR.months[CNR.last].open,2,0,'중국');
  else if(c==='일본'&&JPR&&JPR.last)add(JPR.months[JPR.last].open,2,0,'일본 碁力');
  if(GR&&!Object.keys(m).length)add(GR.rows,6,0,c==='all'||c==='기타'?'세계':'고레이팅');
  else if(GR&&c==='대만')add(GR.rows,6,0,'고레이팅');
  return PRKC[c]=m;
}
function pDash(c){
  const el=document.getElementById('pdash');if(!el)return;
  const inC=p=>c==='all'||(c==='기타'?!['한국','중국','일본','대만'].includes(p.c):p.c===c);
  const ps=P.filter(inC),act=ps.filter(p=>(p.st||'').includes('현역')).length,fem=ps.filter(p=>p.g==='여자').length;
  const ks=new Set(ps.map(p=>p.k));
  const Y=(LASTD/10000)|0;const w={},n={};
  for(let i=GAMES.length-1;i>=0;i--){const g=GAMES[i];if(g.y<Y)break;if(g.j)continue;
    if(ks.has(g.wk)){w[g.wk]=(w[g.wk]||0)+1;n[g.wk]=(n[g.wk]||0)+1;}if(ks.has(g.lk))n[g.lk]=(n[g.lk]||0)+1;}
  const RK=pRankMap(c);const r1=Object.entries(RK).filter(([k])=>ks.has(k)).sort((a,b)=>a[1][0]-b[1][0]).slice(0,3);
  const tw=Object.entries(w).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const tp=Object.keys(n).filter(k=>n[k]>=20).map(k=>[k,(w[k]||0)/n[k]]).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const lst=a=>a.slice(1).map(([k,v])=>`${esc(nameOf(k))} ${v}`).join(' · ');
  el.innerHTML=`<div class="mdash">${mdTile(c==='all'?'기사':c==='기타'?'기타 나라 기사':c+' 기사',fmt(ps.length)+'<small>명</small>',`현역 ${fmt(act)} · 여자 ${fmt(fem)}`)}
  ${mdTile(r1.length?`${r1[0][1][1]} 랭킹 1위`:'랭킹 1위',r1.length?plink(r1[0][0]):'–',r1.length>1?r1.slice(1).map(([k,v])=>`${v[0]}위 ${esc(nameOf(k))}`).join(' · '):'')}
  ${mdTile(`${Y} 다승`,tw.length?plink(tw[0][0]):'–',tw.length?`${tw[0][1]}승${tw.length>1?' · '+lst(tw):''}`:'')}
  ${mdTile(`${Y} 승률 ${calc('20국 이상, 무승부·무효 제외')}`,tp.length?plink(tp[0][0]):'–',tp.length?`${(tp[0][1]*100).toFixed(1)}%${tp.length>1?' · '+tp.slice(1).map(([k,v])=>`${esc(nameOf(k))} ${(v*100).toFixed(0)}%`).join(' · '):''}`:'')}
  ${mdTile(`${Y} 대국한 기사`,fmt(Object.keys(n).length)+'<small>명</small>',`${Y}년 1국 이상`)}</div>`;
}
// 제목 칸을 누르면 정렬되는 표 (table.srt)
document.addEventListener('click',e=>{const th=e.target.closest('table.srt thead th');if(!th)return;const tb=th.closest('table'),body=tb.tBodies[0];if(!body)return;
  const i=[...th.parentNode.children].indexOf(th);
  const val=td=>{if(!td)return '';if(td.dataset.v!=null)return +td.dataset.v;const s=td.textContent.trim().replace(/,/g,'');const x=parseFloat(s);return s===''?-1e15:isNaN(x)?s:x;};
  const pv=th.dataset.dir,dir=pv?(pv==='d'?'a':'d'):(typeof val(body.rows[0]&&body.rows[0].cells[i])==='string'?'a':'d');tb.querySelectorAll('thead th').forEach(x=>{delete x.dataset.dir;});th.dataset.dir=dir;
  const rows=[...body.rows];rows.sort((a,b)=>{const x=val(a.cells[i]),y=val(b.cells[i]);const c=typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),'ko');return dir==='a'?c:-c;});
  rows.forEach(r=>body.appendChild(r));});
function dxGid(s){for(let i=s[6].length-1;i>=0;i--){const g=s[6][i][4];if(g!=null&&g>=0)return '#/tournaments/'+g;}return `#/tournaments/${s[3]}/events?open=${encodeURIComponent(s[0])}`;}

/* =============== 기록 — 역대·통산 기록 (예전 '기록실'의 역대 기록 + 랭킹의 통산·국제 우승·역대 1위·GOAT) =============== */
const RECSUB=[['','통산 기록'],['intl','국제 우승'],['legacy','역대 1위'],['goat','GOAT'],['peak','최고 점수'],['rivalry','역대 라이벌'],['matches','명승부'],['seasons','시즌 리더보드'],['nations','국가별'],['milestones','기록 임박'],['streaks','연속·최다 기록']];
const recHead=sub=>crumb([['홈','#/'],['기록','#/records']].concat(sub?[[(RECSUB.find(t=>t[0]===sub)||['',''])[1]]]:[]))+`<h1 class="pt">기록</h1><nav class="tabs">${RECSUB.map(([t,l])=>`<a href="#/records${t?'/'+t:''}" class="${sub===t?'on':''}">${l}</a>`).join('')}</nav>${scopeBar()}`;
function pRecHub(sub,q){
  sub=sub||'';q=q||{};
  if(sub==='streaks'){pRecords(q);return;}
  if(typeof FXR!=='undefined'&&FXR[sub]){app.innerHTML=recHead(sub)+`<p class="lede rdesc">${FXD[sub]}</p><div id="rk"></div>`;FXR[sub](document.getElementById('rk'),q);return;}
  const F={'':['overall',rkOverall],intl:['intl',rkIntl],legacy:['legacy',rkLegacy],goat:['goat',rkGoat]}[sub]||['overall',rkOverall];
  if(!({'':1,intl:1,legacy:1,goat:1})[sub])sub='';
  app.innerHTML=recHead(sub)+`<p class="lede rdesc">${RDESC[F[0]]}</p><div id="rk"></div>`;
  F[1](document.getElementById('rk'),q);
}

/* =============== 해외 랭킹 · 상금 · 대국 일정 · 일본 대국 =============== */
const KOW=X.KOW||{},JPR=X.JPR||null,JPP=X.JPP||{},JPG=X.JPG||null,SCHED=X.SCHED||null,PRIZE=X.PRIZE||null;
const ymLabel=m=>m.slice(0,4)+'년 '+(+m.slice(5))+'월';
const wchg=v=>v==null?'<span class="mv">–</span>':v>0?`<span class="mv up">▲${v}</span>`:v<0?`<span class="mv dn">▼${-v}</span>`:'<span class="mv">–</span>';
const wsc=v=>v==null?dash:v>0?`<span class="mv up">+${fmt(v)}</span>`:v<0?`<span class="mv dn">${fmt(v)}</span>`:'<span class="muted">0</span>';
const grRank=(()=>{let m=null;return k=>{if(!m){m={};if(GR)GR.rows.forEach(r=>{if(r[6])m[r[6]]=r;});}return k&&m[k];};})();
const grCell=k=>{const g=grRank(k);return g?`${g[0]}위 <span class="muted small">${fmt(g[5])}</span>`:dash;};
// 연결된 기사는 이 사이트 이름(원문 이름은 작게), 아니면 원문 이름
const whoW=(k,raw,cc)=>k&&PBY[k]?`${pf(k)}${raw&&raw!==nameOf(k)?` <span class="muted small">${esc(raw)}</span>`:''}`:`<span class="pfl">${flag(cc)}</span><span>${esc(raw)}</span>`;

/* ---------- 일본 랭킹 (囲碁棋譜.COM 碁力) ---------- */
function rkJpr(el,q){
  const months=JPR?Object.keys(JPR.months).sort():[];const latest=months[months.length-1];
  if(!latest){el.innerHTML='<div class="empty">일본 랭킹 자료가 아직 없습니다</div>';return;}
  const st={m:q.m&&JPR.months[q.m]?q.m:latest,g:q.g==='w'?'w':'all',a:q.a==='1'};
  rkShell(el,selSlot('jm','받은 달')+pillGroup('jg','대상',[['all','일본 기사'],['w','여류 기사']],st.g)+pillGroup('ja','아마추어',[['0','빼기'],['1','넣기']],st.a?'1':'0'));
  fillSel('jm','받은 달',months.slice().reverse().map(m=>[m,ymLabel(m)]),st.m,months.length>1);
  bindPills('jg',v=>{st.g=v;draw();});bindPills('ja',v=>{st.a=v==='1';draw();});
  document.getElementById('jm').onchange=e=>{st.m=e.target.value;draw();};
  const hist=h=>{if(!h)return dash;const w=(h.match(/W/g)||[]).length,l=(h.match(/L/g)||[]).length;return `<span class="jph" title="최근 ${h.length}국 ${w}승 ${l}패 (왼쪽이 최근)">${[...h].map(c=>`<i class="${c==='W'?'w':'l'}"></i>`).join('')}</span><span class="muted small"> ${w}-${l}</span>`;};
  draw();
  function draw(){
    const M=JPR.months[st.m];let rows=(st.g==='w'?M.women:M.open);if(!st.a)rows=rows.filter(r=>!r[9]);
    podium(rows.slice(0,3).filter(r=>r[2]&&PBY[r[2]]).map(r=>({k:r[2],v:fmt(r[3]),u:'점',s:`碁力 · ${esc(r[7]||(r[6]?r[6]+'단':''))}`})));
    const JH=X.JPH||{},um=+st.m.replace('-','');
    // 받은 달마다의 碁力 + 囲碁棋譜.COM 대국별 점수 이력(월말 값)을 합쳐 최근 12개월
    const jser=r=>{const m={};(JH[r[10]]||[]).forEach(p=>{if(p[0]<=um)m[p[0]]=p[1];});months.forEach(mm=>{const k=+mm.replace('-','');if(k>um)return;const M=JPR.months[mm];const z=(M.open.find(y=>y[10]===r[10])||M.women.find(y=>y[10]===r[10]));if(z)m[k]=z[3];});return Object.entries(m).map(([a,b])=>[+a,b]).sort((a,b)=>a[0]-b[0]).slice(-12);};
    rkTable(document.getElementById('rtab'),rows,[['순위','rk'],['변동','mv'],['기사','pl'],['碁力','num'],['12개월 추이','sp'],['점수 변동','num'],['타이틀·단','num'],['최근 20국','num'],['고레이팅','num']],x=>x.map(r=>{const i=rows.indexOf(r)+1;let js_;
      return `<tr>${rkTd(i)}<td class="c">${wchg(r[4])}</td><td class="pc">${whoW(r[2],r[1],'일본')}${r[9]?' <span class="unof">아마</span>':''}</td><td class="n r"><b>${fmt(r[3])}</b></td><td class="c">${rkSpark(js_=jser(r),{t:'碁力'})}</td><td class="n r">${wsc(r[5]!=null?r[5]:js_.length>1?js_[js_.length-1][1]-js_[js_.length-2][1]:null)}</td><td class="n r small">${esc(r[7]||(r[6]?r[6]+'단':''))}</td><td class="n r">${hist(r[8])}</td><td class="n r">${grCell(r[2])}</td></tr>`;}).join(''));
    const d=M.fetched?dstr(+M.fetched.slice(0,10).replace(/-/g,'')):'';
    document.getElementById('rnote').innerHTML=`출처 <a href="https://igo-kifu.com/players/ranking" target="_blank" rel="noopener">囲碁棋譜.COM 碁力ランキング</a> · ${d} 받음. 碁力은 그 사이트가 대국 결과로 계산하는 점수이며 일본기원·관서기원의 공식 순위가 아닙니다. 변동은 지난번 받은 달과 비교한 값입니다(점수 변동이 비면 그 사이트의 대국별 점수 이력으로 지난달 말과 비교). '12개월 추이'는 기사별 월말 碁力입니다.${JPR.miss&&JPR.miss.length?` 이 사이트 기사 정보와 연결되지 않은 기사는 일본어 이름으로 보입니다.`:''}`;
  }
}

/* ---------- 상금 순위 ---------- */
const won=v=>{if(v==null)return dash;const e=Math.floor(v/1e8),m=Math.round((v%1e8)/1e4);return (e?`${e}억 `:'')+(m?`${fmt(m)}만`:'')+'원';};
function rkPrize(el,q){
  const months=PRIZE?Object.keys(PRIZE.months).sort():[];const latest=months[months.length-1];
  if(!latest){el.innerHTML='<div class="empty">상금 자료가 아직 없습니다</div>';return;}
  const st={m:q.m&&PRIZE.months[q.m]?q.m:latest};
  rkShell(el,selSlot('pm','기준'));
  fillSel('pm','기준',months.slice().reverse().map(m=>[m,ymLabel(m)+'까지']),st.m,months.length>1);
  document.getElementById('pm').onchange=e=>{st.m=e.target.value;draw();};
  draw();
  function draw(){
    const M=PRIZE.months[st.m],rows=M.rows,mm=+st.m.slice(5);
    podium(rows.slice(0,3).filter(r=>r[2]&&PBY[r[2]]).map(r=>({k:r[2],v:(r[3]/1e8).toFixed(2),u:'억 원',s:`${st.m.slice(0,4)}년 누적 상금<br>${mm}월 ${won(r[4])}`})));
    const yr=st.m.slice(0,4),pser=r=>months.filter(x=>x.startsWith(yr)&&x<=st.m).map(x=>{const z=PRIZE.months[x].rows.find(y=>(r[2]&&y[2]===r[2])||y[1]===r[1]);return z?[+x.replace('-',''),z[3]]:null;}).filter(Boolean);
    const showT=months.filter(x=>x.startsWith(yr)&&x<=st.m).length>1;
    rkTable(document.getElementById('rtab'),rows,[['순위','rk'],['기사','pl'],[`${st.m.slice(0,4)}년 누적`,'num']].concat(showT?[['누적 추이','sp']]:[],[[`${mm}월 상금`,'num'],['원 단위','num']]),x=>x.map(r=>`<tr>${rkTd(r[0])}<td class="pc">${r[2]?pf(r[2]):esc(r[1])}</td><td class="n r"><b>${won(r[3])}</b></td>${showT?`<td class="c">${rkSpark(pser(r),{t:'누적 상금',f:v=>(v/1e8).toFixed(2),u:'억'})}</td>`:''}<td class="n r">${won(r[4])}</td><td class="n r muted small">${fmt(r[3])}</td></tr>`).join(''));
    document.getElementById('rnote').innerHTML=`${esc(M.title||ymLabel(st.m)+' 상금')} — 한국기원 발표 자료(상위 ${rows.length}명)입니다. 새 달 표가 나오면 <code>pipeline/prize.json</code>에 추가됩니다.`;
  }
}

/* ---------- 기사 페이지: 해외 랭킹 칩 · 일본 기사 정보 ---------- */
function worldChips(k){
  const out=[];
  if(CNR&&CNR.months&&CNR.last){const m=CNR.months[CNR.last];const r=m&&m.open.find(x=>x[2]===k);if(r)out.push(`<a class="award" href="#/rankings/china" title="중국바둑협회 ${ymLabel(CNR.last)} 등급분 순위">중국 랭킹 <b>${r[0]}위</b> ${r[3]}</a>`);}
  if(JPR&&JPR.last){const m=JPR.months[JPR.last];const r=m&&(m.open.find(x=>x[2]===k)||m.women.find(x=>x[2]===k));if(r){const w=m.women.includes(r);out.push(`<a class="award" href="#/rankings/japan${w?'?g=w':''}" title="囲碁棋譜.COM 碁力 순위 (${ymLabel(JPR.last)})">일본 ${w?'여류 ':''}碁力 <b>${r[0]}위</b> ${fmt(r[3])}</a>`);}}
  {const ms=Object.keys(KOW).sort(),lm=ms[ms.length-1];const r=lm&&KOW[lm].find(x=>x[1]===k);if(r)out.push(`<a class="award" href="#/rankings?g=w" title="한국기원 ${ymLabel(lm)} 여자 랭킹">여자 랭킹 <b>${r[0]}위</b></a>`);}
  return out;
}
function jpOfficialSection(k){
  const p=PBY[k];if(!p||!p.jo)return '';
  const j=p.jo,h=(j.h||[]).filter(([y,it])=>it&&it.length);
  return `<section class="panel jpp"><h2 class="sec"><span>${esc(p.ps)} 공식 프로필</span><span class="desc">한국어 번역 · 원문(${j.lang==='zh'?'중국어':'일본어'}) 함께</span></h2>
  <dl class="jpdl"><dt>이름</dt><dd lang="${j.lang||'ja'}">${esc(j.n||'')}${j.r?` <span class="muted">(${esc(j.r)})</span>`:''}</dd></dl>
  ${(j.k||[]).length?`<p class="jpprof jpprof-ko">${j.k.map(esc).join('<br>')}</p>`:''}
  ${(j.p||[]).length?`<details style="margin:0 16px 8px"><summary class="small">약력 원문</summary><p class="jpprof" lang="${j.lang||'ja'}" style="margin:6px 0">${j.p.map(esc).join('<br>')}</p></details>`:''}
  ${h.length?`<details class="jph" style="margin:0 16px 10px"><summary class="small">${j.lang==='zh'?(p.ps==='하이펑기원'?'주요 대회 기록':'수상 기록'):'기전 경력'} 원문 · ${h.length}개 연도</summary><div lang="${j.lang||'ja'}" style="font-size:13px;line-height:1.7;color:var(--ink-soft);max-height:360px;overflow:auto;margin-top:6px">${h.map(([y,it])=>`<div style="margin-bottom:6px"><b>${esc(y||'')}</b><br>${it.map(x=>esc(x.replace(/^★/,'')) ).join('<br>')}</div>`).join('')}${(j.lg||[]).length?`<div><b>リーグ在籍記録</b><br>${j.lg.map(esc).join(' · ')}</div>`:''}</div></details>`:''}
  <p class="note"><a href="${esc(p.pu)}" target="_blank" rel="noopener">${esc(p.ps)} 기사 페이지 ↗</a> · 특기사항·승단 이력·커리어와 위 약력은 공식 페이지를 한국어로 옮긴 것입니다(기사 이름은 이 사이트 표기, 사이트에 없는 사람은 한자 그대로).</p></section>`;
}
function jpProfileSection(k){
  const j=JPP[k];if(!j)return '';
  const [nm,belong,birth,profile,trophy,pid,score,rk,g,profKo,trophyKo]=j;
  return `<section class="panel jpp"><h2 class="sec"><span>일본 기사 정보</span><span class="desc">囲碁棋譜.COM</span></h2>
  <dl class="jpdl"><dt>이름</dt><dd>${esc(nm)}</dd>${belong?`<dt>소속</dt><dd>${esc({'日本棋院':'일본기원','関西棋院':'관서기원'}[belong]||belong)}</dd>`:''}${birth?`<dt>생일</dt><dd>${esc(birth.replace(/-/g,'.'))}</dd>`:''}<dt>기력(碁力)</dt><dd>${fmt(score)} · ${g==='F'?'여류 ':''}${rk}위</dd>${trophy?`<dt>우승 기록</dt><dd>${esc(trophyKo||trophy)}</dd>`:''}</dl>
  ${profKo?`<p class="jpprof jpprof-ko">${esc(profKo)}</p>`:''}${profile?`<details style="margin:0 16px 8px"><summary class="small">프로필 원문</summary><p class="jpprof" lang="ja" style="margin:6px 0">${esc(profile)}</p></details>`:''}
  <p class="note"><a href="https://igo-kifu.com/player/${encodeURIComponent(pid)}" target="_blank" rel="noopener">囲碁棋譜.COM 기사 페이지 ↗</a> · 프로필은 한국어로 옮긴 것이고 원문도 함께 둡니다.</p></section>`;
}

/* ---------- 대국 일정 (한국기원) ---------- */
const SCLS={world:['세계 대회','b-W'],prd:['국내 본선·도전기','b-M'],dev:['국내 예선','b-L'],etc:['기타','b-O']};
const N2K=(()=>{let m=null;return n=>{if(!m){m={};for(let i=0;i<N.length;i++){if(NK[i]&&!m[N[i]])m[N[i]]=NK[i];}P.forEach(p=>{if(!m[p.n])m[p.n]=p.k;});}return m[n]||'';};})();
function schedText(t){
  // '(ㅇ김승진:조상연)' → 온라인 중계 표시 + 기사 이름 링크
  let live=false;
  const h=esc(t).replace(/\(([^()]*?:[^()]*?)\)/g,(all,inner)=>{if(inner.includes('ㅇ'))live=true;const ps=inner.replace(/ㅇ/g,'').split(':').map(s=>s.trim());
    return '<span class="spl">'+ps.map(n=>{const k=N2K(n);return k?`<a class="pl" href="#/players/${encodeURIComponent(k)}">${esc(n)}</a>`:(n?esc(n):'<span class="muted">미정</span>');}).join(' <i>vs</i> ')+'</span>';});
  return {html:h,live};
}
const todayN=()=>{const d=new Date(Date.now()+9*36e5);return d.getUTCFullYear()*10000+(d.getUTCMonth()+1)*100+d.getUTCDate();};
function schedRowsHtml(rows){
  const byD=new Map();rows.forEach(r=>{if(!byD.has(r[0]))byD.set(r[0],[]);byD.get(r[0]).push(r);});
  const tn=todayN();
  return [...byD.entries()].map(([d,a])=>{const L=dayLabel(d);
    return `<section class="dday"><h2 class="dday-h"><span class="dd">${L.m}월 ${L.dd}일</span><span class="dw">${L.w}요일</span>${d===tn?'<span class="dn">오늘</span>':''}<span class="dn">${a.length}건</span></h2>
    <ul class="sgl">${a.map(r=>{const c=SCLS[r[1]]||['기타','b-O'];const t=schedText(r[3]);return `<li><span class="st">${esc(r[2]||'종일')}</span><span class="badge ${c[1]}">${c[0]}</span><span class="sx">${t.html}</span>${t.live?'<span class="slive" title="온라인 중계">중계</span>':''}</li>`;}).join('')}</ul></section>`;}).join('');
}
function pUpcoming(q){
  const st={c:SCLS[q.c]?q.c:'all',past:q.past==='1'};
  const rows0=SCHED?SCHED.rows:[];
  app.innerHTML=gHead('schedule')+`<p class="lede">한국기원이 발표한 대국 일정입니다. 기사 이름을 누르면 그 기사 페이지로 갑니다. <span class="slive">중계</span>는 온라인 중계가 있는 대국입니다.${SCHED&&SCHED.fetched?` <span class="muted">(${dstr(+SCHED.fetched.slice(0,10).replace(/-/g,''))} 받음)</span>`:''}</p>
  <div class="fbar">${pillGroup('sc','분류',[['all','전체']].concat(Object.entries(SCLS).map(([k,v])=>[k,v[0]])),st.c)}${pillGroup('sp','기간',[['0','오늘부터'],['1','지난 일정']],st.past?'1':'0')}</div><div id="sl" class="diary"></div>`;
  bindPills('sc',v=>{st.c=v;draw();});bindPills('sp',v=>{st.past=v==='1';draw();});
  draw();
  function draw(){
    const tn=todayN();let rows=rows0.filter(r=>(st.c==='all'||r[1]===st.c)&&(st.past?r[0]<tn:r[0]>=tn));
    if(st.past)rows=rows.slice().reverse();
    document.getElementById('sl').innerHTML=rows.length?schedRowsHtml(rows):`<div class="empty">${SCHED?'해당하는 일정이 없습니다':'일정 자료가 아직 없습니다. 최근기록_갱신.bat 을 실행하면 받아 옵니다.'}</div>`;
  }
}
// 최근 대국(일지) 위쪽: 오늘·다음 이틀 일정 미리보기
function schedPeek(small){
  if(!SCHED)return '';const tn=todayN();const days=[...new Set(SCHED.rows.filter(r=>r[0]>=tn).map(r=>r[0]))].slice(0,small?4:3);
  if(!days.length)return '';const rows=SCHED.rows.filter(r=>days.includes(r[0]));
  return `<div class="speek${small?' sm':''}"><div class="speek-h"><b>다가오는 대국</b><a href="#/games/schedule">일정 전체 ›</a></div>${days.map(d=>{const L=dayLabel(d);const a=rows.filter(r=>r[0]===d);
    return `<div class="speek-d"><span class="sd">${L.m}.${L.dd} (${L.w})${d===tn?' 오늘':''}</span><ul>${a.slice(0,5).map(r=>`<li><span class="st">${esc(r[2]||'종일')}</span> ${schedText(r[3]).html}</li>`).join('')}${a.length>5?`<li class="muted">외 ${a.length-5}건</li>`:''}</ul></div>`;}).join('')}</div>`;
}

/* ---------- 일본 대국 (囲碁棋譜.COM 중계 목록) ---------- */
function pJpGames(q){
  const rows0=JPG?JPG.rows:[];const st={q:q.q||''};
  app.innerHTML=gHead('japan')+`<p class="lede">囲碁棋譜.COM 중계에 올라온 최근 30일 대국입니다(일본 기전 중심, 한국·중국 세계대회 포함). 시각은 일본·한국 시간이고, 기전 이름은 원문 그대로입니다.${JPG&&JPG.fetched?` <span class="muted">(${dstr(+JPG.fetched.slice(0,10).replace(/-/g,''))} 받음)</span>`:''}</p>
  <div class="fbar"><div class="fg w"><input class="q" id="jq" type="search" placeholder="기전·기사 이름 (일본어·한국어)" value="${esc(st.q)}"></div></div><div id="jl" class="diary"></div>`;
  const nm=(raw,k)=>k&&PBY[k]?`${plink(k)} <span class="muted small">${esc(raw)}</span>`:esc(raw);
  const draw=()=>{const s=document.getElementById('jq').value.trim();
    const rows=rows0.filter(r=>!s||(r[2]+' '+r[3]+' '+r[6]+' '+(r[4]?nameOf(r[4]):'')+' '+(r[7]?nameOf(r[7]):'')).includes(s));
    const byD=new Map();rows.forEach(r=>{const d=+r[1].slice(0,10).replace(/-/g,'');if(!byD.has(d))byD.set(d,[]);byD.get(d).push(r);});
    document.getElementById('jl').innerHTML=rows.length?[...byD.entries()].map(([d,a])=>{const L=dayLabel(d);
      return `<section class="dday"><h2 class="dday-h"><span class="dd">${L.m}월 ${L.dd}일</span><span class="dw">${L.w}요일</span><span class="dn">${a.length}국</span></h2><div class="dgrp"><ul class="dgl jpg">${a.map(r=>{const bw=r[9]==='b',ww=r[9]==='w';
        return `<li><span class="ds" title="${esc(r[2])}" lang="ja">${esc(r[2])}</span><span class="${bw?'dw':'dl'}"><span class="stone b" aria-label="흑"></span>${nm(r[3],r[4])}${bw?'<em>승</em>':''}</span><span class="${ww?'dw':'dl'}"><span class="stone w" aria-label="백"></span>${nm(r[6],r[7])}${ww?'<em>승</em>':''}</span><span class="dr" lang="ja">${esc(r[10]||'')}</span><a class="dh" href="https://igo-kifu.com/kifu/${r[0]}" target="_blank" rel="noopener">기보 ↗</a></li>`;}).join('')}</ul></div></section>`;}).join(''):`<div class="empty">${JPG?'해당하는 대국이 없습니다':'일본 대국 자료가 아직 없습니다'}</div>`;};
  let tm;document.getElementById('jq').oninput=()=>{clearTimeout(tm);tm=setTimeout(draw,250);};draw();
}
// 뉴스 사진 트리밍 보정: 세로 사진은 더 위쪽, 아주 납작한 사진은 가운데 기준
document.addEventListener('load',e=>{const im=e.target;if(!im||im.tagName!=='IMG'||!im.closest('.etop .img,.esub .img,.nth,.ndr-lead'))return;const r=im.naturalHeight/(im.naturalWidth||1);if(r>1.05)im.style.objectPosition='50% 12%';else if(r<0.5)im.style.objectPosition='50% 50%';},true);

/* =============== FEDERATIONS =============== */
function pFederations(){
  const by={};P.forEach(p=>{const o=p.o||'정보 없음';const a=by[o]=by[o]||{o,c:p.c,n:0,act:0,ret:0,f:0,nog:0,keys:[]};a.n++;if((p.st||'').includes('현역'))a.act++;else a.ret++;if(p.g==='여자')a.f++;if(!p.g)a.nog++;a.keys.push(p.k);});
  const list=Object.values(by).sort((a,b)=>b.n-a.n);
  const games=a=>{let g=0,w=0,l=0;a.keys.forEach(k=>{const r=rec(k);g+=r.g;w+=r.w;l+=r.l;});return {g,w,l};};
  app.innerHTML=crumb([['홈','#/'],['소속·국가']])+`<h1 class="pt">소속·국가</h1><p class="lede">기사 정보의 소속기원 기준입니다. 대국 수와 승률은 그 소속 기사들이 한국기원 기록에 남긴 대국 기준입니다.</p>
  <div class="fedg">${list.map(a=>{const x=games(a);const top=a.keys.filter(k=>ws(k)&&ws(k)[7]>=RANK_MIN).sort((p,q)=>ws(q)[0]-ws(p)[0]).slice(0,3);return `<div class="fedc"><h3><span>${esc(a.o)}</span>${a.c?cflag(a.c):''}</h3>
  <div class="feds"><div><div class="k">기사</div><div class="v">${fmt(a.n)}</div></div><div><div class="k">현역 / 그 외</div><div class="v">${fmt(a.act)}<small>/</small>${fmt(a.ret)}</div></div><div><div class="k">여자</div><div class="v">${a.nog===a.n?'<span class="na">정보 없음</span>':fmt(a.f)}</div></div><div><div class="k">대국 · 승률</div><div class="v">${fmt(x.g)}</div><div class="s">승률 ${pct(x.w,x.w+x.l)}</div></div></div>
  ${a.nog===a.n&&a.n>10?`<div class="note">성별 정보 없음(${fmt(a.n)}명 전원) — 여자 랭킹에 반영되지 않습니다.</div>`:''}${a.c==='대만'?'<div class="note">현역·남자 위주로만 기록된 불완전한 표본입니다.</div>':''}
  <div class="fedf"><div class="fedt">${top.length?`실력 점수 상위: ${top.map(k=>plink(k)).join(', ')}`:''}</div><a class="linkbtn" href="#/players?org=${encodeURIComponent(a.o)}">소속 기사 보기 →</a></div></div>`;}).join('')}</div>`;
}

/* =============== SCHEDULE =============== */
function pSchedule(q){
  // 지난 날은 대국 수(기록), 앞으로의 날은 대국 일정(한국기원 발표)
  const tn=todayN();const dy=SCHED?((tn/10000)|0):((LASTD/10000)|0),dm=SCHED?(((tn/100)|0)%100):(((LASTD/100)|0)%100);
  const y=+q.y||dy,m=+q.m||dm;const st={r:REGS.some(x=>x[0]===q.r)?q.r:'all'};
  const pre=y*10000+m*100;
  const allG=[];for(let i=GAMES.length-1;i>=0;i--){const g=GAMES[i];if(g.d<pre)break;if(g.d<pre+100)allG.push(g);}allG.reverse();
  const evD={};(SCHED?SCHED.rows:[]).forEach(r=>{if(r[0]>pre&&r[0]<pre+100){const dd=r[0]%100;(evD[dd]=evD[dd]||[]).push(r);}});
  const first=new Date(Date.UTC(y,m-1,1)).getUTCDay(),days=new Date(Date.UTC(y,m,0)).getUTCDate();
  const prev=m===1?[y-1,12]:[y,m-1],next=m===12?[y+1,1]:[y,m+1];
  let byD={},sel=+q.d||0;
  const plain=t=>schedText(t).html.replace(/<[^>]+>/g,'');
  app.innerHTML=gHead('calendar')+`<div class="cal2-top"><div class="cal2-nav"><a href="#/games/calendar?y=${prev[0]}&m=${prev[1]}${st.r!=='all'?'&r='+st.r:''}" aria-label="이전 달">‹</a><h2>${y}년 <b>${m}월</b></h2><a href="#/games/calendar?y=${next[0]}&m=${next[1]}${st.r!=='all'?'&r='+st.r:''}" aria-label="다음 달">›</a>${y*100+m!==((tn/100)|0)?`<a class="cal2-today" href="#/games/calendar">오늘</a>`:''}</div><div class="cal2-sum" id="csum"></div></div>
  <div class="fbar">${pillGroup('cr','구분',REGS,st.r)}</div>
  <div class="cal2-lay"><div><div class="cal2-wd">${WDAY.map((x,i)=>`<span class="${i===0?'sun':i===6?'sat':''}">${x}</span>`).join('')}</div><div class="cal2" id="cgrid"></div>
  <p class="cal2-key"><span><i class="k1"></i>대국 기록</span><span><i class="k2"></i>대국 일정(한국기원 발표)</span><span>막대 길이 = 그날 대국 수</span></p></div>
  <aside class="cal2-side" id="cside"></aside></div>`;
  bindPills('cr',v=>{st.r=v;build();});
  build();
  function build(){
    byD={};allG.forEach(g=>{if(st.r!=='all'&&regOf(g.c)!==st.r)return;const dd=g.d%100;(byD[dd]=byD[dd]||[]).push(g);});
    const showEv=st.r==='all'||st.r==='kr'||st.r==='w';
    const mx=Math.max(1,...Object.values(byD).map(a=>a.length));
    if(!sel||!(byD[sel]||(showEv&&evD[sel]))){const td=pre<tn&&tn<pre+100?tn%100:0;
      sel=td&&(byD[td]||(showEv&&evD[td]))?td:+(Object.keys(byD).map(Number).sort((a,b)=>b-a)[0]||0)||(showEv?+(Object.keys(evD).map(Number).sort((a,b)=>a-b)[0]||0):0);}
    const tot=Object.values(byD).reduce((a,x)=>a+x.length,0),nd=Object.keys(byD).length,ne=showEv?Object.values(evD).reduce((a,x)=>a+x.length,0):0;
    const pk=Object.entries(byD).sort((a,b)=>b[1].length-a[1].length)[0];
    document.getElementById('csum').innerHTML=`<span><b>${fmt(tot)}</b>국</span><span>대국 있는 날 <b>${nd}</b>일</span>${ne?`<span>일정 <b>${ne}</b>건</span>`:''}${pk?`<span>가장 많은 날 <b>${m}.${pk[0]}</b> ${fmt(pk[1].length)}국</span>`:''}`;
    let h='';for(let i=0;i<first;i++)h+='<div class="cd x"></div>';
    for(let dd=1;dd<=days;dd++){const gs=byD[dd]||[],ev=showEv?evD[dd]||[]:[],d=pre+dd,w=(first+dd-1)%7;
      const cnt={};gs.forEach(g=>{cnt[g.g]=(cnt[g.g]||0)+1;});const tops=Object.entries(cnt).sort((a,b)=>b[1]-a[1]);
      const lines=tops.slice(0,3).map(([gid,n])=>`<li class="r-${regOf((gs.find(g=>g.g==+gid)||{}).c)}"><span>${esc(G[gid])}</span>${n>1?`<em>${n}</em>`:''}</li>`);
      if(!gs.length)ev.slice(0,3).forEach(r=>lines.push(`<li class="ev"><span>${esc((r[2]?r[2]+' ':'')+plain(r[3]))}</span></li>`));
      const more=(gs.length?tops.length:ev.length)-3;
      h+=`<button type="button" class="cd${w===0?' sun':w===6?' sat':''}${d===tn?' today':''}${dd===sel?' on':''}${gs.length||ev.length?'':' z'}${d>tn?' fut':''}" data-d="${dd}" ${gs.length||ev.length?'':'disabled'} aria-label="${m}월 ${dd}일 ${gs.length}국${ev.length?' 일정 '+ev.length+'건':''}">
        <span class="cd-h"><span class="cd-n">${dd}</span>${gs.length?`<span class="cd-c">${fmt(gs.length)}<small>국</small></span>`:''}${ev.length?`<span class="cd-e" title="일정 ${ev.length}건">${ev.length}</span>`:''}</span>
        ${lines.length?`<ul>${lines.join('')}${more>0?`<li class="more">+${more}</li>`:''}</ul>`:''}${gs.length?`<i class="cd-bar" style="width:${Math.max(6,Math.round(gs.length/mx*100))}%"></i>`:''}</button>`;}
    const cg=document.getElementById('cgrid');cg.innerHTML=h;
    cg.onclick=e=>{const b=e.target.closest('button.cd[data-d]');if(!b||b.disabled)return;sel=+b.dataset.d;cg.querySelectorAll('.cd.on').forEach(x=>x.classList.remove('on'));b.classList.add('on');side();
      try{routeRS(`#/games/calendar?y=${y}&m=${m}&d=${sel}${st.r!=='all'?'&r='+st.r:''}&keep=1`);}catch(_){}
      if(window.innerWidth<900)document.getElementById('cside').scrollIntoView({behavior:'smooth',block:'start'});};
    side();
    function side(){
      const el=document.getElementById('cside');
      if(!sel){el.innerHTML='<div class="empty">이 달에는 대국 기록이 없습니다</div>';return;}
      const L=dayLabel(pre+sel),gs=byD[sel]||[],ev=showEv?evD[sel]||[]:[];
      el.innerHTML=`<div class="cs-h"><div class="cs-d">${L.m}월 ${L.dd}일 <span>${L.w}요일</span></div><div class="cs-s">${gs.length?`대국 ${fmt(gs.length)}국`:''}${gs.length&&ev.length?' · ':''}${ev.length?`일정 ${ev.length}건`:''}</div></div>
      ${ev.length?`<div class="cs-sec"><h3>대국 일정</h3><ul class="sgl">${ev.map(r=>{const c=SCLS[r[1]]||['기타','b-O'];const t=schedText(r[3]);return `<li><span class="st">${esc(r[2]||'종일')}</span><span class="badge ${c[1]}">${c[0]}</span><span class="sx">${t.html}</span>${t.live?'<span class="slive" title="온라인 중계">중계</span>':''}</li>`;}).join('')}</ul></div>`:''}
      ${gs.length?`<div class="cs-sec"><h3>대국 결과</h3><div class="diary cs-dy">${dayGroupsHtml(gs)}</div></div>`:''}
      ${gs.length?`<a class="cs-more" href="#/games/list?y=${y}">대국 목록에서 더 보기 ›</a>`:''}`;
    }
  }
}

/* =============== ABOUT =============== */
function pAbout(sub){
  sub=sub||'methodology';const L=META.link;
  const tabs=[['methodology','수집·집계 방법'],['limitations','커버리지·알려진 한계'],['changelog','데이터 갱신 이력']];
  let body='';
  if(sub==='methodology')body=`<h2>수집</h2>${META.kba?`<p>대국 기록은 한국기원 기록실 대국결과(baduk.or.kr) 전체입니다. 공식 ${fmt(META.kba.official)}국, 비공식 ${fmt(META.kba.unofficial)}국(${esc(META.kba.fetched.replace(/-/g,'.'))} 수집, ${dstr(LASTD)}까지). 통산 전적은 한국기원 기록실 표시값과 같습니다. 원본의 대회명·승패·결과 문장은 고치지 않습니다.</p>`:`<p>한국기원(baduk.or.kr) 기록실의 대국결과와 기사정보를 모았습니다.</p>`}
  <h2>정리된 대회명과 분류 <span class="calc">계산값</span></h2><p>대회명에서 회차(제N회·제N기·연도)와 단계(예선·본선·8강·4강·결승 등)를 떼어 대회를 묶습니다. 한국기원 공식 기전정보 ${META.official_count}개와 이름이 일치하거나, 같은 기전의 예전 이름인 경우 공식 분류(국내기전·세계기전·리그)를 붙입니다. 나머지는 협회리그·해외리그·기타/미분류로 둡니다.</p>
  <h2>통산 전적과 판정</h2><p>기사의 통산 전적은 한국기원 기록실의 공식 통산(전·승·무·패)을 그대로 씁니다. 비공식 대국은 따로 표시합니다. 승률·연승·실력 점수 계산에서는 무승부·무효를 뺍니다.</p>
  <h2>실력 점수(WHR) <span class="calc">계산값</span></h2><p>Whole History Rating으로 전체 기록을 한꺼번에 놓고 계산합니다. 실력이 시간에 따라 변하는 정도를 나타내는 w²는 ${META.whr.w2}(Elo²/일)입니다. 점수대는 ${esc(META.whr.anchor)}(+${META.whr.offset}). 랭킹에는 통산 ${RANK_MIN}국 이상이면서 오차(표준오차) ±${UNC_MAX} 이내인 기사만 넣습니다. 역대 최저점은 통산 ${RANK_MIN}국을 넘긴 뒤의 점수에서만 뽑습니다. 한국기원에 기록된 공인전 기준이라 세계 랭킹과는 다릅니다.</p>
  <h2>우승 판정 <span class="calc">계산값</span></h2><p>같은 대회·같은 회차에서 단계가 결승(결승N번기·도전기·도전N번기 포함, 대회명이 '도전'으로 끝나는 경우 포함)인 대국을 모아, 더 많이 이긴 기사를 우승자로 봅니다. 동점이면 '미확정(동점)', N번기에서 과반 승수에 못 미치면 '미확정(진행·근거 부족)'으로 남기고 억지로 정하지 않습니다. 리그·단체전은 판정하지 않습니다. 판정 근거 대국은 대회 페이지에서 볼 수 있습니다.</p>
  <h2>나이·연승·라이벌 지수 <span class="calc">계산값</span></h2><p>나이는 생년월일 기준 만 나이이며, 대국 당시 나이는 대국 날짜(종료일) 기준입니다. 연승·연패는 무승부·무효를 건너뛰고 셉니다. 라이벌 지수 = 맞대결 수 × (1 − |승률 − 0.5| × 2)이며, 맞대결 10국 이상인 상대만 추천합니다.</p>
  <h2>기사 연결 <span class="calc">계산값</span></h2><p>대국 기록의 기사 표기를 기사 정보(${fmt(P.length)}명)에 연결했습니다. 2026년 매칭표, 같은 이름(유일한 경우), 출전 자격 표기 제거('(국내)' 등), 중국·대만 기사의 한자명을 중국어 외래어 표기로 바꾼 이름, 일본 기사의 로마자 이름을 일본어 외래어 표기로 바꾼 이름(성과 이름 첫 음 일치 포함), 쌍자음·이중모음 차이를 무시한 표기 정규화 순서로 연결하고, 후보가 여럿이면 한자 힌트·생년(대국 당시 나이)·다른 표기에 이미 연결됐는지로 좁혔습니다. 근거가 분명한 일부는 수작업으로 지정했습니다. 동명이인처럼 애매한 경우는 연결하지 않습니다.</p>`;
  else if(sub==='limitations'){const tot=L.tot;const row=(k,v)=>`<tr><td>${k}</td><td class="n r">${v}</td></tr>`;
    body=`<h2>항목별 채움 비율</h2><table><thead><tr><th>항목</th><th class="r">채움</th></tr></thead><tbody>${row('대국 기록 · 날짜·대회명·승패','100%')}${row('단계(예선/본선/8강/4강/결승)',(100-META.stage_unknown_pct).toFixed(1)+'%')}${row('승부 방식(불계·집·기권·시간)',META.wt_pct+'%')}${row('수순',META.moves_pct+'%')}${row('흑/백 (2021년 이후만 신뢰)',META.color_pct+'%')}${row('기사 연결(출전 연인원 기준)',(100-(L.how['미연결']||0)/tot*100).toFixed(1)+'%')}${row('생년월일(기사 정보)',pct(P.filter(p=>p.b).length,P.length))}${row('성별(기사 정보)',pct(P.filter(p=>p.g).length,P.length))}</tbody></table>
    ${META.audit?(()=>{const A=META.audit;const ok=v=>v===0?'<span class="rw">이상 없음</span>':fmt(v)+'건';return `<h2>대국 기록 점검 결과</h2><table><thead><tr><th>점검 항목</th><th class="r">결과</th></tr></thead><tbody>${row('같은 기사끼리 둔 대국',ok(A.self_games))}${row('완전히 같은 대국 중복(날짜·대회·두 기사·결과)',ok(A.exact_dup))}${row('잘못된 날짜',ok(A.bad_dates))}${row('같은 날·같은 대회·같은 두 기사 2판 이상 (번기·재대국일 수 있어 원본 유지)',fmt(A.same_day_pair)+'건')}${row('기권·실격 대국 (기록에는 포함, 실력 점수에서는 제외)',fmt(A.forfeit)+'국')}${row('팀 이름으로 기록된 릴레이 대국 (실력 점수에서 제외)',fmt(A.relay)+'국')}${row('기사 정보 없는 표기 — 아마추어',fmt(A.am_names)+'개 · '+(A.am_slots/A.slots*100).toFixed(2)+'%')}${row('기사 정보 없는 표기 — 한국기원 명단 밖 기사(관서기원·해외·은퇴 등)',fmt(A.ext_names)+'개 · '+(A.ext_slots/A.slots*100).toFixed(2)+'%')}${row('기사 정보 없는 표기 — 팀(릴레이)',fmt(A.team_names)+'개')}</tbody></table>`;})():''}
    <h2>알려진 한계</h2><ul><li>원본(한국기원)에는 날짜·대회·두 기사·결과가 모두 같은 대국이 실제로 두 번 실린 경우가 있으며, 기록실 건수에 포함되므로 그대로 둡니다. 일부 결승은 한 판이 빠지고 다른 판이 두 번 실려 있어, 이때는 '최종국' 또는 시리즈 마지막 번호 대국의 승자를 우승으로 판정했습니다.</li><li>한국 프로기사협회 리그 등 일부 대회는 여러 판이 같은 날짜로 기록되어 있습니다(원본 그대로).</li><li>실력 점수는 한국기원 공인전 기록 기준입니다. 중국·일본 국내 대회는 일부만 들어 있어 세계 랭킹과 다를 수 있습니다.</li><li>중국기원 소속 ${fmt(META.cn_no_gender)}명은 성별 정보가 없어 여자 랭킹에 반영되지 않습니다.</li><li>대만기원 기사 정보는 현역·남자 위주로 기록된 불완전한 표본입니다.</li><li>아마추어, 관서기원 등 한국기원 명단에 없는 기사는 기사 정보에 연결할 수 없어 대국 기록만 보여 줍니다(점선 밑줄 이름).</li><li>공식 기전 목록 밖 대회의 세계/국내 구분은 아직 하지 않았습니다(대회 등급 B-3 초안 전). 세계·국내 승률은 잠정치입니다.</li><li>1941~1955년은 기록이 적어 순위·점수는 '표본 부족'으로 표시합니다.</li><li>원본의 오탈자(날짜·회차 표기 등)는 고치지 않고 그대로 둡니다.</li></ul>`;}
  else body=`<table><thead><tr><th>날짜</th><th>내용</th></tr></thead><tbody>${META.changelog.map(c=>`<tr><td class="d">${esc(c[0])}</td><td>${esc(c[1])}</td></tr>`).join('')}</tbody></table>`;
  app.innerHTML=crumb([['홈','#/'],['자료에 대하여']])+`<h1 class="pt">자료에 대하여</h1><nav class="tabs">${tabs.map(([s,l])=>`<a href="#/about/${s}" class="${s===sub?'on':''}">${l}</a>`).join('')}</nav><div class="prose">${body}</div>`;
}

/* =============== ROUTER =============== */
/* =============== 벤치마킹 추가 기능 (라이벌·명승부·최고 점수·시즌 리더보드·국가별·기록 임박·점수 변동·예측·시뮬레이터·시즌 타임라인) =============== */
const FX={};
const fxPanel=(title,desc,body,id)=>`<section class="panel"${id?` id="${id}"`:''}><h2 class="sec"><span>${title}</span>${desc?`<span class="desc">${desc}</span>`:''}</h2>${body}</section>`;
const fxIsPro=k=>!!PBY[k]&&!isNK(k);
const fxActive=k=>{const r=rec(k);return r.last&&r.last>=LASTD-10000;};
const fxEra=[['all','전체'],['2020','2020년대'],['2010','2010년대'],['2000','2000년대'],['1990','1990년대'],['1980','1980년대'],['old','1970년대 이전']];
const fxInEra=(e,y)=>e==='all'?true:e==='old'?y<1980:(y>=+e&&y<+e+10);
const fxCtry=[['all','전체'],['한국','한국'],['중국','중국'],['일본','일본'],['대만','대만']];
const fxSel=(id,label,opts,cur)=>`<div class="fg"><span class="fl">${label}</span><select class="q" id="${id}" style="min-width:96px">${opts.map(([v,l])=>`<option value="${v}" ${String(cur)===String(v)?'selected':''}>${l}</option>`).join('')}</select></div>`;
const fxMargin=g=>g.r&&g.r[2]!=null?g.r[2]:null;
const fxQ=(base,q)=>{const s=new URLSearchParams();Object.entries(q).forEach(([k,v])=>{if(v!=null&&v!==''&&v!=='all')s.set(k,v);});const x=s.toString();routeRS(base+(x?'?'+x:''));};

/* ---------- 1) 역대 라이벌 ---------- */
function fxPairs(){
  if(FX.pairs)return FX.pairs;
  const m={};
  for(const g of GSC){if(g.j||!fxIsPro(g.wk)||!fxIsPro(g.lk)||g.wk===g.lk)continue;
    const a=g.wk<g.lk?g.wk:g.lk,b=a===g.wk?g.lk:g.wk,id=a+'|'+b;
    const o=m[id]||(m[id]={a,b,n:0,aw:0,fin:0,cl:0,y0:g.y,y1:g.y,ys:{},wcup:0});
    o.n++;if(g.wk===a)o.aw++;if(g.s>=4)o.fin++;const mg=fxMargin(g);if(mg!=null&&mg<=1.5)o.cl++;if(g.c==='세계기전')o.wcup++;o.y1=g.y;o.ys[g.y]=(o.ys[g.y]||0)+1;}
  const arr=Object.values(m).filter(o=>o.n>=12);
  arr.forEach(o=>{const bal=1-Math.abs(o.aw/o.n-0.5)*2;o.bal=bal;o.sc=Math.round((o.n*(0.4+0.6*bal)+o.fin*3+o.cl*0.5)*10)/10;
    o.peak=Object.entries(o.ys).sort((x,y)=>y[1]-x[1])[0];});
  return FX.pairs=arr.sort((x,y)=>y.sc-x.sc);
}
function rcRivalry(el,q){
  const st={e:q.e||'all',c:q.c||SCOPE_C()};
  el.innerHTML=`<div class="fbar">${fxSel('fe','시대',fxEra,st.e)}${fxSel('fc','국가',fxCtry,st.c)}</div><div id="fxpod" class="fx-pod"></div><div id="fxt"></div>
  <div class="note">라이벌 지수 ${calc('맞대결 수 × (0.4 + 0.6 × 균형도) + 결승·도전기 대국 × 3 + 1.5집 이내 접전 × 0.5. 균형도 = 1 − |승률 − 50%| × 2')} — 많이, 팽팽하게, 큰 무대에서 만난 사이일수록 높습니다. 두 기사 모두 기사 정보가 있는 맞대결 12국 이상만 넣었고, 무승부·무효는 뺐습니다. 시대는 두 기사가 가장 많이 만난 해로 나눕니다.</div>`;
  const draw=()=>{
    const L=fxPairs().filter(o=>fxInEra(st.e,+o.peak[0])&&(st.c==='all'||(PBY[o.a]||{}).c===st.c||(PBY[o.b]||{}).c===st.c));
    document.getElementById('fxpod').innerHTML=L.slice(0,3).map((o,i)=>`<a class="fx-pc" href="#/players/compare?p1=${encodeURIComponent(o.a)}&p2=${encodeURIComponent(o.b)}"><span class="r">${i+1}</span><span class="nm">${esc(nameOf(o.a))} <em>${o.aw} : ${o.n-o.aw}</em> ${esc(nameOf(o.b))}</span><span class="s">${o.n}국 · 결승 ${o.fin}국 · ${o.y0}–${o.y1}</span></a>`).join('');
    pagedTable(document.getElementById('fxt'),L,['순위','기사','전적','상대','맞대결','결승·도전기','1.5집 이내','세계대회','기간','지수',''],x=>x.map(o=>`<tr><td class="n c">${L.indexOf(o)+1}</td><td>${pf(o.a)}</td><td class="n c"><b>${o.aw}</b> : <b>${o.n-o.aw}</b></td><td>${pf(o.b)}</td><td class="n r">${o.n}</td><td class="n r">${o.fin}</td><td class="n r">${o.cl}</td><td class="n r">${o.wcup}</td><td class="d">${o.y0}–${o.y1}</td><td class="n r"><b>${o.sc}</b></td><td><a class="h2hb" href="#/players/compare?p1=${encodeURIComponent(o.a)}&p2=${encodeURIComponent(o.b)}">맞대결 보기</a></td></tr>`).join(''),30,{sticky:true,empty:'조건에 맞는 라이벌이 없습니다'});
    fxQ('#/records/rivalry',{e:st.e,c:st.c});
  };
  document.getElementById('fe').onchange=e=>{st.e=e.target.value;draw();};document.getElementById('fc').onchange=e=>{st.c=e.target.value;draw();};
  setTimeout(draw,10);
}

/* ---------- 2) 명승부 ---------- */
function fxUpsets(){
  if(FX.ups)return FX.ups;
  const out=[];
  for(const g of GSC){if(g.j||g.of!==1||g.s==null||g.s<1||/기권|불참|부전/.test(g.rs||''))continue;
    const ym=ymOf(g.d);const pm=ym%100===1?ym-89:ym-1;const a=whrAt(g.wk,pm),b=whrAt(g.lk,pm);if(!a||!b)continue;
    const gap=b[1]-a[1];if(gap>=220)out.push({g,gap:Math.round(gap),wr:a[1],lr:b[1],p:1/(1+Math.pow(10,gap/400))});}
  return FX.ups=out.sort((x,y)=>y.gap-x.gap);
}
function fxFinals(){
  if(FX.fin)return FX.fin;
  const pri={'세계기전':0,'국내기전':1,'해외리그':2,'리그':3,'협회리그':4,'기타':5};
  // 우승이 걸린 마지막 판: 우승 판정 기록의 마지막 대국
  const last=new Set();CHAMP.forEach(c=>{if(c.st===0&&c.gi&&c.gi.length)last.add(c.gi[c.gi.length-1]);});
  const out=[];
  for(const g of GSC){if(g.j||g.s==null||g.s<4)continue;const mg=fxMargin(g);const dec=last.has(g.i);
    if(!(dec||(mg!=null&&mg<=1.5)))continue;
    const tags=[];if(dec)tags.push('우승 결정국');if(mg!=null&&mg<=0.5)tags.push('반집');else if(mg!=null&&mg<=1.5)tags.push(mg+'집');
    out.push({g,tags,dec,mg,sc:(dec?2:0)+(mg!=null&&mg<=0.5?2:mg!=null&&mg<=1.5?1:0)+(g.c==='세계기전'?2:g.c==='국내기전'?1:0)});}
  return FX.fin=out.sort((x,y)=>y.sc-x.sc||y.g.d-x.g.d);
}
function rcMatches(el,q){
  const st={v:['fin','ups','recent'].includes(q.v)?q.v:'fin',e:q.e||'all'};
  el.innerHTML=`<div class="fbar">${pillGroup('fv','종류',[['fin','결승 명승부'],['ups','대이변'],['recent','최근 1년 이변']],st.v)}${fxSel('fe','시대',fxEra,st.e)}</div><div id="fxt"></div><div class="note" id="fxn"></div>`;
  const row=(g,extra)=>`<tr><td class="d">${dstr(g.d)}</td><td><a class="pl" href="#/tournaments/${g.g}" title="${esc(T[g.ti])}">${esc(T[g.ti])}</a></td><td>${pf(g.wk)}</td><td>${pf(g.lk)}</td><td class="small">${stone(g)}${resText(g)}</td>${extra}<td>${h2hBadge(g.wk,g.lk)}</td></tr>`;
  const draw=()=>{
    const h=document.getElementById('fxt'),n=document.getElementById('fxn');
    if(st.v==='fin'){const L=fxFinals().filter(o=>fxInEra(st.e,o.g.y));
      pagedTable(h,L,['날짜','대회','승자','패자','결과','왜 명승부인가',''],x=>x.map(o=>row(o.g,`<td>${o.tags.map(t=>`<span class="fx-tag">${t}</span>`).join(' ')}</td>`)).join(''),30,{sticky:true,empty:'조건에 맞는 대국이 없습니다'});
      n.innerHTML=`결승·도전기 대국 가운데 <b>우승이 결정된 마지막 판</b>이거나 <b>1.5집 이내</b>로 끝난 대국입니다. 세계대회·반집 승부·우승 결정국일수록 위에 놓습니다. ${calc('결과 문장에 집 수가 적힌 대국만 집 차이를 알 수 있습니다')}`;}
    else{const L=fxUpsets().filter(o=>st.v==='recent'?o.g.d>=LASTD-10000:fxInEra(st.e,o.g.y));
      pagedTable(h,L,['날짜','대회','승자','패자','결과','점수 차','예상 승률',''],x=>x.map(o=>row(o.g,`<td class="n r">${fmt(o.gap)}<span class="muted small"> (${fmt(Math.round(o.wr))} vs ${fmt(Math.round(o.lr))})</span></td><td class="n r"><b>${(o.p*100).toFixed(1)}%</b></td>`)).join(''),30,{sticky:true,empty:'조건에 맞는 대국이 없습니다'});
      n.innerHTML=`대국 전달 실력 점수(WHR) ${calc('대국 전달 말 점수로 계산. 예상 승률 = 1 / (1 + 10^(점수 차 / 400))')}가 훨씬 낮은 기사가 이긴 대국입니다. 본선 이상 공식 대국만, 점수 차 220점 이상을 넣었습니다.`;}
    fxQ('#/records/matches',{v:st.v==='fin'?'':st.v,e:st.e});
  };
  bindPills('fv',v=>{st.v=v;draw();});document.getElementById('fe').onchange=e=>{st.e=e.target.value;draw();};
  setTimeout(draw,10);
}

/* ---------- 3) 역대 최고 점수 ---------- */
function rcPeak(el,q){
  const st={c:q.c||SCOPE_C(),g:q.g==='w'?'w':'all',a:q.a==='1'?'1':'0'};
  el.innerHTML=`<div class="fbar">${fxSel('fc','국가',fxCtry,st.c)}${pillGroup('fg','대상',[['all','전체'],['w','여자']],st.g)}${pillGroup('fa','상태',[['0','전체'],['1','현역만']],st.a)}</div><div id="rpod" class="goat3 rpod"></div><div id="fxt"></div>
  <div class="note">기사마다 전성기 한 시점의 실력 점수(WHR, 계산값)로 줄 세웠습니다. 시대가 달라도 같은 기록 안에서 계산한 점수라 비교할 수 있지만, 옛 시대일수록 대국 기록이 적어 오차가 큽니다. 통산 ${RANK_MIN}국 이상인 기사만 넣었습니다. 한국 기사는 한국기원 방식 랭킹으로 다시 계산한 최고 점수도 함께 적었습니다.</div>`;
  const kbaPeak={};if(typeof KRH!=='undefined'&&KRH&&KRH.ps)for(const k in KRH.ps){let b=null;KRH.ps[k].forEach(p=>{if(!b||p[2]>b[2])b=p;});if(b)kbaPeak[k]=b;}
  const draw=()=>{
    const rN=rankAt(LASTD/100|0);
    const L=Object.entries(WS).filter(([k,s])=>s[7]>=RANK_MIN&&(st.c==='all'||(PBY[k]||{}).c===st.c)&&(st.g!=='w'||(PBY[k]||{}).g==='여자')&&(st.a!=='1'||fxActive(k))).sort((a,b)=>b[1][3]-a[1][3]);
    podium(L.slice(0,3).map(([k,s])=>({k,v:fmt(s[3]),u:'점',s:`${ymstr(s[4])} 최고점${PBY[k]&&PBY[k].b?' · 만 '+ageAt(PBY[k].b,s[4]*100+15)+'세':''}<br>현재 ${fmt(s[0])}점`})));
    pagedTable(document.getElementById('fxt'),L,['순위','기사','최고 점수','그때','그때 나이','현재 점수','현재 순위','한국기원 방식 최고'],x=>x.map(([k,s])=>{const p=PBY[k]||{};const kp=kbaPeak[k];return `<tr><td class="n c">${L.findIndex(z=>z[0]===k)+1}</td><td>${pf(k)}</td><td class="n r"><b>${fmt(s[3])}</b></td><td class="d">${ymstr(s[4])}</td><td class="n r">${p.b?'만 '+ageAt(p.b,s[4]*100+15)+'세':'–'}</td><td class="n r">${fmt(s[0])}</td><td class="n r">${rN[k]?rN[k]+'위':'–'}</td><td class="n r">${kp?fmt(kp[2])+' <span class="muted small">'+ymstr(kp[0])+'</span>':'–'}</td></tr>`;}).join(''),50,{sticky:true,empty:'조건에 맞는 기사가 없습니다'});
    fxQ('#/records/peak',{c:st.c,g:st.g==='w'?'w':'',a:st.a==='1'?'1':''});
  };
  document.getElementById('fc').onchange=e=>{st.c=e.target.value;draw();};bindPills('fg',v=>{st.g=v;draw();});bindPills('fa',v=>{st.a=v;draw();});
  draw();
}

/* ---------- 4) 시즌 리더보드 ---------- */
function rcSeasons(el,q){
  const ys=YEARS.slice().reverse();const st={y:+q.y&&ys.includes(+q.y)?+q.y:ys[0],a:q.a||'all',c:q.c||SCOPE_C()};
  el.innerHTML=`<div class="fbar">${fxSel('fy','시즌',ys.map(y=>[y,y+'년']),st.y)}${fxSel('fa','나이',[['all','전체'],['20','만 20세 이하'],['25','만 25세 이하'],['40','만 40세 이상']],st.a)}${fxSel('fc','국가',fxCtry,st.c)}</div><div id="fxr"></div>
  <div class="note">그해 대국만 모아 매긴 순위입니다. 나이는 그해 마지막 대국 날짜의 만 나이이며, 생년월일이 있는 기사만 나이 필터에 들어갑니다. 승률은 그해 20국 이상만, 무승부·무효는 뺐습니다. 우승은 결승·도전기 판정 기준(계산값)입니다.</div>`;
  const draw=()=>{
    const y=st.y,A={};
    for(const g of GSC){if(g.y!==y)continue;for(const k of [g.wk,g.lk]){if(!fxIsPro(k))continue;const o=A[k]||(A[k]={k,n:0,w:0,l:0,ww:0,wn:0,last:0,run:0,best:0});o.n++;o.last=g.d;
        if(g.j)continue;const win=g.wk===k;if(win){o.w++;o.run++;if(o.run>o.best)o.best=o.run;}else{o.l++;o.run=0;}if(g.c==='세계기전'){o.wn++;if(win)o.ww++;}}}
    const tt={};(CHAMP||[]).forEach(c=>{if(c.st===0&&((c.d/10000)|0)===y&&c.ck)tt[c.ck]=(tt[c.ck]||0)+1;});
    const ok=o=>{const p=PBY[o.k]||{};if(st.c!=='all'&&p.c!==st.c)return false;if(st.a==='all')return true;const a=p.b?ageAt(p.b,o.last):null;if(a==null)return false;return st.a==='40'?a>=40:a<=+st.a;};
    const L=Object.values(A).filter(ok);
    const cards=[
      ['다승',L.slice().sort((a,b)=>b.w-a.w).slice(0,10).map(o=>[o.k,o.w+'승',`${o.w}승 ${o.l}패 · ${pct(o.w,o.w+o.l)}`])],
      ['승률 (20국 이상)',L.filter(o=>o.w+o.l>=20).sort((a,b)=>b.w/(b.w+b.l)-a.w/(a.w+a.l)).slice(0,10).map(o=>[o.k,pct(o.w,o.w+o.l),`${o.w}승 ${o.l}패`])],
      ['대국 수',L.slice().sort((a,b)=>b.n-a.n).slice(0,10).map(o=>[o.k,o.n+'국',`${o.w}승 ${o.l}패`])],
      ['우승',Object.entries(tt).filter(([k])=>A[k]&&ok(A[k])).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,n])=>[k,n+'회',(CHB[k]||[]).filter(c=>((c.d/10000)|0)===y).map(c=>G[c.g]).slice(0,2).join(', ')])],
      ['세계대회 승수',L.filter(o=>o.ww).sort((a,b)=>b.ww-a.ww).slice(0,10).map(o=>[o.k,o.ww+'승',`세계대회 ${o.ww}승 ${o.wn-o.ww}패`])],
      ['최다 연승',L.filter(o=>o.best>=3).sort((a,b)=>b.best-a.best).slice(0,10).map(o=>[o.k,o.best+'연승',`그해 ${o.w}승`])],
    ];
    document.getElementById('fxr').innerHTML=`<div class="rcards">${cards.map(([t,list])=>`<div class="rcard"><h3><span>${y}년 ${t}</span></h3>${list.length?`<ol>${list.map((x,i)=>`<li data-i="${i}" ${i>=5?'hidden':''}><span class="i">${i+1}</span><span>${plink(x[0])}<span class="s">${esc(x[2])}</span></span><span class="v">${esc(x[1])}</span></li>`).join('')}</ol>${list.length>5?'<button class="pill" data-more>더보기</button>':''}`:'<div class="empty">해당 기사가 없습니다</div>'}</div>`).join('')}</div>`;
    document.querySelectorAll('#fxr [data-more]').forEach(b=>b.onclick=()=>{const ol=b.previousElementSibling;const hid=[...ol.querySelectorAll('li[hidden]')];if(hid.length){hid.forEach(li=>li.hidden=false);b.textContent='접기';}else{[...ol.querySelectorAll('li')].forEach((li,i)=>li.hidden=i>=5);b.textContent='더보기';}});
    fxQ('#/records/seasons',{y:st.y===ys[0]?'':st.y,a:st.a,c:st.c});
  };
  ['fy','fa','fc'].forEach(id=>document.getElementById(id).onchange=e=>{st[id.slice(1)]=id==='fy'?+e.target.value:e.target.value;draw();});
  draw();
}

/* ---------- 5) 국가별 ---------- */
function rcNations(el,q){
  const CC=['한국','중국','일본','대만'];
  const wt={},yrs=new Set();
  // 세계대회 우승: 세계기전 분류 대회의 우승 판정
  const gcat={};GAMES.forEach(g=>{if(gcat[g.g]==null)gcat[g.g]=g.c;});
  CHAMP.forEach(c=>{if(c.st!==0||!c.ck||gcat[c.g]!=='세계기전')return;const y=(c.d/10000)|0;const cc=(PBY[c.ck]||{}).c||'기타';yrs.add(y);(wt[y]=wt[y]||{})[cc]=(wt[y][cc]||0)+1;});
  // 국가 맞대결
  const hh={};for(const g of GAMES){if(g.j||g.of!==1)continue;const a=(PBY[g.wk]||{}).c,b=(PBY[g.lk]||{}).c;if(!a||!b||a===b||!CC.includes(a)||!CC.includes(b))continue;
    const pr=CC.indexOf(a)<CC.indexOf(b)?[a,b]:[b,a];const id=pr.join('-');const o=hh[id]||(hh[id]={a:pr[0],b:pr[1],y:{}});const yy=o.y[g.y]||(o.y[g.y]=[0,0]);if(a===pr[0])yy[0]++;else yy[1]++;}
  const Y=[...yrs].sort((a,b)=>a-b);const tot={};Y.forEach(y=>CC.concat(['기타']).forEach(c=>{tot[c]=(tot[c]||0)+((wt[y]||{})[c]||0);}));
  const sumR=(o,f)=>{let x=0,z=0;for(const y in o.y)if(f(+y)){x+=o.y[y][0];z+=o.y[y][1];}return [x,z];};
  const pairs=Object.values(hh).sort((p,q2)=>Object.values(q2.y).reduce((s,v)=>s+v[0]+v[1],0)-Object.values(p.y).reduce((s,v)=>s+v[0]+v[1],0));
  const eras=[['통산',()=>true],['2020년대',y=>y>=2020],['2010년대',y=>y>=2010&&y<2020],['2000년대',y=>y>=2000&&y<2010],['1990년대',y=>y>=1990&&y<2000]];
  el.innerHTML=`<div class="fx-tiles">${CC.map(c=>`<div class="fx-tile"><div class="k">${flag(c)} ${c} 세계대회 우승</div><div class="v">${fmt(tot[c]||0)}</div><div class="s">${Y.length?Y[0]+'–'+Y[Y.length-1]:''}</div></div>`).join('')}</div>
  ${fxPanel('연도별 세계대회 우승 '+calc('세계기전으로 분류한 대회의 우승 판정(결승·도전기 다승자). 국적은 기사 정보 기준'),'나라별 누적 막대','<div class="chart tall"><canvas id="fxn1"></canvas></div>')}
  ${fxPanel('나라 사이 맞대결','공식 대국 · 무승부·무효 제외',`<div class="tw"><table><thead><tr><th>맞대결</th>${eras.map(e=>`<th class="r">${e[0]}</th>`).join('')}</tr></thead><tbody>${pairs.map(o=>`<tr><td>${flag(o.a)} ${o.a} <span class="muted">대</span> ${flag(o.b)} ${o.b}</td>${eras.map(([,f])=>{const [x,z]=sumR(o,f);return `<td class="n r">${x+z?`<b>${x}</b>:<b>${z}</b> <span class="muted small">${pct(x,x+z)}</span>`:'–'}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div><div class="chart" style="margin-top:12px"><canvas id="fxn2"></canvas></div><div class="small muted">선 그래프: 해마다 한국 기사가 상대 나라 기사에게 거둔 승률(30국 이상인 해만)</div>`)}`;
  const col={한국:cssv('--cat1'),중국:cssv('--cat2'),일본:cssv('--cat3'),대만:cssv('--cat4'),기타:cssv('--cat6')};
  mkChart('fxn1',{type:'bar',data:{labels:Y,datasets:CC.concat(['기타']).map(c=>({label:c,data:Y.map(y=>(wt[y]||{})[c]||0),backgroundColor:col[c],stack:'s'}))},options:{maintainAspectRatio:false,plugins:{legend:{position:'bottom'}},scales:{x:{...noGrid(),stacked:true,ticks:{maxRotation:0,autoSkip:true}},y:{...gridY(),stacked:true}}}});
  const AY=[...new Set(GAMES.map(g=>g.y))].filter(y=>y>=1985).sort((a,b)=>a-b);
  const ds=['중국','일본','대만'].map(c=>{const o=hh['한국-'+c];return {label:'한국 대 '+c,data:AY.map(y=>{const v=o&&o.y[y];return v&&v[0]+v[1]>=30?Math.round(v[0]/(v[0]+v[1])*1000)/10:null;}),borderColor:col[c],backgroundColor:col[c],tension:0,pointRadius:2,spanGaps:true};});
  mkChart('fxn2',{type:'line',data:{labels:AY,datasets:ds},options:{maintainAspectRatio:false,plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:c=>`${c.dataset.label} 승률 ${c.parsed.y}%`}}},scales:{x:{...noGrid(),ticks:{maxRotation:0,autoSkip:true}},y:{...gridY(),min:0,max:100,ticks:{callback:v=>v+'%'}}}}});
}

/* ---------- 6) 기록 달성 임박 ---------- */
function fxMilestones(){
  if(FX.ms)return FX.ms;
  const out=[];const cut=LASTD-10000;
  for(const k in BYK){if(!fxIsPro(k))continue;const r=rec(k);if(!r.last||r.last<cut)continue;
    const gs=BYK[k];let w1=0,g1=0;for(let i=gs.length-1;i>=0&&gs[i].d>=cut;i--){g1++;if(!gs[i].j&&gs[i].wk===k)w1++;}
    const pace=(v,left)=>v>0?Math.ceil(left/(v/12)):null;
    const add=(what,now,goal,per)=>{const left=goal-now;if(left>0)out.push({k,what,now,goal,left,mo:pace(per,left)});};
    const nw=Math.ceil((r.w+1)/100)*100;if(r.w>=200&&nw-r.w<=15)add('통산 '+fmt(nw)+'승',r.w,nw,w1);
    const ng=Math.ceil((r.g+1)/500)*500;if(r.g>=500&&ng-r.g<=25)add('통산 '+fmt(ng)+'국',r.g,ng,g1);
    const t=(CHB[k]||[]).length;const tg=[5,10,15,20,25,30,40,50,60,70,80,90,100,120,140].find(x=>x>t);if(t>=3&&tg&&tg-t===1){const t1=(CHB[k]||[]).filter(c=>c.d>=cut).length;add('통산 우승 '+tg+'회',t,tg,t1);}
  }
  return FX.ms=out.sort((a,b)=>(a.mo==null?999:a.mo)-(b.mo==null?999:b.mo)||a.left-b.left);
}
function rcMilestones(el,q){
  const L=fxMilestones();
  el.innerHTML=`<div id="fxt"></div><div class="note">최근 1년 안에 대국한 기사 가운데 통산 승수(100승 단위, 15승 이내), 대국 수(500국 단위, 25국 이내), 우승 횟수(1회 남음)가 다음 고비에 가까운 기록입니다. '예상 시점' ${calc('최근 12개월 페이스로 남은 수를 나눈 값')}은 지난 1년 페이스가 이어진다고 볼 때입니다. 통산 전적은 기사 페이지와 같은 기준(한국기원 기록실 표시값)입니다.</div>`;
  pagedTable(document.getElementById('fxt'),L,['기사','기록','지금','남은 수','최근 1년 페이스로 예상'],x=>x.map(o=>`<tr><td>${pf(o.k)}</td><td><b>${esc(o.what)}</b></td><td class="n r">${fmt(o.now)}</td><td class="n r"><b>${fmt(o.left)}</b></td><td class="n r">${o.mo==null?'<span class="muted">최근 1년 기록 없음</span>':o.mo<=1?'이번 달 안':'약 '+o.mo+'개월 뒤'}</td></tr>`).join(''),50,{sticky:true,empty:'가까운 기록이 없습니다'});
}

/* ---------- 7) 한국기원 방식 점수 변동 (대국마다) ---------- */
function fxElo(){
  if(FX.elo)return FX.elo;
  const DIV=800,ALPHA=0.22,PROV=30;
  const RESTR=/여자|여류|숙녀|레이디|시니어|신예|신인|영재|루키|미래의 ?별|레전드|퓨처스|승단|입신|락스타|U-?\d\d|난설헌|최정|어린이|학생|아마|프로암|단체전|챌린지 바둑리그|마스터즈 서바이벌|명인전 신예|입단|노장|원로|소년|청소년|영웅전|10걸|십걸|신수|여성|퀸|여왕|국가대표 선발|선발전|연구생|드림리그|꿈나무/;
  const wOf=t=>{const cat=CATS[TC[t]],g=G[TG[t]],s=g+' '+T[t];
    if(cat==='세계기전')return 2.5;if(cat==='리그')return /여자/.test(s)?1:2;if(cat==='해외리그')return /여자/.test(s)?1:/갑조/.test(s)?2:1.5;if(cat==='협회리그')return 1;
    if(RESTR.test(s))return 1;if(/세계|바이링|춘란|응씨|TV ?아시아|후지쓰|도요타/.test(g))return 2.5;return 1.5;};
  const capOf=t=>/3번기|삼번기|3번승부/.test(T[t])?0.65:/5번기|오번기|5번승부/.test(T[t])?0.58:null;
  const WT=new Float32Array(T.length),CP=new Float32Array(T.length);for(let t=0;t<T.length;t++){WT[t]=wOf(t);CP[t]=capOf(t)||0;}
  const kor=new Set(P.filter(p=>p.c==='한국').map(p=>p.k));
  const r={},ng={},last={},pv={};let rankk={},cur=null;
  const n=GAMES.length,pa=new Float32Array(n).fill(NaN),pb=new Float32Array(n).fill(NaN),da=new Float32Array(n).fill(NaN),db=new Float32Array(n).fill(NaN),ea=new Float32Array(n).fill(NaN),wg=new Float32Array(n);
  const kof=p=>{const rk=rankk[p];if(rk==null)return kor.has(p)?28:14;return rk<=50?14:rk<=100?21:28;};
  const perf=lst=>{let w=0,avg=0;lst.forEach(([o,s])=>{w+=s;avg+=o;});avg/=lst.length;if(w===0)return avg-DIV*0.75;if(w===lst.length)return avg+DIV*0.75;let lo=avg-3000,hi=avg+3000,m=avg;for(let i=0;i<60;i++){m=(lo+hi)/2;let e=0;lst.forEach(([o])=>{e+=1/(1+Math.pow(10,(o-m)/DIV));});if(e<w)lo=m;else hi=m;}return m;};
  const idx=[];for(let i=0;i<n;i++){const g=GAMES[i];if(g.of===1&&!g.j)idx.push(i);}idx.sort((x,y)=>GAMES[x].d-GAMES[y].d||x-y);
  let first=true;
  for(const i of idx){const g=GAMES[i];const mon=(g.d/100)|0;
    if(mon!==cur){cur=mon;const act=Object.keys(r).filter(p=>kor.has(p)&&ng[p]>=PROV&&last[p]>=g.d-10000).sort((x,y)=>r[y]-r[x]);rankk={};act.forEach((p,j)=>rankk[p]=j+1);}
    const a=g.wk,b=g.lk;if(a===b)continue;
    if(first){r[a]=r[b]=8000;first=false;}
    const ra=r[a],rb=r[b];
    for(const [p,o,s] of [[a,b,1],[b,a,0]])if(r[p]==null&&r[o]!=null)(pv[p]=pv[p]||[]).push([r[o],s]);
    wg[i]=WT[g.ti];
    if(ra!=null&&rb!=null){let e=1/(1+Math.pow(10,(rb-ra)/DIV));const c=CP[g.ti];if(c)e=Math.min(Math.max(e,1-c),c);
      const d1=(1-e)*kof(a)*WT[g.ti]+ALPHA,d2=-(1-e)*kof(b)*WT[g.ti]+ALPHA;pa[i]=ra;pb[i]=rb;ea[i]=e;da[i]=d1;db[i]=d2;r[a]=ra+d1;r[b]=rb+d2;}
    for(const p of [a,b]){ng[p]=(ng[p]||0)+1;last[p]=g.d;if(r[p]==null&&pv[p]&&pv[p].length>=10){r[p]=perf(pv[p]);delete pv[p];}}
  }
  return FX.elo={pa,pb,da,db,ea,wg,off:(typeof KRH!=='undefined'&&KRH?KRH.off:0)};
}
function tElo(el,k,p,gs,q){
  el.innerHTML='<div class="empty">계산하는 중…</div>';
  setTimeout(()=>{
    const E=fxElo(),off=E.off;const rows=[];
    for(const g of gs){const i=g.i;if(isNaN(E.pa[i]))continue;const me=g.wk===k;
      rows.push({g,me,my:(me?E.pa[i]:E.pb[i])+off,op:(me?E.pb[i]:E.pa[i])+off,e:me?E.ea[i]:1-E.ea[i],d:me?E.da[i]:E.db[i],w:E.wg[i],o:me?g.lk:g.wk});}
    if(!rows.length){el.innerHTML='<div class="empty">점수가 계산된 대국이 없습니다 (공식 대국 10국 이전이거나 기록 부족)</div>';return;}
    const lastR=rows[rows.length-1],now=lastR.my+lastR.d;let best=rows[0];rows.forEach(x=>{if(x.my+x.d>best.my+best.d)best=x;});
    const big=rows.slice().sort((a,b)=>b.d-a.d)[0],worst=rows.slice().sort((a,b)=>a.d-b.d)[0];
    el.innerHTML=`<div class="fx-tiles"><div class="fx-tile"><div class="k">지금 점수</div><div class="v">${fmt(Math.round(now))}</div><div class="s">${dstr(lastR.g.d)} 대국 뒤</div></div><div class="fx-tile"><div class="k">최고 점수</div><div class="v">${fmt(Math.round(best.my+best.d))}</div><div class="s">${dstr(best.g.d)}</div></div><div class="fx-tile"><div class="k">한 판 최대 상승</div><div class="v">+${big.d.toFixed(1)}</div><div class="s">${dstr(big.g.d)} · ${esc(nameOf(big.o))}에게 승</div></div><div class="fx-tile"><div class="k">한 판 최대 하락</div><div class="v">${worst.d.toFixed(1)}</div><div class="s">${dstr(worst.g.d)} · ${esc(nameOf(worst.o))}에게 패</div></div></div>
    ${fxPanel('점수 흐름 '+calc('한국기원 랭킹 산정 방식(800 기준, k 14·21·28, 기전 가중치)으로 대국마다 다시 계산. 공식 발표 점수와 눈금을 맞춤'),'대국마다','<div class="chart"><canvas id="fxe"></canvas></div>')}
    ${fxPanel('대국별 점수 변동','최신순',`<div id="fxet"></div><div class="note">예상 승률은 두 기사의 대국 전 점수로 계산합니다(승률기대치 = 1/(1+10^(점수 차/800))). 변동 = (결과 − 예상 승률) × k × 가중치 + 0.22. k는 그달 초 순위에 따라 14·21·28, 가중치는 제한기전 1.0 · 종합기전 1.5 · 바둑리그 2.0 · 세계대회 2.5입니다. 공식 대국만 계산하며, 처음 10국은 첫 점수를 정하는 데 씁니다.</div>`)}`;
    const step=Math.max(1,Math.floor(rows.length/600));const pts=rows.filter((x,i)=>i%step===0||i===rows.length-1);
    mkChart('fxe',{type:'line',data:{labels:pts.map(x=>dstr(x.g.d)),datasets:[{label:'점수',data:pts.map(x=>Math.round(x.my+x.d)),borderColor:cssv('--link'),borderWidth:1.6,pointRadius:0,tension:0}]},options:{maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false}},scales:{x:{...noGrid(),ticks:{maxTicksLimit:8,maxRotation:0}},y:gridY()}}});
    const R=rows.slice().reverse();
    pagedTable(document.getElementById('fxet'),R,['날짜','대회','상대','상대 점수','내 점수','예상 승률','결과','가중치','변동'],x=>x.map(o=>`<tr><td class="d">${dstr(o.g.d)}</td><td class="small" title="${esc(T[o.g.ti])}">${esc(T[o.g.ti])}</td><td>${pf(o.o)}</td><td class="n r">${fmt(Math.round(o.op))}</td><td class="n r">${fmt(Math.round(o.my))}</td><td class="n r">${(o.e*100).toFixed(0)}%</td><td class="c">${o.me?'<span class="mv up">승</span>':'<span class="mv dn">패</span>'}</td><td class="n r">${o.w}</td><td class="n r"><b class="${o.d>=0?'fx-up':'fx-dn'}">${o.d>=0?'+':''}${o.d.toFixed(1)}</b></td></tr>`).join(''),40,{sticky:true});
  },20);
}

/* ---------- 8) 기사 페이지 요약 줄 · 최근 대회 · 스승 ---------- */
function fxRankHist(k){
  FX.rh=FX.rh||{};if(FX.rh[k])return FX.rh[k];
  const gs=BYK[k]||[];if(!gs.length)return null;const y0=gs[0].y,ym1=LASTD/100|0;
  let best=null,n1=0,yeBest=null;
  for(let y=y0;y<=((ym1/100)|0);y++)for(let m=1;m<=12;m++){const ym=y*100+m;if(ym>ym1)break;const r=rankAt(ym)[k];if(!r)continue;if(!best||r<best[0])best=[r,ym];if(r===1)n1++;if(m===12||ym===ym1){if(!yeBest||r<yeBest[0])yeBest=[r,y];}}
  return FX.rh[k]={best,n1,yeBest};
}
function fxKbaHist(k){
  if(typeof KRH==='undefined'||!KRH||!KRH.ps||!KRH.ps[k])return null;const a=KRH.ps[k];let best=null;a.forEach(p=>{if(!best||p[1]<best[0])best=[p[1],p[0]];});
  const n1=KRH.mo.filter(r=>r[1]===k).length;let ye=null;KRH.yrs.forEach(y=>{const L=KRH.ye[y];if(!L)return;const i=L.findIndex(x=>x[0]===k);if(i>=0&&(!ye||i+1<ye[0]))ye=[i+1,y];});
  return {best,n1,ye};
}
function fxSummary(k){
  const box=document.getElementById('fxsum');if(!box)return;
  const p=PBY[k];const out=[];
  const kh=p&&p.c==='한국'?fxKbaHist(k):null;
  if(kh){out.push(`<span><em>한국기원 방식 랭킹</em> 최고 <b>${kh.best[0]}위</b> <i>${ymstr(kh.best[1])}</i></span>`);if(kh.n1)out.push(`<span><em>월별 1위</em> <b>${kh.n1}개월</b></span>`);if(kh.ye)out.push(`<span><em>연말 최고</em> <b>${kh.ye[0]}위</b> <i>${kh.ye[1]}년</i></span>`);}
  const rh=fxRankHist(k);
  if(rh&&rh.best){out.push(`<span><em>실력 점수 순위</em> 최고 <b>${rh.best[0]}위</b> <i>${ymstr(rh.best[1])}</i></span>`);if(rh.n1)out.push(`<span><em>실력 점수 1위</em> <b>${rh.n1}개월</b></span>`);if(rh.yeBest)out.push(`<span><em>연말 최고</em> <b>${rh.yeBest[0]}위</b> <i>${rh.yeBest[1]}년</i></span>`);}
  const yr=(LASTD/10000)|0;const ys=(BYK[k]||[]).filter(g=>g.y===yr);if(ys.length){const c=cntRec(ys,k);const t=(CHB[k]||[]).filter(x=>((x.d/10000)|0)===yr).length;out.push(`<span><em>${yr}년</em> <b>${c.w}승 ${c.l}패</b>${t?` · 우승 <b>${t}</b>`:''}</span>`);}
  {const w=fxWlPlayer(k);if(w)out.push(w);}
  box.innerHTML=out.length?out.join(''):'';box.hidden=!out.length;
}
function fxRecentTour(k,gs){
  const og=gs;if(!og.length)return '';
  const lg=og[og.length-1];const ed=(T[lg.ti].match(/^(제\s?\d+\s?[회기]|\d{4}(-\d{4})?)/)||[''])[0];
  const L=og.filter(g=>g.g===lg.g&&g.d>=lg.d-1500&&(!ed||T[g.ti].startsWith(ed)));
  const won=(CHB[k]||[]).find(c=>c.g===lg.g&&c.d>=L[0].d),run=(RUB[k]||[]).find(c=>c.g===lg.g&&c.d>=L[0].d);
  const lastLoss=L.filter(g=>!g.j&&g.lk===k).pop();
  const res=won?'🏆 우승':run?'준우승':lastLoss&&lastLoss===L[L.length-1]?'탈락 — '+esc((T[lastLoss.ti].replace(ed,'').replace(G[lg.g],'').trim())||'')+'':'진행 중';
  const title=(ed?ed+' ':'')+G[lg.g];
  return fxPanel(`가장 최근 대회 · <a class="pl" href="#/tournaments/${lg.g}">${esc(title)}</a>`,esc(res),`<div class="tw"><table><thead><tr><th>날짜</th><th>단계</th><th>상대</th><th class="c">결과</th><th>내용</th></tr></thead><tbody>${L.slice().reverse().map(g=>{const o=g.wk===k?g.lk:g.wk;const st=T[g.ti].replace(ed,'').replace(G[lg.g],'').trim()||T[g.ti];return `<tr><td class="d">${dstr(g.d)}</td><td class="small">${esc(st)}</td><td>${pf(o)}</td><td class="c">${g.j?'<span class="mv">무</span>':g.wk===k?'<span class="mv up">승</span>':'<span class="mv dn">패</span>'}</td><td class="small">${stone(g)}${resText(g)}</td></tr>`;}).join('')}</tbody></table></div>`);
}
function fxTeacher(){
  if(FX.tc)return FX.tc;const byN={};P.forEach(p=>{[p.n,p.dn,p.n0].filter(Boolean).forEach(n=>{const z=n.replace(/\(.*?\)/g,'').replace(/\s/g,'');(byN[z]=byN[z]||[]).push(p.k);});});
  const tc={},st={};
  P.forEach(p=>{const lines=(p.nt||[]).concat(p.jnt||[]);for(const ln of lines){const m=ln.match(/스승\s*[:：]\s*([^,·(]+?)(?:\s*\d+단|\s*9단|\s*\(|\s*문하|$)/)||ln.match(/^([가-힣 ]{2,8}?)\s*\d*단?\s*문하/);if(!m)continue;
      const nm=m[1].replace(/\s/g,'');const ks=(byN[nm]||[]).filter(x=>x!==p.k);if(ks.length===1){tc[p.k]=ks[0];(st[ks[0]]=st[ks[0]]||[]).push(p.k);}else tc[p.k]='?'+m[1].trim();break;}});
  return FX.tc={tc,st};
}
function fxTeacherHtml(k){
  const {tc,st}=fxTeacher();const t=tc[k],s=st[k]||[];if(!t&&!s.length)return '';
  return `<div class="fx-rel">${t?`<span><em>스승</em> ${t.startsWith('?')?esc(t.slice(1)):plink(t)}</span>`:''}${s.length?`<span><em>제자</em> ${s.slice(0,8).map(x=>plink(x)).join(', ')}${s.length>8?` 외 ${s.length-8}명`:''}</span>`:''}</div>`;
}

/* ---------- 9) 맞대결 승리 예측 ---------- */
function fxPredict(a,b){
  const sa=ws(a),sb=ws(b);if(!sa||!sb)return '';
  const pa=1/(1+Math.pow(10,(sb[0]-sa[0])/400));
  const form=k=>{const gs=(BYK[k]||[]).filter(g=>!g.j).slice(-20);const w=gs.filter(g=>g.wk===k).length;return {w,l:gs.length-w,seq:gs.map(g=>g.wk===k?'<i class="w" title="'+dstr(g.d)+' '+esc(nameOf(g.lk))+'에게 승">승</i>':'<i class="l" title="'+dstr(g.d)+' '+esc(nameOf(g.wk))+'에게 패">패</i>').join('')};};
  const fa=form(a),fb=form(b);
  return fxPanel('지금 두면? '+calc('현재 실력 점수(WHR) 차이로 계산한 예상 승률 = 1 / (1 + 10^(점수 차 / 400)). 맞대결 전적·흑백·대회 성격은 넣지 않음'),'현재 실력 점수 기준',`<div class="fx-pred"><div class="fx-pa"><b>${(pa*100).toFixed(1)}%</b><span>${esc(nameOf(a))} · ${fmt(sa[0])}점</span></div><div class="fx-pbar"><span style="width:${pa*100}%"></span></div><div class="fx-pb"><b>${((1-pa)*100).toFixed(1)}%</b><span>${esc(nameOf(b))} · ${fmt(sb[0])}점</span></div></div>
  <div class="fx-form"><div><em>${esc(nameOf(a))} 최근 20국</em> <b>${fa.w}승 ${fa.l}패</b><div class="fx-seq">${fa.seq}</div></div><div><em>${esc(nameOf(b))} 최근 20국</em> <b>${fb.w}승 ${fb.l}패</b><div class="fx-seq">${fb.seq}</div></div></div><div class="small muted">왼쪽이 오래된 대국입니다. 예상 승률은 참고용 계산값입니다.</div>`);
}

/* ---------- 10) 우승 확률 시뮬레이터 ---------- */
function fxLiveWorld(){
  const cut=LASTD-600;const grp={};
  for(let i=GAMES.length-1;i>=0;i--){const g=GAMES[i];if(g.d<cut)break;if(g.c!=='세계기전'||g.s==null||g.s<1)continue;(grp[g.g]=grp[g.g]||[]).push(g);}
  return Object.entries(grp).map(([gid,gs])=>{gs=gs.slice().reverse();const ed=(T[gs[gs.length-1].ti].match(/^(제\s?\d+\s?[회기]|\d{4})/)||[''])[0];gs=gs.filter(g=>!ed||T[g.ti].startsWith(ed));
    const lost=new Set(),alive=[];gs.forEach(g=>{if(!g.j)lost.add(g.lk);});gs.forEach(g=>{for(const k of [g.wk]){if(!lost.has(k)&&!alive.includes(k))alive.push(k);}});
    return {g:+gid,ed,alive:alive.filter(k=>!isNK(k)),last:gs[gs.length-1].d,title:(ed?ed+' ':'')+G[gid]};}).filter(x=>x.alive.length>=2).sort((a,b)=>b.last-a.last);
}
function fxSim(ks){
  let n=1;while(n<ks.length)n*=2;const seats=ks.concat(Array(n-ks.length).fill(null));
  const R=k=>{const s=k&&ws(k);return s?s[0]:null;};
  const pw=(x,y)=>{const a=R(x),b=R(y);if(a==null&&b==null)return 0.5;if(a==null)return 0.25;if(b==null)return 0.75;return 1/(1+Math.pow(10,(b-a)/400));};
  let prob=seats.map(k=>k==null?0:1);const out=seats.map(()=>[]);let size=1;
  while(size<n){const np=Array(n).fill(0);
    for(let i=0;i<n;i++){if(!seats[i]||!prob[i])continue;const blk=Math.floor(i/(size*2)),half=Math.floor(i/size)%2;const o0=blk*size*2+(half?0:size);
      let tot=0,s=0;for(let j=o0;j<o0+size;j++){if(!seats[j]||!prob[j])continue;tot+=prob[j];s+=prob[j]*pw(seats[i],seats[j]);}
      np[i]=prob[i]*(tot>0?s/tot:1);}
    for(let i=0;i<n;i++)out[i].push(np[i]);prob=np;size*=2;}
  return seats.map((k,i)=>k&&{k,r:R(k),p:out[i]}).filter(Boolean);
}
function pSim(q){
  const live=fxLiveWorld();
  let ks=(q.p?q.p.split(',').filter(k=>PBY[k]||BYK[k]):null)||(live[0]?live[0].alive.slice(0,16):[]);
  app.innerHTML=crumb([['홈','#/'],['대회','#/tournaments'],['우승 확률']])+`<h1 class="pt">우승 확률 계산기</h1>
  <p class="lede">토너먼트에 남은 기사를 대진 순서대로 넣으면, 지금 실력 점수(WHR)로 라운드마다 올라갈 확률과 우승 확률을 계산합니다. 1번과 2번, 3번과 4번이 먼저 만나는 식입니다.</p>
  ${live.length?`<div class="fbar"><div class="fg"><span class="fl">진행 중인 세계대회</span><div class="pills" id="sl">${live.slice(0,5).map((x,i)=>`<button class="pill" data-i="${i}" aria-pressed="false">${esc(x.title)} <span class="muted small">${x.alive.length}명</span></button>`).join('')}</div></div></div>`:''}
  <div class="krh-pick"><div class="krh-chips" id="sch"></div><div class="krh-add"><input class="q" id="sin" list="sdl" placeholder="기사 이름으로 추가" autocomplete="off"><datalist id="sdl">${Object.keys(WS).filter(k=>PBY[k]&&fxActive(k)).map(k=>`<option value="${esc(nameOf(k))}">`).join('')}</datalist><button class="pill" id="sclr" type="button">모두 지우기</button></div></div>
  <div id="sres"></div>
  <div class="note">진행 중인 세계대회 목록은 최근 6주 안에 둔 본선 대국에서 아직 지지 않은 기사를 모은 것으로, 실제 대진 순서와 다를 수 있습니다. 칩을 끌지 않고, 빼고 다시 넣는 순서로 대진을 바꿀 수 있습니다. 실력 점수가 없는 기사는 상대보다 약하다고(25%) 가정합니다. ${calc('승률 = 1 / (1 + 10^(점수 차 / 400)), 대진표를 따라 정확히 계산(모의 실험 아님)')}</div>`;
  const draw=()=>{
    document.getElementById('sch').innerHTML=ks.length?ks.map((k,i)=>`<button class="krh-chip" type="button" data-k="${esc(k)}" title="빼기"><b>${i+1}</b> ${esc(nameOf(k))} ×</button>`).join(''):'<span class="muted small">기사를 넣으세요</span>';
    const h=document.getElementById('sres');if(ks.length<2){h.innerHTML='<div class="empty">두 명 이상 넣으면 계산합니다</div>';return;}
    const res=fxSim(ks);const rounds=res[0].p.length;const rl=i=>{const left=Math.pow(2,rounds-i-1);return i===rounds-1?'우승':left===2?'결승 진출':left+'강 진출';};
    const order=res.slice().sort((a,b)=>b.p[rounds-1]-a.p[rounds-1]);
    h.innerHTML=`<div class="tw sticky"><table><thead><tr><th class="c">대진</th><th>기사</th><th class="r">실력 점수</th>${[...Array(rounds).keys()].map(i=>`<th class="r">${rl(i)}</th>`).join('')}</tr></thead><tbody>${order.map(o=>`<tr><td class="n c">${ks.indexOf(o.k)+1}</td><td>${pf(o.k)}</td><td class="n r">${o.r!=null?fmt(o.r):'–'}</td>${o.p.map((v,i)=>`<td class="n r">${i===rounds-1?'<b>':''}${(v*100).toFixed(1)}%${i===rounds-1?'</b>':''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    fxQ('#/tournaments/sim',{p:ks.join(',')});
  };
  document.getElementById('sch').onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;ks=ks.filter(k=>k!==b.dataset.k);draw();};
  const inp=document.getElementById('sin');const add=()=>{const v=inp.value.trim();if(!v)return;const k=keyFromInput(v);if(k&&!k.startsWith('?')&&!ks.includes(k)&&ks.length<64)ks.push(k);inp.value='';draw();};
  inp.onchange=add;inp.onkeydown=e=>{if(e.key==='Enter')add();};
  document.getElementById('sclr').onclick=()=>{ks=[];draw();};
  const sl=document.getElementById('sl');if(sl)sl.onclick=e=>{const b=e.target.closest('button');if(!b)return;sl.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));ks=live[+b.dataset.i].alive.slice(0,32);draw();};
  draw();
}

/* ---------- 11) 시즌 타임라인 ---------- */
function pSeasonTL(q){
  const ys=[...new Set(CHAMP.filter(c=>c.st===0).map(c=>(c.d/10000)|0))].sort((a,b)=>b-a);const y=+q.y&&ys.includes(+q.y)?+q.y:ys[0];
  const gcat={};GAMES.forEach(g=>{if(gcat[g.g]==null)gcat[g.g]=g.c;});
  const L=CHAMP.filter(c=>c.st===0&&((c.d/10000)|0)===y).sort((a,b)=>a.d-b.d);
  const rows=[['세계기전','세계대회'],['국내기전','국내 기전'],['해외리그','해외 리그'],['리그','리그'],['기타','기타']];
  const byR={};L.forEach(c=>{const cat=gcat[c.g]||'기타';const r=rows.find(x=>x[0]===cat)?cat:'기타';(byR[r]=byR[r]||[]).push(c);});
  const W={};L.forEach(c=>{if(c.ck)W[c.ck]=(W[c.ck]||0)+1;});const top=Object.entries(W).sort((a,b)=>b[1]-a[1]).slice(0,5);
  app.innerHTML=crumb([['홈','#/'],['대회','#/tournaments'],['시즌 타임라인']])+`<h1 class="pt">${y} 시즌 타임라인</h1>
  <p class="lede">한 해 동안 결정된 우승을 달력 위에 놓았습니다. 칸 하나가 한 달이고, 이름은 우승자입니다. ${calc('결승·도전기 다승자 판정, 날짜는 우승이 결정된 대국 날짜')}</p>
  <div class="fbar">${fxSel('ty','연도',ys.map(v=>[v,v+'년']),y)}<div class="fg"><span class="fl">이해 최다 우승</span><span>${top.map(([k,n])=>`${plink(k)} <b>${n}</b>`).join(' · ')||'–'}</span></div></div>
  <div class="tw"><table class="fx-tl"><thead><tr><th></th>${[...Array(12).keys()].map(m=>`<th>${m+1}월</th>`).join('')}</tr></thead><tbody>${rows.filter(([c])=>byR[c]).map(([c,l])=>`<tr><th class="lab">${l}<span class="muted small"> ${byR[c].length}</span></th>${[...Array(12).keys()].map(m=>`<td>${byR[c].filter(x=>((x.d/100)|0)%100===m+1).map(x=>`<a class="fx-tc ${gcat[x.g]==='세계기전'?'w':''}" href="#/tournaments/${x.g}" title="${esc(G[x.g]+' '+x.ed+' · '+dstr(x.d))}"><span class="t">${esc(G[x.g])}</span><span class="n">${flag((PBY[x.ck]||{}).c)}${esc(x.ck?nameOf(x.ck):'?')}</span></a>`).join('')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  ${L.length?'':'<div class="empty">이해에 판정된 우승이 없습니다</div>'}`;
  document.getElementById('ty').onchange=e=>{routeGo('#/tournaments/timeline?y='+e.target.value);};
}

/* ---------- 12) 홈: 오늘의 바둑사 ---------- */
function fxToday(){
  const t=kst();const md=t.m*100+t.d;
  const fin=CHAMP.filter(c=>c.st===0&&c.d%10000===md&&c.ck).sort((a,b)=>b.d-a.d).slice(0,6);
  if(!fin.length)return '';
  return '<ul class="ehl">'+fin.map(c=>`<li><b>${(c.d/10000)|0}</b> ${plink(c.ck)} <span class="s">${esc(G[c.g])} ${esc(c.ed)} 우승</span></li>`).join('')+'</ul>';
}
const FXR={rivalry:rcRivalry,matches:rcMatches,peak:rcPeak,seasons:rcSeasons,nations:rcNations,milestones:rcMilestones};
const FXD={rivalry:'많이, 팽팽하게, 큰 무대에서 만난 두 기사를 라이벌 지수로 줄 세웠습니다.',
  matches:'우승이 걸린 결승의 마지막 판과 반집 승부, 그리고 점수 차를 뒤집은 대이변을 모았습니다.',
  peak:'기사마다 가장 높았던 실력 점수로 줄 세운 역대 전성기 순위입니다.',
  seasons:'한 해의 다승·승률·우승·연승 순위를 나이·국가별로 봅니다.',
  nations:'한·중·일·대만의 세계대회 우승과 나라 사이 맞대결 성적입니다.',
  milestones:'통산 승수·대국 수·우승 횟수의 다음 고비에 가까운 현역 기사입니다.'};
/* =============== ESPN식 추가 기능 (대국 상세·리그 시즌·기사 소식·대진표) =============== */
const fxEd=t=>(t.match(/^(제\s?\d+\s?[회기]|\d{4}-\d{4}|\d{4})/)||[''])[0];
const fxStage=t=>{const m=t.match(/(\d+)\s?강(?!자)/);if(/결승/.test(t)&&!/준결승/.test(t))return 2;if(/준결승/.test(t))return 4;return m?+m[1]:null;};

/* ---------- 대국 상세 ---------- */
function pGame(i){
  i=+i;const g=GAMES[i];
  if(!g){app.innerHTML=crumb([['홈','#/'],['대국','#/games']])+'<div class="empty" style="margin-top:24px">대국을 찾을 수 없습니다</div>';return;}
  const ym=ymOf(g.d),pm=ym%100===1?ym-89:ym-1;const wa=whrAt(g.wk,pm),wb=whrAt(g.lk,pm);
  const pw=wa&&wb?1/(1+Math.pow(10,(wb[1]-wa[1])/400)):null;
  let E=null;try{E=fxElo();}catch(e){}
  const ok=E&&!isNaN(E.pa[i]);
  // 이 대국 전까지 맞대결
  let hx=0,hy=0;for(const x of (BYK[g.wk]||[])){if(x.i>=i&&x.d>=g.d&&x.i!==i&&x.d>g.d)break;if(x.i===i)break;if(x.j)continue;if(x.wk===g.wk&&x.lk===g.lk)hx++;else if(x.wk===g.lk&&x.lk===g.wk)hy++;}
  const [ax,ay]=h2hCount(g.wk,g.lk);
  const ed=fxEd(T[g.ti]);const same=GAMES.filter(x=>x.g===g.g&&(ed?T[x.ti].startsWith(ed):Math.abs(x.d-g.d)<200)&&Math.abs(x.d-g.d)<20000);
  const side=(k,win,r,pre,dl)=>{const p=PBY[k];return `<div class="fxg-p ${win?'w':'l'}"><div class="ph">${photo(p,nameOf(k))}</div><div class="nm">${pf(k)}</div><div class="rs">${g.j?'':win?'승':'패'}</div>
    <div class="fxg-k"><span>실력 점수(대국 전달)</span><b>${r?fmt(r[1]):'–'}</b></div>${ok?`<div class="fxg-k"><span>한국기원 방식 점수</span><b>${fmt(Math.round(pre+E.off))} <em class="${dl>=0?'fx-up':'fx-dn'}">${dl>=0?'+':''}${dl.toFixed(1)}</em></b></div>`:''}${p&&p.b?`<div class="fxg-k"><span>대국 당시 나이</span><b>만 ${ageAt(p.b,g.d)}세</b></div>`:''}</div>`;};
  const nextOf=k=>{const a=BYK[k]||[];const j=a.findIndex(x=>x.i===i);return [a[j-1],a[j+1]];};
  const nav=k=>{const [pv,nx]=nextOf(k);return `<div class="fxg-nav"><em>${esc(nameOf(k))}</em>${pv?`<a href="#/games/g/${pv.i}">← ${dstr(pv.d)} ${esc(nameOf(pv.wk===k?pv.lk:pv.wk))}</a>`:'<span class="muted">첫 대국</span>'}${nx?`<a href="#/games/g/${nx.i}">${dstr(nx.d)} ${esc(nameOf(nx.wk===k?nx.lk:nx.wk))} →</a>`:'<span class="muted">마지막 대국</span>'}</div>`;};
  app.innerHTML=crumb([['홈','#/'],['대국','#/games'],['대국 상세']])+`<h1 class="pt fxg-t">${esc(T[g.ti])}</h1>
  <p class="lede">${dstr(g.d).replace(/-/g,'.')} · ${badge(g.c)} ${g.of===0?'<span class="unof">비공식</span>':SRCB[g.of]?`<span class="unof cnsrc" title="${SRCB[g.of][1]}">${SRCB[g.of][0]}</span>`:''} · <a class="pl" href="#/tournaments/${g.g}">${esc(G[g.g])}</a></p>
  <div class="fxg">${side(g.wk,!g.j,wa,ok?E.pa[i]:0,ok?E.da[i]:0)}<div class="fxg-mid"><div class="r">${g.j?esc(g.rs||'무승부'):resText(g)}</div>${kfBtn(g,1)}${stone(g)?`<div class="small muted">${g.r[0]===1?esc(nameOf(g.wk))+' 흑':esc(nameOf(g.wk))+' 백'}</div>`:''}
    ${pw!=null?`<div class="fxg-pw"><span style="width:${pw*100}%"></span></div><div class="small">대국 전 예상 승률 ${calc('대국 전달 실력 점수(WHR) 차이로 계산')} <b>${(pw*100).toFixed(1)}%</b> : <b>${((1-pw)*100).toFixed(1)}%</b>${pw<0.3&&!g.j?' <span class="fx-tag">이변</span>':''}</div>`:''}</div>${side(g.lk,false,wb,ok?E.pb[i]:0,ok?E.db[i]:0)}</div>
  <div class="g2">${fxPanel('맞대결','',`<p>이 대국 전까지 <b>${esc(nameOf(g.wk))} ${hx}승</b> · <b>${esc(nameOf(g.lk))} ${hy}승</b><br>통산 <b>${ax} : ${ay}</b> ${h2hBadge(g.wk,g.lk)}</p>`)}
  ${fxPanel('앞뒤 대국','',nav(g.wk)+nav(g.lk))}</div>
  ${fxPanel(`같은 대회 대국 · ${esc((ed?ed+' ':'')+G[g.g])}`,same.length+'국',`<div class="tw"><table><thead><tr><th>날짜</th><th>단계</th><th>승</th><th>패</th><th>결과</th></tr></thead><tbody>${same.map(x=>`<tr class="${x.i===i?'fxg-on':''}"><td class="d">${dstr(x.d)}</td><td class="small">${esc(T[x.ti].replace(ed,'').replace(G[x.g],'').trim()||T[x.ti])}</td><td>${plink(x.wk,'w')}</td><td>${plink(x.lk)}</td><td class="small"><a class="glink" href="#/games/g/${x.i}">${stone(x)}${resText(x)}</a>${x.i!==i?kfBtn(x):''}</td></tr>`).join('')}</tbody></table></div>`)}
  <div class="note">실력 점수는 대국 전달 말 점수(WHR, 계산값)이고, 한국기원 방식 점수는 한국기원 랭킹 산정 방식으로 대국마다 다시 계산한 점수와 이 판의 변동입니다(공식 대국만). ${g.j?'무승부·무효 대국은 점수를 바꾸지 않습니다.':''}</div>`;
}

/* ---------- 리그 시즌 ---------- */
function fxLeagues(){
  if(FX.lg)return FX.lg;const m={};
  for(const g of GAMES){if(!['리그','해외리그','협회리그'].includes(g.c))continue;const ed=fxEd(T[g.ti]);if(!ed)continue;const id=g.g+'|'+ed;const o=m[id]||(m[id]={g:g.g,ed,c:g.c,n:0,d0:g.d,d1:g.d,gs:[]});o.n++;o.d1=g.d;o.gs.push(g);}
  return FX.lg=Object.values(m).filter(o=>o.n>=20).sort((a,b)=>b.d1-a.d1);
}
function pLeague(q){
  const L=fxLeagues();const groups=[...new Set(L.map(o=>o.g))].filter(g=>typeof fxCnLg==='undefined'||!fxCnLg(G[g])).map(g=>[g,G[g],L.filter(o=>o.g===g).length]).sort((a,b)=>b[2]-a[2]);
  const gid=q.l!=null&&groups.some(x=>x[0]===+q.l)?+q.l:(groups[0]||[])[0];const eds=L.filter(o=>o.g===gid);const E=eds.find(o=>o.ed===q.s)||eds[0];
  app.innerHTML=crumb([['홈','#/'],['대회','#/tournaments'],['리그 시즌']])+`<h1 class="pt">리그 시즌 기록</h1>
  <p class="lede">바둑리그·여자바둑리그·프로기사협회 리그를 시즌별로 모아 개인 성적과 라운드별 결과를 봅니다.</p>${typeof pCnLeague!=='undefined'?'<div class="fxw-go"><b>🇨🇳 중국 리그</b><span class="muted small">갑조·을조·병조·여자 갑조·을조를 리그별·시즌별로 따로 모았습니다.</span><a class="btn" href="#/tournaments/cnleague">중국 리그 보기 →</a></div>':''}
  <div class="fbar">${fxSel('lg','리그',groups.map(x=>[x[0],x[1]+' ('+x[2]+'시즌)']),gid)}${fxSel('ls','시즌',eds.map(o=>[o.ed,o.ed]),E?E.ed:'')}</div><div id="lgb"></div>`;
  document.getElementById('lg').onchange=e=>{routeGo('#/tournaments/league?l='+e.target.value);};
  document.getElementById('ls').onchange=e=>{routeGo('#/tournaments/league?l='+gid+'&s='+encodeURIComponent(e.target.value));};
  if(!E){document.getElementById('lgb').innerHTML='<div class="empty">리그 기록이 없습니다</div>';return;}
  const S={};E.gs.forEach(g=>{for(const k of [g.wk,g.lk]){const o=S[k]||(S[k]={k,n:0,w:0,l:0,bw:0,bn:0,run:0,best:0,top:null});o.n++;if(g.j)continue;const win=g.wk===k;win?o.w++:o.l++;if(win){o.run++;o.best=Math.max(o.best,o.run);}else o.run=0;
      if(g.r[0]){const my=win?g.r[0]:(g.r[0]===1?2:1);if(my===1){o.bn++;if(win)o.bw++;}}
      if(win){const r=whrAt(g.lk,ymOf(g.d));if(r&&(!o.top||r[1]>o.top[1]))o.top=[g.lk,r[1],g.i];}}});
  const rows=Object.values(S).sort((a,b)=>b.w-a.w||a.l-b.l);
  const rnd=new Map();E.gs.forEach(g=>{const key=T[g.ti].replace(E.ed,'').replace(G[g.g],'').trim()||'기타';if(!rnd.has(key))rnd.set(key,[]);rnd.get(key).push(g);});
  const R=[...rnd.entries()].reverse();
  document.getElementById('lgb').innerHTML=`<div class="fx-tiles"><div class="fx-tile"><div class="k">기간</div><div class="v" style="font-size:18px">${dstr(E.d0).replace(/-/g,'.')} – ${dstr(E.d1).slice(5).replace('-','.')}</div></div><div class="fx-tile"><div class="k">대국</div><div class="v">${fmt(E.n)}</div></div><div class="fx-tile"><div class="k">출전 기사</div><div class="v">${rows.length}</div></div><div class="fx-tile"><div class="k">다승 1위</div><div class="v" style="font-size:18px">${rows[0]?esc(nameOf(rows[0].k))+' '+rows[0].w+'승':'–'}</div></div></div>
  ${fxPanel('개인 성적','다승순 · 무승부·무효 제외','<div id="lgt"></div>')}
  ${fxPanel('라운드별 결과','최신순',R.slice(0,40).map(([key,gs])=>`<div class="fx-rd"><div class="fx-rdh"><b>${esc(key)}</b><span class="muted small">${dstr(gs[0].d)} · ${gs.length}국</span></div><ul>${gs.map(g=>`<li>${plink(g.wk,'w')}<em>승</em>${plink(g.lk)}<a class="glink small" href="#/games/g/${g.i}">${stone(g)}${resText(g)}</a>${kfBtn(g)}</li>`).join('')}</ul></div>`).join('')+(R.length>40?`<div class="small muted">앞의 ${R.length-40}개 라운드는 생략했습니다</div>`:''))}
  ${fxLeagueTeam(G[gid])}`;
  pagedTable(document.getElementById('lgt'),rows,['순위','기사','대국','승','패','승률','흑번 승률','최다 연승','가장 강한 상대에게 거둔 승'],x=>x.map(o=>`<tr><td class="n c">${rows.indexOf(o)+1}</td><td>${pf(o.k)}</td><td class="n r">${o.n}</td><td class="n r"><b>${o.w}</b></td><td class="n r">${o.l}</td><td class="n r">${pct(o.w,o.w+o.l)}</td><td class="n r">${o.bn?pct(o.bw,o.bn):'–'}</td><td class="n r">${o.best||'–'}</td><td>${o.top?`${plink(o.top[0])} <a class="glink small" href="#/games/g/${o.top[2]}">${fmt(o.top[1])}점</a>`:'–'}</td></tr>`).join(''),30,{sticky:true});
}

/* ---------- 기사 소식 ---------- */
function fxFeed(){
  if(FX.feed)return FX.feed;const out=[];
  const pd=s=>{s=String(s||'');const m=s.match(/(\d{4})(?:[.\-](\d{1,2}))?(?:[.\-](\d{1,2}))?/);if(!m)return null;return {v:+m[1]*10000+(+(m[2]||0))*100+(+(m[3]||0)),t:m[1]+(m[2]?'.'+m[2].padStart(2,'0'):'')+(m[3]?'.'+m[3].padStart(2,'0'):'')};};
  P.forEach(p=>{(p.pr||[]).forEach(r=>{const d=pd(r[1]);if(!d)return;const ent=/입단/.test(r[2]||'')||(r[0]===1&&!/승단/.test(r[2]||''));out.push({k:p.k,d:d.v,dt:d.t,ty:ent?'입단':'승단',tx:ent?'입단':(r[0]+'단 승단'),note:(r[2]&&!/^(\d단 )?승단$|^입단$/.test(r[2]))?r[2]:''});});});
  for(const k in CHB){if(!PBY[k])continue;const c=CHB[k].slice().sort((a,b)=>a.d-b.d)[0];out.push({k,d:c.d,dt:dstr(c.d).replace(/-/g,'.'),ty:'첫 우승',tx:'첫 우승',note:G[c.g]+' '+c.ed});}
  for(const k in BYK){if(!PBY[k])continue;const c=(BYK[k]||[]).find(g=>!g.j&&g.wk===k&&g.of===1);if(c)out.push({k,d:c.d,dt:dstr(c.d).replace(/-/g,'.'),ty:'첫 승',tx:'공식전 첫 승',note:T[c.ti],gi:c.i});}
  return FX.feed=out.sort((a,b)=>b.d-a.d);
}
function pFeed(q){
  const st={t:q.t||'all',c:q.c||'all',p:q.p||'5'};
  app.innerHTML=crumb([['홈','#/'],['기사','#/players'],['기사 소식']])+`<h1 class="pt">기사 소식</h1><p class="lede">입단·승단·첫 승·첫 우승을 날짜순으로 모았습니다.</p>
  <div class="fbar">${fxSel('ft','종류',[['all','전체'],['입단','입단'],['승단','승단'],['첫 승','공식전 첫 승'],['첫 우승','첫 우승']],st.t)}${fxSel('fc','국가',fxCtry,st.c)}${fxSel('fp','기간',[['1','최근 1년'],['5','최근 5년'],['all','전체']],st.p)}</div><div id="fdt"></div>
  <div class="note">입단·승단은 한국기원·일본기원·관서기원·중국바둑협회·하이펑기원 기사 정보의 승단 이력에서, 첫 승·첫 우승은 대국 기록에서 계산했습니다. 날짜가 연도·월까지만 있는 기록은 그 해·달 첫날로 정렬합니다.</div>`;
  const draw=()=>{const cut=st.p==='all'?0:LASTD-(+st.p)*10000;
    const L=fxFeed().filter(x=>x.d>=cut&&(st.t==='all'||x.ty===st.t)&&(st.c==='all'||(PBY[x.k]||{}).c===st.c));
    pagedTable(document.getElementById('fdt'),L,['날짜','종류','기사','내용'],x=>x.map(o=>`<tr><td class="d">${esc(o.dt)}</td><td><span class="fx-ty t-${o.ty.replace(' ','')}">${esc(o.ty)}</span></td><td>${pf(o.k)}</td><td>${esc(o.tx)}${o.note?` <span class="muted small">${o.gi!=null?`<a class="glink" href="#/games/g/${o.gi}">${esc(o.note)}</a>`:esc(o.note)}</span>`:''}</td></tr>`).join(''),50,{sticky:true,empty:'조건에 맞는 소식이 없습니다'});
    fxQ('#/players/feed',{t:st.t,c:st.c,p:st.p==='5'?'':st.p});};
  ['ft','fc','fp'].forEach(id=>document.getElementById(id).onchange=e=>{st[id.slice(1)]=e.target.value;draw();});draw();
}

/* ---------- 대진표 ---------- */
function fxBS(i){if(!FX.bs){FX.bs=new Map();const B=X.BS;if(B&&B.i)for(let k=0;k<B.i.length;k++)FX.bs.set(B.i[k],B.s[k]);}return FX.bs.get(i)||null;}
function fxBrackets(){
  if(FX.br)return FX.br;const m={};
  for(const g of GAMES){if(!['세계기전','국내기전','기타'].includes(g.c))continue;const t=T[g.ti];if(/예선|조별|패자|와일드|선발|리그/.test(t))continue;const sg=fxStage(t)||fxBS(g.i);if(!sg)continue;const ed=fxEd(t);if(!ed)continue;
    const id=g.g+'|'+ed;const o=m[id]||(m[id]={g:g.g,ed,c:g.c,gs:[],d0:99999999,d1:0,fin:false,max:0,x:0});o.gs.push([g,sg]);o.d0=Math.min(o.d0,g.d);o.d1=Math.max(o.d1,g.d);}
  // 같은 대회가 '제23회'·'2018'처럼 다른 이름으로 나뉜 회차는 날짜가 이어지면(45일 이내) 하나로 합침
  const dn=d=>{const s=String(d);return Date.UTC(+s.slice(0,4),+s.slice(4,6)-1,+s.slice(6,8)||1)/864e5;};
  const byg={};Object.values(m).forEach(o=>(byg[o.g]=byg[o.g]||[]).push(o));const out=[];
  for(const g in byg){const L=byg[g].sort((a,b)=>a.d0-b.d0);let cur=null;
    for(const o of L){if(cur&&o.ed!==cur.ed&&dn(o.d0)-dn(cur.d1)<=45){cur.gs.push(...o.gs);cur.d1=Math.max(cur.d1,o.d1);if(!/^제/.test(cur.ed)&&/^제/.test(o.ed))cur.ed=o.ed;}else{cur=o;out.push(o);}}}
  // 중국바둑협회 기록으로 빈 칸 채우기 (BX: 대진표에만 씀)
  const BXd=X.BX;if(BXd&&BXd.d){for(let i=0;i<BXd.d.length;i++){const g=BXd.g[i],d=BXd.d[i];const o=out.find(e=>e.g===g&&d>=e.d0-3&&d<=e.d1+3);if(!o)continue;
    const wk=BXd.k[BXd.w[i]],lk=BXd.k[BXd.l[i]];if(o.gs.some(([x,s])=>s===BXd.s[i]&&((x.wk===wk&&x.lk===lk)||(x.wk===lk&&x.lk===wk))))continue;
    o.gs.push([{i:null,d,g,wk,lk,j:0,rs:BXd.rs[BXd.r[i]],x:1},BXd.s[i]]);o.x++;}}
  out.forEach(o=>{o.fin=o.gs.some(x=>x[1]===2);o.max=Math.max(...o.gs.map(x=>x[1]));});
  return FX.br=out.filter(o=>o.max>=8).sort((a,b)=>b.d1-a.d1);
}
function fxModal(title,body,onOpen){
  const m=document.createElement('div');m.className='fxm-bg';m.innerHTML=`<div class="fxm" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="fxm-h"><b>${esc(title)}</b><button class="fxm-x" aria-label="닫기">✕</button></div><div class="fxm-b">${body}</div></div>`;
  const close=()=>{m.remove();document.removeEventListener('keydown',esc_);};const esc_=e=>{if(e.key==='Escape')close();};
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.fxm-x'))close();});document.addEventListener('keydown',esc_);
  document.body.appendChild(m);if(onOpen)onOpen(m,close);return close;
}
/* 대회 고르기 팝업: items=[{v,n,sub,grp}] */
function fxPickTour(items,cur,onPick){
  const grps=[...new Set(items.map(x=>x.grp))];
  fxModal('대회 고르기',`<div class="fxp-top"><input class="q" id="fxpq" type="search" placeholder="대회 이름으로 찾기" autocomplete="off"><div class="fxp-tabs">${['전체',...grps].map((g,i)=>`<button class="${i?'':'on'}" data-g="${i?esc(g):''}">${esc(g)} <span>${i?items.filter(x=>x.grp===g).length:items.length}</span></button>`).join('')}</div></div><div class="fxp-list" id="fxpl"></div>`,(m,close)=>{
    const q=m.querySelector('#fxpq'),L=m.querySelector('#fxpl');let gf='';
    const draw=()=>{const t=q.value.trim();const f=items.filter(x=>(!gf||x.grp===gf)&&(!t||x.n.includes(t)));
      if(!f.length){L.innerHTML='<div class="empty">찾는 대회가 없습니다</div>';return;}
      L.innerHTML=grps.map(g=>{const a=f.filter(x=>x.grp===g);return a.length?`${gf?'':`<div class="fxp-gh">${esc(g)} <span>${a.length}</span></div>`}<div class="fxp-g">${a.map(it).join('')}</div>`:'';}).join('');};
    const it=x=>`<button class="fxp-i ${String(x.v)===String(cur)?'on':''}" data-v="${esc(String(x.v))}"><b>${esc(x.n)}</b><span>${esc(x.sub||'')}</span></button>`;
    q.oninput=draw;m.querySelectorAll('.fxp-tabs button').forEach(b=>b.onclick=()=>{gf=b.dataset.g;m.querySelectorAll('.fxp-tabs button').forEach(x=>x.classList.toggle('on',x===b));draw();});
    L.onclick=e=>{const b=e.target.closest('.fxp-i');if(b){close();onPick(b.dataset.v);}};
    draw();setTimeout(()=>q.focus(),30);});
}
function fxBracketGroups(){
  const B=fxBrackets();const m=new Map();B.forEach(o=>{const x=m.get(o.g)||{v:o.g,n:G[o.g],c:o.c,k:0,y0:9999,y1:0};x.k++;x.y1=Math.max(x.y1,(o.d1/10000)|0);x.y0=Math.min(x.y0,(o.d1/10000)|0);m.set(o.g,x);});
  return [...m.values()].map(x=>({v:x.v,n:x.n,grp:x.c==='세계기전'?'세계대회':'국내·기타',sub:`${x.k}회차 · ${x.y0===x.y1?x.y1:x.y0+'–'+x.y1}`,y1:x.y1})).sort((a,b)=>b.y1-a.y1||a.n.localeCompare(b.n,'ko'));
}
function pBracket(q){
  const grp=fxBracketGroups();const B=fxBrackets();
  let gq=+q.g;if(!grp.some(o=>o.v===gq))gq=((grp.find(o=>o.grp==='세계대회')||grp[0])||{}).v;
  app.innerHTML=crumb([['홈','#/'],['대회','#/tournaments'],['대진표']])+`<h1 class="pt">대진표</h1><p class="lede">토너먼트 단계(64강·32강·16강·8강·4강·결승)별 맞대결을 한 장의 대진으로 그렸습니다. 기사 이름에 마우스를 올리면 그 기사가 지나온 길이 표시됩니다.</p>
  <div class="fbar"><div class="fg"><span class="fl">대회</span><button class="fxp-btn" id="bq"><b>${esc(G[gq]||'대회 고르기')}</b><span>▾ 다른 대회</span></button></div>${gq!=null?`<a class="pl small" href="#/tournaments/${gq}/bracket">이 대회 페이지에서 보기 ›</a>`:''}</div><div id="bw"></div>`;
  document.getElementById('bq').onclick=()=>fxPickTour(grp,gq,v=>{routeGo('#/tournaments/bracket?g='+v);});
  fxBracketView(document.getElementById('bw'),gq,q.e,e=>'#/tournaments/bracket?g='+gq+'&e='+encodeURIComponent(e));
}
function fxBracketView(host,gq,qe,hashOf){
  const list=fxBrackets().filter(o=>o.g===gq);const E=list.find(o=>o.ed===qe)||list[0];
  host.innerHTML=`${list.length>1?`<div class="fbar"><div class="fg"><span class="fl">회차</span><select class="q" id="be">${list.map(o=>`<option value="${esc(o.ed)}" ${E&&o.ed===E.ed?'selected':''}>${esc(o.ed)}${o.fin?'':' (진행 중)'}</option>`).join('')}</select></div></div>`:''}<div id="bb"></div>`;
  const be=host.querySelector('#be');if(be)be.onchange=e=>{routeGo(hashOf(e.target.value));};
  if(!E){document.getElementById('bb').innerHTML='<div class="empty">대진 기록이 없습니다</div>';return;}
  // 단계별 맞대결 (번기는 한 칸)
  const st={},sl={};E.gs.forEach(([g,s0])=>{if(s0>64)return;const s=Math.pow(2,Math.ceil(Math.log2(s0)));sl[s]=s0;const a=g.wk<g.lk?g.wk:g.lk,b=a===g.wk?g.lk:g.wk;const r=st[s]||(st[s]={});const o=r[a+'|'+b]||(r[a+'|'+b]={a,b,wa:0,wb:0,gs:[]});o.gs.push(g);if(!g.j){if(g.wk===a)o.wa++;else o.wb++;}});
  if(!Object.keys(st).length){document.getElementById('bb').innerHTML='<div class="empty">64강 이후 대진 기록이 없습니다</div>';return;}
  const win=o=>o?(o.wa>o.wb?o.a:o.wb>o.wa?o.b:null):null;
  const maxS=Math.max(...Object.keys(st).map(Number));const sizes=[];for(let s=maxS;s>=2;s/=2)sizes.push(s);
  const nC=sizes.length,pool=sizes.map(s=>Object.values(st[s]||{})),slots=sizes.map(s=>Array(Math.max(1,s/2)).fill(null));
  slots[nC-1][0]=pool[nC-1][0]||null;
  for(let c=nC-2;c>=0;c--){const used=new Set(),cur=slots[c];
    slots[c+1].forEach((m,j)=>{if(!m)return;[m.a,m.b].forEach((p,i)=>{const x=pool[c].find(z=>!used.has(z)&&win(z)===p)||pool[c].find(z=>!used.has(z)&&(z.a===p||z.b===p));if(x){cur[2*j+i]=x;used.add(x);}});});
    const rest=pool[c].filter(z=>!used.has(z)).sort((x,y)=>x.gs[0].d-y.gs[0].d||x.gs[0].i-y.gs[0].i);
    for(let j=0;j<slots[c+1].length&&rest.length;j++){if(slots[c+1][j])continue;for(const k of [2*j,2*j+1])if(!cur[k]&&rest.length)cur[k]=rest.shift();}
    for(let k=0;k<cur.length&&rest.length;k++)if(!cur[k])cur[k]=rest.shift();}
  // 아직 안 둔 다음 판: 아래 단계 승자로 채움
  const pend=slots.map(()=>[]);
  for(let c=1;c<nC;c++)slots[c].forEach((m,j)=>{if(m)return;const pa=win(slots[c-1][2*j]),pb=win(slots[c-1][2*j+1]);if(pa||pb)pend[c][j]=[pa,pb];});
  const ser0=pool[0].some(m=>m.gs.length>1);const U=ser0?78:60,CH=42,CW=176,GX=34,TOP=0;const H=slots[0].length*U;
  const X=c=>c*(CW+GX),Y=(c,j)=>(j+.5)*Math.pow(2,c)*U;
  const lab=s=>s===2?'결승':s===4?'4강':(sl[s]||s)+'강';
  const md=d=>{const s=String(d);return +s.slice(4,6)+'.'+ +s.slice(6,8);};
  const rng=c=>{const ds=pool[c].flatMap(m=>m.gs.map(g=>g.d));if(!ds.length)return '';const a=Math.min(...ds),b=Math.max(...ds);return a===b?md(a):md(a)+'–'+md(b);};
  const row=(p,cls,sc,href)=>`<div class="fxb-p ${cls}" ${p?`data-k="${esc(p)}"`:''}><span class="nm">${p?pf(p):'<span class="tbd">미정</span>'}</span>${href?`<a class="sc" href="${href}" title="대국 보기">${sc}</a>`:`<span class="sc">${sc}</span>`}</div>`;
  const card=(c,j)=>{const m=slots[c][j],top=Y(c,j)-CH/2,left=X(c);
    if(m){const w=win(m),ser=m.gs.length>1,last=m.gs[m.gs.length-1];const sc=p=>ser?(p===m.a?m.wa:m.wb):(w===p?'승':w?'패':'–');
      const hi=Math.max(m.wa,m.wb),lo=Math.min(m.wa,m.wb),bo=hi*2-1;
      const tip=ser?m.gs.slice().sort((x,y)=>x.d-y.d).map((g,i)=>`제${i+1}국 ${md(g.d)} ${nameOf(g.wk)} 승`).join('\n'):dstr(m.gs[0].d);
      const sl=ser?`<div class="fxb-sl ${c===nC-1?'fin':''}" style="left:${left}px;top:${top-(c===nC-1?22:16)}px;width:${CW}px"><span>${bo>1?bo+'번기':''}</span><b>${w?`<i>${esc(nameOf(w))}</i> `:''}${hi} : ${lo}</b></div>`:'';
      return sl+`<div class="fxb-m${m.gs.some(g=>g.x)?' cx':''}" style="left:${left}px;top:${top}px" title="${esc(tip)}${m.gs.some(g=>g.x)?'\n중국바둑협회 기록으로 채운 칸':''}">${[m.a,m.b].map(p=>row(p,w===p?'w':w?'l':'',sc(p),(()=>{const gg=ser?m.gs.find(g=>g.wk===p||g.lk===p):last;return gg.i!=null?'#/games/g/'+gg.i:null;})())).join('')}</div>`;}
    const pd=pend[c][j];if(pd)return `<div class="fxb-m pend" style="left:${left}px;top:${top}px">${row(pd[0],'','')}${row(pd[1],'','')}</div>`;
    return '';};
  const has=(c,j)=>!!(slots[c][j]||pend[c][j]);
  let path='';for(let c=1;c<nC;c++)slots[c].forEach((_,j)=>{if(!has(c,j))return;const py=Y(c,j),px=X(c),mx=px-GX/2;[2*j,2*j+1].forEach(k=>{if(!has(c-1,k))return;const cy=Y(c-1,k),cx=X(c-1)+CW;const on=slots[c-1][k]&&win(slots[c-1][k]);path+=`<path class="${on?'on':''}" d="M${cx} ${cy}H${mx}V${py}H${px}"/>`;});});
  const fm=slots[nC-1][0],ch=E.fin?win(fm):null,ru=ch?(ch===fm.a?fm.b:fm.a):null;
  const W=X(nC-1)+CW+4;
  const loser=m=>{const w=win(m);return m&&w?(w===m.a?m.b:m.a):null;};const semi=nC>=2?slots[nC-2].map(loser).filter(Boolean):[];
  const pod=ch?`<div class="fxb-pod"><div class="p1"><span class="t">🏆 우승</span>${pf(ch)}${fm.gs.length>1?`<b class="sc">${Math.max(fm.wa,fm.wb)} : ${Math.min(fm.wa,fm.wb)}</b>`:''}</div><div class="p2"><span class="t">준우승</span>${pf(ru)}</div>${semi.length?`<div class="p3"><span class="t">4강</span>${semi.map(k=>pf(k)).join('')}</div>`:''}</div>`:`<div class="fxb-pod"><div class="p1"><span class="t">우승</span><span class="muted">결승 전</span></div><div class="p2"><a class="pl small" href="#/tournaments/sim">우승 확률 계산기 ›</a></div></div>`;

  const n0=pool.reduce((s,p)=>s+p.length,0);
  document.getElementById('bb').innerHTML=`<div class="fxb-top"><div><div class="fxb-ed">${esc(E.ed)} ${esc(G[E.g])}</div><div class="muted small">${dstr(E.gs.reduce((a,x)=>Math.min(a,x[0].d),1e9)).replace(/-/g,'.')} – ${dstr(E.d1).replace(/-/g,'.')} · 맞대결 ${n0}번${E.x?` · <span class="fxb-cxl">중국바둑협회 기록으로 ${E.x}국 채움</span>`:''} ${E.fin?'':'· <b>진행 중</b>'}</div></div></div>${pod}
  <div class="fxb-wrap"><div class="fxb-hd" style="width:${W}px">${sizes.map((s,c)=>`<div style="left:${X(c)}px;width:${CW}px"><b>${lab(s)}</b><span>${rng(c)}</span></div>`).join('')}</div>
  <div class="fxb" id="fxb" style="width:${W}px;height:${H}px"><svg class="fxb-ln" width="${W}" height="${H}">${path}</svg>${slots.map((col,c)=>col.map((_,j)=>card(c,j)).join('')).join('')}</div></div>
  <div class="note">대회명의 단계 표기(32강·16강…)로 묶은 대진입니다. 예선·조별리그·패자부활처럼 표기가 다른 대국은 빠지고, 시드로 다음 단계부터 나온 기사는 앞 단계 칸이 비어 보입니다. 번기는 한 칸에 승수로 적었고, 점선 칸은 아직 두지 않은 다음 판입니다.</div>`;
  const bx=document.getElementById('fxb');let hk=null;
  bx.addEventListener('mouseover',e=>{const r=e.target.closest('[data-k]');const k=r?r.dataset.k:null;if(k===hk)return;hk=k;bx.querySelectorAll('.hl').forEach(x=>x.classList.remove('hl'));bx.classList.toggle('hlon',!!k);if(k)bx.querySelectorAll(`[data-k="${CSS.escape(k)}"]`).forEach(x=>x.classList.add('hl'));});
  bx.addEventListener('mouseleave',()=>{hk=null;bx.classList.remove('hlon');bx.querySelectorAll('.hl').forEach(x=>x.classList.remove('hl'));});
}
function fxTourTabs(gid,tab){
  const hasB=fxBrackets().some(o=>o.g===gid);if(!hasB)return '';
  return `<nav class="tabs"><a href="#/tournaments/${gid}" class="${tab?'':'on'}">개요</a><a href="#/tournaments/${gid}/bracket" class="${tab==='bracket'?'on':''}">대진표 <span class="muted small">${fxBrackets().filter(o=>o.g===gid).length}회차</span></a></nav>`;
}
/* ---------- 여자바둑리그 팀 순위·팀 페이지 · 한국바둑리그 선수 선발 현황 ---------- */
const WLG=X.WLG||{};
function fxWlStand(S){
  const T={};const add=c=>T[c]||(T[c]={c,n:0,w:0,l:0,gw:0,gl:0,last:[]});
  S.L.forEach(m=>{const a=add(m[2]),b=add(m[3]);if(m[4]+m[5]===0)return;a.n++;b.n++;a.gw+=m[4];a.gl+=m[5];b.gw+=m[5];b.gl+=m[4];if(m[4]>m[5]){a.w++;b.l++;a.last.push('W');b.last.push('L');}else{b.w++;a.l++;a.last.push('L');b.last.push('W');}});
  return Object.values(T).sort((x,y)=>y.w-x.w||(y.gw-y.gl)-(x.gw-x.gl)||y.gw-x.gw);
}
function fxWlPost(S){
  const R=new Map();S.P.slice().sort((a,b)=>a[1]-b[1]).forEach(m=>{if(m[4]+m[5]===0)return;const id=m[0]+'|'+[m[2],m[3]].sort().join('-');if(!R.has(id))R.set(id,{r:m[0],a:m[2],b:m[3],wa:0,wb:0,ms:[]});const o=R.get(id);const [sa,sb]=o.a===m[2]?[m[4],m[5]]:[m[5],m[4]];o.ms.push([m[1],sa,sb,m]);if(sa>sb)o.wa++;else o.wb++;});
  const ord=['와일드카드','준플레이오프','플레이오프','챔피언결정전'];return [...R.values()].sort((x,y)=>ord.indexOf(x.r)-ord.indexOf(y.r));
}
function fxWlChamp(S){const f=fxWlPost(S).filter(o=>o.r==='챔피언결정전').pop();if(!f||f.wa===f.wb)return null;return f.wa>f.wb?[f.a,f.b]:[f.b,f.a];}
function pWLeague(q){
  const W=WLG.w;
  if(!W||!W.s||!Object.keys(W.s).length){app.innerHTML=crumb([['홈','#/'],['대회','#/tournaments'],['여자바둑리그']])+'<h1 class="pt">여자바둑리그</h1><div class="empty">여자바둑리그 자료가 아직 없습니다. 35_바둑 폴더의 바둑리그_받기.bat 을 실행하세요.</div>';return;}
  const ys=Object.keys(W.s).sort().reverse();const y=ys.includes(q.y)?q.y:ys[0];const S=W.s[y];const tn=c=>(S.t[c]||['?'])[0];
  const st=fxWlStand(S),po=fxWlPost(S),ch=fxWlChamp(S);
  const P={};const addP=(k,c,win,post)=>{const o=P[k]||(P[k]={k,c,w:0,l:0,pw:0,pl:0});if(post){win?o.pw++:o.pl++;}else{win?o.w++:o.l++;}};
  S.L.forEach(m=>m[6].forEach(g=>{if(!g[2])return;addP(g[0],m[2],g[2]===1,0);addP(g[1],m[3],g[2]===2,0);}));
  S.P.forEach(m=>m[6].forEach(g=>{if(!g[2])return;addP(g[0],m[2],g[2]===1,1);addP(g[1],m[3],g[2]===2,1);}));
  const PL=Object.values(P).sort((a,b)=>b.w-a.w||a.l-b.l);
  const team=c=>{const t=S.t[c]||['?','',[]];const mem=PL.filter(p=>p.c===c);const s=st.find(x=>x.c===c);return `<div class="fxw-team" id="wt-${c}"><div class="fxw-th"><b>${esc(t[0])}</b>${ch&&ch[0]===c?' <span class="fx-tag">🏆 우승</span>':ch&&ch[1]===c?' <span class="fx-tag">준우승</span>':''}<span class="muted small">${s?`정규 ${st.indexOf(s)+1}위 · ${s.w}승 ${s.l}패`:''}${t[1]?` · 감독 ${esc(t[1])}`:''}</span></div><ul>${mem.map(p=>`<li>${pf(p.k)}<span class="n">${p.w}승 ${p.l}패${p.pw+p.pl?` <em>PS ${p.pw}-${p.pl}</em>`:''}</span></li>`).join('')}</ul></div>`;};
  const mrow=m=>`<div class="fxw-m"><span class="d">${dstr(m[1]).slice(5).replace('-','.')}</span><a href="#wt-${m[2]}" class="${m[4]>m[5]?'w':''}">${esc(tn(m[2]))}</a><b>${m[4]} : ${m[5]}</b><a href="#wt-${m[3]}" class="${m[5]>m[4]?'w':''}">${esc(tn(m[3]))}</a><details><summary>대국</summary>${m[6].map(g=>`<div>${g[2]===1?'<b>':''}${plink(g[0])}${g[2]===1?'</b>':''} <span class="muted">vs</span> ${g[2]===2?'<b>':''}${plink(g[1])}${g[2]===2?'</b>':''}</div>`).join('')}</details></div>`;
  const rounds=new Map();S.L.forEach(m=>{if(!rounds.has(m[0]))rounds.set(m[0],[]);rounds.get(m[0]).push(m);});
  // 역대 우승
  const hist=ys.map(yy=>{const s=W.s[yy];const a=fxWlStand(s)[0],c=fxWlChamp(s);const pl={};s.L.forEach(m=>m[6].forEach(g=>{if(g[2]){const k=g[2]===1?g[0]:g[1];pl[k]=(pl[k]||0)+1;}}));const top=Object.entries(pl).sort((x,z)=>z[1]-x[1])[0];return [yy,a?s.t[a.c][0]:'',c?s.t[c[0]][0]:'',c?s.t[c[1]][0]:'',top];});
  app.innerHTML=crumb([['홈','#/'],['대회','#/tournaments'],['여자바둑리그']])+`<h1 class="pt">${y} 여자바둑리그</h1>
  <p class="lede">한국여자바둑리그 공식 사이트(w.baduk.or.kr)의 경기 결과·팀 명단으로 만든 팀 순위와 팀별 성적입니다.${ch?` 이 시즌 우승은 <b>${esc(tn(ch[0]))}</b>입니다.`:''}</p>
  <div class="fbar">${fxSel('wy','시즌',ys.map(v=>[v,v+'시즌']),y)}</div>
  ${fxPanel('정규리그 팀 순위','팀 승수 → 개인 승수 득실 순',`<div class="tw"><table><thead><tr><th class="c">순위</th><th>팀</th><th class="r">경기</th><th class="r">승</th><th class="r">패</th><th class="r">개인 승</th><th class="r">개인 패</th><th class="r">득실</th><th>최근 5경기</th></tr></thead><tbody>${st.map((s,i)=>`<tr><td class="n c">${i+1}</td><td><a class="pl" href="#wt-${s.c}">${esc(tn(s.c))}</a>${ch&&ch[0]===s.c?' 🏆':''}</td><td class="n r">${s.n}</td><td class="n r"><b>${s.w}</b></td><td class="n r">${s.l}</td><td class="n r">${s.gw}</td><td class="n r">${s.gl}</td><td class="n r">${s.gw-s.gl>0?'+':''}${s.gw-s.gl}</td><td><span class="fx-seq">${s.last.slice(-5).map(x=>`<i class="${x==='W'?'w':'l'}">${x==='W'?'승':'패'}</i>`).join('')}</span></td></tr>`).join('')}</tbody></table></div>`)}
  ${po.length?fxPanel('포스트시즌','',po.map(o=>`<div class="fxw-po"><b>${esc(o.r)}</b> ${esc(tn(o.a))} <b>${o.wa} : ${o.wb}</b> ${esc(tn(o.b))} <span class="muted small">${o.ms.map(x=>x[1]+':'+x[2]).join(', ')}</span></div>`).join('')):''}
  ${fxPanel('팀별 선수 성적','PS = 포스트시즌',`<div class="fxw-teams">${st.map(s=>team(s.c)).join('')}</div>`)}
  <div class="g2">${fxPanel('개인 다승','정규리그',`<div class="tw"><table><thead><tr><th class="c">순위</th><th>기사</th><th>팀</th><th class="r">승</th><th class="r">패</th><th class="r">승률</th></tr></thead><tbody>${PL.slice(0,15).map((p,i)=>`<tr><td class="n c">${i+1}</td><td>${pf(p.k)}</td><td class="small">${esc(tn(p.c))}</td><td class="n r"><b>${p.w}</b></td><td class="n r">${p.l}</td><td class="n r">${pct(p.w,p.w+p.l)}</td></tr>`).join('')}</tbody></table></div>`)}
  ${fxPanel('역대 시즌','',`<div class="tw"><table><thead><tr><th>시즌</th><th>정규 1위</th><th>우승</th><th>준우승</th><th>다승</th></tr></thead><tbody>${hist.map(h=>`<tr><td><a class="pl" href="#/tournaments/wleague?y=${h[0]}">${h[0]}</a></td><td class="small">${esc(h[1])}</td><td class="small"><b>${esc(h[2]||'–')}</b></td><td class="small">${esc(h[3]||'–')}</td><td class="small">${h[4]?plink(h[4][0])+' '+h[4][1]+'승':'–'}</td></tr>`).join('')}</tbody></table></div>`)}</div>
  ${fxPanel('라운드별 결과','최신 라운드부터',[...rounds.entries()].sort((a,b)=>Math.max(...b[1].map(m=>m[1]))-Math.max(...a[1].map(m=>m[1]))).map(([r,ms])=>`<div class="fx-rd"><div class="fx-rdh"><b>${esc(r)}</b></div>${ms.map(mrow).join('')}</div>`).join(''))}
  <div class="note">순위는 팀 승수, 같으면 개인 승수 득실로 매긴 계산값이라 공식 순위(동률 처리 규정)와 다를 수 있습니다. 출처: 한국여자바둑리그 공식 사이트 · ${esc((W.fetched||'').slice(0,10))} 수집</div>`;
  document.getElementById('wy').onchange=e=>{routeGo('#/tournaments/wleague?y='+e.target.value);};
}
function fxKSelection(){
  const K=WLG.k;if(!K||!K.teams||!K.teams.length)return '';
  return fxPanel('다음 시즌 선수 선발 현황 · 한국바둑리그','공식 사이트 '+esc(K.updated||'')+' 기준',`<div class="fxw-teams">${K.teams.map(t=>`<div class="fxw-team"><div class="fxw-th"><b>${esc(t[0])}</b><span class="muted small">감독 ${esc(t[1])}</span></div><ul>${t[2].map((k,i)=>`<li><span class="muted small">${i+1}지명</span> ${k.startsWith('n:')?esc(t[4][i]):pf(k)}</li>`).join('')}${t[3]?`<li><span class="muted small">외국인</span> ${t[3].startsWith('n:')?esc(t[4][t[4].length-1]):pf(t[3])}</li>`:''}</ul></div>`).join('')}</div>`);
}
function fxWlPlayer(k){
  const W=WLG.w;if(!W||!W.s)return '';const out=[];
  Object.keys(W.s).sort().reverse().forEach(y=>{const S=W.s[y];let c=null,w=0,l=0;S.L.concat(S.P).forEach(m=>m[6].forEach(g=>{if(g[0]===k){c=m[2];g[2]===1?w++:g[2]===2&&l++;}else if(g[1]===k){c=m[3];g[2]===2?w++:g[2]===1&&l++;}}));if(c)out.push(`<a href="#/tournaments/wleague?y=${y}#wt-${c}">${y} ${esc(S.t[c][0])} <b>${w}-${l}</b></a>`);});
  return out.length?`<span><em>여자바둑리그</em> ${out.slice(0,3).join(' · ')}${out.length>3?` 외 ${out.length-3}시즌`:''}</span>`:'';
}
function fxLeagueTeam(name){
  name=name||'';
  if(/여자/.test(name)&&WLG.w)return `<div class="fxw-go"><b>팀 순위·팀 명단</b><span class="muted small">여자바둑리그 공식 사이트 자료로 팀 순위표와 팀별 선수 성적을 따로 봅니다.</span><a class="btn" href="#/tournaments/wleague">여자바둑리그 팀 순위 보기 →</a></div>`;
  if(/바둑리그/.test(name)&&!/여자/.test(name)&&WLG.k)return fxKSelection()+'<div class="note">한국바둑리그 공식 사이트는 지금 선수 선발 화면만 열려 있어 지난 시즌 팀 순위는 아직 넣지 못했습니다. 사이트가 다시 열리면 같은 방식으로 붙일 수 있습니다.</div>';
  return '<div class="note">기록에는 팀 이름이 없어 이 리그의 팀 순위는 만들 수 없습니다.</div>';
}
/* ---------- 중국 리그 — 갑조·을조·병조·여자 갑조·을조를 리그별·시즌별로 ---------- */
const CNLG={m1:'갑조리그',m2:'을조리그',m3:'병조리그',w1:'여자 갑조리그',w2:'여자 을조리그'};
const CNLZ={m1:'围甲',m2:'围乙',m3:'围丙',w1:'女子围甲',w2:'女子围乙'};
function fxCnLg(n){n=n||'';if(!/중국/.test(n))return null;const w=/여자/.test(n);if(/갑조/.test(n))return w?'w1':'m1';if(/을조/.test(n))return w?'w2':'m2';if(/병조/.test(n))return w?null:'m3';return null;}
function fxCnData(){
  if(FX.cn)return FX.cn;const C=X.CNL||{};const S={},seen=new Set();
  const sea=(k,lg,label,y)=>S[k]||(S[k]={k,lg,label,y,gs:[],d0:99999999,d1:0,nc:0,nk:0});
  const pk=(a,b)=>a<b?a+'|'+b:b+'|'+a;
  if(C.d){const ss=C.s.map(s=>sea(s[3],s[0],s[1],s[2]));
    for(let i=0;i<C.d.length;i++){const o=ss[C.si[i]],wk=C.k[C.w[i]],lk=C.k[C.l[i]];const g={d:C.d[i],wk,lk,rs:C.rs[C.r[i]],src:'c'};o.gs.push(g);o.nc++;seen.add(C.d[i]+'|'+pk(wk,lk));}}
  const ranges=Object.values(S).map(o=>{o.gs.forEach(g=>{o.d0=Math.min(o.d0,g.d);o.d1=Math.max(o.d1,g.d);});return o;});
  const dn=d=>{const s=String(d);return Date.UTC(+s.slice(0,4),+s.slice(4,6)-1,+s.slice(6,8))/864e5;};
  for(const g of GAMES){const lg=fxCnLg(G[g.g]);if(!lg)continue;if(seen.has(g.d+'|'+pk(g.wk,g.lk)))continue;
    const x=dn(g.d);let o=ranges.find(s=>s.lg===lg&&s.nc&&x>=dn(s.d0)-25&&x<=dn(s.d1)+25);
    if(!o){o=sea(lg+':'+g.y,lg,String(g.y),g.y);if(!ranges.includes(o))ranges.push(o);}
    o.gs.push({d:g.d,wk:g.wk,lk:g.lk,rs:g.rs,i:g.i,j:g.j,ps:/포스트|PO|잔류|강등|챔피언|플레이오프/.test(T[g.ti]),src:'k'});o.nk++;}
  const all=Object.values(S).filter(o=>o.gs.length);all.forEach(o=>{o.gs.sort((a,b)=>a.d-b.d);o.d0=o.gs[0].d;o.d1=o.gs[o.gs.length-1].d;});
  all.sort((a,b)=>b.d0-a.d0);
  return FX.cn={all,fetched:C.fetched||''};
}
function fxCnStand(o){const S={};o.gs.forEach(g=>{if(g.j)return;for(const k of [g.wk,g.lk]){const r=S[k]||(S[k]={k,w:0,l:0,run:0,best:0});const win=g.wk===k;win?r.w++:r.l++;if(win){r.run++;r.best=Math.max(r.best,r.run);}else r.run=0;}});return Object.values(S).sort((a,b)=>b.w-a.w||a.l-b.l);}
const fxCnCtry=k=>(PBY[k]||{}).c||'';
function pCnLeague(q){
  const D=fxCnData();const lgs=Object.keys(CNLG).filter(l=>D.all.some(o=>o.lg===l));
  const lg=lgs.includes(q.l)?q.l:lgs[0];const ss=D.all.filter(o=>o.lg===lg);const E=ss.find(o=>o.k===q.s)||ss[0];
  const go=(l,s)=>'#/tournaments/cnleague?l='+l+(s?'&s='+encodeURIComponent(s):'');
  if(!E){app.innerHTML=crumb([['홈','#/'],['대회','#/tournaments'],['중국 리그']])+'<h1 class="pt">중국 리그</h1><div class="empty">중국 리그 기록이 없습니다</div>';return;}
  const st=fxCnStand(E);const kr=st.filter(r=>fxCnCtry(r.k)==='한국');const kw=kr.reduce((a,r)=>a+r.w,0),kl=kr.reduce((a,r)=>a+r.l,0);
  const md=d=>{const s=String(d);return +s.slice(4,6)+'.'+ +s.slice(6,8);};
  const byD=new Map();E.gs.forEach(g=>{if(!byD.has(g.d))byD.set(g.d,[]);byD.get(g.d).push(g);});const days=[...byD.entries()].reverse();
  const yrs=[...new Set(ss.map(o=>o.y))];
  app.innerHTML=crumb([['홈','#/'],['대회','#/tournaments'],['중국 리그']])+`<h1 class="pt">중국 리그</h1>
  <p class="lede">중국 갑조리그(围甲)·을조·병조와 여자 갑조·을조 리그를 리그별·시즌별로 모았습니다. 중국바둑협회 대국 기록과 한국기원 기록을 합쳤습니다.</p>
  <nav class="tabs">${lgs.map(l=>`<a href="${go(l)}" class="${l===lg?'on':''}">${CNLG[l]} <span class="muted small">${D.all.filter(o=>o.lg===l).length}시즌</span></a>`).join('')}</nav>
  <div class="cnl-seasons" role="tablist" aria-label="시즌">${ss.map(o=>`<a href="${go(lg,o.k)}" class="${o===E?'on':''}" role="tab" aria-selected="${o===E}"><b>${esc(o.label)}</b><span>${o.gs.length}국</span></a>`).join('')}</div>
  <div class="fx-tiles"><div class="fx-tile"><div class="k">시즌</div><div class="v">${esc(o_label(E))}</div></div><div class="fx-tile"><div class="k">기간</div><div class="v" style="font-size:17px">${dstr(E.d0).replace(/-/g,'.')} – ${md(E.d1)}</div></div><div class="fx-tile"><div class="k">대국</div><div class="v">${fmt(E.gs.length)}</div></div><div class="fx-tile"><div class="k">출전 기사</div><div class="v">${st.length}</div></div>${kr.length?`<div class="fx-tile"><div class="k">한국 기사 ${kr.length}명</div><div class="v">${kw}승 ${kl}패</div></div>`:''}</div>
  ${kr.length?fxPanel('한국 기사 성적','',`<div class="cnl-kr">${kr.map(r=>`<div>${pf(r.k)}<b>${r.w}승 ${r.l}패</b><span class="muted small">${pct(r.w,r.w+r.l)}</span></div>`).join('')}</div>`):''}
  ${fxPanel('개인 성적','다승순 · 무효 제외',`<div class="fbar" style="border:0;padding:0;margin:0 0 8px"><div class="cnl-pills" id="cnf">${[['','전체'],['cn','중국'],['kr','한국'],['etc','그 밖의 나라']].map(([v,l],i)=>`<button data-v="${v}" class="${i?'':'on'}">${l}</button>`).join('')}</div></div><div id="cnt"></div>`)}
  ${fxPanel('날짜별 결과','최신순 · 날짜를 누르면 펼칩니다',`<div class="cnl-days">${days.slice(0,60).map(([d,gs],i)=>`<details ${i<2?'open':''}><summary><b>${dstr(d).replace(/-/g,'.')}</b><span class="muted small">${gs.length}국${gs.some(g=>g.ps)?' · 포스트시즌':''}</span></summary><ul>${gs.map(g=>`<li>${pf(g.wk)}<em>승</em><span class="vs">${pf(g.lk)}</span><span class="rs">${g.i!=null?`<a class="glink" href="#/games/g/${g.i}">${esc(g.rs||'')}</a>${GAMES[g.i]?kfBtn(GAMES[g.i]):''}`:esc(g.rs||'')}</span></li>`).join('')}</ul></details>`).join('')}${days.length>60?`<div class="muted small">앞선 ${days.length-60}일은 생략했습니다</div>`:''}</div>`)}
  ${fxPanel('역대 시즌',CNLG[lg],`<div class="tw"><table><thead><tr><th>시즌</th><th>기간</th><th class="r">대국</th><th>다승</th><th>한국 기사 최다승</th></tr></thead><tbody>${ss.map(o=>{const t=fxCnStand(o);const top=t[0];const k=t.find(r=>fxCnCtry(r.k)==='한국');return `<tr class="${o===E?'fxg-on':''}"><td><a class="pl" href="${go(lg,o.k)}">${esc(o_label(o))}</a></td><td class="d small">${dstr(o.d0).slice(0,7).replace('-','.')} – ${dstr(o.d1).slice(0,7).replace('-','.')}</td><td class="n r">${o.gs.length}</td><td class="small">${top?plink(top.k)+' '+top.w+'승':''}</td><td class="small">${k?plink(k.k)+' '+k.w+'승 '+k.l+'패':'–'}</td></tr>`;}).join('')}</tbody></table></div>`)}
  <div class="note">중국바둑협회(weiqi.org.cn) 대국 기록 ${E.nc}국과 한국기원 기록 ${E.nk}국을 합친 시즌입니다. 중국바둑협회 기록에는 외국 기사의 대국이 빠져 있어 한국기원 기록으로 채웠고, 두 기록 모두 팀 이름이 없어 팀 순위는 없습니다.${D.fetched?' 중국 기록 수집: '+esc(D.fetched.slice(0,10)):' 중국바둑협회 기록을 아직 받지 않아 한국기원 기록만 보입니다.'}</div>`;
  let flt='';const draw=()=>{const rows=st.filter(r=>{const c=fxCnCtry(r.k);return !flt||(flt==='cn'?(c==='중국'||r.k.startsWith('n:')):flt==='kr'?c==='한국':(c&&c!=='중국'&&c!=='한국'));});
    pagedTable(document.getElementById('cnt'),rows,['순위','기사','대국','승','패','승률','최다 연승'],x=>x.map(r=>`<tr><td class="n c">${st.indexOf(r)+1}</td><td>${pf(r.k)}</td><td class="n r">${r.w+r.l}</td><td class="n r"><b>${r.w}</b></td><td class="n r">${r.l}</td><td class="n r">${pct(r.w,r.w+r.l)}</td><td class="n r">${r.best}</td></tr>`).join(''),30);};
  document.querySelectorAll('#cnf button').forEach(b=>b.onclick=()=>{flt=b.dataset.v;document.querySelectorAll('#cnf button').forEach(x=>x.classList.toggle('on',x===b));draw();});draw();
  const on=app.querySelector('.cnl-seasons a.on');if(on)on.scrollIntoView({block:'nearest',inline:'center'});
}
const o_label=o=>o.lg.startsWith('w')&&/^제/.test(o.label)?o.label+' ('+o.y+')':o.label+(o.lg.startsWith('w')?'':' 시즌');
/* ---------- 데이터 수집 경로 — 어디서 무엇을 어떻게 받아 사이트를 만드는지 ---------- */
function pSources(){
  const n=x=>fmt(x||0);const fd=s=>s?esc(String(s).slice(0,10).replace(/-/g,'.')):'–';
  const S=[
    ['한국기원 기록실','baduk.or.kr','대국결과 전부(공식·비공식), 기사별 대국 목록, 통산 전적','공개 웹페이지','kba_collect.mjs · kba_byplayer.mjs · kba_recent.mjs','한국기원_기록수집.bat(전체) · 한국기원_기사별수집.bat · 최근기록_갱신.bat(최근 2주)','수시','대국·전적·우승·랭킹·시즌 — 사이트의 기본 기록',`${n(GAMES.length)}국 · ${META.kba?fd(META.kba.fetched)+' 전체 수집':''}`],
    ['한국기원 랭킹·일정','baduk.or.kr','남녀 월간 랭킹, 대국 일정(지난달~3달 뒤)','공개 웹페이지','extra_fetch.mjs','최근기록_갱신.bat','매달 · 수시','랭킹, 한국랭킹 추이 검증, 일정',''],
    ['중국바둑협회','weiqi.org.cn (wqapi.cwql.org.cn)','기사 프로필, 월간 랭킹, 중국 리그 대국(갑조 1999~·여자 갑조 2013~·을조·병조), 세계대회 대국','공개 API','cn_collect.mjs · extra_fetch.mjs · cn_league_collect.mjs','중국기사프로필_받기.bat · 최근기록_갱신.bat · 중국기록_받기.bat','매달(랭킹) · 수시','중국 기사 정보·랭킹, 중국 리그, 대진표 빈 칸',X.CNL&&X.CNL.d?`리그 ${n(X.CNL.d.length)}국 · ${fd(X.CNL.fetched)}`:''],
    ['囲碁棋譜.COM','igo-kifu.com','일본 랭킹(碁力), 일본 기전 중계 대국(최근 30일)','공개 웹페이지','extra_fetch.mjs','최근기록_갱신.bat','매달 · 수시','일본 랭킹, 일본 최근 대국',''],
    ['일본기원·관서기원','nihonkiin.or.jp · kansaikiin.jp','일본 기사 프로필(원본 HTML)','공개 웹페이지','jp_collect.mjs','일본기사프로필_받기.bat','가끔','일본 기사 정보',''],
    ['하이펑기원(海峰棋院)','대만','대만 프로기사 명단·프로필','공개 웹페이지','tw_collect.mjs','대만기사프로필_받기.bat','가끔','대만 기사 정보',''],
    ['고레이팅','goratings.org','해외 기사 대국 목록·레이팅','공개 웹페이지·JSON','gor_collect.mjs','고레이팅_수집.bat · 고레이팅_반영.bat','가끔','실력 점수(WHR) 계산에만 — 화면의 대국 기록에는 넣지 않음',''],
    ['한국여자바둑리그','w.baduk.or.kr','2015~ 시즌별 경기 결과·팀 명단','공개 웹페이지','wleague_collect.mjs','바둑리그_받기.bat','시즌 중 수시','여자바둑리그 팀 순위·팀 페이지',X.WLG&&X.WLG.w?`${Object.keys(X.WLG.w.s||{}).length}시즌 · ${fd(X.WLG.w.fetched)}`:''],
    ['한국바둑리그','kleague.baduk.or.kr','다음 시즌 선수 선발 현황','공개 웹페이지','wleague_collect.mjs','바둑리그_받기.bat','선발 기간','리그 시즌 기록의 선발 현황',X.WLG&&X.WLG.k?`${(X.WLG.k.teams||[]).length}팀`:''],
    ['바둑 뉴스',Object.values(NSRC).map(v=>v[0]).join(' · '),'바둑 뉴스 제목·링크','서버가 주기적으로 모음','—','배포.bat 이 새로고침 요청','수시','뉴스, 기사 페이지 관련 뉴스',''],
  ];
  const flow=[['① 받기','출처마다 수집 스크립트(kba\\*.mjs)가 원본을 받아 kba_data 폴더에 그대로 저장'],['② 정리·계산','pipeline\\update.py 가 대회명 정리·기사 연결·통산 검증·실력 점수 등을 계산해 base_data.json 으로 묶음'],['③ 사이트 만들기','pipeline\\rebuild_site.py 가 화면 틀(template.html)에 데이터를 넣어 site\\index.html 한 파일로 만듦'],['④ 배포','배포.bat 이 사이트 파일을 올리고 뉴스 새로고침을 요청']];
  const C=[['대회명 정리·분류','대회명에서 회차·단계를 떼어 대회를 묶고 한국기원 공식 기전 분류를 붙임'],['기사 연결','대국 기록의 이름을 기사 정보에 연결(한자·외래어 표기·별칭)'],['실력 점수(WHR)','전체 기록을 한꺼번에 놓고 계산, 고레이팅 대국으로 해외 기사 보강'],['한국랭킹 추이','한국기원 랭킹 규칙을 재현해 2000년부터 매달 계산'],['대진표','단계 표기가 없는 본선 대국의 단계를 추정하고, 빈 칸을 중국바둑협회 세계대회 기록으로 채움'],['중국 리그','중국바둑협회 기록과 한국기원 기록을 합쳐 시즌별로 묶음(같은 대국은 한 번만)']];
  app.innerHTML=crumb([['홈','#/'],['데이터 수집']])+`<h1 class="pt">데이터 수집</h1>
  <p class="lede">이 사이트의 기록을 어디서 받아 어떻게 만드는지 정리했습니다. 모든 자료는 공개된 웹페이지·공개 API에서 받으며, 원본의 대회명·승패·결과는 고치지 않고 그대로 씁니다. 계산이 들어간 값은 화면에 <span class="calc">계산값</span>으로 표시합니다.</p>
  <div class="fx-tiles"><div class="fx-tile"><div class="k">대국 기록</div><div class="v">${n(GAMES.length)}</div></div><div class="fx-tile"><div class="k">기사</div><div class="v">${n(P.length)}</div></div><div class="fx-tile"><div class="k">마지막 대국일</div><div class="v" style="font-size:18px">${dstr(LASTD).replace(/-/g,'.')}</div></div><div class="fx-tile"><div class="k">출처</div><div class="v">${S.length}곳</div></div></div>
  ${fxPanel('만드는 순서','',`<ol class="src-flow">${flow.map(([t,d])=>`<li><b>${t}</b><span>${esc(d)}</span></li>`).join('')}</ol>`)}
  ${fxPanel('출처별 수집','공개 자료만 받습니다',`<div class="tw"><table class="src-t"><thead><tr><th>출처</th><th>받는 것</th><th>방법</th><th>화면에서 쓰는 곳</th><th>현재</th></tr></thead><tbody>${S.map(r=>`<tr><td><b>${esc(r[0])}</b><div class="muted small">${esc(r[1])}</div></td><td class="small">${esc(r[2])}<div class="muted small">주기: ${esc(r[6])}</div></td><td class="small">${esc(r[3])}<div class="src-sc">${esc(r[4])}</div><div class="muted small">${esc(r[5])}</div></td><td class="small">${esc(r[7])}</td><td class="small n">${r[8]||''}</td></tr>`).join('')}</tbody></table></div>`)}
  ${fxPanel('정리·계산 단계','pipeline\\update.py',`<div class="src-calc">${C.map(([t,d])=>`<div><b>${esc(t)} <span class="calc">계산값</span></b><span>${esc(d)}</span></div>`).join('')}</div><p class="small" style="margin:12px 0 0"><a class="pl" href="#/about">계산 방법 자세히 — 자료에 대하여 ›</a></p>`)}
  ${fxPanel('갱신 순서 (관리용)','',`<ol class="src-steps"><li><b>최근기록_갱신.bat</b> — 한국기원 최근 2주 대국, 랭킹·일정, 중국·일본 랭킹을 받고 사이트를 다시 만듦</li><li>필요할 때만: <b>중국기록_받기.bat</b>(중국 리그·세계대회) · <b>바둑리그_받기.bat</b>(여자바둑리그·선발 현황) · <b>고레이팅_수집.bat</b> · 기사 프로필 받기 bat</li><li><b>배포.bat</b> — 사이트에 올림</li></ol>`)}
  <div class="note">원본 사이트의 이용 조건을 지키며, 요청 사이에 쉬는 시간을 두고 받습니다. 원본에 없는 대국은 만들어 넣지 않습니다(대진표의 '中' 표시 칸은 중국바둑협회 기록에서 가져온 실제 대국입니다).</div>`;
}
/* =============== fx 끝 =============== */
function parseHash(){const h=routeH().replace(/^#\/?/,'');const i=h.indexOf('?');const path=i<0?h:h.slice(0,i),qs=i<0?'':h.slice(i+1);return {parts:path.split('/').filter(Boolean).map(decodeURIComponent),q:Object.fromEntries(new URLSearchParams(qs))};}
let lastPath='';
function route(){
  killCharts();
  const {parts,q}=parseHash();const r=parts[0]||'home';
  if(!EXTRA_OK&&r!=='home'){app.innerHTML='<div class="bootld" role="status"><span class="bootsp"></span>기록을 불러오는 중…</div>';return;}
  let nav=r;if(r==='players'&&parts[1]==='compare')nav='compare';
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.r===nav));{const mm=document.querySelector('.gnav .more');if(mm)mm.classList.toggle('on',!!mm.querySelector('.dd a[data-r="'+nav+'"]'));}
  try{
    if(r==='home')pHome();
    else if(r==='players'){if(parts[1]==='feed')pFeed(q);else if(parts[1]==='compare')pCompare(q);else if(parts[1])pPlayer(parts[1],parts[2]||'',q);else pPlayers(q);}
    else if(r==='rankings')pRankings(parts[1],q);
    else if(r==='goratings'){routeGo('#/rankings/goratings'+(routeH().includes('?')?routeH().slice(routeH().indexOf('?')):''),1);return;}
    else if(r==='tournaments'){if(parts[1]==='cnleague')pCnLeague(q);else if(parts[1]==='wleague')pWLeague(q);else if(parts[1]==='league')pLeague(q);else if(parts[1]==='bracket')pBracket(q);else if(parts[1]==='sim')pSim(q);else if(parts[1]==='timeline')pSeasonTL(q);else if(parts[1]==='grades')pGrades();else if(parts[1]==='intl')pIntl(parts[2],q);else if(['open','women','limited','world','team','jp','cn'].includes(parts[1]))pDom(parts[1],parts[2],q);else if(parts[1]!=null)pTournament(parts[1],parts[2],q);else pTournaments(q);}
    else if(r==='seasons')pSeason(parts[1]);
    else if(r==='search'){routeGo('#/games/search'+(routeH().includes('?')?routeH().slice(routeH().indexOf('?')):''),1);return;}
    else if(r==='records'){
      // 예전 기록실(대국 목록) 주소 → 대국 › 대국 목록, 예전 역대 기록 → 기록 › 연속·최다 기록
      if(parts[1]==='history'){routeGo('#/records/streaks',1);return;}
      if(parts[1]==='games'||(!parts[1]&&['y','c','t','p'].some(k=>q[k]!=null))){routeGo('#/games/list'+(routeH().includes('?')?routeH().slice(routeH().indexOf('?')):''),1);return;}
      pRecHub(parts[1],q);}
    else if(r==='federations')pFederations();
    else if(r==='schedule'){routeGo('#/games/calendar'+(routeH().includes('?')?routeH().slice(routeH().indexOf('?')):''),1);return;}
    else if(r==='games'){if(parts[1]==='g')pGame(parts[2]);else if(parts[1]==='schedule')pUpcoming(q);else if(parts[1]==='japan')pJpGames(q);else if(parts[1]==='calendar')pSchedule(q);else if(parts[1]==='list')pGames(q);else if(parts[1]==='search')pSearch(q);else pDiary(q);}
    else if(r==='news')pNews(q);
    else if(r==='data'){routeGo('#/',1);return;}
    else if(r==='about')pAbout(parts[1]);else if(r==='sources')pSources();
    else if(r==='brand')pBrand();
    else if(r==='overview')pOverview(q);
    else pHome();
  }catch(err){console.error(err);app.innerHTML='<div class="empty" style="margin-top:24px">일시적으로 데이터를 불러오지 못했습니다. 새로고침해 주세요.</div>';}
  const path=parts.slice(0,2).join('/');
  if(!q.keep&&path!==lastPath)window.scrollTo(0,0);lastPath=path;
  document.title=(document.querySelector('h1.pt,.prof h1')?.firstChild?.textContent?.trim()||'홈')+' · 바둑DB';
}
window.addEventListener('hashchange',route);
(function(){const mb=document.querySelector('.mbar'),tt=document.getElementById('totop');
  const mark=()=>{if(!mb)return;const r=(routeH().replace(/^#\/?/,'').split(/[/?]/)[0])||'home';mb.querySelectorAll('a').forEach(a=>a.classList.toggle('on',a.dataset.r===r||(r==='compare'&&a.dataset.r==='players')));};
  window.addEventListener('hashchange',mark);mark();
  if(tt){window.addEventListener('scroll',()=>tt.classList.toggle('show',window.scrollY>600),{passive:true});tt.onclick=()=>window.scrollTo({top:0,behavior:'smooth'});}})();
/* KIFU_V1 기보 버튼 — X.KF: [대국 번호, 출처(i 囲碁棋譜.COM · f 야호 · o 사이버오로), 기보 번호, 묶음 또는 사이버오로 파일] */
let KFM=null;
const KFSRC={i:'囲碁棋譜.COM',f:'야호(foxwq)',h:'한게임 바둑',t:'타이젬',w:'101围棋网',g:'Go4Go',o:'사이버오로'};
function kfOf(i){if(!KFM){if(!X.KF)return null;KFM=new Map();for(const r of X.KF)if(!KFM.has(r[0])||r[1]!=='o')KFM.set(r[0],r);}return KFM.get(i)||null;}
function kfUrl(g,r){const q=new URLSearchParams();q.set('s',r[1]);q.set('c',r[3]);q.set('r',r[2]);
  q.set('t',T[g.ti]);q.set('e',dstr(g.d).replace(/-/g,'.')+' · '+G[g.g]);q.set('g',G[g.g]);q.set('d',dstr(g.d));
  const col=r[4]||(g.r&&g.r[0]);const bk=col===1?g.wk:col===2?g.lk:null,wk=col===1?g.lk:col===2?g.wk:null;
  if(bk){q.set('b',nameOf(bk));q.set('w',nameOf(wk));q.set('bk',bk);q.set('wk',wk);if(!g.j){q.set('bs',bk===g.wk?'승':'패');q.set('ws',wk===g.wk?'승':'패');}}
  return '/kifu.html?'+q.toString();}
/* KIFU_LAYER_V1: 기보 뷰어를 새 창 대신 화면 위 레이어(주소창 없음)로 엶 — 닫기: ×, 바깥 누르기, Esc */
let KFL=null,KFL_RET=null;
function kfClose(){if(!KFL||KFL.hidden)return;KFL.hidden=true;const f=KFL.querySelector('iframe');f.src='about:blank';document.documentElement.style.overflow='';if(KFL_RET){try{KFL_RET.focus();}catch(e){}}}
function kfLayer(h){
  if(!KFL){const st=document.createElement('style');st.textContent='.kfl{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.6);display:grid;place-items:center}.kfl[hidden]{display:none}.kfl-box{position:relative;width:min(1200px,96vw);height:min(880px,94vh);background:var(--bg,#fff);box-shadow:0 24px 70px rgba(0,0,0,.45)}.kfl iframe{display:block;width:100%;height:100%;border:0}.kfl-x{position:absolute;top:-15px;right:-15px;z-index:2;width:34px;height:34px;border-radius:50%;border:2px solid #fff;background:#111;color:#fff;font-size:20px;line-height:1;cursor:pointer;display:grid;place-items:center}.kfl-x:hover{background:#FFC72C;color:#111}@media (max-width:920px){.kfl-box{width:100vw;height:100dvh}.kfl-x{top:6px;right:6px}}';document.head.appendChild(st);
    KFL=document.createElement('div');KFL.className='kfl';KFL.hidden=true;KFL.setAttribute('role','dialog');KFL.setAttribute('aria-modal','true');KFL.setAttribute('aria-label','기보 보기');
    KFL.innerHTML='<div class="kfl-box"><button type="button" class="kfl-x" aria-label="기보 닫기" title="닫기 (Esc)">×</button><iframe title="기보 뷰어" allow="clipboard-write"></iframe></div>';
    document.body.appendChild(KFL);
    KFL.addEventListener('click',e=>{if(e.target===KFL)kfClose();});KFL.querySelector('.kfl-x').onclick=kfClose;
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&KFL&&!KFL.hidden){kfClose();e.preventDefault();}});
    window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data==='kifu-close')kfClose();});}
  const th=document.documentElement.dataset.theme||'';
  KFL.querySelector('iframe').src=h+(h.includes('?')?'&':'?')+'embed=1'+(th?'&th='+th:'');
  KFL.hidden=false;document.documentElement.style.overflow='hidden';
  setTimeout(()=>{try{KFL.querySelector('iframe').focus();}catch(e){}},50);}
function kfOpen(a){const h=a.getAttribute('href')||'';if(!h.startsWith('/kifu.html'))return true;KFL_RET=a;kfLayer(h);return false;}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a.kfb');if(!a||a.classList.contains('oro')||e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;if(kfOpen(a)===false)e.preventDefault();});
/* KIFU_ICON */const KFI='<svg class="kfi" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 2v12M10.5 2v12M2 5.5h12M2 10.5h12" stroke="currentColor" stroke-width=".8"/><circle cx="10.5" cy="5.5" r="2.2" fill="currentColor"/><circle cx="5.5" cy="10.5" r="2.1" fill="var(--card)" stroke="currentColor" stroke-width="1"/></svg>';
function kfBtn(g,big){if(!g)return '';const r=kfOf(g.i);if(!r)return '';const c='kfb'+(big?' kfg':'')+(r[1]==='o'?' oro':'');
  if(r[1]==='g')return `<a class="kfb${big?' kfg':''} oro" href="https://go4go.net/go/games/sgfview/${esc(r[2])}" target="_blank" rel="noopener" title="Go4Go에서 기보 보기 (새 창)" aria-label="Go4Go에서 기보 보기 (새 창)">${KFI}${big?'<span>Go4Go에서 기보 보기</span>':''}</a>`;
  if(r[1]==='o')return `<a class="${c}" href="https://www.cyberoro.com/gibo/gibo_view.oro?gibo=https://open.cyberoro.com/gibo/${esc(r[3])}&gibonum=${esc(r[2])}" target="_blank" rel="noopener" title="사이버오로에서 기보 보기 (새 창)" aria-label="사이버오로에서 기보 보기 (새 창)">${KFI}${big?'<span>사이버오로에서 기보 보기</span>':''}</a>`;
  return `<a class="${c}" href="${esc(kfUrl(g,r))}" target="_blank" rel="noopener" title="기보 보기" aria-label="기보 보기">${KFI}${big?'<span>기보 보기</span>':''}</a>`;}
/* 자주 안 쓰는 데이터(로더가 받음) — 도착하면 X 에 채우고 지금 화면을 다시 그림 */
let EXTRA_OK=!window.__EXTRA;
if(window.__EXTRA)window.__EXTRA.then(ex=>{for(const k in ex){const v=ex[k],o=X[k];if(o&&v&&typeof o==='object'&&typeof v==='object'&&!Array.isArray(o)&&!Array.isArray(v))Object.assign(o,v);else X[k]=v;}
  KRH=X.KRH||null;CNR=X.CNR||null;KFM=null;if(typeof FX!=='undefined'){delete FX.cn;delete FX.br;delete FX.bs;}EXTRA_OK=true;if((parseHash().parts[0]||'home')!=='home')route();})
  .catch(()=>{EXTRA_OK=true;route();});
document.getElementById('dl').textContent=`바둑DB · 기준일 ${dstr(LASTD).replace(/-/g,'.')} · 대국 ${fmt(GAMES.length)} · 기사 정보 ${fmt(P.length)} · ${YEARS[0]}년부터`;
route();
loadLiveNews();
// 관리자 IP에서 열었을 때만 푸터에 '관리자' 링크 (다른 곳에서는 /api/admin/ping 이 404)
if(location.protocol!=='file:')fetch('/api/admin/ping',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!j||!j.ok)return;const f=document.querySelector('.foot span:last-child');if(f)f.insertAdjacentHTML('beforeend',' · <a href="/admin">관리자</a>');}).catch(()=>{});
})();
