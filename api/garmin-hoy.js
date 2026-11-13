// Vercel Function: GET /api/garmin-hoy
// Lee Body Battery y sueño de HOY de la Garmin Personal API y aplica la regla de descanso.
// La llave vive en la variable de entorno GARMIN_PERSONAL_API_KEY (nunca en el código).
// Solo responde si el usuario tiene sesión en Supabase (son datos de salud).
import { decidirDescanso } from "../src/descanso.js";

const GARMIN = "https://personal.connectapi.garmin.com";
const SUPABASE_URL = "https://gaopxxuklyirwqkoykta.supabase.co";
const SUPABASE_KEY = "sb_publishable_SoMGA2CtM5Zxblyym_nsXQ_8pbl2hLO";

const hoyCDMX = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

async function usuarioValido(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return false;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: auth } });
  return r.ok;
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
    if (!(await usuarioValido(req))) return res.status(401).json({ error: "Inicia sesión" });
    const key = process.env.GARMIN_PERSONAL_API_KEY;
    if (!key) return res.status(500).json({ error: "Falta GARMIN_PERSONAL_API_KEY en Vercel" });

    const fecha = hoyCDMX();
    const token = await tokenGarmin(key);
    const [resumen, sueno] = await Promise.all([
      getGarmin(token, `/usersummary-service/usersummary/daily?calendarDate=${fecha}`),
      getGarmin(token, `/sleep-service/sleep/dailySleep?date=${fecha}`),
    ]);
    const bb = resumen?.bodyBatteryMostRecentValue;
    const seg = sueno?.sleepTimeSeconds ?? sueno?.dailySleepDTO?.sleepTimeSeconds;
    const datos = {
      bodyBattery: typeof bb === "number" ? bb : null,
      suenoH: typeof seg === "number" ? Math.round((seg / 3600) * 10) / 10 : null,
    };
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ fecha, datos, ...decidirDescanso(datos) });
  } catch (e) {
    return res.status(502).json({ error: String(e.message || e) });
  }
}
