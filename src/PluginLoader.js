/* jshint -W097 */
/* jshint node:true */

"use strict";

var events = require('events');
var express = require('express');
var watchr = require('watchr');
var fs = require('fs');

/**
 * Loads API plugins from the filesystem, and monitors for changes
 * to maximize uptime of the service.
 *
 * @constructor
 * @param {Function} middleware    Express middleware client
 * @param {Object}   pluginOptions Configuration options specific to the plugins
 * @param {Object}   apiOptions    Configuration options specific to the API
 * @param {Function} requestFn     Request processing function
 */
var PluginLoader = function(middleware, pluginOptions, apiOptions, requestFn) {
    // Assign the request processing function.
    this.requestFn = requestFn;

    // We want to watch the plugins by default.
    this.watch = pluginOptions.watch || true;

    // Assign a watcher placeholder.
    this.watcher = null;

    // Assign storage for plugins.
    this.plugins = {};

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
    this.middleware = middleware;

    // Assign internal event handlers.
    this.on('load', this.readPluginLocation);
    this.on('load', this.assignFilesystemWatcher);
    this.on('read', this.assignPlugins);
    this.on('manifest', this.loadPluginManifest);
    this.on('resources', this.processServiceResources);
    this.on('route', this.assignRoute);
    this.on('save', this.savePlugin);
    this.on('update', this.updatePluginLoader);
    this.on('increment', this.incrementPluginCount);
    this.on('decrement', this.decrementPluginTotal);

    // Assign EventEmitter to plugin loader.
    events.EventEmitter.call(this);
};

// Extend the plugin loader from EventEmitter.
PluginLoader.prototype = events.EventEmitter.prototype;

/**
 * Reads the folders present in the API plugin folder.
 *
 * @param  {String} pluginLocation Location of API plugins on filesystem
 */
PluginLoader.prototype.readPluginLocation = function(pluginLocation) {
    fs.readdir(pluginLocation, this.parsePluginLocation.bind(this));
};

/**
 * Increments the number of created plugins.
 *
 * @event update
 */
PluginLoader.prototype.incrementPluginCount = function() {
    this.createdPlugins++;
    this.emit('update');
};

/**
 * Decrements the number of created plugins.
 *
 * @event update
 */
PluginLoader.prototype.decrementPluginTotal = function() {
    this.numberOfPlugins--;
    this.emit('update');
};

/**
 * Polls the number of created plugins versus the number present and capable.
 *
 * @event log
 * @event ready
 */
PluginLoader.prototype.updatePluginLoader = function() {
    // Have we settled on the number of plugins available and working?
    if (this.createdPlugins == this.numberOfPlugins) {
        this.emit('log', {
            user: 'system',
            dtg: new Date(),
            module: 'PluginLoader',
            method: 'updatePluginLoader',
            action: 'Polling Plugin Creation Status',
            msg: 'Created ' + this.createdPlugins + ' plugins',
            type: 'success'
        });
        this.emit('ready');
    }
};

/**
 * Assigns a filesystem watcher to the plugin folder.
 *
 * @event change
 * @param  {String} pluginLocation Location of the plugin folder.
 */
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

    // @TODO Assign Chokidar watcher event handlers, dispatch to internal events.
    /*this.watcher.on('addDir', this.dispatchPluginAdd);
    this.watcher.on('add', this.dispatchPluginChange);
    this.watcher.on('change', this.dispatchPluginChange);
    this.watcher.on('unlink', this.dispatchPluginRemove);*/
};

/**
 * Dispatches a Watchr filesystem change event to the EventEmitter events.
 *
 * @param  {String} type Type of change event
 * @param  {String} path Path of the file/folder that chagned
 */
PluginLoader.prototype.dispatchPluginChange = function(type, path) {
    // @TODO Dispatch Watchr events to proper PluginLoader functions and upate.
};

/**
 * Assigns plugins to Express middleware and logs number of created.
 *
 * @event log
 * @event create
 * @param  {Array}  pluginFolders  An array of plugins from the filesystem
 * @param  {String} pluginLocation The path to the API plugins
 */
