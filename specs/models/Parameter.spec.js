var rootPath = '../../src';
var Parameter = require(rootPath + '/models/Parameter');

describe('Parameter', function() {
    var parameterAssign, parameterGT, parameterLT, parameterEmail;

    beforeEach(function() {
        parameterAssign = new Parameter("name", "=", "john");
        parameterEmail = new Parameter("email", "=", "jdoe1@company.com");
        parameterGT = new Parameter("date", ">", "20140123");
        parameterLT = new Parameter("price", "<", "0.56");
    });

    it('should be a constructor function', function() {
        expect(typeof Parameter).toBe('function');
    });

    it('should check for castable numbers', function() {
        expect(parameterGT.type()).toBe('number');
    });

    it('should check for castable strings', function() {
        expect(parameterAssign.type()).toBe('string');
    });

    it('should check for castable dates', function() {
        expect(parameterGT.type()).toBe('date');
    });

    it('should check for non-castable email type', function() {
        expect(parameterEmail.type()).toBe('email');
    });

    it('should return the operator type', function() {
        expect(parameterAssign.opType()).toBe('assignment');
        expect(parameterGT.opType()).toBe('greater-than');
        expect(parameterLT.opType()).toBe('less-than');
    });

    it('should return the operator', function() {
        expect(parameterAssign.op()).toBe('=');
        expect(parameterGT.op()).toBe('>');
        expect(parameterLT.op()).toBe('<');
    });

    it('should return the parameter name', function() {
        expect(parameterAssign.param()).toBe('name');
    });

    it('should return the parameter value', function() {
        expect(parameterAssign.value()).toBe('john');
    });
});