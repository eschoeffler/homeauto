#!/usr/bin/python

import Adafruit_DHT
import RPi.GPIO as GPIO
import datetime
import logging
import mysql.connector
import dbutils
import time

GPIO.setmode(GPIO.BCM)
GPIO.setup(26, GPIO.OUT)

sensor = Adafruit_DHT.DHT22
pin = 18
therm_state = False

logging.basicConfig(level=logging.DEBUG)

def set_therm_state(on):
  global therm_state
  therm_state = on
  GPIO.output(26, on)

class Average():
  def __init__(self, size):
    self.size = size
    self.window = []
    self.total = 0

  def add(self, value):
    self.window.append(value)
    removed = self.window.pop(0) if len(self.window) > self.size else 0
    self.total = self.total + value - removed
    return self.avg()

  def avg(self):
    return self.total / len(self.window) if self.window else None

THRES = 0.25
avg = Average(30)
last_measure = datetime.datetime(1970, 1, 1, 0, 0)
last_record = datetime.datetime(1970, 1, 1, 0, 0)
thermostat = None

logging.info("Starting therm loop")
while True:
  try:
    cnx = mysql.connector.connect(user="root", password="skeletonkey")
  except:
    logging.info("SQL connection failed retrying in 2 seconds")
    time.sleep(2)
    continue

  try:
    now = datetime.datetime.now()
    new_therm = dbutils.read_therm(cnx)
    if new_therm == None:
      new_therm = 18
      dbutils.write_therm(cnx, new_therm)
    measure = new_therm != thermostat or (now - last_measure).total_seconds() >= 10
    thermostat = new_therm
    # Won't work for 11:59:59 midnight sometimes.
    logging.debug("Checking for rule %s %s" % (last_measure, now))
    rule_temp = dbutils.get_rule(cnx, last_measure, now)
    if rule_temp:
      logging.debug("Found rule %s" % rule_temp)
      dbutils.write_therm(cnx, rule_temp)
      new_therm = rule_temp
    if measure:
      logging.debug("Measuring")
      humidity, temperature = Adafruit_DHT.read_retry(sensor, pin)
      logging.debug("Measured %s" % temperature)
      if humidity is not None and temperature is not None:
        if humidity > 100 or humidity <  0 or (avg.avg() and abs(temperature - avg.avg()) > 5):
          # A change of 5 degrees is likely a read error, ignore errors.
          continue
        avg.add(temperature)
        last_measure = now
        if (avg.avg() - THRES) > thermostat:
          set_therm_state(False)
        elif (avg.avg() + THRES) < thermostat:
          set_therm_state(True)

        if (now - last_record).total_seconds() >= 120: # record only every 2 minutes
          dbutils.write_temp(cnx, temperature, humidity, new_therm, therm_state)
          dbutils.clear_old_temp(cnx)
          last_record = now
  except Exception as e:
    logging.exception("Error")
  finally:
    cnx.close()
