#!/usr/bin/env node

/**
 * @author Alexander Samilyak (aleksam241@gmail.com)
 * Created: 2015.04.23
 *
 * This script is running Google Closure Compiler in ADVANCED mode
 * against js source files.
 * Compilation result is thrown away (output is redirected to /dev/null),
 * so it's only for catching compile time errors.
 *
 * The script is dependant on plovr.jar (Closure Compiler wrapper).
 * See https://github.com/bolinfest/plovr for more information.
 *
 * This script is intended to run in a command line.
 *
 * Usage: ./compile.js [path-to-plovr.jar]
 * [path-to-plovr.jar] defaults to "<HOME_CATALOG>/bin/plovr.jar.
 * If path-to-plovr.jar is relative, it's treated relatively to a catalog
 * containing this script.
 *
 * A path to plovr config file is defined in Compiler.PLOVR_CONFIG_PATH constant
 */


var
    _path = require('path'),
    _fs = require('fs'),
    _util = require('util'),
    _child_process = require('child_process');



var Compiler = function() {
  if (_fs.existsSync(this.getJarPath_())) {
    this.run_();

  } else {
    this.exitWithJarAccessError_();
  }
};


/**
 * @const
 * @type {string}
 */
Compiler.PLOVR_CONFIG_PATH = './compile-config.json';

/**
 * @const
 * @type {string}
 */
Compiler.PLOVR_JAR_DEFAULT_PATH = '~/bin/plovr.jar';


/**
 * @private
 */
Compiler.prototype.run_ = function() {
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
 * @param {Error} error
 * @param {Buffer} stdout
 * @param {Buffer} stderr
 * @private
 */
Compiler.prototype.processExecResult_ = function(error, stdout, stderr) {
  process.stdout.write(stdout);
  process.stderr.write(stderr);

  if (error === null) {
    this.printBuildResult_(true);
  } else {
    this.printBuildResult_(false);
    process.exit(error.code);
  }
};


/**
 * @return {string}
 * @private
 */
Compiler.prototype.getCommand_ = function() {
  /** @type {string} */
  var command = _util.format(
      'java -jar "%s" build "%s"',
      this.getJarPath_(),
      this.convertRelativeToAbsolutePath_(Compiler.PLOVR_CONFIG_PATH));

  return command;
};


/**
 * @return {string}
 * @private
 */
Compiler.prototype.getJarPath_ = function() {
  /** @type {string} */
  var path;

  /** @type {string} */
  var argPath = process.argv[2];

  if (argPath) {
    if (this.isPathAbsolute_(argPath)) {
      path = argPath;
    } else {
      path = this.convertRelativeToAbsolutePath_(argPath);
    }

  } else {
    path = this.convertRelativeToAbsolutePath_(Compiler.PLOVR_JAR_DEFAULT_PATH);
  }

  return _path.normalize(path);
};


/**
 * @param {string} relativePath
 * @return {string}
 * @private
 */
Compiler.prototype.convertRelativeToAbsolutePath_ = function(relativePath) {
  if (relativePath.indexOf('~') === 0) {
    return relativePath.replace('~', this.getHomeCatalogPath_());

  } else {
    return _path.normalize(__dirname + '/' + relativePath);
  }
};


/**
 * @return {string}
 * @private
 */
Compiler.prototype.getHomeCatalogPath_ = function() {
  /** @type {string} */
  var homeCatalogEnvVar;
  if (process.platform === 'win32') {
    homeCatalogEnvVar = 'USERPROFILE';
  } else {
    homeCatalogEnvVar = 'HOME';
  }

  /** @type {string} */
  var homePath = process.env[homeCatalogEnvVar];

  if (homePath) {
    return homePath;
  } else {
    return '~';
  }
};


/**
 * @param {string} path
 * @return {boolean}
 * @private
 */
Compiler.prototype.isPathAbsolute_ = function(path) {
  /** @type {string} */
  var normalPath = _path.normalize(path);

  return (normalPath === _path.resolve(normalPath));
};


/**
 * @private
 */
Compiler.prototype.exitWithJarAccessError_ = function() {
  this.printJarAccessError_();
  this.printUsageInfo_();
  this.printBuildResult_(false);
  process.exit(1);
};


/**
 * @param {boolean} success
 * @private
 */
Compiler.prototype.printBuildResult_ = function(success) {
  /** @type {string} */
  var result = (success ? 'COMPILATION SUCCESS' : 'COMPILATION FAILURE');

  process.stderr.write('\n');
  process.stderr.write(
      '------------------------------------\n' +
      result + '\n' +
      '------------------------------------\n');
};


/**
 * @private
 */
Compiler.prototype.printJarAccessError_ = function() {
  /** @type {string} */
  var error = _util.format(
      'Error: Unable to access plovr jar file %s\n\n',
      this.getJarPath_());

  process.stderr.write(error);
};


/**
 * @private
 */
Compiler.prototype.printUsageInfo_ = function() {
  process.stderr.write(
      'Usage: ./compiler.js [path-to-plovr.jar]\n' +
      '[path-to-plovr.jar] defaults to "<HOME_CATALOG>/bin/plovr.jar"\n' +
      'You can download the latest version of plovr from ' +
          'https://github.com/bolinfest/plovr/releases\n');
};




new Compiler();
