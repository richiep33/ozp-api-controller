/* jshint -W097 */
/* jshint node:true */

"use strict";

var ParameterDefinition = require('./ParameterDefinition'),
    underscore = require('underscore')._;

var Manifest = function(manifest) {
    this._fullManifest = {};
    if (manifest) {
        this._fullManifest = manifest;
        this._parseManifest();
    }
};

Manifest.prototype._parseManifest = function() {
    this._isRequired = this._fullManifest.informational.required || false;
    this._plugin = this._fullManifest.informational.plugin || 'unknown';
    this._name = this._fullManifest.informational.name || 'Unknown';
    this._description = this._fullManifest.informational.description || 'Unknown';
    this._route = this._fullManifest.route.uri;
    this._resources = this._fullManifest.resources;

};

Manifest.prototype.get = function() {
    return this._fullManifest;
};

Manifest.prototype.load = function(path) {
    try {
        // Load the manifest.
        var manifest = require(path);
        this._fullManifest = manifest;
        this._parseManifest();
    } catch (exception) {

    }
};

Manifest.prototype.required = function() {
    return this._isRequired;
};

Manifest.prototype.plugin = function() {
    return this._plugin;
};

Manifest.prototype.name = function() {
    return this._name;
};

Manifest.prototype.description = function() {
    return this._description;
};

Manifest.prototype.route = function() {
    return this._route;
};

/**
 * Get a list of resources from the manifest.
 * 
 * @return {Array}      the list of resources specified by the manifest
 */
Manifest.prototype.resources = function(){
    return this._resources;
};

module.exports = Manifest;