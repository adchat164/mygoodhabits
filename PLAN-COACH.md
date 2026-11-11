# MyGoodHabits — Plan del Coach de IA para correr (con Strava)

_Actualizado: 4 de noviembre de 2026_

## Qué es
Un coach dentro de MyGoodHabits para gente que se pone una meta de carrera y no sabe cómo entrenar, o que se lesiona por correr de más. Hace tres cosas:

1. **Arma el plan.** El usuario escribe su meta (por ejemplo, "maratón el 15 de marzo en 4 horas") y la IA arma un plan semanal: qué días correr, cuántos km y qué días descansar.
2. **Revisa cada carrera.** Cuando el usuario sube una carrera a Strava, la app la lee, la compara con lo que decía el plan para ese día y da una retroalimentación corta (por ejemplo, "Corriste 8 km y tocaban 6 km. Mañana descansa.").
3. **Ajusta.** Dice cuánto descansar y cuánto correr al día siguiente, y ajusta el plan si el usuario se pasó o se quedó corto.

## Decisiones tomadas
- **Backend propio con variables de entorno.** La app sale del artifact de claude.ai y la hospedamos nosotros, porque un artifact no puede guardar claves ni recibir avisos (webhooks) de Strava.
- **Pestaña nueva "Coach"**, más una tarjeta corta en "Hoy" con lo que toca correr ese día.
- Se trabaja sobre **`mygoodhabits-v2.html`**.
- **La IA redacta, el código decide.** La regla del 10%, la comparación de km, la alerta de pulso y el filtro de "solo carreras" son código fijo con pruebas. La IA solo propone el plan (que el código revisa y corrige) y escribe los textos.

## Arquitectura (propuesta: Cloudflare Workers)
```
Navegador (HTML v2 + pestaña Coach)
   │ fetch /api/*
Worker ──► D1 (config, días, meta, plan, actividades, feedback)
   ├──► Strava API (solo lectura) + OAuth + webhook
   └──► Claude API (plan y texto de la retroalimentación)
```

## Datos
- **De Strava:** `distance`, `moving_time`, `average_heartrate`, `start_date` y `type` (solo se cuentan las de tipo `Run`).
- **Del usuario:** la meta (tipo de carrera, fecha y tiempo objetivo), que se guarda en la app.
- **Claves en variables de entorno, nunca en el código:** `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_WEBHOOK_VERIFY_TOKEN`, `ANTHROPIC_API_KEY` y `APP_PASSWORD`.

## Archivos
| Archivo | Qué hace | Estado |
|---|---|---|
| `src/coach.js` | Reglas fijas: 10%, comparar, consejo para mañana, ajuste del plan, alerta de pulso | ✅ Hecho |
| `test/coach.test.js` | Pruebas de los criterios de aceptación (8 de 8 pasan) | ✅ Hecho |
| `package.json`, `.gitignore` | Proyecto y exclusión de claves (`.dev.vars`) | ✅ Hecho |
| `wrangler.toml` | Configuración del Worker y de la base D1 | Pendiente |
| `schema.sql` | Tablas: config, días, tokens de Strava, meta, plan, actividades, feedback | Pendiente |
| `src/worker.js` | Rutas `/api/*` y `/strava/*` (conectar, callback, webhook) | Pendiente |
| `src/strava.js` | OAuth, renovación del token y lectura de actividades. **Solo GET** | Pendiente |
| `src/ai.js` | Llamadas a Claude con un prompt de coach sin consejos médicos y respuesta en JSON | Pendiente |
| `public/index.html` | La v2 adaptada: guarda en el servidor y suma la pestaña Coach | Pendiente |
| `CLAUDE.md` | Actualizar con la nueva arquitectura | Pendiente |

## Reglas fijas (ya programadas)
- **10%:** los km de una semana nunca superan en más de 10% a los de la semana anterior. Si la IA se pasa, el código recorta los días que todavía no se corren.
- **Te pasaste:** si corriste más de 20% de lo planeado (o saliste en un día de descanso), mañana toca descanso.
- **Te quedaste corto:** si corriste menos de 80% de lo planeado, no se repone de golpe y se sigue el plan.
- **Pulso alto:** si el promedio pasa de 180 lpm, solo se muestra un mensaje fijo: "descansa y consulta a un médico". Ese caso no pasa por la IA.
- **Sin acción:** si no hay Strava conectado, no hay meta o la actividad no es de correr (bici, gym), no se genera nada y no sale ningún error.

## Pasos
1. ✅ **Lógica y pruebas** (`src/coach.js`).
2. **Servidor + base de datos:** que la app actual funcione igual fuera del artifact y pasar los datos actuales.
3. **Conexión con Strava:** conectar, desconectar y renovar el token.
4. **Generar el plan:** meta → Claude → regla del 10% → pestaña Coach.
5. **Webhook + retroalimentación:** carrera nueva → leerla → comparar → texto. Más un botón "Revisar Strava" por si falla el aviso.
6. **Ajuste del plan** después de cada carrera.
7. Publicar y probar de punta a punta con una cuenta real.

## Criterios de aceptación
- "Medio maratón en 10 semanas" → plan de 10 semanas que nunca sube más de 10% de km de una semana a otra. ✅ Probado
- El plan decía 6 km y corrí 8 → la retroalimentación lo dice y recomienda descansar mañana. ✅ Probado
- Sin Strava o sin meta → no hay plan ni retroalimentación, y no sale ningún error. ✅ Probado
- Bici o gym → no hay retroalimentación. ✅ Probado

## Restricciones
- Strava solo se lee: nunca se suben, editan ni borran actividades.
- Las claves van en variables de entorno, nunca en el código.
- Nada de consejos médicos: ante algo raro, solo se recomienda descansar y ver a un médico.

## Supuestos
1. Hosting en Cloudflare Workers + D1 (gratis para este uso).
2. Al principio la app es para una sola persona, pero los datos se guardan por atleta de Strava para poder abrirla a más gente.
3. La parte de hábitos debe funcionar sin Strava, así que la app tiene su propio login (una contraseña por ahora).
4. Se usa el webhook de Strava, con un botón manual de respaldo.
5. El plan se mide en km por día. El ritmo objetivo se muestra solo como referencia.
6. La semana 1 parte del volumen actual: el promedio de las últimas 4 semanas en Strava, o lo que diga el usuario.
7. Modelo de IA: `claude-sonnet-5-5`.

## Pendiente
- **Instalar Node.js en la Mac.** Hace falta para `wrangler` (Cloudflare) y `vitest`. Por ahora las pruebas se corrieron con `jsc`, el motor de JavaScript que trae macOS.

## Preguntas abiertas
1. ¿La app es solo para mí o para más gente desde el inicio?
2. ¿Cloudflare u otro hosting?
3. ¿Subo carreras privadas a Strava? Si sí, el permiso tiene que ser `activity:read_all` en vez de `activity:read`.
4. ¿Las carreras de trail (`TrailRun`) y de caminadora (`VirtualRun`) cuentan como correr?
5. ¿El umbral de "te pasaste" es 20% o cualquier exceso?
6. ¿El pulso alto se mide con un límite fijo (180 lpm) o con el pulso máximo del usuario?
7. ¿Qué días se puede correr y cuál es el de la carrera larga? ¿Se pregunta en el formulario de la meta?
8. ¿Se pasan los datos actuales del artifact o se empieza de cero?
9. ¿El artifact actual se queda o se deja de usar?
