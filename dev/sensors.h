#ifndef SENSORS_H
#define SENSORS_H

// https://github.com/esp8266/Arduino/blob/da6ec83b5fdbd5b02f04cf143dcf8e158a8cfd36/variants/generic/common.h
// https://github.com/esp8266/Arduino/blob/da6ec83b5fdbd5b02f04cf143dcf8e158a8cfd36/variants/nodemcu/pins_arduino.h

#include "mqtt_manager.h"
#include <Arduino.h>

#define SENSORS_OUTPUT_SIZE 10
#define SENSORS_SIZE 10

#define SENSORS_DHT 1
#define SENSORS_LDR 2

#define SENSORS_DHT_TEMPERATURE 1
#define SENSORS_DHT_HUMUDITY 2
#define SENSORS_DHT_HEAT_INDEX 3
#define SENSORS_LDR_VOLTAGE 4

static bool activeSensorOutputs[SENSORS_OUTPUT_SIZE] = {0};
static uint8_t sensorPins[SENSORS_SIZE] = {0};
static bool isSensorsActivated = false;

static DHT* dht;

static uint8_t resolveDigitalPin(uint8_t value) {
  switch (value) {
    case 0:
      return D0;
    case 1:
      return D1;
    case 2:
      return D2;
    case 3:
      return D3;
    case 4:
      return D4;
    case 5:
      return D5;
    case 6:
      return D6;
    case 7:
      return D7;
    case 8:
      return D8;
    case 9:
      return D9;
    case 10:
      return D10;
    default:
      return 127;
  }
}

static uint8_t resolveAnalogPin(uint8_t value) {
  switch (value) {
    case 0:
      return A0;
    default:
      return 127;
  }
}


static void setupDHT() {
  if (!(activeSensorOutputs[SENSORS_DHT_TEMPERATURE] || activeSensorOutputs[SENSORS_DHT_HUMUDITY] || activeSensorOutputs[SENSORS_DHT_HEAT_INDEX]))
  {
    return;
  }

  dht = new DHT(resolveDigitalPin(sensorPins[SENSORS_DHT]), DHT11);
  dht->begin();
}


static void sendDHTSensor(MQTTManager* mqttManager) {
  float h = 0;
  float t = 0;

  if (activeSensorOutputs[SENSORS_DHT_TEMPERATURE] || activeSensorOutputs[SENSORS_DHT_HEAT_INDEX]) {
    t = dht->readTemperature();
  }

  if (activeSensorOutputs[SENSORS_DHT_HUMUDITY] || activeSensorOutputs[SENSORS_DHT_HEAT_INDEX]) {
    h = dht->readHumidity();
  }

  if (activeSensorOutputs[SENSORS_DHT_HUMUDITY]) {
    if (isnan(h)) {
      Serial.println("readDHTSensor :: failed to read humidity");
      mqttManager->publish("dht/humidity/error", "");
    } else {
      mqttManager->publish("dht/humidity", h);
    }
  }

  if (activeSensorOutputs[SENSORS_DHT_TEMPERATURE]) {
    if (isnan(t)) {
      Serial.println("readDHTSensor :: failed to read temperature");
      mqttManager->publish("dht/temperature/error", "");
    } else {
      mqttManager->publish("dht/temperature", t);
    }
  }

  if (activeSensorOutputs[SENSORS_DHT_HEAT_INDEX] && !isnan(h) && !isnan(t)) {
    float hic = dht->computeHeatIndex(t, h, false);
    
    if (isnan(hic)) {
      Serial.println("readDHTSensor :: failed to calculate heat index");
      mqttManager->publish("dht/heatIndex/error", "");
    } else {
      mqttManager->publish("dht/heatIndex", hic);
    }
  }
}

static void sendLDRSensor(MQTTManager* mqttManager) {
  if (!activeSensorOutputs[SENSORS_LDR_VOLTAGE]) {
    return;
  }

  int sensorValue = analogRead(resolveAnalogPin(sensorPins[SENSORS_LDR]));

  if (isnan(sensorValue)) {
    Serial.println("readLDRSensor :: failed to read");
    mqttManager->publish("ldr/voltage/error", "");
  } else {
    float voltage = sensorValue * (5.0 / 1023.0);
    mqttManager->publish("ldr/voltage", voltage);
  }
}

#endif
