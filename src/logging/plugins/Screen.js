/* jshint -W097 */
/* jshint node:true */

"use strict";

var clc = require('cli-color');
var moment = require('moment');
var underscore = require('underscore')._;

/**
 * Screen logging implementation. Formats and emits all
 * consumed log events to the console (with color).
 *
 * @constructor
 */
var Screen = function() {
    this._msgType = {
        failure: clc.red, // red
        warning: clc.xterm(178).bgXterm(0), // orange
        info: clc.blue, // blue
        request: clc.yellow, // magenta
        success: clc.green // green
    };
};

/**
 * Consumes a Log model object to output.
 *
 * @api     public
 * @param   {Log} log Populated Log model object
 */
Screen.prototype.consume = function(log) {
    if (!log) {
        return;
    }
    this._produce(log.get(), log.id());
};

/**
 * Producers output through console.log.
 *
 * @api private
 * @param  {Object} eventObject         Object containing logging-specific information about the event
 * @param  {Object} eventObject.type    Type of event being logged
 * @param  {Object} eventObject.dtg     Date/Time group as as JavaScript Date
 * @param  {Object} eventObject.module  JavaScript class being executed
 * @param  {Object} eventObject.method  JavaScript function being executed
 * @param  {Object} eventObject.action  Generic description of the action
 * @param  {Object} eventObject.msg     Specific message to be logged
 * @param  {Number} id                  ID of generated log
 */
Screen.prototype._produce = function(eventObject, id) {
    // Check message types to ensure they are correct.
    if (!underscore.contains(this._msgType, eventObject.type)) {
        // Default to informational.
        eventObject.type = 'info';
    }

    // Reference the event DTG as a Moment object.
    var momentdtg = moment(eventObject.dtg);
    console.log(
        this._msgType[eventObject.type]('[' + eventObject.type.substr(0, 1) + ']') +
        ' [' + id + ']' +
        ' [' + clc.yellow(eventObject.user) + ']' +
        ' at ' + clc.cyan(this._formatDate(eventObject.dtg)) +
        ' -- ' + clc.yellow(eventObject.module + '::' + eventObject.method + '()') +
        ' -- ' + clc.blue(eventObject.action) + ' --> ' + eventObject.msg
    );
};

/**
 * Formats the date using Moment.js
 *
 * @param  {Date}   date JavaScript Date() object
 * @return {String}      Moment-formatted date/time string
 */
Screen.prototype._formatDate = function(date) {
    var momentDate = moment(date);
    return momentDate.format('YYYYMMDD HH:mm:ss SSS');
};

// Module export.
module.exports = Screen;