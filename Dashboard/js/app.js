import { listenForTemperatureUpdates, fetchInitialData, tempData } from './firebase-config.js';

// DOM Elements
const currentTempEl = document.getElementById('current-temp');
const predictedTempEl = document.getElementById('predicted-temp');
const lastUpdatedTimeEl = document.getElementById('last-updated-time');
const predictionAccuracyEl = document.getElementById('prediction-accuracy');
const minTempEl = document.getElementById('min-temp');
const maxTempEl = document.getElementById('max-temp');
const avgTempEl = document.getElementById('avg-temp');
const predDiffEl = document.getElementById('pred-diff');
const currentGaugeEl = document.getElementById('current-gauge');
const predictionGaugeEl = document.getElementById('prediction-gauge');
const currentMarkerEl = document.getElementById('current-marker');
const predictionMarkerEl = document.getElementById('prediction-marker');
const loadingOverlayEl = document.getElementById('loading-overlay');
const themeButtonEl = document.getElementById('theme-button');
const themeIconEl = document.getElementById('theme-icon');

// Temperature chart
let tempChart;

// Theme toggle
themeButtonEl.addEventListener('click', toggleTheme);

// Check for saved theme preference or set based on time
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme) {
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    updateThemeIcon(savedTheme === 'dark');
  } else {
    // Set theme based on time of day
    const currentHour = new Date().getHours();
    const isDarkTime = currentHour < 6 || currentHour >= 18;
    
    if (isDarkTime) {
      document.body.classList.add('dark-theme');
      updateThemeIcon(true);
      localStorage.setItem('theme', 'dark');
    }
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
  
  // Update chart theme if it exists
  if (tempChart) {
    tempChart.options.scales.x.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    tempChart.options.scales.y.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    tempChart.options.scales.x.ticks.color = isDark ? '#adb5bd' : '#6c757d';
    tempChart.options.scales.y.ticks.color = isDark ? '#adb5bd' : '#6c757d';
    tempChart.update();
  }
}

function updateThemeIcon(isDark) {
  themeIconEl.textContent = isDark ? '☀️' : '🌙';
}

// Initialize the application
async function initApp() {
  // Initialize theme
  initTheme();
  
  // Fetch initial data
  const initialData = await fetchInitialData();
  
  // If we have initial data, update the UI
  if (initialData) {
    updateUI(initialData);
  }
  
  // Set up the chart
  initChart();
  
  // Start listening for temperature updates
  listenForTemperatureUpdates(updateUI);
  
  // Hide loading overlay
  loadingOverlayEl.style.display = 'none';
}

// Update the UI with new data
function updateUI(data) {
  if (data.currentTemp !== null) {
    // Add pulse animation
    currentTempEl.classList.add('pulse');
    // Update current temperature
    currentTempEl.textContent = `${data.currentTemp.toFixed(1)}°C`;
    // Update gauge
    updateGauge(currentGaugeEl, currentMarkerEl, data.currentTemp);
    // Remove pulse animation after it completes
    setTimeout(() => currentTempEl.classList.remove('pulse'), 500);
  }
  
  if (data.predictedTemp !== null) {
    // Add pulse animation
    predictedTempEl.classList.add('pulse');
    // Update predicted temperature
    predictedTempEl.textContent = `${data.predictedTemp.toFixed(1)}°C`;
    // Update gauge
    updateGauge(predictionGaugeEl, predictionMarkerEl, data.predictedTemp);
    // Remove pulse animation after it completes
    setTimeout(() => predictedTempEl.classList.remove('pulse'), 500);
  }
  
  // Update last updated time
  if (data.lastUpdated) {
    lastUpdatedTimeEl.textContent = formatTime(data.lastUpdated);
  }
  
  // Update prediction accuracy
  if (data.stats.predictionDiff !== null) {
    const accuracy = Math.max(0, 100 - (data.stats.predictionDiff * 10)).toFixed(1);
    predictionAccuracyEl.textContent = `${accuracy}%`;
  }
  
  // Update stats
  if (data.stats.minTemp !== Infinity) {
    minTempEl.textContent = `${data.stats.minTemp.toFixed(1)}°C`;
  }
  
  if (data.stats.maxTemp !== -Infinity) {
    maxTempEl.textContent = `${data.stats.maxTemp.toFixed(1)}°C`;
  }
  
  if (data.stats.avgTemp) {
    avgTempEl.textContent = `${data.stats.avgTemp.toFixed(1)}°C`;
  }
  
  if (data.stats.predictionDiff) {
    predDiffEl.textContent = `${data.stats.predictionDiff.toFixed(1)}°C`;
  }
  
  // Update chart if available
  if (tempChart && data.historyData.timestamps.length > 0) {
    updateChart(data.historyData);
  }
}

// Initialize the temperature chart
function initChart() {
  const ctx = document.getElementById('temp-chart').getContext('2d');
  const isDark = document.body.classList.contains('dark-theme');
  
  tempChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Actual Temperature',
          data: [],
          borderColor: '#4361ee',
          backgroundColor: 'rgba(67, 97, 238, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3
        },
        {
          label: 'Predicted Temperature',
          data: [],
          borderColor: '#f72585',
          backgroundColor: 'rgba(247, 37, 133, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: isDark ? '#adb5bd' : '#6c757d'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          grid: {
            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            color: isDark ? '#adb5bd' : '#6c757d'
          }
        },
        y: {
          grid: {
            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            color: isDark ? '#adb5bd' : '#6c757d'
          },
          beginAtZero: false
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      animation: {
        duration: 750
      }
    }
  });
}

// Update the chart with new data
function updateChart(historyData) {
  tempChart.data.labels = historyData.timestamps;
  tempChart.data.datasets[0].data = historyData.actualTemps;
  tempChart.data.datasets[1].data = historyData.predictedTemps;
  tempChart.update();
}

// Update temperature gauge
function updateGauge(gaugeEl, markerEl, temperature) {
  // Map temperature to percentage (usually temperatures will be between 0-40°C)
  // Adjust these values based on your expected temperature range
  const minTemp = 0;
  const maxTemp = 40;
  let percentage = ((temperature - minTemp) / (maxTemp - minTemp)) * 100;
  percentage = Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100%
  
  // Update gauge fill width
  gaugeEl.style.width = `${percentage}%`;
  
  // Update marker position
  markerEl.style.left = `${percentage}%`;
  
  // Update gauge color based on temperature
  let color;
  if (temperature < 15) {
    color = 'var(--cold-color)';
  } else if (temperature < 25) {
    color = 'var(--mild-color)';
  } else if (temperature < 35) {
    color = 'var(--warm-color)';
  } else {
    color = 'var(--hot-color)';
  }
  
  gaugeEl.style.backgroundColor = color;
}

// Helper function to format time
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Initialize the application
initApp();