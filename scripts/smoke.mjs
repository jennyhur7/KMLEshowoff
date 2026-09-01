/*
 * 브라우저에서 실제로 돌려 보는 연기 테스트.
 * 이미지 내보내기는 폰트 임베딩·캔버스 변환이 얽혀 있어 단위 테스트로는
 * 잡히지 않는다. 빌드한 결과를 띄우고 PNG가 실제로 떨어지는지 확인한다.
 *
 *   npm run build && npm run preview &
 *   npm run smoke
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = process.env.SMOKE_URL ?? 'http://localhost:4173/';
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kmle-smoke-'));

const launch = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
const browser = await chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(BASE, { waitUntil: 'networkidle' });

// 기록을 직접 심어 두면 비율마다 클릭을 반복하지 않아도 된다.
await page.evaluate(() => {
  const ids = ['circ-01', 'circ-02', 'circ-03', 'circ-04', 'circ-05', 'endo-01', 'endo-02', 'minor-01', 'gi-01', 'law-02'];
  const d = new Date();
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  localStorage.setItem(
    'kmle-showoff/v1',
    JSON.stringify({
      version: 1,
      settings: { nickname: '스모크', examDate: '2027-01-07', dailyGoal: 8, weeklyGoal: 40 },
      logs: ids.map((c, i) => ({ id: `${key}:${c}`, date: key, chapterId: c, questions: 10 + i })),
      card: {},
    }),
  );
});
await page.reload({ waitUntil: 'networkidle' });

// 기록이 되살아났는지
await page.getByRole('button', { name: '대시보드' }).click();
await page.getByText('과목별 누적 진도').waitFor({ timeout: 5000 });

// 비율마다 PNG가 떨어지는지
await page.getByRole('button', { name: '자랑' }).click();
await page.getByPlaceholder('오늘도 살아남았다').fill('연기 테스트');

for (const ratio of ['9:16', '1:1', '16:9']) {
  await page.getByText(ratio, { exact: true }).click();
  await page.waitForTimeout(300);
  const pending = page.waitForEvent('download', { timeout: 30_000 });
  await page.getByRole('button', { name: 'PNG 저장' }).click();
  const download = await pending;
  const file = path.join(outDir, `${ratio.replace(':', 'x')}.png`);
  await download.saveAs(file);
  const { size } = fs.statSync(file);
  if (size < 10_000) throw new Error(`${ratio} 내보내기 결과가 너무 작습니다 (${size} bytes)`);
  console.log(`  ${ratio} → ${(size / 1024).toFixed(0)} KB`);
}

await browser.close();

if (errors.length) {
  console.error('콘솔 오류:', errors);
  process.exit(1);
}
console.log(`통과. 결과물: ${outDir}`);
