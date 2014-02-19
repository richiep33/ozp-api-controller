var rootPath = '../../src';
var Log = require(rootPath + '/models/Log');
var Screen = require(rootPath + '/logging/plugins/Screen');
var screen = new Screen();

describe('Screen', function() {

    var logEntry = {
        user: 'test',
        dtg: new Date(),
        module: 'Jasmine',
        method: 'LoggerSpec',
        action: 'Test',
        msg: 'Adding a new object',
        type: 'success'
    };

    var badLogEntry = {
        user: 'test',
        dtg: new Date(),
        module: 'Jasmine',
        method: 'LoggerSpec',
        action: 'Test',
        msg: 'Adding a new object',
        type: 'unknown'
    };

    var logObj = new Log(logEntry);
    var badLogObj = new Log(badLogEntry);

    beforeEach(function() {
        spyOn(console, 'log');
    });

    afterEach(function() {
        console.log.reset();
    });

    it('should be a constructor function', function() {
        expect(typeof Screen).toBe('function');
    });

    it('should call console.log()', function() {
        screen.consume(logObj);
        expect(console.log).toHaveBeenCalled();
    });

    it('should not call console.log() if no log entry is passed', function() {
        screen.consume();
        expect(console.log).not.toHaveBeenCalled();
    });

    it('should format the DTG into a 21 character string', function() {
        var date = new Date();
        var formattedDate = screen._formatDate(date);
        expect(formattedDate.length).toBe(21);
    });

    it('should check for unknown message types', function() {
        screen.consume(badLogObj);
        expect(console.log).toHaveBeenCalled();
    });
});