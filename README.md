# 🌡️ MQTT-Based Temperature Prediction System

An IoT-driven temperature monitoring and prediction system integrating ESP32, DHT22 sensor, AWS IoT Core, and Firebase, with a responsive web dashboard for real-time visualization.

---

## 🔧 Features

- Real-time temperature and humidity sensing
- MQTT communication via AWS IoT Core
- Live and historical data visualization via Firebase
- Temperature prediction logic with forecast display
- Responsive web dashboard with light/dark theme
- LCD display for instant data output
- Secure user authentication

---

## 🧱 System Architecture

### **Hardware**
- ESP32 Dev Board  
- DHT22 Temperature & Humidity Sensor  
- 16x2 I2C LCD Display  
- Breadboard + Jumper Wires  
- USB/Battery Power Supply

### **Software**
- **ESP32 Firmware:** Arduino IDE  
- **MQTT Broker:** AWS IoT Core  
- **Database & Auth:** Firebase Realtime Database & Authentication  
- **Frontend:** HTML, CSS, JavaScript (Chart.js for graphs)

---

## 🔁 Functional Workflow

1. **Data Collection:** ESP32 captures temp & humidity from DHT22.
2. **MQTT Publishing:** Sends data to `sensor/temp_data` topic via AWS IoT Core.
3. **Database Sync:** Data mirrored to Firebase Realtime Database.
4. **Prediction:** System computes forecasted temperatures from history.
5. **LCD Display:** Shows real-time and predicted temperature.
6. **Web Dashboard:** Live data, visual gauges, trends, and accuracy stats.

---

## 🌐 Web Dashboard

- Live temperature & forecast view
- Temperature intensity gauge
- Update timestamp
- Interactive history chart (Chart.js)
- Prediction accuracy metric
- User authentication
- Light/Dark mode toggle

---

## 🔗 Firebase Integration

- Auth: Secure login/signup
- Realtime DB: Stores and updates temp data & predictions
- Real-time frontend updates using listeners in `firebase-config.js`

---

## 📁 Project Structure

```
📦 Project Root
├── sketch_may14a.ino             # Arduino firmware
├── index.html                    # Web UI layout
├── styles.css                    # Dashboard styling
├── app.js                        # Data handling & charts
├── firebase-config.js           # Firebase connection & listeners
├── assets/                       # Project screenshots & circuit diagrams
```

---

## 🚀 Deployment

- Hosted using **Netlify**
- Realtime updates supported via Firebase

---

## 📝 Conclusion

This project demonstrates an effective blend of hardware and cloud-based services for environmental monitoring. It provides a robust platform for real-time temperature tracking and forecasting, extendable for use in academic, agricultural, or industrial applications.

---

## 📸 Screenshots

Include in your repo:
- Fritzing diagram of the circuit
- Screenshot of the dashboard interface
