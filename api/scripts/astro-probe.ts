/**
 * One-off check of the astrology provider with a sample birth chart.
 * Saves each raw response to docs/navamsha-samples/<name>.json so we can see the exact
 * field names and fine-tune the website display. Uses a few API credits.
 *
 *   docker compose exec api npm run astro:probe
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const base = (process.env.ASTRO_API_BASE_URL || 'https://api.navamsha.in/api/v1').replace(/\/$/, '');
const key = process.env.ASTRO_API_KEY;
const outDir = existsSync('/docs') ? '/docs/navamsha-samples' : join(__dirname, '..', '..', 'docs', 'navamsha-samples');

const birth = { year: 1992, month: 8, date: 15, hours: 6, minutes: 45, seconds: 0, latitude: 22.7196, longitude: 75.8577, timezone: 5.5, settings: { ayanamsha: 'lahiri' } };
const birth2 = { ...birth, year: 1994, month: 3, date: 2, hours: 21, minutes: 10, latitude: 28.6139, longitude: 77.209 };

const calls: [string, string, unknown][] = [
  ['kundali-basic', '/kundali/basic', birth],
  ['planets', '/planets', birth],
  ['dasha-vimshottari', '/dasha/vimshottari', birth],
  ['dosha-mangal', '/dosha/mangal', birth],
  ['chart-render-d1', '/chart/render?_chart_code=D1', { ...birth, chart_config: { chart_style: 'north_india' } }],
  ['panchang-full', '/panchang/full', birth],
  ['panchang-choghadiya', '/panchang/choghadiya', birth],
  ['panchang-inauspicious', '/panchang/inauspicious-periods', birth],
  ['panchang-abhijit', '/panchang/abhijit-muhurat', birth],
  ['ashtakoot-bride-groom', '/compatibility/ashtakoot', { bride: birth2, groom: birth }],
  ['ashtakoot-person', '/compatibility/ashtakoot', { person_a: birth2, person_b: birth }],
];

async function run() {
  if (!key) throw new Error('ASTRO_API_KEY is not set in api/.env');
  mkdirSync(outDir, { recursive: true });
  for (const [name, path, body] of calls) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'X-API-Key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      const text = await res.text();
      let parsed: unknown = text;
      try {
        parsed = JSON.parse(text);
      } catch {
        /* keep text */
      }
      writeFileSync(join(outDir, `${name}.json`), JSON.stringify({ path, status: res.status, request: body, response: parsed }, null, 2));
      console.log(`${res.status}  ${name}`);
    } catch (e) {
      console.log(`ERR  ${name}: ${(e as Error).message}`);
    }
  }
  console.log(`Saved to ${outDir}`);
}
run();
