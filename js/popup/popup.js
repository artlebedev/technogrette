//
// Copyright 2012 Art. Lebedev Studio. All Rights Reserved.
// Created on 2012.03.06
//
// This source code follows Google JavaScript Style Guide
// http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//
// Released under the MIT license - http://opensource.org/licenses/MIT
//

/**
 * @fileoverview Class representing popup - block which display is toggled
 * by clicks on opener element.
 * Popup can be hid:
 *  - by click on inner .popup_close element (als.Popup.CLASS_CLOSE_BUTTON);
 *  - by click on external clicks catcher (see constructor 3rd parameter);
 *  - by hitting Escape key on keyboard.
 *
 *  Class is looking for .popup_positioner (als.Popup.CLASS_POSITIONER) elements
 *  inside popup root and inside opener to determine elements that should
 *  be matched visually after popup is opened.
 *  If there is no such element inside opener, opener itself is used.
 *  If there is no such element inside popup root, no auto positioning
 *  is performed.
 *
 * @author Alexander Samilyak (aleksam241@gmail.com)
 */



// @require als.js.
var als = als || {};
/*
 Replace this with:
    goog.provide('als.Popup');
    goog.require('als');

 if your project framework is Closure Library.
*/


/**
 * @param {!jQuery} root  Popup root element.
 * @param {!jQuery=} opt_opener  Element click on which toggles popup display.
 *    Defaults to null (there is no opener element).
 * @param {!jQuery=} opt_externalClickCatcher  Element click on which
 *    closes popup (if click was outside popup element).
 *    Defaults to document - any click outside popup root element closes it.
 * @param {(string | number)=} opt_duration  Time for toggling popup display.
 *    This parameter is passing to jQuery's animate() function.
 *    Defaults to null - there is no animation, just toggling `display:none`.
 *
 * @constructor
 */
als.Popup = function(root, opt_opener, opt_externalClickCatcher, opt_duration) {

  /**
   * @type {!jQuery}
   * @private
   */
  this.root_ = root;

  /**
   * @type {jQuery}
   * @private
   */
  this.opener_ = opt_opener || null;

  /**
   * @private
   */
  this.closer_ =
      (/** @type {!jQuery} */ this.root_.find(
          '.' + als.Popup.CLASS_CLOSE_BUTTON));

  /**
   * @type {jQuery}
   * @private
   */
  this.positionerInsidePopup_ = null;

  /**
   * @type {jQuery}
   * @private
   */
  this.positionerOutsidePopup_ = null;

  /**
   * @private
   */
  this.externalClickCatcher_ = /** @type {!jQuery} */ jQuery(
      opt_externalClickCatcher || document);

  /**
   * @type {?(string|number)}
   * @private
   */
  this.duration_ = opt_duration || null;

  /**
   * @private
   */
  this.eventsDispatcher_ = /** @type {!jQuery} */ (jQuery({}));

  /**
   * @type {boolean}
   * @private
   */
  this.closed_ = (
      this.root_.hasClass(als.Popup.CLASS_NOT_DISPLAY) ||
      !this.root_.is(':visible'));

  /**
   * @type {boolean}
   * @private
   */
  this.aniInProgress_ = false;


  this.initVisibility_();
  this.findPositioners_();
  this.attachEvents_();
};


/**
 * @enum {string}
 */
als.Popup.EventType = {
  BEFORE_OPEN: 'before-open',
  AFTER_OPEN: 'after-open',
  BEFORE_CLOSE: 'before-close',
  AFTER_CLOSE: 'after-close'
};


/**
 * @const
 * @type {string}
 */
als.Popup.CLASS_CLOSE_BUTTON = 'popup_close';

/**
 * @const
 * @type {string}
 */
als.Popup.CLASS_NOT_DISPLAY = 'not_display';

/**
 * @const
 * @type {string}
 */
als.Popup.CLASS_POSITIONER = 'popup_positioner';


/**
 * @return {!jQuery}
 */
als.Popup.prototype.getRoot = function() {
  return this.root_;
};


/**
 * @return {boolean}
 */
als.Popup.prototype.isClosed = function() {
  return this.closed_;
};


als.Popup.prototype.toggle = function() {
  if (this.closed_) {
    this.open();
  } else {
    this.close();
  }
};


als.Popup.prototype.open = function() {
  /** @type {als.Popup} */
  var that = this;

  if (!this.closed_ || this.aniInProgress_) {
    return;
  }

  if (this.duration_) {
    this.aniInProgress_ = true;

    this.root_.css({
      'opacity': 0,
      'display': ''
    });

    this.positionIfPossible_();
    this.eventsDispatcher_.trigger(als.Popup.EventType.BEFORE_OPEN);

    this.root_.animate({ 'opacity': 1 }, this.duration_, 'linear', function() {
      that.closed_ = false;
      that.aniInProgress_ = false;
      that.eventsDispatcher_.trigger(als.Popup.EventType.AFTER_OPEN);
    });
  } else {
    this.root_.css({
      'visibility': 'hidden',
      'display': ''
    });

    this.positionIfPossible_();
    this.eventsDispatcher_.trigger(als.Popup.EventType.BEFORE_OPEN);

    this.closed_ = false;
    this.root_.css('visibility', '');
    this.eventsDispatcher_.trigger(als.Popup.EventType.AFTER_OPEN);
  }
};


