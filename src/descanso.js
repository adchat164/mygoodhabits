// Coach de descanso (Assignment 2). Regla de Adolfo:
// "descanso si Body Battery < 40 o dormí < 6 h". Sin red: solo decide.
export const BB_MIN = 40;     // Body Battery mínimo para correr
export const SUENO_MIN = 6;   // horas mínimas de sueño para correr

// datos = { bodyBattery: número | null, suenoH: número | null }
export function decidirDescanso({ bodyBattery = null, suenoH = null } = {}) {
  const hayBB = typeof bodyBattery === "number";
  const haySueno = typeof suenoH === "number";
  if (!hayBB && !haySueno) {
    return { tipo: "sin-datos", texto: "No hay datos de Garmin hoy, sincroniza tu reloj" };
  }
  const razones = [];
  if (hayBB && bodyBattery < BB_MIN) razones.push(`Body Battery en ${Math.round(bodyBattery)}`);
  if (haySueno && suenoH < SUENO_MIN) razones.push(`dormiste ${Math.round(suenoH * 10) / 10} h`);
  if (razones.length) {
    return { tipo: "descansa", texto: `Hoy descansa: ${razones.join(" y ")}` };
  }
  const bien = [];
  if (hayBB) bien.push(`Body Battery en ${Math.round(bodyBattery)}`);
  if (haySueno) bien.push(`dormiste ${Math.round(suenoH * 10) / 10} h`);
  return { tipo: "corre", texto: `Hoy sí corre: ${bien.join(" y ")}` };
}
