//
// Copyright 2013 Art. Lebedev Studio. All Rights Reserved.
// Created on 2013.02.12
//
// This source code follows Google JavaScript Style Guide
// http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//
// Released under the MIT license - http://opensource.org/licenses/MIT
//

/**
 * @fileoverview  Class for frame animations based on the idea of css sprites.
 * Usually sprites are completely horizontal or vertical but rectangular grid of
 * frames is supported as well.
 *
 * For example, if you have horizontal sprite 100*10px and frame size 10*10px
 * then you have 10 frames in one row. Animator will switch frames from left
 * to right, like that:
 * 1 2 3 4 5 6 7 8 9 10
 *
 * If you have a grid sprite 20*40px and a frame size 10*10px then frames will
 * be switched from left to right and from top to bottom, like that:
 * 1 2
 * 3 4
 * 5 6
 * 7 8
 *
 * No custom easings are supported. Sprites are always switched using
 * linear easing. You're able to customize milliseconds delay between each
 * frame. Positive value means to walk through frames in normal order
 * (see above), negative - in a reversed order. Default delay is 33ms.
 *
 * @author Alexander Samilyak (aleksam241@gmail.com)
 */


goog.provide('als.SpriteAnimator');
/*
  Replace this with `var als = als || {};`
  if your project is not dependant on Closure Library.
*/


/**
 * @param {!jQuery} elem
 * @param {!{ width:(number|undefined), height:(number|undefined) }} frameSize
 *    Width and height of one frame. You should pass at least one dimension.
 *    The omitted one is not taking into account and therefore sprite is treated
 *    as completely horizontal or vertical.
 * @param {!{ width:(number|undefined), height:(number|undefined) }} spriteSize
 *    Width and height of a sprite. You should pass at least one dimension.
 *    The omitted one is not taking into account and therefore sprite is treated
 *    as completely horizontal or vertical.
 * @param {!als.SpriteAnimator.Prop=} opt_propToAnimate  Defaults to
 *    als.SpriteAnimator.Prop.BACKGROUND_POSITION which means animator will
 *    animate background-position css property, rather than left/top.
 * @param {(number | !Array.<number>)=} opt_pauseFrames  Frame numbers where
 *    animation should be paused and als.SpriteAnimator.EventType.PAUSE event
 *    will be triggered. First frame is 1. Pass here a number of last frame
 *    if you don't want animation to be looped.
 * @param {number=} opt_framesCount  Count of frames in your sprite. It's
 *    calculated based on frameSize and spriteSize parameters by default.
 *    This parameter is useful if you have sprite containing several rows and
 *    columns of frames and sprite is not filled with frames completely.
 *    For example, you have frame 10*10px and sprite 100*100px and the number
 *    of frames is not 10*10=100 but rather let's say 95. So pass 95 to this
 *    parameter.
 *
 * @constructor
 */
als.SpriteAnimator = function(
    elem,
    frameSize,
    spriteSize,
    opt_propToAnimate,
    opt_pauseFrames,
    opt_framesCount) {

  /**
   * @type {!jQuery}
   * @private
   */
  this.elem_ = elem;

  /**
   * @type {!als.SpriteAnimator.Prop}
   * @private
   */
  this.propToAnimate_ =
      (opt_propToAnimate || als.SpriteAnimator.Prop.BACKGROUND_POSITION);

  /**
   * @type {!{ width: number, height: number }}
   * @private
   */
  this.frameSize_ = this.normalizeSize_(frameSize);

  /**
   * @type {!{ width: number, height: number }}
   * @private
   */
  this.spriteSize_ = this.normalizeSize_(spriteSize);

  /**
   * @type {!Array.<number>}
   * @private
   */
  this.pauseFrames_ = this.normalizePauseFrames_(opt_pauseFrames || []);

  /**
   * @type {boolean}
   * @private
   */
  this.animating_ = false;

  /**
   * Milliseconds between each frame.
   * @type {number}
   * @private
   */
  this.framesInterval_ = als.SpriteAnimator.DEFAULT_FRAMES_INTERVAL;

  /**
   * @type {number}
   * @private
   */
  this.currentFrame_ = als.SpriteAnimator.DEFAULT_START_FRAME;

  /**
   * @type {number}
   * @private
   */
  this.framesCols_ = this.calculateFramesCols_();

  /**
   * @type {number}
   * @private
   */
  this.framesRows_ = this.calculateFramesRows_();

  /**
   * @type {number}
   * @private
   */
  this.framesCount_ = (
      typeof opt_framesCount === 'number' ?
          opt_framesCount :
          this.framesCols_ * this.framesRows_);

  /**
   * @type {number}
   * @private
   */
  this.lastRememberedTime_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.loopTimeout_ = 0;

  /**
   * @type {!jQuery}
   * @private
   */
  this.eventsDispatcher_ = jQuery({});
};


