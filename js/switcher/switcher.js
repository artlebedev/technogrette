//
// Copyright 2012 Art. Lebedev Studio. All Rights Reserved.
// Created on 2012.02.15
//
// This source code follows Google JavaScript Style Guide
// http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//
// Released under the MIT license - http://opensource.org/licenses/MIT
//

/**
 * @fileoverview Generic radio type switcher (only one element can be selected).
 * It's possible to pass views to switcher to switch them accordingly with
 * switcher selected element.
 *
 * Linkage between switcher elements and views is organized by CSS classes.
 * View may have some unique class $class and corresponding switcher element
 * should have class 'for_$class' (for example, 'my_view' and 'for_my_view').
 * If element doesn't have class starting with 'for_', its position will be used
 * (for example, 3rd switcher will be responsible for showing 3rd view).
 * There is special switcher element that shows all views - its class 'for_all'.
 *
 * @author Alexander Samilyak (aleksam241@gmail.com)
 */


var als = als || {};
/*
 Replace this with `goog.provide('als.Switcher')`
 if your project framework is Closure Library.
*/


/**
 * @param {!jQuery} elems  Elements of a switcher. Current element should have
 *    class 'selected'. There is no current element by default.
 * @param {!jQuery=} opt_views  Views that switcher switches.
 *    Defaults to null. It means that no views are attached to switcher.
 * @param {string=} opt_elemLinkSelector  Selector which used to find
 *    clickable link inside each switcher element.
 *    You can pass '.' to use switcher element itself.
 *    Defaults to '.pseudo'.
 *
 * @constructor
 */
als.Switcher = function(elems, opt_views, opt_elemLinkSelector) {
  /**
   * @type {!jQuery}
   * @private
   */
  this.elems_ = elems;

  /**
   * @type {jQuery}
   * @private
   */
  this.views_ = opt_views || null;

  /**
   * @type {string}
   * @private
   */
  this.elemLinkSelector_ = opt_elemLinkSelector || '.pseudo';

  /**
   * @type {Array.<als.Switcher.Item_>}
   * @private
   */
  this.items_ = [];

  /**
   * @type {als.Switcher.Item_}
   * @private
   */
  this.selectedItem_ = null;

  /**
   * @type {als.Switcher.Item_}
   * @private
   */
  this.prevSelectedItem_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.disabled_ = false;

  /**
   * @private
   */
  this.eventsDispatcher_ = /** @type {!jQuery} */ (jQuery({}));


  this.initItems_();
};


/**
 * @enum {string}
 */
als.Switcher.EventType = {
  CHANGE: 'change'
};


/**
 * @param {?number} index
 * @param {string=} opt_author
 * @constructor
 * @extends {jQuery.Event}
 */
als.Switcher.ChangeEvent = function(index,  opt_author) {
  /**
   * @type {string}
   */
  this.type = als.Switcher.EventType.CHANGE;

  /**
   * @type {?number}
   */
  this.currentIndex = index;

  /**
   * @type {?string}
   */
  this.author = opt_author || null;
};


/**
 * @const
 * @type {string}
 */
als.Switcher.CLASS_SELECTED = 'selected';

/**
 * @const
 * @type {string}
 */
als.Switcher.CLASS_NOT_DISPLAY = 'not_display';

/**
 * @const
 * @type {string}
 */
als.Switcher.NAME_ITEM_FOR_ALL = 'all';


/**
 * @return {?number}  0-based switcher element index or
 *    null if there is no selected element.
 */
als.Switcher.prototype.getIndex = function() {
  return this.selectedItem_ ?
      this.selectedItem_.index_ :
      null;
};


/**
 * @param {number} index  0-based switcher element index.
 * @param {string=} opt_author
 */
als.Switcher.prototype.setIndex = function(index, opt_author) {
  this.selectItem_(this.getItemByIndex_(index), false, opt_author);
};


/**
 * @return {?string}
 */
als.Switcher.prototype.getName = function() {
  return this.selectedItem_ ?
      this.selectedItem_.linkName_ :
      null;
};


/**
 * @param {string} name
 * @param {string=} opt_author
 */
als.Switcher.prototype.setName = function(name, opt_author) {
  this.selectItem_(this.getItemByName_(name), false, opt_author);
};


/**
 * @return {?number}
 */
als.Switcher.prototype.getPrevIndex = function() {
  return this.prevSelectedItem_ ?
      this.prevSelectedItem_.index_ :
      null;
};


/**
 * @return {?string}
 */
als.Switcher.prototype.getPrevName = function() {
  if (this.prevSelectedItem_ && this.prevSelectedItem_.linkName_) {
    return this.prevSelectedItem_.linkName_;
  } else {
    return null;
  }
};


/**
 * @return {boolean}
 */
als.Switcher.prototype.isDisabled = function() {
  return this.disabled_;
};


als.Switcher.prototype.enable = function() {
  this.disabled_ = false;
};


als.Switcher.prototype.disable = function() {
  this.disabled_ = true;
};


/**
 * @param {als.Switcher.EventType} eventType
 * @param {function(!jQuery.event)} callback
 */
als.Switcher.prototype.addEventListener = function(eventType, callback) {
  this.eventsDispatcher_.bind(eventType, callback);
};


/**
 * @param {als.Switcher.EventType} eventType
 * @param {function(!jQuery.event)} callback
 */
