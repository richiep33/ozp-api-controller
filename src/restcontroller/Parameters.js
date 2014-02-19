/* jshint -W097 */
/* jshint node:true */

"use strict";

var underscore = require('underscore')._;

var Parameters = function(parameters) {
    this.parameters = parameters;
};

Parameters.prototype.count = function() {
    return this.parameters.length;
};

Parameters.prototype.getParameters = function() {
    var parameters = {};
    for (var iter = 0; iter < this.parameters.length; iter++) {
        var obj = this.parameters[iter];
        var key = obj.key;
        parameters[key] = true;
    }
    return underscore.keys(parameters);
};

// Export Parameters module.
module.exports = Parameters;