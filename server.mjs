import { createServer } from 'node:http';
import { readFile, appendFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const pets = JSON.parse(await readFile(new URL('./pets.json', import.meta.url), 'utf8'));
const requestsFile = new URL('./solicitudes.jsonl', import.meta.url);
const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/style.css', ['style.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']]
]);
const port = Number(process.env.PORT || 3000);

createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const send = (status, data, type = 'application/json') => {
    res.writeHead(status, { 'Content-Type': type + '; charset=utf-8' });
    res.end(type === 'application/json' ? JSON.stringify(data) : data);
  };

  try {
    if (req.method === 'GET' && assets.has(pathname)) {
      const [file, type] = assets.get(pathname);
      return send(200, await readFile(new URL('./' + file, import.meta.url)), type);
    }
    if (req.method === 'GET' && pathname === '/api/mascotas') return send(200, pets);
    if (req.method === 'POST' && pathname === '/api/solicitudes') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 4096) {
          send(413, { error: 'La solicitud es demasiado larga.' });
          return;
        }
      }

      let data;
      try { data = JSON.parse(body); } catch { return send(400, { error: 'Formato invÃ¡lido.' }); }
      const name = typeof data?.name === 'string' ? data.name.trim() : '';
      const email = typeof data?.email === 'string' ? data.email.trim() : '';
      const pet = pets.find(item => item.id === data?.petId);
      if (!pet || !name || name.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return send(400, { error: 'RevisÃ¡ el nombre, el correo y la mascota.' });
      }

      const id = randomUUID();
      await appendFile(requestsFile, JSON.stringify({ id, name, email, petId: pet.id, date: new Date().toISOString() }) + '\n');
      return send(201, { id });
    }
    send(404, { error: 'PÃ¡gina no encontrada.' });
  } catch (error) {
    console.error(error);
    send(500, { error: 'Hubo un problema. ProbÃ¡ de nuevo.' });
  }
}).listen(port, '127.0.0.1', () => console.log('Patitas disponible en http://127.0.0.1:' + port));


