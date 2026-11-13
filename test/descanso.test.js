import { describe, it, expect } from "vitest";
import { decidirDescanso } from "../src/descanso.js";

describe("coach de descanso", () => {
  it("Body Battery 30 → descansa y dice el dato", () => {
    expect(decidirDescanso({ bodyBattery: 30, suenoH: 7.5 }))
      .toEqual({ tipo: "descansa", texto: "Hoy descansa: Body Battery en 30" });
  });
  it("dormí 5 h aunque Body Battery esté bien → descansa", () => {
    expect(decidirDescanso({ bodyBattery: 80, suenoH: 5 }).tipo).toBe("descansa");
  });
  it("las dos cosas mal → dice las dos razones", () => {
    expect(decidirDescanso({ bodyBattery: 20, suenoH: 4 }).texto)
      .toBe("Hoy descansa: Body Battery en 20 y dormiste 4 h");
  });
  it("todo bien → corre", () => {
    expect(decidirDescanso({ bodyBattery: 75, suenoH: 7 }))
      .toEqual({ tipo: "corre", texto: "Hoy sí corre: Body Battery en 75 y dormiste 7 h" });
  });
  it("justo en el límite (40 y 6 h) → corre", () => {
    expect(decidirDescanso({ bodyBattery: 40, suenoH: 6 }).tipo).toBe("corre");
  });
  it("sin datos → avisa", () => {
    expect(decidirDescanso({}).texto).toBe("No hay datos de Garmin hoy, sincroniza tu reloj");
  });
});
