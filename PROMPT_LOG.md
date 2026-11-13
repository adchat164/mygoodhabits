# Bitácora de prompts — Assignment 2 (MyGoodHabits)

## Paso 1 — Especificación (3 campos)

**Qué hace**
En la pantalla de Hoy de MyGoodHabits sale una tarjeta que me dice si hoy descanso o corro con mis datos de Garmin de hoy. Si mi Body Battery está abajo de 40 o dormí menos de 6 h dice "Hoy descansa" y qué dato lo causó. Si no, dice "Hoy sí corre" con mis datos. Si Garmin no tiene datos de hoy dice "No hay datos de Garmin hoy, sincroniza tu reloj".

**Qué datos necesita**
Body Battery y horas de sueño de hoy, sacados de la Garmin Personal API con mi llave personal. La llave está en Vercel como variable de entorno, no en el código. Límite: solo funciona con mi cuenta de Garmin, otros usuarios no pueden conectar la suya.

**Cómo se sabrá que funciona**
- Prueba 1: con mis datos reales de hoy, si Body Battery < 40 la tarjeta debe decir "Hoy descansa: Body Battery en X".
- Prueba 2: si dormí menos de 6 h aunque el Body Battery esté bien, debe decir descansa.
- Prueba 3: si todo está bien, debe decir "Hoy sí corre: Body Battery en X y dormiste Y h".

Auditada por: Aldo Castelán, en la Sesión 19. Revisó la idea del coach de descanso y dijo que fue muy buena idea ponerlo. También me cuestionó por qué el coach solo sirve para correr y no para otros hábitos. Le dije que arreglar eso va a ser mi objetivo del próximo assignment, para que la app te pregunte tus metas y hábitos al registrarte y el coach te guíe con base en eso.

## Paso 2 — Decisiones durante la construcción

### Decisión 1 — Fuente de datos: Strava → Garmin
- Propuesta de la IA: usar la API de Strava (solo km de carreras).
- Campo en juego: **Qué datos necesita**.
- Mi decisión: **Revisar**, cambié a Garmin.
- Por qué: Strava solo me da los km que corrí y Garmin me da Body Battery y sueño. Para saber si descansar o correr importa más cómo me recuperé que cuánto corrí. Lo que pierdo es que solo funciona con mi cuenta.

### Decisión 2 — La especificación no cuadraba
- La IA me señaló que mi regla usaba HRV y sueño, pero mi tarjeta y mi prueba usaban Body Battery. Se contradecían.
- Campo en juego: **Qué hace** y **Cómo se sabrá que funciona**.
- Mi decisión: **Revisar**
- Por qué: cambié la regla a Body Battery o sueño para que los 3 campos usen los mismos datos. Si no, mi prueba checaba algo que mi regla ni usaba y nunca iba a poder decir si funciona.

### Decisión 3 — ¿Qué Body Battery usar?
- Propuesta de la IA: usar el valor **más reciente** del día (`bodyBatteryMostRecentValue`). La otra opción era el valor al despertar.
- Campo en juego: **Qué datos necesita**.
- Mi decisión: **Aceptar**, el más reciente.
- Por qué: quiero saber cómo estoy en el momento en que abro la app, no cómo desperté. Si en la mañana estaba en 80 pero ya en la tarde bajé a 35, lo que me importa es el 35.

### Decisión 4 — Funcionalidad extra que no pedí: proteger el endpoint con login
- Propuesta de la IA: que `/api/garmin-hoy` solo responda si tienes sesión en Supabase, porque son datos de salud y si no cualquiera con el link los vería.
- Campo en juego: ninguno, es algo extra fuera de la especificación.
- Mi decisión: **Aceptar**
- Por qué: mi sueño y mi Body Battery son datos de salud. No quiero que cualquiera que tenga el link los pueda ver.

### Decisión 5 — Error que encontré probando: la tarjeta se quedaba en "Revisando..."
- La IA dijo que ya estaba lista, pero en el deploy la tarjeta nunca cambiaba.
- Campo en juego: **Cómo se sabrá que funciona**.
- Causa: la tarjeta y el login estaban en bloques de código separados y la tarjeta no veía la sesión.
- Mi decisión: **Rechazar** la primera versión.
- Por qué: mi criterio de éxito era que la tarjeta dijera descansa o corre con mis datos reales, y se quedaba en "Revisando tus datos de Garmin..." para siempre. Que la IA dijera que ya estaba no contaba, la probé en el deploy y no cumplía. Después del arreglo salió "Hoy sí corre: Body Battery en 73 y dormiste 8.8 h".