als.Popup.prototype.close = function() {
  /** @type {als.Popup} */
  var that = this;

  if (this.closed_ || this.aniInProgress_) {
    return;
  }

  this.eventsDispatcher_.trigger(als.Popup.EventType.BEFORE_CLOSE);

  if (this.duration_) {
    this.aniInProgress_ = true;

    this.root_.animate({ 'opacity': 0 }, this.duration_, 'linear', function() {
      that.root_.css('display', 'none');
      that.closed_ = true;
      that.aniInProgress_ = false;
      that.eventsDispatcher_.trigger(als.Popup.EventType.AFTER_CLOSE);
    });
  } else {
    this.closed_ = true;
    that.root_.css('display', 'none');
    this.eventsDispatcher_.trigger(als.Popup.EventType.AFTER_CLOSE);
  }
};


/**
 * @param {als.Popup.EventType} eventType
 * @param {function(!jQuery.event)} callback
 */
als.Popup.prototype.addEventListener = function(eventType, callback) {
  this.eventsDispatcher_.bind(eventType, callback);
};


/**
 * @param {als.Popup.EventType} eventType
 * @param {function(!jQuery.event)} callback
 */
als.Popup.prototype.removeEventListener = function(eventType, callback) {
  this.eventsDispatcher_.unbind(eventType, callback);
};


/**
 * @private
 */
als.Popup.prototype.initVisibility_ = function() {
  if (this.closed_) {
    this.root_
        .css('display', 'none')
        .removeClass(als.Popup.CLASS_NOT_DISPLAY);
  } else {
    this.root_.css('display', '');
  }
};


/**
 * @private
 */
als.Popup.prototype.findPositioners_ = function() {
  if (!this.opener_) {
    return;
  }

  /** @type {jQuery} */
  var positionerInsidePopup =
      this.root_.find('.' + als.Popup.CLASS_POSITIONER);

  /** @type {jQuery} */
  var positionerOutsidePopup =
      this.opener_.find('.' + als.Popup.CLASS_POSITIONER);


  if (positionerInsidePopup.size()) {
    this.positionerInsidePopup_ = positionerInsidePopup;

    this.positionerOutsidePopup_ =
        positionerOutsidePopup.size() ? positionerOutsidePopup : this.opener_;
  }
};


/**
 * @private
 */
als.Popup.prototype.attachEvents_ = function() {
  /** @type {als.Popup} */
  var that = this;

  if (this.opener_) {
    this.opener_.click(
        /**
         * @param {Object} event
         */
        function(event) {
          that.toggle();
          event.preventDefault();
        });
  }

  this.closer_.click(
      function() {
        that.close();
      });

  jQuery(document).keyup(
      /**
       * @param {!jQuery.Event} event
       */
      function(event) {
        if (event.which === als.Keyboard.ESCAPE) {
          that.close();
        }
      });

  this.externalClickCatcher_.click(
      /**
       * @param {!jQuery.event} event
       */
      function(event) {
        that.onCatcherClick_(event);
      });

};


/**
 * @param {!jQuery.event} event
 *
 * @private
 */
als.Popup.prototype.onCatcherClick_ = function(event) {
  // which === 0: fix for jQuery's bug in IE8-
  /** @type {boolean} */
  var leftMouseButton = (event.which === 1 || event.which === 0);

  /** @type {boolean} */
  var insidePopup = (
      this.root_.is(event.target) || this.root_.has(event.target).size() > 0);

  /** @type {boolean} */
  var insideOpener = false;
  if (this.opener_ !== null) {
    insideOpener = (
        this.opener_.is(event.target) ||
        this.opener_.has(event.target).size() > 0);
  }

  /** @type {boolean} */
  var outside =
      (!insidePopup && !insideOpener) ||
          event.target === this.externalClickCatcher_[0];


  if (leftMouseButton && outside) {
    this.close();
  }
};


/**
 * @private
 */
als.Popup.prototype.positionIfPossible_ = function() {
  if (!this.positionerInsidePopup_ || !this.positionerOutsidePopup_) {
    return;
  }

  var positionerOutsidePopupOffset =
      /** @type {{left:number, top:number}} */
      this.positionerOutsidePopup_.offset();

  var positionerInsidePopupOffset =
      /** @type {{left:number, top:number}} */
      this.positionerInsidePopup_.offset();

  var popupOffset =
      /** @type {{left:number, top:number}} */
      this.root_.offset();

  this.root_.css({
    left: (
        positionerOutsidePopupOffset.left +
        (popupOffset.left - positionerInsidePopupOffset.left)),
    top: (
        positionerOutsidePopupOffset.top +
        (popupOffset.top - positionerInsidePopupOffset.top))
  });
};
