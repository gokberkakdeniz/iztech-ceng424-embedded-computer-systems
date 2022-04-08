#include "web_server.h"

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESPAsyncWebServer.h>
#include <ESPAsyncTCP.h>
#include "LittleFS.h"

// TODO: need to generate session id randomly.
WebServer::WebServer(): server(80), username("root"), password("123456"), session("82b90b0c-b04a-11ec-b909-0242ac120002") {
  auto processor = [this](const String & var) {
    return this->processTags(var);
  };

  this->server.on("/wifi", HTTP_GET, [this, &processor](AsyncWebServerRequest * request) {
    if (this->isLogged(request)) {
      request->send(LittleFS, "/wifi.html", "text/html", false, std::bind(&WebServer::processTags, this, std::placeholders::_1));
    } else {
      request->redirect("/");
    }
  });

  this->server.on("/account", HTTP_GET, [this, &processor](AsyncWebServerRequest * request) {
    if (this->isLogged(request)) {
      request->send(LittleFS, "/account.html", "text/html", false, std::bind(&WebServer::processTags, this, std::placeholders::_1));
    } else {
      request->redirect("/");
    }
  });

  this->server.on("/ap", HTTP_GET, [this, &processor](AsyncWebServerRequest * request) {
    if (this->isLogged(request)) {
      request->send(LittleFS, "/access_point.html", "text/html", false, std::bind(&WebServer::processTags, this, std::placeholders::_1));
    } else {
      request->redirect("/");
    }
  });

  this->server.on("/reset", HTTP_GET, [this, &processor](AsyncWebServerRequest * request) {
    if (this->isLogged(request)) {
      *this->shouldReset = true;
      request->redirect("/?cb=reset");
    } else {
      request->redirect("/");
    }
  });

  this->server.on("/", HTTP_GET, [this, &processor](AsyncWebServerRequest * request) {
    if (this->isLogged(request)) {
      request->send(LittleFS, "/home.html", "text/html", false, std::bind(&WebServer::processTags, this, std::placeholders::_1));
    } else {
      request->send(LittleFS, "/login.html", "text/html", false, std::bind(&WebServer::processTags, this, std::placeholders::_1));
    }
  });

  this->server.on("/login", HTTP_POST, [this](AsyncWebServerRequest * request) {
    AsyncWebServerResponse *response = request->beginResponse(301);
    response->addHeader("Location", "/");

    if (request->hasParam("username", true) && request->hasParam("password", true)) {
      auto username = request->getParam("username", true)->value();
      auto password = request->getParam("password", true)->value();
      if (this->username == username && this->password == password) {
        response->addHeader("Set-Cookie", "SESSIONID=" + this->session + ";");
      }
    }

    request->send(response);
  });

  this->server.on("/account", HTTP_POST, [this](AsyncWebServerRequest * request) {
    if (request->hasParam("username", true) && request->hasParam("password", true)) {
      auto username = request->getParam("username", true)->value();
      auto password = request->getParam("password", true)->value();
      if (this->username.length() > 3 && this->password.length() > 3) {
        this->username = username;
        this->password = password;
        this->saveAccounts();
      }
    }

    request->redirect("/");
  });

  this->server.on("/ap", HTTP_POST, [this](AsyncWebServerRequest * request) {
    if (request->hasParam("ssid", true) && request->hasParam("password", true) && request->hasParam("ip", true) && request->hasParam("gateway", true) && request->hasParam("subnet", true)) {
      auto ssid = request->getParam("ssid", true)->value();
      auto password = request->getParam("password", true)->value();
      auto ip = request->getParam("ip", true)->value();
      auto gateway = request->getParam("gateway", true)->value();
      auto subnet = request->getParam("subnet", true)->value();
      // TODO: validate
      this->accessPoint->ssid = ssid;
      this->accessPoint->password = password;
      this->accessPoint->local_ip.fromString(ip);
      this->accessPoint->gateway.fromString(gateway);
      this->accessPoint->subnet.fromString(subnet);
      this->accessPoint->save();
    }

    request->redirect("/");
  });

  this->server.on("/wifi", HTTP_POST, [this](AsyncWebServerRequest * request) {
    if (request->hasParam("ssid", true) && request->hasParam("password", true) && request->hasParam("ip", true) && request->hasParam("gateway", true) && request->hasParam("subnet", true)) {
      auto ssid = request->getParam("ssid", true)->value();
      auto password = request->getParam("password", true)->value();
      auto ip = request->getParam("ip", true)->value();
      auto gateway = request->getParam("gateway", true)->value();
      auto subnet = request->getParam("subnet", true)->value();
      // TODO: validate
      this->wifiManager->ssid = ssid;
      this->wifiManager->password = password;
      this->wifiManager->local_ip.fromString(ip);
      this->wifiManager->gateway.fromString(gateway);
      this->wifiManager->subnet.fromString(subnet);
      this->wifiManager->save();
    }

    request->redirect("/");
  });

  this->server.serveStatic("/", LittleFS, "/");
}

bool WebServer::loadAccounts() {
  File file = LittleFS.open("/passwd.txt", "r");

  if (!file || file.isDirectory()) {
    return false;
  }

  String username, password;

  if (file.available()) {
    username = file.readStringUntil('\n');
  }

  if (file.available()) {
    password = file.readStringUntil('\n');
  }

  if (username != "" && password != "") {
    this->username = username;
    this->password = password;
  } else {
    return false;
  }

  return true;
}

bool WebServer::saveAccounts() {
  File file = LittleFS.open("/passwd.txt", "w");

  if (!file || file.isDirectory()) {
    return false;
  }

  bool result = file.printf("%s\n%s\n", this->username, this->password);

  file.close();

  return result;
}

String WebServer::processTags(const String& var) {
  if (var == "username") {
    return String(this->username);
  } else if (var == "password") {
    return String(this->password);
  } else if (var == "ap_ssid") {
    return String(this->accessPoint->ssid);
  } else if (var == "ap_password") {
    return String(this->accessPoint->password);
  } else if (var == "ap_ip") {
    return String(this->accessPoint->local_ip.toString());
  } else if (var == "ap_gateway") {
    return String(this->accessPoint->gateway.toString());
  } else if (var == "ap_subnet") {
    return String(this->accessPoint->subnet.toString());
  } else if (var == "wifi_ssid") {
    return String(this->wifiManager->ssid);
  } else if (var == "wifi_password") {
    return String(this->wifiManager->password);
  } else if (var == "wifi_ip") {
    return String(this->wifiManager->local_ip.toString());
  } else if (var == "wifi_gateway") {
    return String(this->wifiManager->gateway.toString());
  } else if (var == "wifi_subnet") {
    return String(this->wifiManager->subnet.toString());
  }
  return String();
}

bool WebServer::isLogged(AsyncWebServerRequest* request) {
  if (request->hasHeader("Cookie")) {
    return request->getHeader("Cookie")->value().indexOf("SESSIONID=" + this->session) >= 0;
  }

  return false;
}

void WebServer::start() {
  Serial.println("WebServer@start :: starting");

  Serial.printf("WebServer@loadAccounts :: %s\n", this->loadAccounts() ? "success" : "failed");

  this->server.begin();

  Serial.println("WebServer@start :: started");
}
