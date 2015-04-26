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
 * by clicks on opener element(s).
 * You may hide popup by:
 *  - clicking on inner .popup_close element (als.Popup.CLASS_CLOSE_BUTTON);
 *  - clicking on external clicks catcher (see constructor 3rd parameter);
 *  - hitting Escape key on keyboard.
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



goog.provide('als.Popup');
goog.require('als');
/*
  Replace this with `var als = als || {};`
  if your project is not dependant on Closure Library.
*/


/**
 * @param {!jQuery} root  Popup root element.
 * @param {!jQuery=} opt_openers  Elements click on which toggles popup display.
 *    Defaults to null (there is no opener elements). You can pass one or
 *    multiple openers as a regular jQuery set.
 * @param {!jQuery=} opt_externalClickCatcher  Element click on which
 *    closes popup (if click was outside popup element).
 *    Defaults to document - any click outside popup root element closes it.
 * @param {(string | number)=} opt_duration  Time for toggling popup display.
 *    This parameter is passing to jQuery's animate() function.
 *    Defaults to null - there is no animation, just toggling `display:none`.
 *
 * @constructor
 */
als.Popup = function(
    root, opt_openers, opt_externalClickCatcher, opt_duration) {

  /**
   * @type {!jQuery}
   * @private
   */
  this.root_ = root;

  /**
   * @type {?jQuery}
   * @private
   */
  this.openers_ = (opt_openers || null);

  /**
   * @type {?jQuery}
   * @private
   */
  this.lastUsedOpener_ = null;

  /**
   * @private
   */
  this.closer_ = /** @type {!jQuery} */
      (this.root_.find('.' + als.Popup.CLASS_CLOSE_BUTTON));

  /**
   * @type {!jQuery}
   * @private
   */
  this.positionerInsidePopup_ =
      this.root_.find('.' + als.Popup.CLASS_POSITIONER);

  /**
   * @private
   */
  this.externalClickCatcher_ = /** @type {!jQuery} */
      (jQuery(opt_externalClickCatcher || document));

  /**
   * @type {?(string|number)}
   * @private
   */
  this.duration_ = (opt_duration || null);

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
 * @param {string} openEventType
 * @param {!jQuery=} opt_opener
 * @constructor
 * @extends {jQuery.event}
 */
als.Popup.OpenEvent = function(openEventType, opt_opener) {
  /**
   * @type {string}
   */
  this.type = openEventType;

  /**
   * @type {?jQuery}  If null, open event was triggered by calling
   *    toggle()/open() method programmatically.
   */
  this.opener = (opt_opener || null);
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


/**
 * @param {!jQuery=} opt_opener
 */
als.Popup.prototype.toggle = function(opt_opener) {
  if (this.closed_) {
    this.open(opt_opener);
  } else {
    this.close();
  }
};


/**
 * @param {!jQuery=} opt_opener
 * @param {!function()=} opt_onComplete
 */
als.Popup.prototype.open = function(opt_opener, opt_onComplete) {
  if (this.closed_ && !this.aniInProgress_) {
    if (this.duration_) {
      this.openWithAnimation_(opt_opener, opt_onComplete);
    } else {
      this.openInstantly_(opt_opener, opt_onComplete);
    }
  }
};


/**
 * @param {!function()=} opt_onComplete
 */
als.Popup.prototype.close = function(opt_onComplete) {
  if (!this.closed_ && !this.aniInProgress_) {
    if (this.duration_) {
      this.closeWithAnimation_(opt_onComplete);
    } else {
      this.closeInstantly_(opt_onComplete);
    }
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
 * @param {function(!jQuery.event=)} callback
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
als.Popup.prototype.attachEvents_ = function() {
  /** @type {als.Popup} */
  var that = this;

  if (this.openers_) {
    this.openers_.click(
        /**
         * @param {!jQuery.event} event
         */
        function(event) {
          that.toggleOrReopen_(jQuery(this));
          event.preventDefault();
        });
  }

  this.closer_.click(
      function() {
        that.close();
      });

  jQuery(document).keyup(
      /**
       * @param {!jQuery.event} event
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
 * @param {!jQuery} opener
 * @private
 */
als.Popup.prototype.toggleOrReopen_ = function(opener) {
  /** @type {!als.Popup} */
  var that = this;

  if (this.closed_) {
    this.open(opener);

  } else if (!this.lastUsedOpener_ || this.lastUsedOpener_[0] !== opener[0]) {
    this.close(
        function() {
          that.open(opener);
        });

  } else {
    this.close();
  }

  this.lastUsedOpener_ = opener;
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
      this.root_.is(event.target) || this.root_.has(event.target).length > 0);

  /** @type {boolean} */
  var insideOpeners = false;
  if (this.openers_ !== null) {
    insideOpeners = (
        this.openers_.is(event.target) ||
        this.openers_.has(event.target).length > 0);
  }

  /** @type {boolean} */
  var outside =
      (!insidePopup && !insideOpeners) ||
          event.target === this.externalClickCatcher_[0];


  if (leftMouseButton && outside) {
    this.close();
  }
};


/**
 * @param {!jQuery=} opt_opener
 * @param {!function()=} opt_onComplete
 * @private
 */
als.Popup.prototype.openInstantly_ = function(opt_opener, opt_onComplete) {
  this.root_.css({
    'visibility': 'hidden',
    'display': ''
  });

  if (opt_opener) {
    this.positionIfPossible_(opt_opener);
  }

  this.eventsDispatcher_.trigger(
      new als.Popup.OpenEvent(als.Popup.EventType.BEFORE_OPEN, opt_opener));

  this.closed_ = false;
  this.root_.css('visibility', '');

  if (opt_onComplete) {
    opt_onComplete();
  }

  this.eventsDispatcher_.trigger(
      new als.Popup.OpenEvent(als.Popup.EventType.AFTER_OPEN, opt_opener));
};


/**
 * @param {!function()=} opt_onComplete
 * @private
 */
als.Popup.prototype.closeInstantly_ = function(opt_onComplete) {
  this.eventsDispatcher_.trigger(als.Popup.EventType.BEFORE_CLOSE);

  this.closed_ = true;
  this.root_.css('display', 'none');

  if (opt_onComplete) {
    opt_onComplete();
  }

  this.eventsDispatcher_.trigger(als.Popup.EventType.AFTER_CLOSE);
};


/**
 * @param {!jQuery=} opt_opener
 * @param {!function()=} opt_onComplete
 * @private
 */
als.Popup.prototype.openWithAnimation_ = function(opt_opener, opt_onComplete) {
  /** @type {!als.Popup} */
  var that = this;

  this.aniInProgress_ = true;

  this.root_.css({
    'opacity': 0,
    'display': ''
  });

  if (opt_opener) {
    this.positionIfPossible_(opt_opener);
  }

  this.eventsDispatcher_.trigger(
      new als.Popup.OpenEvent(als.Popup.EventType.BEFORE_OPEN, opt_opener));

  this.root_.animate(
      { 'opacity': 1 },
      {
        'duration': this.duration_,
        'easing': 'linear',
        'complete': function() {
          that.closed_ = false;
          that.aniInProgress_ = false;

          if (opt_onComplete) {
            opt_onComplete();
          }

          that.eventsDispatcher_.trigger(
              new als.Popup.OpenEvent(
                  als.Popup.EventType.AFTER_OPEN, opt_opener));
        }
      });
};


/**
 * @param {!function()=} opt_onComplete
 * @private
 */
als.Popup.prototype.closeWithAnimation_ = function(opt_onComplete) {
  /** @type {!als.Popup} */
  var that = this;

  this.eventsDispatcher_.trigger(als.Popup.EventType.BEFORE_CLOSE);

  this.aniInProgress_ = true;

  this.root_.animate(
      { 'opacity': 0 },
      {
        'duration': this.duration_,
        'easing': 'linear',
        'complete': function() {
          that.root_.css('display', 'none');
          that.closed_ = true;
          that.aniInProgress_ = false;

          if (opt_onComplete) {
            opt_onComplete();
          }

          that.eventsDispatcher_.trigger(als.Popup.EventType.AFTER_CLOSE);
        }
      });
};



/**
 * @param {!jQuery} opener
 * @private
 */
als.Popup.prototype.positionIfPossible_ = function(opener) {
  /** @type {!jQuery} */
  var positionerInsideOpener = this.getPositionerInsideOpener_(opener);

  if (positionerInsideOpener.length === 0 ||
      this.positionerInsidePopup_.length === 0) {

    return;
  }

  var positionerInsideOpenerOffset = /** @type {{left:number, top:number}} */
      (positionerInsideOpener.offset());

  var positionerInsidePopupOffset = /** @type {{left:number, top:number}} */
      (this.positionerInsidePopup_.offset());

  var popupOffset =
      /** @type {{left:number, top:number}} */ (this.root_.offset());

  this.root_.css({
    'left': (
        positionerInsideOpenerOffset.left +
        (popupOffset.left - positionerInsidePopupOffset.left)),
    'top': (
        positionerInsideOpenerOffset.top +
        (popupOffset.top - positionerInsidePopupOffset.top))
  });
};


/**
 * @param {!jQuery} opener
 * @return {!jQuery}
 * @private
 */
als.Popup.prototype.getPositionerInsideOpener_ = function(opener) {
  /** @type {jQuery} */
  var positionerReallyInside = opener.find('.' + als.Popup.CLASS_POSITIONER);

  return (positionerReallyInside.length ? positionerReallyInside : opener);
};
