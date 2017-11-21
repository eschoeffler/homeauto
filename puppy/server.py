from flask import request
from flask import redirect
from flask import render_template
from flask import send_from_directory
from flask import Blueprint

from enum import Enum
import json
import datetime

puppy_app = Blueprint('puppy_app', __name__, template_folder="templates")
domain = ''
mysql = None

class ActionType(Enum):
  POO = 1
  PEE = 2
  FOOD = 3

action_type_str = {
  ActionType.POO: 'poo',
  ActionType.PEE: 'pee',
  ActionType.FOOD: 'food'
};

class Location(Enum):
  OUTSIDE = 1
  INSIDE = 2
  CRATE = 3
  INTERRUPTED = 4

location_str = {
  Location.OUTSIDE: 'outside',
  Location.INSIDE: 'inside',
  Location.CRATE: 'crate',
  Location.INTERRUPTED: 'interrupted'
}


@puppy_app.route("/puppy/s/<path:filename>")
def serve_puppy_static(filename):
  return send_from_directory("puppy/static", filename)

@puppy_app.route("/s/<path:filename>")
def serve_static(filename):
  return send_from_directory("thermostat/static", filename)

@puppy_app.route("/", subdomain="puppy")
def puppy_redirect():
  return redirect("http://www.%s/puppy" % domain, code=301)

@puppy_app.route("/puppy")
def puppy():
  return render_template("puppy.html")

@puppy_app.route("/_/puppy/delete", methods=["POST"])
def puppy_api_delete():
  action_id = request.args.get("id")
  conn = mysql.connect()
  try:
    cursor = conn.cursor()
    cursor.execute("DELETE from puppy.action where id=%s;", action_id)
    conn.commit()
    return json.dumps(get_recent())
  finally:
    conn.close()

@puppy_app.route("/_/puppy/list", methods=["GET"])
def puppy_api_list():
  continuationToken = request.args.get("continuationToken")
  return json.dumps(get_recent(continuationToken))

@puppy_app.route("/_/puppy/add", methods=["POST"])
def puppy_api_add():
  time_str = request.args.get("time")
  time = (datetime.datetime.now() if not time_str
          else datetime.datetime.fromtimestamp(int(time_str)))
  location = int(request.args.get("location"))
  note_str = request.args.get("note")
  action_type = int(request.args.get("type"))

  conn = mysql.connect()
  try:
    cursor = conn.cursor()
    cursor.execute(
        ("INSERT into puppy.action "
         "    (type, time, location, note)"
         "     VALUES (%s, %s, %s, %s);"),
        (action_type, time, location, note_str))
    conn.commit()
    return json.dumps(get_recent())
  finally:
    conn.close()
  return json.dumps({"status": "ERROR"})

def get_recent(continuationToken=None, page_size=20):
  conn = mysql.connect()
  try:
    cursor = conn.cursor()
    select_query = "SELECT id, type, time, note, location FROM puppy.action "
    if continuationToken:
      select_query += "WHERE time < '%s' " % (
          datetime.datetime.fromtimestamp(float(continuationToken))
              .strftime('%Y-%m-%d %H:%M:%S'))
    else:
      params = page_size
    select_query += "ORDER BY time DESC LIMIT %s;"
    print(select_query)
    cursor.execute(select_query, page_size)
    now = datetime.datetime.now()
    rows = cursor.fetchall()
    results = []
    for (action_id, action_type, time, note, location) in rows:
      duration = now - time
      hours = int(duration.total_seconds() / 3600)
      format_str = "%l:%M %p"
      if (duration.days > 0):
        format_str = "%A " + format_str
      results.append({
        "id": action_id,
        "type": action_type_str[action_type],
        "time": "%s (%s hrs ago)" % (time.strftime(format_str), hours),
        "note": note,
        "location": location_str[location] if location else '',
      })
    response = {"eventList": results}
    if len(rows) > 0:
      response["continuationToken"] = rows[-1][2].strftime('%s')
    return response
  finally:
    conn.close()
  return []