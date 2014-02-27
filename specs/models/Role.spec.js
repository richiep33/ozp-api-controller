var rootPath = '../../src';
var Parameter = require(rootPath + '/models/Role');

describe('Role', function() {

    var role;

    beforeEach(function() {
        role = new Role();
    });

    it('should be a constructor function', function() {
        expect(typeof Role).toBe('function');
    });

    it('should allow for setting of role and attributes at instantiation', function() {
        role = new Role('systemadministrator', {
            privilegedAccess: true,
            securityAccess: true
        });

        expect(role.type()).toBe('systemadministrator');
        expect(role.attributes().length).toBe(2);
        expect(role.attributes('privilegedAccess').toBe(true));
        expect(role.attributes('securityAccess').toBe(true));
    });

    it('should be allow for setting of role and attributes after instantiation', function() {
        role.set('systemadminstrator');
        role.setAttributes({
            privilegedAccess: true,
            securityAccess: true
        });

        expect(role.type()).toBe('systemadministrator');
        expect(role.attributes().length).toBe(2);
        expect(role.attributes('privilegedAccess').toBe(true));
        expect(role.attributes('securityAccess').toBe(true));
    });

    it('should allow for an attribute to be removed', function() {
        role = new Role('systemadministrator', {
            privilegedAccess: true,
            securityAccess: true
        });
        role.deleteAttribute('privilegedAccess');

        expect(role.attributes().length).toBe(1);
        expect(role.attributes('privilegedAccess').toBe(undefined));
        expect(role.attributes('securityAccess').toBe(true));
    });

    it('should allow for an attribute to be changed', function() {
        role = new Role('systemadministrator', {
            privilegedAccess: true,
            securityAccess: true
        });
        role.changeAttribute('privilegedAccess', false);

        expect(role.attributes().length).toBe(2);
        expect(role.attributes('privilegedAccess').toBe(false));
        expect(role.attributes('securityAccess').toBe(true));
    });

    it('should allow for an attribute to be added', function() {
        role = new Role('systemadministrator', {
            privilegedAccess: true,
            securityAccess: true
        });
        role.addAttribute('corporate', true);

        expect(role.attributes().length).toBe(3);
        expect(role.attributes('privilegedAccess').toBe(true));
        expect(role.attributes('securityAccess').toBe(true));
        expect(role.attributes('corporate').toBe(true));
    });
});