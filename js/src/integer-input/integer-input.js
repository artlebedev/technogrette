//
// Copyright 2012 Art. Lebedev Studio. All Rights Reserved.
// Created on 2012.04.01
//
// This source code follows Google JavaScript Style Guide
// http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//
// Released under the MIT license - http://opensource.org/licenses/MIT
//

/**
 * @fileoverview Class represents text input containing integer positive number.
 * User can change input value using digit keyboard keys. Non digit symbols
 * is not allowed - they will be removed right after entering.
 * User can increment/decrement value using up/down arrow keys.
 *
 * @author Alexander Samilyak (aleksam241@gmail.com)
 */


goog.provide('als.IntegerInput');
goog.require('als');
/*
  Replace this with `var als = als || {};`
  if your project is not dependant on Closure Library.
*/


/**
 * Initialization is trying to parse a number from input value.
 * If there is no any sign of number, value 1 will be set.
 *
 * @param {!jQuery} root  Html input[type=text] element.
 * @param {!als.IntegerInput.Config=} opt_config  See als.IntegerInput.Config
 *    typedef declaration for more information.
 * @constructor
 */
als.IntegerInput = function(root, opt_config) {
  /**
   * @type {!jQuery}
   * @private
   */
  this.root_ = root;

  /**
   * @type {number}
   * @private
   */
  this.min_ = this.initMin_(opt_config && opt_config.min);

  /**
   * @type {number}
   * @private
   */
  this.max_ = this.initMax_(opt_config && opt_config.max);

  /**
   * @type {number}
   * @private
   */
  this.incrementStep_ = this.initIncrementStep_(opt_config && opt_config.step);

  /**
   * @type {boolean}
   * @private
   */
  this.allowEmptyValue_ = (opt_config && opt_config.allowEmptyValue) || false;

  /**
   * @type {boolean}
   * @private
   */
  this.isFormatValue_ = (opt_config && opt_config.formatValue) || false;

  /**
   * @type {boolean}
   * @private
   */
  this.keyboardInputWithDelay_ =
      (opt_config && opt_config.processKeyboardInputWithDelay) || false;

  /**
   * @type {boolean}
   * @private
   */
  this.allowMousewheelChange_ =
      (opt_config && opt_config.allowMousewheelChange) || false;

  /**
   * @type {?number}
   * @private
   */
  this.value_;

  /**
   * @type {!jQuery}
   * @private
   */
  this.enclosingForm_ = this.root_.parents('form').eq(0);

  /**
   * @type {number}
   * @private
   */
  this.keyboardInputTimeoutId_ = 0;

  /**
   * @type {!jQuery}
   * @private
   */
  this.eventsDispatcher_ = jQuery({});


  this.initInputMaxLength_();
  this.initValue_();
  this.attachEvents_();
};


/**
 * min: Minimum numeric input value. If this property is omitted, class will try
 *    to get value from 'min' html input attribute. Defaults to 1.
 * max: Maximum numeric input value. If this property is omitted, class will try
 *    to get value from 'max' html input attribute.
 *    Defaults to Number.POSITIVE_INFINITY (unlimited).
 * step: Amount of incrementing or decrementing input value.
 *    If this property is omitted, class will try to get value from 'step'
 *    html input attribute. Defaults to 1.
 * formatValue: Whether to format input value using als.formatNumber() function.
 *    Defaults to false.
 * allowEmptyValue: Defaults to false.
 * processKeyboardInputWithDelay: Defaults to false.
 * allowMousewheelChange: Whether to increment/decrement value on
 *    mousewheel scroll. This feature requires jQuery Mousewheel plugin
 *    (https://github.com/brandonaaron/jquery-mousewheel) to be linked to page.
 *    Defaults to false.
 *
 * @typedef {{
 *  min: (number | undefined),
 *  max: (number | undefined),
 *  step: (number | undefined),
 *  formatValue: (boolean | undefined),
 *  allowEmptyValue: (boolean | undefined),
 *  processKeyboardInputWithDelay: (boolean | undefined),
 *  allowMousewheelChange: (boolean | undefined)
 * }}
 */
als.IntegerInput.Config;


/**
 * @const
 * @type {number}
 */
als.IntegerInput.DEFAULT_MIN = 1;

/**
 * @const
 * @type {number}
 */
als.IntegerInput.DEFAULT_MAX = Number.POSITIVE_INFINITY;

/**
 * @const
 * @type {number}
 */
als.IntegerInput.DEFAULT_INCREMENT_STEP = 1;

/**
 * Milliseconds to wait after keyup event and then process user input
 * @const
 * @type {number}
 */
als.IntegerInput.KEYBOARD_INPUT_DELAY = 500;


/**
 * @enum {string}
 */
als.IntegerInput.EventType = {
  CHANGE: 'change'
};


