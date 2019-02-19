#!/usr/bin/python

import Adafruit_DHT
print Adafruit_DHT.read_retry(Adafruit_DHT.DHT22, 18)

