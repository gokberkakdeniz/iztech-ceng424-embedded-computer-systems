#include <DHT.h>
#include <DHT_U.h>

#include <Arduino.h>
#include <PubSubClient.h>
#include "LittleFS.h"
#include "access_point.h"
#include "wifi_manager.h"
#include "web_server.h"
#include "mqtt_manager.h"

#define DHTPIN D2
#define DHTTYPE DHT11

AccessPoint accessPoint;
WifiManager wifiManager;
WebServer server;
MQTTManager mqttManager;
bool shouldReset = false;

bool littlefsInit() {
  bool isSuccess = LittleFS.begin();
  Serial.printf("LittleFS :: %s\n", isSuccess ? "success" : "failed");
  return isSuccess;
}

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);

  dht.begin();

  if (!littlefsInit()) return;

  server.accessPoint = &accessPoint;
  server.wifiManager = &wifiManager;
  server.shouldReset = &shouldReset;

  accessPoint.load();
  wifiManager.load();
  mqttManager.load();

  if (wifiManager.init()) {
    if (mqttManager.init()) {
      Serial.println("mqtt connection fail");
    }
  } else {
    Serial.println("wifi connection fail");
    accessPoint.init();
  }

  server.start();  
}

unsigned long lastMsg = 0;
#define MSG_BUFFER_SIZE  (50)
char msg[MSG_BUFFER_SIZE];
unsigned long long value = 0;

void loop() {
  delay(1000);
  if (shouldReset) {
    delay(100);
    ESP.reset();
  }
  
  bool isMQTTClientConnected = mqttManager.loop();

  unsigned long now = millis();
  if (isMQTTClientConnected && now - lastMsg > 2000) {
    lastMsg = now;
    ++value;
    snprintf (msg, MSG_BUFFER_SIZE, "hello world #%llu", value);
    Serial.print("Publish message: ");
    Serial.println(msg);
    mqttManager.mqttClient.publish("outTopic", msg);
  }

    // Wait a few seconds between measurements.
  delay(2000);

  // Reading temperature or humidity takes about 250 milliseconds!
  // Sensor readings may also be up to 2 seconds 'old' (its a very slow sensor)
  float h = dht.readHumidity();
  // Read temperature as Celsius (the default)
  float t = dht.readTemperature();
  // Read temperature as Fahrenheit (isFahrenheit = true)
  float f = dht.readTemperature(true);

  // Check if any reads failed and exit early (to try again).
  if (isnan(h) || isnan(t) || isnan(f)) {
    Serial.println(F("Failed to read from DHT sensor!"));
    Serial.println(h);
    Serial.println(t);
    Serial.println(f);
    return;
  }

  // Compute heat index in Fahrenheit (the default)
  float hif = dht.computeHeatIndex(f, h);
  // Compute heat index in Celsius (isFahreheit = false)
  float hic = dht.computeHeatIndex(t, h, false);

  Serial.print(F(" Humidity: "));
  Serial.print(h);
  Serial.print(F("%  Temperature: "));
  Serial.print(t);
  Serial.print(F("C "));
  Serial.print(f);
  Serial.print(F("F  Heat index: "));
  Serial.print(hic);
  Serial.print(F("C "));
  Serial.print(hif);
  Serial.println(F("F"));

  int sensorValue = analogRead(A0);   // read the input on analog pin 0
  Serial.println(sensorValue); 

//  float voltage = sensorValue * (5.0 / 1023.0);   // Convert the analog reading (which goes from 0 - 1023) to a voltage (0 - 5V)
//  Serial.println(voltage); 
}