/**
 * @param {string=} opt_author
 * @constructor
 * @extends {jQuery.event}
 */
als.IntegerInput.ChangeEvent = function(opt_author) {
  /**
   * @type {string}
   */
  this.type = als.IntegerInput.EventType.CHANGE;

  /**
   * @type {?string}
   */
  this.author = opt_author || null;
};


/**
 * @return {!jQuery}
 */
als.IntegerInput.prototype.getRoot = function() {
  return this.root_;
};


/**
 * @return {?number}  Null means empty input
 * (if it's allowed in constructor parameter).
 */
als.IntegerInput.prototype.getValue = function() {
  return this.value_;
};


/**
 * @return {number}  Always returns number in contrast with getValue() method
 * that can return null if a constructor argument opt_allowEmptyValue = true.
 * Use this method only if you passed opt_allowEmptyValue = false in constructor
 * (this is a default value).
 * Throws an exception if internal value is null, because this is
 * an exceptional situation.
 */
als.IntegerInput.prototype.getNonNullableValue = function() {
  if (this.value_ === null) {
    throw Error(
        'Input value is null. ' +
        'You should not call this method if you passed "true" for ' +
        'a constructor argument "opt_allowEmptyValue"');
  }

  return this.value_;
};


/**
 * @param {?number} value  Pass null to empty input
 * (if it's allowed in constructor parameter).
 * @param {string=} opt_author
 */
als.IntegerInput.prototype.setValue = function(value, opt_author) {
  if (value !== null || this.allowEmptyValue_) {
    this.setValue_(value, false, opt_author);
  }
};


/**
 * @return {number}
 */
als.IntegerInput.prototype.getMin = function() {
  return this.min_;
};


/**
 * @return {number}
 */
als.IntegerInput.prototype.getMax = function() {
  return this.max_;
};


/**
 * @param {als.IntegerInput.EventType} eventType
 * @param {function(!jQuery.event)} callback
 */
als.IntegerInput.prototype.addEventListener = function(eventType, callback) {
  this.eventsDispatcher_.bind(eventType, callback);
};


/**
 * @param {als.IntegerInput.EventType} eventType
 * @param {function(!jQuery.event=)} callback
 */
als.IntegerInput.prototype.removeEventListener = function(eventType, callback) {
  this.eventsDispatcher_.unbind(eventType, callback);
};


/**
 * @param {number=} opt_value
 * @return {number}
 * @private
 */
als.IntegerInput.prototype.initMin_ = function(opt_value) {
  if (opt_value !== undefined) {
    return opt_value;
  } else {

    var attrMin = als.parseInt(this.root_.attr('min'));
    if (!isNaN(attrMin)) {
      this.root_.removeAttr('min');
      return attrMin;
    } else {
      return als.IntegerInput.DEFAULT_MIN;
    }
  }
};


/**
 * @param {number=} opt_value
 * @return {number}
 * @private
 */
als.IntegerInput.prototype.initMax_ = function(opt_value) {
  if (opt_value !== undefined) {
    return opt_value;
  } else {

    var attrMax = als.parseInt(this.root_.attr('max'));
    if (!isNaN(attrMax)) {
      this.root_.removeAttr('max');
      return attrMax;
    } else {
      return als.IntegerInput.DEFAULT_MAX;
    }
  }
};


/**
 * @param {number=} opt_value
 * @return {number}
 * @private
 */
als.IntegerInput.prototype.initIncrementStep_ = function(opt_value) {
  if (opt_value !== undefined) {
    return opt_value;
  } else {

    var attrStep = als.parseInt(this.root_.attr('step'));
    if (!isNaN(attrStep)) {
      this.root_.removeAttr('step');
      return attrStep;
    } else {
      return als.IntegerInput.DEFAULT_INCREMENT_STEP;
    }
  }
};


/**
 * @private
 */
als.IntegerInput.prototype.initInputMaxLength_ = function() {
  if (this.max_ !== Number.POSITIVE_INFINITY) {
    this.root_.attr('maxlength', this.max_.toString().length);
  }
};


/**
 * @private
 */
als.IntegerInput.prototype.initValue_ = function() {
  /** @type {?number} */
  var value = this.getInputValueNumber_();

  /** @type {?number} */
  var valueToSet;

  if (this.allowEmptyValue_) {
    valueToSet = value;
  } else {
    valueToSet = (value === null) ? 1 : value;
  }

  this.setValue_(valueToSet, true);

  if (this.isFormatValue_) {
    this.formatValue_();
  }
};


/**
 * @param {?number} value  Pass null to empty input.
 * @param {boolean=} opt_initial
 * @param {string=} opt_author
 * @private
 */
