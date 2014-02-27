/* jshint -W097 */
/* jshint node:true */

"use strict";

var fs = require('fs');
var events = require('events');
var underscore = require('underscore')._;

var Log = require('../models/Log');

/**
 * Logger mechanism for OZONE RESTful controller.
 *
 * @constructor
 * @param {Object} configuration Configuration object
 */
var Logger = function(configuration) {
    // Log event cache.
    this._logs = [];

    // Total log events.
    this._total = 0;

    // When was the 'logs per second' metric started?
    this._started = new Date();

    // Plugin implementations.
    this._plugins = {};

    // Scan filesystem for list of available plugins.
    this._availablePlugins = this._scanLoggerPlugins();

    // Activate the prototype.
    events.EventEmitter.call(this);

    // No configuration was supplied, default to screen logger.
    if (!configuration) {
        this.activatePlugin('screen');
    }
    // Otherwise apply the configuration to the instance.
    else {
        this.apply(configuration);
    }
};

// Assign the prototype from the EventEmitter.
Logger.prototype = events.EventEmitter.prototype;

/**
 * Scans the file system for a list of available plugins.
 *
 * @api private
 * @return {Array} A list of plugins from the file system
 */
Logger.prototype._scanLoggerPlugins = function() {
    // Read the list from the file system.
    var folderListing = fs.readdirSync(__dirname + '/plugins/');

    // Clean up the names for simplicity.
    for (var file = 0; file < folderListing.length; file++) {
        var plugin = folderListing[file];
        plugin = plugin.replace('.js', '');
        plugin = plugin.toLowerCase();
        folderListing[file] = plugin;
    }

    // Return the results.
    return folderListing;
};

/**
 * Returns a count of the logs present.
 *
 * @api public
 * @return {Array} List of log entries
 */
Logger.prototype.count = function() {
    return this._logs.length;
};

/**
 * Gives the total number of logs processed.
 *
 * @api public
 * @return {Number} Total number of log events
 */
Logger.prototype.total = function() {
    return this._total;
};

Logger.prototype.add = function(eventObject, callback) {
    // Create the log object.
    var log = new Log(eventObject);

    // FIFO queue of 100 log events.
    if (this._logs.length === 100) {
        this._logs.shift();
    }

    // Add the log event.
    this._logs.push(log);

    // Increment the total log count.
    this._total++;

    var plugins = underscore.keys(this._plugins);
    for (var plugin = 0; plugin < plugins.length; plugin++) {
        var pluginName = plugins[plugin];
        this._plugins[pluginName].consume(log);
    }

    // Return the results.
    this.emit('add', log.id());
    if (callback) {
        callback(log.id());
    }
};

Logger.prototype.clear = function() {
    this._logs = [];
};

Logger.prototype.resetTotal = function() {
    this._total = 0;
    this._started = new Date();
};

Logger.prototype.plugins = function() {
    return underscore.keys(this._plugins);
};

Logger.prototype.availablePlugins = function() {
    return this._availablePlugins;
};

Logger.prototype.activatePlugin = function(plugin) {
    // The JavaScript plugin file, complete.
    var pluginFile = plugin.charAt(0).toUpperCase() + plugin.slice(1) + '.js';

    var Implementation = require(__dirname + '/plugins/' + pluginFile);
    var instance = new Implementation();

    this._plugins[plugin] = instance;
};

Logger.prototype.deactivatePlugin = function(plugin) {
    if (plugin) {
        delete this._plugins[plugin];
    } else {
        this._plugins = {};
    }
};

Logger.prototype.findWhere = function(type, value, callback) {
    var iter = 0,
        results = [];
    for (iter; iter < this._logs.length; iter++) {
        if (this._logs[iter].getBy(type) === value) {
            results.push(this._logs[iter]);
        }
    }
    if (callback) {
        callback(results);
    }
    this.emit('find', results);
    return results;
};

Logger.prototype.get = function() {
    return this._logs;
};

Logger.prototype.logsPerSecond = function() {
    var secondsRunning = (new Date() - this._started) * 1000;
    return (this._total / secondsRunning);
};

module.exports = Logger;