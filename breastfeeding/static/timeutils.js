export const addZeros = (num, size) => {
  let numStr = num.toString();
  const numZeros = size - numStr.length;
  for (let i = 0; i < numZeros; i++) {
    numStr = '0' + numStr;
  }
  return numStr;
};

/* Returns the seconds part of a clock for the given millis.  */
export const seconds = (millis, limit=millis+1) => {
  return Math.floor(millis / 1000) % limit;
};

/* Returns the minutes part of a clock for the given millis.  */
export const hours = (millis, limit=millis+1) => {
  return Math.floor(millis / 3600000) % limit;
};

/* Returns the minutes part of a clock for the given millis.  */
export const minutes = (millis, limit=millis+1) => {
  return Math.floor(millis / 60000) % limit;
};

export const timerStr = (millis) => {
  if (hours(millis) > 0) {
    return `${hours(millis)}:${addZeros(minutes(millis, 60), 2)}:${addZeros(seconds(millis, 60), 2)}`;
  } else {
    return `${minutes(millis)}:${addZeros(seconds(millis, 60), 2)}`;
  }
};

export const shortDurationStr = (millis) => {
  return `${minutes(millis)} mins`;
};

export const longDurationStr = (millis) => {
  const hoursStr = hours(millis) ? hours(millis) + ' hrs' : '';
  const minsStr = minutes(millis, 60) + ' mins';
  return [hoursStr, minsStr].join(' ');
};

export const timeStr = (millis) => {
  const d = new Date(millis);
  let hourOfDay = d.getHours();
  let amPm = 'am';
  if (hourOfDay == 0) {
    amPm = 'am';
    hourOfDay = 12;
  } else if (hourOfDay == 12) {
    amPm = 'pm';
  } else if (hourOfDay > 12) {
    hourOfDay = hourOfDay - 12;
    amPm = 'pm';
  }
  return `${hourOfDay}:${addZeros(d.getMinutes(), 2)}${amPm}`;
}

export const numberFromDuration = (duration) => {
  let val = addZeros(minutes(duration, 60), 2);
  if (hours(duration)) {
    return hours(duration) + val;
  }
  return val;
};

export const datesEqual = (date1, date2) => {
  return date1.getYear() == date2.getYear() && date1.getMonth() == date2.getMonth() && date1.getDate() == date2.getDate();
};