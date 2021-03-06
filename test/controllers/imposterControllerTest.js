'use strict';

const assert = require('assert'),
    mock = require('../mock').mock,
    Controller = require('../../src/controllers/imposterController'),
    FakeResponse = require('../fakes/fakeResponse'),
    Q = require('q'),
    promiseIt = require('../testHelpers').promiseIt;

describe('ImposterController', () => {

    describe('#get', () => {
        it('should return JSON for imposter at given id', () => {
            const response = FakeResponse.create(),
                imposters = {
                    1: { toJSON: mock().returns('firstJSON') },
                    2: { toJSON: mock().returns('secondJSON') }
                },
                controller = Controller.create(imposters);

            controller.get({ url: '/imposters/2', params: { id: 2 } }, response);

            assert.strictEqual(response.body, 'secondJSON');
        });

        it('should return replayable JSON for imposter at given id if replayable querystring set', () => {
            const response = FakeResponse.create(),
                imposters = {
                    1: { toJSON: mock().returns('firstJSON') },
                    2: { toJSON: mock().returns('secondJSON') }
                },
                controller = Controller.create(imposters);

            controller.get({ url: '/imposters/2?replayable=true', params: { id: 2 } }, response);

            assert.strictEqual(response.body, 'secondJSON');
            assert.ok(imposters['2'].toJSON.wasCalledWith({ replayable: true, removeProxies: false }), imposters['2'].toJSON.message());
        });

        it('should return removeProxies JSON for imposter at given id if removeProxies querystring set', () => {
            const response = FakeResponse.create(),
                imposters = {
                    1: { toJSON: mock().returns('firstJSON') },
                    2: { toJSON: mock().returns('secondJSON') }
                },
                controller = Controller.create(imposters);

            controller.get({ url: '/imposters/2?removeProxies=true', params: { id: 2 } }, response);

            assert.strictEqual(response.body, 'secondJSON');
            assert.ok(imposters['2'].toJSON.wasCalledWith({ replayable: false, removeProxies: true }), imposters['2'].toJSON.message());
        });

        it('should return replayable and removeProxies JSON for imposter at given id if both querystring values set', () => {
            const response = FakeResponse.create(),
                imposters = {
                    1: { toJSON: mock().returns('firstJSON') },
                    2: { toJSON: mock().returns('secondJSON') }
                },
                controller = Controller.create(imposters);

            controller.get({ url: '/imposters/2?removeProxies=true&replayable=true', params: { id: 2 } }, response);

            assert.strictEqual(response.body, 'secondJSON');
            assert.ok(imposters['2'].toJSON.wasCalledWith({ replayable: true, removeProxies: true }), imposters['2'].toJSON.message());
        });

        it('should return normal JSON for imposter at given id if both replayable and removeProxies querystrings are false', () => {
            const response = FakeResponse.create(),
                imposters = {
                    1: { toJSON: mock().returns('firstJSON') },
                    2: { toJSON: mock().returns('secondJSON') }
                },
                controller = Controller.create(imposters);

            controller.get({ url: '/imposters/2?replayable=false&removeProxies=false', params: { id: 2 } }, response);

            assert.strictEqual(response.body, 'secondJSON');
            assert.ok(imposters['2'].toJSON.wasCalledWith({ replayable: false, removeProxies: false }), imposters['2'].toJSON.message());
        });
    });

    describe('#del', () => {
        promiseIt('should stop the imposter', () => {
            const response = FakeResponse.create(),
                imposter = {
                    stop: mock().returns(Q(true)),
                    toJSON: mock().returns('JSON')
                },
                controller = Controller.create({ 1: imposter });

            return controller.del({ url: '/imposters/1', params: { id: 1 } }, response).then(() => {
                assert(imposter.stop.wasCalled());
            });
        });

        promiseIt('should remove the imposter from the list', () => {
            const response = FakeResponse.create(),
                imposters = {
                    1: {
                        stop: mock().returns(Q(true)),
                        toJSON: mock().returns('JSON')
                    }
                },
                controller = Controller.create(imposters);

            return controller.del({ url: '/imposters/1', params: { id: 1 } }, response).then(() => {
                assert.deepEqual(imposters, {});
            });
        });

        promiseIt('should send request even if no imposter exists', () => {
            const response = FakeResponse.create(),
                imposters = {},
                controller = Controller.create(imposters);

            return controller.del({ url: '/imposters/1', params: { id: 1 } }, response).then(() => {
                assert.deepEqual(response.body, {});
            });
        });

        promiseIt('should return replayable JSON for imposter at given id if replayable querystring set', () => {
            const response = FakeResponse.create(),
                imposter = {
                    stop: mock().returns(Q(true)),
                    toJSON: mock().returns('JSON')
                },
                controller = Controller.create({ 1: imposter });

            return controller.del({ url: '/imposters/1?replayable=true', params: { id: 1 } }, response).then(() => {
                assert.ok(imposter.toJSON.wasCalledWith({ replayable: true, removeProxies: false }), imposter.toJSON.message());
            });
        });

        promiseIt('should return removeProxies JSON for imposter at given id if removeProxies querystring set', () => {
            const response = FakeResponse.create(),
                imposter = {
                    stop: mock().returns(Q(true)),
                    toJSON: mock().returns('JSON')
                },
                controller = Controller.create({ 1: imposter });

            return controller.del({ url: '/imposters/1?removeProxies=true', params: { id: 1 } }, response).then(() => {
                assert.ok(imposter.toJSON.wasCalledWith({ replayable: false, removeProxies: true }), imposter.toJSON.message());
            });
        });

        promiseIt('should return replayable and removeProxies JSON for imposter at given id if both querystring values set', () => {
            const response = FakeResponse.create(),
                imposter = {
                    stop: mock().returns(Q(true)),
                    toJSON: mock().returns('JSON')
                },
                controller = Controller.create({ 1: imposter });

            return controller.del({ url: '/imposters/1?removeProxies=true&replayable=true', params: { id: 1 } }, response).then(() => {
                assert.ok(imposter.toJSON.wasCalledWith({ replayable: true, removeProxies: true }), imposter.toJSON.message());
            });
        });

        promiseIt('should send default JSON for the deleted the imposter if both replayable and removeProxies querystrings are missing', () => {
            const response = FakeResponse.create(),
                imposter = {
                    stop: mock().returns(Q(true)),
                    toJSON: mock().returns('JSON')
                },
                controller = Controller.create({ 1: imposter });

            return controller.del({ url: '/imposters/1', params: { id: 1 } }, response).then(() => {
                assert.ok(imposter.toJSON.wasCalledWith({ replayable: false, removeProxies: false }), imposter.toJSON.message());
            });
        });

        promiseIt('should delete requests recorded with the imposter', () => {
            const response = FakeResponse.create(),
                imposter = {
                    toJSON: mock().returns('JSON'),
                    deleteRequests: mock()
                },
                controller = Controller.create({ 1: imposter });

            return controller.deleteRequests({ url: '/imposters/1/requests', params: { id: 1 } }, response).then(() => {
                assert(imposter.deleteRequests.wasCalled());
            });
        });

    });
});
