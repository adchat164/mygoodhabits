// Convierte las respuestas de la Garmin Personal API a lo que usa MyGoodHabits.
// resumen = /usersummary-service/usersummary/daily, sueno = /sleep-service/sleep/dailySleep
const num = v => (typeof v === "number" && isFinite(v) ? v : null);
// Las marcas *Local de Garmin son la hora local escrita como si fuera UTC.
const hora = ms => (num(ms) == null ? null : new Date(ms).toISOString().slice(11, 16));

export function datosGarmin(resumen, sueno) {
  const s = sueno?.dailySleepDTO ?? sueno ?? {};
  const seg = num(s.sleepTimeSeconds);
  const mod = num(resumen?.moderateIntensityMinutes), vig = num(resumen?.vigorousIntensityMinutes);
  return {
    bodyBattery: num(resumen?.bodyBatteryMostRecentValue),
    suenoH: seg == null ? null : Math.round((seg / 3600) * 10) / 10,
    acostarse: hora(s.sleepStartTimestampLocal),
    despertar: hora(s.sleepEndTimestampLocal),
    pasos: num(resumen?.totalSteps),
    ejercicioMin: mod == null && vig == null ? null : (mod || 0) + (vig || 0),
  };
}
