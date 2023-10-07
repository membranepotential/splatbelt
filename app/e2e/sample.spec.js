import { expect, test } from '@playwright/test'

test('index page has expected h1', async ({ page }) => {
  // Expect that page redirects to other url in playwright
  await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Projectsx' })).toBeVisible({
    visible: false,
  })
})
