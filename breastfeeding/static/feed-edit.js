import {timeStr, minutes} from './timeutils.js'
import {model, State, Source, sourceToStr} from './model.js'
import {editFeedPart} from './feed-part-edit.js';
import {showNumberPicker} from './number-picker.js';

const html = `
<link rel="stylesheet" type="text/css" href="shared.css">
<link rel="stylesheet" type="text/css" href="list.css">
<style>
.main {
  height: 100%;
  width: 100%;
  text-align: left;
}
.padding {
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
}
.button-row {
  margin-top: 16px;
}
</style>
<div class="main">
  <div class="padding">
    <source-selector id="source-selector"></source-selector>
    <x-timer id="timer"></x-timer>
    <div class="button-row">
      <div id="active-buttons">
        <button id="pause">❚❚</button>
        <button id="stop">Finish</button>
      </div>
      <div id="idle-buttons">
        <button id="done">Done</button>
      </div>
    </div>
  </div>
  <div id="feeds"></div>
</div>
`;
class FeedEdit extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(FeedEdit.createEl().content.cloneNode(true));
    shadowRoot.querySelector('#done').onclick = () => this.recordFeed();
    shadowRoot.querySelector('#pause').onclick = () => this.toggleTimer();
    shadowRoot.querySelector('#stop').onclick = () => this.completeFeedPart();
    this.activeButtons = shadowRoot.querySelector('#active-buttons');
    this.idleButtons = shadowRoot.querySelector('#idle-buttons');
    this.pauseButtonEl = shadowRoot.querySelector('#pause')
    this.feedListEl = shadowRoot.querySelector('#feeds');
    this.sourceSelector = shadowRoot.querySelector('#source-selector');
    this.sourceSelector.addEventListener('select', () => this.startFeedPart(this.sourceSelector.selected));
    this.timer = shadowRoot.querySelector("#timer");
    model.syncTimer('feed', this.timer);
    model.listen((e) => this.update(e));
  }
  static createEl() {
    let template = document.createElement('template');
    template.innerHTML = html;
    return template;
  }
  toggleTimer() {
    if (!this.timer.running) {
      this.timer.start();
    } else {
      this.timer.stop();
    }
    this.update({changed: new Set()});
  }
  startFeedPart(source) {
    if (model.activeState.value.activeFeedPart) {
      this.completeFeedPart();
    }
    this.timer.start();
    model.startFeedPart(source);
  }
  completeFeedPart() {
    if (!model.activeState.value.activeFeedPart) return;
    const partialFeedPart = {duration: this.timer.elapsed};
    this.timer.reset();
    if (model.activeState.value.activeFeedPart.source == Source.BOTTLE) {
      showNumberPicker('* ml', 0, (picker) => {
        model.completeFeedPart(Object.assign(partialFeedPart, {
          amount: picker.value
        }));
      });
    } else {
      model.completeFeedPart(partialFeedPart);
    }
  }
  recordFeed() {
    model.completeFeed();
  }
  update(e) {
    if (model.activeState.type != State.FEED) return;
    if (e.changed.has('activeState')) {
      if (model.activeState.value.activeFeedPart) {
        this.sourceSelector.selected =
            model.activeState.value.activeFeedPart.source;
      } else {
        this.sourceSelector.selected = null;
      }
    }
    if (e.changed.has('activeState') || e.changed.has('feedParts')) {
      this.feedListEl.innerHTML = '';
      for (const feedPart of model.getFeedParts(model.activeState.value.feedId)) {
        const listitem = document.createElement('list-item');
        listitem.innerHTML = feedPartStr(feedPart);
        listitem.onpress = () => editFeedPart(feedPart.id);
        listitem.onlongpress = () => listitem.deletable = true;
        listitem.ondelete = () => model.removeFeedPart(feedPart.id);
        const clear = () => {
          listitem.deletable = false;
          document.body.removeEventListener('click', clear);
        };
        document.body.addEventListener('click', clear);
        this.feedListEl.appendChild(listitem);
      }
    }
    this.pauseButtonEl.innerText = this.timer.running ? '❚❚' : 'Resume';
    this.activeButtons.style.display = model.activeState.value.activeFeedPart ? '' : 'none';
    this.idleButtons.style.display = !model.activeState.value.activeFeedPart ? '' : 'none';
  }
}
const feedPartStr = (feedPart) => {
  let amountStr = feedPart.amount ? `${feedPart.amount} ml` : '';
  if (!amountStr) {
    const duration = minutes(feedPart.duration);
    amountStr = duration ? `${duration} mins` : '0 mins';
  }
  return `
  <div class="row">
    <div class="left">
      ${timeStr(feedPart.startTime)}
    </div>
    <div class="middle">
      ${sourceToStr(feedPart.source)}
    </div>
    <div class="right">
      ${amountStr}
    </div>
  </div>
  `;
}
window.customElements.define('feed-edit', FeedEdit);