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
var mandatory = require('mandatory');
var VError = require('verror');
var ip = require('ip');
var debug = require('debug')('columbus:advertiser');

module.exports = function instantiate (options) {
    var advertiser = new Advertiser(options);

    return {
        advertise: advertiser.advertise.bind(advertiser),
        unadvertise: advertiser.unadvertise.bind(advertiser)
    };
};

function Advertiser (options) {
    this.$port = options.port;
    this.$namespace = options.namespace;

    this.$socket = null;
    this.$server = null;

    this.$answer = {
        name: '',
        port: 0,
        ipaddress: ''
    };
}

Advertiser.prototype.$dispatch = function $dispatch (req, res) {
    res.send(JSON.stringify(this.$answer));
};

Advertiser.prototype.advertise = function advertise (config, callback) {
    var self = this;

    mandatory(config).is('object', 'Please provide a proper configuration object.');
    mandatory(config.name).is('string', 'Please define a service name.');
    mandatory(config.port).is('number', 'Please define a service port.');

    callback = callback || function noop () {};

    function open () {
        self.$answer = {};
        self.$answer.name = config.name;
        self.$answer.port = config.port;
        self.$answer.ipaddress = ip.address();

        self.$server = kast();

        self.$server.command(self.$namespace + self.$answer.name, self.$dispatch.bind(self));

        self.$socket = self.$server.listen(self.$port, onOpen);
    }

    function onOpen (err) {
        if (err) {
            debug('failed to advertise the service "%s"', self.$answer.name);

            return callback(new VError(err, 'failed to advertise the service "%s"', self.$answer.name));
        }

        debug('Advertised the service "%s"', self.$answer.name);

        callback(null);
    }

    if (this.$socket) {
        debug('This service has already been advertised. Closing old socket.');

        return this.$socket.close(open);
    }

    open();
};

Advertiser.prototype.unadvertise = function unadvertise (callback) {
    var self = this;

    callback = callback || function noop () {};

    function onClose (err) {
        if (err) {
            return callback(new VError(err, 'failed to unadvertise the service.'));
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
