import {timeStr, minutes, shortDurationStr} from './timeutils.js';
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
    <source-selector id="source-selector"></source-selector>
  </div>
  <div class="edit-feature">
    <div><label for="duration">Start Time</label></div>
    <button id="start-time"></button>
  </div>
  <div class="edit-feature">
    <div><label for="duration">Duration</label></div>
    <button id="duration"></button>
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

export const editFeedPart = (id) => {
  const feedPartEdit = document.createElement('feed-part-edit');
  feedPartEdit.mid = id;
  document.body.appendChild(feedPartEdit);
  feedPartEdit.addEventListener('done', () => document.body.removeChild(feedPartEdit));
};

class FeedPartEdit extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(FeedPartEdit.createEl().content.cloneNode(true));
    this.sourceSelector = shadowRoot.querySelector("#source-selector");
    this.sourceSelector.addEventListener('select', () => {
      if (this.feedPart) {
        this.feedPart.source = this.sourceSelector.selected;
        this.update();
      }
    });
    this.startTimeEl = shadowRoot.querySelector('#start-time');
    this.durationEl = shadowRoot.querySelector('#duration');
    this.amountEl = shadowRoot.querySelector('#amount');
    this.doneEl = shadowRoot.querySelector('#done');
    this.doneEl.onclick = () => this.saveAndQuit();
    this.feedPart = model.getFeedPart(this.getAttribute('mid'));
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
      this.feedPart = model.getFeedPart(this.getAttribute('mid'));
      this.update();
    }
  }
  saveAndQuit() {
    model.modifyFeedPart(this.getAttribute('mid'), this.feedPart);
    this.dispatchEvent(new Event('done'));
  }
  update() {
    if (!this.feedPart) return;
    this.sourceSelector.setAttribute('selected', this.feedPart.source);
    this.startTimeEl.innerText = timeStr(this.feedPart.startTime);
    this.durationEl.innerText = shortDurationStr(this.feedPart.duration || 0);
    this.amountEl.innerText = (this.feedPart.amount || 0) + ' ml';
    this.startTimeEl.onclick = () => this.editStartTime();
    this.durationEl.onclick = () => this.editDuration();
    this.amountEl.onclick = () => this.editAmount();
  }

  editStartTime() {
    showTimePicker(this.feedPart.startTime,
        (picker) => {
          this.feedPart.startTime = picker.getTime(this.feedPart.startTime);
          this.update();
        });
  }

  editDuration() {
    showNumberPicker('* mins', minutes(this.feedPart.duration || 0),
        (picker) => {
          this.feedPart.duration = picker.value * 60 * 1000;
          this.update();
        });
  }

  editAmount() {
    showNumberPicker('* ml', this.feedPart.amount || 0,
        (picker) => {
          this.feedPart.amount = picker.value;
          this.update();
        });
  }
}
window.customElements.define('feed-part-edit', FeedPartEdit);