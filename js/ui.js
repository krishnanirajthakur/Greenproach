// UI Controller & DOM Orchestrator
import { calculateFootprint } from './calculator.js';
import { HABITS_DATABASE, getRecommendations } from './habits.js';
import * as db from './db.js';

// Quiz Database
const QUIZ_QUESTIONS = [
  {
    question: "Which of the following diets has the lowest annual carbon footprint impact?",
    options: ["Average Meat Diet", "Vegetarian Diet", "Vegan Diet", "High Meat Diet"],
    correctIndex: 2,
    explanation: "A vegan diet has the lowest carbon impact, averaging around 800 kg CO2e/year, compared to over 2,500 kg for high-meat diets."
  },
  {
    question: "To meet the Paris Agreement goals, what is the target average annual carbon footprint per person by 2050?",
    options: ["Under 2.0 tonnes", "Under 5.0 tonnes", "Under 10.0 tonnes", "0 tonnes (absolute zero)"],
    correctIndex: 0,
    explanation: "Scientists estimate that we need to keep individual footprints below 2.0 tonnes of CO2e per year to limit warming to 1.5°C."
  },
  {
    question: "What does 'Scope 1' emissions represent for an individual?",
    options: ["Emissions from clothes we buy", "Direct emissions from sources we own or control (e.g., fuel burned in our cars)", "Indirect emissions from electricity we purchase", "Emissions from food transit"],
    correctIndex: 1,
    explanation: "Scope 1 covers direct emissions from burning fossil fuels locally, such as driving a gasoline car or using gas for home heating."
  },
  {
    question: "Which mode of transit typically has the lowest greenhouse gas emissions per passenger-kilometer?",
    options: ["Electric Car", "Train", "Short-haul Flight", "Diesel Car"],
    correctIndex: 1,
    explanation: "Trains are highly efficient, emitting roughly 0.035 kg CO2e per passenger-kilometer, which is lower than even typical electric cars."
  },
  {
    question: "What is the primary action in the carbon mitigation hierarchy?",
    options: ["Offsetting emissions by planting trees", "Reducing energy consumption by 10%", "Avoiding emissions entirely where possible", "Buying electric appliances"],
    correctIndex: 2,
    explanation: "The hierarchy dictates we must first 'Avoid' emissions altogether, then 'Reduce' the remainder, and only 'Offset' what cannot be avoided."
  }
];

export function initUI() {
  setupNavigation();
  setupTheme();
  setupCalculatorForm();
  setupInsightsSimulator();
  setupQuiz();
  renderAll();
}

// 1. Navigation & Theme Toggle
function setupNavigation() {
  const buttons = document.querySelectorAll('nav.main-nav button');
  const sections = document.querySelectorAll('main section');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.id.replace('nav-', 'view-');
      
      // Update active nav button
      buttons.forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
      
      // Show target section
      sections.forEach(sec => {
        if (sec.id === targetId) {
          sec.classList.add('active');
          sec.removeAttribute('hidden');
        } else {
          sec.classList.remove('active');
          sec.setAttribute('hidden', 'true');
        }
      });

      // Render fresh view stats on switch
      renderAll();
    });
  });
}

function setupTheme() {
  const toggle = document.getElementById('theme-toggle');
  
  // Apply saved theme preference or system default
  const savedTheme = localStorage.getItem('gp_theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  toggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('gp_theme', newTheme);
  });
}

// 2. Main Render Function
export function renderAll() {
  renderProfile();
  renderDashboardCharts();
  renderHabitsList();
  renderInsights();
}

