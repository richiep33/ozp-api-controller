var underscore = require('underscore')._;

var ParameterHelper = function(parameters) {
    this.parameters = parameters;
};

ParameterHelper.prototype.count = function() {
    return this.parameters.length;
};

ParameterHelper.prototype.getParameters = function() {
    var parameters = {};
    for (var iter = 0; iter < this.parameters.length; iter++) {
        var obj = this.parameters[iter];
        var key = obj.key;
        parameters[key] = true;
    }
    return underscore.keys(parameters);
};

// Export ParameterHelper module.
module.exports = ParameterHelper;