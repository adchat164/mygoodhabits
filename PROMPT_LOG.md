# Bitácora de prompts — Assignment 2 (MyGoodHabits)

> ✍️ Lo que dice **[TÚ]** lo escribes tú con tus palabras. Es lo que califican.

## Paso 1 — Especificación (3 campos)

**Qué hace**
En la pantalla de Hoy de MyGoodHabits sale una tarjeta que me dice si hoy descanso o corro con mis datos de Garmin de hoy. Si mi Body Battery está abajo de 40 o dormí menos de 6 h dice "Hoy descansa" y qué dato lo causó. Si no, dice "Hoy sí corre" con mis datos. Si Garmin no tiene datos de hoy dice "No hay datos de Garmin hoy, sincroniza tu reloj".

**Qué datos necesita**
Body Battery y horas de sueño de hoy, sacados de la Garmin Personal API con mi llave personal. La llave está en Vercel como variable de entorno, no en el código. Límite: solo funciona con mi cuenta de Garmin, otros usuarios no pueden conectar la suya.

**Cómo se sabrá que funciona**
- Prueba 1: con mis datos reales de hoy, si Body Battery < 40 la tarjeta debe decir "Hoy descansa: Body Battery en X".
- Prueba 2: si dormí menos de 6 h aunque el Body Battery esté bien, debe decir descansa.
- Prueba 3: si todo está bien, debe decir "Hoy sí corre: Body Battery en X y dormiste Y h".

Auditada por: **[TÚ: nombre de tu compañero y qué te cuestionó]**

## Paso 2 — Decisiones durante la construcción

### Decisión 1 — Fuente de datos: Strava → Garmin
- Propuesta de la IA: usar la API de Strava (solo km de carreras).
- Campo en juego: **Qué datos necesita**.
- Mi decisión: **Revisar** → cambié a Garmin.
- Por qué: **[TÚ]**

### Decisión 2 — La especificación no cuadraba
- La IA me señaló que mi regla usaba HRV y sueño, pero mi tarjeta y mi prueba usaban Body Battery. Se contradecían.
- Campo en juego: **Qué hace** y **Cómo se sabrá que funciona**.
- Mi decisión: **[TÚ: Aceptar/Rechazar/Revisar]**
- Por qué: **[TÚ]**

### Decisión 3 — ¿Qué Body Battery usar?
- Propuesta de la IA: usar el valor **más reciente** del día (`bodyBatteryMostRecentValue`). La otra opción era el valor al despertar.
- Campo en juego: **Qué datos necesita**.
- Mi decisión: **[TÚ]**
- Por qué: **[TÚ]**

### Decisión 4 — Funcionalidad extra que no pedí: proteger el endpoint con login
- Propuesta de la IA: que `/api/garmin-hoy` solo responda si tienes sesión en Supabase, porque son datos de salud y si no cualquiera con el link los vería.
- Campo en juego: ninguno, es algo extra fuera de la especificación.
- Mi decisión: **[TÚ]**
- Por qué: **[TÚ]**

## Paso 3 — Validación (antes de la Sesión 20)

- Fecha y hora de la prueba: **[TÚ]**
- Deploy: **[link]**
- Input exacto (mis datos en la app de Garmin Connect hoy): Body Battery **[ ]**, sueño **[ ] h**
- Output real (copiado tal cual de la tarjeta y de `/api/garmin-hoy`):
```
[pega aquí]
```
- Veredicto: **[Aceptar/Rechazar/Revisar]**
- Razón (citando el output): **[TÚ]**

## Uso de IA
- Herramienta: **[TÚ: Claude]**
- Para qué: **[TÚ]**
- Qué decidí o verifiqué yo: **[TÚ]**
