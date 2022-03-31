#ifndef ACCESS_POINT_H
#define ACCESS_POINT_H

#include "connection_manager.h"


class AccessPoint : public ConnectionManager {
  public:
    AccessPoint();
    bool init();
};

#endif
