#include "mqtt_manager.h"

MQTTManager::MQTTManager() {
  this->wifiClient = WiFiClient();
  this->mqttClient = PubSubClient();
}

bool MQTTManager::load() {
  File file = LittleFS.open("/mqtt.txt", "r");

  if (!file || file.isDirectory()) {
      Serial.println("MQTTManager@load :: failed");
      return false;
  }

  if (file.available()) {
      this->address = file.readStringUntil('\n');
      if (file.available()) {
          this->port = file.readStringUntil('\n').toInt();
          if (file.available()) {
              this->username = file.readStringUntil('\n');
              if (file.available()) {
                this->password = file.readStringUntil('\n');
              }
          }
      }
  }

  file.close();

  Serial.println("MQTTManager@load :: success");

  return true;
}

bool MQTTManager::save() {
  File file = LittleFS.open("/mqtt.txt", "w");

  if (!file) {
      Serial.println("MQTTManager@save :: failed");
      return false;
  }

  file.printf("%s\n%d\n%s\n%s\n%s\n", 
              this->address.c_str(),
              this->port, 
              this->username.c_str(),
              this->password.c_str());

  file.close();

  Serial.println("MQTTManager@load :: success");

  return true;
}

void MQTTManager::callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
      Serial.print((char)payload[i]);
  }
  Serial.println();
}

bool MQTTManager::init() {
  this->mqttClient.setClient(this->wifiClient);
  this->mqttClient.setCallback(std::bind(&MQTTManager::callback, this, std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
  this->mqttClient.setServer(this->address.c_str(), this->port);
  return true;
}

bool MQTTManager::loop() {
  bool isConnected = this->mqttClient.connected();
  if (!isConnected) {
    isConnected = mqttClient.connect("client-adghasghd");
    Serial.printf("mqttInit :: %s\n", isConnected ? "success" : "failed");
  }

  this->mqttClient.loop();

  return isConnected;
}
