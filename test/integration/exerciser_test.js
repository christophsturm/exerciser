"use strict";
var exerciser = require("../../lib/exerciser"),
    http = require("http"),
    childProcess = require("child_process"),
    fs = require("fs"),
    util = require('util'),
    assert = require("should");

var requests , statusCodes, headers, timeout, svr;

describe('exerciser', function () {
  describe("get requests", function () {
    beforeEach(function (done) {
      svr = http.createServer(function (req, res) {
        headers = req.headers;
        var statusCode = statusCodes[requests % statusCodes.length];
        if (statusCode) { // for status code 0 we'll just let the request timeout
          res.writeHead(statusCode, {'Content-Type': 'text/plain'});
          res.end();
        }
        requests++;
      });
      svr.listen(9999);
      requests = 0;
      statusCodes = [200];
      done();
    });

    it("can run parallel http requests and collect stats", function (done) {
      var e = new exerciser.Exerciser({host: '127.0.0.1', port: 9999});
      e.run({path: '/blah', requests: 1000, concurrent: 2}, function (stats) {
            assert.equal(requests, 1000, "should run the correct number of requests");
            assert.equal(stats.successful, 1000, "should report how many requests were succesful");
            assert.equal(stats.times.length, 1000, "should report access times for all requests");
            assert.ok(stats.totalTime > 0, "should report the total time for all requests");
            done();
          }
      )
    });
    it("can run until stopped", function (done) {
      var e = new exerciser.Exerciser({host: '127.0.0.1', port: 9999});
      e.run({path: '/blah', requests: 999999999999, concurrent: 2}, function (stats) {
            assert.ok(requests > 0, "should run some requests");
            assert.ok(stats.totalTime >= 900, "total time should be about 1 second " + stats.totalTime);
            done();
          }
      );
      setTimeout(function () {
        e.stop = true;
      }, 1000);
    });
    it("can report different status codes", function (done) {
      statusCodes = [200, 404, 500];
      var e = new exerciser.Exerciser({host: '127.0.0.1', port: 9999});
      e.run({path: '/blah', requests: 99, concurrent: 1}, function (stats) {
            assert.equal(stats.successful, 33, "should report how many requests were succesful");
            assert.equal(stats.statusCodes[200], 33);
            assert.equal(stats.statusCodes[404], 33);
            assert.equal(stats.statusCodes[500], 33);
            assert.ok(stats.statusCodes[501] === undefined, "status codes that did not occur should not be set at all");
            assert.equal(stats.times.length, 99, "should report access times for all requests");
            done();
          }
      )
    });
    it("counts redirects as success", function (done) {
      statusCodes = [307, 302];
      var e = new exerciser.Exerciser({host: '127.0.0.1', port: 9999});
      e.run({path: '/blah', requests: 2, concurrent: 1}, function (stats) {
            assert.equal(stats.successful, 2, "should report how many requests were succesful");
            assert.equal(stats.totalErrors, 0, "should report how many requests were succesful");
            done();
          }
      )
    });
    it("can set headers", function (done) {
      var e = new exerciser.Exerciser({host: '127.0.0.1', port: 9999});
      e.run({path: '/blah', requests: 1, headers: {"Cookie": "cookie1=v1, cookie2=v2"}}, function () {
            assert.deepEqual(headers["cookie"], "cookie1=v1, cookie2=v2");
            done();
          }
      )
    });
    it("can handle timeouts", function (done) {
      statusCodes = [200, 0];
      var e = new exerciser.Exerciser({host: '127.0.0.1', port: 9999});
      e.run({path: '/blah', requests: 10, timeout: 20, concurrent: 1}, function (stats) {
            assert.ok(stats.successful >= 3, "should report how many requests were succesful");
            assert.ok(stats.statusCodes.timeout >= 3, "should report how many requests were timeouts:" + stats.statusCodes.timeout);
            assert.ok(stats.totalErrors >= 3, "should report the total number of errors");
            assert.equal(stats.times.length, 10, "should report access times for all requests");
            done();
          }
      )
    });
    it("has a command line interface", function (done) {
      childProcess.exec(__dirname + "/../../bin/exerciser test/integration/urls.txt localhost:9999 3 1", function (error) {
        assert.equal(requests, 3, "should use number of requests from commandline");
        assert.ifError(error);
        done();
      });
    });
    it("command line interface can write json file", function (done) {
      childProcess.exec(__dirname + "/../../bin/exerciser test/integration/urls.txt localhost:9999 1 1 results.json", function () {
        JSON.parse(fs.readFileSync("results.json"));
        done();
      });
    });
    it("command line interface returns non zero for error", function (done) {
      statusCodes = [500];
      childProcess.exec(__dirname + "/../../bin/exerciser test/integration/urls.txt localhost:9999 1 1", function (error) {
        assert.ok(error.code != 0);
        done();
      });
    });
    it("command line interface is usable as a lib", function (done) {
      exerciser.Exerciser.cli('127.0.0.1', 9999, ['/'], 100, 10, function () {
        done();
      });
    });
  });
  describe("POST Requests", function () {
    it("can send post requests", function (done) {
      svr = http.createServer(function (req, res) {
        assert.equal(req.method, 'POST');
        req.on("data", function (chunk) {
          assert.equal("lol, I'm a post body", chunk);
          res.end();
        });
      });
      svr.listen(9999);

      var e = new exerciser.Exerciser({host: '127.0.0.1', port: 9999});
      e.run({path: '/blah', requests: 10, body: "lol, I'm a post body"}, function () {
            done();
          }
      )
    });
  });
  afterEach(function (done) {
    svr.close();
    done();
  });
});
