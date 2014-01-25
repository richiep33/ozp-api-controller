/**
 * OZONE Platform API Controller
 *
 * Used as a master service controller for OZONE services.
 *
 * @constructor
 */
OzonePlatformApiController = function () {
    var express = require('express'),
        server, port, options = {},
        clc = require('cli-color'),
        clear = require('clear');

    this.options = {};

    // Create the Express application and bootstrap web server.
    this.app = express();
    this.configPath = __dirname + '/config/config.json';

    // Flush the console.
    clear();

    // Load SSL configuration settings from './config'
    this.config = require(this.configPath);
    if (!this.config) {
        this.generateAuditEntry(
            'OzonePlatformApiController',
            'constructor',
            'Configuration file loaded',
            'Failure',
            'error'
        );
    }
    else {
        this.generateAuditEntry(
            'OzonePlatformApiController',
            'constructor',
            'Configuration file loaded',
            'Success',
            'success'
        );
    }

    // Based on SSL option, define the NodeJS web server to instanciate.
    this.server = this.config['server']['useSSL'] ? require('https') : require('http');

    // Define server port based on SSL configuration.
    this.port = this.config['server']['useSSL'] ?
        this.config['server']['securePort'] :
        this.config['server']['insecurePort'];

    // Define the port for the Express app.
    this.app.set('port', this.port);

    // Define protocol (Plaintext or SSL/TLS)
    this.protocol = this.config['server']['useSSL'] ? 'HTTPS' : 'HTTP';

    // Log HTTP(S) server type.
    this.generateAuditEntry(
        'OzonePlatformApiController',
        'constructor',
        'Web server configured',
         this.protocol + ' :' + this.port,
        'status'
    );

    // Attempt to define SSL options (if applicable).
    if (this.config['server']['useSSL']) {
        try {
            this.options['key'] = this.config['server']['sslPrivateKey'];
            this.options['cert'] = this.config['server']['sslCertificate'];
        }
        catch (exception) {
          console.log(exception);
            // Log configuration failure.
            this.generateAuditEntry(
                'OzonePlatformApiController',
                'constructor',
                'Web server configuration options',
                'Failure to parse SSL options',
                'error'
            );
        }
    }

    // Log RESTful API context root.
    this.generateAuditEntry(
        'OzonePlatformApiController',
        'constructor',
        'RESTful API Context Root',
        this.config['api']['serviceRoot'],
        'info'
    );

    // Load API plugins from file system and assign routes.
    this.plugins = this.loadApiPlugins(this.config['apiPlugins']['folder']);

    // Scope-bound status callback for async server creation.
    var statusCallback = function () {
        // Log Express web server.
        this.generateAuditEntry(
            'OzonePlatformApiController',
            'constructor',
            'Express ' + this.protocol + ' server',
            'Listening on port ' + this.port,
            'success'
        );
    };

    // Create the web server based on protocol.
    try {
        if (this.protocol === 'HTTPS') {
            this.server.createServer(this.options, this.app).listen(this.app.get('port'), statusCallback.apply(this));
        }
        else {
            this.server.createServer(this.app).listen(this.app.get('port'), statusCallback.apply(this));
        }
    }
    catch (exception) {
        this.generateAuditEntry(
            'OzonePlatformApiController',
            'constructor',
            'Express ' + this.protocol + ' server started',
            'Unable to start ' + this.protocol + ' server: ' + exception,
            'error'
        );
    }

};

/**
 * Gets API Controller configuration
 *
 * @return {Object} Configuration JSON object
 */
OzonePlatformApiController.prototype.getConfig = function () {
    return this.config;
};

/**
 * Gets API controller port mapping.
 *
 * @return {Number} HTTP server port
 */
OzonePlatformApiController.prototype.getPort = function () {
    return this.port;
};

/**
 * Gets API controller protocol.
 *
 * @return {String} HTTP protocol in use
 */
OzonePlatformApiController.prototype.getProtocol = function () {
    return this.protocol;
};

/**
 * Intercepts Express middleware callback to inject custom
 * parameter scraping, timing, and other relevant functions
 * before passing back off to service API plugin code.
 *
 * @param  {Function} apiFn     API plugin handler
 * @param  {Function} expressFn Express request/response callback
 */