### Decisión 6 — Ampliar el alcance: llenar los anillos con Garmin
- Yo pedí que los anillos de sueño, ejercicio y pasos también se llenen con Garmin. La IA me avisó que eso se sale de mi especificación.
- Campo en juego: **Qué hace** (alcance).
- Decidí hacerlo como extensión. Agua y ánimo se quedan a mano porque Garmin no los mide.
- Si ya registré algo a mano y Garmin dice otra cosa, decidí que **Garmin siempre gana**.
- Por qué: si ya traigo el reloj no tiene sentido escribir a mano el sueño y los pasos, y además el reloj mide mejor que yo. A mano me equivoco con la hora en que me dormí.

### Decisión 7 — Hueco de seguridad: cualquiera que se registrara veía mis datos de Garmin
- Con solo pedir sesión, cualquier persona que creara cuenta en MyGoodHabits veía mi Body Battery, mi sueño y mis pasos, porque la llave de Garmin es mía.
- Campo en juego: **Qué datos necesita** (el límite de "solo mi cuenta").
- Arreglo: el endpoint ahora solo responde si el correo de la sesión es el mío (guardado en Vercel como GARMIN_OWNER_EMAIL, no en el código). Los demás usuarios reciben un error 403.
- Mi decisión: **Aceptar**
- Por qué: son mis datos de salud. Pedir solo sesión no bastaba porque cualquiera se puede registrar, y en mi especificación dije que la función es solo para mi cuenta.

## Paso 3 — Validación

- Fecha y hora de la prueba: 13 de noviembre de 2026, 12:05
- Deploy: https://mygoodhabits-ioaw.vercel.app (respondió bien)
- Input exacto (lo que decía mi app de Garmin Connect ese día): Body Battery 73, dormí 8 h 48 min (de 23:29 a 08:19)
- Output real, copiado tal cual de la tarjeta:
```
COACH DE DESCANSO
Hoy sí corre: Body Battery en 73 y dormiste 8.8 h
```
- Output de los anillos: Sueño 8.8 h, Me dormí 11:29 p.m., Desperté 08:19 a.m.
- Veredicto: **Aceptar**
- Razón: 73 es más que 40 y 8.8 h es más que 6, entonces según mi regla tocaba correr y la tarjeta dijo "Hoy sí corre". Los dos números coinciden con lo que dice Garmin Connect.

Pruebas automáticas (en `test/descanso.test.js`): 6 de 6 pasan, incluido el caso de Body Battery 30 que tiene que decir "Hoy descansa: Body Battery en 30".

El caso de "descansa" está cubierto por las pruebas automáticas, todavía no lo he probado con datos reales.

## Por qué esta función sí resuelve mi problema
Estoy entrenando para mi medio maratón y a veces salgo a correr cansado, que es justo cuando uno se lesiona. Mi especificación dice que la tarjeta me dice si descanso o corro con mi Body Battery y mi sueño de hoy, y eso es lo que hace. No es solo que la prueba pasó, la decisión sale de cómo se recuperó mi cuerpo según mi reloj y no de cómo creo que me siento. Si mi Body Battery está abajo de 40 o dormí menos de 6 h me dice que descanse antes de que me lastime.

## Uso de IA
- Herramienta: Claude (en el panel de Claude en Chrome), que también escribió el código y lo subió a mi repo de GitHub.
- Para qué: entender las instrucciones de la tarea, cuestionar mi especificación, escribir el código de la función y de las pruebas, encontrar errores y redactar el texto de esta bitácora a partir de lo que yo le contesté y decidí. Yo la revisé antes de entregarla.
- Qué decidí o verifiqué yo: elegí la función, la regla (Body Battery menor a 40 o menos de 6 h de sueño), los textos de la tarjeta, cambiar de Strava a Garmin, usar el Body Battery más reciente, que Garmin gane en los anillos y que solo mi cuenta vea los datos. Probé la función en el deploy, detecté que se quedaba en "Revisando..." y comparé el resultado con mi app de Garmin Connect.
