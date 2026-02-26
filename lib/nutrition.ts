export type FruitData = {
  id: string;
  name: string;
  shelfLifeDays: number;
  urgencyScore: number;
  slotsPerBag: number;
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
    slotsPerBag: 5,
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
    slotsPerBag: 5,
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
    slotsPerBag: 3,
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
    slotsPerBag: 3,
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
    slotsPerBag: 3,
    caloriesPer100g: 83,
    fiberG: 4.0,
    sugarG: 13.7,
    vitaminCMg: 10,
  },
  avocados: {
    id: "avocados",
    name: "Avocados",
    shelfLifeDays: 5,
    urgencyScore: 10,
    slotsPerBag: 4,
    caloriesPer100g: 160,
    fiberG: 6.7,
    sugarG: 0.7,
    vitaminCMg: 10,
  },
};

export function getShelfLifeLabel(fruitId: string): string {
  const data = FRUIT_DATA[fruitId];
  if (!data) return "";
  if (data.shelfLifeDays <= 5) return `Use within ${data.shelfLifeDays} days`;
  if (data.shelfLifeDays <= 14) return `Good for ~${data.shelfLifeDays} days`;
  return `Stays fresh ${data.shelfLifeDays}+ days`;
}
