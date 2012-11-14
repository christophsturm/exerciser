"use strict";
var nodeUnit = require("nodeunit"),
    exerciser = require("../../lib/exerciser"),
    http = require("http"),
    childProcess = require("child_process"),
    fs = require("fs"),
    util = require('util'),
    assert = require("assert");


var requests , statusCodes, headers,timeout, svr;
svr = http.createServer(function (req, res) {
    headers=req.headers;
    var statusCode = statusCodes[requests%statusCodes.length];
    if (statusCode) { // for status code 0 we'll just let the request timeout
        res.writeHead(statusCode, {'Content-Type': 'text/plain'});
        res.end();
    }
    requests++;
});
svr.listen(9999);

module.exports = nodeUnit.testCase({

  setUp: function (callback) {
      requests=0;
      statusCodes=[200];
      timeout = setTimeout(function () {assert.fail(null,null, "timeout"); },5000);
    callback();
  },
  "can run parallel http requests and collect stats": function(assert) {
      var e = new exerciser.Exerciser({host:'127.0.0.1',port:9999});
      e.run({path:'/blah',requests:1000,concurrent:2}, function(stats) {
            assert.equals(requests,1000,  "should run the correct number of requests");
            assert.equal(stats.successful, 1000, "should report how many requests were succesful");
            assert.equal(stats.times.length, 1000, "should report access times for all requests");
            assert.ok(stats.totalTime > 0, "should report the total time for all requests");
            assert.done();
          }
      )
  },
  "can run until stopped": function(assert) {
    var e = new exerciser.Exerciser({host:'127.0.0.1',port:9999});
    e.run({path:'/blah',requests:999999999999,concurrent:2}, function(stats) {
          assert.ok(requests>0,  "should run some requests");
          assert.ok(stats.totalTime >= 1000, "total time should be about 1 second "+stats.totalTime  );
          assert.done();
        }
    );
    setTimeout(function(){e.stop=true;},1000);
  },
    "can report different status codes": function(assert) {
        statusCodes=[200,404,500];
        var e = new exerciser.Exerciser({host:'127.0.0.1',port:9999});
        e.run({path:'/blah',requests:99,concurrent:1}, function(stats) {
              assert.equal(stats.successful, 33, "should report how many requests were succesful");
              assert.equals(stats.statusCodes[200], 33);
              assert.equals(stats.statusCodes[404], 33);
              assert.equals(stats.statusCodes[500], 33);
              assert.ok(stats.statusCodes[501] === undefined, "status codes that did not occur should not be set at all");
              assert.equal(stats.times.length, 99, "should report access times for all requests");
              assert.done();
            }
        )
    },
    "counts redirects as success": function(assert) {
        statusCodes=[307,302];
        var e = new exerciser.Exerciser({host:'127.0.0.1',port:9999});
        e.run({path:'/blah',requests:2,concurrent:1}, function(stats) {
              assert.equal(stats.successful, 2, "should report how many requests were succesful");
              assert.equal(stats.totalErrors, 0, "should report how many requests were succesful");
              assert.done();
            }
        )
    },
    "can handle timeouts": function(assert) {
        statusCodes=[200,0];
        var e = new exerciser.Exerciser({host:'127.0.0.1',port:9999});
        e.run({path:'/blah',requests:10,timeout:20,concurrent:1}, function(stats) {
              assert.ok(stats.successful, 5, "should report how many requests were succesful");
              assert.equal(stats.statusCodes['timeout'], 5, "should report how many requests were timeouts");
              assert.equal(stats.totalErrors, 5, "should report the total number of errors");
              assert.equal(stats.times.length, 10, "should report access times for all requests");
              assert.done();
            }
        )
    },

    "can set headers": function(assert) {
        var e = new exerciser.Exerciser({host:'127.0.0.1',port:9999});
        e.run({path:'/blah',requests:1,headers:{"Cookie":"cookie1=v1, cookie2=v2"}}, function(stats) {
              assert.deepEqual(headers["cookie"],"cookie1=v1, cookie2=v2");
              assert.done();
            }
        )
    },

    "has a command line interface": function(assert) {
        childProcess.exec(__dirname+"/../../bin/exerciser test/integration/urls.txt localhost:9999 3 1", function(error,stdout,stderr) {
            assert.equal(requests,3,"should use number of requests from commandline");
            assert.ifError(error);
            assert.done();
        });
    },
    "command line interface can write json file": function(assert) {
        childProcess.exec(__dirname+"/../../bin/exerciser test/integration/urls.txt localhost:9999 1 1 results.json", function(error,stdout,stderr) {
            JSON.parse(fs.readFileSync("results.json"));
            assert.done();
        });
    },
    "command line interface returns non zero for error": function(assert) {
        statusCodes=[500];
        childProcess.exec(__dirname+"/../../bin/exerciser test/integration/urls.txt localhost:9999 1 1", function(error,stdout,stderr) {
            assert.ok(error.code != 0);
            assert.done();
        });
    },
    "command line interface is usable as a lib": function(assert) {
      exerciser.Exerciser.cli('127.0.0.1',9999,['/'],100, 10, function(err, stats) {
        assert.done();
      });
    },
  "the end" : function(assert) {
    svr.close();
    assert.done();
  },
  tearDown: function(callback) {
      clearTimeout(timeout);
      callback();

  }
});