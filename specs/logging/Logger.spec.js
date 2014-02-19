var rootPath = '../../src';
var Logger = require(rootPath + '/logging/Logger');
var logger = new Logger();

describe('Logger', function() {
    var eventID;
    var spies = {
        addFn: function() {},
        findFn: function() {},
        callbackFn: function() {}
    };

    var logEntry = {
        user: 'test',
        dtg: new Date(),
        module: 'Jasmine',
        method: 'LoggerSpec',
        action: 'Test',
        msg: 'Adding a new object',
        type: 'success'
    };

    beforeEach(function() {
        logger.clear();
        logger.resetTotal();
        logger.deactivatePlugin('screen');
        spyOn(spies, 'addFn');
        spyOn(spies, 'findFn');
        spyOn(spies, 'callbackFn');
        logger.on('add', spies.addFn);
        logger.on('find', spies.findFn);
    });

    afterEach(function() {
        eventID = undefined;
        logger.removeAllListeners();
        spies.addFn.reset();
        spies.findFn.reset();
        spies.callbackFn.reset();
    });

    it('should be a constructor function', function() {
        expect(typeof Logger).toBe('function');
    });

    it('should have an empty queue of events', function() {
        expect(logger.count()).toBe(0);
    });

    it('should add a new event object and run callback', function() {
        logger.add(logEntry, spies.callbackFn);
        expect(logger.count()).toBe(1);
        expect(spies.callbackFn).toHaveBeenCalled();
    });

    it('should add a new event object and fire \'add\'', function() {
        logger.add(logEntry);
        expect(logger.count()).toBe(1);
        expect(spies.addFn).toHaveBeenCalled();
    });

    it('should find log events by property', function() {
        logger.add(logEntry);
        expect(logger.findWhere('type', 'success').length).toBe(1);
    });

    it('should find log events and return by callback', function() {
        logger.add(logEntry);
        expect(logger.findWhere('type', 'success', spies.callbackFn).length).toBe(1);
        expect(spies.callbackFn).toHaveBeenCalled();
    });

    it('should find log events and fire \'find\'', function() {
        logger.add(logEntry);
        expect(logger.findWhere('type', 'success').length).toBe(1);
        expect(spies.findFn).toHaveBeenCalled();
    });

    it('should not find log events where the property or value does not exist', function() {
        logger.add(logEntry);
        expect(logger.findWhere('module', 'random').length).toBe(0);
    });

    it('should return a list of Log objects', function() {
        logger.add(logEntry);
        var logs = logger.get();
        expect(logs.length).toBe(1);
    });

    it('should clear the log queue', function() {
        logger.add(logEntry);
        expect(logger.count()).toBe(1);
        logger.clear();
        expect(logger.count()).toBe(0);
    });

    it('should contain a FIFO queue of 100 log events', function() {
        for (var i = 0; i < 100; i++) {
            logger.add(logEntry);
        }
        expect(logger.count()).toBe(100);
        logger.add(logEntry);
        expect(logger.count()).toBe(100);
    });

    it('should allow the retrieval of queued log events', function() {
        for (var i = 0; i < 100; i++) {
            logger.add(logEntry);
        }
        expect(typeof logger.get()).toBe('object');
        expect(logger.get().length).toBe(100);
    });

    it('should return a list of available logging plugins', function() {
        expect(logger.availablePlugins()).not.toBe(0);
    });

    it('should return a list of active logging plugins', function() {
        logger.activatePlugin('screen');
        expect(logger.plugins().length).toBe(1);
    });

    it('should return a persistent count of processed log events', function() {
        logger.add(logEntry);
        expect(logger.total()).toBe(1);
        logger.add(logEntry);
        expect(logger.total()).toBe(2);
        logger.clear();
        expect(logger.total()).toBe(2);
    });

    it('should allow the total log count to be reset', function() {
        logger.add(logEntry);
        expect(logger.total()).toBe(1);
        logger.add(logEntry);
        expect(logger.total()).toBe(2);
        logger.resetTotal();
        expect(logger.total()).toBe(0);
    });

    it('should allow you to activate a logging plugin', function() {
        logger.activatePlugin('screen');
        expect(logger.plugins().length).toBe(1);
        expect(logger.plugins()[0]).toBe('screen');
    });

    it('should allow you to deactive a logging plugin', function() {
        logger.deactivatePlugin('screen');
        expect(logger.plugins().length).toBe(0);
    });

    it('should provide a metric of logs per second', function() {
        expect(typeof logger.logsPerSecond()).toBe('number');
    });
});