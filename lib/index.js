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

var debug = require('debug')('columbus');
var mandatory = require('mandatory');
var VError = require('verror');

var discoverer = require('./discoverer');
var advertiser = require('./advertiser');

module.exports = function instantiate () {
    var options = {
        port: process.env.KAST_PORT || 5000,
        timeout: process.env.KAST_BROADCAST_TIMEOUT || 500,
        namespace: '/discoveries/'
    };

    var theDiscoverer = discoverer(options);
    var theAdvertiser = advertiser(options);

    function halt (callback) {

        mandatory(callback).is('function', 'Please define a proper callback function.');

        // Clean all timers and sockets.
        function onUnadvertise (err) {
            if (err) {
                return callback(new VError(err, 'failed to halt columbus (unadvertise).'));
            }

            theDiscoverer.stopRefresher();

            callback(null);
        }

        theAdvertiser.unadvertise(onUnadvertise);
    }

    debug('Instantiated columbus.');

    //
    // Wrap the modules into a nicer front-facing API
    //
    return {
        advertise: theAdvertiser.advertise.bind(theAdvertiser),
        need: theDiscoverer.find.bind(theDiscoverer),
        halt: halt
    };
};
