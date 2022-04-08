#ifndef MQTT_MANAGER_H
#define MQTT_MANAGER_H

#include <Arduino.h>
#include "LittleFS.h"

class MQTTManager {
  private:
    WiFiClient wifiClient;

  public:
    String address;
    int port;
    String username;
    String password;
    PubSubClient mqttClient;

    MQTTManager();

    bool load();
    bool save();
    void callback(char* topic, byte* payload, unsigned int length);

    bool init();
    bool loop();
};

#endif
