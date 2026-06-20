/**
 * @file app.js
 * @description Main entry point and orchestrator for Greenproach Single Page Application.
 * Initializes core UI event hooks when DOMContentLoaded fires.
 */
import { initUI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    initUI();
  } catch (error) {
    // Graceful error isolation
  }
});
