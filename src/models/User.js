/* jshint -W097 */
/* jshint node:true */

"use strict";

var cuid = require('cuid');
var bcrypt = require('bcrypt-nodejs');
var underscore = require('underscore')._;

var User = function(userPropObject) {
    this._additionalAttributes = {};
    var _baseAttributes = ['firstName', 'lastName', 'email', 'alias', 'id', 'updated', 'created'];

    for (var property in userPropObject) {
        if (underscore.contains(_baseAttributes, property)) {
            this['_' + property] = userPropObject[property];
        } else {
            this._additionalAttributes[property] = userPropObject[property];
        }
    }

    // Allow custom ID, or generate a new one.
    this._id = this._id || cuid();

    // Created and updated timestamps for user.
    this._created = userPropObject.created || new Date();
    this._updated = userPropObject.updated || new Date();
};

User.prototype.get = function() {
    return {
        firstName: this._firstName,
        lastName: this._lastName,
        email: this._email,
        alias: this._alias,
        additional: this._additionalAttributes
    };
};

User.prototype.getAttributes = function() {
    return {
        firstName: this._firstName,
        lastName: this._lastName,
        email: this._email,
        alias: this._alias
    };
};

User.prototype.getAdditionalAttributes = function() {
    return this._additionalAttributes;
};

User.prototype.firstName = function() {
    return this._firstName;
};

User.prototype.lastName = function() {
    return this._lastName;
};

User.prototype.fullName = function() {
    return this._firstName + ' ' + this._lastName;
};

User.prototype.email = function() {
    return this._email;
};

User.prototype.alias = function() {
    return this._alias;
};

User.prototype.id = function() {
    return this._id;
};

User.prototype.created = function() {
    return this._created;
};

User.prototype.updated = function() {
    return this._updated;
};

User.prototype.password = function(password) {
    if (password) {
        this._password = bcrypt.hashSync(password);
    }
    return this._password;
};

User.prototype.publicKey = function(publicKey) {
    if (publicKey) {
        this._publicKey = publicKey;
    }
    return this._publicKey;
};

module.exports = User;