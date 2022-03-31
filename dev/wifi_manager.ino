#include "wifi_manager.h"

WifiManager::WifiManager() : ConnectionManager("/wifi.txt") {}

bool WifiManager::init() {
  Serial.printf("WifiManager@init :: connecting...\n");

  WiFi.mode(WIFI_STA);

  if (!WiFi.config(this->local_ip, this->gateway, this->subnet)) {
    return false;
  }

  WiFi.begin(this->ssid.c_str(), this->password.c_str());
  
  int i = 5;
  while (WiFi.status() != WL_CONNECTED && i > 0) {
    delay(1000);
    i--;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.printf("WifiManager@init :: failed.\n");
    return false;
  }

  Serial.printf("WifiManager@init :: connected. ip: %s\n", WiFi.localIP().toString().c_str());

  return true;
}
