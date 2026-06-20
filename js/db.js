/**
 * @file db.js
 * @description Storage driver for Greenproach. Manages persistence of calculations history,
 * completed habits, and gamification points in localStorage with in-memory fallback.
 */

// Mock storage for non-browser environments (e.g., testing)
let memoryStorage = {};

/**
 * Retrieves the appropriate storage driver (localStorage or memory fallback)
 * @returns {Storage|Object} Storage interface
 */
function getStorage() {
  if (typeof window !== "undefined" && window.localStorage) {
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

/**
 * Storage key constants
 * @type {Object<string, string>}
 */
const KEYS = {
  LATEST_INPUTS: "gp_latest_inputs",
  LATEST_RESULTS: "gp_latest_results",
  HISTORY: "gp_footprint_history",
  ADOPTED_HABITS: "gp_adopted_habits",
  HABIT_COMPLETIONS: "gp_habit_completions",
  USER_PROFILE: "gp_user_profile"
};

/**
 * Saves the latest footprint inputs and results to storage and history logs.
 * @param {Object} inputs User input answers
 * @param {Object} results Category footprints and total emissions
 * @returns {Object} Newly created history log entry
 */
export function saveLatestFootprint(inputs, results) {
  storage.setItem(KEYS.LATEST_INPUTS, JSON.stringify(inputs));
  storage.setItem(KEYS.LATEST_RESULTS, JSON.stringify(results));

  const history = getFootprintHistory();
  const newEntry = {
    timestamp: Date.now(),
    dateString: new Date().toISOString().split("T")[0],
    inputs,
    results
  };
  
  const existingIndex = history.findIndex(h => h.dateString === newEntry.dateString);
  if (existingIndex !== -1) {
    history[existingIndex] = newEntry;
  } else {
    history.push(newEntry);
  }

  storage.setItem(KEYS.HISTORY, JSON.stringify(history));
  return newEntry;
}

/**
 * Retrieves the user's latest calculation input values.
 * @returns {Object|null} Form inputs or null if none exist
 */
export function getLatestInputs() {
  try {
    const data = storage.getItem(KEYS.LATEST_INPUTS);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Retrieves the user's latest calculation emission results.
 * @returns {Object|null} Category carbon results or null
 */
export function getLatestResults() {
  try {
    const data = storage.getItem(KEYS.LATEST_RESULTS);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Retrieves the array of historical footprint entries.
 * @returns {Array<Object>} Calculation history entries list
 */
export function getFootprintHistory() {
  try {
    const data = storage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Saves the list of adopted habit IDs.
 * @param {Array<string>} habits List of habit IDs
 */
export function saveAdoptedHabits(habits) {
  storage.setItem(KEYS.ADOPTED_HABITS, JSON.stringify(habits));
}

/**
 * Retrieves the list of adopted habit IDs.
 * @returns {Array<string>} Adopted habit IDs
 */
export function getAdoptedHabits() {
  try {
    const data = storage.getItem(KEYS.ADOPTED_HABITS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Saves the habit completions calendar map.
 * @param {Object<string, Array<string>>} completions Habit completions mapping
 */
export function saveHabitCompletions(completions) {
  storage.setItem(KEYS.HABIT_COMPLETIONS, JSON.stringify(completions));
}

/**
 * Retrieves the habit completions calendar map.
 * @returns {Object<string, Array<string>>} Habit completions mapped by ID
 */
export function getHabitCompletions() {
  try {
    const data = storage.getItem(KEYS.HABIT_COMPLETIONS);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Logs a completed habit for a specific day and awards profile points.
 * @param {string} habitId Unique habit ID string
 * @param {number} pointsSaved Estimated carbon reduction in kg
 * @returns {Object} Updated profile metrics and completion success status
 */
export function completeHabit(habitId, pointsSaved) {
  const completions = getHabitCompletions();
  const today = new Date().toISOString().split("T")[0];

  if (!completions[habitId]) {
    completions[habitId] = [];
  }

  if (completions[habitId].includes(today)) {
    return { success: false, reason: "Already completed today" };
  }

  completions[habitId].push(today);
  saveHabitCompletions(completions);

  const profile = getProfile();
  profile.points += 10;
  
  const savedVal = Number(pointsSaved) || 0;
  profile.lifetimeCarbonSaved += savedVal;

  const newLevel = Math.floor(Math.sqrt(profile.points / 50)) + 1;
  const levelUp = newLevel > profile.level;
  profile.level = newLevel;

  const badges = new Set(profile.badges);
  
  if (profile.lifetimeCarbonSaved >= 50) badges.add("Eco Starter");
  if (profile.lifetimeCarbonSaved >= 250) badges.add("Carbon Fighter");
  if (profile.lifetimeCarbonSaved >= 1000) badges.add("Planet Guardian");
  if (Object.keys(completions).length >= 5) badges.add("Habit Master");
  
  profile.badges = Array.from(badges);
  saveProfile(profile);

  return { success: true, levelUp, profile };
}

/**
 * Retrieves the user profile state, initializing a default profile if none exists.
 * @returns {Object} User profile details containing points, level, lifetime savings, and badges
 */
export function getProfile() {
  try {
    const data = storage.getItem(KEYS.USER_PROFILE);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    // Fail silently, initialize default profile below
  }
  
  const defaultProfile = {
    points: 0,
    level: 1,
    lifetimeCarbonSaved: 0,
    badges: []
  };
  saveProfile(defaultProfile);
  return defaultProfile;
}

/**
 * Saves user profile details to storage.
 * @param {Object} profile User profile details
 */
export function saveProfile(profile) {
  storage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

/**
 * Clears all local storage records and resets database states.
 */
export function clearAllData() {
  storage.removeItem(KEYS.LATEST_INPUTS);
  storage.removeItem(KEYS.LATEST_RESULTS);
  storage.removeItem(KEYS.HISTORY);
  storage.removeItem(KEYS.ADOPTED_HABITS);
  storage.removeItem(KEYS.HABIT_COMPLETIONS);
  storage.removeItem(KEYS.USER_PROFILE);
  memoryStorage = {};
}
