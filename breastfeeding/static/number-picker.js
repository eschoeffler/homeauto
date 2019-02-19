import {addZeros, minutes, hours} from './timeutils.js';
const html = `
<style>
.main {
  position: absolute;
  top: 0;
  background: #444;
  color: white;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  border: 1px solid white;
}
.number {
  flex: 1;
  font-size: 15vw;
  font-family: arial;
  align-items: center;
  justify-content: center;
  display: flex;
}
.numbers {
  display: flex;
  flex-direction: column;
  flex: 1 0 0;
}
.number-row {
  display: flex;
  flex: 1 0 0;
  flex-direction: row;
}
.value-row {
  display: flex;
  flex: none;
  height: 20%;
  width: 100%;
  flex-direction: row;
  border-bottom: 1px solid white;
}
.ampm {
  display: flex;
  flex-direction: column;
}
.ampm-button {
  flex: 1;
  width: 100%;
  color: white;
  font-size: 5vw;
  padding: 0 16px;
  background-color: inherit;
  border: none;
  outline: none
}
.ampm-button.selected {
  background-color: #ccc;
  color: black;
}
.number-button {
  flex: 1 0 0;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-right: 1px solid white;
  border-bottom: 1px solid white;
  background: none;
  outline: none;
  font-size: 6vh;
  margin: 0;
}
.number-button.right {
  border-right: none;
}
.number-button.bottom {
  border-bottom: none;
}
</style>
<div class="main">
  <div class="value-row">
    <div class="number"></div>
    <div class="ampm" display="none"><button id="am" class="ampm-button selected">AM</button><button id="pm" class="ampm-button">PM</button></div>
  </div>
  <div class="numbers">
    <div class="number-row">
      <button value="1" class="number-button">1</button>
      <button value="2" class="number-button">2</button>
      <button value="3" class="number-button right">3</button>
    </div>
    <div class="number-row">
      <button value="4" class="number-button">4</button>
      <button value="5" class="number-button">5</button>
      <button value="6" class="number-button right">6</button>
    </div>
    <div class="number-row">
      <button value="7" class="number-button">7</button>
      <button value="8" class="number-button">8</button>
      <button value="9" class="number-button right">9</button>
    </div>
    <div class="number-row">
      <button value="c" class="number-button bottom">Clr</button>
      <button value="0" class="number-button bottom">0</button>
      <button value="o" class="number-button bottom right">Ok</button>
    </div>
  </div>
</div>
`;


export const showNumberPicker = (format, defaultValue, onPicked) => {
  const numberPicker = document.createElement('number-picker');
  document.body.appendChild(numberPicker);
  numberPicker.format = format;
  numberPicker.default = defaultValue;
  numberPicker.addEventListener('numberselected', () => {
    onPicked(numberPicker);
    document.body.removeChild(numberPicker);
  });
  return numberPicker;
};

export const showTimePicker = (time, onPicked) => {
  const date = new Date(time);
  let hours = date.getHours();
  const isPm = hours >= 12;
  if (hours == 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }
  const numberPicker = showNumberPicker(
      'time', addZeros(hours, 2) + addZeros(date.getMinutes(), 2), onPicked);
  numberPicker.pm = isPm;
  return numberPicker;
};

export const showDurationPicker = (duration, onPicked) => {
  let defaultValue = addZeros(minutes(duration, 60), 2);
  if (hours(duration)) {
    defaultValue = hours(duration) + defaultValue;
  }
  return showNumberPicker('duration', defaultValue, onPicked);
};

export const showDatePicker = (dateTime, onPicked) => {
  const date = new Date(dateTime);
  const defaultValue = addZeros(date.getMonth() + 1, 2) + addZeros(date.getDate(), 2) + addZeros(date.getYear() % 100, 2);
  return showNumberPicker('date', defaultValue, onPicked);
}