als.Switcher.prototype.removeEventListener = function(eventType, callback) {
  this.eventsDispatcher_.unbind(eventType, callback);
};


/**
 * @private
 */
als.Switcher.prototype.initItems_ = function() {
  /** @type {als.Switcher} */
  var that = this;

  var allElemsExceptForAll =
      /** @type {!jQuery} */ (this.elems_.filter(':not(.for_all)'));

  /** @type {als.Switcher.Item_} */
  var initialSelectedItem = null;

  for (var i = 0, len = this.elems_.length; i < len; i++) {
    /** @type {!jQuery} */
    var switcherElem = this.elems_.eq(i);

    /** @type {!jQuery} */
    var link;

    /** @type {?jQuery} */
    var view = null;

    if (that.elemLinkSelector_ === '.') {
      link = switcherElem;
    } else {
      link = switcherElem.find(that.elemLinkSelector_).eq(0);
    }

    /** @type {?string} */
    var linkName = that.parseItemName_(switcherElem);

    if (that.views_) {
      if (linkName === als.Switcher.NAME_ITEM_FOR_ALL) {
        view = that.views_;

      } else if (linkName) {
        view = that.views_.filter('.' + linkName);

      } else {
        /** @type {number} */
        var elemIndex = allElemsExceptForAll.index(switcherElem);
        view = that.views_.eq(elemIndex);
      }

    } else {
      view = null;
    }

    var item = new als.Switcher.Item_(
        switcherElem, link, linkName, view, i, that);
    that.items_.push(item);

    if (switcherElem.hasClass(als.Switcher.CLASS_SELECTED)) {
      initialSelectedItem = item;
    }
    item.deselect_();
  }

  this.selectItem_(initialSelectedItem, true);
};


/**
 * @param {als.Switcher.Item_} item
 * @param {boolean} initial
 * @param {string=} opt_author
 *
 * @private
 */
als.Switcher.prototype.selectItem_ = function(item, initial, opt_author) {
  if (!item || item === this.selectedItem_) {
    return;
  }

  if (this.selectedItem_) {
    this.prevSelectedItem_ = this.selectedItem_;
    this.selectedItem_.deselect_();
  }

  item.select_();
  this.selectedItem_ = item;

  if (!initial) {
    this.eventsDispatcher_.trigger(
        new als.Switcher.ChangeEvent(this.getIndex(), opt_author));
  }
};


/**
 * @param {!jQuery} item
 * @return {?string}
 *
 * @private
 */
als.Switcher.prototype.parseItemName_ = function(item) {
  var match = item[0].className.match(/for_([\w_\-]+)/);

  if (match) {
    return match[1];
  } else {
    return null;
  }
};


/**
 * @param {number} index
 * @return {als.Switcher.Item_}
 *
 * @private
 */
als.Switcher.prototype.getItemByIndex_ = function(index) {
  for (var i = 0, len = this.items_.length; i < len; i++) {
    if (index === this.items_[i].index_) {
      return this.items_[i];
    }
  }

  return null;
};


/**
 * @param {string} name
 * @return {als.Switcher.Item_}
 *
 * @private
 */
als.Switcher.prototype.getItemByName_ = function(name) {
  for (var i = 0, len = this.items_.length; i < len; i++) {
    if (name === this.items_[i].linkName_) {
      return this.items_[i];
    }
  }

  return null;
};




/**
 * @param {!jQuery} root
 * @param {!jQuery} link
 * @param {?string} linkName
 * @param {jQuery} view
 * @param {number} index
 * @param {als.Switcher} parentSwitcher
 *
 * @constructor
 * @private
 */
als.Switcher.Item_ = function(
    root, link, linkName, view, index, parentSwitcher) {

  /**
   * @type {!jQuery}
   * @private
   */
  this.root_ = root;

  /**
   * @type {!jQuery}
   * @private
   */
  this.link_ = link;

  /**
   * @type {?string}
   * @private
   */
  this.linkName_ = linkName;

  /**
   * @type {jQuery}
   * @private
   */
  this.view_ = view;

  /**
   * @type {number}
   * @private
   */
  this.index_ = index;

  /**
   * @type {als.Switcher}
   * @private
   */
  this.parentSwitcher_ = parentSwitcher;


  this.attachEvents_();
};


/**
 * @private
 */
als.Switcher.Item_.prototype.attachEvents_ = function() {
  /** @type {als.Switcher.Item_} */
  var that = this;

  this.link_.click(
      /**
       * @param {!jQuery.event} event
       */
      function(event) {
        if (!that.parentSwitcher_.isDisabled()) {
          that.parentSwitcher_.selectItem_(that, false);
        }

        event.preventDefault();
      });
};


/**
 * @private
 */
als.Switcher.Item_.prototype.select_ = function() {
  this.root_.addClass(als.Switcher.CLASS_SELECTED);
  if (this.view_) {
    this.view_.removeClass(als.Switcher.CLASS_NOT_DISPLAY);
  }
};


/**
 * @private
 */
als.Switcher.Item_.prototype.deselect_ = function() {
  this.root_.removeClass(als.Switcher.CLASS_SELECTED);
  if (this.view_) {
    this.view_.addClass(als.Switcher.CLASS_NOT_DISPLAY);
  }
};
