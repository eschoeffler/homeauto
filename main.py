from flask import Flask
from mysql import connector
from flask import send_from_directory
import config

domain = config.DOMAIN

app = Flask(__name__)
if domain:
  app.config['SERVER_NAME'] = domain
  app.url_map.default_subdomain = "www"
# Decrease this if we want to update the cache more often.
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

class MySQL():
  def connect(self):
    return connector.connect(host=config.DB_HOST, user=config.DB_USER, password=config.DB_PASS)

mysql = MySQL()

def register_subapp(app, subapp, subapp_config):
  subapp_config.domain = domain
  subapp_config.mysql = mysql
  app.register_blueprint(subapp)

if not "thermostat" in config.disabled:
  from thermostat.server import thermostat_app
  import thermostat.server as thermostat_config
  register_subapp(app, thermostat_app, thermostat_config)

if not "puppy" in config.disabled:
  from puppy.server import puppy_app
  import puppy.server as puppy_config
  register_subapp(app, puppy_app, puppy_config)

if __name__ == '__main__':
   app.run(host="0.0.0.0")
