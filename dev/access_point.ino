#include "access_point.h"

AccessPoint::AccessPoint()
  : ConnectionManager("nodemcu", "123456789", IPAddress(192, 168, 4, 1), IPAddress(192, 168, 4, 0), IPAddress(255, 255, 255, 0), "/ap.txt") {}

bool AccessPoint::init() {
  Serial.println("AccessPoint@init :: starting");

  WiFi.mode(WIFI_AP);

  if (!WiFi.softAPConfig(this->local_ip, this->gateway, this->subnet)) {
    Serial.println("AccessPoint@inir :: softAPConfig failed");
  }

  if (!WiFi.softAP(this->ssid.c_str(), this->password.c_str())) {
    Serial.println("AccessPoint@inir :: softAP failed");
    return false;
  }

  Serial.println("AP.ssid: " + this->ssid);
  Serial.println("AP.local_ip: " + this->local_ip.toString());
  Serial.println("AP.gateway: " + this->gateway.toString());
  Serial.println("AP.subnet: " + this->subnet.toString());
  Serial.println("AP.password: " + this->password);
  Serial.println("WiFi.local_ip: " + WiFi.softAPIP().toString());

  return true;
}
