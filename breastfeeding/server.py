from flask import send_from_directory
from flask import Blueprint
from flask import request

import time
import json
import random

breastfeeding_app = Blueprint('breastfeeding_app', __name__, template_folder="static")
domain = ''
mysql = None

def uid():
  return int(time.time() * 1000) + random.randint(0, 1000)

class ServerError(Exception):
  pass

def check_baby_id(req):
  baby_id = req.args.get("babyId")
  if not baby_id:
    raise ServerError("Missing babyId parameter")
  conn = mysql.connect()
  try:
    cursor = conn.cursor()
    cursor.execute("select id from bf.baby where id = %s limit 1", baby_id)
    if not cursor.fetchone():
      raise ServerError("No such baby exists")
  except:
    conn.close()
    raise
  return baby_id

@breastfeeding_app.route("/bf2/<path:filename>")
def serve_breastfeeding_static(filename):
  return send_from_directory("breastfeeding/v2", filename)

@breastfeeding_app.route("/bf/<path:filename>")
def serve_breastfeeding_static(filename):
  return send_from_directory("breastfeeding/static", filename)

@breastfeeding_app.route("/_/bf/addfeed")
def add_feed():
  id = request.args.get("id")
  start_time = request.args.get("startTime")
  conn = mysql.connect()
  try:
    baby_id = check_baby_id(request)
    conn.cursor().execute("insert into bf.feeds (id, start_time, baby_id) values (%s, %s, %s)", (id, start_time, baby_id))
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
  except ServerError as e:
    return json.dumps({"status": "ERROR", "details": e.message})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR"})

@breastfeeding_app.route("/_/bf/changefeed")
def update_feed():
  id = request.args.get("id")
  start_time = request.args.get("startTime")
  conn = mysql.connect()
  try:
    conn.cursor().execute("update bf.feeds set start_time=%s where id = %s", (start_time, id))
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR"})

@breastfeeding_app.route("/_/bf/rmfeed")
def remove_feed():
  id = request.args.get("id")
  conn = mysql.connect()
  try:
    conn.cursor().execute("delete from bf.feeds where id = %s", id)
    conn.cursor().execute("delete from bf.feed_parts where feed_id = %s", id)
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR"})

@breastfeeding_app.route("/_/bf/feeds")
def get_feeds():
  conn = mysql.connect()
  from_time = request.args.get("from")
  try:
    baby_id = check_baby_id(request)
    cursor = conn.cursor()
    select_query = "SELECT id, start_time FROM bf.feeds WHERE baby_id = %s " % baby_id
    if from_time:
      select_query += "AND start_time > %s " % from_time
    select_query += "ORDER BY start_time DESC"
    cursor.execute(select_query)
    rows = cursor.fetchall()
    feeds = []
    for (id, start_time) in rows:
      feeds.append({
        "id": id,
        "startTime": start_time
      })
    return json.dumps({"feeds": feeds})
  except ServerError as e:
    return json.dumps({"status": "ERROR", "details": e.message})
  finally:
    conn.close()
  return []

@breastfeeding_app.route("/_/bf/addfeedpart")
def add_feed_part():
  id = request.args.get("id")
  feed_id = request.args.get("feedId")
  start_time = request.args.get("startTime")
  duration = request.args.get("duration")
  amount = request.args.get("amount")
  source = request.args.get("source")
  conn = mysql.connect()
  try:
    baby_id = check_baby_id(request)
    conn.cursor().execute("insert into bf.feed_parts (id, feed_id, baby_id, start_time, duration, amount, source) values (%s, %s, %s, %s, %s, %s, %s)", (id, feed_id, baby_id, start_time, duration, amount, source))
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
  except ServerError as e:
    return json.dumps({"status": "ERROR", "details": e.message})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR"})

@breastfeeding_app.route("/_/bf/changefeedpart")
def update_feed_part():
  id = request.args.get("id")
  start_time = request.args.get("startTime")
  duration = request.args.get("duration")
  amount = request.args.get("amount")
  source = request.args.get("source")
  conn = mysql.connect()
  try:
    conn.cursor().execute("update bf.feed_parts set start_time=%s, duration=%s, amount=%s, source=%s where id = %s", (start_time, duration, amount, source, id))
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR"})

@breastfeeding_app.route("/_/bf/rmfeedpart")
def remove_feed_part():
  id = request.args.get("id")
  conn = mysql.connect()
  try:
    conn.cursor().execute("delete from bf.feed_parts where id = %s", id)
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR"})

@breastfeeding_app.route("/_/bf/feedparts")
def get_feed_parts():
  conn = mysql.connect()
  from_time = request.args.get("from")
  try:
    baby_id = check_baby_id(request)
    cursor = conn.cursor()
    select_query = "SELECT bf.feed_parts.id, bf.feed_parts.feed_id, bf.feed_parts.start_time, bf.feed_parts.duration, bf.feed_parts.amount, bf.feed_parts.source FROM bf.feeds INNER JOIN bf.feed_parts on bf.feeds.id = bf.feed_parts.feed_id WHERE bf.feed_parts.baby_id = %s " % baby_id
    if from_time:
      select_query += "AND bf.feeds.start_time > %s " % from_time
    select_query += "ORDER BY bf.feed_parts.start_time DESC"
    print select_query
    cursor.execute(select_query)
    rows = cursor.fetchall()
    feedParts = []
    for (id, feed_id, start_time, duration, amount, source) in rows:
      feedParts.append({
        "id": id,
        "feedId": feed_id,
        "startTime": start_time,
        "duration": duration,
        "amount": amount,
        "source": source
      })
    return json.dumps({"feedParts": feedParts})
  except ServerError as e:
    return json.dumps({"status": "ERROR", "details": e.message})
  finally:
    conn.close()
  return []

