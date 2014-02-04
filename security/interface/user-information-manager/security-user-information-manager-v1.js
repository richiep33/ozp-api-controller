/* jshint -W097 */
/* jshint node:true */

SecurityUserInfoManager = function() {

    this.users = {};

    function findUser(user) {}

    return {
        find: findUser
    };
};

module.exports = SecurityUserInfoManager;