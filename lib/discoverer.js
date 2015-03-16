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
var debug = require('debug')('columbus:discoverer');

module.exports = function instantiate (options) {
    var discoverer = new Discoverer(options);

    return {
        find: discoverer.find.bind(discoverer),
        stopRefresher: discoverer.stop.bind(discoverer)
    };
};

function Discoverer (options) {
    var INTERVAL = (60 * 1000); // every minute

    this.$port = options.port;
    this.$timeout = options.timeout || 500;
    this.$namespace = options.namespace;

    this.$cache = {};

    this.$refresher = setInterval(this.$refresh.bind(this), INTERVAL);
}

Discoverer.prototype.$refresh = function $refresh () {
    var self = this;
    var names = Object.keys(this.$cache);

    debug('Starting refresh process.');

    names.forEach(function onEach (name) {
        self.$ask(name);
    });
};

Discoverer.prototype.$ask = function $ask (name, callback) {
    var self = this;
    var options = {};

    callback = callback || function noop () {};

    function onResults (err, results) {
        var result = {};
        var count = Object.keys(results).length;

        if (err) {
            return callback(new VError(err, 'failed to discover the configuration over the network.'));
        }

        if (count === 0) {
            debug('Found no service with the name "%s".', name);

            return callback(null, null);
        } else if (count > 1) {
            debug('Warning: There are multiple services with the name "%s" deployed.');
        }

        // We take the first result (there should only be one service with this name).
        result = JSON.parse(results[Object.keys(results)[0]]);

        self.$cache[name] = result;

        callback(null, self.$cache[name]);
    }

    options.port = this.$port;
    options.timeout = this.$timeout;
    options.command = this.$namespace + name;

    kast.broadcast(options, onResults);
};

Discoverer.prototype.find = function find (name, callback) {
    var self = this;

    mandatory(name).is('string', 'Please provide a name of the service you want to discover.');
    mandatory(callback).is('function', 'Please provide a proper callback function.');

    function onResult (err, config) {
        if (err) {
            return callback(new VError('failed to discover the configuration of "%s".', name));
        }

        callback(null, config);
    }

    if (this.$cache[name]) {
        return process.nextTick(function onTick () {
            debug('Taking the cached version for "%s"', name);

            onResult(null, self.$cache[name]);
        });
    }

    this.$ask(name, onResult);
};

Discoverer.prototype.stop = function stop () {
    clearInterval(this.$refresher);

    this.$refresher = null;
};