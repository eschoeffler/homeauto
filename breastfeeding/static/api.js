import {getBabyId} from './baby-id.js';

const BASE = '/_/bf/';

export const Endpoint = {
  FEED_LIST: 'feeds',
  FEED_ADD: 'addfeed',
  FEED_MODIFY: 'changefeed',
  FEED_REMOVE: 'rmfeed',

  FEED_PART_LIST: 'feedparts',
  FEED_PART_ADD: 'addfeedpart',
  FEED_PART_MODIFY: 'changefeedpart',
  FEED_PART_REMOVE: 'rmfeedpart',

  SLEEP_LIST: 'sleeps',
  SLEEP_ADD: 'addsleep',
  SLEEP_MODIFY: 'changesleep',
  SLEEP_REMOVE: 'rmsleep',

  PUMP_LIST: 'pumps',
  PUMP_ADD: 'addpump',
  PUMP_MODIFY: 'changepump',
  PUMP_REMOVE: 'rmpump',

  BABY_ADD: 'addbaby',
  BABY_GET: 'getbaby',
};

export const fetch = (endpoint, data) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const params = new URLSearchParams();
    const babyIdOverride = getBabyId(new URL(window.location.href).searchParams.get('babyId'));
    if (babyIdOverride) {
      data['babyId'] = babyIdOverride;
    }
    for (const key in data) {
      if (data[key]) {
        params.append(key, data[key]);
      }
    }
    const url = BASE + endpoint + '?' + params.toString();
    xhr.open('GET', url);
    xhr.addEventListener('load', () => {
      resolve(JSON.parse(xhr.responseText));
    });
    xhr.send();
  });
}