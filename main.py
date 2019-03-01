from flask import Flask
from flaskext.mysql import MySQL
from flask import send_from_directory
import config

domain = config.DOMAIN

app = Flask(__name__)
app.config['SERVER_NAME'] = domain
app.url_map.default_subdomain = "www"
# Decrease this if we want to update the cache more often.
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

mysql = MySQL()
app.config["MYSQL_DATABASE_USER"] = config.DB_USER
app.config["MYSQL_DATABASE_PASSWORD"] = config.DB_PASS
app.config["MYSQL_DATABASE_HOST"] = config.DB_HOST
mysql.init_app(app)

def register_subapp(app, subapp, subapp_config):
  subapp_config.domain = domain
  subapp_config.mysql = mysql
  app.register_blueprint(subapp)

@app.route("/bf2/<path:filename>")
def serve_static(filename):
  return send_from_directory("babytracker/static", filename)

if not "thermostat" in config.disabled:
  from thermostat.server import thermostat_app
  import thermostat.server as thermostat_config
  register_subapp(app, thermostat_app, thermostat_config)

if not "puppy" in config.disabled:
  from puppy.server import puppy_app
  import puppy.server as puppy_config
  register_subapp(app, puppy_app, puppy_config)

if not "breastfeeding" in config.disabled:
  from breastfeeding.server import breastfeeding_app
  import breastfeeding.server as breastfeeding_config
  register_subapp(app, breastfeeding_app, breastfeeding_config)

if __name__ == '__main__':
   app.run()

