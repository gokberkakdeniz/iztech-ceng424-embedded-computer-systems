#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include "connection_manager.h"


class WifiManager : public ConnectionManager {
  public:
    WifiManager();
    bool init();
};

#endif
