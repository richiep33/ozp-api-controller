/* jshint -W097 */
/* jshint node:true */

"use strict";

/**
 * OZONE Platform API Controller
 *
 * Used as a master service controller for OZONE services.
 *
 * @constructor
 */
var OzonePlatformApiController = function() {
    var express = require('express'),
        server, port, options = {};

    // Define options and plugins tracking for scope.
    this.options = {};
    this.plugins = {};
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
        },
        'enumerate': {
            type: 'boolean',
            defaultValue: true
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
    } else {
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

    // Remove the Express 'powered by' header.
    this.app.disable('x-powered-by');

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
        } catch (exception) {
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

    // Instanciate the security interface.
    try {
        // Instanciate the security interface.
        this.security = require(__dirname + '/security/OzoneSecurity.js')({
            version: 1,
            type: 'userpass',
            implementation: 'security-userpass-v1.js',
            manifest: require(__dirname + '/security/manifest.json'),
            forceErrorRedirect: this.config.security.forceErrorRedirect || false
        });

        // Init the cookie session handler for Express.
        this.app.use(express.cookieParser(new Date().toString()));
        this.app.use(express.cookieSession());

        this.generateAuditEntry(
            'OzonePlatformApiController',
            'constructor',
            'OZONE Security Interface',
            'Started the security services',
            'success'
        );
    } catch (exception) {
        this.generateAuditEntry(
            'OzonePlatformApiController',
            'constructor',
            'OZONE Security Interface',
            'Unable to start the security services',
            'error'
        );
    }

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
            plugin = require(pluginUri);

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
        } catch (exception) {
            this.generateAuditEntry(
                'OzonePlatformApiController',
                'loadApiPlugins',
                'Not able to instanciate plugin',
                plugins[pluginIter],
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
        error: this.nodePlugins.clc.red, // red
        warning: this.nodePlugins.clc.xterm(178).bgXterm(0), // orange
        info: this.nodePlugins.clc.blue, // blue
        status: this.nodePlugins.clc.magenta, // magenta
        success: this.nodePlugins.clc.green // green
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
 * Generates the user's response object for HTTP transmission through Express middleware.
 *
 * @param  {Object} request  Express request object
 * @param  {Object} response Express response object
 */
OzonePlatformApiController.prototype.generateResponse = function(request, response) {
    var reservedParameters = {}, queryParameters = [],
        globalParameters = [],
        parameter, valueIter;
    var underscore = this.controller.nodePlugins.underscore;

    // Start the timing routine.
    var requestStarted = new Date();

    // Parse request parameters
    for (parameter in request.query) {
        // Was a reserved parameter found in the request?
        if (this.controller.reservedParameters.hasOwnProperty(parameter)) {
            // Clone the parameter configuration.
            var resObj = {};
            resObj[parameter] = request.query[parameter];

            // Parameter was passed multiple times. Express aggregates value to an array.
            if (typeof resObj[parameter] === 'object') {
                var value;
                for (valueIter = 0; valueIter < resObj[parameter].length; valueIter++) {
                    if (resObj[parameter][valueIter] != this.controller.reservedParameters[parameter].defaultValue.toString()) {
                        value = resObj[parameter][valueIter];
                    }
                }
                // Deconflict the value.
                resObj[parameter] = value || this.controller.reservedParameters[parameter].defaultValue;
            }

            // Push the sanitized global parameter.
            globalParameters.push(resObj);
            reservedParameters[parameter] = this.controller.reservedParameters[parameter];

            // Assign the supplied parameter value.
            reservedParameters[parameter].value = resObj[parameter];
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
        var requestMetadata = this.controller.injectRequestMetadata(reservedParameters.request, queryParameters, globalParameters, request);
        underscore.extend(responseObject, requestMetadata);
    }

    // Reserved 'performance' parameter check.
    if (reservedParameters.performance) {
        var performanceMetadata = this.controller.injectPerformanceMetadata(reservedParameters.performance, requestStarted, requestEnded);
        underscore.extend(responseObject, performanceMetadata);
    }

    // Reserved 'system' parameter check.
    if (reservedParameters.system) {
        var systemMetadata = this.controller.injectSystemMetadata(reservedParameters.system, this.controller.nodePlugins.os);
        underscore.extend(responseObject, systemMetadata);
    }

    if (reservedParameters.enumerate) {
        responseObject = this.controller.injectEnumerationMetadata(reservedParameters.enumerate, this.metadata, request);
    }

    this.controller.metadata = this.metadata;

    // Determine content type from 'format=*' parameter and format.
    // Defaults to JSON in the event of an unrecognized type.
    var formattedResponse, producer;

    switch (reservedParameters.format.value) {
        case ('json'):
            response.set('Content-Type', 'application/json');
            producer = this.controller.nodePlugins.underscore.bind(
                this.controller.jsonProducer,
                this.controller
            );
            formattedResponse = producer(responseObject);
            break;
        case ('xml'):
            response.set('Content-Type', 'text/xml');
            producer = this.controller.nodePlugins.underscore.bind(
                this.controller.xmlProducer,
                this.controller
            );
            formattedResponse = producer(responseObject);
            break;
        case ('html'):
            response.set('Content-Type', 'text/html');
            if (reservedParameters.enumerate) {
                if (reservedParameters.enumerate.value) {
                    producer = this.controller.nodePlugins.underscore.bind(
                        this.controller.htmlEnumerationProducer,
                        this.controller
                    );
                }
            } else {
                producer = this.controller.nodePlugins.underscore.bind(
                    this.controller.htmlProducer,
                    this.controller
                );
            }
            formattedResponse = producer(responseObject);
            break;
        case ('csv'):
            response.set('Content-Type', 'text/csv');
            response.set('Content-Disposition', 'attachment;filename=ozone-services-request.csv');
            producer = this.controller.nodePlugins.underscore.bind(
                this.controller.csvProducer,
                this.controller
            );
            formattedResponse = producer(responseObject);
            break;
        default:
            response.set('Content-Type', 'application/json');
            producer = this.controller.nodePlugins.underscore.bind(
                this.controller.jsonProducer,
                this.controller
            );
            formattedResponse = producer(responseObject);
            break;
    }

    // Was CORS defined for the service plugin? Attach header if so.
    if (this.metadata.route.hasOwnProperty('cors')) {
        if (this.metadata.route.cors.enable) {
            response.header('Access-Control-Allow-Origin', this.metadata.route.cors.whitelist);
            response.header('Access-Control-Allow-Headers', 'X-Requested-With');
            response.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
            response.header('Access-Control-Allow-Headers', 'Content-Type');
        }
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
 * Injects enumeration data for formatting to the response.
 *
 * @param  {Object} parameter Passed parameter
 * @param  {Object} metadata  Manifest-based configuration object for the service endpoint
 * @param  {Object} request   Express request object.
 * @return {Object}           Formatted enumeration object for rendering
 */
OzonePlatformApiController.prototype.injectEnumerationMetadata = function(parameter, metadata, request) {
    // Base information.
    var enumeration = {
        plugin: metadata.informational.plugin,
        name: metadata.informational.name,
        description: metadata.informational.description,
        headers: []
    };

    // Break out the headers available for the service.
    for (var header in metadata.route.options) {
        if (metadata.route.options[header].enable) {
            var newHeader = {};
            newHeader.header = header;
            newHeader.value = metadata.route.options[header].enable;
            enumeration.headers.push(newHeader);
        }
    }

    // Find the route and break into URI tokens.
    var route = request.route.path;
    var routeTokens = route.split('/');

    // Sanitize the route tokens.
    for (var i = 0; i < routeTokens.length; i++) {
        if (routeTokens[i] === '') {
            routeTokens.splice(i, 1);
        }
    }

    // Determine service and route via request.
    var service = routeTokens[routeTokens.length - 1];
    enumeration.route = route;
    enumeration.serviceName = service;

    // Determine the applicable resource from the route.
    var resource;
    for (var j = 0; j < metadata.resources.length; j++) {
        if (metadata.resources[j].route === service) {
            resource = metadata.resources[j];
        }
    }

    // Supply matching resource metadata from manifest.
    enumeration.resource = resource;

    // Return to template generator.
    return enumeration;
};

/**
 * Injects an object for HTTP request metadata.
 *
 * @param  {Object} parameter   URL parsed parameter information
 * @param  {Array}  query       An array of parsed query parameters
 * @param  {Array}  global      An array of parsed global parameters
 * @param  {Object} httpRequest Express callback-driven request function
 * @return {Object}             Request metadata information object
 */
OzonePlatformApiController.prototype.injectRequestMetadata = function(parameter, query, global, httpRequest) {
    // Did user ask to see request metadata?
    var responseObject;
    if (parameter.value === 'true') {
        responseObject = {
            request: {
                viaAjax: httpRequest.xhr,
                os: httpRequest.useragent.OS,
                platform: httpRequest.useragent.Platform,
                browser: httpRequest.useragent.Browser,
                browserVersion: httpRequest.useragent.Version,
                ipAddress: httpRequest.ip,
                ssl: httpRequest.secure,
                apiParameters: query,
                globalParameters: global
            }
        };
    }
    // Supply the metadata or no information.
    return responseObject || {};
};

/**
 * Injects an object for request performance metadata.
 *
 * @param  {Object} parameter URL parsed parameter information
 * @param  {Date}   start     Date prior to API plugin function
 * @param  {Date}   end       Date after API plugin function
 * @return {Object}           Performance metadata information object
 */
OzonePlatformApiController.prototype.injectPerformanceMetadata = function(parameter, start, end) {
    // Did user ask to see performance metadata?
    var responseObject;
    if (parameter.value === 'true') {
        responseObject = {
            performance: {
                requestTimeSeconds: (end - start) / 1000,
                requestStarted: start,
                requestEnded: end
            }
        };
    }
    // Supply the metadata or no information.
    return responseObject || {};
};

/**
 * Injects an object for request performance metadata.
 *
 * @param  {Object} parameter URL parsed parameter information
 * @param  {Object} os        NodeJS operating system module
 * @return {Object}           System metadata information object
 */
OzonePlatformApiController.prototype.injectSystemMetadata = function(parameter, os) {
    // Did user ask to see system metadata?
    var responseObject;
    if (parameter.value === 'true') {
        responseObject = {
            system: {
                proc: os.cpus().length,
                server: os.hostname(),
                load: os.loadavg()[0],
                freeMem: (os.freemem() / 1000000).toFixed(2)
            }
        };
    }
    // Supply the metadata or no information.
    return responseObject || {};
};

/**
 * Emits response object as a CSV concatenated string.
 *
 * @param  {Object} json Original JSON response object
 * @return {Array}       CSV-formatted and concatenated string from results set only
 */
OzonePlatformApiController.prototype.csvProducer = function(json) {
    var recordIter, rows = [],
        headers = {};
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

OzonePlatformApiController.prototype.htmlEnumerationProducer = function(json) {
    // Define variables and alias the needed plugins.
    var html = [],
        handlebars = this.nodePlugins.handlebars,
        fs = this.nodePlugins.fs,
        underscore = this.nodePlugins.underscore;

    // Load the HTML response view template.
    var view = fs.readFileSync('./views/enumeration.html', {
        encoding: 'utf-8'
    });

    // Register the partial handlers for compilation.
    handlebars.registerPartial('enum-options', fs.readFileSync('./partials/enumoptions.partial', {
        encoding: 'utf-8'
    }));
    handlebars.registerPartial('enum-params', fs.readFileSync('./partials/enumparams.partial', {
        encoding: 'utf-8'
    }));
    handlebars.registerHelper('compare', this.comparisonHelper);
    handlebars.registerHelper('capitalize', this.capitalizeHelper);

    // Compile the template and generate the HTML view.
    var htmlTemplate = handlebars.compile(view);
    return htmlTemplate({
        service: json
    });
};

/**
 * Emits response object as an HTML document.
 *
 * @param  {Object} json Original JSON response object
 * @return {String}      Formatted HTML document
 */
OzonePlatformApiController.prototype.htmlProducer = function(json) {
    // Define variables and alias the needed plugins.
    var html = [],
        handlebars = this.nodePlugins.handlebars,
        fs = this.nodePlugins.fs,
        underscore = this.nodePlugins.underscore;

    // Load the HTML response view template.
    var view = fs.readFileSync('./views/response.html', {
        encoding: 'utf-8'
    });

    // Register the partial handlers for compilation.
    handlebars.registerPartial('performance', fs.readFileSync('./partials/performance.partial', {
        encoding: 'utf-8'
    }));
    handlebars.registerPartial('system', fs.readFileSync('./partials/system.partial', {
        encoding: 'utf-8'
    }));
    handlebars.registerPartial('request', fs.readFileSync('./partials/request.partial', {
        encoding: 'utf-8'
    }));
    handlebars.registerPartial('query', fs.readFileSync('./partials/query.partial', {
        encoding: 'utf-8'
    }));
    handlebars.registerHelper('compare', this.comparisonHelper);

    // Register the data table helper.
    handlebars.registerHelper('datatable', this.dataTableTemplateHelper);

    // Compile the template and generate the HTML view.
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
 * Acts as a comparison helper for Handlebars templates.
 *
 * @param  {Object} v1      Dynamically-typed left-hand value for comparison
 * @param  {String} op      Comparison operator
 * @param  {Object} v2      Dynamically-typed right hand value for comparison
 * @param  {Object} options Handlebars optional functions
 * @return {Boolean}        Boolean value of comparison
 */
OzonePlatformApiController.prototype.comparisonHelper = function(v1, op, v2, options) {
    var c = {
        "eq": function(v1, v2) {
            return v1 == v2;
        },
        "neq": function(v1, v2) {
            return v1 != v2;
        },
        "gt": function(v1, v2) {
            return v1 > v2;
        },
        "lt": function(v1, v2) {
            return v1 < v2;
        }
    };

    // Assign operators to comparison.
    if (Object.prototype.hasOwnProperty.call(c, op)) {
        return c[op].call(this, v1, v2) ? options.fn(this) : options.inverse(this);
    }
    return options.inverse(this);
};

/**
 * Capitalizes word passed for Handlebars templates.
 *
 * @param  {String} word String to be capitalized
 * @return {String}      Capitalized string
 */
OzonePlatformApiController.prototype.capitalizeHelper = function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
};

/**
 * Helper for data table template in Handlebars for response object
 *
 * @param  {Array}  items   Array of items from the record set
 * @param  {Object} options Handlebar options for the helper
 * @return {String}         Concatenated string of the HTML fragment
 */
OzonePlatformApiController.prototype.dataTableTemplateHelper = function(items, options) {
    // Default Bootstrap classes for table.
    var out = '<table class="table table-striped table-hover table-bordered">';

    // Generate the table headers.
    out += '<tr>';
    var keys = [];
    for (var k in items[0]) {
        keys.push(k);
    }

    // Add all of the table headers from keys.
    for (var keyIter = 0; keyIter < keys.length; keyIter++) {
        out += '<th>' + keys[keyIter] + '</th>';
    }
    out += '</tr>';

    // Strip out the values and insert into rows.
    for (var i = 0, l = items.length; i < l; i++) {
        out += '<tr>';
        for (keyIter = 0; keyIter < keys.length; keyIter++) {
            var key = keys[keyIter];
            out += '<td>' + items[i][key] + '</td>';
        }
        out += '</tr>';
    }

    // Terminate table.
    out += '</table>';
    return out;
};

// Create a new API instance.
var api = new OzonePlatformApiController();