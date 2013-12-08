//
// Copyright 2012 Art. Lebedev Studio. All Rights Reserved.
// Created on 2012.03.26
//
// This source code follows Google JavaScript Style Guide
// http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//
// Released under the MIT license - http://opensource.org/licenses/MIT
//

/**
 * @fileoverview  Class responsible for visual fixing html block on page scroll.
 *
 * @author Alexander Samilyak (aleksam241@gmail.com)
 */


// @require als.js.
var als = als || {};
/*
 Replace this with:
   goog.provide('als.VerticalFixer');
   goog.require('als');

 if your project framework is Closure Library.
*/


/**
 * @param {!jQuery} root
 * @param {!jQuery} topLimiter  Must be root's closest positioned ancestor.
 * @param {!jQuery} bottomLimiter
 * @param {!jQuery=} opt_widthLikeThat
 * @param {number=} opt_topMargin  Vertical pixel margin between root's top and
 * browser's viewport top to preserve when fixing block.
 * @constructor
 */
als.VerticalFixer = function(
    root, topLimiter, bottomLimiter, opt_widthLikeThat, opt_topMargin) {

  /**
   * @type {!jQuery}
   * @private
   */
  this.root_ = root;

  /**
   * @type {!jQuery}
   * @private
   */
  this.topLimiter_ = topLimiter;

  /**
   * @type {!jQuery}
   * @private
   */
  this.bottomLimiter_ = bottomLimiter;

  /**
   * @type {jQuery}
   * @private
   */
  this.widthLikeThat_ = opt_widthLikeThat || null;

  /**
   * @type {number}
   * @private
   */
  this.topMargin_ = (
      opt_topMargin === undefined ?
          als.VerticalFixer.DEFAULT_TOP_MARGIN :
          opt_topMargin);

  /**
   * @type {!jQuery}
   * @private
   */
  this.window_ = jQuery(window);

  /**
   * @type {boolean}
   * @private
   */
  this.enabled_ = true;

  /**
   * @type {?als.VerticalFixer.PositionStatus}
   * @private
   */
  this.currentStatus_ = null;


  this.refresh();
  this.attachEvents_();
};


/**
 * @const
 * @type {number}
 */
als.VerticalFixer.DEFAULT_TOP_MARGIN = 15;

/**
 * @const
 * @type {string}
 */
als.VerticalFixer.STOPPED_CLASS = 'stopped';


/**
 * @typedef {{
 *   status: als.VerticalFixer.PositionStatus,
 *   top: number
 * }}
 */
als.VerticalFixer.Position = {};

/**
 * @enum {number}
 */
als.VerticalFixer.PositionStatus = {
  NOT_STOPPED: 0,
  STOPPED_ON_TOP: 1,
  STOPPED_ON_BOTTOM: 2
};



als.VerticalFixer.prototype.refresh = function() {
  this.refreshLeft_();
  this.refreshWidth_();
  this.refreshPosition_(true);
};


als.VerticalFixer.prototype.enable = function() {
  this.enabled_ = true;
  this.refresh();
};


als.VerticalFixer.prototype.disable = function() {
  this.enabled_ = false;
  this.root_
      .css({ 'left': '', 'top': '', 'width': '' })
      .removeClass(als.VerticalFixer.STOPPED_CLASS);
};


/**
 * @private
 */
als.VerticalFixer.prototype.attachEvents_ = function() {
  var that = this;

  this.window_
      .resize(function() {
        if (that.enabled_) {
          that.refresh();
        }
      })
      .scroll(function() {
        if (that.enabled_) {
          that.refreshPosition_();
        }
      });
};


/**
 * @param {boolean=} opt_force
 * @private
 */
als.VerticalFixer.prototype.refreshPosition_ = function(opt_force) {
  /** @type {!als.VerticalFixer.Position} */
  var position = this.getPosition_();

  if (position.status === this.currentStatus_ && !opt_force) {
    return;
  }


  this.currentStatus_ = position.status;

  /** @type {boolean} */
  var stopped = (
      position.status !==
          als.VerticalFixer.PositionStatus.NOT_STOPPED);

  this.refreshLeft_();
  this.root_.toggleClass(als.VerticalFixer.STOPPED_CLASS, stopped);
  this.root_.css(
      'top',
      stopped ?
          position.top - this.topLimiter_.offset().top :
          this.topMargin_);
};


/**
 * @private
 */
als.VerticalFixer.prototype.refreshLeft_ = function() {
  if (this.currentStatus_ ===
      als.VerticalFixer.PositionStatus.NOT_STOPPED) {

    this.root_.css('left', this.topLimiter_.offset().left);
  } else {
    this.root_.css('left', '');
  }
};


/**
 * @private
 */
als.VerticalFixer.prototype.refreshWidth_ = function() {
  if (this.widthLikeThat_) {
    this.root_.width(
        als.getBlockWidth(this.widthLikeThat_));
  }
};


/**
 * @return {!als.VerticalFixer.Position}
 * @private
 */
als.VerticalFixer.prototype.getPosition_ = function() {
  /** @type {{ top: number, bottom: number }} */
  var bounds = this.getBounds_();

  /** @type {number} */
  var freeTop =
      (/** @type {number} */ this.window_.scrollTop()) + this.topMargin_;

  /** @type {number} */
  var height = this.root_.innerHeight();

  /** @type {number} */
  var boundsHeight = bounds.bottom - bounds.top;

  if (freeTop < bounds.top || height > boundsHeight) {
    return {
      status: als.VerticalFixer.PositionStatus.STOPPED_ON_TOP,
      top: bounds.top
    };
  } else {
    if (freeTop + height > bounds.bottom) {
      return {
        status: als.VerticalFixer.PositionStatus.STOPPED_ON_BOTTOM,
        top: bounds.bottom - height
      };
    } else {
      return {
        status: als.VerticalFixer.PositionStatus.NOT_STOPPED,
        top: 0
      };
    }
  }
};


/**
 * @return {{ top: number, bottom: number }}
 * @private
 */
als.VerticalFixer.prototype.getBounds_ = function() {
  return {
    top: this.topLimiter_.offset().top,
    bottom: this.bottomLimiter_.offset().top + this.bottomLimiter_.innerHeight()
  };
};
