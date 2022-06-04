#ifndef MQTT_MANAGER_H
#define MQTT_MANAGER_H

#include <Arduino.h>
#include "LittleFS.h"
#include <ESP8266WiFi.h>

class MQTTManager {
  private:
    WiFiClient wifiClient;

  public:
    String address;
    int port;
    String username;
    String password;
    char clientId[9];
    bool is_subscribed;
    PubSubClient mqttClient;

    MQTTManager();

    bool load();
    bool save();
    void callback(char* topic, byte* payload, unsigned int length);

    bool init();
    bool loop();

    void publish(const char* topic, const char *msg);
    void publish(char* topic, double value);
};

#endif
