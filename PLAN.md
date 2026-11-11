# MyGoodHabits — Plan

App de hábitos estilo WHOOP: un dashboard diario con "puntajes" de cada área de tu vida.

## Stack
- **Expo (React Native) + TypeScript**: una sola base de código para iOS, Android y web.
- Empezamos usándola en la **computadora (Expo web)** y luego en el celular con Expo Go.
- Datos guardados **localmente** (SQLite / almacenamiento local), sin servidor por ahora.
- Gráficas: `victory-native` o `react-native-gifted-charts`.

## Pilares (áreas que se registran cada día)
| Pilar | Qué se registra | Métrica |
|---|---|---|
| 😴 Sueño | hora de dormir/despertar, calidad 1–5 | horas, consistencia |
| 💧 Hidratación | vasos de agua (meta: 8) | % de la meta |
| 🏋️ Ejercicio | tipo, duración, intensidad 1–10 | minutos, "esfuerzo" |
| 🥗 Alimentación | comidas saludables / comida chatarra | # comidas buenas |
| 🧘 Mente | meditación, lectura, tiempo de pantalla | minutos |
| 😊 Ánimo | cómo te sentiste (1–5) + nota del día | promedio semanal |
| ✅ Hábitos libres | checklist personalizado (sí/no o cantidad) | % cumplido |

## Puntaje diario (idea tipo WHOOP)
- **Puntaje del día (0–100)**: promedio ponderado del cumplimiento de cada pilar.
- Anillos/círculos de progreso por pilar en la pantalla principal.
- Rachas 🔥 por hábito.

## Pantallas
1. **Hoy**: anillo del puntaje del día + tarjetas de cada pilar + checklist.
2. **Calendario**: cada día coloreado según el puntaje (mapa de calor).
3. **Estadísticas**: gráficas semanales/mensuales por pilar, tendencias, correlaciones
   (ej. "los días que duermes 8h tu ánimo sube").
4. **Diario**: notas y ánimo por día.
5. **Ajustes**: crear/editar hábitos, metas, pilares activos.

## Fases
- **Fase 1 (MVP)**: pantalla Hoy + checklist + hábitos con cantidad + notas/ánimo + calendario.
- **Fase 2**: estadísticas y gráficas, puntaje diario.
- **Fase 3**: recordatorios, correlaciones, integración con Apple Health / Google Fit
  (para leer sueño y pasos automáticamente).