PluginLoader.prototype.assignPlugins = function(pluginFolders, pluginLocation) {
    // Define some global parameters to keep up with number of plugins vs. created.
    this.numberOfPlugins = pluginFolders.length;
    this.createdPlugins = 0;

    // Log info about plugins after scanning.
    this.emit('log', {
        user: 'system',
        dtg: new Date(),
        module: 'PluginLoader',
        method: 'assignPlugins',
        action: 'Assigning API Plugins',
        msg: 'Found ' + this.numberOfPlugins + ' plugins',
        type: 'info'
    });

    // Scan through the folders and asynchronously instanciate plugins.
    var folderIter = 0;
    for (folderIter; folderIter < pluginFolders.length; folderIter++) {
        this.emit('manifest', pluginFolders[folderIter], pluginLocation, this.contextRoot);
    }
};

/**
 * Loads the manifest for each plugin.
 *
 * @event log
 * @param  {String} plugin   Parsed plugin folder
 * @param  {String} location Folder containing all of the plugins
 * @param  {String} context  RESTful URI context root
 */
PluginLoader.prototype.loadPluginManifest = function(plugin, location, context) {
    var resourceIter, methodsIter;
    // Load the plugin manifest, create the RESTful route and instanciate.
    try {
        // Load the manifest.
        var manifest = require(location + '/' + plugin + '/manifest.json');

        // Determine the service URI.
        var serviceUri = context + manifest.route.uri;

        // Log info about plugins after scanning.
        this.emit('log', {
            user: 'system',
            dtg: new Date(),
            module: 'PluginLoader',
            method: 'loadPluginManifest',
            action: 'Loading Plugin Manifest',
            msg: 'Found manifest at ' + location,
            type: 'info'
        });

        // Dispatch the manifest for resource building.
        this.emit('resources', plugin, manifest, serviceUri);
    }
    // Something happened. Plugin cannot be loaded.
    catch (exception) {
        this.emit('log', {
            user: 'system',
            dtg: new Date(),
            module: 'PluginLoader',
            method: 'loadPluginManifest',
            action: 'Creating API Plugin',
            msg: 'Could not load plugin ' + plugin,
            exception: exception,
            type: 'failure'
        });

        // Plugin is bad, remove from total.
        this.emit('decrement');
    }
};

/**
 * Processes the resources directly from the manifest
 *
 * @event log
 * @event route
 * @event increment
 * @event decrement
 * @param  {Object} manifest   Plugin manifest object
 * @param  {String} serviceUri URI of the service
 */
PluginLoader.prototype.processServiceResources = function(plugin, manifest, serviceUri) {
    // Process each service resource.
    try {
        var resourceIter = 0,
            methodIter = 0,
            routeUri;

        // Dynamically build all service routes by HTTP method.
        for (resourceIter; resourceIter < manifest.resources.length; resourceIter++) {

            // Attach the version from the API plugin manifest.
            routeUri = 'v' + manifest.resources[resourceIter].version + '/';

            // Build the base resource URI.
            routeUri += manifest.resources[resourceIter].route + '/';

            // Alias HTTP methods for API plugin.
            var httpMethods = manifest.resources[resourceIter].httpMethods;

            // Alias the implementation file.
            var implementation = manifest.resources[resourceIter].implementation;

            this.emit('log', {
                user: 'system',
                dtg: new Date(),
                module: 'PluginLoader',
                method: 'processServiceResources',
                action: 'Assigning Service HTTP Methods',
                msg: 'Processing ' + serviceUri + routeUri,
                type: 'success'
            });

            // Assign all routes to the middleware.
            for (methodIter; methodIter < httpMethods.length; methodIter++) {
                this.emit('route', {
                    plugin: plugin,
                    method: httpMethods[methodIter],
                    uri: serviceUri + routeUri,
                    requestFn: this.requestFn,
                    location: this.pluginLocation,
                    implementation: implementation,
                    middleware: this.middleware
                });
            }

            // Plugin is good, increment number created.
            this.emit('increment');
        }
    }
    // Problem accessing the service's resource in the manifest.
    catch (exception) {
        this.emit('log', {
            user: 'system',
            dtg: new Date(),
            module: 'PluginLoader',
            method: 'processServiceResources',
            action: 'Creating API Plugin',
            msg: 'Could not load plugin ' + plugin,
            exception: exception,
            type: 'failure'
        });

        // Plugin is bad, remove from total.
        this.emit('decrement');
    }
};

