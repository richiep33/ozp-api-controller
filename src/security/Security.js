/* jshint -W097 */
/* jshint node:true */

var passport = require('passport');

/**
 * OZONE Security Interface
 *
 * @constructor
 * @param {Number} version        Version of the security interface and sub-interfaces
 * @param {[type]} options        Run-time defined configuration options
 */
var OzoneSecurity = function(options) {

    this.users = {};

    // Define options for interface.
    var BasicStrategy = require('passport-http').BasicStrategy;

    this.serializeUser(function(user, done) {
        done(null, user.id);
    });

    this.deserializeUser(function(id, done) {
        done(null, {
            id: 1,
            username: 'test'
        });
    });

    this.use(new BasicStrategy(
        function(username, password, done) {
            return done(null, {
                id: 1,
                username: username
            });
        }
    ));
};

OzoneSecurity.prototype = passport;

module.exports = OzoneSecurity;