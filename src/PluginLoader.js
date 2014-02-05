/* jshint -W097 */
/* jshint node:true */

"use strict";

var events = require('events');
var express = require('express');
var watchr = require('watchr');
var fs = require('fs');

var PluginLoader = function(middleware, pluginOptions, apiOptions) {
    // We want to watch the plugins by default.
    this.watch = pluginOptions.watch || true;

    // Assign a watcher placeholder.
    this.watcher = null;

    // Although this shouldn't happen, ensure we can read the folder property.
    if (!pluginOptions.folder) {
        this.emit('log', {
            user: 'system',
            dtg: new Date(),
            module: 'PluginLoader',
            method: 'constructor',
            action: 'Initialization',
            msg: 'Could not find API plugin folder ' + pluginOptions.folder,
            type: 'failure'
        });
        return;
    }

    // Assign context root.
    this.contextRoot = apiOptions.serviceRoot || '/ozone';

    // Assign the plugin folder.
    this.pluginLocation = pluginOptions.folder;

    // Alias Express middleware.
    this.api = middleware;

    // Assign internal event handlers.
    this.on('load', this.readPluginLocation);
    this.on('load', this.assignFilesystemWatcher);
    this.on('read', this.assignPluginRoutes);
    this.on('create', this.createPluginInstance);

    // Assign EventEmitter to plugin loader.
    events.EventEmitter.call(this);
};

// Extend the plugin loader from EventEmitter.
PluginLoader.prototype = events.EventEmitter.prototype;

PluginLoader.prototype.readPluginLocation = function(pluginLocation) {
    fs.readdir(pluginLocation, this.parsePluginLocation.bind(this));
};

PluginLoader.prototype.assignFilesystemWatcher = function(pluginLocation) {
    // Not watching? Peace!
    if (!this.watch) return;

    // Otherwise, assign the watcher against the plugin location.
    this.watcher = watchr;
    this.watcher.watch({
        path: pluginLocation,
        listeners: {
            change: this.dispatchPluginChange.bind(this)
        }
    });

    // Assign Chokidar watcher event handlers, dispatch to internal events.
    /*this.watcher.on('addDir', this.dispatchPluginAdd);
    this.watcher.on('add', this.dispatchPluginChange);
    this.watcher.on('change', this.dispatchPluginChange);
    this.watcher.on('unlink', this.dispatchPluginRemove);*/
};

PluginLoader.prototype.dispatchPluginChange = function(type, path) {
    console.log('change: ' + type + ' at ' + path);
};

PluginLoader.prototype.assignPluginRoutes = function(pluginFolders, pluginLocation) {
    // Define some global parameters to keep up with number of plugins vs. created.
    this.numberOfPlugins = pluginFolders.length;
    this.createdPlugins = 0;

    // Log info about plugins after scanning.
    this.emit('log', {
        user: 'system',
        dtg: new Date(),
        module: 'PluginLoader',
        method: 'assignPluginRoutes',
        action: 'Loading API Plugins',
        msg: 'Found ' + this.numberOfPlugins + ' plugins',
        type: 'info'
    });

    // Scan through the folders and asynchronously instanciate plugins.
    var folderIter = 0;
    for (folderIter; folderIter < pluginFolders.length; folderIter++) {
        this.emit('create', pluginLocation, this.contextRoot);
    }
};

PluginLoader.prototype.createPluginInstance = function(location, context) {};

PluginLoader.prototype.parsePluginLocation = function(error, files) {
    var pluginFolders = [],
        fileIter = 0;
    // Scan through all the file system entries.
    for (fileIter; fileIter < files.length; fileIter++) {
        var file = files[fileIter];
        // If it matches OZP or AML syntax, valid plugin.
        if (file.match(/^ozp-.*/) || file.match(/^aml-.*/)) pluginFolders.push(file);
    }
    this.emit('read', pluginFolders, this.pluginFolder);
};

// Export the plugin loader.
module.exports = PluginLoader;