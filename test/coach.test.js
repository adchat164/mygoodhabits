import { test, expect } from "vitest";
import { addDays, weekKm, enforceTenPercent, planDay, compare, processActivity, HR_MESSAGE } from "../src/coach.js";

// Plan "agresivo" como el que podría proponer la IA: 4 carreras por semana, sube ~25% cada semana.
function aggressivePlan(start, weeks){
  return { weeks: Array.from({ length: weeks }, (_, w) => ({
    kind: w === weeks - 1 ? "taper" : "build",
    days: Array.from({ length: 7 }, (_, i) => {
      const km = [6, 0, 6, 0, 6, 0, 10][i] * Math.pow(1.25, w);
      return { date: addDays(start, w * 7 + i), km: Math.round(km * 10) / 10, kind: km ? (i === 6 ? "long" : "easy") : "rest" };
    }),
  })) };
}

const START = "2026-11-09";
const goal = { race: "medio maratón", date: addDays(START, 69), targetTime: "2:00:00" };
const strava = (o = {}) => ({ id: 1, type: "Run", start_date: START + "T07:00:00Z", start_date_local: START + "T07:00:00", distance: 8000, moving_time: 2700, average_heartrate: 150, ...o });

test("medio maratón en 10 semanas: 10 semanas y nunca sube más de 10%", () => {
  const plan = enforceTenPercent(aggressivePlan(START, 10), { baselineKm: 25 });
  expect(plan.weeks).toHaveLength(10);
  expect(weekKm(plan.weeks[0])).toBeLessThanOrEqual(25 * 1.1);
  for(let i = 1; i < plan.weeks.length; i++)
    expect(weekKm(plan.weeks[i])).toBeLessThanOrEqual(weekKm(plan.weeks[i - 1]) * 1.1 + 1e-9);
});

test("tocaban 6 y corrí 8: lo dice y recomienda descansar mañana", () => {
  const plan = enforceTenPercent(aggressivePlan(START, 10));
  expect(planDay(plan, START).km).toBe(6);
  const r = processActivity({ goal, stravaConnected: true, plan }, strava());
  expect(r.comparison.status).toBe("over");
  expect(r.text).toContain("8 km");
  expect(r.text).toContain("6 km");
  expect(r.text).toContain("Mañana descansa");
  expect(r.advice).toMatchObject({ date: addDays(START, 1), km: 0, reason: "over" });
});

test("sin Strava o sin meta no pasa nada y no truena", () => {
  const plan = aggressivePlan(START, 10);
  expect(processActivity({ goal, stravaConnected: false, plan }, strava())).toBeNull();
  expect(processActivity({ goal: null, stravaConnected: true, plan }, strava())).toBeNull();
  expect(processActivity({ goal: null, stravaConnected: false, plan: null }, strava())).toBeNull();
});

test("bici o gym no generan retroalimentación", () => {
  const plan = aggressivePlan(START, 10);
  for(const type of ["Ride", "WeightTraining", "Workout"])
    expect(processActivity({ goal, stravaConnected: true, plan }, strava({ type }))).toBeNull();
});

test("pulso muy alto: solo descansar y ver a un médico", () => {
  const plan = aggressivePlan(START, 10);
  const r = processActivity({ goal, stravaConnected: true, plan }, strava({ distance: 6000, average_heartrate: 195 }));
  expect(r.alert).toBe(true);
  expect(r.text).toBe(HR_MESSAGE);
  expect(r.advice.km).toBe(0);
});

test("si se queda corto no compensa y el plan sigue respetando el 10%", () => {
  const plan = enforceTenPercent(aggressivePlan(START, 10));
  const r = processActivity({ goal, stravaConnected: true, plan }, strava({ distance: 3000 }));
  expect(r.comparison.status).toBe("under");
  expect(r.advice.km).toBe(planDay(plan, addDays(START, 1)).km);
  expect(r.text).toContain("No intentes reponer");
  for(let i = 1; i < r.plan.weeks.length; i++)
    expect(weekKm(r.plan.weeks[i])).toBeLessThanOrEqual(weekKm(r.plan.weeks[i - 1]) * 1.1 + 1e-9);
});

test("al pasarse, el plan ajustado registra lo real y pone descanso mañana", () => {
  const plan = enforceTenPercent(aggressivePlan(START, 10));
  const r = processActivity({ goal, stravaConnected: true, plan }, strava({ distance: 9000 }));
  expect(planDay(r.plan, START)).toMatchObject({ km: 9, done: true });
  expect(planDay(r.plan, addDays(START, 1)).km).toBe(0);
  for(let i = 1; i < r.plan.weeks.length; i++)
    expect(weekKm(r.plan.weeks[i])).toBeLessThanOrEqual(weekKm(r.plan.weeks[i - 1]) * 1.1 + 1e-9);
});

test("día de descanso en el plan y salió a correr cuenta como exceso", () => {
  const plan = aggressivePlan(START, 10);
  const c = compare(planDay(plan, addDays(START, 1)), { date: addDays(START, 1), km: 5 });
  expect(c.status).toBe("over");
});
