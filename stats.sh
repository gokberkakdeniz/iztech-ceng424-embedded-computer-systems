#!/usr/bin/env bash

echo -n "c++  : "
cat dev/*.ino dev/*.h | awk 'NF' | wc -l

echo -n "js   : "
cat dev/static/Gulpfile.js dev/static/src/*.js api/src/**/*.js | awk 'NF' | wc -l

echo -n "html : "
cat dev/static/src/*.html | awk 'NF' | wc -l

