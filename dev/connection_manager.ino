#include "connection_manager.h"

ConnectionManager::ConnectionManager(
  String ssid_,
  String password_,
  IPAddress local_ip_,
  IPAddress gateway_,
  IPAddress subnet_,
  String file_
): ssid(ssid_),
  password(password_),
  local_ip(local_ip_),
  gateway(gateway_),
  subnet(subnet_),
  file(file_) {}

ConnectionManager::ConnectionManager(String file_): file(file_) {}

ConnectionManager::ConnectionManager() {}

bool ConnectionManager::load() {
  File file = LittleFS.open(this->file, "r");

  if (!file || file.isDirectory()) {
    Serial.println("ConnectionManager@load :: failed - " + this->file);
    return false;
  }

  if (file.available()) {
    this->ssid = file.readStringUntil('\n');
    if (file.available()) {
      this->password = file.readStringUntil('\n');
      if (file.available()) {
        this->local_ip.fromString(file.readStringUntil('\n'));
        if (file.available()) {
          this->gateway.fromString(file.readStringUntil('\n'));
          if (file.available()) {
            this->subnet.fromString(file.readStringUntil('\n'));
          }
        }
      }
    }
  }

  file.close();

  Serial.println("ConnectionManager@load :: success " + this->file);

  return true;
}

bool ConnectionManager::save() {
  File file = LittleFS.open(this->file, "w");

  if (!file) {
    Serial.println("ConnectionManager@save :: failed - " + this->file);
    return false;
  }

  file.printf("%s\n%s\n%s\n%s\n%s\n", this->ssid.c_str(),
              this->password.c_str(), this->local_ip.toString().c_str(),
              this->gateway.toString().c_str(),
              this->subnet.toString().c_str());

  file.close();

  Serial.println("ConnectionManager@load :: success - " + this->file);

  return true;
}
