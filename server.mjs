import { resolve } from 'node:path';
import { createServer } from 'node:http';
import { readFile, appendFile } from 'node:fs/promises';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';

const pets = JSON.parse(await readFile(new URL('./pets.json', import.meta.url), 'utf8'));
const mode = process.env.PATITAS_MODE ?? 'demo';
if (!['demo', 'local'].includes(mode)) throw new Error('PATITAS_MODE debe ser demo o local.');
const requestsFile = process.env.PATITAS_REQUESTS_FILE
  ? resolve(process.env.PATITAS_REQUESTS_FILE)
  : new URL('./solicitudes.jsonl', import.meta.url);
const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/style.css', ['style.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']],
  ['/patitas.svg', ['patitas.svg', 'image/svg+xml']],
  ['/tienda-hero.jpg', ['tienda-hero.jpg', 'image/jpeg']],
  ['/tienda-productos.jpg', ['tienda-productos.jpg', 'image/jpeg']]
]);
const port = Number(process.env.PORT || 3000);
const maxBodyBytes = 4096;
const limitWindowMs = 60_000;
const peers = new Map();
const recent = new Map();
const fingerprintKey = randomBytes(32);
const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'none'", "script-src 'self'", "style-src 'self' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com", "img-src 'self' https://images.unsplash.com",
    "connect-src 'self'", "base-uri 'none'", "frame-ancestors 'none'", "form-action 'self'"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer'
};

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [peer, entry] of peers) if (entry.expires <= now) peers.delete(peer);
  for (const [key, expires] of recent) if (expires <= now) recent.delete(key);
}, limitWindowMs);
cleanup.unref();

function allowRequest(peer) {
  const now = Date.now();
  let entry = peers.get(peer);
  if (!entry || entry.expires <= now) {
    if (!entry && peers.size >= 2048) return false;
    entry = { count: 0, expires: now + limitWindowMs };
    peers.set(peer, entry);
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

const server = createServer({
  requestTimeout: 10_000,
  headersTimeout: 5_000,
  connectionsCheckingInterval: 1000
}, async (req, res) => {
  const send = (status, data, type = 'application/json', extraHeaders = {}) => {
    res.writeHead(status, { ...securityHeaders, 'Content-Type': type.startsWith('image/') ? type : type + '; charset=utf-8', ...extraHeaders });
    res.end(type === 'application/json' ? JSON.stringify(data) : data);
  };
  const rejectBody = (status, error, headers = {}) =>
    send(status, { error }, 'application/json', { Connection: 'close', 'Cache-Control': 'no-store', ...headers });

  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (req.method === 'GET' && assets.has(pathname)) {
      const [file, type] = assets.get(pathname);
      return send(200, await readFile(new URL('./' + file, import.meta.url)), type);
    }
    if (req.method === 'GET' && pathname === '/api/mascotas') return send(200, pets);
    if (req.method !== 'POST' || pathname !== '/api/solicitudes') {
      return send(404, { error: 'Página no encontrada.' });
    }

    if (!allowRequest(req.socket.remoteAddress)) {
      return rejectBody(429, 'Demasiados intentos. Volvé a probar en un minuto.', { 'Retry-After': '60' });
    }
    const mediaType = req.headers['content-type']?.split(';')[0].trim().toLowerCase();
    if (mediaType !== 'application/json') return rejectBody(415, 'Enviá la solicitud como JSON.');
    if (Number(req.headers['content-length']) > maxBodyBytes) {
      return rejectBody(413, 'La solicitud es demasiado larga.');
    }

    let bytes = 0;
    const chunks = [];
    for await (const chunk of req.iterator({ destroyOnReturn: false })) {
      bytes += chunk.length;
      if (bytes > maxBodyBytes) return rejectBody(413, 'La solicitud es demasiado larga.');
      chunks.push(chunk);
    }

    let data;
    try {
      data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
    } catch {
      return rejectBody(400, 'Formato inválido.');
    }

    const name = typeof data?.name === 'string' ? data.name.trim() : '';
    const email = typeof data?.email === 'string' ? data.email.trim() : '';
    const pet = pets.find(item => item.id === data?.petId);
    const errors = {};
    if (!name || name.length > 100) errors.name = 'Ingresá un nombre de hasta 100 caracteres.';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Ingresá un correo válido.';
    const privateResponse = { 'Cache-Control': 'no-store' };
    if (!pet || Object.keys(errors).length) {
      return send(400, { error: 'Revisá el nombre, el correo y la mascota.', errors }, 'application/json', privateResponse);
    }

    const id = randomUUID();
    if (mode === 'demo') return send(200, { id, simulated: true }, 'application/json', privateResponse);

    const key = createHmac('sha256', fingerprintKey).update(JSON.stringify([pet.id, email.toLowerCase()])).digest('hex');
    const now = Date.now();
    if (recent.get(key) > now) {
      return send(429, { error: 'Ya recibimos una solicitud reciente para esa mascota.' }, 'application/json',
        { ...privateResponse, 'Retry-After': '60' });
    }
    if (!recent.has(key) && recent.size >= 4096) {
      return send(429, { error: 'Demasiadas solicitudes. Volvé a probar en un minuto.' }, 'application/json',
        { ...privateResponse, 'Retry-After': '60' });
    }
    recent.set(key, now + limitWindowMs);
    try {
      await appendFile(requestsFile, JSON.stringify({ id, name, email, petId: pet.id, date: new Date().toISOString() }) + '\n');
    } catch (error) {
      recent.delete(key);
      throw error;
    }
    return send(201, { id }, 'application/json', privateResponse);
  } catch (error) {
    if (res.destroyed) return;
    console.error('Error de Patitas:', error.code ?? error.name);
    if (!res.headersSent) send(500, { error: 'Hubo un problema. Probá de nuevo.' });
  }
});
server.listen(port, '127.0.0.1', () => console.log('Patitas disponible en http://127.0.0.1:' + server.address().port));
