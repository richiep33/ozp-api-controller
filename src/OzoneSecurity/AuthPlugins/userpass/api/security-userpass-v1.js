var SecurityUserPass = (function(options) {
    function authenticateUser(response) {
        response.redirect('/security/login');
    }

    function login(request, response) {
        response.set('Content-Type', 'text/html');
        response.send(fs.readFileSync('../views/login.html', {
            encoding: 'utf-8'
        }));
    }

    return {
        authenticate: authenticateUser
    }
});

module.exports = SecurityUserPass;