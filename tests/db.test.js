import { describe, test, expect, beforeEach } from 'vitest';
import * as db from '../js/db.js';

describe('Storage Driver Database API', () => {
  beforeEach(() => {
    db.clearAllData();
  });

  test('saves and retrieves the latest calculation details', () => {
    const inputs = { carKm: '5000', diet: 'vegan' };
    const results = { transport: 850, energy: 0, food: 800, lifestyle: 0, total: 1650 };

    db.saveLatestFootprint(inputs, results);

    expect(db.getLatestInputs()).toEqual(inputs);
    expect(db.getLatestResults()).toEqual(results);
  });

  test('logs calculation details into history logs list', () => {
    const inputs = { carKm: '5000', diet: 'vegan' };
    const results = { transport: 850, energy: 0, food: 800, lifestyle: 0, total: 1650 };

    db.saveLatestFootprint(inputs, results);

    const history = db.getFootprintHistory();
    expect(history.length).toBe(1);
    expect(history[0].results).toEqual(results);
  });

  test('prevents multiple calculations on the same day from cluttering logs', () => {
    const inputs = { carKm: '5000' };
    const results1 = { total: 1000 };
    const results2 = { total: 1200 };

    // Simulating multiple saves on the same calendar day
    db.saveLatestFootprint(inputs, results1);
    db.saveLatestFootprint(inputs, results2);

    const history = db.getFootprintHistory();
    expect(history.length).toBe(1); // should override rather than duplicate
    expect(history[0].results.total).toBe(1200);
  });

  test('manages user profile points, level progression and badges correctly', () => {
    const initialProfile = db.getProfile();
    expect(initialProfile.level).toBe(1);
    expect(initialProfile.points).toBe(0);
    expect(initialProfile.lifetimeCarbonSaved).toBe(0);

    // Complete a habit saving 5 kg CO2e
    const res = db.completeHabit('bike_or_walk', 5.0);
    expect(res.success).toBe(true);
    expect(res.profile.points).toBe(10);
    expect(res.profile.lifetimeCarbonSaved).toBe(5.0);
    expect(res.profile.level).toBe(1); // floor(sqrt(10/50)) + 1 = 1

    // Complete it multiple times to test Level Up threshold
    // Level 2 requires points >= 50 (floor(sqrt(50/50)) + 1 = 2)
    // We complete it 4 more times to get to 50 points
    db.completeHabit('bike_or_walk', 5.0);
    db.completeHabit('bike_or_walk', 5.0);
    db.completeHabit('bike_or_walk', 5.0);
    
    // We mock today completion restrictions for testing if we want,
    // but the DB blocks duplicate calendar days.
    // Let's directly increment profile points in DB to test leveling progression
    const profile = db.getProfile();
    profile.points = 50;
    db.saveProfile(profile);

    // Run completion again which updates levels
    const nextRes = db.completeHabit('public_transit', 10.0);
    expect(nextRes.profile.points).toBe(60);
    expect(nextRes.profile.level).toBe(2); // level up should be active
  });

  test('locks badge unlocks under correct thresholds', () => {
    // 50 kg CO2e saved triggers Eco Starter badge
    const res1 = db.completeHabit('staycation', 50.0);
    expect(res1.profile.badges).toContain('Eco Starter');
    expect(res1.profile.badges).not.toContain('Carbon Fighter');

    // 250 kg CO2e saved triggers Carbon Fighter badge
    const res2 = db.completeHabit('public_transit', 200.0);
    expect(res2.profile.badges).toContain('Eco Starter');
    expect(res2.profile.badges).toContain('Carbon Fighter');
    expect(res2.profile.badges).not.toContain('Planet Guardian');
  });

  test('handles corrupted localStorage JSON data gracefully without throwing', () => {
    // Inject global window mock with throwing mock storage getters
    const originalWindow = global.window;
    global.window = {
      localStorage: {
        getItem: () => "invalid-json-string{",
        setItem: () => {},
        removeItem: () => {}
      }
    };

    expect(db.getLatestInputs()).toBeNull();
    expect(db.getLatestResults()).toBeNull();
    expect(db.getFootprintHistory()).toEqual([]);
    expect(db.getAdoptedHabits()).toEqual([]);
    expect(db.getHabitCompletions()).toEqual({});
    expect(db.getProfile().points).toBe(0); // should fall back to default profile

    // Restore original window context
    if (originalWindow) {
      global.window = originalWindow;
    } else {
      delete global.window;
    }
  });
});
