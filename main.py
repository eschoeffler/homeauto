from flask import Flask
from flaskext.mysql import MySQL

import config

domain = config.DOMAIN

app = Flask(__name__)
app.config['SERVER_NAME'] = domain
app.url_map.default_subdomain = "www"
# Decrease this if we want to update the cache more often.
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 3600

mysql = MySQL()
app.config["MYSQL_DATABASE_USER"] = config.DB_USER
app.config["MYSQL_DATABASE_PASSWORD"] = config.DB_PASS
app.config["MYSQL_DATABASE_HOST"] = config.DB_HOST
mysql.init_app(app)

from thermostat.server import thermostat_app
import thermostat.server as thermostat_config

thermostat_config.domain = domain
thermostat_config.mysql = mysql
app.register_blueprint(thermostat_app)

from puppy.server import puppy_app
import puppy.server as puppy_config

puppy_config.domain = domain
puppy_config.mysql = mysql
app.register_blueprint(puppy_app)