const applyFormat = (number, format) => {
  const digits = number.toString().split('');
  let includeAll = false;
  let result = format;
  let next = null;
  while ((result.indexOf('#') > -1 || result.indexOf('?') > -1) && (next = digits.pop()) != null) {
    result = result.replace(/[#?]([^#?]*)$/, `${next}$1`);
  }
  result = result.replace(/\?/g, '');
  result = result.replace(/#/g, '0');
  if (result.indexOf('*') > -1) {
    result = result.replace('*', digits.join(''));
  }
  return result;
};

const parseTime = (str) => {
  const time = str.split(':');
  if (time.length > 1) {
    return [parseInt(time[0]) || 0, parseInt(time[1]) || 0];
  } else {
    return [0, parseInt(str) || 0];
  }
};

const parseDate = (str) => {
  const date = str.split('/');
  if (time.length > 2) {
    return [parseInt(time[0]) || 0, parseInt(time[1]) || 0];
  } else {
    return [0, parseInt(str) || 0];
  }
};

const Format = {
  TIME: 'time',
  DURATION: 'duration',
  DATE: 'date'
};

const getFormat = (format) => {
  if (format == Format.TIME) {
    return '?#:##';
  } else if (format == Format.DURATION) {
    return '*#:##';
  } else if (format == Format.DATE) {
    return '##/##/##';
  } else {
    return format;
  }
}

class NumberPicker extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(NumberPicker.createEl().content.cloneNode(true));
    this.numberEl = shadowRoot.querySelector(".number");
    this.ampmEl = shadowRoot.querySelector(".ampm");
    this.amButton = shadowRoot.querySelector("#am");
    this.pmButton = shadowRoot.querySelector("#pm");
    this.amButton.onclick = () => this.pm = false;
    this.pmButton.onclick = () => this.pm = true;
    this.attributeChangedCallback('value', 0, 0);
    for (const button of shadowRoot.querySelectorAll('.number-button')) {
      button.addEventListener('click', (e) => this.onButtonClicked(e));
    }
  }
  onButtonClicked(e) {
    const val = e.target.value;
    if (val == 'c') {
      this.value = '';
    } else if (val == 'o') {
      this.dispatchEvent(new Event('numberselected'));
    } else {
      this.addNumber(val);
    }
  }
  static get observedAttributes() {
    return ['value', 'default', 'format', 'pm'];
  }
  get value() {
    return this.hasAttribute('value') ? parseInt(this.getAttribute('value')) || 0 : '';
  }
  get computedValue() {
    return this.hasAttribute('value') ? this.value : this.default;
  }
  get displayValue() {
    return applyFormat(this.computedValue, getFormat(this.format));
  }
  set value(val) {
    if (val) {
      this.setAttribute('value', parseInt(val) || 0);
    } else {
      this.removeAttribute('value');
    }
  }
  get pm() {
    return this.hasAttribute('pm');
  }
  set pm(isPm) {
    if (isPm) {
      this.setAttribute('pm', '');
    } else {
      this.removeAttribute('pm');
    }
  }
  get default() {
    return parseInt(this.getAttribute('default')) || 0;
  }
  set default(val) {
    const numVal = parseInt(val) || 0;
    if (numVal) {
      this.setAttribute('default', numVal);
    } else {
      this.removeAttribute('default');
    }
  }
  get format() {
    return this.getAttribute('format') || '*';
  }
  set format(val) {
    if (val) {
      this.setAttribute('format', val);
    } else {
      this.removeAttribute('format');
    }
  }
  getDate(originalTime) {
    const dateTime = new Date(originalTime);
    const date = parseDate(this.displayValue);
    dateTime.setMonth(date[0] + 1);
    dateTime.setDate(date[1]);
    dateTime.setYear(2000 + date[2]);
    return dateTime.getTime();
  }
  getDuration() {
    const time = parseTime(this.displayValue);
    return time[0] * 60 * 60 * 1000 + time[1] * 60 * 1000;
  }
  getTime(originalTime) {
    const dateTime = new Date(originalTime);
    const time = parseTime(this.displayValue);
    let hours = time[0];
    if (hours == 12 && !this.pm) {
      hours = 0;
    } else if (hours != 12 && this.pm) {
      hours += 12
    }
    dateTime.setHours(hours);
    dateTime.setMinutes(time[1]);
    return dateTime.getTime();
  }
  addNumber(val) {
    this.value = ('' + this.value) + val;
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name == 'value' || name == 'default' || name == 'format') {
      this.numberEl.innerText = this.displayValue;
    }
    if (name == 'format') {
      this.ampmEl.style.display = this.format == Format.TIME ? '' : 'none';
    }
    if (name == 'pm') {
      if (this.pm) {
        this.amButton.classList.remove('selected');
        this.pmButton.classList.add('selected');
      } else {
        this.amButton.classList.add('selected');
        this.pmButton.classList.remove('selected');
      }
    }
  }
  static createEl() {
    let template = document.createElement('template');
    template.innerHTML = html;
    return template;
  }
}
window.customElements.define('number-picker', NumberPicker);