als.IntegerInput.prototype.
    setValue_ = function(value, opt_initial, opt_author) {

  if (value !== null && !isFinite(value)) {
    return;
  }

  /** @type {?number} */
  var newValue;
  if (value === null) {
    newValue = null;
  } else {
    newValue = this.normalizeValue_(value);
  }

  /** @type {string} */
  var newValueAsString = (newValue === null ? '' : newValue.toString());
  /**
   * This condition is to prevent input DOM value from updating
   * on keyboard events that don't change input value (e.g. arrows or Shift)
   */
  if (newValueAsString !== this.getInputValue_()) {
    this.root_.val(newValueAsString);
  }

  if (newValue !== this.value_) {
    /**
     * We've changed input DOM value before this condition,
     * because it's possible that input have invalid string value currently,
     * but 'newValue' could be equal 'this.value_'.
     */
    this.value_ = newValue;

    if (!opt_initial) {
      this.eventsDispatcher_.trigger(
          new als.IntegerInput.ChangeEvent(opt_author));
    }
  }
};


/**
 * @private
 */
als.IntegerInput.prototype.attachEvents_ = function() {
  /** @type {!als.IntegerInput} */
  var that = this;

  this.root_
      .bind(
          'keyup input',

          /**
           * @param {!jQuery.event} event
           */
          function(event) {
            /** @type {number} */
            var delay = that.keyboardInputWithDelay_ ?
                als.IntegerInput.KEYBOARD_INPUT_DELAY :
                0;

            clearTimeout(that.keyboardInputTimeoutId_);
            that.keyboardInputTimeoutId_ = setTimeout(
                function() {
                  that.onInputChange_(event);
                },
                delay);
          })

      .blur(
          /**
           * @param {!jQuery.event} event
           */
          function(event) {
            that.onInputChange_(event);

            if (that.isFormatValue_) {
              that.formatValue_();
            }
          })

      .focus(
          function() {
            if (that.isFormatValue_) {
              that.unformatValue_();

              // select with a delay because some browsers
              // are refused to do that right after focus
              setTimeout(
                  function() { that.root_.select(); },
                  50);
            }
          })

      .keydown(
          function(event) {
            if (event['which'] === als.Keyboard.UP) {
              that.increment_();
              return false;
            }
            if (event['which'] === als.Keyboard.DOWN) {
              that.decrement_();
              return false;
            }
          });

  if (this.allowMousewheelChange_ &&
      typeof this.root_.mousewheel === 'function') {

    this.root_.mousewheel(
        /**
         * @param {!jQuery.event} event
         * @param {number} delta
         */
        function(event, delta) {
          if (delta > 0) {
            that.increment_();
          } else {
            that.decrement_();
          }

          return false;
        });
  }

  if (this.isFormatValue_ && this.enclosingForm_.length > 0) {
    this.enclosingForm_.submit(
        function() {
          that.unformatValue_();
        });
  }
};


/**
 * @param {!jQuery.event} event
 * @private
 */
als.IntegerInput.prototype.onInputChange_ = function(event) {
  /** @type {?number} */
  var value = this.getInputValueNumber_();

  if (value === null) {
    if (event['type'] === 'keyup') {
      this.root_.val('');
    }
    if (event['type'] === 'blur') {
      this.setValue(this.allowEmptyValue_ ? null : this.value_);
    }
  } else {
    this.setValue(value);
  }
};


/**
 * @return {?number}  Null if input is empty.
 * @private
 */
als.IntegerInput.prototype.getInputValueNumber_ = function() {
  /** @type {string} */
  var cleanValue = this.getInputValue_().replace(/[^\d]/g, '');

  if (cleanValue === '') {
    return null;
  } else {
    return als.parseInt(cleanValue);
  }
};


/**
 * @private
 */
als.IntegerInput.prototype.formatValue_ = function() {
  if (this.value_ !== null) {
    this.root_.val(
        als.formatNumber(this.value_));
  }
};


/**
 * @private
 */
als.IntegerInput.prototype.unformatValue_ = function() {
  if (this.value_ !== null) {
    this.root_.val(
        this.value_.toString());
  }
};


/**
 * @return {string}
 * @private
 */
als.IntegerInput.prototype.getInputValue_ = function() {
  return /** @type {string} */ (this.root_.val());
};


/**
 * @private
 */
als.IntegerInput.prototype.increment_ = function() {
  if (this.value_ !== null) {
    this.setValue(this.value_ + this.incrementStep_);
  }
};


/**
 * @private
 */
als.IntegerInput.prototype.decrement_ = function() {
  if (this.value_ !== null) {
    this.setValue(this.value_ - this.incrementStep_);
  }
};


/**
 * @param {number} value
 * @return {number}
 * @private
 */
als.IntegerInput.prototype.normalizeValue_ = function(value) {
  return Math.max(this.min_, Math.min(this.max_, value));
};
