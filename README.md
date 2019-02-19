# homeauto

# SQL Dumping
To add a new database, first create the database structure and then run
mysqldump -u USER -p --no-data dbname > dbname.sql

## Prerequisites
sudo apt-get install mysql-server
sudo apt-get install git
sudo apt-get install apache2

```
echo \" \
DOMAIN=\"DOMAIN\" \n\
DB_USER=\"USERNAME\" \n\
DB_PASS=\"PASSWORD\" \n\
DB_HOST=\"DB_HOST\" \n\
" > config.py
```

mysql -u root -p thermostat < thermostat.sql
mysql -u root -p puppy < puppy.sql
mysql -u root -p bf < bf.sql
