// Habits Database and Recommendation Engine

export const HABITS_DATABASE = [
  {
    id: 'bike_or_walk',
    title: 'Walk or Cycle for Short Trips',
    description: 'Avoid driving for trips under 3 km. Walk or cycle instead.',
    category: 'transport',
    carbonSavedPerDay: 2.5, // kg CO2e saved per trip
    icon: '🚲'
  },
  {
    id: 'public_transit',
    title: 'Take Public Transit',
    description: 'Use the bus or train instead of driving your car to work or school.',
    category: 'transport',
    carbonSavedPerDay: 5.0, // kg CO2e saved
    icon: '🚌'
  },
  {
    id: 'staycation',
    title: 'Vacation Locally',
    description: 'Swap a short-haul flight for a local train trip or staycation.',
    category: 'transport',
    carbonSavedPerDay: 15.0, // kg CO2e saved (simulated average per flight hour offset)
    icon: '🏕️'
  },
  {
    id: 'led_bulbs',
    title: 'Switch to LED Lighting',
    description: 'Replace remaining incandescent bulbs in your home with energy-efficient LEDs.',
    category: 'energy',
    carbonSavedPerDay: 0.8,
    icon: '💡'
  },
  {
    id: 'lower_thermostat',
    title: 'Lower Thermostat by 1°C',
    description: 'Lower your heating thermostat by just 1°C during winter to save heating energy.',
    category: 'energy',
    carbonSavedPerDay: 1.5,
    icon: '🌡️'
  },
  {
    id: 'line_dry',
    title: 'Line Dry Clothes',
    description: 'Dry your laundry on a drying rack or clothesline instead of using a tumble dryer.',
    category: 'energy',
    carbonSavedPerDay: 1.2,
    icon: '☀️'
  },
  {
    id: 'meatless_monday',
    title: 'Plant-Based Day',
    description: 'Eat entirely vegan or vegetarian meals today to reduce livestock farming demand.',
    category: 'food',
    carbonSavedPerDay: 3.5,
    icon: '🥗'
  },
  {
    id: 'reduce_food_waste',
    title: 'Zero Food Waste Day',
    description: 'Plan meals carefully to ensure zero edible food is thrown away today.',
    category: 'food',
    carbonSavedPerDay: 1.0,
    icon: '🍽️'
  },
  {
    id: 'local_produce',
    title: 'Buy Local Food',
    description: 'Choose ingredients grown or produced within your region to minimize food miles.',
    category: 'food',
    carbonSavedPerDay: 0.6,
    icon: '🍎'
  },
  {
    id: 'second_hand',
    title: 'Buy Second-Hand Clothes',
    description: 'Shop thrift, vintage, or online resale shops instead of buying brand new clothes.',
    category: 'lifestyle',
    carbonSavedPerDay: 4.0, // savings compared to average new clothing footprint
    icon: '👕'
  },
  {
    id: 'unplug_electronics',
    title: 'Unplug Standby Devices',
    description: 'Turn off power strips and unplug chargers and appliances when not in use.',
    category: 'energy',
    carbonSavedPerDay: 0.5,
    icon: '🔌'
  },
  {
    id: 'reusable_bags',
    title: 'Zero Single-Use Plastics',
    description: 'Bring reusable grocery bags, water bottles, and travel mugs everywhere.',
    category: 'lifestyle',
    carbonSavedPerDay: 0.3,
    icon: '🛍️'
  }
];

/**
 * Returns customized recommendations and carbon insights based on footprint results.
 * @param {Object} results Category footprints { transport, energy, food, lifestyle, total }
 * @returns {Object} Recommendations object containing primary category, specific advice, and custom lists
 */
export function getRecommendations(results) {
  if (!results || results.total === 0) {
    return {
      highestCategory: 'none',
      message: 'Complete your carbon calculation to receive personalized insights!',
      recommendedHabits: HABITS_DATABASE.slice(0, 3),
      insights: []
    };
  }

  // Find highest category
  const categories = ['transport', 'energy', 'food', 'lifestyle'];
  let highestCategory = 'transport';
  let highestValue = 0;

  categories.forEach(cat => {
    if (results[cat] > highestValue) {
      highestValue = results[cat];
      highestCategory = cat;
    }
  });

  const percentage = Math.round((highestValue / results.total) * 100);
  
  // Custom messages based on highest category
  let message = '';
  switch (highestCategory) {
    case 'transport':
      message = `Your transportation choices make up the largest part of your footprint (${percentage}%). Consider shifting to active transport, public transit, or simulating electric vehicle options.`;
      break;
    case 'energy':
      message = `Your home energy usage (electricity, gas, waste) is your primary driver (${percentage}%). Focus on insulation, smart thermostats, switching off standby power, and boosting recycling.`;
      break;
    case 'food':
      message = `Your food consumption is your highest emission source (${percentage}%). Shifting towards more plant-based days and reducing food waste will make a massive dent in this category.`;
      break;
    case 'lifestyle':
      message = `Shopping and consumer choices drive your footprint (${percentage}%). Consider buying second-hand, extending the life of electronics, and avoiding single-use plastics.`;
      break;
  }

  // Recommended habits (prioritize habits from the highest category, then others)
  const categoryHabits = HABITS_DATABASE.filter(h => h.category === highestCategory);
  const otherHabits = HABITS_DATABASE.filter(h => h.category !== highestCategory);
  const recommendedHabits = [...categoryHabits, ...otherHabits].slice(0, 4);

  // Generate dynamic, quantified insights
  const insights = [];
  
  // Transport Insights
  if (results.transport > 3000) {
    insights.push({
      type: 'warning',
      text: `Your annual transport emissions (${(results.transport/1000).toFixed(1)} t CO2e) are higher than the average global total footprint. Swapping just two car commutes a week for a bicycle or transit can save up to 500 kg CO2e per year!`
    });
  } else {
    insights.push({
      type: 'success',
      text: `Great job keeping transport emissions moderate. Keep choosing active travel options to maintain this!`
    });
  }

  // Energy Insights
  if (results.energy > 2500) {
    insights.push({
      type: 'warning',
      text: `Home energy is a big driver. Switching all standard bulbs to LED and turning down heating by 1°C can shave up to 10% off your utility footprint (saving ~200 kg CO2e/year).`
    });
  }

  // Food Insights
  if (results.food >= 1900) {
    insights.push({
      type: 'info',
      text: `Currently, your diet has a high or average carbon impact. Moving to vegetarian meals just 3 days a week will cut your food footprint by roughly 300 kg CO2e per year.`
    });
  } else {
    insights.push({
      type: 'success',
      text: `Your plant-forward diet is a massive win for the planet! Eating low-carbon meals saves you about 1 tonne of CO2e annually compared to high-meat diets.`
    });
  }

  // Lifestyle Insights
  if (results.lifestyle > 800) {
    insights.push({
      type: 'info',
      text: `Shopping emissions add up quickly. Extending the life of your current smartphone by 1 year avoids approximately 80 kg of manufacturing emissions.`
    });
  }

  return {
    highestCategory,
    message,
    recommendedHabits,
    insights
  };
}
