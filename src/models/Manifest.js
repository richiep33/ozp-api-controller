/* jshint -W097 */
/* jshint node:true */

"use strict";

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

module.exports = Manifest;