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
        this._type = "NOTSET";
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

Role.prototype.addAttribute = function(attr) {
    
};

Role.prototype.setAttributes = function(attrs) {
    this._attributes[attrs]
};

Role.prototype.deleteAttribute = function(attr) {
    
};

module.exports = Role;