function renderProfile() {
  const profile = db.getProfile();
  
  // Dashboard view
  const welcomeMsg = document.getElementById('welcome-message');
  const results = db.getLatestResults();
  
  if (results) {
    welcomeMsg.textContent = `Level ${profile.level} Eco Champion!`;
    document.querySelector('.dashboard-hero-card .desc').textContent = 
      `Lifetime carbon saved: ${profile.lifetimeCarbonSaved.toFixed(1)} kg CO2e. You have unlocked ${profile.badges.length} badges!`;
  } else {
    welcomeMsg.textContent = `Welcome to Greenproach!`;
    document.querySelector('.dashboard-hero-card .desc').textContent = 
      "Take a carbon footprint audit to generate personalized insights.";
  }

  // Render Badges
  const badgesRow = document.getElementById('profile-badges-row');
  badgesRow.innerHTML = '';
  
  if (profile.badges.length === 0) {
    const defaultBadge = document.createElement('span');
    defaultBadge.className = 'badge-pill';
    defaultBadge.textContent = '🌱 Green Recruit';
    badgesRow.appendChild(defaultBadge);
  } else {
    profile.badges.forEach(badge => {
      const badgeSpan = document.createElement('span');
      badgeSpan.className = 'badge-pill';
      
      let icon = '🏅';
      if (badge === 'Eco Starter') icon = '🌱';
      if (badge === 'Carbon Fighter') icon = '⚡';
      if (badge === 'Planet Guardian') icon = '🌳';
      if (badge === 'Habit Master') icon = '💪';
      if (badge === 'Carbon Sage') icon = '🧠';

      badgeSpan.textContent = `${icon} ${badge}`;
      badgesRow.appendChild(badgeSpan);
    });
  }

  // Habits view
  const levelDisplay = document.getElementById('level-display');
  const pointsDisplay = document.getElementById('points-display');
  const lifetimeSavedDisplay = document.getElementById('lifetime-saved-display');
  
  if (levelDisplay) levelDisplay.textContent = profile.level;
  if (pointsDisplay) pointsDisplay.textContent = profile.points;
  if (lifetimeSavedDisplay) lifetimeSavedDisplay.textContent = profile.lifetimeCarbonSaved.toFixed(0);

  // Score Dial Update
  updateScoreDial(results ? results.total : 0);
}

function updateScoreDial(totalKg) {
  const tonnes = (totalKg / 1000).toFixed(1);
  const scoreVal = document.getElementById('score-value');
  const fillCircle = document.getElementById('score-fill');

  scoreVal.textContent = tonnes;

  // Paris Agreement Individual Target is 2.0 tonnes.
  // We set dial maximum scale to 15.0 tonnes.
  const maxTonnes = 15.0;
  const percentage = Math.min(tonnes / maxTonnes, 1);
  
  // Circumference of circle with r=100 is 2 * PI * 100 = 628
  const offset = 628 - (percentage * 628);
  fillCircle.style.strokeDashoffset = offset;

  // Color gradient adaptation
  if (tonnes <= 2.0) {
    fillCircle.style.stroke = 'var(--success)';
  } else if (tonnes <= 6.0) {
    fillCircle.style.stroke = 'var(--primary)';
  } else if (tonnes <= 10.0) {
    fillCircle.style.stroke = 'var(--warning)';
  } else {
    fillCircle.style.stroke = 'var(--danger)';
  }
}

