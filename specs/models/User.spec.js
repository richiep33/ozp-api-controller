var rootPath = '../../src';
var User = require(rootPath + '/models/User');

var cuid = require('cuid');
var bcrypt = require('bcrypt-nodejs');
var underscore = require('underscore')._;

describe('User', function() {

    var user;
    var userProperties = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe1@company.com',
        alias: 'jdoe1'
    };

    beforeEach(function() {
        user = new User(userProperties);
    });

    it('should be a constructor function', function() {
        expect(typeof User).toBe('function');
    });

    it('should return an object with constructor-supplied properties', function() {
        expect(user.getAttributes()).toEqual(userProperties);
    });

    it('should return an object with optional properties', function() {
        var additionalAttributes = {
            organization: 'company'
        };
        user = new User(underscore.extend(userProperties, additionalAttributes));
        expect(user.getAdditionalAttributes()).toEqual(additionalAttributes);
    });

    it('should return an object with all properties', function() {
        var additionalAttributes = {
            organization: 'company'
        };
        user = new User(underscore.extend(userProperties, additionalAttributes));
        expect(user.get()).toEqual({
            firstName: userProperties.firstName,
            lastName: userProperties.lastName,
            email: userProperties.email,
            alias: userProperties.alias,
            additional: additionalAttributes
        });
    });

    it('should return a user\'s first name', function() {
        expect(user.firstName()).toBe(userProperties.firstName);
    });

    it('should return a user\'s last name', function() {
        expect(user.lastName()).toBe(userProperties.lastName);
    });

    it('should return a user\'s full name', function() {
        expect(user.fullName()).toBe(userProperties.firstName + ' ' + userProperties.lastName);
    });

    it('should return a user\'s email address', function() {
        expect(user.email()).toBe(userProperties.email);
    });

    it('should return a user\'s alias', function() {
        expect(user.alias()).toBe(userProperties.alias);
    });

    it('should return a user\'s ID', function() {
        expect(user.id()).not.toBe(undefined);
    });

    it('should return the user object creation DTG', function() {
        expect(user.created() instanceof Date).toBe(true);
    });

    it('should return the user object update DTG', function() {
        expect(user.updated() instanceof Date).toBe(true);
    });

    it('should allow for a password to be set and bcrypt hashed', function() {
        user.password('thisisatest');
        expect(bcrypt.compareSync('thisisatest', user.password())).toBe(true);
    });

    it('should allow for a public key to be set', function() {
        user.publicKey('asdfjkl;asdfjkl;');
        expect(user.publicKey()).toBe('asdfjkl;asdfjkl;');
    });
});