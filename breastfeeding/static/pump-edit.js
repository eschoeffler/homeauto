import {timeStr, shortDurationStr, minutes} from './timeutils.js';
import {model} from './model.js';
import {showNumberPicker, showTimePicker} from './number-picker.js';

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
.edit-feature {
  padding: 16px 0;
}
.edit-feature-item {
  display: inline-block;
  padding: 0 16px;
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
    <div class="edit-feature-item">
      <div><label for="rate">Rate</label></div>
      <button id="rate"></button>
    </div>
    <div class="edit-feature-item">
      <div><label for="suction">Suction</label></div>
      <button id="suction"></button>
    </div>
  </div>
  <div class="edit-feature">
    <div><label for="amount">Amount</label></div>
    <button id="amount"></button>
  </div>
  <div class="edit-feature">
    <button id="done">Done</button>
  </div>
</div>
`;

export const editPump = (id) => {
  const pumpEdit = document.createElement('pump-edit');
  pumpEdit.mid = id;
  document.body.appendChild(pumpEdit);
  pumpEdit.addEventListener('done', () => document.body.removeChild(pumpEdit));
};

class PumpEdit extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(PumpEdit.createEl().content.cloneNode(true));
    this.dateEl = shadowRoot.querySelector('#day');
    this.startTimeEl = shadowRoot.querySelector('#start-time');
    this.durationEl = shadowRoot.querySelector('#duration');
    this.suctionEl = shadowRoot.querySelector('#suction');
    this.rateEl = shadowRoot.querySelector('#rate');
    this.amountEl = shadowRoot.querySelector('#amount');
    this.doneEl = shadowRoot.querySelector('#done');

    this.dateEl.addEventListener('change', () => this.updateDate());
    this.startTimeEl.onclick = () => this.editStartTime();
    this.durationEl.onclick = () => this.editDuration();
    this.amountEl.onclick = () => this.editAmount();
    this.rateEl.onclick = () => this.editRate();
    this.suctionEl.onclick = () => this.editSuction();
    this.doneEl.onclick = () => this.saveAndQuit();
    this.pump = model.getPump(this.getAttribute('mid'));
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
      this.pump = model.getPump(this.getAttribute('mid'));
      this.update();
    }
  }
  saveAndQuit() {
    model.modifyPump(this.getAttribute('mid'), this.pump);
    this.dispatchEvent(new Event('done'));
  }
  update() {
    if (!this.pump) return;
    this.dateEl.valueAsDate = new Date(this.pump.startTime);
    this.startTimeEl.innerText = timeStr(this.pump.startTime);
    this.durationEl.innerText = shortDurationStr(this.pump.duration);
    this.amountEl.innerText = this.pump.amount + ' ml';
    this.rateEl.innerText = this.pump.rate;
    this.suctionEl.innerText = this.pump.suction;
  }
  updateDate() {
    this.pump.startTime = this.dateEl.getDateTime(this.pump.startTime);
  }

  editStartTime() {
    showTimePicker(this.pump.startTime,
        (picker) => {
          this.pump.startTime = picker.getTime(this.pump.startTime);
          this.update();
        });
  }

  editDuration() {
    showNumberPicker('* mins', minutes(this.pump.duration || 0),
        (picker) => {
          this.pump.duration = picker.value * 60 * 1000;
          this.update();
        });
  }

  editAmount() {
    showNumberPicker('* ml', this.pump.amount,
        (picker) => {
          this.pump.amount = picker.value;
          this.update();
        });
  }

  editRate() {
    showNumberPicker('#', this.pump.rate,
        (picker) => {
          this.pump.rate = picker.value;
          this.update();
        });
  }

  editSuction() {
    showNumberPicker('#', this.pump.rate,
        (picker) => {
          this.pump.suction = picker.value;
          this.update();
        });
  }
}
window.customElements.define('pump-edit', PumpEdit);