// 3. Custom SVG Chart Renders (No Chart.js dependency!)
function renderDashboardCharts() {
  const results = db.getLatestResults();
  const history = db.getFootprintHistory();

  const categoryWrapper = document.getElementById('category-chart-wrapper');
  const historyWrapper = document.getElementById('history-chart-wrapper');

  // Chart 1: Donut breakdown
  if (!results || results.total === 0) {
    categoryWrapper.innerHTML = `<div class="score-label">Calculate your footprint to unlock your carbon breakdown.</div>`;
    document.getElementById('breakdown-total').textContent = '0 kg total';
  } else {
    document.getElementById('breakdown-total').textContent = `${(results.total / 1000).toFixed(1)} t total`;
    
    // Calculate category percentages
    const categories = [
      { name: 'Transport', val: results.transport, color: 'hsl(190, 80%, 40%)' },
      { name: 'Energy', val: results.energy, color: 'hsl(35, 90%, 55%)' },
      { name: 'Food', val: results.food, color: 'hsl(150, 80%, 40%)' },
      { name: 'Lifestyle', val: results.lifestyle, color: 'hsl(270, 75%, 60%)' }
    ].filter(c => c.val > 0);

    const total = categories.reduce((sum, c) => sum + c.val, 0);
    
    let svgContent = `<svg class="custom-svg-chart" viewBox="0 0 200 200" aria-label="Carbon category breakdown donut chart">`;
    
    const r = 60;
    const C = 2 * Math.PI * r; // 376.99
    let accumulatedLength = 0;

    categories.forEach(cat => {
      const percent = cat.val / total;
      const length = percent * C;
      const gap = C - length;
      const offset = -accumulatedLength;
      
      svgContent += `
        <circle cx="100" cy="100" r="${r}" stroke-width="20" fill="none"
          stroke="${cat.color}"
          stroke-dasharray="${length.toFixed(2)} ${gap.toFixed(2)}"
          stroke-dashoffset="${offset.toFixed(2)}"
          transform="rotate(-90 100 100)"
          style="transition: stroke-dashoffset 1s ease-in-out;">
          <title>${cat.name}: ${Math.round(percent * 100)}% (${(cat.val/1000).toFixed(2)} t)</title>
        </circle>
      `;
      accumulatedLength += length;
    });
    
    // Add inner white circle for donut hole and text label
    svgContent += `
      <circle cx="100" cy="100" r="45" fill="var(--bg-surface)" />
      <text x="100" y="98" text-anchor="middle" font-family="var(--font-display)" font-weight="800" font-size="16" fill="var(--text-primary)">Breakdown</text>
      <text x="100" y="115" text-anchor="middle" font-size="10" fill="var(--text-secondary)">By Category</text>
      </svg>
    `;

    // Add legend table
    let legendContent = `<div class="chart-legend">`;
    categories.forEach(cat => {
      const pct = Math.round((cat.val / total) * 100);
      let dotColorClass = '';
      if (cat.name === 'Transport') dotColorClass = 'color-transport';
      if (cat.name === 'Energy') dotColorClass = 'color-energy';
      if (cat.name === 'Food') dotColorClass = 'color-food';
      if (cat.name === 'Lifestyle') dotColorClass = 'color-lifestyle';

      legendContent += `
        <div class="legend-item">
          <span class="legend-color ${dotColorClass}"></span>
          <span>${cat.name} (${pct}%)</span>
        </div>
      `;
    });
    legendContent += `</div>`;

    categoryWrapper.innerHTML = `<div style="width:100%; display:flex; flex-direction:column; align-items:center;">${svgContent}${legendContent}</div>`;
  }

  // Chart 2: History logs
  if (history.length === 0) {
    historyWrapper.innerHTML = `<div class="score-label">No history logs. Calculate your carbon footprint to populate logs!</div>`;
    document.getElementById('history-count').textContent = '0 logs';
  } else {
    document.getElementById('history-count').textContent = `${history.length} logs`;
    
    // Limit to latest 6 logs for display spacing
    const displayLogs = history.slice(-6);
    const maxVal = Math.max(...displayLogs.map(l => l.results.total), 3000); // minimum scale peak at 3 tonnes
    
    const svgWidth = 400;
    const svgHeight = 180;
    const paddingLeft = 40;
    const paddingRight = 10;
    const paddingTop = 20;
    const paddingBottom = 30;
    
    const graphWidth = svgWidth - paddingLeft - paddingRight;
    const graphHeight = svgHeight - paddingTop - paddingBottom;

    let svgContent = `<svg class="custom-svg-chart" viewBox="0 0 ${svgWidth} ${svgHeight}" aria-label="Carbon history bar chart">`;
    
    // Draw background grid lines (3 levels)
    for (let i = 0; i <= 3; i++) {
      const yVal = paddingTop + (graphHeight / 3) * i;
      const label = ((maxVal / 1000) * (1 - i / 3)).toFixed(1);
      svgContent += `
        <line x1="${paddingLeft}" y1="${yVal}" x2="${svgWidth - paddingRight}" y2="${yVal}" stroke="var(--border-color)" stroke-width="1" stroke-dasharray="4,4" />
        <text x="${paddingLeft - 10}" y="${yVal + 4}" text-anchor="end" font-size="9" fill="var(--text-muted)">${label}t</text>
      `;
    }

    // Draw bars
    const barSpacing = graphWidth / displayLogs.length;
    const barWidth = Math.max(barSpacing * 0.6, 15);

    displayLogs.forEach((log, index) => {
      const pct = log.results.total / maxVal;
      const barHeight = pct * graphHeight;
      const x = paddingLeft + (index * barSpacing) + (barSpacing - barWidth) / 2;
      const y = svgHeight - paddingBottom - barHeight;
      
      // Formatting date (e.g. Jun 10)
      const dateParts = log.dateString.split('-');
      const shortDate = dateParts.length === 3 ? `${getMonthName(dateParts[1])} ${dateParts[2]}` : log.dateString;

      svgContent += `
        <g>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="var(--primary)" rx="4" ry="4">
            <title>Total: ${(log.results.total / 1000).toFixed(2)} t CO2e on ${log.dateString}</title>
          </rect>
          <text x="${x + barWidth / 2}" y="${svgHeight - 12}" text-anchor="middle" font-size="9" fill="var(--text-secondary)" transform="rotate(0 ${x + barWidth/2} ${svgHeight - 12})">${shortDate}</text>
        </g>
      `;
    });

    // Draw baseline axes
    svgContent += `
      <line x1="${paddingLeft}" y1="${svgHeight - paddingBottom}" x2="${svgWidth - paddingRight}" y2="${svgHeight - paddingBottom}" stroke="var(--border-color)" stroke-width="1.5" />
    </svg>`;

    historyWrapper.innerHTML = svgContent;
  }
}

