// Carbon Footprint Calculation Engine (EPA & DEFRA based)

export const EMISSION_FACTORS = {
  car: {
    petrol: 0.170,   // kg CO2e / km
    diesel: 0.171,   // kg CO2e / km
    hybrid: 0.105,   // kg CO2e / km
    electric: 0.047  // kg CO2e / km
  },
  bus: 0.096,        // kg CO2e / km
  train: 0.035,      // kg CO2e / km
  flight: {
    short: 150.0,    // kg CO2e / hour (< 3 hours)
    long: 250.0      // kg CO2e / hour (>= 3 hours)
  },
  electricity: 0.385, // kg CO2e / kWh
  gas: 0.180,         // kg CO2e / kWh
  waste: 0.45,        // kg CO2e / kg
  diet: {
    vegan: 800.0,      // kg CO2e / year
    vegetarian: 1200.0, // kg CO2e / year
    average: 1900.0,    // kg CO2e / year
    "high-meat": 2500.0 // kg CO2e / year
  },
  clothing: 12.5,     // kg CO2e / item
  electronics: 80.0   // kg CO2e / item
};

/**
 * Calculates annual carbon footprint by category (in kg CO2e/year)
 * @param {Object} inputs User inputs
 * @returns {Object} Calculated footprints { transport, energy, food, lifestyle, total }
 */
export function calculateFootprint(inputs) {
  const safeInputs = inputs || {};
  // 1. Transportation
  const carKm = Number(safeInputs.carKm) || 0;
  const carFuel = safeInputs.carFuel || 'petrol';
  const carFactor = EMISSION_FACTORS.car[carFuel] || EMISSION_FACTORS.car.petrol;
  const carEmissions = carKm * carFactor;

  const busKm = Number(safeInputs.busKm) || 0;
  const busEmissions = busKm * EMISSION_FACTORS.bus;

  const trainKm = Number(safeInputs.trainKm) || 0;
  const trainEmissions = trainKm * EMISSION_FACTORS.train;

  const flightShort = Number(safeInputs.flightShort) || 0;
  const flightShortEmissions = flightShort * EMISSION_FACTORS.flight.short;

  const flightLong = Number(safeInputs.flightLong) || 0;
  const flightLongEmissions = flightLong * EMISSION_FACTORS.flight.long;

  const transport = carEmissions + busEmissions + trainEmissions + flightShortEmissions + flightLongEmissions;

  // 2. Home Energy
  const elecMonthly = Number(safeInputs.electricity) || 0; // monthly kWh
  const elecEmissions = elecMonthly * 12 * EMISSION_FACTORS.electricity;

  const gasMonthly = Number(safeInputs.gas) || 0; // monthly kWh
  const gasEmissions = gasMonthly * 12 * EMISSION_FACTORS.gas;

  const wasteWeekly = Number(safeInputs.waste) || 0; // weekly kg
  const rawWasteEmissions = wasteWeekly * 52 * EMISSION_FACTORS.waste;
  
  // Recycling reduction: scales up to 50% max reduction based on recycle rate
  const recycleRate = Math.min(Math.max(Number(safeInputs.recycleRate) || 0, 0), 100);
  const wasteEmissions = rawWasteEmissions * (1 - (recycleRate / 100) * 0.5);

  const energy = elecEmissions + gasEmissions + wasteEmissions;

  // 3. Food
  const dietType = safeInputs.diet || 'average';
  const food = EMISSION_FACTORS.diet[dietType] || EMISSION_FACTORS.diet.average;

  // 4. Lifestyle & Shopping
  const clothingItems = Number(safeInputs.clothing) || 0; // items / year
  const clothingEmissions = clothingItems * EMISSION_FACTORS.clothing;

  const electronicsItems = Number(safeInputs.electronics) || 0; // items / year
  const electronicsEmissions = electronicsItems * EMISSION_FACTORS.electronics;

  const lifestyle = clothingEmissions + electronicsEmissions;

  const total = transport + energy + food + lifestyle;

  return {
    transport: Math.round(transport),
    energy: Math.round(energy),
    food: Math.round(food),
    lifestyle: Math.round(lifestyle),
    total: Math.round(total)
  };
}
