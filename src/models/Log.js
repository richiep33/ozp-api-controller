/* jshint -W097 */
/* jshint node:true */

"use strict";

var cuid = require('cuid');
var underscore = require('underscore')._;
var mandatory = ['type', 'user', 'dtg', 'module', 'method', 'action', 'msg'];

var Log = function(eventObject) {
    // Iterate through all of the wanted properties.
    var mandatoryIter = 0;
    for (mandatoryIter; mandatoryIter < mandatory.length; mandatoryIter++) {
        var key = mandatory[mandatoryIter];
        if (eventObject.hasOwnProperty(key)) {
            this['_' + key] = eventObject[key];
        }
    }

    // Exceptions are sometimes passed. We want to keep those.
    if (eventObject.hasOwnProperty('exception')) {
        this._exception = eventObject.exception;
    }

    // Generate an id.
    this._id = cuid();
};

Log.prototype.id = function() {
    return this._id;
};

Log.prototype.get = function() {
    return {
        type: this._type,
        user: this._user,
        dtg: this._dtg,
        module: this._module,
        method: this._method,
        action: this._action,
        msg: this._msg
    };
};

Log.prototype.getBy = function(key) {
    if (underscore.contains(mandatory, key)) {
        return this['_' + key];
    } else {
        return undefined;
    }
};



Log.prototype.exception = function() {
    var flag = (this._exception) ? true : false;
    return flag;
};

module.exports = Log;