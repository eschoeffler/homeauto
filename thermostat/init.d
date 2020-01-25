#!/bin/bash
# description: Runs a thermometer checker that records temperatures and turns the fireplace on or off.

THERMOSTAT_PID=""

start() {
  if [ -z "$THERMOSTAT_PID" ]
  then
    /var/www/main/venv/bin/python3 /var/www/main/thermostat/record.py &> /var/log/thermostat/log.txt &
    THERMOSTAT_PID=$!
  fi
}

stop() {
  if [ ! -z "$THERMOSTAT_PID" ]
  then
    kill $THERMOSTAT_PID
    THERMOSTAT_PID=""
  fi
}

case "$1" in 
    start)
       start
       ;;
    stop)
       stop
       ;;
    restart)
       stop
       start
       ;;
    status)
       echo $THERMOSTAT_PID       
       ;;
    *)
       echo "Usage: $0 {start|stop|status|restart}"
esac
