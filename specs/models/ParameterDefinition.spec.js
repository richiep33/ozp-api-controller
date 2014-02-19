var rootPath = '../../src';
var ParameterDefinition = require(rootPath + '/models/ParameterDefinition');
var securityManifest = require(rootPath + '/security/config/manifest.json');

describe('ParameterDefinition', function() {
    var parameterSet, parameterDefinition;

    beforeEach(function() {
        parameterSet = securityManifest.resources[0].parameters[0];
        parameterDefinition = new ParameterDefinition(parameterSet);
    });

    it('should be a constructor function', function() {
        expect(typeof ParameterDefinition).toBe('function');
    });

    it('should be configurable by constructor', function() {
        expect(parameterDefinition.parameter()).toBe(parameterSet.parameter);
    });

    it('should provide the parameter name', function() {
        expect(parameterDefinition.parameter()).toBe(parameterSet.parameter);
    });

    it('should provide the parameter type', function() {
        expect(parameterDefinition.type()).toBe(parameterSet.type);
    });

    it('should provide a list of operators', function() {
        expect(parameterDefinition.operators()).toEqual(parameterSet.operators);
    });

    it('should provide a description', function() {
        expect(parameterDefinition.description()).toBe(parameterSet.description);
    });

    it('should provide a list of examples', function() {
        expect(parameterDefinition.examples()).toEqual(parameterSet.examples);
    });

    it('should provide a check if wildcards are allowed', function() {
        expect(parameterDefinition.wildcard()).toEqual(parameterSet.wildcard);
    });

    it('should return a list of used HTTP methods', function() {
        expect(parameterDefinition.methods()).toEqual(['GET', 'POST', 'DELETE']);
    });

    it('should provide a check if required by HTTP method', function() {
        expect(parameterDefinition.required('GET')).toEqual(false);
    });

    it('should provide a check for administrative privileges by HTTP method', function() {
        expect(parameterDefinition.administrative('POST')).toEqual(true);
    });
});