//
// Copyright 2012 Art. Lebedev Studio. All Rights Reserved.
// Created on 2012.12.24
//
// This source code follows Google JavaScript Style Guide
// http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//
// Released under the MIT license - http://opensource.org/licenses/MIT
//

/**
 * @fileoverview Generic checkbox type switcher (many or no elements can be
 * selected).
 *
 * @author Alexander Samilyak (aleksam241@gmail.com)
 */



goog.provide('als.MultipleSwitcher');
/*
  Replace this with `var als = als || {};`
  if your project is not dependant on Closure Library.
*/



/**
 * @param {!jQuery} elems  Switcher elements. Element index is used as its
 * value by default, but you can pass custom value using 'data-value' attribute
 * of element. Selected elements should have class 'selected'.
 * @param {string=} opt_elemLinkSelector  Selector that's used to find
 *    clickable link inside each switcher element.
 *    You can pass '.' to use switcher element itself.
 *    Defaults to '.pseudo'.
 * @constructor
 */
als.MultipleSwitcher = function(elems, opt_elemLinkSelector) {
  /**
   * @type {!jQuery}
   * @private
   */
  this.elems_ = elems;

  /**
   * @type {string}
   * @private
   */
  this.elemLinkSelector_ = opt_elemLinkSelector || '.pseudo';

  /**
   * @type {!Array.<!als.MultipleSwitcher.Item>}
   * @private
   */
  this.items_ = [];

  /**
   * @type {!Object.<string, boolean>}
   * @private
   */
  this.selectedValues_ = {};

  /**
   * @type {boolean}
   * @private
   */
  this.disabled_ = false;

  /**
   * @type {!jQuery}
   * @private
   */
  this.eventsDispatcher_ = jQuery({});


  this.initItems_();
  this.checkItemValuesUniqueness_();
};


/**
 * @enum {string}
 */
als.MultipleSwitcher.EventType = {
  CHANGE: 'change'
};


/**
 * @param {string} value
 * @param {string=} opt_author
 * @constructor
 * @extends {jQuery.event}
 */
als.MultipleSwitcher.ChangeEvent = function(value, opt_author) {
  /**
   * @type {string}
   */
  this.type = als.MultipleSwitcher.EventType.CHANGE;

  /**
   * @type {string}
   */
  this.value = value;

  /**
   * @type {?string}
   */
  this.author = opt_author || null;
};


/**
 * @const
 * @type {string}
 */
als.MultipleSwitcher.CLASS_SELECTED = 'selected';



/**
 * @return {!Array.<string>}
 */
als.MultipleSwitcher.prototype.getAllValues = function() {
  /** @type {!Array.<string>} */
  var values = [];

  for (var i = 0, len = this.items_.length; i < len; i++) {
    values.push(this.items_[i].getValue_());
  }

  return values;
};


/**
 * @return {!Array.<string>}
 */
als.MultipleSwitcher.prototype.getSelectedValues = function() {
  /** @type {!Array.<string>} */
  var values = [];

  for (var i = 0, len = this.items_.length; i < len; i++) {
    /** @type {string} */
    var value = this.items_[i].getValue_();

    if (this.isValueSelected(value)) {
      values.push(value);
    }
  }

  return values;
};


/**
 * @param {!Array.<string>} valuesToSet
 */
als.MultipleSwitcher.prototype.setValues = function(valuesToSet) {
  /** @type {!Array.<string>} */
  var allValues = this.getAllValues();

  for (var i = 0, len = allValues.length; i < len; i++) {
    /** @type {string} */
    var oneValue = allValues[i];

    if (jQuery.inArray(oneValue, valuesToSet) !== -1) {
      this.selectValue(oneValue);
    } else {
      this.deselectValue(oneValue);
    }
  }
};


/**
 * @param {string} value
 * @return {boolean}
 */
als.MultipleSwitcher.prototype.isValueSelected = function(value) {
  return (this.selectedValues_[value] === true);
};


/**
 * @param {string} value
 * @param {string=} opt_author
 */
als.MultipleSwitcher.prototype.toggleValue = function(value, opt_author) {
  if (this.isValueSelected(value)) {
    this.deselectValue(value, opt_author);
  } else {
    this.selectValue(value, opt_author);
  }
};


/**
 * @param {string} value
 * @param {string=} opt_author
 */
als.MultipleSwitcher.prototype.selectValue = function(value, opt_author) {
  if (this.isValueSelected(value)) {
    return;
  }

  this.selectedValues_[value] = true;
  this.getItemByValue_(value).select_();

  this.eventsDispatcher_.trigger(
      new als.MultipleSwitcher.ChangeEvent(value, opt_author));
};


/**
 * @param {string} value
 * @param {string=} opt_author
 */
