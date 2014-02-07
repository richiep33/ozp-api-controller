/* jshint -W097 */
/* jshint node:true */

"use strict";

var events = require('events');
var express = require('express');
var clc = require('cli-color');
var moment = require('moment');
var underscore = require('underscore')._;

// OZONE-specific dependencies.
var PluginLoader = require('./src/PluginLoader');
var ParameterHelper = require('./src/ParameterHelper');

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

    // Express application server.
    this.app = require('express')();

    // Timing store for requests.
    this.timing = {};

    // Placeholder for created HTTP or HTTPS web server.
    this.webServer = null;

    // Placeholder for plugin loader;
    this.pluginLoader = null;

    // Assign EventEmitter to API Controller.
    events.EventEmitter.call(this);

    // Load reserved parameters.
    this.reserved = require(__dirname + '/config/reserved.json');

    // Assign master event handlers.
    this.on('created', this.loadConfiguration);
    this.on('log', this.queueLogEntry);
    this.on('httpoptions', this.configureServer);
    this.on('plugins', this.configurePluginLoader);
    this.on('start', this.startWebServer);
    //this.on('secure', this.enableSecurityInterface);
    //this.on('format', this.formatResponse);
    this.on('install', this.startInstaller);
    this.on('parameters', this.parseRequestParameters);
    this.on('starttiming', this.startTiming);
    this.on('endtiming', this.endTiming);
    this.on('api', this.executeApiHandler);

    // Controller was created, start initialization.
    this.emit('created', configurationPath);
};

// Extend the API Controller from EventEmitter.
OzonePlatformApiController.prototype = events.EventEmitter.prototype;

/**
 * Attempts to load the APi controller configuration from the file system.
 *
 * @event log
 * @event httpoptions
 * @event install
 * @param {String} configurationPath Path to the configuration file
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
 * @event log
 * @event install
 * @event plugins
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

        // Request body parsing via Express.
        this.app.use(express.bodyParser());

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

/**
 * Event handler for PluginLoader upon completion.
 *
 * @event log
 * @event start
 */
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

/**
 * Executes the plugin API handler specific to the route.
 *
 * @event log
 * @event starttiming
 * @event endtiming
 * @event reserved
 * @param  {Object} paramObj            Object containing parsed parameters
 * @param  {Object} paramObj.reserved   Object containing reserved parameters
 * @param  {Object} paramObj.parameters Object containing request-specified parameters
 * @param  {Object} request             Express request object
 * @param  {Object} response            Express response object
 */
OzonePlatformApiController.prototype.executeApiHandler = function(paramObj, request, response) {
    // Retrieve the plugin based on the request route.
    var plugin = this.pluginLoader.get(request._parsedUrl.pathname);

    // Determine the HTTP method.
    var method = request.route.method.toUpperCase();

    // Determine the API function to be called.
    var apiFn = plugin[method];

    // Stop timing pre-API request functions.
    this.emit('endtiming', 'request-pre-api', request.cookies['connect.sid']);

    // Start timing API call.
    this.emit('starttiming', 'request-api', request.cookies['connect.sid']);

    // Collect the response from the plugin. Submits a wrapping function for parameters.
    var responseObj = plugin.api[apiFn](new ParameterHelper(paramObj.parameters));

    // Log the execution of the plugin API.
    this.emit('log', {
        user: 'system',
        dtg: new Date(),
        module: 'OzonePlatformApiController',
        method: 'executeApiHandler',
        action: 'Run Plugin API',
        msg: 'Ran plugin \'' + plugin.plugin + '::' + apiFn + '()\'',
        type: 'success'
    });

    // Stop timing API call.
    this.emit('endtiming', 'request-api', request.cookies['connect.sid']);

    // Start timing post-API request functions.
    this.emit('starttiming', 'request-post-api', request.cookies['connect.sid']);

    // Check for reserved parameter object injection.
    this.emit('reserved', paramObj, responseObj, request, response);
};

/**
 * Configures the PluginLoader module and executes.
 *
 * @event log
 * @event ready
 * @event load
 * @param {Object} middleware              Express middleware
 * @param {Array}  pluginOptions           An array of available plugins
 * @param {Object} apiOptions              API configuration options
 * @param {String} apiOptions.serviceRoot  RESTful API context root
 */
OzonePlatformApiController.prototype.configurePluginLoader = function(middleware, pluginOptions, apiOptions) {
    // Create the plugin loader and configure at instanciation.
    this.pluginLoader = new PluginLoader(
        middleware,
        pluginOptions,
        apiOptions,
        this.processIncomingRequest.bind(this)
    );

    // Assign plugin loader event handlers.
    this.pluginLoader.on('log', this.queueLogEntry);

    this.pluginLoader.on('ready', this.pluginsLoaded.bind(this));

    // Tell plugin loader to start loading external API plugins..
    this.pluginLoader.emit('load', pluginOptions.folder);

    // @TODO Tell plugin loader to load the integrated security plugin.

    // @TODO Tell plugin loader to load the integrated configuration plugin.
};

