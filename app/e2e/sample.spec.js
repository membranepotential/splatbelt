import { expect, test } from '@playwright/test'

test('index page has expected h1', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Projectsx' })).toBeVisible({
    visible: false,
  })
})
