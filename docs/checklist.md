# Checklist de mejoras de Patitas

Para marcar una tarea, editá este archivo con el lápiz de GitHub, cambiá `- [ ]` por `- [x]` y guardá con un commit. Las fases 2 a 4 preparan la demo para Fiverr. La fase 5 aplica si habilitás solicitudes reales.

## Fase 1 · Demo local

- [x] Catálogo con filtros por especie.
- [x] Formulario de solicitud por mascota con validación del servidor.
- [x] Guardado local de solicitudes de prueba.

## Fase 2 · Experiencia, calidad y contenido

- [ ] Revisar diseño adaptable en móvil y escritorio, contraste, teclado, foco y lector de pantalla.
- [ ] Mostrar estados de carga, catálogo vacío, errores por campo y confirmación accesible. Conservar lo ingresado si falla el envío y evitar dobles clics.
- [ ] Optimizar y dimensionar imágenes, agregar texto alternativo y prever una imagen alternativa cuando falle el proveedor.
- [ ] Agregar título, descripción, favicon y metadatos para compartir el enlace. Configurar indexación según el alcance de la demo.
- [ ] Automatizar pruebas de los filtros, casos válidos e inválidos de la API y flujo completo del formulario. Ejecutarlas en GitHub Actions antes de integrar cambios.
- [ ] Documentar en el README la configuración por entorno, los comandos de prueba y cómo reproducir el despliegue.

## Fase 3 · Seguridad del código y del repositorio

- [ ] Implementar un modo demo en el backend que simule el flujo con datos ficticios sin guardar solicitudes ni enviarlas a servicios externos. Probar que el modo demo nunca persista los datos ingresados.
- [ ] Exigir `application/json` en `POST /api/solicitudes`, medir el límite del cuerpo en bytes y fijar tiempos máximos de lectura. Probar respuestas `400`, `413` y `415`.
- [ ] Si el endpoint de envíos queda disponible públicamente, limitar el volumen de solicitudes, controlar duplicados y automatizaciones, y probar la respuesta `429`.
- [ ] Aplicar una política CSP que limite scripts, imágenes y fuentes a los orígenes necesarios. Añadir `X-Content-Type-Options: nosniff` y `frame-ancestors 'none'`.
- [ ] Conservar la validación en servidor, el renderizado como texto y la lista explícita de archivos públicos. Verificar que la API nunca exponga el archivo de solicitudes ni detalles internos de errores.
- [ ] Configurar CodeQL para JavaScript y revisar Secret scanning y Push protection en GitHub. Habilitar Dependabot para npm si se agregan dependencias.
- [ ] Mantener Node.js en una versión LTS con soporte y aplicar actualizaciones de seguridad. Usar el gestor de secretos del hosting para credenciales y excluir del repositorio archivos locales con datos o secretos.

## Fase 4 · Publicación y operación de la demo

- [ ] Identificar las fichas como ejemplos. Enlazar los términos y la privacidad desde el formulario y el pie de página.
- [ ] Configurar hosting compatible con Node.js, URL pública o dominio, HTTPS y redirección de HTTP a HTTPS. Mantener separadas la configuración local y la pública.
- [ ] Desplegar desde GitHub con permisos mínimos y documentar cómo volver a una versión anterior.
- [ ] Configurar un chequeo de disponibilidad y alertas por errores. Revisar que los logs y cualquier herramienta de monitoreo excluyan nombres, correos y cuerpos de solicitudes.
- [ ] Probar catálogo, filtros, formulario, enlaces y encabezados en la URL pública. Verificar que siga activo el modo demo.
- [ ] Enlazar la demo publicada desde el README y revisar periódicamente alertas, actualizaciones y enlaces.

## Fase 5 · Antes de recibir solicitudes reales

- [ ] Definir quién administra los datos, qué datos son imprescindibles, con qué finalidad y por cuánto tiempo se conservan. Publicar el contacto y el procedimiento para ejercer derechos.
- [ ] Migrar a una base privada con consultas parametrizadas, cifrado, permisos mínimos y copias de seguridad. Probar una restauración en un entorno separado.
- [ ] Implementar eliminación según el plazo de conservación y comprobar que el proceso abarque exportaciones y copias conforme a la política definida.
- [ ] Si se incorpora un panel, exigir autenticación, MFA y autorización en servidor para cada operación. Proteger sesiones y acciones autenticadas si se usan cookies.
- [ ] Definir estados y responsables de cada solicitud. Si se agregan notificaciones, usar un proveedor de correo transaccional y evitar incluir datos personales innecesarios.
- [ ] Probar permisos, límites de envío, recuperación y respuesta a incidentes antes de habilitar el modo real.
