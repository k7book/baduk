// 바둑DB — 정적 사이트 + 뉴스 수집 워커
// 하루 10번(한국시간 07~01시, 2시간 간격) cron으로 사이버오로·타이젬·한게임바둑·구글 뉴스를 모아 KV에 저장하고 /api/news 로 제공합니다.
import { CP949 } from './cp949.js';
import { NAMES } from './names.js';
import SEED from './news_seed.json';
import { ART_HOSTS, extractArticle } from './article.js';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const KEEP_DAYS = 120, KEEP_MAX = 900, HAN_VIEW_MAX = 12;

/* ---------- decoding ---------- */
function decodeKr(buf) {
  try { return new TextDecoder('euc-kr').decode(buf); } catch (e) { /* fall back */ }
  const b = new Uint8Array(buf); let out = '', run = [];
  for (let i = 0; i < b.length; i++) {
    const c = b[i];
    if (c < 0x80) { out += String.fromCharCode(c); continue; }
    const t = b[i + 1];
    if (c >= 0x81 && c <= 0xFE && t >= 0x41 && t <= 0xFE) { out += CP949[(c - 0x81) * 190 + (t - 0x41)]; i++; }
    else out += '�';
  }
  return out;
}
const ent = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const strip = s => ent(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const ymd = (y, m, d) => y + String(m).padStart(2, '0') + String(d).padStart(2, '0');

async function get(url, kr) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' }, cf: { cacheTtl: 0 } });
  if (!r.ok) throw new Error(new URL(url).hostname + ' HTTP ' + r.status);
  return kr ? decodeKr(await r.arrayBuffer()) : await r.text();
}

