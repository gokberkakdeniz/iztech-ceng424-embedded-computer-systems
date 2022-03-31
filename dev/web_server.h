#ifndef WEB_SERVER_H
#define WEB_SERVER_H

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESPAsyncWebServer.h>
#include <ESPAsyncTCP.h>
#include "LittleFS.h"
#include "access_point.h"
#include "wifi_manager.h"


class WebServer {
  private:
    AsyncWebServer server;

    String session;
    String username;
    String password;

    bool loadAccounts();
    bool saveAccounts();

    bool isLogged(AsyncWebServerRequest* request);

    String processTags(const String& var);

  public:
    WebServer();
    bool* shouldReset;
    AccessPoint* accessPoint;
    WifiManager* wifiManager;

    void start();
};

#endif
