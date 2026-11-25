# Patitas

Demo de adopción de mascotas con un catálogo filtrable y un formulario de solicitud conectado a una API en Node.js. La interfaz está en español de Argentina y las fichas son de ejemplo.

## Qué podés probar

- Explorar perros, gatos y conejos y filtrar el catálogo por especie.
- Abrir el formulario de una mascota y enviar una solicitud de prueba.
- Ver cómo el servidor valida y guarda los envíos aceptados.

## Ejecutar en local

Requiere Node.js 22 o superior. No hace falta instalar paquetes.

```bash
node server.mjs
```

Abrí [http://127.0.0.1:3000](http://127.0.0.1:3000). Si el puerto está ocupado, configurá la variable de entorno `PORT`. El servidor escucha en la interfaz local. Las fotos y tipografías se cargan desde Unsplash y Google Fonts.

## API

| Método | Ruta | Comportamiento |
| --- | --- | --- |
| GET | `/api/mascotas` | Devuelve el catálogo de ejemplo desde `pets.json`. |
| POST | `/api/solicitudes` | Recibe JSON con `petId`, `name` y `email`. Si los datos son válidos, devuelve HTTP 201 y el identificador de la solicitud. |

Las solicitudes se guardan en `solicitudes.jsonl`, que está excluido de Git. Usá datos ficticios para probar el formulario.

## Tecnologías

HTML, CSS, JavaScript y Node.js con sus módulos integrados de HTTP y sistema de archivos.

## Documentación

- [Términos de uso y privacidad](docs/terminos-y-privacidad.md)
- [Checklist de mejoras](docs/checklist.md)
