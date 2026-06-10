// App Orchestrator & Router Entry Point
import { initUI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    initUI();
  } catch (error) {
    console.error('Failed to initialize Greenproach:', error);
  }
});
