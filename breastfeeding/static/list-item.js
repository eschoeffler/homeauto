const html = `
<style>
.main {
  width: 100%;
  height: 60px;
  padding: 12px 24px;
  border-bottom: white 1px solid;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  -webkit-touch-callout: none !important;
  -webkit-user-select: none !important;
}
.text {
  flex: 1 0 0;
}
button {
  color: white;
  background-color: transparent;
  outline: none;
  border: none;
  flex: none;
  width: 0;
  padding: 0;
  text-align: left;
  transition: width .2s ease-in-out;
  overflow: hidden;
}
img {
  width: 24px;
  height: 24px;
}
</style>
<div class="main">
  <button id="delete"><img src="delete.png"></img></button>
  <button id="edit"><img src="edit.png"></img></button>
  <div class="text">
    <slot></slot>
  </div>
</div>
`;

const LONG_PRESS_TIME = 500;
class ListItem extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(ListItem.createEl().content.cloneNode(true));
    this.deleteBtn = shadowRoot.querySelector('#delete');
    this.editBtn = shadowRoot.querySelector('#edit');
    this.deleteBtn.onclick = () => this.ondelete();
    this.editBtn.onclick = () => this.onedit();
    const main = shadowRoot.querySelector('.text');
    main.addEventListener('touchstart', (e) => this.mouseDown(e), {passive: true});
    main.addEventListener('touchmove', (e) => this.mouseMove(e), {passive: true});
    main.addEventListener('click', (e) => this.click(e), {passive: true});
    this.timeout = null;
    this.onpress = this.onpress || (() => {});
    this.onlongpress = this.onlongpress || (() => {});
    this.ondelete = this.ondelete || (() => {});
    this.onedit = this.onedit || (() => {});
    this.clickIsLong = false;
    this.update();
  }
  static get observedAttributes() {
    return ['editable', 'deletable'];
  }
  static createEl() {
    let template = document.createElement('template');
    template.innerHTML = html;
    return template;
  }
  get editable() {
    return this.hasAttribute('editable') || false;
  }
  set editable(val) {
    if (val) {
      this.setAttribute('editable', '');
    } else {
      this.removeAttribute('editable');
    }
  }
  get deletable() {
    return this.hasAttribute('deletable') || false;
  }
  set deletable(val) {
    if (val) {
      this.setAttribute('deletable', '');
    } else {
      this.removeAttribute('deletable');
    }
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name == 'editable' || name == 'deletable') {
      this.update();
    }
  }
  update() {
    this.deleteBtn.style.width = this.deletable ? '48px' : '';
    this.editBtn.style.width = this.editable ? '48px' : '';
  }
  click(e) {
    window.clearTimeout(this.timeout);
    if (!this.clickIsLong) {
      this.onpress();
    } else {
      this.clickIsLong = false;
    }
  }
  mouseDown(e) {
    this.timeout = window.setTimeout(() => this.longPress(), LONG_PRESS_TIME);
  }
  mouseMove(e) {
    window.clearTimeout(this.timeout);
  }
  longPress() {
    this.timeout = null;
    this.clickIsLong = true;
    this.onlongpress();
  }
}
window.customElements.define('list-item', ListItem);