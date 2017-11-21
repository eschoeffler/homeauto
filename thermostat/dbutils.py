import datetime
import mysql.connector

def get_rule(cnx, start, end):
  start_time = datetime.time(start.hour, start.minute, start.second)
  end_time = datetime.time(end.hour, end.minute, end.second)
  if start_time > end_time:
    today_rule = _get_rule(cnx, None, end_time, end.weekday())
    if today_rule:
      return today_rule
    return _get_rule(cnx, start_time, None, start.weekday())
  else:
    return _get_rule(cnx, start_time, end_time, end.weekday())

def _get_rule(cnx, start_time, end_time, day_of_week):
  cursor = cnx.cursor()
  conditionals = []
  inputs = []
  if start_time != None:
    conditionals.append("time > %s")
    inputs.append(start_time)
  if end_time != None:
    conditionals.append("time <= %s")
    inputs.append(end_time)
  conditional = "WHERE %s" % " AND ".join(conditionals) if conditionals else ""
  cursor.execute(("SELECT temp, days FROM thermostat.temp_rules"
                  " %s"
                  " ORDER BY time desc") % conditional,
                 tuple(inputs))
  on_day = [row[0] for row in cursor if row[1] & 2 ** day_of_week]
  if len(on_day) > 0:
    return on_day[0]

def read_current_temp(cnx):
  cursor = cnx.cursor()
  cursor.execute("SELECT temp FROM thermostat.temp_history order by time desc limit 1")
  return cursor.fetchone()[0]

def write_temp(cnx, temp, humidity, thermtemp, therm_state):
  cursor = cnx.cursor()
  cursor.execute("INSERT INTO thermostat.temp_history "
                 "(time, temp, humidity, thermtemp, thermstate) "
                 "VALUES (%s, %s, %s, %s, %s);",
                 (datetime.datetime.now(), temp, humidity, thermtemp, therm_state))
  cnx.commit()
  cursor.close()

def clear_old_temp(cnx):
  cursor = cnx.cursor()
  cursor.execute("DELETE FROM thermostat.temp_history "
                 "WHERE time < %s",
                 [datetime.datetime.now() - datetime.timedelta(days=30)])
  cnx.commit()
  cursor.close()

def write_therm(cnx, temp):
  cursor = cnx.cursor()
  cursor.execute("INSERT INTO thermostat.therm "
                 "(time, temp) "
                 "VALUES (%s, %s);",
                 (datetime.datetime.now(), temp))
  cnx.commit()
  cursor.close()

def read_therm(cnx):
  cursor = cnx.cursor()
  cursor.execute("SELECT temp from thermostat.therm ORDER BY time desc limit 1")
  row = cursor.fetchone()
  cursor.close()

  if row:
    return row[0]
  return None