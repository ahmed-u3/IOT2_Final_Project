// Import the functions from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvKAmVVejsA23wkXgbIen5jC49z7NpX54",
  authDomain: "aws-project-624bf.firebaseapp.com",
  databaseURL: "https://aws-project-624bf-default-rtdb.firebaseio.com",
  projectId: "aws-project-624bf",
  storageBucket: "aws-project-624bf.firebasestorage.app",
  messagingSenderId: "695068812414",
  appId: "1:695068812414:web:96578ccef1c264f960242f",
  measurementId: "G-HWS5LFHEVM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Create references to both paths (handling the typo in the Arduino code)
const actualTempRefTypo = ref(database, 'Temo/actual');
const actualTempRef = ref(database, 'Temp/actual');
const predictionTempRef = ref(database, 'Temp/prediction');

// Data storage
const tempData = {
  currentTemp: null,
  predictedTemp: null,
  historyData: {
    timestamps: [],
    actualTemps: [],
    predictedTemps: []
  },
  stats: {
    minTemp: Infinity,
    maxTemp: -Infinity,
    avgTemp: 0,
    predictionDiff: 0
  },
  lastUpdated: null
};

// Maximum number of history points to keep
const MAX_HISTORY_POINTS = 20;

// Function to listen for temperature updates
function listenForTemperatureUpdates(callback) {
  // Listen to both potential paths for actual temperature (handling the typo)
  onValue(actualTempRefTypo, (snapshot) => {
    const value = snapshot.val();
    if (value !== null) {
      updateTemperatureData('actual', value);
      if (callback) callback(tempData);
    }
  });
  
  onValue(actualTempRef, (snapshot) => {
    const value = snapshot.val();
    if (value !== null) {
      updateTemperatureData('actual', value);
      if (callback) callback(tempData);
    }
  });
  
  onValue(predictionTempRef, (snapshot) => {
    const value = snapshot.val();
    if (value !== null) {
      updateTemperatureData('prediction', value);
      if (callback) callback(tempData);
    }
  });
}

// Function to update temperature data
function updateTemperatureData(type, value) {
  const now = new Date();
  tempData.lastUpdated = now;
  
  if (type === 'actual') {
    tempData.currentTemp = value;
    
    // Update history
    tempData.historyData.timestamps.push(formatTime(now));
    tempData.historyData.actualTemps.push(value);
    
    // Trim history if needed
    if (tempData.historyData.timestamps.length > MAX_HISTORY_POINTS) {
      tempData.historyData.timestamps.shift();
      tempData.historyData.actualTemps.shift();
    }
    
    // Update statistics
    tempData.stats.minTemp = Math.min(tempData.stats.minTemp, value);
    tempData.stats.maxTemp = Math.max(tempData.stats.maxTemp, value);
    
    // Calculate average
    const sum = tempData.historyData.actualTemps.reduce((a, b) => a + b, 0);
    tempData.stats.avgTemp = sum / tempData.historyData.actualTemps.length;
  } else if (type === 'prediction') {
    tempData.predictedTemp = value;
    
    // Update prediction history
    if (tempData.historyData.predictedTemps.length < tempData.historyData.actualTemps.length) {
      tempData.historyData.predictedTemps.push(value);
    } else {
      tempData.historyData.predictedTemps[tempData.historyData.predictedTemps.length - 1] = value;
    }
    
    // Trim history if needed
    if (tempData.historyData.predictedTemps.length > MAX_HISTORY_POINTS) {
      tempData.historyData.predictedTemps.shift();
    }
    
    // Calculate prediction difference if we have current temperature
    if (tempData.currentTemp !== null) {
      tempData.stats.predictionDiff = Math.abs(tempData.predictedTemp - tempData.currentTemp);
    }
  }
}

// Helper function to format time
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Initial data fetch (one-time)
async function fetchInitialData() {
  try {
    // Try both paths for actual temperature
    let actualSnapshot = await get(actualTempRefTypo);
    if (!actualSnapshot.exists()) {
      actualSnapshot = await get(actualTempRef);
    }
    
    const predictionSnapshot = await get(predictionTempRef);
    
    if (actualSnapshot.exists()) {
      updateTemperatureData('actual', actualSnapshot.val());
    }
    
    if (predictionSnapshot.exists()) {
      updateTemperatureData('prediction', predictionSnapshot.val());
    }
    
    return tempData;
  } catch (error) {
    console.error("Error fetching initial data:", error);
    return null;
  }
}

export { listenForTemperatureUpdates, fetchInitialData, tempData };