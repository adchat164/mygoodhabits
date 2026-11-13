import { describe, it, expect } from "vitest";
import { datosGarmin } from "../src/garmin-datos.js";

describe("datos de Garmin para los anillos", () => {
  it("convierte sueño, pasos, ejercicio y Body Battery", () => {
    const resumen = { bodyBatteryMostRecentValue: 73, totalSteps: 8421, moderateIntensityMinutes: 20, vigorousIntensityMinutes: 15 };
    const sueno = { sleepTimeSeconds: 31680, sleepStartTimestampLocal: Date.UTC(2026,10,12,23,10), sleepEndTimestampLocal: Date.UTC(2026,10,13,8,0) };
    expect(datosGarmin(resumen, sueno)).toEqual({
      bodyBattery: 73, suenoH: 8.8, acostarse: "23:10", despertar: "08:00", pasos: 8421, ejercicioMin: 35,
    });
  });
  it("sin datos → todo null, sin error", () => {
    expect(datosGarmin(null, null)).toEqual({
      bodyBattery: null, suenoH: null, acostarse: null, despertar: null, pasos: null, ejercicioMin: null,
    });
  });
});
