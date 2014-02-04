/* jshint -W097 */
/* jshint node:true */

/**
 * OZONE Security Interface
 *
 * @constructor
 * @param {Number} version        Version of the security interface and sub-interfaces
 * @param {[type]} options        Run-time defined configuration options
 */
var OzoneSecurity = (function(options) {
    // Define options for interface.
    this.options = {};
    var validOptions = ['version', 'implementation', 'forceErrorRedirect', 'manifest', 'type'];

    // Verify and add configuration options. Check each property for injection.
    for (var option in options) {
        if (options.hasOwnProperty(option)) {
            for (var validOptionsIter = 0; validOptionsIter < validOptions.length; validOptionsIter++) {
                if (option === validOptions[validOptionsIter]) {
                    this.options[option] = options[option];
                }
            }
        }
    }

    // Must supply a correctly-typed version to the constructor.
    if (!this.options.version) throw 'Must supply version number';
    if (typeof this.options.version !== 'number') throw 'Must supply version number';
    this.version = this.options.version;

    // Must supply an authentication implementation.
    if (!this.options.type) throw 'Must supply authentication type';
    if (!this.options.implementation) throw 'Must supply authentication implementation';

    // Ensure there isn't a problem with requiring the sub-interfaces.
    try {
        this.session = require(__dirname + '/interface/session-manager/security-session-manager-v' + this.version + '.js')();
        this.acl = require(__dirname + '/interface/acl-manager/security-acl-manager-v' + this.version + '.js')();
        this.user = require(__dirname + '/interface/user-information-manager/security-user-information-manager-v' + this.version + '.js')();
    } catch (exception) {
        throw 'Unable to load version ' + this.version + ' of OZONE Security: ' + exception;
    }

    /**
     * Sets the authentication implementation for the security service.
     *
     * @param {String} implementation Name of the implementation as configured
     */
    function setAuthImplementation(implementation, type) {
        var securityImplementations = require('fs').readdirSync(__dirname + '/plugins'),
            plugin;

        for (var pluginIter = 0; pluginIter < securityImplementations.length; pluginIter++) {
            if (type === securityImplementations[pluginIter]) {
                var path = __dirname + '/plugins/' + type + '/api/' + implementation;
                plugin = require(path);
            }
        }

        // Error if plugin is undefined, something went wrong.
        if (!plugin) throw "Unable to create authentication service";
        return plugin;
    }

    // Check and instanciate the authentication plugin.
    if (typeof this.options.implementation !== 'string') throw 'Must supply a defined authorization plugin';
    this.auth = setAuthImplementation(this.options.implementation, this.options.type);

    // Return a private object with scope abstraction to prevent tinkering.
    return {
        acl: this.acl,
        session: this.session,
        user: this.user,
        manifest: this.options.manifest,
        auth: this.auth
    };
});

module.exports = OzoneSecurity;