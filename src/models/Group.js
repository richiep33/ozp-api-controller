/* jshint -W097 */
/* jshint node:true */

"use strict";

var underscore = require('underscore')._;

var defaults = {
    users: []
};

/**
 *
 */
var Group = function(groupObject) {
    // Merge defaults and any supplied parameters into a config object
    var config = underscore.extend({}, defaults, groupObject);

    // Set internal properties
    this._name = config.name;
    this._description = config.description;
    this._users = config.users;
};

Group.prototype.name = function() {
    return this._name;
};

Group.prototype.description = function() {
    return this._description;
};

Group.prototype.setName = function(name) {
    this._name = name;
};

Group.prototype.setDescription = function(description) {
    this._description = description;
};

Group.prototype.users = function() {
    return this._users;
};

Group.prototype.addUser = function(user) {
    this._users.push(user);
};

Group.prototype.removeUser = function(user) {
    // Find index to remove
    var index = this._users.indexOf(user);
    // Remove the user
    this._users.splice(index, 1);
};

module.exports = Group;