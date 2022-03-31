#include <Arduino.h>
#include "LittleFS.h"
#include "access_point.h"
#include "wifi_manager.h"
#include "web_server.h"

AccessPoint accessPoint;
WifiManager wifiManager;
WebServer server;
bool shouldReset = false;

bool littlefsInit() {
  bool isSuccess = LittleFS.begin();
  Serial.printf("LittleFS :: %s\n", isSuccess ? "success" : "failed");
  return isSuccess;
}

void setup() {
  Serial.begin(115200);

  if (!littlefsInit()) return;

  accessPoint.load();
  wifiManager.load();

  if (!wifiManager.init()) {
    Serial.println("wifi connection fail");
  }
  
  if (!accessPoint.init()) return;
  server.accessPoint = &accessPoint;
  server.wifiManager = &wifiManager;
  server.shouldReset = &shouldReset;

  server.start();
}

void loop() {
  delay(1000);
  if (shouldReset) {
    delay(100);
    ESP.reset();
  }
}