/* ---------- parsers (각 사이트 목록 페이지) ---------- */
export function parseOro(html) {
  const out = [];
  const re = /<a href="\/news\/N_news_view\.oro\?[^"]*?num=(\d+)[^"]*" class="news_title">([\s\S]*?)<\/a>([\s\S]*?)<\/td>/g;
  let m;
  while ((m = re.exec(html))) {
    const [, id, t, rest] = m;
    const before = html.slice(Math.max(0, m.index - 700), m.index);
    const imgs = [...before.matchAll(/<img src=['"]([^'"]+)['"]/g)];
    const img = imgs.length ? imgs[imgs.length - 1][1] : '';
    const sm = (rest.match(/class="news_con">([\s\S]*?)<\/a>/) || [])[1] || '';
    const dm = rest.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
    if (!dm) continue;
    const big = img.includes('_main.') ? img.replace('_main.', '.') : img;
    out.push(['oro', ymd(dm[1], dm[2], dm[3]), strip(t), strip(sm).slice(0, 110), 'https://www.cyberoro.com/news/N_news_view.oro?div_no=A1&num=' + id, big, null, big !== img ? img : '']);
  }
  return out;
}
export function parseTyg(html) {
  const out = [], seen = new Set();
  const re = /<li class="tyT_txt1"><a href="view\.asp\?seq=(\d+)[^"]*">([\s\S]*?)<\/a><\/li>([\s\S]*?)<\/ul>/g;
  let m;
  while ((m = re.exec(html))) {
    const [, id, t, rest] = m; if (seen.has(id)) continue; seen.add(id);
    const before = html.slice(Math.max(0, m.index - 600), m.index);
    const imgs = [...before.matchAll(/<img src="([^"]+)"/g)];
    const sm = (rest.match(/tyT_stxt1[^>]*><a [^>]*>([\s\S]*?)<\/a>/) || [])[1] || '';
    const dm = rest.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!dm) continue;
    out.push(['tyg', dm[1] + dm[2] + dm[3], strip(t), strip(sm).slice(0, 110), 'https://news.tygem.com/news/tnews/view.asp?seq=' + id, imgs.length ? imgs[imgs.length - 1][1] : '', null, '']);
  }
  return out;
}
export function parseHan(html) {
  const out = [], seen = new Set();
  const re = /<dt>\s*<a href="javascript:readnews\('(\d+)'\);">([\s\S]*?)<\/a>([\s\S]*?)<\/dl>/g;
  let m;
  while ((m = re.exec(html))) {
    const [, id, t, rest] = m; if (seen.has(id)) continue; seen.add(id);
    const before = html.slice(Math.max(0, m.index - 900), m.index);
    const imgs = [...before.matchAll(/class="thumb" src="([^"]+)"/g)];
    const dm = rest.match(/(\d{4})-(\d{2})-(\d{2})/);
    const sm = [...rest.matchAll(/<dd>\s*<a [^>]*>([\s\S]*?)<\/a>/g)].map(x => strip(x[1])).join(' ');
    if (!dm) continue;
    const thumb = imgs.length ? imgs[imgs.length - 1][1].trim().replace(/^http:/, 'https:') : '';
    out.push(['han', dm[1] + dm[2] + dm[3], strip(t), sm.slice(0, 100), `https://baduk.hangame.com/news.nhn?gseq=${id}&m=view`, thumb, null, '', id]);
  }
  return out;
}
export function hanBigImage(html) {
  const m = [...html.matchAll(/src=["']?((?:https?:)?\/\/[^"'\s>]*\/upload\/baduk\/\d{4}\/news\/[^"'\s>]+\.(?:jpe?g|png|gif))/gi)].map(x => x[1]).filter(u => !/sum\d*\.gif$/i.test(u));
  return m.length ? m[0].replace(/^(https?:)?\/\//, 'https://') : '';
}
export function parseGoogle(xml) {
  const out = [];
  for (const s of xml.split('<item>').slice(1)) {
    const g = tag => { const m = s.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>')); return m ? ent(m[1].replace(/<!\[CDATA\[|\]\]>/g, '')) : ''; };
    const src = g('source'); let t = g('title');
    if (src && t.endsWith(' - ' + src)) t = t.slice(0, -(src.length + 3));
    t = t.replace(/\s+-\s+[^-]{2,12}$/, '').trim();
    const d = new Date(g('pubDate')); if (isNaN(d)) continue;
    const k = new Date(d.getTime() + 9 * 3600e3);
    out.push(['ggl', ymd(k.getUTCFullYear(), k.getUTCMonth() + 1, k.getUTCDate()), t, src, g('link'), '', null, '']);
  }
  return out;
}

// Bing 뉴스 RSS (구글이 Cloudflare 서버 요청을 막을 때 대신 사용)
export function parseBing(xml) {
  const out = [];
  for (const s of xml.split('<item>').slice(1)) {
    const g = tag => { const m = s.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i')); return m ? ent(m[1].replace(/<!\[CDATA\[|\]\]>/g, '')).trim() : ''; };
    let link = g('link'); const u = link.match(/[?&]url=([^&]+)/i);
    if (u) { try { link = decodeURIComponent(u[1]); } catch (e) { /* keep */ } }
    const t = strip(g('title')); const src = g('News:Source');
    const d = new Date(g('pubDate')); if (isNaN(d) || !t || !link) continue;
    const k = new Date(d.getTime() + 9 * 3600e3);
    out.push(['ggl', ymd(k.getUTCFullYear(), k.getUTCMonth() + 1, k.getUTCDate()), t, src, link, '', null, '']);
  }
  return out;
}
// Daum 뉴스 검색(최신순) — 언론사 기사를 가장 빨리 반영. 링크(v.daum.net/v/YYYYMMDD...)에 날짜가 들어 있음
export function parseDaum(html, now = Date.now()) {
  const out = [];
  for (const li of html.split('<li data-docid=').slice(1)) {
    const m = li.match(/<div class="item-title">[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/); if (!m) continue;
    const link = ent(m[1]).replace(/^http:/, 'https:'), t = strip(m[2].replace(/<\/?b>/gi, ''));
    const src = strip((li.match(/class="tit_item"[^>]*title="([^"]*)"/) || [])[1] || '');
    let d = (link.match(/\/v\/(20\d{6})/) || [])[1];
    if (!d) {
      const w = strip((li.match(/class="gem-subinfo">([\s\S]*?)<\/span>\s*<\/span>/) || [])[1] || '');
      const a = w.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/), r = w.match(/(\d+)\s*(분|시간|일)\s*전/);
      if (a) d = ymd(a[1], a[2], a[3]);
      else if (r) { const k = new Date(now - (+r[1]) * ({ '분': 6e4, '시간': 36e5, '일': 864e5 })[r[2]] + 9 * 36e5); d = ymd(k.getUTCFullYear(), k.getUTCMonth() + 1, k.getUTCDate()); }
    }
    if (!d || !t) continue;
    out.push(['ggl', d, t, src, link, '', null, '']);
  }
  return out;
}

async function webNews(res) {
  // 언론 뉴스: Daum(최신순 2쪽) · 구글 뉴스(최근 7일) · Bing 뉴스를 모두 받아 합침 (같은 기사는 merge 에서 걸러짐)
  const src = [
    ['daum', async () => { const q = 'https://search.daum.net/search?w=news&q=%EB%B0%94%EB%91%91&sort=recency';
      const [a, b] = await Promise.all([get(q), get(q + '&p=2').catch(() => '')]); return parseDaum(a).concat(b ? parseDaum(b) : []); }],
    ['google', async () => parseGoogle(await get('https://news.google.com/rss/search?q=%EB%B0%94%EB%91%91+when:7d&hl=ko&gl=KR&ceid=KR:ko'))],
    ['bing', async () => parseBing(await get('https://www.bing.com/news/search?q=%EB%B0%94%EB%91%91&format=rss&setlang=ko-KR&cc=KR&qft=sortbydate%3d%221%22'))],
  ];
  const got = await Promise.all(src.map(([k, f]) => f().then(v => { res.ok.push(k + ':' + v.length); return v; }, e => { res.fail.push(k + ':' + String(e.message || e).slice(0, 60)); return []; })));
  const all = got.flat();
  if (!all.length) throw new Error('언론 뉴스 0건');
  return all;
}

/* ---------- 기사 이름 연결 ---------- */
const PART = '은는이가을를의와과도에께만랑';
const isH = c => c >= '가' && c <= '힣';
export function tagNames(text) {
  const out = [];
  for (let i = 0; i < text.length; i++) {
    if (!isH(text[i]) || (i > 0 && isH(text[i - 1]))) continue;
    for (let L = 5; L >= 2; L--) {
      const nm = text.substr(i, L);
      if (nm.length < L || !NAMES[nm]) continue;
      const nx = text[i + L] || '', nx2 = text[i + L + 1] || ' ';
      if (L === 2 && isH(nx) && (!PART.includes(nx) || (isH(nx2) && !'은는이가을를의'.includes(nx)))) continue;
      const k = NAMES[nm]; if (!out.includes(k)) out.push(k);
      i += L - 1; break;
    }
  }
  return out;
}
const bigrams = t => { const x = t.replace(/[^가-힣A-Za-z0-9]/g, ''); const s = new Set(); for (let i = 0; i < x.length - 1; i++) s.add(x.slice(i, i + 2)); return s; };
const jac = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n / Math.max(1, a.size + b.size - n); };

/* ---------- merge ---------- */
const SRC_ORD = { tyg: 0, oro: 1, han: 2, ggl: 3 };
// 기사 주소의 글 번호: 타이젬 seq, 사이버오로 num, 한게임 gseq, 다음 v/YYYYMMDDHHMM…
export function artNo(x) {
  const u = x[4] || '';
  const m = u.match(/[?&](?:seq|num|gseq)=(\d+)/) || u.match(/v\.daum\.net\/v\/(\d{12})/);
  return m ? +m[1] : 0;
}
export function merge(old, fresh, today, seen = '') {
  const byU = new Map(old.map(x => [x[4], x]));
  const added = [];
  const gB = old.filter(x => x[0] === 'ggl' && +x[1] >= +today - 7).map(x => [+x[1], bigrams(x[2])]);
  for (const x of fresh) {
    if (byU.has(x[4])) { const o = byU.get(x[4]); if (!o[5] && x[5]) o[5] = x[5]; continue; }
    if (x[0] === 'ggl') {
      if (['사이버오로', '타이젬바둑'].includes(x[3]) || ['한국기원', '바둑뉴스 보도자료'].includes(x[2])) continue;
      if (!/바둑|기원|기사|\d단|알파고|기전|국수|명인/.test(x[2]) && !tagNames(x[2]).length) continue;
      if (/바둑이|토토|슬롯|카지노|스캐터|심벌|베팅|배팅|무료바둑게임|피망바둑|도움말|다운로드|메뉴 표현|조작은|게임 선택|게임에 들어가기/.test(x[2])) continue;
      const b = bigrams(x[2]);
      if (gB.some(([d, o]) => Math.abs(d - +x[1]) <= 3 && jac(b, o) >= 0.3)) continue;
      gB.push([+x[1], b]);
    }
    x[6] = tagNames(x[2] + ' ' + (x[0] === 'ggl' ? '' : x[3]));
    x[8] = seen;   // 처음 모은 시각(한국시간 YYYYMMDDHHMM) — 같은 날 기사 순서용
    byU.set(x[4], x); added.push(x);
  }
  const cut = Number(new Date(Date.parse(today.slice(0, 4) + '-' + today.slice(4, 6) + '-' + today.slice(6)) - KEEP_DAYS * 864e5).toISOString().slice(0, 10).replace(/-/g, ''));
  const all = [...byU.values()].filter(x => +x[1] >= cut).map(x => x.slice(0, 9));
  // 최신순: 날짜 → 처음 모은 시각 → 사이트 → 각 사이트의 글 번호(클수록 최신)
  all.sort((a, b) => (+b[1] - +a[1]) || ((+b[8] || 0) - (+a[8] || 0)) || ((SRC_ORD[a[0]] ?? 9) - (SRC_ORD[b[0]] ?? 9)) || (artNo(b) - artNo(a)));
  return { list: all.slice(0, KEEP_MAX), added };
}

/* ---------- refresh ---------- */
async function refresh(env) {
  const t0 = Date.now();
  const cur = (await env.NEWS_KV.get('news', 'json')) || SEED;
  const curStr = JSON.stringify(cur);
  const res = { ok: [], fail: [] };
  const jobs = [
    ['oro', () => get('https://www.cyberoro.com/news/?cmt_n=0&div_no=A1&pageNo=1&blockNo=1', true).then(parseOro)],
    ['tyg', () => get('https://news.tygem.com/news/tnews/?pagec=1', true).then(parseTyg)],
    ['han', () => get('https://baduk.hangame.com/news.nhn?category=all&page=1').then(parseHan)],
    ['ggl', () => webNews(res)],
  ];
  const got = await Promise.all(jobs.map(([k, f]) => f().then(v => { res.ok.push(k + ':' + v.length); return v; }, e => { res.fail.push(k + ':' + String(e.message || e).slice(0, 80)); return []; })));
  let fresh = got.flat();
  // 한게임: 새 기사만 본문에서 큰 사진 찾기
  const known = new Set(cur.map(x => x[4]));
  const newHan = fresh.filter(x => x[0] === 'han' && !known.has(x[4])).slice(0, HAN_VIEW_MAX);
  await Promise.all(newHan.map(x => get(`https://baduk.hangame.com/news.nhn?gseq=${x[8]}&m=view`).then(h => { const b = hanBigImage(h); if (b) { x[7] = x[5]; x[5] = b; } }, () => {})));
  const today = ymd(...(d => [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()])(new Date(Date.now() + 9 * 3600e3)));
  const k9 = new Date(Date.now() + 9 * 3600e3), seen = k9.toISOString().slice(0, 16).replace(/[-T:]/g, '');
  const { list, added } = merge(cur, fresh, today, seen);
  const prev = JSON.parse((await env.NEWS_KV.get('meta')) || 'null');
  const now = new Date().toISOString();
  const meta = { updated: res.ok.length ? now : (prev && prev.updated) || null, tried: now, added: added.length, total: list.length, ...res, ms: Date.now() - t0 };
  // 바뀐 것이 있을 때만 저장 (KV 쓰기 횟수 절약)
  const next = JSON.stringify(list);
  if (res.ok.length && next !== curStr) await env.NEWS_KV.put('news', next);
  await env.NEWS_KV.put('meta', JSON.stringify(meta));
  return meta;
}

/* ---------- 기사 본문 (뉴스 드로어용) ---------- */
// /api/news/article?u=<기사 주소> → 사이버오로·타이젬·한게임바둑 기사 본문을 문단·사진으로. 하루 동안 캐시.
const ART_PATH = { oro: /^\/news\/N_news_view\.oro$/, tyg: /^\/news\/tnews\/view(page)?\.asp$/, han: /^\/news\.nhn$/ };
async function article(u, ctx) {
  let t; try { t = new URL(u.searchParams.get('u') || ''); } catch (e) { return J({ ok: false, error: '주소가 올바르지 않음' }, 400); }
  const h = ART_HOSTS[t.hostname];
  if (!h || !/^https?:$/.test(t.protocol) || !ART_PATH[h.s].test(t.pathname)) return J({ ok: false, error: '본문을 보여 줄 수 없는 사이트' }, 400);
  t.protocol = 'https:';
  const key = new Request(u.origin + '/api/news/article?u=' + encodeURIComponent(t.href));
  const cache = caches.default;
  const hit = await cache.match(key); if (hit) return hit;
  let body, st = 200;
  try {
    const a = extractArticle(h.s, await get(t.href, h.kr), t.href);
    if (a) body = { ok: true, ...a }; else { body = { ok: false, error: '본문을 찾지 못함' }; st = 404; }
  } catch (e) { body = { ok: false, error: String(e.message || e).slice(0, 80) }; st = 502; }
  const res = J(body, st, { 'cache-control': 'public, max-age=' + (st === 200 ? 86400 : 300) });
  if (st === 200) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}

const J = (o, s = 200, extra = {}) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', ...extra } });

export default {
  async fetch(req, env, ctx) {
    const u = new URL(req.url);
    if (u.pathname === '/api/news') {
      const [list, meta] = await Promise.all([env.NEWS_KV.get('news'), env.NEWS_KV.get('meta')]);
      const body = '{"meta":' + (meta || 'null') + ',"items":' + (list || JSON.stringify(SEED)) + '}';
      return new Response(body, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' } });
    }
    if (u.pathname === '/api/news/article') return article(u, ctx);
    if (u.pathname === '/api/news/status') return J(JSON.parse((await env.NEWS_KV.get('meta')) || 'null'));
    if (u.pathname === '/api/news/refresh') {
      // 수동 갱신(첫 배포 확인용). 너무 잦은 호출은 막습니다.
      const meta = JSON.parse((await env.NEWS_KV.get('meta')) || 'null');
      if (meta && Date.now() - Date.parse(meta.tried || meta.updated) < 5 * 60e3) return J({ skipped: '최근 5분 안에 갱신 시도함', meta });
      return J(await refresh(env));
    }
    return env.ASSETS.fetch(req);
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refresh(env));
  },
};
