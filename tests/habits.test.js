import { describe, test, expect } from 'vitest';
import { getRecommendations } from '../js/habits.js';

describe('Habits Recommendations Logic', () => {
  test('returns default recommendations for new users with empty footprints', () => {
    const emptyResults = { transport: 0, energy: 0, food: 0, lifestyle: 0, total: 0 };
    const recs = getRecommendations(emptyResults);

    expect(recs.highestCategory).toBe('none');
    expect(recs.insights.length).toBe(0);
    expect(recs.recommendedHabits.length).toBeGreaterThan(0);
  });

  test('prioritizes recommendations matching the highest carbon category', () => {
    // Case 1: Transport is highest emitter
    const transportResults = { transport: 5000, energy: 1000, food: 800, lifestyle: 200, total: 7000 };
    const recsTransport = getRecommendations(transportResults);

    expect(recsTransport.highestCategory).toBe('transport');
    expect(recsTransport.message).toContain('transportation');
    // The first recommended habit should be a transport habit
    expect(recsTransport.recommendedHabits[0].category).toBe('transport');

    // Case 2: Energy is highest emitter
    const energyResults = { transport: 500, energy: 4000, food: 1200, lifestyle: 500, total: 6200 };
    const recsEnergy = getRecommendations(energyResults);

    expect(recsEnergy.highestCategory).toBe('energy');
    expect(recsEnergy.message).toContain('energy');
    expect(recsEnergy.recommendedHabits[0].category).toBe('energy');
  });

  test('issues correct warnings and tips based on thresholds', () => {
    // High transport trigger (>3000 kg)
    const highTrans = getRecommendations({ transport: 4000, energy: 0, food: 0, lifestyle: 0, total: 4000 });
    const transWarning = highTrans.insights.find(i => i.text.includes('transport emissions'));
    expect(transWarning.type).toBe('warning');

    // Moderate/Low transport triggers success note
    const lowTrans = getRecommendations({ transport: 1500, energy: 0, food: 0, lifestyle: 0, total: 1500 });
    const transSuccess = lowTrans.insights.find(i => i.text.includes('moderate'));
    expect(transSuccess.type).toBe('success');
  });

  test('returns exactly 4 recommended habits for calculated footprint results', () => {
    const results = { transport: 1000, energy: 2000, food: 1500, lifestyle: 800, total: 5300 };
    const recs = getRecommendations(results);
    expect(recs.recommendedHabits.length).toBe(4);
  });
});
