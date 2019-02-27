import {timeStr, longDurationStr} from './timeutils.js';
import {model} from './model.js';
import {showNumberPicker, showTimePicker, showDurationPicker} from './number-picker.js';

const html = `
<link rel="stylesheet" type="text/css" href="shared.css">
<style>
.main {
  position: absolute;
  top: 0;
  background: #444;
  height: 100%;
  width: 100%;
  text-align: center;
}
#number-picker {
  position: absolute;
  width: 100%;
  height: 100%;
}
.edit-feature {
  padding: 16px 0;
}
</style>
<div class="main">
  <div class="edit-feature">
    <div><label for="duration">Start Time</label></div>
    <date-selector id="day"></date-selector><button id="start-time"></button>
  </div>
  <div class="edit-feature">
    <div><label for="duration">Duration</label></div>
    <button id="duration"></button>
  </div>
  <div class="edit-feature">
    <button id="done">Done</button>
  </div>
</div>
`;

export const editSleep = (id) => {
  const sleepEdit = document.createElement('sleep-edit');
  sleepEdit.mid = id;
  document.body.appendChild(sleepEdit);
  sleepEdit.addEventListener('done', () => document.body.removeChild(sleepEdit));
};

class SleepEdit extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(SleepEdit.createEl().content.cloneNode(true));
    this.dateEl = shadowRoot.querySelector('#day');
    this.startTimeEl = shadowRoot.querySelector('#start-time');
    this.durationEl = shadowRoot.querySelector('#duration');
    this.doneEl = shadowRoot.querySelector('#done');

    this.dateEl.addEventListener('change', () => this.updateDate());
    this.startTimeEl.onclick = () => this.editStartTime();
    this.durationEl.onclick = () => this.editDuration();
    this.doneEl.onclick = () => this.saveAndQuit();

    this.sleep = model.getSleep(this.getAttribute('mid'));
    this.update();
  }
  static get observedAttributes() {
    return ['mid'];
  }
  static createEl() {
    let template = document.createElement('template');
    template.innerHTML = html;
    return template;
  }
  set mid(val) {
    if (val) {
      this.setAttribute('mid', val);
    } else {
      this.removeAttribute('mid');
    }
  }
  get mid() {
    return this.getAttribute('mid') || '';
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name == 'mid') {
      this.sleep = model.getSleep(this.getAttribute('mid'));
      this.update();
    }
  }
  saveAndQuit() {
    model.modifySleep(this.getAttribute('mid'), this.sleep);
    this.dispatchEvent(new Event('done'));
  }
  update() {
    if (!this.sleep) return;
    this.dateEl.valueAsDate = new Date(this.sleep.startTime);
    this.startTimeEl.innerText = timeStr(this.sleep.startTime);
    this.durationEl.innerText = longDurationStr(this.sleep.duration || 0);
  }

  updateDate() {
    this.sleep.startTime = this.dateEl.getDateTime(this.sleep.startTime);
  }

  editStartTime() {
    showTimePicker(this.sleep.startTime,
        (picker) => {
          this.sleep.startTime = picker.getTime(this.sleep.startTime);
          this.update();
        });
  }

  editDuration() {
    showDurationPicker(this.sleep.duration,
        (picker) => {
          this.sleep.duration = picker.getDuration();
          this.update();
        });
  }
}
window.customElements.define('sleep-edit', SleepEdit);