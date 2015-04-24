//
// Copyright 2012 Art. Lebedev Studio. All Rights Reserved.
// Created on 2012.03.28
//
// This source code follows Google JavaScript Style Guide
// http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//
// Released under the MIT license - http://opensource.org/licenses/MIT
//

/**
 * @fileoverview Class for window smooth animated scrolling.
 * It's able to scroll to some numerical offset and to any DOM block.
 * If you scroll to block class is trying to scroll as short distance
 * as possible to make block completely visible in a browser viewport.
 * 'easeInOutExpo' easing is used for animation if it's available,
 * 'swing' easing is used otherwise as a fallback.
 *
 * Use `als.WindowScroller` to access to a single class instance
 * (constructor is private).
 *
 * @author Alexander Samilyak (aleksam241@gmail.com)
 */


goog.provide('als.WindowScroller');
goog.require('als');
/*
  Replace this with `var als = als || {};`
  if your project is not dependant on Closure Library.
*/



/**
 * @constructor
 * @private
 */
als.VerticalScroller_ = function() {
  /**
   * @type {!jQuery}
   * @private
   */
  this.animator_ = jQuery({ 'progress': 0 });
};


/**
 * Vertical pixel margin from browser viewport to block box
 * @const
 * @type {number}
 */
als.VerticalScroller_.TOP_MARGIN = 10;

/**
 * Milliseconds to perform scroll animation
 * @const
 * @type {number}
 */
als.VerticalScroller_.SCROLL_DURATION = 700;

/**
 * Scrolling won't happen if pixel distance to scroll is less than this distance
 * @const
 * @type {number}
 */
als.VerticalScroller_.MIN_SCROLLING_DISTANCE = 2;


/**
 * @return {number}
 */
als.VerticalScroller_.getViewportHeight = function() {
  return window.innerHeight || document.documentElement.clientHeight;
};


/**
 * @param {!jQuery} block
 * @param {boolean=} opt_alwaysToTop
 * @param {function()=} opt_onComplete
 */
als.VerticalScroller_.prototype.
    scrollToBlock = function(block, opt_alwaysToTop, opt_onComplete) {

  /** @type {number} */
  var scrollTo;

  if (opt_alwaysToTop) {
    scrollTo =
        this.getBlockBounds_(block).top - als.VerticalScroller_.TOP_MARGIN;

  } else {
    /** @type {?number} */
    var closestScroll = this.getScrollTopToMoveTo_(block);
    if (closestScroll === null) {
      /**
       * This means that the block is in a viewport already and there's no need
       * to scroll to it. So we just set viewport scrollTop to avoid animation.
       */
      closestScroll = als.getWindowScrollTop();
    }

    scrollTo = closestScroll;
  }

  this.scrollToOffset(scrollTo, opt_onComplete);
};


/**
 * @param {number} offset
 * @param {function()=} opt_onComplete
 */
als.VerticalScroller_.prototype.
    scrollToOffset = function(offset, opt_onComplete) {

  this.animator_.stop(true);

  /** @type {number} */
  var startScrollTop = als.getWindowScrollTop();

  /** @type {number} */
  var finalScrollTop = offset;

  if (Math.abs(startScrollTop - finalScrollTop) <
      als.VerticalScroller_.MIN_SCROLLING_DISTANCE) {

    if (opt_onComplete) {
      opt_onComplete();
    }
  } else {
    this.animateScroll_(startScrollTop, finalScrollTop, opt_onComplete);
  }
};


/**
 * @param {number} from
 * @param {number} to
 * @param {function()=} opt_onComplete
 * @private
 */
als.VerticalScroller_.prototype.
    animateScroll_ = function(from, to, opt_onComplete) {

  this.animator_[0]['progress'] = 0;
  this.animator_.animate(
      { 'progress': 1 },
      {
        'step': function(progress) {
          als.window.scrollTop(from + progress * (to - from));
        },
        'duration': als.VerticalScroller_.SCROLL_DURATION,
        'easing': (
            typeof jQuery['easing']['easeInOutExpo'] === 'function' ?
                'easeInOutExpo' :
                'swing'),
        'complete': opt_onComplete
      });
};


/**
 * @param {!jQuery} block
 * @return {?number}
 * @private
 */
als.VerticalScroller_.prototype.getScrollTopToMoveTo_ = function(block) {
  if (block.height() === 0) {
    return null;
  }


  /** @type {{ top: number, bottom: number}} */
  var blockBounds = this.getBlockBounds_(block);

  /** @type {{ top: number, bottom: number}} */
  var viewportBounds = this.getViewportBounds_();

  /** @type {boolean} */
  var needToScrollUp = (blockBounds.top < viewportBounds.top);

  /** @type {boolean} */
  var needToScrollDown = (blockBounds.bottom > viewportBounds.bottom);

  /** @type {boolean} */
  var largerThanViewport = (
      block.outerHeight() + als.VerticalScroller_.TOP_MARGIN >
          als.VerticalScroller_.getViewportHeight());

  if (needToScrollUp || needToScrollDown) {
    if (largerThanViewport || needToScrollUp) {
      return blockBounds.top - als.VerticalScroller_.TOP_MARGIN;
    } else {
      return (
          blockBounds.bottom + als.VerticalScroller_.TOP_MARGIN -
              als.VerticalScroller_.getViewportHeight());
    }
  } else {
    return null;
  }
};


/**
 * @private
 * @param {!jQuery} block
 * @return {{ top: number, bottom: number}}
 */
als.VerticalScroller_.prototype.getBlockBounds_ = function(block) {
  /** @type {number} */
  var offsetTop = block.offset().top;

  return {
    top: offsetTop,
    bottom: offsetTop + block.outerHeight()
  };
};


/**
 * @return {{ top: number, bottom: number}}
 * @private
 */
als.VerticalScroller_.prototype.getViewportBounds_ = function() {
  /** @type {number} */
  var scrollTop = als.getWindowScrollTop();

  return {
    top: scrollTop,
    bottom: scrollTop + als.VerticalScroller_.getViewportHeight()
  };
};





/**
 * @const
 * @type {!als.VerticalScroller_}
 */
als.WindowScroller = new als.VerticalScroller_();
