// Автоматическая проверка axe (A/AA) для эталонных компонентов дизайн-системы
// (план 03-design-system.md, §5.2, §6 DoD). Открывает каждую историю собранного
// статического Storybook headless-браузером и прогоняет через неё axe-core.
// Запуск: node libs/shared/ui/tools/check-a11y.mjs (после nx run ui:build-storybook)
import { chromium } from '@playwright/test';
import { createServer } from 'http-server';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storybookDir = path.resolve(__dirname, '../../../../dist/storybook/ui');
const axeSource = readFileSync(
  path.resolve(__dirname, '../../../../node_modules/axe-core/axe.min.js'),
  'utf8'
);

const index = JSON.parse(
  readFileSync(path.join(storybookDir, 'index.json'), 'utf8')
);
const stories = Object.values(index.entries ?? index.stories).filter(
  (entry) => entry.type === 'story'
);

const server = createServer({ root: storybookDir });
await new Promise((resolve) => server.listen(0, resolve));
const port = server.server.address().port;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
});
const page = await browser.newPage();

let failures = 0;
for (const story of stories) {
  const url = `http://localhost:${port}/iframe.html?id=${story.id}&viewMode=story`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate(
    async () =>
      await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      })
  );
  if (results.violations.length > 0) {
    failures += results.violations.length;
    console.error(`\n✘ ${story.title} — ${story.name} (${story.id})`);
    for (const violation of results.violations) {
      console.error(`  [${violation.impact}] ${violation.id}: ${violation.help}`);
      for (const node of violation.nodes) {
        console.error(`    ${node.target.join(' ')}`);
      }
    }
  } else {
    console.log(`✔ ${story.title} — ${story.name}`);
  }
}

await browser.close();
server.close();

if (failures > 0) {
  console.error(`\n${failures} нарушение(й) axe (wcag2a/wcag2aa).`);
  process.exit(1);
}
console.log(`\nВсе ${stories.length} истори${stories.length === 1 ? 'я' : 'й'} прошли axe без нарушений A/AA.`);
