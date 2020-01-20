# homeauto
This is an installation for a Raspberry PI to control a switch based
thermostat. For example, a gas stove fireplace. It also has some other
functionality in it that I've toyed with.

## Installation Instructions

### Basic linux setup
`sudo adduser eschoeffler`
`sudo adduser eschoeffler sudo`
`sudo adduser eschoeffler gpio`

### Install dependencies
sudo apt update
sudo apt install vim
sudo apt install apache2
sudo apt install libapache2-mod-wsgi-py3
sudo apt install mysql-server
sudo apt install virtualenv

### Get code
cd /var/www
sudo chown -R eschoeffler .
git clone https://github.com/eschoeffler/homeauto.git main

### Setup database
cd /var/www/main
mysql -u root -p -e "CREATE DATABASE thermostat"
mysql -u root -p thermostat < thermostat.sql

### Setup apache
sudo ln apache.conf /etc/apache2/sites-available/main.conf
sudo a2ensite main.conf
sudo a2dissite 000-default.conf
sudo service apache2 reload
sudo adduser www-data gpio

### Setup python
virtualenv -p python3 /var/www/main/venv
source venv/bin/activate
pip3 install flask
pip3 install mysql-connector-python
pip3 install rpi.gpio
pip3 install Adafruit_Python_DHT

### Create config file
echo \" \
DOMAIN=\"DOMAIN\" \n\
DB_USER=\"root\" \n\
DB_PASS=\"PASSWORD\" \n\
DB_HOST=\"localhost\" \n\
disabled={}
" > config.py

### Startup script
cd /var/www/main
sudo ln thermostat/init.d /etc/init.d/thermostat
sudo update-rc.d thermostat defaults

## Useful tools

### Apache logs (for 500 errors)
sudo cat /var/log/apache2/error.log

### SQL Dumping
To add a new database, first create the database structure and then run
mysqldump -u USER -p --no-data dbname > dbname.sql
