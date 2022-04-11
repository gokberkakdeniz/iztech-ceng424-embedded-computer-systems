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
#define MSG_BUFFER_SIZE  (50)

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
    if (mqttManager.init()) {
      Serial.println("mqtt connection fail");
    }
  } else {
    Serial.println("wifi connection fail");
    accessPoint.init();
  }

  server.start();
}

void sendDHTSensor() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h)) {
    Serial.println("readDHTSensor :: failed to read humidity");
  } else {
    mqttManager.publish("dht/humidity", h);
  }

  if (isnan(t)) {
    Serial.println("readDHTSensor :: failed to read temperature");
  } else {
    mqttManager.publish("dht/temperature", t);
  }

  if (!isnan(h) && !isnan(t)) {
    float hic = dht.computeHeatIndex(t, h, false);
    
    if (isnan(t)) {
      Serial.println("readDHTSensor :: failed to calculate heat index");
    } else {
      mqttManager.publish("dht/heatIndex", hic);
    }
  }

}

void sendCounter() {
  ++value;
  mqttManager.publish("ping", value);
}

void loop() {  
  if (shouldReset) {
    delay(100);
    ESP.reset();
  }

  bool isMQTTClientConnected = mqttManager.loop();

  if (isMQTTClientConnected) {
    sendCounter();
    // sendDHTSensor();
  }

// Wait a few seconds between measurements.


//  int sensorValue = analogRead(A0);   // read the input on analog pin 0
//  Serial.println(sensorValue);

//    float voltage = sensorValue * (5.0 / 1023.0);   // Convert the analog reading (which goes from 0 - 1023) to a voltage (0 - 5V)
//    Serial.println(voltage);

  delay(2000);
}
