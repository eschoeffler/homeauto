import {timerStr} from './timeutils.js'

const html = `
<style>
.main {
  font-size: 22vw;
}
</style>
<div class="main">
</div>
`;

class Timer extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(Timer.createEl().content.cloneNode(true));
    this.timeEl = shadowRoot.querySelector(".main");
    this.elapsedChanged();
  }
  static get observedAttributes() {
    return ['recorded', 'running-since'];
  }
  get running() {
    return this.runningSince != null;
  }
  get recorded() {
    return parseInt(this.getAttribute('recorded')) || 0;
  }
  set recorded(val) {
    if (val) {
      this.setAttribute('recorded', val);
    } else {
      this.removeAttribute('recorded');
    }
  }
  get runningSince() {
    return parseInt(this.getAttribute('running-since')) || null;
  }
  set runningSince(val) {
    if (val != null) {
      this.setAttribute('running-since', val);
      requestAnimationFrame(() => this.update());
    } else {
      this.removeAttribute('running-since');
    }
  }
  get elapsed() {
    return this.recorded + (this.running ? new Date().getTime() - this.runningSince : 0)
  }
  reset() {
    this.runningSince = null;
    this.recorded = 0;
    this.dispatchEvent(new Event('timerchange'));
  }
  start() {
    if (this.running) return;
    this.runningSince = new Date().getTime();
    this.dispatchEvent(new Event('timerchange'));
  }
  stop() {
    if (!this.running) return;
    this.recorded += new Date().getTime() - this.runningSince;
    this.runningSince = null;
    this.dispatchEvent(new Event('timerchange'));
  }
  update() {
    if (this.running) {
      this.elapsedChanged();
      requestAnimationFrame(() => this.update());
    }
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.elapsedChanged();
  }
  elapsedChanged() {
    this.timeEl.innerHTML = timerStr(this.elapsed);
  }
  static createEl() {
    let template = document.createElement('template');
    template.innerHTML = html;
    return template;
  }
}
window.customElements.define('x-timer', Timer);