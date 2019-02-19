import {model, State, Source} from './model.js'

const html = `
<link rel="stylesheet" type="text/css" href="shared.css">
<style>
</style>
<div class="main">
<button id="left" class="left">Left</button><button id="bottle" class="center">Bottle</button><button id="right" class="right">Right</button>
</div>
`;

class SourceSelector extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(SourceSelector.createEl().content.cloneNode(true));
    this.feedButtons = {};
    this.feedButtons[Source.LEFT] = shadowRoot.querySelector('#left');
    this.feedButtons[Source.BOTTLE] = shadowRoot.querySelector('#bottle');
    this.feedButtons[Source.RIGHT] = shadowRoot.querySelector('#RIGHT');
    this.feedButtons[Source.LEFT].onclick = () => this.select(Source.LEFT);
    this.feedButtons[Source.BOTTLE].onclick = () => this.select(Source.BOTTLE);
    this.feedButtons[Source.RIGHT].onclick = () => this.select(Source.RIGHT);
  }
  static createEl() {
    let template = document.createElement('template');
    template.innerHTML = html;
    return template;
  }
  static get observedAttributes() {
    return ['selected'];
  }
  get selected() {
    return parseInt(this.getAttribute('selected')) || null;
  }
  set selected(source) {
    if (source != null) {
      this.setAttribute('selected', source);
    } else {
      this.removeAttribute('selected');
    }
  }
  select(source) {
    this.selected = source;
    this.dispatchEvent(new Event('select'));
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name == 'selected') {
      const oldButton = this.feedButtons[oldValue];
      if (oldButton) {
        oldButton.classList.remove('selected');
      }
      const newButton = this.feedButtons[newValue];
      if (newButton) {
        newButton.classList.add('selected');
      }
    }
  }
}
window.customElements.define('source-selector', SourceSelector);