#include "mqtt_manager.h"

MQTTManager::MQTTManager() {
  this->wifiClient = WiFiClient();
  this->mqttClient = PubSubClient();
  this->is_subscribed = false;
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

  Serial.println("MQTTManager@save :: success");

  return true;
}

void MQTTManager::callback(char* topic, byte* payload, unsigned int length) {
  // receives 00000000/cmd/topic
  if (strcmp(topic+13, "reset") == 0) {
      Serial.printf("MQTTManager::callback :: resetting...\n");
      shouldReset = true;
  } else if (strcmp(topic+13, "sensors") == 0) {
      if (isSensorsActivated) {
        Serial.printf("MQTTManager::callback :: sensors :: already done.\n");
        return;
      }
      
      if (length < 1) {
        Serial.printf("MQTTManager::callback :: sensors :: invalid payload :: length=%u\n", length);
        return;
      }

      // set sensor pins
      byte sensor_count = payload[0];
      for (int i = 0; i < sensor_count; i++) {
        int index = payload[2 * i + 1];
        if (index >= SENSORS_SIZE) {
          Serial.printf("MQTTManager::callback :: sensors :: invalid sensor pin index :: length=%d", index);
        } else {
          sensorPins[index] = payload[2 * i + 2];
        }
      }

      // debug print
      Serial.printf("sensorPins: ");
      for (int i = 0; i < SENSORS_SIZE; i++) {
        Serial.printf("%d ", sensorPins[i]);
      }
      Serial.printf("\n");

      // set sensor outputs
      for (int i = 2 * sensor_count + 1; i < length; i++) {
        int index = payload[i];
        if (index >= SENSORS_OUTPUT_SIZE) {
          Serial.printf("MQTTManager::callback :: sensors :: invalid sensor output index :: length=%d", index);
        } else {
          activeSensorOutputs[payload[i]] = true;
        }
      }
      
      // debug print
      Serial.printf("activeSensorOutputs: ");
      for (int i = 0; i < SENSORS_OUTPUT_SIZE; i++) {
        Serial.printf("%d ", activeSensorOutputs[i] ? 1 : 0);
      }
      Serial.printf("\n");

      // init sensors
      setupDHT();
      isSensorsActivated = true;
  } else {
      Serial.print("Message arrived [");
      Serial.print(topic);
      Serial.print("] ");
      for (int i = 0; i < length; i++) {
          Serial.print((char)payload[i]);
      }
      Serial.println();
  }
}

bool MQTTManager::init() {
  if (WiFi.status() != WL_CONNECTED) return false;
  
  IPAddress resolvedIP;
  if (!WiFi.hostByName(this->address.c_str(), resolvedIP)) {
    Serial.println("MQTTManager@init :: address could not resolved");
    return false;
  }

  snprintf(this->clientId, 9, "%08X", ESP.getChipId());
  Serial.printf("MQTTManager::init :: clientId=%s\n", this->clientId);

  this->mqttClient.setClient(this->wifiClient);
  this->mqttClient.setCallback(std::bind(&MQTTManager::callback, this, std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
  this->mqttClient.setServer(resolvedIP, this->port);
  return true;
}

bool MQTTManager::loop() {
  if (WiFi.status() != WL_CONNECTED) return false;

  bool isConnected = this->mqttClient.connected();
  if (!isConnected) {
    this->is_subscribed = false;
    isConnected = mqttClient.connect(clientId, this->username.c_str(), this->password.c_str());
    Serial.printf("mqttLoop :: connection: %s\n", isConnected ? "success" : "failed");
  }

  if (!this->is_subscribed && isConnected) {
    String topic = this->clientId + String("/cmd/#");
    if (this->mqttClient.subscribe(topic.c_str())) {
      Serial.printf("mqttInit :: %s\n", isConnected ? "success" : "failed");
      this->is_subscribed = true;
      Serial.printf("mqttLoop :: subscription success\n");
    } else {
      Serial.printf("mqttLoop :: subscription failed\n");
    }
  }

  this->mqttClient.loop();

  return isConnected;
}

void MQTTManager::publish(const char* topic, const char *msg) {
  char topicWithClientId[100];
  snprintf(topicWithClientId, 100, "%s/%s", this->clientId, topic);
  this->mqttClient.publish(topicWithClientId, msg);
}

void MQTTManager::publish(char* topic, double value) {
  this->publish(topic, String(value, 6).c_str());
}
