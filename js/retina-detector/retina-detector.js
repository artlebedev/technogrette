//
// Copyright 2012 Art. Lebedev Studio. All Rights Reserved.
// Created on 2012.08.11
//
// This source code follows Google JavaScript Style Guide
// http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//
// Released under the MIT license - http://opensource.org/licenses/MIT
//

/**
 * @fileoverview  Class detects retina display on a client side and writes
 * 'true' or 'false' to a cookie named 'retina'. It treats device as retina
 * if window.devicePixelRatio is defined and more or equal 2.
 * There will be page reload after that (window.location.reload()) to allow
 * server side update html accordingly.
 *
 * Class performs those actions if:
 *  1. cookies are enabled
 *  and
 *  2. browser is retina, but cookie is not set to 'true'
 *     or
 *     browser is not retina, but cookie is set to 'true'
 *
 * It's better for you to put this script to the beginning of <head>
 * to achieve page reload on user's first visit as soon as possible.
 * This script has no dependencies on any js library.
 *
 * @author Alexander Samilyak (aleksam241@gmail.com)
 */



/**
 * @constructor
 */
var RetinaDetector = function() {
  if (!this.isCookieEnabled_()) {
    return;
  }


  var newCookieValue;

  if (RetinaDetector.isRetinaBrowser() &&
      this.getRetinaStatusFromCookie_() !== 'true') {

    newCookieValue = 'true';

  } else if (
      !RetinaDetector.isRetinaBrowser() &&
      this.getRetinaStatusFromCookie_() === 'true') {

    newCookieValue = 'false';
  }


  if (newCookieValue !== undefined) {
    this.setCookie_(
        RetinaDetector.COOKIE_NAME,
        newCookieValue,
        RetinaDetector.COOKIE_DAYS_TO_LIVE);

    window.location.reload();
  }
};


/**
 * @const
 * @type {string}
 */
RetinaDetector.COOKIE_NAME = 'retina';

/**
 * @const
 * @type {number}
 */
RetinaDetector.COOKIE_DAYS_TO_LIVE = 365;

/**
 * @const
 * @type {number}
 */
RetinaDetector.RETINA_MIN_PIXEL_RATIO = 2;

/**
 * RegExp used to split the cookies string
 * @type {RegExp}
 */
RetinaDetector.COOKIES_SPLIT_RE = /\s*;\s*/;



/**
 * @return {boolean}
 */
RetinaDetector.isRetinaBrowser = function() {
  /** @type {number} */
  var pixelRatio = window.devicePixelRatio || 1;

  return (pixelRatio >= RetinaDetector.RETINA_MIN_PIXEL_RATIO);
};


/**
 * @return {string|undefined}
 * @private
 */
RetinaDetector.prototype.getRetinaStatusFromCookie_ = function() {
  return this.getCookie_(RetinaDetector.COOKIE_NAME);
};


/**
 * @param {string} name
 * @return {string|undefined}
 * @private
 */
RetinaDetector.prototype.getCookie_ = function(name) {
  if (!this.isCookieEnabled_()) {
    return undefined;
  }

  /** @type {string} */
  var cookiesStr = document.cookie || '';

  /** @type {!Array.<string>} */
  var cookies = cookiesStr.split(RetinaDetector.COOKIES_SPLIT_RE);

  /** @type {string} */
  var nameWithEqualSign = name + '=';

  for (var i = 0, len = cookies.length; i < len; i++) {
    /** @type {string} */
    var cookie = cookies[i];

    if (cookie.indexOf(nameWithEqualSign) === 0) {
      return cookie.substr(nameWithEqualSign.length);
    }
    if (cookie === name) {
      return '';
    }
  }

  return undefined;
};


/**
 * @param {string} name
 * @param {string} value
 * @param {number} daysToLive
 * @private
 */
RetinaDetector.prototype.setCookie_ = function(name, value, daysToLive) {
  if (!this.isCookieEnabled_()) {
    return;
  }


  /** @type {!Date} */
  var deathDate = new Date(
      new Date().getTime() + daysToLive * 24 * 60 * 60 * 1000);

  /** @type {!Array.<string>} */
  var parts = [
    name + '=' + value,
    'expires=' + deathDate.toUTCString(),
    'path=/'
  ];

  document.cookie = parts.join(';');
};


/**
 * @return {boolean}
 * @private
 */
RetinaDetector.prototype.isCookieEnabled_ = function() {
  return Boolean(navigator.cookieEnabled);
};




new RetinaDetector();
