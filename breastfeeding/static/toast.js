const html = `
<link rel="stylesheet" type="text/css" href="shared.css">
<style>
.main {
  margin: 0 10%;
  position: absolute;
  bottom: -100px;
  opacity: 0;
  width: 80%;
  background-color: black;
  border: 2px solid white;
  border-radius: 4px;
  color: white;
  padding: 6px 24px;
  box-sizing: border-box;
  transition: bottom .2s ease-in-out, opacity .2s ease-in-out
}
.visible {
  bottom: 20px;
  opacity: 1;
}
</style>
<div class="main">
  <slot></slot>
</div>
`;


export const showToast = (msg, timeout=2000) => {
  const toast = document.createElement('x-toast');
  toast.innerText = msg;
  toast.classList.add('invisible');
  document.body.appendChild(toast);
  window.setTimeout(() => toast.show());
  window.setTimeout(() => {
    toast.hide();
    window.setTimeout(() => document.body.removeChild(toast), 500);
  }, timeout);
};

class Toast extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(Toast.createEl().content.cloneNode(true));
    this.main = shadowRoot.querySelector('.main');
  }
  static createEl() {
    let template = document.createElement('template');
    template.innerHTML = html;
    return template;
  }
  show() {
    this.main.classList.add('visible');
  }
  hide() {
    this.main.classList.remove('visible');
  }
}
window.customElements.define('x-toast', Toast);