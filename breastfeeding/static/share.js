import {showToast} from './toast.js';
import {fetch, Endpoint} from './api.js';
import {model} from './model.js';

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
  display: flex;
  flex-direction: column;
  align-items: center;
}
.separator {
  color: #ccc;
  margin: 30px;
}
input {
  margin-bottom: 16px;
  width: 306px;
  outline: none;
}
</style>
<div class="main">
  <h1>Share</h1>
  <h3>Create a code to share your baby</h3>
  <button id="create-code">Create code</button>
  <div id="code" class="code"></div>
</div>
`;

class Share extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(CreateBaby.createEl().content.cloneNode(true));
    this.babyNameInput = shadowRoot.querySelector('#baby-name');
    this.createButton = shadowRoot.querySelector('#create');
    this.codeInput = shadowRoot.querySelector('#code');
    this.useCodeButton = shadowRoot.querySelector('#use-code');

    this.createButton.onclick = () => this.createBaby();
    this.useCodeButton.onclick = () => this.useCode();
  }
  static createEl() {
    let template = document.createElement('template');
    template.innerHTML = html;
    return template;
  }
  useCode() {
    const code = this.codeInput.value;
    if (!code) {
      showToast('Please enter a code');
      return;
    }
    fetch(Endpoint.BABY_GET, {code}).then((resp) => {
      if (resp.status == 'SUCCESS') {
        model.setBaby(resp.babyId);
        this.done();
      } else {
        showToast(resp.error);
      }
    });
  }
  createBaby() {
    const name = this.babyNameInput.value;
    if (!name) {
      showToast('Please enter a name');
      return;
    }
    fetch(Endpoint.BABY_ADD, {name}).then((resp) => {
      if (resp.status == 'SUCCESS') {
        model.setBaby(resp.babyId);
        this.done();
      } else {
        showToast(resp.error);
      }
    });
  }
  done() {
    this.dispatchEvent(new Event('done'));
  }
}
window.customElements.define('share-baby', Share);