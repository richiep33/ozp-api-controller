/* jshint -W097 */
/* jshint node:true */

"use strict";

var underscore = require('underscore')._;

var defaults = {
    users: []
};

/**
 * Group
 *
 * Defines a group of users
 *
 * @constructor
 * @param {Object} groupObject    a group config object
 */
var Group = function(groupObject) {
    // Merge defaults and any supplied parameters into a config object
    var config = underscore.extend({}, defaults, groupObject);

    // Set internal properties
    this._name = config.name;
    this._description = config.description;
    this._users = config.users;
};

/**
 * Get the group name
 *
 * @return {String}     the group name
 */
Group.prototype.name = function() {
    return this._name;
};

/**
 * Get the group description
 *
 * @return {String}     the group description
 */
Group.prototype.description = function() {
    return this._description;
};

/**
 * Set the name to the specified value
 *
 * @param {String} name     the new name
 */
Group.prototype.setName = function(name) {
    this._name = name;
};

/**
 * Set the description to a new value
 *
 * @return {String} description     the new description
 */
Group.prototype.setDescription = function(description) {
    this._description = description;
};

/**
 * Get the list of users assigned to this group
 *
 * @return {Array}     the users assigned to the group
 */
Group.prototype.users = function() {
    return this._users;
};

/**
 * Add a user to this group
 *
 * @param {String} user    the user name to add
 */
Group.prototype.addUser = function(user) {
    this._users.push(user);
};

/**
 * Remove the user from this group
 *
 * @param {String} user     the user to remove
 */
Group.prototype.removeUser = function(user) {
    // Find index to remove
    var index = this._users.indexOf(user);
    // Remove the user
    this._users.splice(index, 1);
};

module.exports = Group;