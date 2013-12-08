//
// Copyright 2013 Art. Lebedev Studio. All Rights Reserved.
// Created on 2013.01.28
//
// This source code follows Google JavaScript Style Guide
// http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//
// Released under the MIT license - http://opensource.org/licenses/MIT
//

/**
 * @fileoverview Class adds placeholder functionality to text input.
 * Input must have 'placeholder' attribute that's used as a placeholder string.
 * Class doesn't do anything if browser supports input placeholders natively.
 * Input receives 'empty' css class when its value is a placeholder or empty
 * string and 'filled' css class when it's not.
 *
 * Consider using decorateAllInputsWithPlaceholders() static helper method
 * on each page load to instantiate all page's inputs having 'placeholder'
 * attribute.
 *
 * @author Alexander Samilyak (aleksam241@gmail.com)
 */

var als = als || {};
/*
 Replace this with `goog.provide('als.InputPlaceholder')`
 if your project framework is Closure Library.
*/


/**
 * @param {!jQuery} root  Html input[type=text] element.
 * @constructor
 */
als.InputPlaceholder = function(root) {
  if (als.InputPlaceholder.BROWSER_NATIVE_SUPPORT) {
    return;
  }

  /**
   * @type {!jQuery}
   * @private
   */
  this.root_ = root;

  /**
   * @type {string}
   * @private
   */
  this.placeholder_ = (/** @type {string} */ this.root_.attr('placeholder'));


  this.initState_();
  this.attachEvents_();
};


/**
 * @const
 * @type {string}
 */
als.InputPlaceholder.CLASS_EMPTY = 'empty';

/**
 * @const
 * @type {string}
 */
als.InputPlaceholder.CLASS_FILLED = 'filled';


/**
 * @const
 * @type {boolean}
 */
als.InputPlaceholder.BROWSER_NATIVE_SUPPORT = (function() {
  /** @type {!jQuery} */
  var testInput = jQuery('<input />');

  /** @type {boolean} */
  var support = 'placeholder' in testInput[0];

  testInput.remove();

  return support;
})();


als.InputPlaceholder.decorateAllInputsWithPlaceholders = function() {
  /** @type {!jQuery} */
  var inputs = jQuery('input[placeholder]');

  for (var i = 0, len = inputs.length; i < len; i++) {
    new als.InputPlaceholder(inputs.eq(i));
  }
};



/**
 * @private
 */
als.InputPlaceholder.prototype.initState_ = function() {
  if (this.isEmpty_()) {
    this.root_.val(this.placeholder_);
  }

  if (!this.isTouched_()) {
    this.setEmptyCssClass_();
  }
};


/**
 * @private
 */
als.InputPlaceholder.prototype.attachEvents_ = function() {
  /** @type {!als.InputPlaceholder} */
  var that = this;

  this.root_
      .keyup(function() { that.onKeyUp_(); })
      .focus(function() { that.onFocus_(); })
      .blur(function() { that.onBlur_() });
};


/**
 * @private
 */
als.InputPlaceholder.prototype.onKeyUp_ = function() {
  if (this.isFilled_()) {
    this.setFilledCssClass_();
  }
};


/**
 * @private
 */
als.InputPlaceholder.prototype.onFocus_ = function() {
  if (this.getValue_() === this.placeholder_) {
    this.root_.val('');
  }
  this.setFilledCssClass_();
};


/**
 * @private
 */
als.InputPlaceholder.prototype.onBlur_ = function() {
  if (this.isTouched_()) {
    this.setFilledCssClass_();
  } else {
    this.root_.val(this.placeholder_);
    this.setEmptyCssClass_();
  }
};


/**
 * @private
 */
als.InputPlaceholder.prototype.setFilledCssClass_ = function() {
  this.root_
      .removeClass(als.InputPlaceholder.CLASS_EMPTY)
      .addClass(als.InputPlaceholder.CLASS_FILLED);
};


/**
 * @private
 */
als.InputPlaceholder.prototype.setEmptyCssClass_ = function() {
  this.root_
      .removeClass(als.InputPlaceholder.CLASS_FILLED)
      .addClass(als.InputPlaceholder.CLASS_EMPTY);
};


/**
 * @return {boolean}
 * @private
 */
als.InputPlaceholder.prototype.isTouched_ = function() {
  return (
      this.isFilled_() &&
      this.getValue_() !== this.placeholder_);
};


/**
 * @return {boolean}
 * @private
 */
als.InputPlaceholder.prototype.isFilled_ = function() {
  return !this.isEmpty_();
};


/**
 * @return {boolean}
 * @private
 */
als.InputPlaceholder.prototype.isEmpty_ = function() {
  return this.getValue_() === '';
};


/**
 * @return {string}
 * @private
 */
als.InputPlaceholder.prototype.getValue_ = function() {
  return jQuery.trim(
      (/** @type {string} */ this.root_.val()));
};
