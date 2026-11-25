# MyGoodHabits

MyGoodHabits es una página web para registrar cada día cómo vas con tus hábitos (sueño, agua, ejercicio, hábitos propios y ánimo) y verlo en anillos, estilo Strava o WHOOP pero muy sencilla. Tiene un coach de descanso que lee mi Body Battery y mi sueño de Garmin y me dice si hoy descanso o corro. La hice para mi clase de Applied Algorithmic Thinking y la uso para entrenar para mi medio maratón.

App: https://mygoodhabits-ioaw.vercel.app

## Cómo se usa

Entras al link, te registras con tu nombre, correo y contraseña, y ya dentro en la pestaña Hoy anotas a qué hora te dormiste y despertaste, cuántos vasos de agua tomaste, tu ejercicio, tus hábitos y cómo te sentiste. Todo se guarda en tu cuenta, entonces si recargas o entras desde otro dispositivo ahí sigue. En Calendario y Estadísticas ves cómo vas en la semana y en el mes, y en Ajustes cambias tus metas y agregas o quitas hábitos. El coach de descanso por ahora solo funciona con mi cuenta de Garmin, a los demás usuarios les dice que registren su sueño a mano.

## Cómo está armada

La página es un solo archivo (`index.html`) que Vercel publica. El login y los datos de cada usuario están en Supabase, en las tablas `perfiles`, `dias` y `configuracion` (el código para crearlas está en `supabase/tablas-habitos.sql`). El coach es una función de Vercel (`api/garmin-hoy.js`) que le pide los datos a la API personal de Garmin con mi llave, que está guardada en Vercel y no en el código. La regla del coach está en `src/descanso.js` y tiene sus pruebas en `test/`.

## Qué pasa si crece

Esto lo diagnostiqué en la Sesión 22 con mis números reales. Hoy el único usuario soy yo y la abro como 2 veces al día, eso da unas 60 llamadas al mes a la función de Garmin y unos 4.7 MB de datos. El plan gratis de Vercel deja 1,000,000 de llamadas a funciones al mes y 100 GB de transferencia (https://vercel.com/docs/plans/hobby), y el plan gratis de Supabase deja 50,000 usuarios activos al mes y 500 MB de base de datos (https://supabase.com/pricing), los dos consultados el 22 de noviembre de 2026. Con 1,000 veces más usuarios serían 60,000 llamadas y 4.7 GB, y sigo en $0. Ahora que los hábitos se guardan en Supabase, un día pesa menos de 2 KB, entonces aunque 1,000 personas la usaran un año serían como 730 MB, y ahí sí me pasaría de los 500 MB gratis y tendría que subir a Pro, que cuesta desde $25 dólares al mes.

Mi cuello de botella más cercano no es de costo, es de arquitectura. La API de Garmin que uso es personal, solo puede leer mis datos (https://developer.garmin.com/gc-developer-program/personal/personal-faq/), entonces en cuanto entra el segundo usuario el coach ya no le sirve. Para arreglarlo tendría que entrar al programa de Garmin para empresas, que es el que usan apps como Strava.

## Decisiones de diseño vs. sugerencias del IS

**1) Fuente de datos del coach: Strava o Garmin (funcionalidad)**
Qué propuso la IA: usar la API de Strava para que el coach me dijera si descansar según los km que corrí en la semana.
Qué decidí: revisarlo y cambiarlo a la API personal de Garmin.
Por qué: Strava solo me da los km que corrí y Garmin me da mi Body Battery y mis horas de sueño. Para saber si descansar o correr importa más cómo se recuperó mi cuerpo que cuánto corrí. Lo que pierdo es que solo funciona con mi cuenta, y eso es justo el cuello de botella que explico arriba.

**2) Quién puede ver mis datos de Garmin (seguridad)**
Qué propuso la IA: proteger `/api/garmin-hoy` para que solo responda si tienes sesión en Supabase, porque son datos de salud y si no cualquiera con el link los vería.
Qué decidí: primero lo acepté, pero luego me di cuenta que no bastaba y lo revisé. Como cualquiera se puede registrar en la app, cualquier persona con cuenta veía mi Body Battery, mi sueño y mis pasos, porque la llave de Garmin es mía. Lo cambié para que la función solo responda si el correo de la sesión es el mío, y ese correo está en Vercel (`GARMIN_OWNER_EMAIL`) y no en el código. Los demás reciben un error 403 (commit eaf31d6).
Por qué: son mis datos de salud y en mi especificación dije que la función era solo para mi cuenta. Pedir sesión protege contra alguien que nada más tiene el link, pero no contra alguien que se registra.

**3) Dónde guardar los hábitos de cada usuario (seguridad y escalabilidad)**
Qué propuso la IA: me dio dos opciones, guardarlos en Supabase en tablas con RLS (que cada usuario solo pueda leer y cambiar sus propios renglones) o guardarlos en el navegador, que era más fácil. Me recomendó Supabase, y también ponerle a cada día un límite de tamaño y cargar solo los últimos 400 días.
Qué decidí: aceptar Supabase con RLS.
Por qué: en el link de Vercel la app estaba en "Modo demostración" y no se guardaba nada, porque guardaba los datos en la base de los artifacts de Claude y eso en Vercel no existe. Si alguien se registraba y anotaba sus hábitos, al recargar perdía todo. Guardarlo en el navegador lo arreglaba solo en ese celular o compu, y ya tenía Supabase para el login. Lo importante es el RLS, porque la llave de Supabase está en el `index.html` y cualquiera la puede ver, entonces sin RLS cualquiera podría leer los hábitos de todos. El límite de tamaño es para que nadie pueda llenar mis 500 MB gratis mandando datos gigantes.

**4) Garmin contra lo que registras a mano (funcionalidad)**
Qué propuso la IA: me avisó que llenar los anillos de sueño, ejercicio y pasos con Garmin se salía de mi especificación del Assignment 2.
Qué decidí: hacerlo igual como extensión, y que si ya registré algo a mano y Garmin dice otra cosa, Garmin siempre gana. Agua y ánimo se quedan a mano porque Garmin no los mide.
Por qué: si ya traigo el reloj no tiene sentido escribir a mano el sueño y los pasos, y el reloj mide mejor que yo. A mano me equivoco con la hora en que me dormí.

## Uso de IA

Usé Claude para revisar el código, buscar los precios y límites en las páginas oficiales, escribir el código de las funciones y las pruebas, y redactar este README a partir de lo que yo le contesté y decidí. Yo elegí las funciones y la regla del coach, tomé las decisiones de arriba y probé la app en el deploy. La bitácora completa del Assignment 2 está en `PROMPT_LOG.md`.
