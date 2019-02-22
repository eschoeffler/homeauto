import {addZeros} from './timeutils.js';
import {Endpoint, fetch} from './api.js';
import {getBabyId} from './baby-id.js';

const uid = () => {
  return new Date().getTime() + addZeros(Math.floor(Math.random() * 1000), 3);
};

export const State = {
  IDLE: 0,
  SLEEP: 1,
  FEED: 2,
  PUMP: 3
};
export const Source = {
  LEFT: 1,
  BOTTLE: 2,
  RIGHT: 3
};
export const sourceToStr = (source) => {
  switch (source) {
    case Source.LEFT: return 'Left';
    case Source.BOTTLE: return 'Bottle';
    case Source.RIGHT: return 'Right';
    default: return '';
  }
}
export const Tab = {
  RECORD: 'record',
  FEEDS: 'feeds',
  PUMPS: 'pumps',
  SLEEPS: 'sleeps'
}
class DefaultMap {
  constructor(createDefault) {
    this.map = new Map();
    this.createDefault = createDefault;
  }
  getWithDefault(key) {
    if (!this.map.has(key)) {
      this.map.set(key, this.createDefault());
    }
    return this.map.get(key);
  }
  map() {
    return this.map;
  }
}
class Model {
  constructor() {
    this.timer = null;
    this.tab = Tab.RECORD;
    this.activeState = {type: State.IDLE};
    this.sleeps = [];
    this.feeds = [];
    // Map from feed ID to array of feed parts.
    this.feedParts = new DefaultMap(() => []);
    this.feedPartsById = new Map();
    this.pumps = [];
    this.listeners = {};
    this.dirty = new Set();
    this.load();
    this.listen((e) => {
      if (e.changed.has('activeState') || e.changed.has('tab')) this.save();
    });
  }

  listen(fn) {
    const id = uid();
    this.listeners[id] = fn;
    return id;
  }

  unlisten(id) {
    delete this.listeners[id];
  }

  invalidate(datatype) {
    this.dirty.add(datatype);
    requestAnimationFrame(() => {
      for (const id in this.listeners) {
        this.listeners[id]({changed: this.dirty});
      }
      this.dirty.clear();
    });
  }

  setTab(tab) {
    this.tab = tab;
    this.invalidate('tab');
  }

  setBaby(babyId) {
    this.babyId = getBabyId(babyId);
    localStorage.setItem('babyId', babyId);
    this.loadData();
    this.invalidate('babyId');
  }

  clear() {
    this.sleeps = [];
    this.feeds = [];
    // Map from feed ID to array of feed parts.
    this.feedParts = new DefaultMap(() => []);
    this.feedPartsById = new Map();
    this.pumps = [];
    this.invalidate('sleeps');
    this.invalidate('feeds');
    this.invalidate('feedParts');
    this.invalidate('pumps');
  }

  load() {
    const babyId = getBabyId(new URL(window.location.href).searchParams.get('setBabyId'));
    if (babyId) {
      this.setBaby(babyId);
    } else {
      this.babyId = localStorage.getItem('babyId');
      this.invalidate('babyId');
    }

    const activeState = localStorage.getItem('activeState');
    if (activeState) {
      this.invalidate('activeState');
      this.activeState = JSON.parse(activeState);
    }
    const tab = localStorage.getItem('tab');
    if (tab != null) {
      this.setTab(tab);
    }
    this.loadData();
  }

