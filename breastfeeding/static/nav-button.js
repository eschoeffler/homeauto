const html = `
<style>
.main {
  background-color: inherit;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  display: block;
  text-align:center;
}
button {
  color: inherit;
  background-color: inherit;
  border: none;
  outline: none;
  width: 100%;
  padding: 10px 0;
}
#image {
  width: 36px;
  height: 36px;
  margin-bottom: 6px;
}
</style>
<div class="main">
  <button>
    <img id='image' src=""></img>
    <div class="text"><slot></slot></div>
  </button>
</div>
`;

class NavButton extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(NavButton.createEl().content.cloneNode(true));
    this.imageEl = shadowRoot.querySelector('#image');
    this.updateImage();
  }
  static get observedAttributes() {
    return ['image'];
  }
  static createEl() {
    let template = document.createElement('template');
    template.innerHTML = html;
    return template;
  }
  get navid() {
    return this.getAttribute('navid');
  }
  get image() {
    return this.getAttribute('image') || '';
  }
  set image(val) {
    if (val) {
      this.setAttribute('image', val);
    } else {
      this.removeAttribute('image');
    }
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name == 'image') {
      this.updateImage();
    }
  }
  updateImage() {
    this.imageEl.src = this.image;
  }
}
window.customElements.define('nav-button', NavButton);