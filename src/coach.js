// Lógica del coach de carrera. Todo aquí es determinista y sin red:
// la IA propone el plan y redacta textos, pero estas reglas deciden.

export const RUN_TYPES = ["Run"];          // pendiente: ¿TrailRun / VirtualRun?
export const MAX_WEEKLY_INCREASE = 0.10;   // regla del 10%
export const OVER_RATIO = 0.20;            // >20% sobre lo planeado = "te pasaste"
export const UNDER_RATIO = 0.20;           // <80% de lo planeado = "te quedaste corto"
export const HR_ALERT_BPM = 180;           // pulso promedio que dispara la alerta
export const HR_MESSAGE = "Tu ritmo cardiaco promedio salió muy alto. Descansa y, si se repite o te sientes mal, consulta a un médico.";

const round1 = n => Math.round(n * 10) / 10;
const floorHalf = n => Math.floor(n * 2) / 2;
const fmtKm = n => `${round1(n)} km`.replace(".0 km", " km");

export function addDays(date, n){
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---------- entrada ----------
// Solo hay coach si hay meta y Strava conectado; si no, no se hace nada (ni error).
export function canCoach({ goal, stravaConnected }){
  return !!(stravaConnected && goal && goal.date);
}

export function isRun(activity){
  return !!activity && RUN_TYPES.includes(activity.type);
}

// Convierte una actividad de Strava a lo que usa el coach.
export function runFromStrava(a){
  return {
    id: a.id,
    date: String(a.start_date_local || a.start_date || "").slice(0, 10),
    km: (+a.distance || 0) / 1000,
    minutes: (+a.moving_time || 0) / 60,
    avgHr: a.average_heartrate > 0 ? +a.average_heartrate : null,
  };
}

// ---------- plan ----------
// plan = { weeks: [{ kind: "build"|"deload"|"taper", days: [{ date, km, kind }] }] }
export const weekKm = w => round1(w.days.reduce((s, d) => s + (+d.km || 0), 0));

// Garantiza que ninguna semana supere a la anterior en más del 10%.
// `locked(date)` marca días que ya pasaron (no se tocan); `baselineKm` limita la semana 1.
export function enforceTenPercent(plan, { baselineKm = null, locked = () => false } = {}){
  const weeks = plan.weeks.map(w => ({ ...w, days: w.days.map(d => ({ ...d, km: +d.km || 0 })) }));
  let prev = baselineKm > 0 ? baselineKm : null;
  for(const w of weeks){
    if(prev != null){
      const cap = prev * (1 + MAX_WEEKLY_INCREASE);
      const total = weekKm(w);
      if(total > cap + 1e-9){
        const open = w.days.filter(d => !locked(d.date) && d.km > 0);
        const openKm = open.reduce((s, d) => s + d.km, 0);
        const f = openKm > 0 ? Math.max(0, (openKm - (total - cap)) / openKm) : 0;
        open.forEach(d => { d.km = floorHalf(d.km * f); if(d.km === 0) d.kind = "rest"; });
      }
    }
    prev = weekKm(w);
  }
  return { ...plan, weeks };
}

export function planDay(plan, date){
  for(const w of plan?.weeks || []) for(const d of w.days) if(d.date === date) return d;
  return null;
}

// ---------- comparar y aconsejar ----------
export function compare(planned, run){
  const plannedKm = +planned?.km || 0, actualKm = round1(run.km);
  let status = "ok";
  if(plannedKm === 0) status = actualKm > 0 ? "over" : "ok";
  else if(actualKm > plannedKm * (1 + OVER_RATIO)) status = "over";
  else if(actualKm < plannedKm * (1 - UNDER_RATIO)) status = "under";
  return { date: run.date, plannedKm, actualKm, diffKm: round1(actualKm - plannedKm), status };
}

export function hrAlert(run, maxBpm = HR_ALERT_BPM){
  return run.avgHr != null && run.avgHr > maxBpm;
}

// Qué hacer mañana. Si se pasó o hay alerta de pulso: descanso.
// Si se quedó corto no se compensa: se sigue el plan.
export function nextDayAdvice(cmp, plan, alert = false){
  const date = addDays(cmp.date, 1);
  const next = planDay(plan, date);
  if(alert) return { date, km: 0, kind: "rest", reason: "hr" };
  if(cmp.status === "over") return { date, km: 0, kind: "rest", reason: "over" };
  return { date, km: +next?.km || 0, kind: next?.kind || "rest", reason: cmp.status };
}

// Texto corto de respaldo (también sirve para validar el de la IA).
export function feedbackText(cmp, advice){
  if(advice.reason === "hr") return HR_MESSAGE;
  const base = cmp.plannedKm > 0
    ? `Corriste ${fmtKm(cmp.actualKm)} y tocaban ${fmtKm(cmp.plannedKm)}.`
    : `Corriste ${fmtKm(cmp.actualKm)} en un día de descanso.`;
  const tomorrow = advice.km > 0 ? `Mañana toca ${fmtKm(advice.km)}.` : "Mañana descansa.";
  const extra = cmp.status === "under" ? " No intentes reponer lo que faltó." : "";
  return `${base}${extra} ${tomorrow}`;
}

// Ajusta el plan con lo que de verdad se corrió: los días ya corridos toman los km reales,
// el día siguiente a un exceso pasa a descanso, y se vuelve a aplicar el 10% a lo que falta.
export function adjustPlan(plan, actuals, advice, { baselineKm = null } = {}){
  const weeks = plan.weeks.map(w => ({ ...w, days: w.days.map(d => {
    if(d.date in actuals) return { ...d, km: round1(actuals[d.date]), done: true };
    if(d.date === advice.date && advice.km === 0) return { ...d, km: 0, kind: "rest" };
    return { ...d };
  }) }));
  return enforceTenPercent({ ...plan, weeks }, { baselineKm, locked: date => date in actuals });
}

// Todo el flujo (b)+(c) para una actividad. Devuelve null cuando no toca hacer nada.
export function processActivity({ goal, stravaConnected, plan, actuals = {}, baselineKm = null }, activity){
  if(!canCoach({ goal, stravaConnected }) || !plan || !isRun(activity)) return null;
  const run = runFromStrava(activity);
  if(!run.date) return null;
  const cmp = compare(planDay(plan, run.date), run);
  const alert = hrAlert(run, goal.maxHr ? goal.maxHr * 0.95 : HR_ALERT_BPM);
  const advice = nextDayAdvice(cmp, plan, alert);
  const newActuals = { ...actuals, [run.date]: (actuals[run.date] || 0) + run.km };
  return { comparison: cmp, alert, advice, text: feedbackText(cmp, advice),
           plan: adjustPlan(plan, newActuals, advice, { baselineKm }) };
}