  loadData() {
    if (!this.babyId) return;
    this.clear();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7);
    const from = fromDate.getTime();
    const babyId = this.babyId;
    const data = {from, babyId};
    fetch(Endpoint.FEED_LIST, data).then((result) => {
      this.invalidate('feeds');
      result.feeds.forEach((feed) => this.addFeed_(feed));
    });
    fetch(Endpoint.FEED_PART_LIST, data).then((result) => {
      this.invalidate('feedParts');
      result.feedParts.forEach((feedPart) => this.addFeedPart_(feedPart));
    });
    fetch(Endpoint.SLEEP_LIST, data).then((result) => {
      this.invalidate('sleeps');
      result.sleeps.forEach((sleep) => this.addSleep_(sleep));
    });
    fetch(Endpoint.PUMP_LIST, data).then((result) => {
      this.invalidate('pumps');
      result.pumps.forEach((pump) => this.addPump_(pump));
    });
  }

  save() {
    localStorage.setItem('activeState', JSON.stringify(this.activeState));
    localStorage.setItem('tab', this.tab);
  }

  syncTimer(name, timerEl) {
    timerEl.recorded = localStorage.getItem(`timerRecorded-${name}`);
    timerEl.runningSince = localStorage.getItem(`timerRunningSince-${name}`);
    timerEl.addEventListener('timerchange', () => {
      localStorage.setItem(`timerRecorded-${name}`, timerEl.recorded);
      localStorage.setItem(`timerRunningSince-${name}`, timerEl.runningSince);
    });
  }

  startSleep() {
    this.invalidate('activeState');
    this.activeState.type = State.SLEEP;
    const sleep = {startTime: new Date().getTime(), duration: 0};
    this.addSleep(sleep);
    this.activeState.value = sleep;
  }

  completeSleep(duration) {
    if (this.activeState.type != State.SLEEP) return;
    this.invalidate('activeState');
    const sleep = Object.assign({}, this.activeState.value);
    sleep.duration = duration;
    this.modifySleep(sleep.id, sleep);
    this.activeState = {type: State.IDLE};
  }

  openFeed(id) {
    this.invalidate('activeState');
    this.setTab(Tab.RECORD);
    this.activeState.type = State.FEED;
    this.activeState.value = {
      feedId: id,
    };
  }

  startFeed() {
    this.invalidate('activeState');
    this.activeState.type = State.FEED;
    const feed = {startTime: new Date().getTime()};
    const id = this.addFeed(feed);
    this.activeState.value = {
      feedId: id,
    };
  }

  completeFeed() {
    if (this.activeState.type != State.FEED) return;
    this.invalidate('activeState');
    this.activeState = {type: State.IDLE};
  }

  startFeedPart(source) {
    if (this.activeState.type != State.FEED) this.startFeed();
    this.invalidate('activeState');
    this.activeState.value.activeFeedPart = {
      startTime: new Date().getTime(),
      source,
      feedId: this.activeState.value.feedId
    };
  }

  completeFeedPart({duration=undefined, amount=undefined}) {
    if (this.activeState.type != State.FEED || !this.activeState.value.activeFeedPart) return;
    this.invalidate('activeState');
    const feedPart = Object.assign(this.activeState.value.activeFeedPart, {
      duration,
      amount
    });
    this.activeState.value.activeFeedPart = undefined;
    this.addFeedPart(feedPart);
  }

  startPump() {
    this.invalidate('activeState');
    this.activeState.type = State.PUMP;
    this.activeState.value = {startTime: new Date().getTime()};
  }

  completePump(pump) {
    if (this.activeState.type != State.PUMP) return;
    this.invalidate('activeState');
    pump.startTime = this.activeState.value.startTime;
    const id = this.addPump(pump);
    this.activeState = {type: State.IDLE};
    return id;
  }

  addSleep(sleep) {
    if (!sleep.id) sleep.id = uid();
    fetch(Endpoint.SLEEP_ADD, Object.assign({}, sleep, {babyId: this.babyId}));
    this.addSleep_(sleep);
    return sleep.id;
  }

  addSleep_(sleep) {
    this.invalidate('sleep');
    this.add_(this.sleeps, sleep);
  }

  removeSleep(id) {
    this.invalidate('sleep');
    this.remove_(this.sleeps, id);
    fetch(Endpoint.SLEEP_REMOVE, {id});
  }

  modifySleep(id, sleep) {
    this.invalidate('sleep');
    sleep.id = id;
    fetch(Endpoint.SLEEP_MODIFY, sleep);
    this.modify_(this.sleeps, sleep);
  }

  getSleep(id) {
    return Object.assign({}, this.sleeps.find(item => item.id == id));
  }

  addFeed(feed) {
    if (!feed.id) feed.id = uid();
    fetch(Endpoint.FEED_ADD, Object.assign({}, feed, {babyId: this.babyId}));
    this.addFeed_(feed);
    return feed.id;
  }

  addFeed_(feed) {
    this.invalidate('feeds');
    this.add_(this.feeds, feed);
  }

  removeFeed(id) {
    this.invalidate('feeds');
    this.remove_(this.feeds, id);
    fetch(Endpoint.FEED_REMOVE, {id});
  }

  modifyFeed(id, feed) {
    this.invalidate('feeds');
    feed.id = id;
    fetch(Endpoint.FEED_MODIFY, feed);
    this.modify_(this.feeds, sleep);
  }

  addFeedPart(feedPart) {
    if (!feedPart.id) feedPart.id = uid();
    fetch(Endpoint.FEED_PART_ADD, Object.assign({}, feedPart, {babyId: this.babyId}));
    this.addFeedPart_(feedPart);
    return feedPart.id;
  }

  addFeedPart_(feedPart) {
    this.invalidate('feedParts');
    this.add_(this.feedParts.getWithDefault(feedPart.feedId), feedPart);
    this.feedPartsById.set(feedPart.id, feedPart);
  }

  modifyFeedPart(id, feedPart) {
    this.invalidate('feedParts');
    feedPart.id = id;
    fetch(Endpoint.FEED_PART_MODIFY, feedPart);
    this.modify_(this.feedParts.getWithDefault(feedPart.feedId), feedPart);
    this.feedPartsById.set(id, feedPart);
  }
  removeFeedPart(id) {
    this.invalidate('feedParts');
    for (const feedParts of this.feedParts.map.values()) {
      this.remove_(feedParts, id);
    }
    this.feedPartsById.delete(id);
    fetch(Endpoint.FEED_PART_REMOVE, {id});
  }

  getFeedPart(id) {
    return Object.assign({}, this.feedPartsById.get(id));
  }

  getFeedParts(feedId) {
    return this.feedParts.map.get(feedId) || [];
  }

  addPump(pump) {
    if (!pump.id) pump.id = uid();
    fetch(Endpoint.PUMP_ADD, Object.assign({}, pump, {babyId: this.babyId}));
    this.addPump_(pump);
    return pump.id;
  }

  addPump_(pump) {
    this.invalidate('pump');
    this.add_(this.pumps, pump);
  }

  removePump(id) {
    this.invalidate('pump');
    this.remove_(this.pumps, id);
    fetch(Endpoint.PUMP_REMOVE, {id});
  }

  modifyPump(id, pump) {
    this.invalidate('pump');
    pump.id = id;
    fetch(Endpoint.PUMP_MODIFY, pump);
    this.modify_(this.pumps, pump);
  }

  getPump(id) {
    return Object.assign({}, this.pumps.find(item => item.id == id));
  }

  add_(array, value) {
    array.push(value);
    array.sort((a, b) => b.startTime - a.startTime);
  }
  remove_(array, id) {
    const index = array.findIndex((item) => item.id == id);
    if (index >= 0) {
      array.splice(index, 1);
    }
  }
  modify_(array, value) {
    const index = array.findIndex((item) => item.id == value.id);
    if (index >= 0) {
      array[index] = value;
    }
  }
}

export const model = new Model();

/**
 * @typedef
 * {
 *   startTime: number,
 *.  duration: number
 * }
 */
const Sleep = {};

/**
 * @typedef
 * {
 *   startTime: number
 * }
 */
const Feed = {};

/**
 * @typedef
 * {
 *   feedId: string,
 *   source: Source,
 *   startTime: number,
 *   duration: number|undefined,
 *   amount: number|undefined
 * }
 */
const FeedPart = {};

/**
 * @typedef
 * {
 *   suction: number,
 *   rate: number,
 *   startTime: number,
 *   duration: number,
 *   amount: number
 * }
 */
const Pump = {};
