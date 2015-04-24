#!/usr/bin/env node

/**
 * @author Alexander Samilyak (aleksam241@gmail.com)
 * Created: 2015.04.23
 *
 * This script is running Closure Linter against js source files.
 * It's ignoring linter errors defined in `Linter.ERRORS_TO_IGNORE` constant.
 *
 * The script is dependant on `gjslint` command line process.
 * See https://developers.google.com/closure/utilities/ for more information.
 *
 * The script is intended to run in a command line.
 */


var
    _path = require('path'),
    _util = require('util'),
    _child_process = require('child_process');


var Linter = function() {
  this.run_();
};


/**
 * @const
 * @type {!Array.<number>}
 */
Linter.ERRORS_TO_IGNORE = [
  7,    // Should have 2 blank lines between top-level blocks
  140,  // goog.require classes must be alphabetized
  141,  // goog.provide classes must be alphabetized
  220,  // No docs found for member
  227   // Author tag line should be of the form
];

/**
 * @const
 * @type {string}
 */
Linter.SRC_ROOT = '../src';

/**
 * @const
 * @type {!Array.<string>}
 */
Linter.CATALOGS_TO_IGNORE = [
    'example'
];



/**
 * @private
 */
Linter.prototype.run_ = function() {
  /** @type {string} */
  var command = this.getCommand_();

  process.stderr.write(
      'RUNNING COMMAND:\n' + command + '\n\n');

  _child_process.exec(
      command,
      { timeout: 60 * 1000 },
      this.processExecResult_.bind(this));
};


/**
 * @return {string}
 * @private
 */
Linter.prototype.getCommand_ = function() {
  /** @type {string} */
  var command = _util.format(
      ('gjslint ' +
          '--recurse "%s" ' +
          '--exclude_directories="%s" ' +
          '--disable "%s" ' +
          '--strict ' +
          '--nobeep'),

      this.convertRelativeToAbsolutePath_(Linter.SRC_ROOT),
      Linter.CATALOGS_TO_IGNORE.join(','),
      Linter.ERRORS_TO_IGNORE.join(','));

  return command;
};



/**
 * @param {Error} error
 * @param {Buffer} stdout
 * @param {Buffer} stderr
 * @private
 */
Linter.prototype.processExecResult_ = function(error, stdout, stderr) {
  process.stdout.write(stdout);
  process.stderr.write(stderr);

  if (error === null) {
    this.printLintResult_(true);
    process.exit(0);
  } else {
    this.printLintResult_(false);
    process.exit(error.code);
  }
};



/**
 * @param {boolean} success
 * @private
 */
Linter.prototype.printLintResult_ = function(success) {
  /** @type {string} */
  var result = (success ? 'LINTER SUCCESS' : 'LINTER FAILURE');

  process.stderr.write('\n');
  process.stderr.write(
      '------------------------------------\n' +
      result + '\n' +
      '------------------------------------\n');
};


/**
 * @param {string} relativePath
 * @return {string}
 * @private
 */
Linter.prototype.convertRelativeToAbsolutePath_ = function(relativePath) {
  return _path.normalize(__dirname + '/' + relativePath);
};






new Linter();
