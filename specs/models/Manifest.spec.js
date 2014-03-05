var rootPath = '../../src';
var Manifest = require(rootPath + '/models/Manifest');
var securityManifest = require(rootPath + '/security/config/manifest.json');
var ParameterDefinition = require(rootPath + '/models/ParameterDefinition');

describe('Manifest', function() {
    var manifest;
    beforeEach(function() {
        manifest = new Manifest(securityManifest);
    });

    it('should be a constructor function', function() {
        expect(typeof Manifest).toBe('function');
    });

    it('should allow for configuration at instantiation', function() {
        manifest = new Manifest(securityManifest);
        expect(manifest.get()).toEqual(securityManifest);
    });

    it('should allow for configuration to be loaded from a file', function() {
        manifest = new Manifest();
        manifest.load(rootPath + '/security/config/manifest.json');
        expect(manifest.get()).toEqual(securityManifest);
    });

    it('should remain uninstantiated if the configuration file is bad', function() {
        manifest = new Manifest();
        manifest.load(rootPath + '/security/manifest.json');
        expect(manifest.get()).toEqual({});
    });

    it('should provide an indication of the manifest is required for the system to operate', function() {
        expect(manifest.required()).toBe(true);
    });

    it('should provide the name of the associated plugin', function() {
        expect(manifest.plugin()).toBe(securityManifest.informational.plugin);
    });

    it('should provide the name of the manifest', function() {
        expect(manifest.name()).toBe(securityManifest.informational.name);
    });

    it('should provide the description of the manifest', function() {
        expect(manifest.description()).toBe(securityManifest.informational.description);
    });

    it('should provide the service route for the manifest', function() {
        expect(manifest.route()).toBe(securityManifest.route.uri);
    });

    it('should provide a list of resources in the array', function() {
        expect(typeof manifest.resources()).toBe('object');
        expect(manifest.resources().hasOwnProperty('length')).toBe(true);
        expect(manifest.resources().length).toBe(3);
    });

    it('should provide a list of parameters for a given resource', function() {
        expect(manifest.parameters(0).length).not.toBe(0);
        expect(manifest.parameters(0)[0] instanceof ParameterDefinition).toBe(true);
    });

    it('should provide a route for a given resource', function() {

    });

    it('should provide a version for a given resource', function() {

    });

    it('should provide an implementation file for a given resource', function() {

    });

    it('should provide a description for a given resource', function() {

    });

    it('should provide a enumeration of applicable manifest information', function() {

    });
});