als.MultipleSwitcher.prototype.deselectValue = function(value, opt_author) {
  if (!this.isValueSelected(value)) {
    return;
  }

  delete this.selectedValues_[value];
  this.getItemByValue_(value).deselect_();

  this.eventsDispatcher_.trigger(
      new als.MultipleSwitcher.ChangeEvent(value, opt_author));
};


/**
 * @return {boolean}
 */
als.MultipleSwitcher.prototype.isDisabled = function() {
  return this.disabled_;
};


als.MultipleSwitcher.prototype.enable = function() {
  this.disabled_ = false;
};


als.MultipleSwitcher.prototype.disable = function() {
  this.disabled_ = true;
};


/**
 * @param {als.MultipleSwitcher.EventType} eventType
 * @param {function(!jQuery.event)} callback
 */
als.MultipleSwitcher.prototype.addEventListener = function(
    eventType, callback) {

  this.eventsDispatcher_.bind(eventType, callback);
};


/**
 * @param {als.MultipleSwitcher.EventType} eventType
 * @param {function(!jQuery.event=)} callback
 */
als.MultipleSwitcher.prototype.removeEventListener = function(
    eventType, callback) {

  this.eventsDispatcher_.unbind(eventType, callback);
};


/**
 * @private
 */
als.MultipleSwitcher.prototype.initItems_ = function() {
  for (var i = 0, len = this.elems_.length; i < len; i++) {
    /** @type {!jQuery} */
    var elem = this.elems_.eq(i);

    /** @type {!jQuery} */
    var link;
    if (this.elemLinkSelector_ === '.') {
      link = elem;
    } else {
      link = elem.find(this.elemLinkSelector_);
    }

    /** @type {!als.MultipleSwitcher.Item} */
    var item = new als.MultipleSwitcher.Item(elem, i, link, this);
    this.items_.push(item);

    if (elem.hasClass(als.MultipleSwitcher.CLASS_SELECTED)) {
      this.selectValue(item.getValue_());
    }
  }
};


/**
 * @private
 */
als.MultipleSwitcher.prototype.checkItemValuesUniqueness_ = function() {
  /** @type {!Array.<string>} */
  var values = this.getAllValues();
  values.sort();

  for (var i = 0, len = values.length; i < len - 1; i++) {
    if (values[i] === values[i + 1]) {
      throw Error('Elem values have duplication: ' + values[i]);
    }
  }
};


/**
 * @param {string} value
 * @return {!als.MultipleSwitcher.Item}
 * @private
 */
als.MultipleSwitcher.prototype.getItemByValue_ = function(value) {
  for (var i = 0, len = this.items_.length; i < len; i++) {
    /** @type {!als.MultipleSwitcher.Item} */
    var item = this.items_[i];

    if (item.getValue_() === value) {
      return item;
    }
  }

  throw Error('Item value=' + value + ' not found');
};




/**
 * @param {!jQuery} root
 * @param {number} index
 * @param {!jQuery} link
 * @param {!als.MultipleSwitcher} parentSwitcher
 * @constructor
 */
als.MultipleSwitcher.Item = function(root, index, link, parentSwitcher) {
  /**
   * @type {!jQuery}
   * @private
   */
  this.root_ = root;

  /**
   * @type {number}
   * @private
   */
  this.index_ = index;

  /**
   * @type {!jQuery}
   * @private
   */
  this.link_ = link;

  /**
   * @type {!als.MultipleSwitcher}
   * @private
   */
  this.parentSwitcher_ = parentSwitcher;

  /**
   * @type {string}
   * @private
   */
  this.value_ = this.initValue_();


  this.attachEvents_();
};


/**
 * @return {string}
 * @private
 */
als.MultipleSwitcher.Item.prototype.getValue_ = function() {
  return this.value_;
};


/**
 * @return {string}
 * @private
 */
als.MultipleSwitcher.Item.prototype.initValue_ = function() {
  /** @type {string} */
  var value;

  var data = /** @type {!Object} */ (this.root_.data('value'));

  if (data === undefined) {
    value = this.index_.toString();
  } else {
    value = data.toString();
  }

  return value;
};


/**
 * @private
 */
als.MultipleSwitcher.Item.prototype.attachEvents_ = function() {
  this.link_.click(
      jQuery.proxy(
          function() {
            if (!this.parentSwitcher_.isDisabled()) {
              this.parentSwitcher_.toggleValue(this.value_);
            }
          },
          this));
};


/**
 * @private
 */
als.MultipleSwitcher.Item.prototype.select_ = function() {
  this.root_.addClass(als.MultipleSwitcher.CLASS_SELECTED);
};


/**
 * @private
 */
als.MultipleSwitcher.Item.prototype.deselect_ = function() {
  this.root_.removeClass(als.MultipleSwitcher.CLASS_SELECTED);
};
