from flask import request
from flask import redirect
from flask import render_template
from flask import send_from_directory
from flask import send_file
from flask import Blueprint

import remote_util
import temp_util
import datetime
import json
import re
import RPi.GPIO as GPIO
import time

thermostat_app = Blueprint('thermostat_app', __name__, template_folder="templates")
domain = ''
mysql = None

GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)

# TODO(eschoeffler): move this some place common
Day = {
  "MONDAY": {"bit": 1, "string": "Monday"},
  "TUESDAY": {"bit": 2, "string": "Tuesday"},
  "WEDNESDAY": {"bit": 4, "string": "Wednesday"},
  "THURSDAY": {"bit": 8, "string": "Thursday"},
  "FRIDAY": {"bit": 16, "string": "Friday"},
  "SATURDAY": {"bit": 32, "string": "Saturday"},
  "SUNDAY": {"bit": 64, "string": "Sunday"}
}

DayOrder = [
  Day["SUNDAY"],
  Day["MONDAY"],
  Day["TUESDAY"],
  Day["WEDNESDAY"],
  Day["THURSDAY"],
  Day["FRIDAY"],
  Day["SATURDAY"]
];

@thermostat_app.route("/s/<path:filename>")
def serve_static(filename):
  return send_from_directory("thermostat/static", filename)

@thermostat_app.route("/therm/s/<path:filename>")
def serve_therm_static(filename):
  return send_from_directory("thermostat/static", filename)

@thermostat_app.route("/thermostat-service-worker.js")
def thermostat_service_worker():
  return send_file("thermostat/static/thermostat-service-worker.js")

def get_status():
  GPIO.setup(26, GPIO.IN)
  status = "on" if GPIO.input(26) else "off"
  GPIO.setup(26, GPIO.OUT)
  return status

@thermostat_app.route("/", subdomain="therm")
def therm_redirect():
  return redirect("http://www.%s/therm" % domain, code=301)

@thermostat_app.route("/therm")
def therm_():
  therm = temp_util.get_therm(mysql)
  temp = temp_util.get_current(mysql)
  return render_template("therm.html",
      therm=int(round(temp_util.ctof(therm))),
      temp=temp_util.ctof(temp),
      status=get_status())

@thermostat_app.route("/_/therm", methods=["GET"])
def get_therm_api():
  return json.dumps({
    "therm": str(int(round(temp_util.ctof(temp_util.get_therm(mysql))))),
    "temp": str(temp_util.ctof(temp_util.get_current(mysql))),
    "status": get_status()
  })

@thermostat_app.route("/_/therm", methods=["POST"])
def post_therm_api():
  tempStr = request.args.get("temp")
  if tempStr:
    temp_util.setf(mysql, int(tempStr))
  return json.dumps({"status": get_status()})

@thermostat_app.route("/_/thermdialog", methods=["POST"])
def post_therm_dialog_api():
  request_data = json.loads(request.data)
  action = request_data["result"]["action"]
  if action == "IncreaseHeat":
    temp_util.setf(mysql, 72)
    return json.dumps({"speech": "Ok, I'll set the temperature to 72 degrees."})
  elif action == "DecreaseHeat":
    temp_util.setf(mysql, 65)
    return json.dumps({"speech": "Ok, I'll set the temperature to 65 degrees."})
  elif action == "GetThermInfo":
    temp = temp_util.get_current(mysql)
    return json.dumps({"speech": "The temperature is %s and the thermostat is set to %s" %
        (temp_util.ctof(temp), int(round(temp_util.ctof(temp_util.get_therm(mysql)))))})
  else:
    return json.dumps({"speech": "Hmm, I didn't understand that."})

@thermostat_app.route("/_/room", methods=["POST"])
def post_room():
  temp_str = request.args.get("temp")
  humidity_str = request.args.get("humidity")
  room = request.args.get("room")
  now = datetime.datetime.now()
  expired_date = datetime.datetime.now() - datetime.timedelta(days=30)
  conn = mysql.connect()
  try:
    time = datetime.datetime.now()
    humidity = float(humidity_str)
    temp = float(temp_str)
    cursor = conn.cursor()
    cursor.execute("INSERT into thermostat.rooms (time, temp, humidity, room) values (%s, %s, %s, %s);", (time, temp, humidity, room))
    cursor.execute("DELETE from thermostat.rooms where time < %s", expired_date)
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR"})

