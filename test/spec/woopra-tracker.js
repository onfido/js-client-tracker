describe('Woopra', function() {
    var visitorProperties = {
            name: 'WoopraUser',
            email: 'test@woopra.com',
            company: 'Woopra'
        },
        tracker;

    describe('Client snippet test', function() {
        var woopra,
            b = ['config', 'track', 'identify', 'push'],
            i,
            spy = {};

            (function (instanceName) {
                var i,
                    s,
                    z,
                    q = 'script',
                    a = arguments,
                    f = ['config', 'track', 'identify', 'push'],
                    c = function () {
                        var self = this;
                        self._e = [];
                        for (i = 0; i < f.length; i++) {
                            (function (f) {
                                self[f] = function () {
                                    self._e.push([f].concat(Array.prototype.slice.call(arguments, 0)));
                                    return self;
                                };
                            })(f[i]);
                        }
                    };

                window._wpt = window._wpt || {};
                // check if instance of tracker exists
                window._wpt[instanceName] = window[instanceName] = window[instanceName] || new c();
            })('woopra');

        beforeEach(function() {
            // create spies for all of the public methods
            for (i = 0; i < b.length; i++) {
                spy[b[i]] = sinon.spy(Woopra.Tracker.prototype, b[i]);
            }
        });
        afterEach(function() {
            // restore spies
            for (i = 0; i < b.length; i++) {
                Woopra.Tracker.prototype[b[i]].restore();
            }
        });

        it('has the instance name of "woopra"', function() {
            expect(window.woopra).to.be.defined;
        });

        // lets queue up some events since woopra tracker isn't loaded yet
        // shouldn't need to test all of the public methods
        it('queues track() call', function() {
            expect(window.woopra._e.length).to.equal(0);
            window.woopra.track('testEvent', {title: 'testTitle'});
            expect(window.woopra._e.length).to.equal(1);
        });

        it('initializes the tracker and processes the queued up track() call', function() {
            var tSpy = sinon.spy(Woopra.Tracker.prototype, '_processQueue');

            woopra = new Woopra.Tracker('woopra');
            woopra.init();
            expect(tSpy).to.be.called;
            expect(spy.track).to.be.called;
            expect(spy.track).to.be.calledWith('testEvent', sinon.match({title: 'testTitle'}));
            tSpy.restore();
        });
    });

    describe('Tracker', function() {
        beforeEach(function() {
            tracker = new Woopra.Tracker();
            tracker.init();
            tracker.identify(visitorProperties);
        });

        it('should initialize properly', function() {
            var oSpy = sinon.spy(Woopra.Tracker.prototype, '_setOptions'),
                cSpy = sinon.spy(Woopra.Tracker.prototype, '_setupCookie'),
                qSpy = sinon.spy(Woopra.Tracker.prototype, '_processQueue'),
                newTracker = new Woopra.Tracker();

            expect(newTracker._loaded).to.be.false;
            newTracker.init();
            expect(newTracker._loaded).to.be.true;
            expect(oSpy).to.be.called;
            expect(cSpy).to.be.called;
            expect(qSpy).to.be.called;
            oSpy.restore();
            cSpy.restore();
            qSpy.restore();
        });

        it('retrieves all visitor properties when no parameters are passed', function() {
            var properties = tracker.identify();
            expect(properties).to.eql(visitorProperties);
        });

        it('retrieves a visitor property when only the key name is supplied', function() {
            var property = tracker.identify('name');
            expect(property).to.equal(visitorProperties.name);
        });

        it('sets visitor properties by passing the params as key, value', function() {
            var newEmail = 'newemail@woopra.com';

            tracker.identify('email', newEmail);

            expect(tracker.visitorData.name).to.equal(visitorProperties.name);
            expect(tracker.visitorData.company).to.equal(visitorProperties.company);
            expect(tracker.visitorData.email).to.equal(newEmail);
        });

        it('sets visitor properties by passing a new object as a param and extends existing properties', function() {
            var newVisitorProperties = {
                name: 'NewUser',
                email: 'newemail@woopra.com'
            };

            tracker.identify(newVisitorProperties);

            expect(tracker.visitorData.name).to.equal(newVisitorProperties.name);
            expect(tracker.visitorData.email).to.equal(newVisitorProperties.email);
            expect(tracker.visitorData.company).to.equal(visitorProperties.company);
        });

        it('sets a tracker option when a key, value is passed', function() {
            var testOpt = 'testOption',
                newVal = 'optionValue';

            tracker.config('testOption', newVal);
            expect(tracker.options.testOption).to.equal(newVal);
        });

        it('extends options if an object is passed in', function() {
            var testOpt = 'testOption',
                newVal = 'optionValue';

            tracker.config('testOption', newVal);
            expect(tracker.options.testOption).to.equal(newVal);

            tracker.config({
                test: 'option',
                another: 'option'
            });
            expect(tracker.options.testOption).to.equal(newVal);
            expect(tracker.options.test).to.equal('option');
            expect(tracker.options.another).to.equal('option');
        });

        it('retrieves a configuration option when only the key name is supplied', function() {
            var testOpt = 'testOption',
                newVal = 'optionValue';

            tracker.config(testOpt, newVal);
            expect(tracker.config(testOpt)).to.equal(newVal);
        });

        it('when moved() handler is called, should not be idle', function() {
            tracker.idle = 1000;
            tracker.moved();
            expect(tracker.idle).to.equal(0);
            //expect(tracker.last_activity.getTime()).to.be.at.least(oldLastActivity.getTime());
        });

        it('when user types, tracker.vs should be 2', function() {
            tracker.typed();
            expect(tracker.vs).to.equal(2);
        });

        describe('Helper functions', function() {
            var oldPath = window.location.pathname;

            beforeEach(function() {
                //window.location.pathname = oldPath + '?query_string=true';
            });
            afterEach(function() {
                //window.location.pathname = oldPath;
            });

            it('gets the current url with the queryl url', function() {
                woopra.config('ignore_query_url', true);
                expect(tracker.getPageUrl()).to.equal(oldPath);
            });
            it('gets the current url ignoring the queryl url', function() {
                woopra.config('ignore_query_url', false);
                expect(tracker.getPageUrl()).to.equal(window.location.pathname + window.location.search);
            });

            it('builds the correct url parameters without a prefix', function() {
                var properties = {
                        name: 'WoopraUser',
                        company: 'Woopra',
                        location: 'California'
                    },
                    params;

                params = Woopra.buildUrlParams(properties, '');
                expect(params).to.equal('name=WoopraUser&company=Woopra&location=California');
            });

            it('builds the correct url parameters with a prefix', function() {
                var properties = {
                        name: 'WoopraUser',
                        company: 'Woopra',
                        location: 'California'
                    },
                    params;

                params = Woopra.buildUrlParams(properties, 'cv_');
                expect(params).to.equal('cv_name=WoopraUser&cv_company=Woopra&cv_location=California');
            });

            it('builds the correct Url parameters with proper Url encoding, without a prefix', function() {
                var params = Woopra.buildUrlParams(visitorProperties, '');
                expect(params).to.equal('name=WoopraUser&email=test%40woopra.com&company=Woopra');
            });
        });

        describe('requests that make a http call to server', function() {
            var spy,
                visitorData = {
                    name: 'WoopraUser',
                    company: 'Woopra'
                },
                eventData = {
                    name: 'testEvent',
                    type: 'test'
                },
                loadSpy;

            beforeEach(function() {
                spy = sinon.spy(Woopra.Tracker.prototype, '_push');
                loadSpy = sinon.spy(Woopra, 'loadScript');
            });

            afterEach(function() {
                spy.restore();
                loadSpy.restore();
                tracker.identify(visitorProperties);
            });

            it('calls _push with a test endpoint and just event properties to create a url string with properties and attempt to load script', function() {
                tracker._push('test', {
                    eventData: eventData
                });

                expect(loadSpy).to.be.calledWithMatch(/woopra.com\/track\/test\//);
                expect(loadSpy).to.be.calledWithMatch(/ce_name=testEvent/);
                expect(loadSpy).to.be.calledWithMatch(/ce_type=test/);
            });

            it('pushes visitor properties to tracking server without a custom event', function() {
                var newVisitorProperties = {
                        name: 'notWoopraUser',
                        email: 'new@woopra.com',
                        company: 'Not Woopra'
                    };

                // Verify visitor properties first
                expect(tracker.identify()).to.eql(visitorProperties);
                tracker.identify(newVisitorProperties);
                expect(tracker.identify()).to.eql(newVisitorProperties);

                tracker.push();
                // XXX pass by reference side effect with options
                expect(spy).to.be.called;
                expect(spy).to.be.calledWith('identify', {
                    visitorData: newVisitorProperties
                });

                expect(loadSpy).to.be.calledWithMatch(/woopra.com\/track\/identify\//);
                expect(loadSpy).to.be.calledWithMatch(/cv_name=notWoopraUser/);
                expect(loadSpy).to.be.calledWithMatch(/cv_company=Not%20Woopra/);
                expect(loadSpy).to.be.calledWithMatch(/cv_email=new%40woopra.com/);
            });

            it('ping() connects to "ping" endpoint', function() {
                var pSpy = sinon.spy(tracker, 'ping');

                tracker.ping();
                expect(pSpy).to.be.called;
                // XXX pass by reference side effect with options
                expect(spy).to.be.calledWith('ping', {
                    visitorData: visitorProperties
                });
            });

            it('should send "ce" event when track() is called and chain visitor properties with identify', function() {
                var newVisitorProperties = {
                        name: 'notWoopraUser',
                        email: 'new@woopra.com',
                        company: 'Not Woopra'
                    },
                    trSpy = sinon.spy(tracker, 'track'),
                    _name = 'testEvent';

                expect(tracker.identify()).to.eql(visitorProperties);
                tracker.identify(newVisitorProperties).track(_name, {
                    type: 'test'
                });

                expect(trSpy).to.be.calledWith(_name, {type: 'test'});
                expect(loadSpy).to.be.calledWithMatch(/woopra.com\/track\/ce\//);
                expect(loadSpy).to.be.calledWithMatch(/cv_name=notWoopraUser/);
                expect(loadSpy).to.be.calledWithMatch(/cv_company=Not%20Woopra/);
                expect(loadSpy).to.be.calledWithMatch(/cv_email=new%40woopra.com/);
                expect(loadSpy).to.be.calledWithMatch(/ce_name=testEvent/);
                expect(loadSpy).to.be.calledWithMatch(/ce_type=test/);

                trSpy.restore();
            });

            it('should send a "ce" event with "pv" event name if track() is called with no parameters', function() {
                var pSpy = sinon.spy(tracker, 'track');

                tracker.track();
                expect(pSpy).to.be.called;

                expect(spy).to.be.calledWith('ce', {
                    visitorData: visitorProperties,
                    eventData: {
                        name: 'pv',
                        url: tracker.getPageUrl(),
                        title: tracker.getPageTitle()
                    },
                    callback: undefined
                });
                expect(loadSpy).to.be.calledWithMatch(/woopra.com\/track\/ce\//);
                expect(loadSpy).to.be.calledWithMatch(/cv_name=WoopraUser/);
                expect(loadSpy).to.be.calledWithMatch(/cv_company=Woopra/);
                expect(loadSpy).to.be.calledWithMatch(/cv_email=test%40woopra.com/);
                expect(loadSpy).to.be.calledWithMatch(/ce_name=pv/);
                pSpy.restore();
            });



        });

    });
});