/**
 * Default milliseconds interval between each frame.
 * @const
 * @type {number}
 */
als.SpriteAnimator.DEFAULT_FRAMES_INTERVAL = 33;

/**
 * @const
 * @type {number}
 */
als.SpriteAnimator.DEFAULT_START_FRAME = 1;


/**
 * @enum {string}
 */
als.SpriteAnimator.EventType = {
  PAUSE: 'pause'
};


/**
 * @enum {string}
 */
als.SpriteAnimator.Prop = {
  BACKGROUND_POSITION: 'background_position',
  POSITION: 'position'
};




/**
 * @return {boolean}
 */
als.SpriteAnimator.prototype.isAnimating = function() {
  return this.animating_;
};


/**
 * @return {!als.SpriteAnimator}
 */
als.SpriteAnimator.prototype.play = function() {
  if (!this.animating_) {
    this.animating_ = true;
    this.runLoop_();
  }

  return this;
};


/**
 * @return {!als.SpriteAnimator}
 */
als.SpriteAnimator.prototype.pause = function() {
  if (this.animating_) {
    this.animating_ = false;
    clearTimeout(this.loopTimeout_);
    this.eventsDispatcher_.trigger(als.SpriteAnimator.EventType.PAUSE);
  }

  return this;
};


/**
 * @return {!als.SpriteAnimator}
 */
als.SpriteAnimator.prototype.rewind = function() {
  clearTimeout(this.loopTimeout_);
  this.currentFrame_ = als.SpriteAnimator.DEFAULT_START_FRAME;
  this.drawElem_();

  if (this.animating_) {
    this.runLoop_();
  }

  return this;
};


/**
 * @param {number} frame
 * @return {!als.SpriteAnimator}
 */
als.SpriteAnimator.prototype.moveToFrame = function(frame) {
  this.throwErrorIfFrameIsInvalid_(frame);
  this.moveToFrame_(frame);

  return this;
};


/**
 * @return {number}
 */
als.SpriteAnimator.prototype.getCurrentFrame = function() {
  return this.currentFrame_;
};


/**
 * @return {number}
 */
als.SpriteAnimator.prototype.getFramesCount = function() {
  return this.framesCount_;
};


/**
 * @return {number}
 */
als.SpriteAnimator.prototype.getFramesInterval = function() {
  return this.framesInterval_;
};


/**
 * Sets milliseconds between each frame.
 * You can pass negative integer to run animation in a reversed direction.
 * @param {number} interval
 */
als.SpriteAnimator.prototype.setFramesInterval = function(interval) {
  this.framesInterval_ = interval;
};


/**
 * @return {!Array.<number>}
 */
als.SpriteAnimator.prototype.getPauseFrames = function() {
  return this.pauseFrames_;
};


/**
 * @param {!Array.<number>} pauseFrames
 */
als.SpriteAnimator.prototype.setPauseFrames = function(pauseFrames) {
  this.pauseFrames_ = pauseFrames;
};


/**
 * @param {!als.SpriteAnimator.EventType} eventType
 * @param {function(!jQuery.event)} callback
 */
als.SpriteAnimator.prototype.addEventListener = function(eventType, callback) {
  this.eventsDispatcher_.bind(eventType, callback);
};


/**
 * @param {!als.SpriteAnimator.EventType} eventType
 * @param {function(!jQuery.event=)} callback
 */
als.SpriteAnimator.prototype.
    removeEventListener = function(eventType, callback) {

  this.eventsDispatcher_.unbind(eventType, callback);
};



/**
 * @private
 */