OzonePlatformApiController.prototype.middlewareIntercept = function (apiFn, expressFn) {
    return function () {
        var body = 'Hello World';
        var request = arguments[0]; var response = arguments[1];

        response.setHeader('Content-Type', 'text/plain');
        response.setHeader('Content-Length', Buffer.byteLength(body));
        response.end(body);
    }
};

/**
 * Loads RESTful API services as plugins from file system.
 *
 * @param  {String} location Location of API plugins
 * @return {[type]}          [description]
 */
OzonePlatformApiController.prototype.loadApiPlugins = function (location) {
    var fs = require('fs');

    // Load all dynamic service endpoints from configured location.
    var plugins = fs.readdirSync(location), pluginIter, resourceIter, methodsIter;
    this.generateAuditEntry(
        'OzonePlatformApiController',
        'loadApiPlugins',
        'Loading ' + plugins.length + ' RESTful API service plugin(s)',
        location,
        'status'
    );

    // Run through all of the plugins detected on disk.
    for (pluginIter = 0; pluginIter < plugins.length; pluginIter++) {
        var plugin;
        try {
            // Retrieve path from API plugin folder and inject.
            var pluginUri = this.config['apiPlugins']['folder'] + '/' + plugins[pluginIter] + '/manifest.json';
            plugin = require(pluginUri);

            this.generateAuditEntry(
                'OzonePlatformApiController',
                'loadApiPlugins',
                'Loaded plugin',
                plugins[pluginIter],
                'success'
            );

            // Concatenate the service URI from the root with plugin context.
            var serviceUri = this.config['api']['serviceRoot'] + plugin['route']['uri'];

            this.generateAuditEntry(
                'OzonePlatformApiController',
                'loadApiPlugins',
                'Associating API route',
                this.config['api']['serviceRoot'] + plugin['route']['uri'] + ' => \'' + plugin['informational']['name'] + '\'',
                'info'
            );

            for (resourceIter = 0; resourceIter < plugin['resources'].length; resourceIter++) {
                // Attach the version from the API plugin manifest.
                serviceUri += 'v' + plugin['resources'][resourceIter]['version'] + '/';

                // Build the base service URI.
                serviceUri += plugin['resources'][resourceIter]['route'] + '/';

                // Alias HTTP methods for API plugin.
                var httpMethods = plugin['resources'][resourceIter]['httpMethods'];

                // Assign each HTTP method an API function and route.
                for (methodsIter = 0; methodsIter < httpMethods.length; methodsIter++) {
                    // Alias the RESTful method and API function.
                    var method = httpMethods[methodsIter]['httpMethod'];
                    var fn = httpMethods[methodsIter]['function'];

                    // Bind the HTTP method to the service URI and attach API fn.
                    this.app[method.toLowerCase()](serviceUri, this.middlewareIntercept(fn, function (request, response) {}));

                    this.generateAuditEntry(
                        'OzonePlatformApiController',
                        'loadApiPlugins',
                        'Associating URI',
                        serviceUri + ' [' + method + '] => ' + plugin['resources'][resourceIter]['implementation'] + '::' + fn + '()',
                        'info'
                    );
                }
            }
        }
        catch (exception) {
            this.generateAuditEntry(
                'OzonePlatformApiController',
                'loadApiPlugins',
                'Not able to instanciate plugin',
                plugins[pluginIter] + ' (' + exception + ')',
                'error'
            );
        }
    }
};

/**
 * Generates an audit entry and displays in console.
 *
 * @param  {String} fnName     Module name making the entry
 * @param  {String} method     Function name calling the audit routine
 * @param  {[type]} msg        Message to audit
 * @param  {[type]} status     Status from the event
 * @param  {[type]} statusType Type of status
 */
OzonePlatformApiController.prototype.generateAuditEntry = function (fnName, method, msg, status, statusType) {
    var clc = require('cli-color');
    var msgType = {
        error: clc.red,                       // red
        warning: clc.xterm(178).bgXterm(0),   // orange
        info: clc.blue,                       // blue
        status: clc.magenta,                  // magenta
        success: clc.green                    // green
    };

    console.log(
        clc.yellow(fnName) +
        '::' +
        clc.cyan(method + '()') +
        ' -> ' +
        clc.yellow(msg) +
        ' : ' +
        msgType[statusType](status)
    );
};

var api = new OzonePlatformApiController();