function getMonthName(monthStr) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const idx = parseInt(monthStr, 10) - 1;
  return months[idx] || monthStr;
}

// 4. Calculator Form Tab Stepper
function setupCalculatorForm() {
  const form = document.getElementById('footprint-form');
  const tabs = document.querySelectorAll('.calc-tab');
  const steps = document.querySelectorAll('.form-step');
  const btnPrev = document.getElementById('btn-prev-step');
  const btnNext = document.getElementById('btn-next-step');
  const btnSubmit = document.getElementById('btn-submit-calc');

  let currentStepIndex = 0;

  // Load existing inputs if any to prefill
  const existingInputs = db.getLatestInputs();
  if (existingInputs) {
    Object.keys(existingInputs).forEach(key => {
      const field = form.elements[key];
      if (field) {
        field.value = existingInputs[key];
      }
    });
  }

  function showStep(index) {
    steps.forEach((step, idx) => {
      if (idx === index) {
        step.classList.add('active');
        step.removeAttribute('hidden');
      } else {
        step.classList.remove('active');
        step.setAttribute('hidden', 'true');
      }
    });

    tabs.forEach((tab, idx) => {
      if (idx === index) {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('tabindex', '0');
      } else {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
      }
    });

    currentStepIndex = index;

    // Button updates
    if (currentStepIndex === 0) {
      btnPrev.setAttribute('disabled', 'true');
    } else {
      btnPrev.removeAttribute('disabled');
    }

    if (currentStepIndex === steps.length - 1) {
      btnNext.style.display = 'none';
      btnSubmit.style.display = 'inline-flex';
    } else {
      btnNext.style.display = 'inline-flex';
      btnSubmit.style.display = 'none';
    }
  }

  // Bind next/prev button clicks
  btnNext.addEventListener('click', () => {
    if (currentStepIndex < steps.length - 1) {
      showStep(currentStepIndex + 1);
    }
  });

  btnPrev.addEventListener('click', () => {
    if (currentStepIndex > 0) {
      showStep(currentStepIndex - 1);
    }
  });

  // Bind tab clicks directly
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      showStep(index);
    });
  });

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Gather all inputs safely
    const formData = new FormData(form);
    const inputs = {};
    formData.forEach((val, key) => {
      inputs[key] = val;
    });

    // Run calculation
    const results = calculateFootprint(inputs);
    
    // Save to Database
    db.saveLatestFootprint(inputs, results);

    // Give user starter badge if this is their first calculation
    const profile = db.getProfile();
    if (!profile.badges.includes('Eco Starter')) {
      profile.badges.push('Eco Starter');
      db.saveProfile(profile);
    }

    // Go to dashboard view
    document.getElementById('nav-dashboard').click();
    showConfetti();
  });
}

