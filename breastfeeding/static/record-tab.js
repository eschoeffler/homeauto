import {State, model} from './model.js';
import {editPump} from './pump-edit.js';

const html = `
<link rel="stylesheet" type="text/css" href="shared.css">
<style>
.main {
  text-align: center;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
}
#idle-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
}
</style>
<div class="main">
  <div id="idle-state">
    <button id="feed">Feed</button>
    <button id="sleep">Sleep</button>
    <button id="pump">Pump</button>
  </div>
  <feed-edit id="feed-state"></feed-edit>
  <x-timer id="timer"></x-timer>
  <button id="done">Done</button>
</div>
`;

class RecordTab extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(RecordTab.createEl().content.cloneNode(true));
    this.timer = shadowRoot.querySelector("#timer");
    shadowRoot.querySelector('#feed').onclick = () => this.startFeed();
    shadowRoot.querySelector('#sleep').onclick = () => this.startSleep();
    shadowRoot.querySelector('#pump').onclick = () => this.startPump();
    shadowRoot.querySelector('#done').onclick = () => this.done();
    this.idleState = shadowRoot.querySelector('#idle-state');
    this.feedState = shadowRoot.querySelector('#feed-state');
    this.timer = shadowRoot.querySelector('#timer');
    this.doneButton = shadowRoot.querySelector('#done');
    model.syncTimer('record', this.timer);
    model.listen((e) => this.handleUpdate(e));
    this.update();
  }
  static createEl() {
    let template = document.createElement('template');
    template.innerHTML = html;
    return template;
  }
  startFeed() {
    model.startFeed();
  }
  startSleep() {
    model.startSleep();
    this.timer.reset();
    this.timer.start();
  }
  startPump() {
    model.startPump();
    this.timer.reset();
    this.timer.start();
  }
  done() {
    if (model.activeState.type == State.PUMP) {
      const latestPump = model.pumps[0];
      const pump = Object.assign({}, {suction: 4, rate: 38, amount: 0}, latestPump);
      pump.id = undefined;
      pump.duration = this.timer.elapsed;
      const id = model.completePump(pump);
      editPump(id);
    } else if (model.activeState.type == State.SLEEP) {
      model.completeSleep(this.timer.elapsed);
    }
    this.timer.reset();
  }
  handleUpdate(e) {
    if (!e.changed.has('activeState')) return;
    this.update();
  }
  update() {
    this.idleState.style.display = model.activeState.type == State.IDLE ? '' : 'none';
    this.feedState.style.display = model.activeState.type == State.FEED ? '' : 'none';
    this.timer.style.display = model.activeState.type == State.SLEEP || model.activeState.type == State.PUMP ? '': 'none';
    this.doneButton.style.display = model.activeState.type == State.IDLE || model.activeState.type == State.FEED ? 'none': '';
  }
}
window.customElements.define('record-tab', RecordTab);