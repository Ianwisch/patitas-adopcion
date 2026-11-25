import { expect, test } from '@playwright/test';
import { readFile, rm } from 'node:fs/promises';

const savedRequests = new URL('../test-solicitudes.jsonl', import.meta.url);
test.afterAll(() => rm(savedRequests, { force: true }));

test('filtra el catálogo y permite reintentar después de un error', async ({ page }) => {
  await page.route('**/api/mascotas', route => route.abort(), { times: 1 });
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('No pudimos cargar las mascotas.');
  await page.getByRole('button', { name: 'Volver a intentar' }).click();
  await expect(page.getByRole('article')).toHaveCount(3);
  await page.getByRole('button', { name: 'Gatos' }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Olivia' })).toBeVisible();
});

test('valida la solicitud, conserva los datos ante un error y confirma el envío', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Me interesa Olivia' }).click();
  const dialog = page.getByRole('dialog');
  const name = dialog.getByLabel('Tu nombre');
  const email = dialog.getByLabel('Tu correo');
  const submit = dialog.getByRole('button', { name: 'Enviar solicitud' });
  await expect(name).toBeFocused();
  await submit.click();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(dialog.getByText('Ingresá tu nombre.')).toBeVisible();
  await name.fill('Persona de prueba');
  await email.fill('prueba@example.test');
  await page.route('**/api/solicitudes', route => route.abort(), { times: 1 });
  await submit.click();
  await expect(dialog.getByRole('status')).toContainText('No pudimos enviar');
  await expect(name).toHaveValue('Persona de prueba');
  await expect(email).toHaveValue('prueba@example.test');
  await submit.click();
  await expect(dialog.getByRole('status')).toContainText('Guardamos tu solicitud para Olivia');
  await expect(dialog.getByRole('status')).toBeFocused();
  const entries = (await readFile(savedRequests, 'utf8')).trim().split('\n').map(JSON.parse);
  expect(entries).toEqual(expect.arrayContaining([expect.objectContaining({ petId: 'olivia', email: 'prueba@example.test' })]));
});

test('la API rechaza datos inválidos y devuelve errores por campo', async ({ request }) => {
  const response = await request.post('/api/solicitudes', { data: { petId: 'olivia', name: '', email: 'mal' } });
  expect(response.status()).toBe(400);
  expect(await response.json()).toMatchObject({ errors: { name: expect.any(String), email: expect.any(String) } });
});

test('el catálogo móvil conserva sus imágenes cuando falla el proveedor', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('https://images.unsplash.com/**', route => route.abort());
  await page.goto('/');
  const hero = page.getByRole('img', { name: 'Dos perros corriendo juntos al aire libre' });
  await expect(hero).toHaveAttribute('src', '/patitas.svg');
  const photo = page.getByRole('img', { name: 'Gato naranja' });
  await photo.scrollIntoViewIfNeeded();
  await expect(photo).toHaveAttribute('src', '/patitas.svg');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('permite saltar al contenido y abrir el formulario con el teclado', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Saltar al contenido' });
  await expect(skip).toBeFocused();
  await skip.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  const adopt = page.getByRole('button', { name: 'Me interesa Milo' });
  await adopt.press('Enter');
  await expect(page.getByLabel('Tu nombre')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(adopt).toBeFocused();
});