// 5. Habits List & Completion logs
function renderHabitsList() {
  const container = document.getElementById('habits-container');
  if (!container) return;

  container.innerHTML = '';
  const adopted = db.getAdoptedHabits();
  const completions = db.getHabitCompletions();
  const today = new Date().toISOString().split('T')[0];

  HABITS_DATABASE.forEach(habit => {
    const isCompletedToday = completions[habit.id] && completions[habit.id].includes(today);
    
    const card = document.createElement('div');
    card.className = `glass-card habit-card ${isCompletedToday ? 'completed' : ''}`;
    
    const header = document.createElement('div');
    header.className = 'habit-header';

    const icon = document.createElement('div');
    icon.className = 'habit-icon';
    icon.textContent = habit.icon;

    const details = document.createElement('div');
    details.className = 'habit-details';
    
    const tag = document.createElement('span');
    tag.className = 'habit-category-tag';
    tag.textContent = habit.category;

    const title = document.createElement('h3');
    title.textContent = habit.title;

    details.appendChild(tag);
    details.appendChild(title);
    header.appendChild(icon);
    header.appendChild(details);

    const desc = document.createElement('p');
    desc.className = 'habit-desc';
    desc.textContent = habit.description;

    const footer = document.createElement('div');
    footer.className = 'habit-footer';

    const saving = document.createElement('span');
    saving.className = 'habit-saving';
    saving.textContent = `-${habit.carbonSavedPerDay} kg CO2e/day`;

    const actionBtn = document.createElement('button');
    actionBtn.className = 'habit-action-btn';
    actionBtn.textContent = isCompletedToday ? 'Completed Today ✓' : 'Complete Habit';
    if (isCompletedToday) {
      actionBtn.setAttribute('disabled', 'true');
    } else {
      actionBtn.addEventListener('click', () => {
        const result = db.completeHabit(habit.id, habit.carbonSavedPerDay);
        if (result.success) {
          showConfetti();
          renderAll(); // Refresh metrics instantly
          if (result.levelUp) {
            alert(`🎉 Level Up! You reached Level ${result.profile.level}!`);
          }
        }
      });
    }

    footer.appendChild(saving);
    footer.appendChild(actionBtn);

    card.appendChild(header);
    card.appendChild(desc);
    card.appendChild(footer);
    container.appendChild(card);
  });
}

// 6. Insights & What-If Simulation
function renderInsights() {
  const results = db.getLatestResults();
  const container = document.getElementById('recommendations-container');
  if (!container) return;

  const recData = getRecommendations(results);
  container.innerHTML = '';

  // Render message
  const msgP = document.createElement('p');
  msgP.style.fontWeight = '600';
  msgP.style.marginBottom = '16px';
  msgP.textContent = recData.message;
  container.appendChild(msgP);

  // Render dynamic list of insight points
  recData.insights.forEach(insight => {
    const item = document.createElement('div');
    item.className = `insight-item ${insight.type}`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'icon';
    if (insight.type === 'warning') iconSpan.textContent = '⚠️';
    if (insight.type === 'success') iconSpan.textContent = '✅';
    if (insight.type === 'info') iconSpan.textContent = 'ℹ️';

    const textP = document.createElement('p');
    textP.textContent = insight.text;

    item.appendChild(iconSpan);
    item.appendChild(textP);
    container.appendChild(item);
  });
}

function setupInsightsSimulator() {
  const simCar = document.getElementById('sim-car-commute');
  const simPlant = document.getElementById('sim-plant-meals');
  const simTherm = document.getElementById('sim-thermostat');
  const simFlights = document.getElementById('sim-flights');

  const lblCar = document.getElementById('val-sim-car-commute');
  const lblPlant = document.getElementById('val-sim-plant-meals');
  const lblTherm = document.getElementById('val-sim-thermostat');
  const lblFlights = document.getElementById('val-sim-flights');

  const lblSaved = document.getElementById('sim-saved-total');

  function calculateSimulation() {
    // 1. Car reduction: user reduces car driving by X km/week.
    // Carbon saved/year = km/week * 52 weeks * emission factor (petrol car default or current car)
    const kmSavedPerWeek = Number(simCar.value);
    const results = db.getLatestResults();
    const inputs = db.getLatestInputs();
    
    let carFactor = 0.170; // Petrol default
    if (inputs && inputs.carFuel) {
      if (inputs.carFuel === 'diesel') carFactor = 0.171;
      if (inputs.carFuel === 'hybrid') carFactor = 0.105;
      if (inputs.carFuel === 'electric') carFactor = 0.047;
    }
    const carSavings = kmSavedPerWeek * 52 * carFactor;
    lblCar.textContent = `${kmSavedPerWeek} km/week (-${carSavings.toFixed(0)} kg/yr)`;

    // 2. Vegetarian meals: user swaps N beef meals a week.
    // 1 beef meal carbon differential is roughly 2.5 kg CO2e.
    const plantMeals = Number(simPlant.value);
    const foodSavings = plantMeals * 52 * 2.5;
    lblPlant.textContent = `${plantMeals} meals/week (-${foodSavings.toFixed(0)} kg/yr)`;

    // 3. Thermostat: degrees reduced.
    // 1 degree saves 270 kg/year (heating season average).
    const thermShift = Number(simTherm.value);
    const thermSavings = thermShift * 270;
    lblTherm.textContent = thermShift > 0 ? `-${thermShift}°C (-${thermSavings} kg/yr)` : 'No shift';

    // 4. Flights: hours avoided.
    // 1 short-haul flight hour is 150 kg/hour
    const flightsAvoided = Number(simFlights.value);
    const flightSavings = flightsAvoided * 150;
    lblFlights.textContent = `${flightsAvoided} hours/year (-${flightSavings.toFixed(0)} kg/yr)`;

    const totalSaved = Math.round(carSavings + foodSavings + thermSavings + flightSavings);
    lblSaved.textContent = totalSaved;
  }

  [simCar, simPlant, simTherm, simFlights].forEach(slider => {
    slider.addEventListener('input', calculateSimulation);
  });

  // Run initial simulator calculations
  calculateSimulation();
}

