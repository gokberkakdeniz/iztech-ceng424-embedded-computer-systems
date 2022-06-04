#define DHTPIN D2
#define DHTTYPE DHT11
#define LDRPIN A0
#define BUZZER D3
#define MSG_BUFFER_SIZE  (50)

#include <DHT.h>
#include <DHT_U.h>
#include <Arduino.h>
#include <PubSubClient.h>

#include "LittleFS.h"

#include "access_point.h"
#include "wifi_manager.h"
#include "web_server.h"
#include "mqtt_manager.h"
#include "music.h"


DHT dht(DHTPIN, DHTTYPE);
AccessPoint accessPoint;
WifiManager wifiManager;
WebServer server;
MQTTManager mqttManager;

bool shouldReset = false;
char msg[MSG_BUFFER_SIZE];
double value = 0;

bool littlefsInit() {
  bool isSuccess = LittleFS.begin();
  Serial.printf("LittleFS :: %s\n", isSuccess ? "success" : "failed");
  return isSuccess;
}

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
    if (!mqttManager.init()) {
      Serial.println("mqtt connection fail");
    }
  } else {
    Serial.println("wifi connection fail");
    WiFi.disconnect(true);
    accessPoint.init();
  }
  
  server.start();

  startMusic();
}

void sendDHTSensor() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h)) {
    Serial.println("readDHTSensor :: failed to read humidity");
    mqttManager.publish("dht/humidity/error", "");
  } else {
    mqttManager.publish("dht/humidity", h);
  }

  if (isnan(t)) {
    Serial.println("readDHTSensor :: failed to read temperature");
    mqttManager.publish("dht/temperature/error", "");
  } else {
    mqttManager.publish("dht/temperature", t);
  }

  if (!isnan(h) && !isnan(t)) {
    float hic = dht.computeHeatIndex(t, h, false);
    
    if (isnan(hic)) {
      Serial.println("readDHTSensor :: failed to calculate heat index");
      mqttManager.publish("dht/heatIndex/error", "");
    } else {
      mqttManager.publish("dht/heatIndex", hic);
    }
  }
}

void sendLDRSensor() {
  int sensorValue = analogRead(LDRPIN);

  if (isnan(sensorValue)) {
    Serial.println("readLDRSensor :: failed to read");
    mqttManager.publish("ldr/voltage/error", "");
  } else {
    float voltage = sensorValue * (5.0 / 1023.0);
    mqttManager.publish("ldr/voltage", voltage);
  }
}

void sendCounter() {
  ++value;
  mqttManager.publish("counter", value);
}

void loop() {  
  if (shouldReset) {
    delay(100);
    ESP.reset();
  }

  bool isMQTTClientConnected = mqttManager.loop();

  if (isMQTTClientConnected) {
    // mqttManager.publish("dht/humidity/error", "");
     sendDHTSensor();
     sendLDRSensor();

    // sendCounter();
  }

  delay(5000);
}
