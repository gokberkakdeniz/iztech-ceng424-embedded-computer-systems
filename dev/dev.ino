#define BUZZER D3


#include <DHT.h>
#include <DHT_U.h>
#include <Arduino.h>
#include <PubSubClient.h>

#include "LittleFS.h"

#include "sensors.h"
#include "access_point.h"
#include "wifi_manager.h"
#include "web_server.h"
#include "mqtt_manager.h"
#include "music.h"

AccessPoint accessPoint;
WifiManager wifiManager;
WebServer server;
static MQTTManager mqttManager;

bool shouldReset = false;
double value = 0;

bool littlefsInit() {
  bool isSuccess = LittleFS.begin();
  Serial.printf("LittleFS :: %s\n", isSuccess ? "success" : "failed");
  return isSuccess;
}

void setup() {
  Serial.begin(115200);

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

  if (mqttManager.loop()) {
    mqttManager.publish("dev/start", "");
  }

  startMusic();
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
    if (isSensorsActivated) {
      sendDHTSensor(&mqttManager);
      sendLDRSensor(&mqttManager);  
    }
    
    // mqttManager.publish("dht/humidity/error", "");

    // sendCounter();
  }

  delay(5000);
}
