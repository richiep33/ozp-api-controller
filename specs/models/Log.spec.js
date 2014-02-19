var rootPath = '../../src';
var Log = require(rootPath + '/models/Log');

describe('Log', function() {
    var dateCheck = new Date();
    var eventObject = {
        user: 'test',
        dtg: dateCheck,
        module: 'Jasmine',
        method: 'LoggerSpec',
        action: 'Test',
        msg: 'Adding a new object',
        type: 'success'
    };

    var exceptionObject = {
        user: 'test',
        dtg: dateCheck,
        module: 'Jasmine',
        method: 'LoggerSpec',
        action: 'Test',
        msg: 'Adding a new object',
        type: 'failure',
        exception: {
            type: 'TypeError',
            msg: 'Could not cast a number'
        }
    };

    var badObject = {
        user: 'test',
        dtg: dateCheck,
        module: 'Jasmine',
        method: 'LoggerSpec',
        action: 'Test',
        msg: 'Adding a new object',
        type: 'failure',
        random: 'check!',
        exception: {
            type: 'TypeError',
            msg: 'Could not cast a number'
        }
    };

    var log, exLog, badLog;

    beforeEach(function() {
        log = new Log(eventObject);
        exLog = new Log(exceptionObject);
        badLog = new Log(badObject);
    });

    it('should be a constructor function', function() {
        expect(typeof Log).toBe('function');
    });

    it('should add an object', function() {
        var log = new Log(eventObject);
        expect(log.get()).toEqual(eventObject);
    });

    it('should return an id', function() {
        var log = new Log(eventObject);
        expect(typeof log.id() === 'string');
        expect(log.id()).not.toBe(undefined);
    });

    it('should flag an exception if provided', function() {
        expect(exLog.exception()).toBe(true);
    });

    it('should not flag an exception if not provided', function() {
        expect(log.exception()).toBe(false);
    });

    it('should return the type', function() {
        expect(log.getBy('type')).toBe('success');
    });

    it('should return the user', function() {
        expect(log.getBy('user')).toBe('test');
    });

    it('should return the dtg', function() {
        expect(log.getBy('dtg')).toBe(dateCheck);
    });

    it('should return the module', function() {
        expect(log.getBy('module')).toBe('Jasmine');
    });

    it('should return the method', function() {
        expect(log.getBy('method')).toBe('LoggerSpec');
    });

    it('should return the action', function() {
        expect(log.getBy('action')).toBe('Test');
    });

    it('should return the message', function() {
        expect(log.getBy('msg')).toBe('Adding a new object');
    });

    it('should not return a non-mandatory value', function() {
        expect(badLog.getBy('random')).toBe(undefined);
    });
});