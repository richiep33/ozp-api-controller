/* jshint -W097 */
/* jshint node:true */

"use strict";

var moment = require('moment');

/**
 * Defines a parameter for use with route.
 *
 * @param key      {String} parameter key
 * @param operator {String} parameter operator
 * @param value    {String} value of the parameter
 */
var Parameter = function(key, operator, value) {
    this._key = key;
    this._op = operator;
    this._value = value;
    if (Number(this._value)) { 
        this._valueType = "number";
    } else if (this._isEmail(this._value)){
        this._valueType = "email";
    } 
};

/**
 * Get the type of this parameter.
 *
 * @return {String} the type of parameter
 */
Parameter.prototype.type = function(){
    return this._valueType;
};

/**
 * Determine whether a string is an email.
 *
 * @private
 * @param  {String}  toTest the string to test
 * @return {Boolean}        true if the string looks like an email, false otherwise
 */
Parameter.prototype._isEmail = function(toTest){
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(toTest);
};

module.exports = Parameter;