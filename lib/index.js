/*
 * columbus
 *
 * Copyright (C) 2014-2015, priorist / Karlsruhe / Germany
 *
 * MIT licensed
 *
 */

/**
 * @author André König (andre.koenig@posteo.de)
 *
 */

'use strict';

var kast = require('kast');
var ip = require('ip');
var mandatory = require('mandatory');
var VError = require('verror');
var debug = require('debug')('columbus');

var KAST_PORT = 5000;
var KAST_BROADCAST_TIMEOUT = 500;
var COMMAND_NAMESPACE = '/discoveries/';

module.exports = function instantiate () {
    var discovery = new Discovery();

    return {
        advertise: discovery.advertise.bind(discovery),
        unadvertise: discovery.unadvertise.bind(discovery),
        need: discovery.need.bind(discovery)
    };
};

function Discovery () {
    this.$socket = null;
    this.$server = null;

    this.$answer = {
        name: '',
        port: 0,
        ipaddress: ''
    };
}

Discovery.prototype.$dispatch = function $dispatch (req, res) {
    res.send(JSON.stringify(this.$answer));
};

Discovery.prototype.advertise = function advertise (config, callback) {
    var self = this;

    mandatory(config).is('object', 'Please provide a proper configuration object.');
    mandatory(config.name).is('string', 'Please define a service name.');
    mandatory(config.port).is('number', 'Please define a service port.');

    function open () {
        self.$answer = {};
        self.$answer.name = config.name;
        self.$answer.port = config.port;
        self.$answer.ipaddress = ip.address();

        self.$server = kast();

        self.$server.command(COMMAND_NAMESPACE + self.$answer.name, self.$dispatch.bind(self));

        self.$socket = self.$server.listen(KAST_PORT, onOpen);
    }

    function onOpen (err) {
        if (err) {
            debug('failed to advertise the service "%s"', self.$answer.name);

            return callback(new VError(err, 'failed to advertise the service "%s"', self.$answer.name));
        }

        debug('Advertised the service "%s"', self.$answer.name);

        callback(null);
    }

    callback = callback || function noop () {};

    if (this.$socket) {
        debug('This service has already been advertised. Closing old socket.');

        this.$socket.close(open);
    }

    open();
};

Discovery.prototype.unadvertise = function unadvertise (callback) {
    var self = this;

    callback = callback || function noop () {};

    function onClose (err) {
        if (err) {
            return callback(new VError(err, 'failed to unadvertise the service'));
        }

        self.$server = null;
        self.$socket = null;
        self.$answer = {};

        callback(null);
    }

    if (!this.$socket) {
        return process.nextTick(onClose);
    }

    this.$socket.close(onClose);
};

Discovery.prototype.need = function need (name, callback) {
    var options = {};

    mandatory(name).is('string', 'Please provide a proper service name you want to discover.');
    mandatory(callback).is('function', 'Please provide a proper callback function.');

    function onResults (err, results) {
        var result = {};

        if (err) {
            return callback(new VError(err, 'failed to discover the configuration of "%s"', name));
        }

        if (Object.keys(results).length === 0) {
            debug('Found no service with the name "%s".', name);

            return callback(null, null);
        } else {
            if (Object.keys(results).length > 1) {
                debug('Warning: There are multiple services with the name "%s" deployed.');
            }

            // We take the first result (should only be one service with this name).
            result = JSON.parse(results[Object.keys(results)[0]]);

            callback(null, result);
        }

    }

    options.port = KAST_PORT;
    options.timeout = KAST_BROADCAST_TIMEOUT;
    options.command = COMMAND_NAMESPACE + name;

    kast.broadcast(options, onResults);
};
