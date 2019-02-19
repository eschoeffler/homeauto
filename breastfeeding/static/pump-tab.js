import {model} from './model.js';
import {shortDurationStr, timeStr, datesEqual} from './timeutils.js';
import {editPump} from './pump-edit.js';

const html = `
<link rel="stylesheet" type="text/css" href="shared.css">
<link rel="stylesheet" type="text/css" href="list.css">
<style>
#main {
  height: 100%;
}
#pump-list {
  height: 100%;
  overflow: scroll;
}
</style>
<div id="main">
  <div id="pump-list"></div>
</div>
`;

class PumpTab extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(PumpTab.createEl().content.cloneNode(true));
    this.pumpListEl = shadowRoot.querySelector('#pump-list');
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
    if (!e.changed.has('pump')) return;
    this.update();
  }
  update() {
    let lastDate = null;
    this.pumpListEl.innerHTML = '';
    for (const pump of model.pumps) {
      const date = new Date(pump.startTime);
      if (!lastDate || !datesEqual(lastDate, date)) {
        const listHeader = document.createElement('div');
        listHeader.className = "list-header";
        listHeader.innerText = date.toLocaleDateString("en-US", {year: "numeric", day: "numeric", month: "short"})
        lastDate = date;
        this.pumpListEl.appendChild(listHeader);
      }
      const listItem = document.createElement('list-item');
      listItem.innerHTML = pumpStr(pump);
      listItem.onpress = () => editPump(pump.id);
      listItem.onlongpress = () => listItem.deletable = true;
      listItem.ondelete = () => model.removePump(pump.id);
      const clear = () => {
        listItem.deletable = false;
        document.body.removeEventListener('click', clear);
      };
      document.body.addEventListener('click', clear);
      this.pumpListEl.appendChild(listItem);
    }
  }
}
const pumpStr = (pump) => {
  return `
  <div class="row">
    <div class="left">
      ${timeStr(pump.startTime)}
    </div>
    <div class="middle">
      ${pump.amount} ml
    </div>
    <div class="right">
      ${shortDurationStr(pump.duration)}
    </div>
  </div>
  `;
}
window.customElements.define('pump-tab', PumpTab);