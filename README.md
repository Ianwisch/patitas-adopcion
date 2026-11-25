# Patitas

Demo de adopción de mascotas con un catálogo filtrable y un formulario de solicitud conectado a una API en Node.js. La interfaz está en español de Argentina y las fichas son de ejemplo.

## Qué podés probar

- Explorar perros, gatos y conejos y filtrar el catálogo por especie.
- Abrir el formulario de una mascota y enviar una solicitud de prueba.
- Ver cómo el servidor valida y guarda los envíos aceptados.

## Ejecutar en local

Requiere una versión LTS de Node.js con soporte (22 o superior). Usá el último parche disponible de la versión elegida. La demo se ejecuta sin dependencias de producción.

```bash
node server.mjs
```

Abrí [http://127.0.0.1:3000](http://127.0.0.1:3000). Si el puerto está ocupado, configurá la variable de entorno `PORT`. El servidor escucha en la interfaz local. Las fotos y tipografías se cargan desde Unsplash y Google Fonts.

## Configuración y despliegue local

El mismo comando arranca el backend y sirve el frontend. Para repetir el despliegue en otra máquina, cloná el repositorio, instalá Node.js 22 o superior y ejecutá `node server.mjs` desde la raíz. Mantené el servidor en la interfaz local durante la fase 2.

| Variable | Valor por defecto | Uso |
| --- | --- | --- |
| `PATITAS_MODE` | `demo` | Simula envíos sin guardarlos. Elegí `local` únicamente para pruebas con persistencia. |
| `PORT` | `3000` | Puerto HTTP local. |
| `PATITAS_REQUESTS_FILE` | `solicitudes.jsonl` junto al servidor | Ruta alternativa para aislar registros entre entornos. Las pruebas usan un archivo temporal separado. |

La demo solicita a los buscadores que no indexen la página. Las tarjetas tienen imágenes adaptables y una ilustración de respaldo. El formulario muestra errores por campo, conserva los datos si falla el envío y confirma el resultado.

## Pruebas

```bash
npm ci
npx playwright install chromium
npm test
```

Playwright prueba filtros, reintento del catálogo, validación de API, envío del formulario y respaldo de imágenes en un viewport móvil. También verifica privacidad del modo demo, límites, duplicados y encabezados. GitHub Actions ejecuta la suite en cada push y pull request.

## API

| Método | Ruta | Comportamiento |
| --- | --- | --- |
| GET | `/api/mascotas` | Devuelve el catálogo de ejemplo desde `pets.json`. |
| POST | `/api/solicitudes` | Recibe JSON con `petId`, `name` y `email`. Si los datos son válidos, devuelve HTTP 200 con `simulated: true` en modo demo o HTTP 201 en modo local. Los errores de validación de nombre y correo incluyen un mapa `errors` por campo. |

El modo demo permite probar el flujo sin guardar los datos. En modo local, las solicitudes se guardan en `solicitudes.jsonl`, excluido de Git. Usá datos ficticios en ambos modos.

## Seguridad

El endpoint acepta JSON UTF-8 de hasta 4096 bytes y limita la lectura de solicitudes a 10 segundos y la de encabezados a 5. Devuelve `400` por datos inválidos, `413` por exceso de tamaño, `415` por formato de contenido y `429` por límites de envío. El límite es de 20 intentos por dirección de conexión por minuto. El modo local rechaza repetidos para la misma mascota y correo dentro de ese período.

La página aplica una política de contenido para scripts, fuentes e imágenes, bloquea el uso en marcos y evita la detección automática de tipos MIME. Las rutas públicas están en una lista explícita. Las solicitudes y los archivos de entorno se excluyen de Git.

CodeQL analiza JavaScript y Dependabot revisa las dependencias npm. En el despliegue, guardá las credenciales en el gestor de secretos del hosting y aplicá límites en el perímetro. El limitador actual funciona en memoria por proceso y usa la dirección directa de la conexión. Con un proxy, las conexiones reenviadas pueden compartir el mismo cupo.

## Tecnologías

HTML, CSS, JavaScript y Node.js con sus módulos integrados de HTTP y sistema de archivos.

## Documentación

- [Términos de uso y privacidad](docs/terminos-y-privacidad.md)
- [Checklist de mejoras](docs/checklist.md)
