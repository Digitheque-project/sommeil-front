import { test, expect } from '@playwright/test';

const routes = ['/', '/consultation', '/polysomnographie', '/comptes-rendus', '/archives'];

for (const route of routes) {
  test(`screenshot ${route}`, async ({ page, baseURL }) => {
    const url = (baseURL ?? 'http://localhost:3000') + route;
    await page.goto(url);
    await page.waitForSelector('body');
    // Basic assertion: page should contain the main topbar title or equivalent
    const content = await page.textContent('header') || '';
    expect(content.length).toBeGreaterThan(0);
    await page.screenshot({ path: `./screenshots${route === '/' ? '/dashboard' : route.replace('/', '_')}.png`, fullPage: true });
  });
}