/**
 * Assigns the route to the plugin method.
 *
 * @event log
 * @event save
 * @event decrement
 * @param {Object}   routeObject                Object containing route information
 * @param {String}   routeObject.plugin         Name of the plugin
 * @param {Object}   routeObject.method         Method object containing HTTP method and API function
 * @param {String}   routeObject.uri            Route URI
 * @param {Function} routeObject.requestFn      Controller request handler
 * @param {String}   routeObject.location       Location of the plugin folder
 * @param {String}   routeObject.implementation Filename of the API implementation
 * @param {Function} routeObject.middleware     Express middleware
 */
PluginLoader.prototype.assignRoute = function(routeObject) {
    try {
        // Concatenate the API file path.
        var apiFilePath = routeObject.location + '/' +
            routeObject.plugin + '/api/' + routeObject.implementation;

        // Instanciate the API plugin.
        var Api = require(apiFilePath);
        var instance = new Api();

        // Assign the function.
        var methodFn = routeObject.method['function'];

        // Alias the HTTP method.
        var httpMethod = routeObject.method.httpMethod.toLowerCase();

        // Save the plugin's information for request processing.
        this.emit('save', {
            plugin: routeObject.plugin,
            api: instance,
            method: routeObject.method.httpMethod,
            apiFn: routeObject.method['function']
        });

        // Assign the route and handler to the Express middleware.
        routeObject.middleware[httpMethod](routeObject.uri, routeObject.requestFn);

        // Log route assignment.
        this.emit('log', {
            user: 'system',
            dtg: new Date(),
            module: 'PluginLoader',
            method: 'assignRoute',
            action: 'Assigning Route and API Handler',
            msg: 'Assigned route ' + routeObject.uri +
                ' to ' + routeObject.implementation + '::' +
                routeObject.method['function'] + '()',
            type: 'success'
        });
    }
    // Unable to assign the route and handler.
    catch (exception) {
        this.emit('log', {
            user: 'system',
            dtg: new Date(),
            module: 'PluginLoader',
            method: 'assignRoute',
            action: 'Assigning Route and API Handler',
            msg: 'Could not assign route for ' + routeObject.plugin,
            exception: exception,
            type: 'failure'
        });

        // Plugin is bad, remove from total.
        this.emit('decrement');
    }
};

/**
 * Saves the plugin instance and HTTP method accessor.
 *
 * @event log
 * @param {Object}   pluginObject        Object containing plugin information
 * @param {String}   pluginObject.plugin Name of the plugin
 * @param {Function} pluginObject.api    Plugin API instance
 * @param {String}   pluginObject.method HTTP method
 * @param {String}   pluginObject.apiFn  Name of the plugin API handler
 */
PluginLoader.prototype.savePlugin = function(pluginObject) {
    // Alias the plugin name.
    var plugin = pluginObject.plugin;

    // Has this plugin been persisted?
    if (!this.plugins[plugin]) {
        var saved = {
            api: pluginObject.api
        };
        saved[pluginObject.method] = pluginObject.apiFn;
        this.plugins[plugin] = saved;
    }
    // Otherwise just save the assigned HTTP method function from the API.
    else {
        this.plugins[plugin][pluginObject.method] = pluginObject.apiFn;
    }

    // Log persistence.
    this.emit('log', {
        user: 'system',
        dtg: new Date(),
        module: 'PluginLoader',
        method: 'savePlugin',
        action: 'Persisting API Plugin',
        msg: 'Persisted API plugin ' + plugin + ' for ' + pluginObject.method,
        type: 'success'
    });
};

/**
 * Parses the output from the filesystem to match plugin folders
 *
 * @event read
 * @param  {Object} error NodeJS error object
 * @param  {Array}  files Array of file/folder names from the filesystem.
 */
PluginLoader.prototype.parsePluginLocation = function(error, files) {
    var pluginFolders = [],
        fileIter = 0;
    // Scan through all the file system entries.
    for (fileIter; fileIter < files.length; fileIter++) {
        var file = files[fileIter];
        // If it matches OZP or AML syntax, valid plugin.
        if (file.match(/^ozp-.*/) || file.match(/^aml-.*/)) pluginFolders.push(file);
    }
    // Send the list of parsed plugins for creation.
    this.emit('read', pluginFolders, this.pluginLocation);
};

// Export the plugin loader.
module.exports = PluginLoader;