/**
 * Assigns the NodeJS web server based on SSL.
 *
 * @event log
 * @param  {Boolean} useSSL Flag defining use of SSL
 * @return {Function}       NodeJS HTTP/HTTPS server
 */
OzonePlatformApiController.prototype.assignWebServer = function(useSSL) {
    var server = useSSL ? require('https') : require('http');
    return server;
};

/**
 * Starts the web server based on configuration.
 *
 * @event log
 * @param {Object} configObject             Configuration object
 * @param {String} configObject.protocol    HTTP protocol
 * @param {Object} configObject.sslOptions  Options specific to SSL configuration
 * @param {String} configObject.middleware  Express middleware
 */
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

/**
 * Processes an incoming HTTP request as callback from Express.
 *
 * @event log
 * @event starttiming
 * @event parameters
 * @param  {Object} request  Express request object
 * @param  {Object} response Express response object
 */
OzonePlatformApiController.prototype.processIncomingRequest = function(request, response) {
    if (request.cookies['connect.sid'] === undefined) response.send(403, {
        failure: 'no session'
    });

    // Start the timing for the request and API .
    this.emit('starttiming', 'request-pre-api', request.cookies['connect.sid']);

    // Log the request.
    this.emit('log', {
        user: 'system',
        dtg: new Date(),
        module: 'OzonePlatformApiController',
        method: 'processIncomingRequest',
        action: 'RESTful Service Request',
        msg: 'Request to ' + request.url,
        type: 'request'
    });

    // Parse the parameters from the service call.
    this.emit('parameters', {
        params: request.params,
        body: request.body,
        query: request.query
    }, request, response);
    response.send('');
};

/**
 * Parses the collective set of parameters from the HTTP request.
 *
 * @event log
 * @event api
 * @event stoptiming
 * @param  {[type]} parameterObject [description]
 * @param  {Object} request  Express request object
 * @param  {Object} response Express response object
 */
OzonePlatformApiController.prototype.parseRequestParameters = function(parameterObject, request, response) {
    var parameters = [],
        reserved = [],
        aggregation = {};

    // Merge the parameter sets from Express.
    underscore.extend(aggregation, parameterObject.params, parameterObject.body, parameterObject.query);

    // Check each key in the parameter set.
    var parameterKeys = underscore.keys(aggregation),
        parameter, value, paramIter = 0;
    for (paramIter; paramIter < parameterKeys.length; paramIter++) {
        // Alias the parameter key.
        parameter = parameterKeys[paramIter];

        // Did we find a parameter that is reserved?
        if (underscore.has(this.reserved, parameter)) {
            // Yes we did. Need to deconflict multiple values.
            var reservedObj;
            if (typeof parameters[parameter] === 'object') {
                reservedObj = {
                    key: parameter,
                    op: '=',
                    value: this.deconflictValues(this.reserved[parameter], aggregation[parameter])
                };
            }
            // Nope. Single value assignment.
            else {
                reservedObj = {
                    key: parameter,
                    op: '=',
                    value: aggregation[parameter]
                };
            }
            reserved.push(reservedObj);
        }
        // Nope. Let's dereference multiple values and check operators, though.
        else {
            var obj;
            // URI parameters are generally defined only with '=' operator. In order
            // to compensate for ranges or numeric comparison operators ('<', '>', etc),
            // we need to strip the key and search for the operator. The parameters
            // passed only come as a key ('test>2'='').
            if (parameter.match(/(^.*)([<|>|<=|>=])(.*)/)) {
                var parameterTokens = parameter.match(/(^.*)([<|>|<=|>=])(.*)/);
                obj = {
                    key: parameterTokens[1],
                    op: parameterTokens[2],
                    value: parameterTokens[3]
                };
            }
            // Assignment operator ('=').
            else {
                obj = {
                    key: parameter,
                    op: '=',
                    value: aggregation[parameter]
                };
            }
            parameters.push(obj);
        }
    }

    // Log parameter parsing results..
    this.emit('log', {
        user: 'system',
        dtg: new Date(),
        module: 'OzonePlatformApiController',
        method: 'parseRequestParameters',
        action: 'Parameter Parsing',
        msg: 'Parsed ' + reserved.length + ' reserved parameter(s) and ' + parameters.length + ' parameter(s)',
        type: 'info'
    });

    // Trigger the plugin API call.
    this.emit('api', {
        parameters: {
            reserved: reserved,
            parameters: parameters,
        }
    }, request, response);
};

/**
 * Deconflicts multiple values against default value.
 *
 * @param  {Object} reservedParameter Reserved parameter object
 * @param  {Array}  suppliedValues    List of supplied parameter values
 * @return {String}                   Deconflicted value
 */
