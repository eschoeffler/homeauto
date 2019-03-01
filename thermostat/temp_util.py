import json
from . import dbutils

def setf(sql, tempf):
  set(sql, ftoc(tempf))

def set(sql, tempc):
  cnx = sql.connect()
  dbutils.write_therm(cnx, tempc)
  cnx.close()

def get_current(sql):
  cnx = sql.connect()
  temp = dbutils.read_current_temp(cnx)
  cnx.close()
  return temp

def get_therm(sql):
  cnx = sql.connect()
  therm = dbutils.read_therm(cnx)
  cnx.close()
  return therm

def ctof(c):
  return c * 9.0 / 5.0 + 32.0

def ftoc(f):
  return (f - 32.0) * 5.0 / 9.0