// Static fruit data for the planner's shelf-life scheduling and nutrition display.
// urgencyScore: 1-10. Higher = must be used sooner in the week.
// shelfLifeDays: realistic refrigerated shelf life from purchase date.

export type FruitData = {
  id: string;
  name: string;
  shelfLifeDays: number;
  urgencyScore: number;   // drives the planner algorithm — avocados always go first
  caloriesPer100g: number;
  fiberG: number;
  sugarG: number;
  vitaminCMg: number;
};

export const FRUIT_DATA: Record<string, FruitData> = {
  "naval-oranges": {
    id: "naval-oranges",
    name: "Naval Oranges",
    shelfLifeDays: 14,
    urgencyScore: 3,
    caloriesPer100g: 47,
    fiberG: 2.4,
    sugarG: 9.4,
    vitaminCMg: 53,
  },
  "blood-oranges": {
    id: "blood-oranges",
    name: "Blood Oranges",
    shelfLifeDays: 14,
    urgencyScore: 3,
    caloriesPer100g: 50,
    fiberG: 2.2,
    sugarG: 8.6,
    vitaminCMg: 50,
  },
  lemons: {
    id: "lemons",
    name: "Lemons",
    shelfLifeDays: 21,
    urgencyScore: 2,
    caloriesPer100g: 29,
    fiberG: 2.8,
    sugarG: 2.5,
    vitaminCMg: 53,
  },
  limes: {
    id: "limes",
    name: "Limes",
    shelfLifeDays: 21,
    urgencyScore: 2,
    caloriesPer100g: 30,
    fiberG: 2.8,
    sugarG: 1.7,
    vitaminCMg: 29,
  },
  pomegranates: {
    id: "pomegranates",
    name: "Pomegranates",
    shelfLifeDays: 30,
    urgencyScore: 1,
    caloriesPer100g: 83,
    fiberG: 4.0,
    sugarG: 13.7,
    vitaminCMg: 10,
  },
  avocados: {
    id: "avocados",
    name: "Avocados",
    shelfLifeDays: 5,   // ripened avocados — use fast
    urgencyScore: 10,   // highest urgency, always scheduled days 1-3
    caloriesPer100g: 160,
    fiberG: 6.7,
    sugarG: 0.7,
    vitaminCMg: 10,
  },
};

// Returns a human-readable shelf-life warning for the planner UI.
// e.g. "Use within 5 days" for avocados
export function getShelfLifeLabel(fruitId: string): string {
  const data = FRUIT_DATA[fruitId];
  if (!data) return "";
  if (data.shelfLifeDays <= 5) return `Use within ${data.shelfLifeDays} days`;
  if (data.shelfLifeDays <= 14) return `Good for ~${data.shelfLifeDays} days`;
  return `Stays fresh ${data.shelfLifeDays}+ days`;
}