OzonePlatformApiController.prototype.deconflictValues = function(reservedParameter, suppliedValues) {
    // Set to the supplied reserved parameter default value.
    var value = reservedParameter.defaultValue;

    var valueIter = 0;
    // Check each supplied value to see if it differs from the default.
    for (valueIter; valueIter < suppliedValues.length; valueIter++) {
        if (suppliedValues[valueIter] !== reservedParameter.defaultValue.toString()) {
            value = suppliedValues[valueIter];
        }
    }

    // Return deconflicted value;
    return value;
};

/**
 * Starts timing for a given action based on session.
 *
 * @event log
 * @param  {String} action    Timing action; ex. 'processing', or 'api'
 * @param  {String} sessionId Request session ID.
 */
OzonePlatformApiController.prototype.startTiming = function(action, sessionId) {
    // Ensure that the timing session exists, or create it.
    this.timing[sessionId] = this.timing[sessionId] || {};
    this.timing[sessionId][action] = this.timing[sessionId][action] || {};

    // Assign the start date to the session and action.
    this.timing[sessionId][action].start = new Date();

    // Log the timing has started.
    this.emit('log', {
        user: 'system',
        dtg: new Date(),
        module: 'OzonePlatformApiController',
        method: 'startTiming',
        action: 'Timing',
        msg: 'Timing has been started for \'' + action + '\'',
        type: 'info'
    });
};

/**
 * Ends timing for a given action based on session. Also
 * calculates the total time required for the action.
 *
 * @event log
 * @param  {String} action    Timing action; ex. 'processing', or 'api'
 * @param  {String} sessionId Request session ID.
 */
OzonePlatformApiController.prototype.endTiming = function(action, sessionId) {
    // Ensure that the timing session exists, or create it.
    this.timing[sessionId] = this.timing[sessionId] || {};
    this.timing[sessionId][action] = this.timing[sessionId][action] || {};

    // Assign the end date to the session and action.
    this.timing[sessionId][action].end = new Date();

    // Determine total time spend
    this.timing[sessionId][action].total = this.timing[sessionId][action].end - this.timing[sessionId][action].start;

    // Log the timing has started.
    this.emit('log', {
        user: 'system',
        dtg: new Date(),
        module: 'OzonePlatformApiController',
        method: 'startTiming',
        action: 'Timing',
        msg: 'Timing has ended for \'' + action + '\' [' + this.timing[sessionId][action].total + ' ms]',
        type: 'info'
    });
};

/**
 * A callback for NodeJS HTTP(S) server when created. Logs event success.
 *
 * @event log
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
 * @param  {Object}  serverConfiguration                 Server configuration object
 * @param  {Boolean} serverConfiguration.useSSL          SSL-enabled flag
 * @param  {Number}  serverConfiguration.securePort      HTTPS port
 * @param  {Number}  serverConfiguration.insecurePort    HTTP port
 * @param  {String}  serverConfiguration.sslPrivateKey   SSL private key location
 * @param  {String}  serverConfiguration.sslCertificate  SSL server certification location
 * @return {Number}                                      Port the Express web server will run on
 */
OzonePlatformApiController.prototype.definePort = function(serverConfiguration) {
    // Define server port based on SSL configuration.
    var port = serverConfiguration.useSSL ? serverConfiguration.securePort : serverConfiguration.insecurePort;
    return port;
};

/**
 * Returns SSL keys if supplied from the configuration.
 *
 * @param  {Object}  serverConfiguration                 Server configuration object
 * @param  {Boolean} serverConfiguration.useSSL          SSL-enabled flag
 * @param  {Number}  serverConfiguration.securePort      HTTPS port
 * @param  {Number}  serverConfiguration.insecurePort    HTTP port
 * @param  {String}  serverConfiguration.sslPrivateKey   SSL private key location
 * @param  {String}  serverConfiguration.sslCertificate  SSL server certification location
 * @return {Object}                                      Options specific to SSL
 */
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
 * @param  {Object} eventObject         Object containing logging-specific information about the event
 * @param  {Object} eventObject.type    Type of event being logged
 * @param  {Object} eventObject.dtg     Date/Time group as as JavaScript Date
 * @param  {Object} eventObject.module  JavaScript class being executed
 * @param  {Object} eventObject.method  JavaScript function being executed
 * @param  {Object} eventObject.action  Generic description of the action
 * @param  {Object} eventObject.msg     Specific message to be logged
 */
OzonePlatformApiController.prototype.queueLogEntry = function(eventObject) {
    var msgType = {
        failure: clc.red, // red
        warning: clc.xterm(178).bgXterm(0), // orange
        info: clc.blue, // blue
        request: clc.yellow, // magenta
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


OzonePlatformApiController.prototype.startInstaller = function() {};

// Create a new API instance.
var api = new OzonePlatformApiController();