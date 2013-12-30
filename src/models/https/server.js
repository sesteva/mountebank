'use strict';

var https = require('https'),
    fs = require('fs'),
    Q = require('q'),
    Domain = require('domain'),
    StubRepository = require('../http/stubRepository'),
    Proxy = require('../http/proxy'),
    HttpValidator = require('../http/httpValidator'),
    winston = require('winston'),
    ScopedLogger = require('../../util/scopedLogger'),
    url = require('url'),
    util = require('util'),
    cert = {
        key: fs.readFileSync(__dirname + '/cert/mb-key.pem'),
        cert: fs.readFileSync(__dirname + '/cert/mb-cert.pem')
    };

function simplify (request) {
    var deferred = Q.defer();
    request.body = '';
    request.setEncoding('utf8');

    request.on('data', function (chunk) {
        request.body += chunk;
    });

    request.on('end', function () {
        var parts = url.parse(request.url, true);
        deferred.resolve({
            from: request.socket.remoteAddress + ':' + request.socket.remotePort,
            method: request.method,
            path: parts.pathname,
            query: parts.query,
            headers: request.headers,
            body: request.body
        });
    });
    return deferred.promise;
}

var create = function (port, options) {
    var name = options.name ? util.format('http:%s %s', port, options.name) : 'http:' + port,
        logger = ScopedLogger.create(winston, name),
        deferred = Q.defer(),
        requests = [],
        proxy = Proxy.create(logger),
        stubs = StubRepository.create(proxy),
        server = https.createServer(cert, function (request, response) {
            var clientName = request.socket.remoteAddress + ':' + request.socket.remotePort,
                domain = Domain.create(),
                errorHandler = function (error) {
                    logger.error(JSON.stringify(error));
                    response.writeHead(500, { 'content-type': 'application/json' });
                    response.end(JSON.stringify({ errors: [error] }), 'utf8');
                };

            logger.info('%s => %s %s', clientName, request.method, request.url);

            domain.on('error', errorHandler);

            domain.run(function () {
                simplify(request).then(function (simpleRequest) {
                    logger.debug('%s => %s', clientName, JSON.stringify(simpleRequest));
                    requests.push(simpleRequest);
                    return stubs.resolve(simpleRequest);
                }).done(function (stubResponse) {
                        logger.debug('%s => %s', JSON.stringify(stubResponse), clientName);
                        response.writeHead(stubResponse.statusCode, stubResponse.headers);
                        response.end(stubResponse.body.toString(), 'utf8');
                    }, errorHandler);
            });
        });

    server.on('close', function () {
        logger.info('Ciao for now');
    });

    server.listen(port, function () {
        logger.info('Open for business...');
        deferred.resolve({
            requests: requests,
            addStub: stubs.addStub,
            metadata: {},
            close: function () {
                server.close();
            }
        });
    });

    return deferred.promise;
};

function initialize (allowInjection) {
    return {
        name: 'http',
        create: create,
        Validator: {
            create: function () {
                return HttpValidator.create(allowInjection);
            }
        }
    };
}

module.exports = {
    initialize: initialize
};