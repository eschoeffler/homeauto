Menu = function() {
  this.el = null;
  this.open = false;
};

Menu.prototype.toggle = function() {
  if (this.open) {
    this.el.classList.remove('open');
    this.open = false;
  } else {
    this.el.classList.add('open');
    this.open = true;
  }
};

Menu.prototype.bind = function(el) {
  this.el = el;
};
