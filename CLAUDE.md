# MyGoodHabits

App de hábitos estilo WHOOP: dashboard diario con anillos de progreso por cada pilar (sueño, agua, ejercicio, hábitos, ánimo). El plan completo y las fases están en `PLAN.md`.

## Estado actual
- La app real es **un solo archivo**: `mygoodhabits.html` (HTML + CSS + JS inline, sin build ni dependencias aparte de Google Fonts Barlow / Barlow Condensed).
- Se publica como artifact de claude.ai: https://claude.ai/artifact/GfDRcKutWfdniFo6NRZK4E. Después de editar el HTML, vuelve a publicarlo en esa misma URL.
- `PLAN.md` menciona Expo / React Native; eso es la meta a futuro (por ejemplo, para leer Apple Health automáticamente). Por ahora no existe código en Expo.

## Datos
- Se guardan en la base de datos del artifact (`window.claude.use("db")`), no en localStorage. Solo el dueño puede leer y escribir.
- `config/main`: `goals` y `habits[]` (`id`, `name`, `type` = `check` | `count`, `target`, `unit`, `perWeek` 1–7; si falta = diario).
- `days/<YYYY-MM-DD>`: un documento por día.
- Para cambiar metas o hábitos a pedido del usuario: haz ArtifactData `get` de `config/main` y luego `set` con `if_version`.
- Apple Salud: un Atajo del iPhone copia texto `clave: valor` (fecha, pasos, agua, dormir, despertar, sueño, ejercicio: Tipo | Duración), que se pega en "Importar de Apple Salud" (`parseHealth` / `applyImport`).

## Código
- Vistas: `viewHoy`, `viewCal`, `viewStats`, `viewAjustes`; `render()` vuelve a dibujar todo.
- Anillos: `ring` / `rings` / `arc`. Puntaje del día: `score`. Rachas: `streak`.
- Guardado: `persistDay`, `persistConfig`.

## Diseño (preferencias firmes del usuario)
- Solo modo claro, con el look brillante original: fondo `#f3f5f8`, tarjetas blancas sin borde y los colores originales de los anillos (`--sleep`, `--water`, `--ex`, `--hab`, `--mood`).
- Ya se probaron y se rechazaron los temas oscuros (azul marino, casi negro, gris Oxford). No cambies la paleta sin mostrar opciones primero.
- Estilo minimalista, con muchos anillos tipo Actividad que brillan cuando se cumple la meta.

## Cómo trabajar
- Comunicarse en español.
- El usuario todavía está definiendo la visión: propón opciones con una recomendación clara y avanza paso a paso.