@breastfeeding_app.route("/_/bf/addpump")
def add_pump():
  id = request.args.get("id")
  start_time = request.args.get("startTime")
  duration = request.args.get("duration")
  rate = request.args.get("rate")
  suction = request.args.get("suction")
  amount = request.args.get("amount")
  conn = mysql.connect()
  try:
    baby_id = check_baby_id(request)
    conn.cursor().execute("insert into bf.pumps (id, baby_id, start_time, duration, rate, suction, amount) values (%s, %s, %s, %s, %s, %s, %s)", (id, baby_id, start_time, duration, rate, suction, amount))
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
  except ServerError as e:
    return json.dumps({"status": "ERROR", "details": e.message})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR"})

@breastfeeding_app.route("/_/bf/changepump")
def update_pump():
  id = request.args.get("id")
  start_time = request.args.get("startTime")
  duration = request.args.get("duration")
  rate = request.args.get("rate")
  suction = request.args.get("suction")
  amount = request.args.get("amount")
  conn = mysql.connect()
  try:
    conn.cursor().execute("update bf.pumps set start_time=%s, duration=%s, rate=%s, suction=%s, amount=%s where id = %s", (start_time, duration, rate, suction, amount, id))
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR"})

@breastfeeding_app.route("/_/bf/rmpump")
def remove_pump():
  id = request.args.get("id")
  conn = mysql.connect()
  try:
    conn.cursor().execute("delete from bf.pumps where id = %s", id)
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR"})

@breastfeeding_app.route("/_/bf/pumps")
def get_pumps():
  from_time = request.args.get("from")
  conn = mysql.connect()
  try:
    baby_id = check_baby_id(request)
    cursor = conn.cursor()
    select_query = "SELECT id, start_time, duration, rate, suction, amount FROM bf.pumps WHERE baby_id = %s " % baby_id
    if from_time:
      select_query += "AND start_time > %s " % from_time
    select_query += "ORDER BY start_time DESC"
    cursor.execute(select_query)
    rows = cursor.fetchall()
    pumps = []
    for (id, start_time, duration, rate, suction, amount) in rows:
      pumps.append({
        "id": id,
        "startTime": start_time,
        "duration": duration,
        "rate": rate,
        "suction": suction,
        "amount": amount
      })
    return json.dumps({"pumps": pumps})
  except ServerError as e:
    return json.dumps({"status": "ERROR", "details": e.message})
  finally:
    conn.close()
  return []

@breastfeeding_app.route("/_/bf/addsleep")
def add_sleep():
  id = request.args.get("id")
  start_time = request.args.get("startTime")
  duration = request.args.get("duration")
  conn = mysql.connect()
  try:
    baby_id = check_baby_id(request)
    conn.cursor().execute("insert into bf.sleeps (id, baby_id, start_time, duration) values (%s, %s, %s, %s)", (id, baby_id, start_time, duration))
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
  except ServerError as e:
    return json.dumps({"status": "ERROR", "details": e.message})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR"})

@breastfeeding_app.route("/_/bf/changesleep")
def update_sleep():
  id = request.args.get("id")
  start_time = request.args.get("startTime")
  duration = request.args.get("duration")
  conn = mysql.connect()
  try:
    conn.cursor().execute("update bf.sleeps set start_time=%s, duration=%s where id = %s", (start_time, duration, id))
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR"})

@breastfeeding_app.route("/_/bf/rmsleep")
def remove_sleep():
  id = request.args.get("id")
  conn = mysql.connect()
  try:
    conn.cursor().execute("delete from bf.sleeps where id = %s", id)
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR"})

@breastfeeding_app.route("/_/bf/sleeps")
def get_sleeps():
  from_time = request.args.get("from")
  conn = mysql.connect()
  try:
    baby_id = check_baby_id(request)
    cursor = conn.cursor()
    select_query = "SELECT id, start_time, duration FROM bf.sleeps WHERE baby_id = %s " % baby_id
    if from_time:
      select_query += "AND start_time > %s " % from_time
    select_query += "ORDER BY start_time DESC"
    cursor.execute(select_query)
    rows = cursor.fetchall()
    sleeps = []
    for (id, start_time, duration) in rows:
      sleeps.append({
        "id": id,
        "startTime": start_time,
        "duration": duration
      })
    return json.dumps({"sleeps": sleeps})
  except ServerError as e:
    return json.dumps({"status": "ERROR", "details": e.message})
  finally:
    conn.close()
  return []

@breastfeeding_app.route("/_/bf/addbaby")
def add_baby():
  name = request.args.get("name")
  conn = mysql.connect()
  try:
    baby_id = uid()
    cursor = conn.cursor()
    cursor.execute("INSERT into bf.baby (id, name) values (%s, %s)", (baby_id, name))
    conn.commit()
    return json.dumps({"status": "SUCCESS", "babyId": baby_id})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR", "error": "Server error, try again"})

breastfeeding_app.route("/_/bf/getbaby")
def get_baby():
  code = request.args.get("code")
  conn = mysql.connect()
  try:
    cursor = conn.cursor()
    cursor.execute("""
      SELECT (bf.baby.id, bf.baby.name)
        FROM bf.baby
        INNER JOIN bf.baby_share on bf.baby_share.baby_id = bf.baby.id
        WHERE bf.baby_share.code = %s
    """)
    conn.commit()
    row = cursor.fetchone()
    if not row:
      return json.dumps({"status": "SUCCESS", "error": "Invalid code"})
    else:
      return json.dumps({"status": "SUCCESS", "babyId": row[0]})
  finally:
    conn.close()
  return json.dumps({"status": "ERROR", "error": "Server error, try again"})
