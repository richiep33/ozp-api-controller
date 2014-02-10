/* jshint -W097 */
/* jshint node:true */

SecuritySessionManager = function() {

    this.sessions = {};

    function createSessionId() {}

    function authenticate() {}

    function removeSessionId() {}

    function refreshSessionId(sessionId) {}

    return {
        create: createSessionId,
        authenticate: authenticate,
        remove: removeSessionId,
        refresh: refreshSessionId
    };
};

module.exports = SecuritySessionManager;