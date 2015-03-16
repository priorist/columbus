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

var expect = require('expect.js');

var columbus = require('..')();

describe('The "columbus" module', function suite () {
    it('should throw an error when trying to advertise without name and port', function test (done) {

        try {
            columbus.advertise();
        } catch (err) {
            expect(err).not.to.be(undefined);
        }

        try {
            columbus.advertise({});
        } catch (err) {
            expect(err).not.to.be(undefined);
        }

        try {
            columbus.advertise({name: 'foo'});
        } catch (err) {
            expect(err).not.to.be(undefined);
        }

        try {
            columbus.advertise({port: 8080});
        } catch (err) {
            expect(err).not.to.be(undefined);
        }

        done();
    });

    it('should be able to advertise a service', function test (done) {
        var options = {
            name: 'my-service',
            port: 8080
        };

        function onAdvertise (err) {
            expect(err).to.be(null);

            columbus.halt(onHalt);
        }

        function onHalt (err) {
            expect(err).to.be(null);

            done();
        }

        columbus.advertise(options, onAdvertise);
    });
});
