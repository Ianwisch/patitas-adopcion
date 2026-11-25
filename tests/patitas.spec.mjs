import { expect, test } from '@playwright/test';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const savedRequests = new URL('../test-solicitudes.jsonl', import.meta.url);
test.afterAll(() => rm(savedRequests, { force: true }));

test('filtra el catálogo por especie y categoría', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('article')).toHaveCount(4);
  await page.getByRole('link', { name: 'Gatos' }).click();
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.getByRole('button', { name: 'Descanso' }).click();
  await expect(page.getByRole('heading', { name: 'Cucha redonda Nube' })).toBeVisible();
  await page.getByRole('button', { name: 'Alimento' }).click();
  await expect(page.getByText('No encontramos productos con esos filtros.')).toBeVisible();
  await page.getByRole('link', { name: 'Tienda' }).click();
  await expect(page.getByRole('article')).toHaveCount(4);
});

test('el carrito conserva cantidades, calcula el subtotal y simula un pedido', async ({ page }) => {
  await page.goto('/');
  const add = page.getByRole('button', { name: 'Agregar Pelota con cuerda al carrito' });
  await add.click();
  await add.click();
  await page.reload();
  await page.getByRole('button', { name: 'Abrir carrito, 2 productos' }).click();
  const cart = page.getByRole('dialog', { name: 'Tu carrito' });
  await expect(cart.locator('#cart-total')).toContainText('15.800');
  await cart.getByRole('button', { name: 'Quitar una unidad de Pelota con cuerda' }).click();
  await expect(cart.locator('#cart-total')).toContainText('7.900');
  await cart.getByRole('button', { name: 'Simular pedido' }).click();
  await expect(cart.getByRole('status')).toContainText('Pedido simulado');
  await expect(cart.getByText('Tu carrito está vacío.')).toBeVisible();
});

test('la tienda cabe en pantalla móvil y responde al teclado', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Saltar al contenido' });
  await expect(skip).toBeFocused();
  await skip.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  const trigger = page.getByRole('button', { name: 'Abrir carrito, 0 productos' });
  await trigger.press('Enter');
  await expect(page.getByRole('button', { name: 'Cerrar carrito' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('la API limita el cuerpo, exige JSON y mantiene los archivos internos privados', async ({ request }) => {
  const route = '/api/solicitudes';
  expect((await request.post(route, { data: 'texto' })).status()).toBe(415);
  expect((await request.post(route, { data: { name: 'é'.repeat(2100) } })).status()).toBe(413);
  expect((await request.post(route, {
    data: '{', headers: { 'Content-Type': 'application/json' }
  })).status()).toBe(400);

  const page = await request.get('/');
  const headers = page.headers();
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['content-security-policy']).toContain("script-src 'self'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect((await request.get('/solicitudes.jsonl')).status()).toBe(404);
  expect((await request.get('/test-solicitudes.jsonl')).status()).toBe(404);
});

test('demo simula sin escribir y aplica el límite de envíos', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'patitas-demo-'));
  const file = join(dir, 'solicitudes.jsonl');
  const child = spawn(process.execPath, ['server.mjs'], {
    env: { ...process.env, PORT: '0', PATITAS_MODE: 'demo', PATITAS_REQUESTS_FILE: file },
    stdio: ['ignore', 'pipe', 'inherit']
  });
  try {
    const [output] = await once(child.stdout, 'data');
    const base = String(output).match(/http:\/\/127\.0\.0\.1:\d+/)[0];
    const route = base + '/api/solicitudes';
    const post = (data, options = {}) => fetch(route, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data, ...options
    });

    const streamingBody = new ReadableStream({
      start(controller) {
        controller.enqueue(Buffer.from('é'.repeat(2100)));
        controller.close();
      }
    });
    expect((await post(streamingBody, { duplex: 'half' })).status).toBe(413);
    const body = JSON.stringify({ petId: 'olivia', name: 'Prueba', email: 'prueba@example.test' });
    const response = await post(body);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ simulated: true });
    await expect(access(file)).rejects.toHaveProperty('code', 'ENOENT');

    for (let index = 0; index < 18; index++) {
      const accepted = await post(body);
      expect(accepted.status).toBe(200);
      await accepted.body.cancel();
    }
    const limited = await post(body);
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('60');
  } finally {
    child.kill();
    await rm(dir, { recursive: true, force: true });
  }
});

test('el modo local evita guardar solicitudes duplicadas', async ({ request }) => {
  const data = { petId: 'milo', name: 'Prueba', email: 'duplicado@example.test' };
  expect((await request.post('/api/solicitudes', { data })).status()).toBe(201);
  expect((await request.post('/api/solicitudes', { data })).status()).toBe(429);
});
