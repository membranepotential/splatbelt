/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
  },
  testDir: 'e2e',
}

export default config
