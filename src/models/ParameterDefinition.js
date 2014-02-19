/* jshint -W097 */
/* jshint node:true */

"use strict";

var underscore = require('underscore')._;

var ParameterDefinition = function(paramObject) {
    var _baseAttributes = ['parameter', 'type', 'examples', 'operators', 'description', 'created', 'wildcard'];
    for (var property in paramObject) {
        if (underscore.contains(_baseAttributes, property)) {
            this['_' + property] = paramObject[property];
        }
    }

    this._required = {};
    var methodIter = 0;
    for (methodIter; methodIter < paramObject.required.length; methodIter++) {
        var requiredObject = paramObject.required[methodIter];
        this._required[requiredObject.method] = {
            required: requiredObject.isRequired,
            administrative: requiredObject.administrative
        };
    }
};

ParameterDefinition.prototype.parameter = function() {
    return this._parameter;
};

ParameterDefinition.prototype.type = function() {
    return this._type;
};

ParameterDefinition.prototype.operators = function() {
    return this._operators;
};

ParameterDefinition.prototype.description = function() {
    return this._description;
};

ParameterDefinition.prototype.examples = function() {
    return this._examples;
};

ParameterDefinition.prototype.wildcard = function() {
    return this._wildcard;
};

ParameterDefinition.prototype.methods = function() {
    return underscore.keys(this._required);
};

ParameterDefinition.prototype.required = function(method) {
    method = method.toUpperCase();
    return this._required[method].required;
};

ParameterDefinition.prototype.administrative = function(method) {
    method = method.toUpperCase();
    return this._required[method].administrative;
};

module.exports = ParameterDefinition;