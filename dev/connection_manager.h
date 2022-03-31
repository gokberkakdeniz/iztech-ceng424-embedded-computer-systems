#ifndef CONNECTION_MANAGER_H
#define CONNECTION_MANAGER_H

#include <Arduino.h>
#include <ESP8266WiFi.h>

#include "LittleFS.h"

class ConnectionManager {
  public:
    String ssid;
    String password;
    IPAddress local_ip;
    IPAddress gateway;
    IPAddress subnet;
    String file;

    ConnectionManager(String ssid_,
                      String password_,
                      IPAddress local_ip_,
                      IPAddress gateway_,
                      IPAddress subnet_,
                      String file_);
    ConnectionManager(String file_);
    ConnectionManager();

    bool load();
    bool save();

    virtual bool init() = 0;
};

#endif
