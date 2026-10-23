// 뉴스 저장용 Cloudflare KV(baduk-news)를 처음 한 번 만들고, 그 ID를 wrangler.jsonc 에 적어 넣습니다.
// 이미 ID가 들어가 있으면 아무것도 하지 않습니다.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const CFG = 'wrangler.jsonc', TITLE = 'baduk-news';
let cfg = readFileSync(CFG, 'utf8');
if (!cfg.includes('__KV_ID__')) { console.log('  KV 설정 확인됨'); process.exit(0); }

const run = cmd => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: true });
const list = () => {
  const out = run('npx --yes wrangler@4 kv namespace list');
  const a = out.indexOf('['), b = out.lastIndexOf(']');
  return JSON.parse(out.slice(a, b + 1));
};
try {
  let ns = list().find(n => n.title === TITLE || n.title.endsWith('-' + TITLE));
  if (!ns) {
    console.log('  뉴스 저장소(KV) 새로 만드는 중...');
    run('npx --yes wrangler@4 kv namespace create ' + TITLE);
    ns = list().find(n => n.title === TITLE || n.title.endsWith('-' + TITLE));
  }
  if (!ns) throw new Error('KV 목록에서 ' + TITLE + ' 를 찾지 못했습니다');
  cfg = cfg.replace('__KV_ID__', ns.id);
  writeFileSync(CFG, cfg);
  console.log('  뉴스 저장소(KV) 연결: ' + ns.id);
} catch (e) {
  console.error('[오류] KV 준비 실패: ' + (e.stderr || e.message));
  console.error('       로그인 문제면  npx wrangler@4 login  을 한 번 실행한 뒤 다시 시도하세요.');
  process.exit(1);
}
