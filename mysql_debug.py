from mysql import connector
import config
import datetime
import thermostat.temp_util as temp_util
import thermostat.dbutils as dbutils

class MySQL():
  def connect(self):
    return connector.connect(host=config.DB_HOST, user=config.DB_USER, password=config.DB_PASS)

mysql = MySQL()