@thermostat_app.route("/therm/timer")
def therm_timer():
  conn = mysql.connect()
  try:
    cursor = conn.cursor()
    cursor.execute("SELECT id, time, temp, days FROM thermostat.temp_rules;")
    rows = cursor.fetchall()
    timer_rules = []
    for (id, time, temp, days) in rows:
      day_bit_mask = ord(days)
      selected_days = []
      for day in DayOrder:
        if day["bit"] & day_bit_mask:
          selected_days.append(day["string"])
      days_str = ""
      if len(selected_days) == 7:
        days_str = "Everyday"
      elif (len(selected_days) == 2 and
          Day["SUNDAY"]["string"] in selected_days and
          Day["SATURDAY"]["string"] in selected_days):
        days_str = "Weekends"
      elif (len(selected_days) == 5 and
          Day["SUNDAY"]["string"] not in selected_days and
          Day["SATURDAY"]["string"] not in selected_days):
        days_str = "Weekdays"
      else:
        days_str = ", ".join(selected_days)

      timer_rules.append({
        "id": id,
        "time": (datetime.datetime.min + time).time().strftime("%l:%M %p"),
        "temp": int(round(temp_util.ctof(temp))),
        "days_str": days_str
      })
    return render_template("timers.html", timer_rules=timer_rules)
  finally:
    conn.close()

@thermostat_app.route("/_/therm/timer", methods=["POST"])
def therm_timer_api():
  temp_str = request.args.get("temp")
  time_str = request.args.get("time")
  days_str = request.args.get("days")
  conn = mysql.connect()
  try:
    cursor = conn.cursor()
    cursor.execute(
        "INSERT into thermostat.temp_rules (time, temp, days) values (%s, %s, %s);",
        (time_str, temp_util.ftoc(int(temp_str)), int(days_str, 2)))
    conn.commit()
    id = cursor.lastrowid
    return json.dumps({"status": "SUCCESS", "id": id})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR"})

@thermostat_app.route("/_/therm/timer", methods=["DELETE"])
def therm_timer_delete_api():
  rule_id = request.args.get("id")
  conn = mysql.connect()
  try:
    cursor = conn.cursor()
    cursor.execute("DELETE from thermostat.temp_rules where id=%s;", rule_id)
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
  finally:
    conn.close()

@thermostat_app.route("/temp")
def temp():
  ago = ago_from_request(request)
  conn = mysql.connect()
  try:
    cursor = conn.cursor()
    cursor.execute("SELECT time, temp, humidity, thermtemp FROM thermostat.temp_history where time > %s order by time desc", ago)
    rows = cursor.fetchall()
    converted = [(time, temp_util.ctof(temp), humidity, temp_util.ctof(thermtemp)) for (time, temp, humidity, thermtemp) in rows]
    return render_template("temps.html", temps=filter_temp(converted), hidden_columns=[])
  finally:
    conn.close()

@thermostat_app.route("/room")
def room():
  ago = ago_from_request(request)
  room = request.args.get("room") or "nursery"
  conn = mysql.connect()
  try:
    cursor = conn.cursor()
    cursor.execute("SELECT time, temp, humidity FROM thermostat.rooms where time > %s and room = %s order by time desc", (ago, room))
    rows = cursor.fetchall()
    converted = [(time, temp_util.ctof(temp), humidity, 0) for (time, temp, humidity) in rows]
    return render_template("temps.html", temps=filter_temp(converted), hidden_columns=[3])
  finally:
    conn.close()

def filter_temp(temp_history):
  last_temp = None
  filtered = []
  for value in temp_history:
    if value[1] != last_temp:
      last_temp = value[1]
      filtered.append(value);
  return filtered

def ago_from_request(request):
  time = request.args.get('time') or "1days"
  m = re.compile("(\d+)(\D+)").match(time)
  value = int(m.group(1))
  unit = str(m.group(2))
  now = datetime.datetime.now()
  ago = now - datetime.timedelta(**{unit: value})
  return ago

### REMOTE ###

@thermostat_app.route("/", subdomain="remote")
def remote_redirect():
  return redirect("http://www.%s/remote" % domain, code=301)

@thermostat_app.route("/remote")
def remote():
  return render_template("remote.html")

@thermostat_app.route("/remote/app")
def remote_app():
  return render_template("remote.html")

@thermostat_app.route("/remote-service-worker.js")
def remote_service_worker():
  return send_file("thermostat/static/remote-service-worker.js")

@thermostat_app.route('/_/press/<button_id>', methods=['POST'])
def release_control(button_id):
  remote_util.press_button(button_id)
  return json.stringify({"status": "SUCCESS"})

@thermostat_app.route('/_/volup', methods=['POST'])
def increase_volume():
  for i in range(10):
    remote_util.press_button("KEY_VOLUMEUP")
  return json.stringify({"status": "SUCCESS"})

@thermostat_app.route('/_/voldown', methods=['POST'])
def decrease_volume():
  for i in range(10):
    remote_util.press_button("KEY_VOLUMEDOWN")
  return json.stringify({"status": "SUCCESS"})

@thermostat_app.route("/remote/all")
def all():
  return render_template("all-buttons.html", buttons=sorted(remote_util.buttons))

@thermostat_app.route("/")
def index():
  return "hello"
