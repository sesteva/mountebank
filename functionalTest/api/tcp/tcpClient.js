'use strict';

const net = require('net'),
    Q = require('q');

const send = (message, serverPort, timeout) => {
    const deferred = Q.defer(),
        socket = net.createConnection({ port: serverPort }, () => { socket.write(message); });

    if (!serverPort) {
        throw Error('you forgot to pass the port again');
    }

    socket.once('error', deferred.reject);
    socket.once('data', deferred.resolve);

    if (timeout) {
        setTimeout(() => { deferred.resolve(''); }, timeout);
    }

    return deferred.promise;
};

const fireAndForget = (message, serverPort) => {
    const deferred = Q.defer(),
        socket = net.createConnection({ port: serverPort }, () => { socket.write(message); });

    // Attempt to avoid race conditions where the subsequent test code
    // gets ahead of the server's ability to record the request
    setTimeout(() => { deferred.resolve(''); }, 150);
    socket.on('error', deferred.reject);
    return deferred.promise;
};

module.exports = { send, fireAndForget };
