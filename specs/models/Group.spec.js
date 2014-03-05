var rootPath = '../../src';
var Group = require(rootPath + '/models/Group');

describe('Group', function() {
    var group;

    beforeEach(function() {
        group = new Group({
            name: 'administration',
            description: 'System Administrators'
        });
    });

    it('should be a constructor function', function() {
        expect(typeof Group).toBe('function');
    });

    it('should be configurable at instantiation', function() {
        expect(group.name()).toBe('administration');
        expect(group.description).toBe('System Administrators');
    });

    it('should be configurable after instantiation', function() {
        group = new Group();
        expect(group.name()).toBe(undefined);
        expect(group.description()).toBe(undefined);
        group.setName('administration');
        group.setDescription('System Administrators');
        expect(group.name()).toBe('administration');
    });

    it('should have no users by default', function() {
        expect(group.users().length).toBe(0);
    });

    it('should be able to add users', function() {
        group.addUser('jdoe1');
        expect(group.users().length).toBe(1);
        expect(group.users()[0]).toBe('jdoe1');
    });

    it('should be able to remove users', function() {
        group.addUser('jdoe1');
        expect(group.users().length).toBe(1);
        expect(group.users()[0]).toBe('jdoe1');
        group.removeUser('jdoe1');
        expect(group.users().length).toBe(0);
    });
});