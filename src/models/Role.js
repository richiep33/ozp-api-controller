/* jshint -W097 */
/* jshint node:true */

"use strict";

/**
 * Role
 * 
 * Defines the role of a user
 *
 * @constructor
 * @param {String}  type    the type of this role
 * @param {Object}  attrs   the attributes to assign
 */
var Role = function(type, attrs) {

    // Type is optional...
    if (type) {
        this._type = type;    
    }
    else {
        // Type will default 'NOTSET' unless specified at construction.
        this._type = "__NOTSET__";
    }
    
    this._attributes = {};

    // If attributes are specified...
    if (attrs) {
        for (var key in attrs) {
            // ... assign the attributes.
            this._attributes[key] = attrs[key];
        }
    }

};

/**
 * Get the role type
 *
 * @return {String}     the role type
 */
Role.prototype.type = function() {
    return this._type;
};

/**
 * Get attribute names, or the specified attribute
 *
 * @param {String} attr     optionally provide an attibute to get
 * @return                  either an array of attribute keys, or the value of the specified attribute
 */
Role.prototype.attributes = function(attr) {
    var retVal;

    // If no attribute is specified ...
    if (!attr) {
        retVal = [];
        // return all attribute keys. 
        for (var key in this._attributes) {
            retVal.push(key);
        }
    }
    // Otherwise return the specified attribute
    else {
        retVal = this._attributes[attr];
    }

    return retVal;
};

/**
 * Set the type of role to a new value
 *
 * @param {String} type     the new type to set
 */
Role.prototype.set = function(type) {
    this._type = type;
};

/**
 * Change an attribute to a new value
 *
 * @param {String}  attr     the attribute to change
 * @param {Boolean} newValue the new value of the specified attribute
 */
Role.prototype.changeAttribute = function(attr, newValue) {
    this._attributes[attr] = newValue;
};

/**
 * Add an attribute to this Role
 *
 * @param {String}  attr    the attribute to add
 * @param {Boolean} value   the value of the new attribute
 */
Role.prototype.addAttribute = function(attr, value) {
    this._attributes[attr] = value;      
};

/**
 * Set the given attributes to new values
 *
 * @param {Object} attrs     the attribute values
 */
Role.prototype.setAttributes = function(attrs) {
    for (var key in attrs) {
        this._attributes[key] = attrs[key];
    }
};

/**
 * Delete an attribute from this Role
 *
 * @param {String} attr     the attribute to remove
 */
Role.prototype.deleteAttribute = function(attr) {
    delete this._attributes[attr];
};

module.exports = Role;