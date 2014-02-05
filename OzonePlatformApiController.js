/* jshint -W097 */
/* jshint node:true */

"use strict";

var events = require('events');
var express = require('express');
var clc = require('cli-color');
var moment = require('moment');

// OZONE-specific dependencies.
var PluginLoader = require('./src/PluginLoader');

/**
 * OZONE Platform API Controller
 *
 * Used as a master service controller for OZONE services.
 *
 * @constructor
 */
var OzonePlatformApiController = function() {
    // Set default configuration path.
    var configurationPath = __dirname + '/config/config.json';

    // Plugin information.
    this.plugins = {};

    // Express application server.
    this.app = require('express')();

    // Placeholder for created HTTP or HTTPS web server.
    this.webServer = null;

    // Placeholder for plugin loader;
    this.pluginLoader = null;

    // Assign EventEmitter to API Controller.
    events.EventEmitter.call(this);

    // Assign master event handlers.
    this.on('created', this.loadConfiguration);
    this.on('log', this.queueLogEntry);
    this.on('httpoptions', this.configureServer);
    this.on('plugins', this.configurePluginLoader);
    this.on('start', this.startWebServer);
    //this.on('secure', this.enableSecurityInterface);
    //this.on('format', this.formatResponse);
    //this.on('parameters', this.parseParameters);
    //this.on('request', this.parseHttpRequest);
    this.on('install', this.startInstaller);

    // Controller was created, start initialization.
    this.emit('created', configurationPath);
};

// Extend the API Controller from EventEmitter.
OzonePlatformApiController.prototype = events.EventEmitter.prototype;

/**
 * Attempts to load the APi controller configuration from the file system.
 */
OzonePlatformApiController.prototype.loadConfiguration = function(configurationPath) {
    var configuration;
    // Configuration was at file system. Open and dispatch to config functions.
    try {
        configuration = require(configurationPath);
        this.emit('log', {
            user: 'system',
            dtg: new Date(),
            module: 'OzonePlatformApiController',
            method: 'loadConfiguration',
            action: 'Configuration',
            msg: 'Configuration file loaded from ' + configurationPath,
            type: 'success'
        });
        this.emit('httpoptions', configuration);
    }
    // Configuration was not present. Start the installer.
    catch (exception) {
        this.emit('install');
    }
};

/**
 * Configures server options for the API controller.
 *
 * @param  {Object} configuration JSON object with configuration options.
 */
OzonePlatformApiController.prototype.configureServer = function(configuration) {
    // Attempt to configure from file system.
    try {
        // Assign the web server instanciation (HTTP vs HTTPS).
        this.webServer = this.assignWebServer(configuration.server.useSSL);

        // Define service protocol.
        this.protocol = this.defineProtocol(configuration.server.useSSL);

        // Define service port.
        this.port = this.definePort(configuration.server);

        // Define the port for the Express app.
        this.app.set('port', this.port);

        // Remove the Express 'powered by' header.
        this.app.disable('x-powered-by');

        // Apply compression to static content.
        this.app.use(express.compress());

        // Configure static server content serving.
        this.app.use(express.static(__dirname + '/public'));

        // User agent parsing.
        var useragent = require('express-useragent');
        this.app.use(useragent.express());

        // Initialize the cookie session handler for Express.
        this.app.use(express.cookieParser(new Date().toString()));
        this.app.use(express.cookieSession());

        // Persist the SSL keys if SSL has been enabled.
        if (configuration.server.useSSL) {
            this.sslOptions = this.determineSSLKeys(configuration.server);
        }
    }
    // Something went wrong. Run the installer for clean configuration.
    catch (exception) {
        this.emit('log', {
            user: 'system',
            dtg: new Date(),
            module: 'OzonePlatformApiController',
            method: 'configureServer',
            action: 'Configuration',
            msg: 'Configuration file is malformed; running installer',
            exception: exception,
            type: 'failure'
        });
        this.emit('install');
    }

    // Fire event to load plugins.
    this.emit('plugins', this.app, configuration.plugins, configuration.api);
};

OzonePlatformApiController.prototype.pluginsLoaded = function() {
    // Log that we are finished with plugins.
    this.emit('log', {
        user: 'system',
        dtg: new Date(),
        module: 'OzonePlatformApiController',
        method: 'pluginsLoaded',
        action: 'Loaded All Plugins',
        msg: 'Plugins are loaded; server is being created',
        type: 'info'
    });

    // Start the web server.
    this.emit('start', {
        middleware: this.app,
        protocol: this.protocol,
        port: this.port,
        sslOptions: this.sslOptions
    });
};

