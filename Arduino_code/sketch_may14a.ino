#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "aws_mqtt_config.h" 
#include "addons/RTDBHelper.h"

// === CONFIGURATION ===
#define DHTPIN 13          // Change to your actual pin
#define DHTTYPE DHT22      // Or DHT22
DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);  // LCD address and size
const char* ssid = "Network goes brr"; 
const char* password = "Ah01020038841";  

// Insert Firebase project API Key
#define API_KEY "AIzaSyBvKAmVVejsA23wkXgbIen5jC49z7NpX54"

// Insert RTDB URLefine the RTDB URL */
#define DATABASE_URL "https://aws-project-624bf-default-rtdb.firebaseio.com/" 

unsigned long sendDataPrevMillis = 0;
const long sendDataIntervalMillis = 10000;
// Define Firebase Data object

FirebaseData fbdo;

// Define firebase authentication.
FirebaseAuth auth;

// Definee firebase configuration.
FirebaseConfig config;

// Boolean variable for sign in status.
bool signupOK = false;

float store_random_Float_Val;
int store_random_Int_Val;


// AWS MQTT variables
WiFiClientSecure secureClient;
PubSubClient mqttClient(secureClient);

// === DATA STORAGE ===
float temps[3];
float hums[3];
int dataIndex = 0;
bool readyToPredict = false;

// === MODEL FUNCTION ===
float predict(float h1, float h2, float h3) {
  return (0.0095 * h1) + (-0.7646 * h2) + (1.6079 * h3) + 3.819;
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected!");
}

void connectToAWS() {
  secureClient.setCACert(amazon_ca_cert);
  secureClient.setCertificate(certificate_pem_crt);
  secureClient.setPrivateKey(private_pem_key);

  mqttClient.setServer(AWS_IOT_ENDPOINT, AWS_IOT_PORT);

  Serial.print("Connecting to AWS IoT...");
  while (!mqttClient.connected()) {
    if (mqttClient.connect(AWS_CLIENT_ID)) {
      Serial.println("connected!");
    } else {
      Serial.print(".");
      delay(1000);
    }
  }
}


void setup() {
  Serial.begin(115200);
  dht.begin();
  lcd.init();
  lcd.backlight();

  lcd.setCursor(0, 0);
  lcd.print("ESP32 Weather");
  lcd.setCursor(0, 1);
  lcd.print("Prediction Boot");
  delay(2000);
  lcd.clear();
  connectToWiFi();
  connectToAWS();

 // Assign the api key (required).
  config.api_key = API_KEY;

  // Assign the RTDB URL (required).
  config.database_url = DATABASE_URL;

  // Sign up.
  Serial.println();
  Serial.println("---------------Sign up");
  Serial.print("Sign up new user... ");
  if (Firebase.signUp(&config, &auth, "", "")){
    Serial.println("ok");
    signupOK = true;
  }
  else{
    Serial.printf("%s\n", config.signer.signupError.message.c_str());
  }
  Serial.println("---------------");
  
  // Assign the callback function for the long running token generation task.
  config.token_status_callback = tokenStatusCallback; //--> see addons/TokenHelper.h
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
}

void loop() {
 if (Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > sendDataIntervalMillis || sendDataPrevMillis == 0)){
    if (!mqttClient.connected()) {
      connectToAWS();
    }
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
  
    if (!isnan(temp) && !isnan(hum)) {
      temps[dataIndex] = temp;
      hums[dataIndex] = hum;
      Serial.print("Reading ");
      Serial.print(dataIndex + 1);
      Serial.print(": ");
      Serial.print(temp);
      Serial.print(" C, ");
      Serial.print(hum);
      Serial.println(" %");
  
      dataIndex++;
  
      if (dataIndex == 3) {
        readyToPredict = true;
        dataIndex = 0;
      }
    } else {
      Serial.println("Sensor error...");
    }
  
    // === MAKE PREDICTION ===
    if (readyToPredict) {
      float pred = predict(
        temps[0],
        temps[1],
        temps[2]
      );
  
      Serial.print("Prediction: ");
      Serial.println(pred);
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Actual: ");
      lcd.print(temps[2], 2);
      lcd.print(" C");
  
      lcd.setCursor(0, 1);
      lcd.print("Predict: ");
      lcd.print(pred, 2);
      lcd.print(" C");
  
      StaticJsonDocument<200> doc;
      doc["Actual"] = temps[2];
      doc["Prediction"] = pred;
      char jsonBuffer[512];
      serializeJson(doc, jsonBuffer); // print to client
      mqttClient.publish(MQTT_TOPIC_PUB, jsonBuffer);
     if (Firebase.RTDB.setFloat(&fbdo, "Temp/actual", temps[2])) {
      Serial.println("PASSED");
      Serial.println("PATH: " + fbdo.dataPath());
      Serial.println("TYPE: " + fbdo.dataType());
    }
    else {
      Serial.println("FAILED");
      Serial.println("REASON: " + fbdo.errorReason());
    }
    
    // Write an Float number on the database path test/random_Int_Val.
    if (Firebase.RTDB.setInt(&fbdo, "Temp/prediction", pred)) {
      Serial.println("PASSED");
      Serial.println("PATH: " + fbdo.dataPath());
      Serial.println("TYPE: " + fbdo.dataType());
    }
    else {
      Serial.println("FAILED");
      Serial.println("REASON: " + fbdo.errorReason());
    }
      readyToPredict = false;
    }
   }

  delay(2000);
}
