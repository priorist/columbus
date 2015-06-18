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
    this.$port = options.port;
    this.$timeout = options.timeout || 500;
    this.$namespace = options.namespace;

    this.$cache = {};

    // The refresher is the update mechanism for keeping the cache up to date.
    // It will initialized when the first `need` method call has been performed.
    this.$refresher = null;
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
        var keys = null;
        var count = 0;

        if (err) {
            return callback(new VError(err, 'failed to discover the configuration over the network.'));
        }

        keys = Object.keys(results);
        count = keys.length;

        if (count === 0) {
            debug('Found no service with the name "%s".', name);

            return callback(null, null);
        } else if (count > 1) {
            debug('Warning: There are multiple services with the name "%s" deployed.');
        }

        // We take the first result (there should only be one service with this name).
        result = JSON.parse(results[keys[0]]);

        self.$cache[name] = result;

        debug('Updated cache entry for the service with the name "%s".', name);

        callback(null, self.$cache[name]);
    }

    options.port = this.$port;
    options.timeout = this.$timeout;
    options.command = this.$namespace + name;

    debug('Asking for "%s" over the network.', name);

    kast.broadcast(options, onResults);
};

Discoverer.prototype.find = function find (name, callback) {
    var self = this; 

    var sysVarName = 'COLUMBUS_'+name.str.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();

    mandatory(name).is('string', 'Please provide a name of the service you want to discover.');
    mandatory(callback).is('function', 'Please provide a proper callback function.');

    function onResult (err, config) {
        if (err) {
            return callback(new VError(err, 'failed to discover the configuration of "%s".', name));
        }

        //
        // Start the refresher process (will only start once)
        //
        self.$start();

        callback(null, config);
    }

    if(typeof process.env[sysVarName] !== 'undefined'){
        return process.nextTick(function onTick () {
            debug('Taking the system variable of "%s"', name);

            var configArray = process.env[sysVarName].split(':');
            
            onResult(null, {name: name, ipaddress: configArray[0] , port: configArray[1]});
        });
    }

    if (this.$cache[name]) {
        return process.nextTick(function onTick () {
            debug('Taking the cached version of "%s"', name);

            onResult(null, self.$cache[name]);
        });
    }

    this.$ask(name, onResult);
};

Discoverer.prototype.$start = function $start () {
    // refresh interval; every minute
    var INTERVAL = (60 * 1000);

    // Start the refresher process
    if (!this.$refresher) {
        this.$refresher = setInterval(this.$refresh.bind(this), INTERVAL);
        debug('Initialized refresh interval.');
    }
};

Discoverer.prototype.stop = function stop () {
    clearInterval(this.$refresher);

    this.$refresher = null;

    debug('Halted refresh interval.');
};
