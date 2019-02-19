import {model} from './model.js';
import {longDurationStr, timeStr, datesEqual} from './timeutils.js';
import {editSleep} from './sleep-edit.js';

const html = `
<link rel="stylesheet" type="text/css" href="shared.css">
<link rel="stylesheet" type="text/css" href="list.css">
<style>
#main {
  height: 100%;
}
#sleep-list {
  height: 100%;
  overflow: scroll;
}
</style>
<div id="main">
  <div id="sleep-list"></div>
</div>
`;

class SleepTab extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(SleepTab.createEl().content.cloneNode(true));
    this.sleepListEl = shadowRoot.querySelector('#sleep-list');
    model.listen((e) => this.handleUpdate(e));
    this.update();
  }
  static get observedAttributes() {
    return ['active'];
  }
  static createEl() {
    let template = document.createElement('template');
    template.innerHTML = html;
    return template;
  }
  get active() {
    this.hasAttribute('active')
  }
  set active(val) {
    if (val) {
      this.setAttribute('active', '');
    } else {
      this.removeAttribute('active');
    }
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name == 'active' && newValue != null) {
      this.update();
    }
  }
  handleUpdate(e) {
    if (!e.changed.has('sleep')) return;
    this.update();
  }
  update() {
    let lastDate = null;
    let lastListHeader = null;
    let total = 0;
    const addSleepToHeader = () => {
      if (lastListHeader && total) {
        lastListHeader.innerText = `${lastListHeader.innerText} · ${longDurationStr(total)}`;
        total = 0;
      }
    }
    this.sleepListEl.innerHTML = '';
    for (const sleep of model.sleeps) {
      const date = new Date(sleep.startTime);
      // Shift date by 19 hours so that metrics are for 7PM-7PM 24 hour period
      date.setHours(date.getHours() - 19);
      if (!lastDate || !datesEqual(lastDate, date)) {
        addSleepToHeader();
        const listHeader = document.createElement('div');
        listHeader.className = "list-header";
        listHeader.innerText = date.toLocaleDateString("en-US", {year: "numeric", day: "numeric", month: "short"})
        lastDate = date;
        this.sleepListEl.appendChild(listHeader);
        lastListHeader = listHeader;
      }
      total += sleep.duration;
      const listItem = document.createElement('list-item');
      listItem.innerHTML = sleepStr(sleep);
      listItem.onpress = () => editSleep(sleep.id);
      listItem.onlongpress = () => listItem.deletable = true;
      listItem.ondelete = () => model.removeSleep(sleep.id);
      const clear = () => {
        listItem.deletable = false;
        document.body.removeEventListener('click', clear);
      };
      document.body.addEventListener('click', clear);
      this.sleepListEl.appendChild(listItem);
    }
    addSleepToHeader();
  }
}
const sleepStr = (sleep) => {
  return `
  <div class="row">
    <div class="left">
      ${timeStr(sleep.startTime)}
    </div>
    <div class="right">
      ${longDurationStr(sleep.duration)}
    </div>
  </div>
  `;
}
window.customElements.define('sleep-tab', SleepTab);