// 7. Interactive Quiz Controller
function setupQuiz() {
  const container = document.getElementById('quiz-options-container');
  const questionText = document.getElementById('quiz-question-text');
  const quizCard = document.getElementById('quiz-card');
  const scoreContainer = document.getElementById('quiz-score-container');
  const questionBox = document.getElementById('quiz-question-container');
  const scoreText = document.getElementById('quiz-score-text');
  const btnRestart = document.getElementById('btn-restart-quiz');

  let currentQuestionIdx = 0;
  let score = 0;

  function loadQuestion(index) {
    if (index >= QUIZ_QUESTIONS.length) {
      // Show results
      questionBox.style.display = 'none';
      scoreContainer.style.display = 'block';
      scoreText.textContent = score;
      
      // Award badge if score is perfect
      if (score === QUIZ_QUESTIONS.length) {
        const profile = db.getProfile();
        if (!profile.badges.includes('Carbon Sage')) {
          profile.badges.push('Carbon Sage');
          db.saveProfile(profile);
          showConfetti();
          alert("🎓 Perfect score! You have earned the 'Carbon Sage' badge!");
        }
      }
      return;
    }

    const question = QUIZ_QUESTIONS[index];
    questionText.textContent = question.question;
    container.innerHTML = '';

    question.options.forEach((opt, idx) => {
      const optBtn = document.createElement('button');
      optBtn.className = 'quiz-option';
      optBtn.textContent = opt;

      optBtn.addEventListener('click', () => {
        // Disable other buttons
        const allBtns = container.querySelectorAll('button');
        allBtns.forEach(btn => btn.setAttribute('disabled', 'true'));

        // Feedback
        if (idx === question.correctIndex) {
          optBtn.classList.add('correct');
          score++;
        } else {
          optBtn.classList.add('incorrect');
          allBtns[question.correctIndex].classList.add('correct');
        }

        // Add explanation
        const explDiv = document.createElement('div');
        explDiv.className = 'score-label';
        explDiv.style.marginTop = '12px';
        explDiv.style.fontWeight = '600';
        explDiv.style.color = 'var(--text-primary)';
        explDiv.textContent = `Explanation: ${question.explanation}`;
        container.appendChild(explDiv);

        // Auto move to next question in 3.5 seconds
        setTimeout(() => {
          currentQuestionIdx++;
          loadQuestion(currentQuestionIdx);
        }, 3500);
      });

      container.appendChild(optBtn);
    });
  }

  btnRestart.addEventListener('click', () => {
    currentQuestionIdx = 0;
    score = 0;
    questionBox.style.display = 'block';
    scoreContainer.style.display = 'none';
    loadQuestion(0);
  });

  loadQuestion(0);
}

// 8. Interactive UI Visual Confetti (Micro-animation)
function showConfetti() {
  const canvas = document.createElement('div');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  canvas.style.overflow = 'hidden';
  document.body.appendChild(canvas);

  const colors = ['#14b872', '#00f2fe', '#4facfe', '#00c6ff', '#f9d423'];

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.style.position = 'absolute';
    piece.style.width = `${Math.random() * 8 + 6}px`;
    piece.style.height = `${Math.random() * 12 + 6}px`;
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.top = `-20px`;
    piece.style.opacity = Math.random().toString();
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.borderRadius = '2px';
    canvas.appendChild(piece);

    // Animate falling down
    const duration = Math.random() * 2 + 1.5;
    const horizontalDrift = Math.random() * 100 - 50;

    piece.animate([
      { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${horizontalDrift}px, 105vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
    ], {
      duration: duration * 1000,
      easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
      fill: 'forwards'
    });
  }

  // Cleanup canvas after animation completes
  setTimeout(() => {
    canvas.remove();
  }, 4000);
}
