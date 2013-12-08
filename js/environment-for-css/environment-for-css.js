//
// Copyright 2012 Art. Lebedev Studio. All Rights Reserved.
// Created on 2012.01.14
//
// This source code follows Google JavaScript Style Guide
// http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//
// Released under the MIT license - http://opensource.org/licenses/MIT
//

/**
 * @fileoverview Script detects browser environment and puts this
 * information into <html> element class.
 * It detects:
 *  - browser vendor ('ie', 'firefox', 'safari', 'chrome', 'opera'),
 *  - browser version (for IE and Safari only),
 *  - operating system ('windows', 'macos', 'linux', 'ios'),
 *  - device type ('desktop', 'mobile'),
 *  - mobile device type ('iphone', 'ipad', 'ipod', 'android').
 *
 * Script also removes 'no-js' and adds 'js' class to <html> element.
 *
 * This script has no dependencies on any js library, so it's better for you
 * to put this script to <head> to be sure body rendering will start after
 * this script runs and updates <html> element class.
 *
 * @author Alexander Samilyak (aleksam241@gmail.com)
 */


/**
 * @constructor
 */
var EnvironmentForCss = function() {
  /**
   * @type {!Element}
   * @private
   */
  this.htmlElem_ = document.documentElement;

  /**
   * @type {string}
   * @private
   */
  this.userAgent_ = window.navigator.userAgent.toLowerCase();

  /**
   * @type {string}
   * @private
   */
  this.platform_ = window.navigator.platform.toLowerCase();


  this.setHtmlElementClasses_(this.getClassesToSet_());
};

/**
 * @const
 * @type {string}
 */
EnvironmentForCss.JS_CLASS = 'js';

/**
 * @const
 * @type {string}
 */
EnvironmentForCss.NO_JS_CLASS = 'no-js';



/**
 * @return {!Array.<string>}
 * @private
 */
EnvironmentForCss.prototype.getClassesToSet_ = function() {
  /** @type {!Array.<string>} */
  var classes = [].concat(
      this.getHtmlElementClasses_(),
      this.getBrowserClasses_(),
      this.getPlatformClasses_(),
      this.getDeviceTypeClasses_(),
      this.getMobileDeviceTypeClasses_());

  this.addJsAndRemoveNoJsClass_(classes);

  return classes;
};


/**
 * @return {!Array.<string>}
 * @private
 */
EnvironmentForCss.prototype.getBrowserClasses_ = function() {
  /** @type {!Array.<string>} */
  var classes = [];

  /** @type {?Array} */
  var versionMatch;

  if (/msie/.test(this.userAgent_) && !/opera/.test(this.userAgent_)) {
    classes.push('ie');

    versionMatch = this.userAgent_.match(/msie ([0-9.]+)/);

    if (versionMatch) {
      /** @type {number} */
      var version = parseInt(versionMatch[1], 10);

      classes.push('ie' + version);
      if (version === 7 || version === 8) {
        classes.push('ie7-8');
      }
    }

  } else if (
      /mozilla/.test(this.userAgent_) &&
      !/(compatible|webkit)/.test(this.userAgent_)) {

    classes.push('firefox');

  } else if (
      /safari/.test(this.userAgent_) && !/chrome/.test(this.userAgent_)) {

    classes.push('safari', 'webkit');

    versionMatch = this.userAgent_.match(/version\/([0-9.]+)/);
    if (versionMatch) {
      classes.push('safari' + parseInt(versionMatch[1], 10));
    }

  } else if (/opera/.test(this.userAgent_) || /opera/i.test(window.navigator.vendor)) {
    classes.push('opera', 'webkit');
  } else if (/chrome/.test(this.userAgent_)) {
    classes.push('chrome', 'webkit');
  }

  return classes;
};


/**
 * @return {!Array.<string>}
 * @private
 */
EnvironmentForCss.prototype.getPlatformClasses_ = function() {
  /** @type {!Array.<string>} */
  var classes = [];

  if (/win/.test(this.platform_)) {
    classes.push('windows');

  } else if (/mac/.test(this.platform_)) {
    classes.push('macos');

  } else if (/linux/.test(this.platform_)) {
    classes.push('linux');

  } else if (/iphone|ipad|ipod/.test(this.userAgent_)) {
    classes.push('ios');
  }

  return classes;
};


/**
 * @return {!Array.<string>}
 * @private
 */
EnvironmentForCss.prototype.getDeviceTypeClasses_ = function() {
  /** @type {!Array.<string>} */
  var classes = [];

  if (/mobile/.test(this.userAgent_)) {
    classes.push('mobile');
  } else {
    classes.push('desktop');
  }

  return classes;
};


/**
 * @return {!Array.<string>}
 * @private
 */
EnvironmentForCss.prototype.getMobileDeviceTypeClasses_ = function() {
  /** @type {!Array.<string>} */
  var classes = [];

  if (/iphone/.test(this.userAgent_)) {
    classes.push('iphone');

  } else if (/ipad/.test(this.userAgent_)) {
    classes.push('ipad');

  } else if (/ipod/.test(this.userAgent_)) {
    classes.push('ipod');

  } else if (/android/.test(this.userAgent_)) {
    classes.push('android');
  }

  return classes;
};


/**
 * @param {!Array.<string>} classes
 * @return {!Array.<string>}
 * @private
 */
EnvironmentForCss.prototype.addJsAndRemoveNoJsClass_ = function(classes) {
  classes.push(EnvironmentForCss.JS_CLASS);

  for (var i = 0, len = classes.length; i < len; i++) {
    if (classes[i] === EnvironmentForCss.NO_JS_CLASS) {
      classes.splice(i, 1);
      break;
    }
  }

  return classes;
};


/**
 * @return {!Array.<string>}
 * @private
 */
EnvironmentForCss.prototype.getHtmlElementClasses_ = function() {
  /** @type {!Array.<string>} */
  var classes = [];

  /** @type {string} */
  var classAttr = this.htmlElem_.className;
  if (classAttr !== '') {
    classes = classAttr.split(/\s+/);
  }

  return classes;
};


/**
 * @param {!Array.<string>} classes
 * @private
 */
EnvironmentForCss.prototype.setHtmlElementClasses_ = function(classes) {
  this.htmlElem_.className = classes.join(' ');
};




new EnvironmentForCss();
