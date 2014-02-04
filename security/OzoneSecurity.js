/* jshint -W097 */
/* jshint node:true */

OzoneSecurity = function(version, implementation) {
    // Must supply a correctly-typed version to the constructor.
    if (typeof version !== 'number') throw 'Must supply version number';

    // Ensure there isn't a problem with requiring the sub-interfaces.
    try {
        this.session = new require('session-manager/security-session-manager-v' + version);
        this.acl = new require('acl-manager/security-acl-manager-v' + version);
        this.user = new require('user-information-manager/security-user-information-manager-v' + version);
    } catch (exception) {
        throw 'Unable to load version ' + version + ' of OZONE Security';
    }

    // Check and assign the authentication plugin.
    if (typeof implementation !== 'function') throw 'Must supply the correct authorization plugin';
    this.setAuthImplementation(implementation);
};

/**
 * Sets the authentication implementation.
 *
 * @param {Function} implementation Plugin-derived authentication implementation
 */
OzoneSecurity.prototype.setAuthImplementation = function(implementation) {
    this.implementation = implementation;
};