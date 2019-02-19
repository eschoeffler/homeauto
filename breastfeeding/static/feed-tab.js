import {model, sourceToStr, Source} from './model.js';
import {timeStr, minutes, datesEqual} from './timeutils.js';

const html = `
<link rel="stylesheet" type="text/css" href="shared.css">
<link rel="stylesheet" type="text/css" href="list.css">
<style>
#main {
  height: 100%;
}
#feeds-list {
  height: 100%;
  overflow: scroll;
}
</style>
<div id="main">
  <div id="feeds-list"></div>
</div>
`;

class FeedTab extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(FeedTab.createEl().content.cloneNode(true));
    this.feedsListEl = shadowRoot.querySelector('#feeds-list');
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
    if (!e.changed.has('feeds') && !e.changed.has('feedParts')) return;
    this.update();
  }
  update() {
    let lastDate = null;
    let lastListHeader = null;
    let count = 0;
    const addFeedsToHeader = () => {
      if (lastListHeader && count) {
        lastListHeader.innerText = `${lastListHeader.innerText} · ${count} feeds`;
        count = 0;
      }
    };
    this.feedsListEl.innerHTML = '';
    for (const feed of model.feeds) {
      const date = new Date(feed.startTime);
      if (!lastDate || !datesEqual(lastDate, date)) {
        addFeedsToHeader();
        const listHeader = document.createElement('div');
        listHeader.className = "list-header";
        listHeader.innerText = date.toLocaleDateString("en-US", {year: "numeric", day: "numeric", month: "short"})
        lastDate = date;
        this.feedsListEl.appendChild(listHeader);
        lastListHeader = listHeader;
      }
      count++;
      const listItem = document.createElement('list-item');
      listItem.innerHTML = feedStr(feed);
      listItem.onpress = () => model.openFeed(feed.id);
      listItem.onlongpress = () => listItem.deletable = true;
      listItem.ondelete = () => model.removeFeed(feed.id);
      const clear = () => {
        listItem.deletable = false;
        document.body.removeEventListener('click', clear);
      };
      document.body.addEventListener('click', clear);
      this.feedsListEl.appendChild(listItem);
    }
    addFeedsToHeader();
  }
}
const feedStr = (feed) => {
  const feedParts = model.getFeedParts(feed.id);
  let totalDuration = 0;
  let totalAmount = 0;
  let startTime = feedParts.length ? feedParts[feedParts.length - 1].startTime : feed.startTime;
  feedParts.length ? sourceToStr(feedParts[0].source) : '';
  let lastSource = undefined;
  for (const feedPart of feedParts) {
    if (feedPart.amount) {
      totalAmount += feedPart.amount || 0;
    } else {
      totalDuration += feedPart.duration || 0;
    }
    if (!lastSource || lastSource == Source.BOTTLE) {
      lastSource = feedPart.source;
    }
  }
  totalDuration = minutes(totalDuration);
  let totalDurationStr = totalDuration ? `${totalDuration} mins` : '';
  let totalAmountStr = totalAmount ? `${totalAmount} ml` : '';

  let amountStr = '';
  if (totalDurationStr && totalAmountStr) {
    amountStr = [totalDurationStr, totalAmountStr].join(' ');
  } else if (totalAmountStr) {
    amountStr = totalAmountStr;
  } else {
    amountStr = totalDurationStr || '0 mins';
  }
  return `
  <div class="row">
    <div class="left">
      ${timeStr(startTime)}
    </div>
    <div class="middle">
      ${sourceToStr(lastSource)}
    </div>
    <div class="right">
      ${amountStr}
    </div>
  </div>
  `;
}
window.customElements.define('feed-tab', FeedTab);