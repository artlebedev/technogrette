//
// Copyright 2012 Art. Lebedev Studio. All Rights Reserved.
// Created on 2012.03.27
//
// This source code follows Google JavaScript Style Guide
// http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//
// Released under the MIT license - http://opensource.org/licenses/MIT
//

/**
 * @fileoverview  Class for animated changing numeric text content
 * of any element. Animation looks like number rolling.
 * One animation is als.RollingNumber.ROLL_FRAMES rolls with
 * als.RollingNumber.ROLL_INTERVAL milliseconds between each roll.
 *
 * @author Alexander Samilyak (aleksam241@gmail.com)
 */

goog.provide('als.RollingNumber');
goog.require('als');
/*
  Replace this with `var als = als || {};`
  if your project is not dependant on Closure Library.
*/


/**
 * Initialization is trying to parse a number from element text content.
 * If there is no any sign of number, value 0 will be set.
 *
 * @param {!jQuery} root
 * @param {!jQuery=} opt_elemToHideIfZero  This element is hid if number is
 *    set to zero.  Defaults to null - there is no need to hide element
 *    if number is set to zero.
 * @constructor
 */
als.RollingNumber = function(root, opt_elemToHideIfZero) {
  /**
   * @type {!jQuery}
   * @private
   */
  this.root_ = root;

  /**
   * @type {jQuery}
   * @private
   */
  this.elemToHideIfZero_ = opt_elemToHideIfZero || null;

  /**
   * @type {number}
   * @private
   */
  this.value_;

  /**
   * @type {number}
   * @private
   */
  this.visibleValue_;

  /**
   * @type {number}
   * @private
   */
  this.rollInterval_ = 0;


  this.initValue_();
};


/**
 * Hiding animation length in milliseconds
 * @const
 * @type {number}
 */
als.RollingNumber.HIDE_DURATION = 300;


/**
 * Number of switches during one rolling
 * @const
 * @type {number}
 */
als.RollingNumber.ROLL_FRAMES = 8;


/**
 * Milliseconds interval between two subsequent switches during one rolling
 * @const
 * @type {number}
 */
als.RollingNumber.ROLL_INTERVAL = 45;


/**
 * @return {number}
 */
als.RollingNumber.prototype.getValue = function() {
  return this.value_;
};


/**
 * @param {number} value
 * @param {function()=} opt_onRollComplete
 */
als.RollingNumber.prototype.setValue = function(value, opt_onRollComplete) {
  this.setValue_(value, true, opt_onRollComplete);
};


/**
 * @param {number} value
 */
als.RollingNumber.prototype.setValueWithoutRoll = function(value) {
  this.setValue_(value, false);
};


/**
 * @private
 */
als.RollingNumber.prototype.initValue_ = function() {
  /** @type {number} */
  var maybeNumber = als.cleanToNumber(
      /** @type {string} */ (this.root_.eq(0).text()));

  this.setValue_(isNaN(maybeNumber) ? 0 : maybeNumber, false);
};


/**
 * @param {number} newValue
 * @param {boolean} roll
 * @param {function()=} opt_onComplete
 * @private
 */
als.RollingNumber.prototype.
    setValue_ = function(newValue, roll, opt_onComplete) {

  if (newValue === this.value_) {
    return;
  }

  this.stopAllActions_();
  if (newValue !== 0 && this.value_ === 0) {
    this.show_();
  }

  this.value_ = newValue;

  if (roll) {
    this.roll_(newValue, opt_onComplete);
  } else {
    this.insertNumber_(newValue);
    this.hideIfNeed_(true);
  }
};


/**
 * @param {number} valueToRollTo
 * @param {function()=} opt_onComplete
 * @private
 */
als.RollingNumber.prototype.roll_ = function(valueToRollTo, opt_onComplete) {
  /** @type {number} */
  var frameIndex = 0;

  /**
   * We have to roll starting from visible value, not current program value,
   * because the roll can be started when some other roll is in progress.
   * @type {number}
   */
  var startValue = this.visibleValue_;

  /** @type {number} */
  var delta = (valueToRollTo - startValue) / als.RollingNumber.ROLL_FRAMES;

  var that = this;

  this.rollInterval_ = setInterval(
      function() {
        frameIndex++;

        /** @type {number} */
        var value = Math.round(startValue + delta * frameIndex);

        /** @type {boolean} */
        var lastFrame = (frameIndex === als.RollingNumber.ROLL_FRAMES);

        /**
         * We need to set valueToRollTo on a last frame to avoid
         * inaccuracy because of math rounding
         */
        that.insertNumber_(lastFrame ? valueToRollTo : value);

        if (lastFrame) {
          that.stopAllActions_();
          that.hideIfNeed_();
          if (opt_onComplete && typeof opt_onComplete === 'function') {
            opt_onComplete();
          }
        }
      },
      als.RollingNumber.ROLL_INTERVAL);
};



/**
 * @param {number} number
 * @private
 */
als.RollingNumber.prototype.insertNumber_ = function(number) {
  /** @type {string} */
  var pre = (number < 0 ? '&minus;' : '');

  /** @type {string} */
  var formattedNumber = als.formatNumber(Math.abs(number));

  this.root_.html(pre + formattedNumber);
  this.visibleValue_ = number;
};



/**
 * @private
 */
als.RollingNumber.prototype.stopAllActions_ = function() {
  clearInterval(this.rollInterval_);
  if (this.elemToHideIfZero_) {
    this.elemToHideIfZero_.stop();
  }
};


/**
 * @private
 */
als.RollingNumber.prototype.show_ = function() {
  if (this.elemToHideIfZero_) {
    this.elemToHideIfZero_.css('opacity', '');
  }
};


/**
 * @param {boolean=} opt_quickly
 * @private
 */
als.RollingNumber.prototype.hideIfNeed_ = function(opt_quickly) {
  if (this.value_ === 0) {
    if (opt_quickly) {
      this.quicklyHide_();
    } else {
      this.hide_();
    }
  }
};


/**
 * @private
 */
als.RollingNumber.prototype.hide_ = function() {
  if (this.elemToHideIfZero_) {
    this.elemToHideIfZero_.animate(
        { 'opacity': 0 }, als.RollingNumber.HIDE_DURATION);
  }
};


/**
 * @private
 */
als.RollingNumber.prototype.quicklyHide_ = function() {
  if (this.elemToHideIfZero_) {
    this.elemToHideIfZero_.css('opacity', 0);
  }
};