OzonePlatformApiController.prototype.configurePluginLoader = function(middleware, pluginOptions, apiOptions) {
    // Create the plugin loader and configure at instanciation.
    this.pluginLoader = new PluginLoader(middleware, pluginOptions, apiOptions, this.processIncomingRequest.bind(this));

    // Assign plugin loader event handlers.
    this.pluginLoader.on('log', this.queueLogEntry);

    this.pluginLoader.on('ready', this.pluginsLoaded.bind(this));

    // Tell plugin loader to start loading external API plugins..
    this.pluginLoader.emit('load', pluginOptions.folder);

    // @TODO Tell plugin loader to load the integrated security plugin.

    // @TODO Tell plugin loader to load the integrated configuration plugin.
};

OzonePlatformApiController.prototype.assignWebServer = function(useSSL) {
    var server = useSSL ? require('https') : require('http');
    return server;
};

OzonePlatformApiController.prototype.startWebServer = function(configObject) {
    // Start up the NodeJS web server of appropriate type.
    try {
        // SSL is enabled. Create a NodeJS HTTPS server.
        if (configObject.protocol === 'HTTPS') {
            this.webServer.createServer(
                configObject.sslOptions,
                configObject.middleware
            ).listen(configObject.middleware.get('port'), this.createServerNotification.bind(this));
        }
        // SSL is not enabled. Create a NodeJS HTTP server.
        else {
            this.webServer.createServer(
                configObject.middleware
            ).listen(configObject.middleware.get('port'), this.createServerNotification.bind(this));
        }
    }
    //
    // Unable to create the web server. Log the event.
    catch (exception) {
        this.emit('log', {
            user: 'system',
            dtg: new Date(),
            module: 'OzonePlatformApiController',
            method: 'startWebServer',
            action: 'Create Web Server',
            msg: configObject.protocol + ' web server was not able to start',
            exception: exception,
            type: 'failure'
        });
    }
};

OzonePlatformApiController.prototype.processIncomingRequest = function(request, response) {
    // @TODO Parse request and execute API function.
};

/**
 * A callback for NodeJS HTTP(S) server when created. Logs event success.
 */
OzonePlatformApiController.prototype.createServerNotification = function() {
    this.emit('log', {
        user: 'system',
        dtg: new Date(),
        module: 'OzonePlatformApiController',
        method: 'startWebServer',
        action: 'Create Web Server',
        msg: this.protocol + ' server was started on :' + this.port,
        type: 'success'
    });
};

/**
 * Defines the HTTP protocol for the Express web server.
 *
 * @param  {String} protocol Type of protocol (HTTP/HTTPS)
 */
OzonePlatformApiController.prototype.defineProtocol = function(useSSL) {
    var protocol = useSSL ? 'HTTPS' : 'HTTP';
    return protocol;
};

/**
 * Defines the port the Express server runs on.
 *
 * @param  {Number} port Port the Express web server will run on
 */
OzonePlatformApiController.prototype.definePort = function(serverConfiguration) {
    // Define server port based on SSL configuration.
    var port = serverConfiguration.useSSL ? serverConfiguration.securePort : serverConfiguration.insecurePort;
    return port;
};

OzonePlatformApiController.prototype.determineSSLKeys = function(serverConfiguration) {
    var sslOptions = {
        key: serverConfiguration.sslPrivateKey,
        cert: serverConfiguration.sslCertificate
    };
    return sslOptions;
};

/**
 * Queues a log entry for processing in the Logger.
 *
 * @param  {Object} eventObject Object containing logging-specific information about the event
 */
OzonePlatformApiController.prototype.queueLogEntry = function(eventObject) {
    var msgType = {
        failure: clc.red, // red
        warning: clc.xterm(178).bgXterm(0), // orange
        info: clc.blue, // blue
        status: clc.magenta, // magenta
        success: clc.green // green
    };

    // Reference the event DTG as a Moment object.
    var momentdtg = moment(eventObject.dtg);

    // For now, send the log to the console. @TODO Pass these events off to the logger.
    console.log(
        msgType[eventObject.type]('[' + eventObject.type.substr(0, 1) + ']') +
        ' @ ' + clc.cyan(momentdtg.format('YYYYMMDDHHmmssSSS')) +
        ' -- ' + clc.yellow(eventObject.module + '::' + eventObject.method + '()') +
        ' -- ' + clc.blue(eventObject.action) + ' --> ' + eventObject.msg
    );
};


OzonePlatformApiController.prototype.startInstaller = function() {
    //this.emit('created');
};

// Create a new API instance.
var api = new OzonePlatformApiController();