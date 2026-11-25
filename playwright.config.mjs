import { defineConfig } from '@playwright/test';
import { createServer } from 'node:net';
import { once } from 'node:events';

if (!process.env.PATITAS_TEST_PORT) {
  const probe = createServer().listen(0, '127.0.0.1');
  await once(probe, 'listening');
  process.env.PATITAS_TEST_PORT = String(probe.address().port);
  await new Promise(resolve => probe.close(resolve));
}
const port = process.env.PATITAS_TEST_PORT;
const url = 'http://127.0.0.1:' + port;

export default defineConfig({
  testDir: './tests',
  use: { baseURL: url },
  webServer: {
    command: 'node server.mjs',
    url,
    env: { PORT: port, PATITAS_REQUESTS_FILE: 'test-solicitudes.jsonl' }
  }
});
