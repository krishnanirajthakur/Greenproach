import { describe, test, expect } from 'vitest';
import { calculateFootprint, EMISSION_FACTORS } from '../js/calculator.js';

describe('Carbon Calculator Formulas', () => {
  test('handles zero/empty inputs correctly', () => {
    const inputs = {};
    const result = calculateFootprint(inputs);
    
    // Food is average diet by default if not specified
    expect(result.food).toBe(EMISSION_FACTORS.diet.average);
    expect(result.transport).toBe(0);
    expect(result.energy).toBe(0);
    expect(result.lifestyle).toBe(0);
    expect(result.total).toBe(EMISSION_FACTORS.diet.average);
  });

  test('calculates transport emissions correctly by fuel type', () => {
    const inputsPetrol = { carKm: 10000, carFuel: 'petrol' };
    const resPetrol = calculateFootprint(inputsPetrol);
    // 10000 * 0.170 = 1700
    expect(resPetrol.transport).toBe(1700);

    const inputsEV = { carKm: 10000, carFuel: 'electric' };
    const resEV = calculateFootprint(inputsEV);
    // 10000 * 0.047 = 470
    expect(resEV.transport).toBe(470);
  });

  test('calculates flights and transit correctly', () => {
    const inputs = {
      busKm: 1000,       // 1000 * 0.096 = 96
      trainKm: 2000,     // 2000 * 0.035 = 70
      flightShort: 10,   // 10 * 150 = 1500
      flightLong: 5      // 5 * 250 = 1250
    };
    const res = calculateFootprint(inputs);
    // 96 + 70 + 1500 + 1250 = 2916
    expect(res.transport).toBe(2916);
  });

  test('calculates energy and recycling waste savings correctly', () => {
    const inputsWithoutRecycle = {
      electricity: 200, // 200 * 12 * 0.385 = 924
      gas: 300,         // 300 * 12 * 0.180 = 648
      waste: 10,        // 10 * 52 * 0.45 = 234
      recycleRate: 0    // no deduction
    };
    const resNoRecycle = calculateFootprint(inputsWithoutRecycle);
    expect(resNoRecycle.energy).toBe(924 + 648 + 234); // 1806

    const inputsWithRecycle = {
      electricity: 200,
      gas: 300,
      waste: 10,
      recycleRate: 50 // 50% * 0.5 = 25% reduction on waste: 234 * 0.75 = 175.5 -> rounds to 176
    };
    const resWithRecycle = calculateFootprint(inputsWithRecycle);
    expect(resWithRecycle.energy).toBe(924 + 648 + 176); // 1748
  });

  test('applies waste recycling reduction cap at 50%', () => {
    const inputsHighRecycle = {
      waste: 10,        // 10 * 52 * 0.45 = 234
      recycleRate: 100  // 100% * 0.5 = 50% max reduction -> 234 * 0.5 = 117
    };
    const resHigh = calculateFootprint(inputsHighRecycle);
    expect(resHigh.energy).toBe(117);

    const inputsOverRecycle = {
      waste: 10,
      recycleRate: 150  // capped at 100% -> 50% max reduction -> 117
    };
    const resOver = calculateFootprint(inputsOverRecycle);
    expect(resOver.energy).toBe(117);
  });

  test('calculates lifestyle purchasing impact correctly', () => {
    const inputs = {
      clothing: 10,    // 10 * 12.5 = 125
      electronics: 2   // 2 * 80 = 160
    };
    const res = calculateFootprint(inputs);
    expect(res.lifestyle).toBe(285);
  });

  test('handles null or undefined inputs parameter gracefully', () => {
    const resultNull = calculateFootprint(null);
    expect(resultNull.food).toBe(EMISSION_FACTORS.diet.average);
    expect(resultNull.total).toBe(EMISSION_FACTORS.diet.average);

    const resultUndefined = calculateFootprint(undefined);
    expect(resultUndefined.food).toBe(EMISSION_FACTORS.diet.average);
    expect(resultUndefined.total).toBe(EMISSION_FACTORS.diet.average);
  });
});
