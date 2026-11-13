// Vercel Function: GET /api/garmin-hoy
// Lee Body Battery y sueño de HOY de la Garmin Personal API y aplica la regla de descanso.
// La llave vive en la variable de entorno GARMIN_PERSONAL_API_KEY (nunca en el código).
// Solo responde si el usuario tiene sesión en Supabase (son datos de salud).
import { decidirDescanso } from "../src/descanso.js";
import { datosGarmin } from "../src/garmin-datos.js";

const GARMIN = "https://personal.connectapi.garmin.com";
const SUPABASE_URL = "https://gaopxxuklyirwqkoykta.supabase.co";
const SUPABASE_KEY = "sb_publishable_SoMGA2CtM5Zxblyym_nsXQ_8pbl2hLO";

const hoyCDMX = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

// Devuelve el usuario de Supabase con sesión válida, o null.
async function usuarioConSesion(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: auth } });
  return r.ok ? r.json() : null;
}

async function tokenGarmin(key) {
  const r = await fetch(GARMIN + "/personalapitoken-service/personal-api/personal-api-key/token", {
    method: "POST", headers: { Authorization: `ApiKey ${key}`, Accept: "*/*" },
  });
  if (!r.ok) throw new Error(`Garmin no aceptó la llave (HTTP ${r.status})`);
  const t = (await r.text()).trim();
  if (!t.startsWith("{")) return t.replace(/^"|"$/g, "");
  const j = JSON.parse(t);
  return j.access_token || j.accessToken || j.token;
}

async function getGarmin(token, path) {
  const r = await fetch(GARMIN + path, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
  if (!r.ok) return null; // sin datos de hoy → null, no error
  return r.json().catch(() => null);
}

export default async function handler(req, res) {
  try {
    const user = await usuarioConSesion(req);
    if (!user) return res.status(401).json({ error: "Inicia sesión" });
    // La llave de Garmin es solo de Adolfo: nadie más puede ver estos datos aunque se registre.
    // El correo del dueño vive en Vercel (GARMIN_OWNER_EMAIL), no en el código.
    const dueno = (process.env.GARMIN_OWNER_EMAIL || "").trim().toLowerCase();
    if (!dueno) return res.status(500).json({ error: "Falta GARMIN_OWNER_EMAIL en Vercel" });
    if ((user.email || "").toLowerCase() !== dueno)
      return res.status(403).json({ error: "El coach de Garmin solo está conectado a la cuenta del dueño" });
    const key = process.env.GARMIN_PERSONAL_API_KEY;
    if (!key) return res.status(500).json({ error: "Falta GARMIN_PERSONAL_API_KEY en Vercel" });

    const fecha = hoyCDMX();
    const token = await tokenGarmin(key);
    const [resumen, sueno] = await Promise.all([
      getGarmin(token, `/usersummary-service/usersummary/daily?calendarDate=${fecha}`),
      getGarmin(token, `/sleep-service/sleep/dailySleep?date=${fecha}`),
    ]);
    const datos = datosGarmin(resumen, sueno);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ fecha, datos, ...decidirDescanso({ bodyBattery: datos.bodyBattery, suenoH: datos.suenoH }) });
  } catch (e) {
    return res.status(502).json({ error: String(e.message || e) });
  }
}
