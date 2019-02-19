from flask import send_from_directory
from flask import Blueprint
from flask import request

import time
import json

breastfeeding_app = Blueprint('breastfeeding_app', __name__, template_folder="static")
domain = ''
mysql = None

@breastfeeding_app.route("/bf/<path:filename>")
def serve_breastfeeding_static(filename):
  return send_from_directory("breastfeeding/static", filename)

@breastfeeding_app.route("/_/bf/addfeed")
def add_feed():
  id = request.args.get("id")
  start_time = request.args.get("startTime")
  conn = mysql.connect()
  try:
    conn.cursor().execute("insert into bf.feeds (id, start_time) values (%s, %s)", (id, start_time))
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
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
    cursor = conn.cursor()
    select_query = "SELECT id, start_time FROM bf.feeds "
    if from_time:
      select_query += "WHERE start_time > %s " % from_time
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
    conn.cursor().execute("insert into bf.feed_parts (id, feed_id, start_time, duration, amount, source) values (%s, %s, %s, %s, %s, %s)", (id, feed_id, start_time, duration, amount, source))
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
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
    cursor = conn.cursor()
    select_query = "SELECT bf.feed_parts.id, bf.feed_parts.feed_id, bf.feed_parts.start_time, bf.feed_parts.duration, bf.feed_parts.amount, bf.feed_parts.source FROM bf.feeds INNER JOIN bf.feed_parts on bf.feeds.id = bf.feed_parts.feed_id "
    if from_time:
      select_query += "WHERE bf.feeds.start_time > %s " % from_time
    select_query += "ORDER BY bf.feed_parts.start_time DESC"
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
    conn.cursor().execute("insert into bf.pumps (id, start_time, duration, rate, suction, amount) values (%s, %s, %s, %s, %s, %s)", (id, start_time, duration, rate, suction, amount))
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
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
    cursor = conn.cursor()
    select_query = "SELECT id, start_time, duration, rate, suction, amount FROM bf.pumps "
    if from_time:
      select_query += "WHERE start_time > %s " % from_time
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
    conn.cursor().execute("insert into bf.sleeps (id, start_time, duration) values (%s, %s, %s)", (id, start_time, duration))
    conn.commit()
    return json.dumps({"status": "SUCCESS"})
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
    cursor = conn.cursor()
    select_query = "SELECT id, start_time, duration FROM bf.sleeps "
    if from_time:
      select_query += "WHERE start_time > %s " % from_time
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
  finally:
    conn.close()
  return []
