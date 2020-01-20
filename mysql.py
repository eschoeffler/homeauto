import config

class MySQL():
  def connect(self):
    return connector.connect(host=config.DB_HOST, user=config.DB_USER, password=config.DB_PASS)

mysql = MySql()
