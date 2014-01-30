'use strict';

/**
 * OZONE Platform API Controller
 *
 * Used as a master service controller for OZONE services.
 *
 * @constructor
 */
var OzonePlatformApiController = function () {
    var express = require('express'), server, port, options = {};

    // Define options and plugins tracking for scope.
    this.options = {}; this.plugins = {};
    this.nodePlugins = {
        os: require('os'),
        fs: require('fs'),
        clc: require('cli-color'),
        clear: require('clear'),
        underscore: require('underscore')._,
        js2xmlparser: require('js2xmlparser'),
        handlebars: require('handlebars')
    };

    // Reserved parameter keywords parsed by master REST function.
    this.reservedParameters = {
        'performance': {
            type: 'boolean',
            defaultValue: false
        },
        'format': {
            type: 'string',
            defaultValue: 'json'
        },
        'system': {
            type: 'boolean',
            defaultValue: false
        },
        'request': {
            type: 'boolean',
            defaultValue: false
        }
    };

    // Create the Express application and bootstrap web server.
    this.app = express();
    this.configPath = __dirname + '/config/config.json';

    // Flush the console.
    this.nodePlugins.clear();

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
    this.server = this.config.server.useSSL ? require('https') : require('http');

    // Configure static server content serving.
    this.app.use(express.static(__dirname + '/public'));

    // User agent parsing.
    var useragent = require('express-useragent');
    this.app.use(useragent.express());

    // Apply compression to static content.
    this.app.use(express.compress());

    // Define server port based on SSL configuration.
    this.port = this.config.server.useSSL ?
        this.config.server.securePort :
        this.config.server.insecurePort;

    // Define the port for the Express app.
    this.app.set('port', this.port);

    // Define protocol (Plaintext or SSL/TLS)
    this.protocol = this.config.server.useSSL ? 'HTTPS' : 'HTTP';

    // Log HTTP(S) server type.
    this.generateAuditEntry(
        'OzonePlatformApiController',
        'constructor',
        'Web server configured',
        this.protocol + ' :' + this.port,
        'status'
    );

    // Attempt to define SSL options (if applicable).
    if (this.config.server.useSSL) {
        try {
            this.options.key = this.config.server.sslPrivateKey;
            this.options.cert = this.config.server.sslCertificate;
        }
        catch (exception) {
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
        this.config.api.serviceRoot,
        'info'
    );

    // Load API plugins from file system and assign routes.
    this.plugins = this.loadApiPlugins(this.config.apiPlugins.folder);

    // Scope-bound status callback for async server creation.
    var statusCallback = function() {
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
            this.server.createServer(
                this.options,
                this.app
            ).listen(
                this.app.get('port'),
                statusCallback.apply(this)
            );
        } else {
            this.server.createServer(this.app).listen(
                this.app.get('port'),
                statusCallback.apply(this)
            );
        }
    }
    // Unable to start the Express web server.
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
OzonePlatformApiController.prototype.getConfig = function() {
    return this.config;
};

/**
 * Gets API controller port mapping.
 *
 * @return {Number} HTTP server port
 */
OzonePlatformApiController.prototype.getPort = function() {
    return this.port;
};

/**
 * Gets API controller protocol.
 *
 * @return {String} HTTP protocol in use
 */
OzonePlatformApiController.prototype.getProtocol = function() {
    return this.protocol;
};

/**
 * Loads RESTful API services as plugins from file system.
 *
 * @param  {String} location Location of API plugins
 * @return {[type]}          [description]
 */
OzonePlatformApiController.prototype.loadApiPlugins = function(location) {
    // Load all dynamic service endpoints from configured location.
    var plugins = this.nodePlugins.fs.readdirSync(location),
        pluginIter, resourceIter, methodsIter;
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
            var pluginUri = this.config.apiPlugins.folder + '/' + plugins[pluginIter] + '/manifest.json';
            var plugin = require(pluginUri);

            this.generateAuditEntry(
                'OzonePlatformApiController',
                'loadApiPlugins',
                'Loaded plugin',
                plugins[pluginIter],
                'success'
            );

            // Store the plugin manifest for retrieval and OPTIONS enumeration.
            var pluginId = plugin.informational.plugin;
            this.plugins[pluginId] = plugin;

            this.generateAuditEntry(
                'OzonePlatformApiController',
                'loadApiPlugins',
                'Stored plugin metadata',
                pluginId,
                'success'
            );

            // Concatenate the service URI from the root with plugin context.
            var serviceUri = this.config.api.serviceRoot + plugin.route.uri;

            this.generateAuditEntry(
                'OzonePlatformApiController',
                'loadApiPlugins',
                'Associating API route',
                this.config.api.serviceRoot + plugin.route.uri + ' => \'' + plugin.informational.name + '\'',
                'info'
            );

            // Dynamically build all service routes by HTTP method.
            for (resourceIter = 0; resourceIter < plugin.resources.length; resourceIter++) {
                // Attach the version from the API plugin manifest.
                serviceUri += 'v' + plugin.resources[resourceIter].version + '/';

                // Build the base service URI.
                serviceUri += plugin.resources[resourceIter].route + '/';

                // Alias HTTP methods for API plugin.
                var httpMethods = plugin.resources[resourceIter].httpMethods;

                // Assign each HTTP method an API function and route.
                for (methodsIter = 0; methodsIter < httpMethods.length; methodsIter++) {
                    // Alias the RESTful method and API function.
                    var method = httpMethods[methodsIter].httpMethod;

                    var apiPath = this.config.apiPlugins.folder + '/' +
                        plugins[pluginIter] + '/api/' + plugin.resources[resourceIter].implementation;

                    var Implementation = require(apiPath);
                    var instance = new Implementation();

                    var fn = httpMethods[methodsIter]['function'];

                    var scope = {
                        controller: this,
                        apiFn: instance[fn],
                        metadata: this.plugins[pluginId]
                    };

                    // Bind the HTTP method to the service URI and attach API fn.
                    this.app[method.toLowerCase()](
                        serviceUri,
                        this.nodePlugins.underscore.bind(this.generateResponse, scope)
                    );

                    // Log the service URI attachment.
                    this.generateAuditEntry(
                        'OzonePlatformApiController',
                        'loadApiPlugins',
                        'Associating URI',
                        serviceUri + ' [' + method + '] => ' + plugin.resources[resourceIter].implementation + '::' + fn + '()',
                        'info'
                    );
                }
            }

            // Attach OPTIONS enumeration method to base service URI.
            var scope = {
                controller: this,
                apiFn: instance[fn],
                metadata: this.plugins[pluginId]
            };
            var serviceContext = this.config.api.serviceRoot + plugin.route.uri;
            this.app.options(
                serviceContext,
                this.nodePlugins.underscore.bind(this.enumerateServiceParameters, scope)
            );
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
OzonePlatformApiController.prototype.generateAuditEntry = function(fnName, method, msg, status, statusType) {
    var msgType = {
        error: this.nodePlugins.clc.red,                      // red
        warning: this.nodePlugins.clc.xterm(178).bgXterm(0),  // orange
        info: this.nodePlugins.clc.blue,                      // blue
        status: this.nodePlugins.clc.magenta,                 // magenta
        success: this.nodePlugins.clc.green                   // green
    };

    console.log(
        this.nodePlugins.clc.yellow(fnName) +
        '::' +
        this.nodePlugins.clc.cyan(method + '()') +
        ' -> ' +
        this.nodePlugins.clc.yellow(msg) +
        ' : ' +
        msgType[statusType](status)
    );
};

/**
 * Enumerates the manifest from the API plugin to return via an OPTIONS call.
 *
 * @return {[type]} [description]
 */
OzonePlatformApiController.prototype.enumerateServiceParameters = function() {
    //console.log(this.metadata);
};

OzonePlatformApiController.prototype.generateResponse = function(request, response) {
    var reservedParameters = {}, queryParameters = [], globalParameters = [], parameter;
    // Start the timing routine.
    var requestStarted = new Date();

    // Parse request parameters
    for (parameter in request.query) {
        // Was a reserved parameter found in the request?
        if (this.controller.reservedParameters.hasOwnProperty(parameter)) {
            // Clone the parameter configuration.
            var resObj = {};
            resObj[parameter] = request.query[parameter];
            globalParameters.push(resObj);
            reservedParameters[parameter] = this.controller.reservedParameters[parameter];

            // Assign the supplied parameter value.
            reservedParameters[parameter].value = request.query[parameter];
        }
        // If not, bin it to send to the API handler.
        else {
            var newObj = {};
            newObj[parameter] = request.query[parameter];
            queryParameters.push(newObj);
        }
    }

    // Execute the API service handler.
    var apiResponse = this.apiFn(queryParameters);

    // Stop the timing routine.
    var requestEnded = new Date();

    // Base response object with API plugin results.
    var responseObject = {
        httpCode: apiResponse.httpCode,
        url: request.url,
        total: apiResponse.results.length,
        results: apiResponse.results
    };

    // Must always check format, even if not present.
    reservedParameters.format = reservedParameters.format || this.controller.reservedParameters.format;

    // Reserved 'performance' parameter check.
    if (reservedParameters.request) {
        if (reservedParameters.request.value === 'true') {
            responseObject = this.controller.nodePlugins.underscore.extend(responseObject, {
                request: {
                    viaAjax: request.xhr,
                    os: request.useragent.OS,
                    platform: request.useragent.Platform,
                    browser: request.useragent.Browser,
                    browserVersion: request.useragent.Version,
                    ipAddress: request.ip,
                    ssl: request.secure,
                    apiParameters: queryParameters,
                    globalParameters: globalParameters
                }
            });
        }
    }

    // Reserved 'performance' parameter check.
    if (reservedParameters.performance) {
        if (reservedParameters.performance.value === 'true') {
            responseObject = this.controller.nodePlugins.underscore.extend(responseObject, {
                performance: {
                    requestTimeSeconds: (requestEnded - requestStarted) / 1000,
                    requestStarted: requestStarted,
                    requestEnded: requestEnded
                }
            });
        }
    }

    // Reserved 'system' parameter check.
    if (reservedParameters.system) {
        if (reservedParameters.system.value === 'true') {
            responseObject = this.controller.nodePlugins.underscore.extend(responseObject, {
                system: {
                    proc: this.controller.nodePlugins.os.cpus().length,
                    server: this.controller.nodePlugins.os.hostname(),
                    load: this.controller.nodePlugins.os.loadavg()[0],
                    freeMem: (this.controller.nodePlugins.os.freemem() / 1000000).toFixed(2)
                }
            });
        }
    }

    this.controller.metadata = this.metadata;

    // Determine content type from 'format=*' parameter and format.
    // Defaults to JSON in the event of an unrecognized type.
    var formattedResponse;

    switch (reservedParameters.format.value) {
        case ('json'):
            response.set('Content-Type', 'application/json');
            var producer = this.controller.nodePlugins.underscore.bind(
                this.controller.jsonProducer,
                this.controller
            );
            formattedResponse = producer(responseObject);
            break;
        case ('xml'):
            response.set('Content-Type', 'text/xml');
            var producer = this.controller.nodePlugins.underscore.bind(
                this.controller.xmlProducer,
                this.controller
            );
            formattedResponse = producer(responseObject);
            break;
        case ('html'):
            response.set('Content-Type', 'text/html');
            var producer = this.controller.nodePlugins.underscore.bind(
                this.controller.htmlProducer,
                this.controller
            );
            formattedResponse = producer(responseObject);
            break;
        case ('csv'):
            response.set('Content-Type', 'text/csv');
            response.set('Content-Disposition', 'attachment;filename=ozone-services-request.csv');
            var producer = this.controller.nodePlugins.underscore.bind(
                this.controller.csvProducer,
                this.controller
            );
            formattedResponse = producer(responseObject);
            break;
        default:
            response.set('Content-Type', 'application/json');
            var producer = this.controller.nodePlugins.underscore.bind(
                this.controller.jsonProducer,
                this.controller
            );
            formattedResponse = producer(responseObject);
            break;
    }

    // Send the response back to the client.
    response.send(apiResponse.httpCode, formattedResponse);

    // Remove the by-reference value.
    delete reservedParameters.format.value;

    // Log the REST request to the log.
    console.log(
        this.controller.nodePlugins.clc.blue('RESTful API request') +
        ' -> ' +
        this.controller.nodePlugins.clc.magenta(request.url) +
        ' [' + this.controller.nodePlugins.clc.green(apiResponse.httpCode) + ']' +
        ' -> ' +
        this.controller.nodePlugins.clc.blue(apiResponse.results.length + ' records, ' + Buffer.byteLength(apiResponse.results.toString()) + ' bytes')
    );
};

/**
 * Emits response object as a CSV concatenated string.
 *
 * @param  {Object} json Original JSON response object
 * @return {Array}       CSV-formatted and concatenated string from results set only
 */
OzonePlatformApiController.prototype.csvProducer = function(json) {
    var recordIter, rows = [], headers = {};
    for (recordIter = 0; recordIter < json.results.length; recordIter++) {
        var row = [];
        var keys = this.nodePlugins.underscore.keys(json.results[recordIter]);
        for (var keyIter = 0; keyIter < keys.length; keyIter++) {
            var key = keys[keyIter];
            headers[key] = true;
            row.push(json.results[recordIter][key]);
        }
        rows.push(row.join(','));
    }
    var csv = this.nodePlugins.underscore.keys(headers).join(',') + '\n' + rows.join('\n');
    return csv;
};

/**
 * Emits response object as an XML schema.
 *
 * @param  {Object} json Original JSON response object
 * @return {String}      XML-formatted response schema
 */
OzonePlatformApiController.prototype.xmlProducer = function(json) {
    return this.nodePlugins.js2xmlparser('response', json);
};

/**
 * Emits response object as an HTML document.
 *
 * @param  {Object} json Original JSON response object
 * @return {String}      Formatted HTML document
 */
OzonePlatformApiController.prototype.htmlProducer = function(json) {
    // Define variables and alias the needed plugins.
    var html = [], handlebars = this.nodePlugins.handlebars,
        fs = this.nodePlugins.fs, underscore = this.nodePlugins.underscore;

    // Load the HTML response view template.
    var view = fs.readFileSync('./views/response.html', {encoding: 'utf-8'});

    // Register the partial handlers for compilation.
    handlebars.registerPartial('performance', fs.readFileSync('./partials/performance.partial', {encoding: 'utf-8'}));
    handlebars.registerPartial('system', fs.readFileSync('./partials/system.partial', {encoding: 'utf-8'}));
    handlebars.registerPartial('request', fs.readFileSync('./partials/request.partial', {encoding: 'utf-8'}));

    handlebars.registerHelper('datatable', this.dataTableTemplateHelper);

    var htmlTemplate = handlebars.compile(view);
    return htmlTemplate({
        response: json,
        info: {
            name: this.metadata.informational.name,
            desc: this.metadata.informational.description
        }
    });
};

/**
 * Emits response object as a JSON object.
 *
 * @param  {Object} json Original JSON response object
 * @return {[type]}      Echoed JSON response object
 */
OzonePlatformApiController.prototype.jsonProducer = function(json) {
    return json;
};

/**
 * [dataTableTemplateHelper description]
 * @param  {[type]} items   [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
OzonePlatformApiController.prototype.dataTableTemplateHelper = function (items, options) {
    // Default Bootstrap classes for table.
    var out = '<table class="table table-striped table-hover table-bordered">';

    // Generate the table headers.
    out += '<tr>';
    var keys = underscore.keys(items[0]);
    for (var keyIter = 0; keyIter < keys.length; keyIter++) {
        out += '<th>' + keys[keyIter] + '</th>'
    }
    out += '</tr>';

    // Strip out the values and insert into rows.
    for (var i = 0, l = items.length; i < l; i++) {
        out += '<tr>';
        for (keyIter = 0; keyIter < keys.length; keyIter++) {
            var key = keys[keyIter];
            out += '<td>' + items[i][key] + '</td>'
        }
        out += '</tr>';
    }

    // Terminate table.
    out += '</table>';
    return out;
};

var api = new OzonePlatformApiController();
