/* jshint -W097 */
/* jshint node:true */

"use strict";

var events = require('events');
var express = require('express');

var PluginLoader = function(middleware, pluginPath) {
    // Assign EventEmitter to plugin loader.
    events.EventEmitter.call(this);
};

// Extend the plugin loader from EventEmitter.
PluginLoader.prototype.__proto__ = events.EventEmitter.prototype;