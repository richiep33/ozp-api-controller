# OZONE API Controller

## Master RESTful API controller for OZONE services.

This controller is used as a central arbiter of RESTful services for OZONE Platform.
It provides the ability for core RESTful standards to be applied across the
entirety of all services, security and cross-origin (CORS) headers to be applied globally,
as well as folder watches to dynamically load plugins.

## Feature List

1. API Service Plugins provided via JavaScript API and manifest configuration.
2. Global CSRF protections.
3. Global performance and timing, accessed via flag parameter.
4. Request and response metadata, accessed via flag parameter.
5. OPTIONS service method attachment for enumerable parameters.
6. Parameter injection via manifest files.
7. URI versioning based on plugin manifest. Allows for multiple versions ot service to execute simultaneously.
8. Global header configurations and assignment based on producer type.
9. Global HTTP error code redirection.
10. URI and parameter body parsing.
11. Producers for XML, JSON, and CSV based on flag parameter.
12. Record paging support
13. Enforcement of parameter body versus URI parameters.
14. Enforcement of 'Content-Type' globally.
15. Assessment and attachment of system metadata to response.
16. Integrated security with pluggable authentication methods (user/pass, OAuth2, etc)

## Configuration

The server configuration needs to be located in 'config/config.json'. The properties listed
below are required for the service to operate:

<code>
{
    "api": {
        "serviceRoot": "/ozone/"
    },
    "server": {
        "useSSL": false,
        "securePort": 8443,
        "insecurePort": 8080,
        "sslPrivateKey": "/{YOUR FOLDER}/server.key",
        "sslCertificate": "/{YOUR FOLDER}/server.crt"
    },
    "plugins": {
        "watch": true,
        "folder": "/{YOUR FOLDER}/ozp-api-plugins"
    },
    "headers": {
        "cors": {
            "enable": true,
            "whitelist": "*"
        }
    }
}
</code>

## Contact Us
1. Facebook: https://www.facebook.com/ozoneplatform
2. Twitter Stream: https://twitter.com/ozoneplatform
3. Official Page: https://www.owfgoss.org