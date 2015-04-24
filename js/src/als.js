//
// Copyright 2012 Art. Lebedev Studio. All Rights Reserved.
// Created on 2012.03.15
//
// This source code follows Google JavaScript Style Guide
// http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//
// Released under the MIT license - http://opensource.org/licenses/MIT
//

/**
 * @fileoverview Collection of low-level utility functions and enums.
 *
 * @author Alexander Samilyak (aleksam241@gmail.com)
 */


goog.provide('als');
/*
  Replace this with `var als = als || {};`
  if your project is not dependant on Closure Library.
*/


/**
 * @const
 * @type {!jQuery}
 */
als.window = jQuery(window);


/**
 * @const
 * @enum {number}
 */
als.Keyboard = {
  DOWN: 40,
  ENTER: 13,
  ESCAPE: 27,
  LEFT: 37,
  RIGHT: 39,
  SPACE: 32,
  UP: 38
};


/**
 * Regular parseInt() but with forced decimal radix.
 * This is effectively convenient function added because of Closure Compiler
 * that requires 2nd argument for global JavaScript parseInt() function.
 * @param {*} num
 * @return {number}
 */
als.parseInt = function(num) {
  return parseInt(num, 10);
};


/**
 * This method is for casting purpose only to please Closure Compiler.
 * @param {!jQuery} block
 * @return {number}
 */
als.getBlockWidth = function(block) {
  return /** @type {number} */ (block.width());
};


/**
 * This method is for casting purpose only to please Closure Compiler.
 * @param {!jQuery} block
 * @return {number}
 */
als.getBlockHeight = function(block) {
  return /** @type {number} */ (block.height());
};


/**
 * @param {!jQuery} block
 * @param {string} attrName
 * @return {string}
 */
als.getBlockAttr = function(block, attrName) {
  var attr = /** @type {(string | undefined)} */ (block.attr(attrName));

  if (attr === undefined) {
    return '';
  } else {
    return attr;
  }
};


/**
 * @param {!jQuery} block
 * @param {!jQuery=} opt_relativeToBlock
 * @return {{ left: number, top: number }}
 */
als.getBlockOffset = function(block, opt_relativeToBlock) {
  var globalOffset =
      /** @type {{ left: number, top: number }} */ (block.offset());

  /** @type {{ left: number, top: number }} */
  var relativeOffset = {
    left: 0,
    top: 0
  };

  if (opt_relativeToBlock) {
    relativeOffset =
        /** @type {{ left: number, top: number }} */
        (opt_relativeToBlock.offset());
  }

  return {
    left: globalOffset.left - relativeOffset.left,
    top: globalOffset.top - relativeOffset.top
  };
};


/**
 * @return {number}
 */
als.getWindowWidth = function() {
  return als.getBlockWidth(als.window);
};


/**
 * @return {number}
 */
als.getWindowHeight = function() {
  return als.getBlockHeight(als.window);
};


/**
 * @return {number}
 */
als.getWindowScrollTop = function() {
  return /** @type {number} */ (als.window.scrollTop());
};


/**
 * @return {number}
 */
als.getWindowScrollLeft = function() {
  return /** @type {number} */ (als.window.scrollLeft());
};


/**
 * Calls a function for each element in an object/map/hash.
 * This is implementation from goog.object.forEach() but
 * with additional hasOwnProperty check.
 *
 * @param {Object.<K,V>} obj The object over which to iterate.
 * @param {function(this:T,V,?,Object.<K,V>):?} f The function to call
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the object) and the return value is ignored.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @template T,K,V
 */
als.forEach = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      f.call(opt_obj, obj[key], key, obj);
    }
  }
};


/**
 *
 * @param {number} number
 * @param {string=} opt_groupSeparator  Defaults to thin space (&#8201;).
 * @param {string=} opt_fractionSeparator  Defaults to one comma (',').
 * @param {boolean=} opt_showPlusSign
 * @return {string}
 */
als.formatNumber = function(
    number, opt_groupSeparator, opt_fractionSeparator, opt_showPlusSign) {

  /** @type {string} */
  var numAsStr = Math.abs(number).toString();

  /** @type {string} */
  var groupSeparator = opt_groupSeparator || String.fromCharCode(8201);

  /** @type {string} */
  var fractionSeparator = opt_fractionSeparator || ',';

  /** @type {number} */
  var fractionIndex = numAsStr.indexOf('.');

  /** @type {string} */
  var fraction =
      fractionIndex === -1 ? '' : numAsStr.substring(fractionIndex + 1);

  /** @type {string} */
  var integer =
      fractionIndex === -1 ? numAsStr : numAsStr.substring(0, fractionIndex);

  /** @type {string} */
  var result = '';
  if (integer.length <= 4) {
    result =
        integer + (fractionIndex === -1 ? '' : fractionSeparator + fraction);
  } else {

    while (integer.length >= 4) {
      result =
          integer.substring(integer.length - 3) +
              (result.length > 0 ? groupSeparator : '') + result;

      integer = integer.substring(0, integer.length - 3);
    }

    result =
        integer + groupSeparator + result +
            (fractionIndex === -1 ? '' : fractionSeparator + fraction);
  }

  /** @type {string} */
  var signPrefix = '';
  if (number > 0) {
    signPrefix = (opt_showPlusSign ? '+' : '');
  } else if (number < 0) {
    signPrefix = String.fromCharCode(8722); // &minus;
  }

  if (signPrefix !== '') {
    result =
        signPrefix +
            String.fromCharCode(8202) + // &hairsp;
            result;
  }


  return result;
};


/**
 * Cleans string from non-digit symbols making a number out of it
 * @param {string} source
 * @return {number}
 */
als.cleanToNumber = function(source) {
  /** @type {string} */
  var mayBeNumber = source.valueOf().replace(/[^\d.-]/g, '');

  if (mayBeNumber === '' || isNaN(mayBeNumber)) {
    return NaN;
  } else {
    return als.parseInt(mayBeNumber);
  }
};


/**
 * Returns one of three string forms based on number and Russian declensions
 * @param {number} number  Positive number.
 * @param {!Array.<string>} forms  Array of three string element:
 *    element 0 - for number 1;
 *    element 1 - for numbers less than 10 and greater than 20 and finishing
 *        with 2, 3, and 4;
 *    element 2 - all other numbers.
 * @return {string}
 */
als.getRussianDeclension = function(number, forms) {
  if (/1[1-4]$/.test(number)) {
    return forms[2];
  }
  if (/[2-4]$/.test(number)) {
    return forms[1];
  }
  if (/1$/.test(number)) {
    return forms[0];
  }

  return forms[2];
};


/**
 * @param {number} num  Non-negative integer to find factorial for.
 * @return {number}
 */
als.mathFactorial = function(num) {
  if (num < 0) {
    throw Error('Input number must be non negative. Found: ' + num);
  }

  if (als.mathFactorial.cache[num] === undefined) {
    if (num === 0) {
      als.mathFactorial.cache[num] = 1;
    } else {
      als.mathFactorial.cache[num] = num * als.mathFactorial(num - 1);
    }
  }

  return als.mathFactorial.cache[num];
};
als.mathFactorial.cache = [];
