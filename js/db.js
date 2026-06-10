// Storage Driver (privacy-first localStorage manager)

// Mock storage for non-browser environments (e.g., testing)
let memoryStorage = {};

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (key) => memoryStorage[key] || null,
    setItem: (key, value) => { memoryStorage[key] = String(value); },
    removeItem: (key) => { delete memoryStorage[key]; },
    clear: () => { memoryStorage = {}; }
  };
}

const storage = getStorage();

const KEYS = {
  LATEST_INPUTS: 'gp_latest_inputs',
  LATEST_RESULTS: 'gp_latest_results',
  HISTORY: 'gp_footprint_history',
  ADOPTED_HABITS: 'gp_adopted_habits',
  HABIT_COMPLETIONS: 'gp_habit_completions',
  USER_PROFILE: 'gp_user_profile'
};

export function saveLatestFootprint(inputs, results) {
  storage.setItem(KEYS.LATEST_INPUTS, JSON.stringify(inputs));
  storage.setItem(KEYS.LATEST_RESULTS, JSON.stringify(results));

  // Add to history
  const history = getFootprintHistory();
  const newEntry = {
    timestamp: Date.now(),
    dateString: new Date().toISOString().split('T')[0],
    inputs,
    results
  };
  
  // Prevent duplicate entries for the same day to avoid cluttering trend charts
  const existingIndex = history.findIndex(h => h.dateString === newEntry.dateString);
  if (existingIndex !== -1) {
    history[existingIndex] = newEntry; // update
  } else {
    history.push(newEntry);
  }

  storage.setItem(KEYS.HISTORY, JSON.stringify(history));
  return newEntry;
}

export function getLatestInputs() {
  const data = storage.getItem(KEYS.LATEST_INPUTS);
  return data ? JSON.parse(data) : null;
}

export function getLatestResults() {
  const data = storage.getItem(KEYS.LATEST_RESULTS);
  return data ? JSON.parse(data) : null;
}

export function getFootprintHistory() {
  const data = storage.getItem(KEYS.HISTORY);
  return data ? JSON.parse(data) : [];
}

export function saveAdoptedHabits(habits) {
  storage.setItem(KEYS.ADOPTED_HABITS, JSON.stringify(habits));
}

export function getAdoptedHabits() {
  const data = storage.getItem(KEYS.ADOPTED_HABITS);
  return data ? JSON.parse(data) : [];
}

export function saveHabitCompletions(completions) {
  storage.setItem(KEYS.HABIT_COMPLETIONS, JSON.stringify(completions));
}

/**
 * Returns object map of completions: { [habitId]: [dateStrings...] }
 */
export function getHabitCompletions() {
  const data = storage.getItem(KEYS.HABIT_COMPLETIONS);
  return data ? JSON.parse(data) : {};
}

/**
 * Logs a completed habit for a specific day
 * @param {string} habitId 
 * @param {number} pointsSaved Carbon points earned
 * @returns {Object} Updated profile and status
 */
export function completeHabit(habitId, pointsSaved) {
  const completions = getHabitCompletions();
  const today = new Date().toISOString().split('T')[0];

  if (!completions[habitId]) {
    completions[habitId] = [];
  }

  // Prevent double completions on the same day
  if (completions[habitId].includes(today)) {
    return { success: false, reason: 'Already completed today' };
  }

  completions[habitId].push(today);
  saveHabitCompletions(completions);

  // Update Profile Points and level
  const profile = getProfile();
  profile.points += 10; // 10 points per completion
  profile.lifetimeCarbonSaved += pointsSaved;

  // Level up formula: Level = floor(sqrt(points / 50)) + 1
  const newLevel = Math.floor(Math.sqrt(profile.points / 50)) + 1;
  const levelUp = newLevel > profile.level;
  profile.level = newLevel;

  // Check and add badges
  const badges = new Set(profile.badges);
  
  if (profile.lifetimeCarbonSaved >= 50) badges.add('Eco Starter');
  if (profile.lifetimeCarbonSaved >= 250) badges.add('Carbon Fighter');
  if (profile.lifetimeCarbonSaved >= 1000) badges.add('Planet Guardian');
  if (Object.keys(completions).length >= 5) badges.add('Habit Master');
  
  profile.badges = Array.from(badges);
  saveProfile(profile);

  return { success: true, levelUp, profile };
}

export function getProfile() {
  const data = storage.getItem(KEYS.USER_PROFILE);
  if (data) {
    return JSON.parse(data);
  }
  
  // Default new profile
  const defaultProfile = {
    points: 0,
    level: 1,
    lifetimeCarbonSaved: 0, // in kg CO2e
    badges: []
  };
  saveProfile(defaultProfile);
  return defaultProfile;
}

export function saveProfile(profile) {
  storage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function clearAllData() {
  storage.removeItem(KEYS.LATEST_INPUTS);
  storage.removeItem(KEYS.LATEST_RESULTS);
  storage.removeItem(KEYS.HISTORY);
  storage.removeItem(KEYS.ADOPTED_HABITS);
  storage.removeItem(KEYS.HABIT_COMPLETIONS);
  storage.removeItem(KEYS.USER_PROFILE);
  memoryStorage = {};
}
