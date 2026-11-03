// 뉴스 본문 가져오기 — 사이버오로·타이젬·한게임바둑 기사 페이지에서 본문만 뽑아 문단·사진 목록으로 돌려줌
// (드로어에서 기사 내용을 바로 보여 주기 위해. 원문 링크와 출처는 화면에 항상 함께 표시)

export const ART_HOSTS = {
  'www.cyberoro.com': { s: 'oro', kr: true },
  'cyberoro.com': { s: 'oro', kr: true },
  'news.tygem.com': { s: 'tyg', kr: true },
  'baduk.hangame.com': { s: 'han', kr: false },
};

const ent = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&middot;/g, '·').replace(/&hellip;/g, '…').replace(/&lsquo;/g, '‘').replace(/&rsquo;/g, '’').replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
  .replace(/&amp;/g, '&');

// 같은 이름 태그를 짝 맞춰 닫히는 곳까지
function balanced(html, start, tag) {
  const re = new RegExp('<\\/?' + tag + '\\b', 'gi'); re.lastIndex = start; let d = 0, m;
  while ((m = re.exec(html))) { d += m[0][1] === '/' ? -1 : 1; if (d === 0) return html.slice(start, m.index); }
  return html.slice(start);
}

export function region(s, html) {
  if (s === 'oro') {
    const i = html.indexOf('<span class="news_view_bodytext">'); if (i < 0) return null;
    const rest = html.slice(i); const k = rest.search(/<\/span>\s*<\/td>/);
    return { body: k > 0 ? rest.slice(0, k) : rest.slice(0, 30000), writer: '' };
  }
  if (s === 'tyg') {
    const i = html.indexOf('<div class="sC_view">'); if (i < 0) return null;
    const w = (html.match(/<div class="sC_writer">([\s\S]*?)<\/div>/) || [])[1] || '';
    const sub = (html.match(/<p class="sC_viewsT2">([\s\S]*?)<\/p>/) || [])[1] || '';
    return { body: balanced(html, i, 'div'), writer: ent(w.replace(/<[^>]*>/g, '')).trim(), sub: ent(sub.replace(/<[^>]*>/g, '')).trim() };
  }
  if (s === 'han') {
    const i = html.indexOf('<dd class="exp line"'); if (i < 0) return null;
    const j = html.indexOf('</dd>', i);
    const w = (html.match(/<dd class="writer">\s*작성자\s*:\s*([^,<]+)/) || [])[1] || '';
    return { body: html.slice(i, j > 0 ? j : i + 30000), writer: w.trim() };
  }
  return null;
}

function absUrl(src, base) {
  src = ent(src.trim());
  try { const u = new URL(src, base); if (u.protocol === 'http:') u.protocol = 'https:'; return u.protocol === 'https:' ? u.href : ''; } catch (e) { return ''; }
}

export function toBlocks(body, base) {
  let h = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|noscript|object)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<link\b[^>]*>/gi, '');
  h = h.replace(/<img\b[^>]*?\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi, (_, a, b, c) => { const u = absUrl(a || b || c || '', base); return u ? '\n\u0001' + u + '\n' : ''; });
  h = h.replace(/<(b|strong)\b[^>]*>/gi, '\u0002').replace(/<\/(b|strong)\s*>/gi, '\u0003');
  h = h.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?(p|div|tr|li|center|table|tbody|h\d|dd|dt|ul|ol|blockquote)\b[^>]*>/gi, '\n');
  h = h.replace(/<[^>]*>/g, '');
  h = ent(h);
  const out = []; let bold = 0;
  for (const raw of h.split('\n')) {
    let txt = '', outside = false, inside = false;
    for (const ch of raw) {
      if (ch === '\u0002') { bold++; continue; }
      if (ch === '\u0003') { bold = Math.max(0, bold - 1); continue; }
      txt += ch; if (ch.trim()) { if (bold) inside = true; else outside = true; }
    }
    txt = txt.replace(/[ \t \r]+/g, ' ').trim();
    if (!txt) continue;
    if (txt[0] === '\u0001') { out.push(['img', txt.slice(1)]); continue; }
    if (/^☞/.test(txt) || /한게임바둑 무료 바둑 앱$/.test(txt)) continue;
    const last = out[out.length - 1];
    if (/^▲/.test(txt)) {
      const c = txt.replace(/^▲\s*/, '');
      if (last && last[0] === 'img' && !last[2]) last[2] = c; else out.push(['cap', c]);
      continue;
    }
    if (inside && !outside) { if (last && last[0] === 'h') last[1] += '\n' + txt; else out.push(['h', txt]); continue; }
    out.push(['p', txt]);
  }
  // 같은 사진 반복 제거
  const seen = new Set();
  return out.filter(b => b[0] !== 'img' || (!seen.has(b[1]) && seen.add(b[1]))).slice(0, 160);
}

export function extractArticle(s, html, url) {
  const r = region(s, html); if (!r) return null;
  const blocks = toBlocks(r.body, url);
  if (!blocks.some(b => b[0] === 'p')) return null;
  return { s, blocks, writer: r.writer || '', sub: r.sub || '' };
}