als.SpriteAnimator.prototype.runLoop_ = function() {
  this.loopTimeout_ = setTimeout(
      jQuery.proxy(this.runLoop_, this),
      5);

  /** @type {number} */
  var currentTime = new Date().getTime();

  if (this.lastRememberedTime_ <= currentTime) {
    this.moveToNextFrame_();
    this.lastRememberedTime_ = currentTime + Math.abs(this.framesInterval_);
  }
};


/**
 * @private
 */
als.SpriteAnimator.prototype.moveToNextFrame_ = function() {
  /** @type {number} */
  var increment = (this.framesInterval_ > 0 ? 1 : -1);

  /** @type {number} */
  var nextFrame = this.currentFrame_ + increment;

  if (nextFrame > this.framesCount_) {
    nextFrame = 1;
  }
  if (nextFrame < 1) {
    nextFrame = this.framesCount_;
  }

  this.moveToFrame(nextFrame);
};


/**
 * @param {number} frame
 * @private
 */
als.SpriteAnimator.prototype.moveToFrame_ = function(frame) {
  this.currentFrame_ = frame;
  this.drawElem_();

  if (jQuery.inArray(this.currentFrame_, this.pauseFrames_) !== -1) {
    this.pause();
  }
};


/**
 * @private
 */
als.SpriteAnimator.prototype.drawElem_ = function() {
  /** @type {!{ left: number, top: number }} */
  var positionToMoveTo = this.getFramePosition_(this.currentFrame_);

  if (this.propToAnimate_ === als.SpriteAnimator.Prop.BACKGROUND_POSITION) {
    this.elem_.css(
        'background-position',
        (-positionToMoveTo.left + 'px') + ' ' + (-positionToMoveTo.top + 'px'));

  } else if (this.propToAnimate_ === als.SpriteAnimator.Prop.POSITION) {
    if (this.framesCols_ !== 1) {
      this.elem_.css('left', -positionToMoveTo.left);
    }
    if (this.framesRows_ !== 1) {
      this.elem_.css('top', -positionToMoveTo.top);
    }
  }
};


/**
 * @param {number} frame
 * @return {!{ left: number, top: number }}
 * @private
 */
als.SpriteAnimator.prototype.getFramePosition_ = function(frame) {
  this.throwErrorIfFrameIsInvalid_(frame);

  /** @type {number} */
  var row = Math.ceil(frame / this.framesCols_);

  /** @type {number} */
  var col = (frame - 1) % this.framesCols_ + 1;

  return {
    left: (col - 1) * this.frameSize_.width,
    top: (row - 1) * this.frameSize_.height
  };
};


/**
 * @return {number}
 * @private
 */
als.SpriteAnimator.prototype.calculateFramesCols_ = function() {
  if (this.frameSize_.width !== 0 && this.spriteSize_.width !== 0) {
    return Math.floor(this.spriteSize_.width / this.frameSize_.width);
  } else {
    return 1;
  }
};


/**
 * @return {number}
 * @private
 */
als.SpriteAnimator.prototype.calculateFramesRows_ = function() {
  if (this.frameSize_.height !== 0 && this.spriteSize_.height !== 0) {
    return Math.floor(this.spriteSize_.height / this.frameSize_.height);
  } else {
    return 1;
  }
};


/**
 * @param {!{ width:(number|undefined), height:(number|undefined) }} size
 * @return {!{ width: number, height: number }}
 * @private
 */
als.SpriteAnimator.prototype.normalizeSize_ = function(size) {
  return {
    width: (typeof size.width === 'number' ? size.width : 0),
    height: (typeof size.height === 'number' ? size.height : 0)
  };
};


/**
 * @param {(number | !Array.<number>)} pauseFrames
 * @return {!Array.<number>}
 * @private
 */
als.SpriteAnimator.prototype.normalizePauseFrames_ = function(pauseFrames) {
  if (typeof pauseFrames === 'number') {
    return [pauseFrames];
  } else {
    return pauseFrames;
  }
};


/**
 * @param {number} frame
 * @private
 */
als.SpriteAnimator.prototype.throwErrorIfFrameIsInvalid_ = function(frame) {
  if (frame < 1 || frame > this.framesCount_) {
    throw Error(
        'Frame number must be between 1 and ' + this.framesCount_ +
            '. Found: ' + frame);
  }
};
