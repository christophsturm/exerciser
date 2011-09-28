require.paths.push(__dirname + '/../../lib');

var nodeUnit = require("nodeunit"),
    exerciser = require("exerciser"),
    http = require("http"),
    sys = require("sys"),
    assert = require("assert");


module.exports = nodeUnit.testCase({

  setUp: function (callback) {
      requests=0;
      svr = http.createServer(function (req, res) {
          var statusCode = statusCodes[requests%statusCodes.length];
          if (statusCode) { // for status code 0 we'll just let the request timeout
              res.writeHead(statusCode, {'Content-Type': 'text/plain'});
              res.end();
          }
          requests++;
      });
      svr.listen(9999);
      timeout = setTimeout(function () {assert.fail(null,null, "timeout"); },1000);
    callback();
  },
  "can run parallel http requests and collect stats": function(assert) {
      statusCodes=[200];
      e = new exerciser.Exerciser({host:'127.0.0.1',port:9999});
      e.run('/blah',100,2, function(stats) {
            assert.equals(requests,100,  "should run the correct number of requests");
            assert.equal(stats.successful, 100, "should report how many requests were succesful");
            assert.equal(stats.times.length, 100, "should report access times for all requests");
            assert.done();
          }
      )
  },
    "can report different status codes": function(assert) {
        statusCodes=[200,404,500];
        e = new exerciser.Exerciser({host:'127.0.0.1',port:9999});
        e.run('/blah',99,1, function(stats) {

              // right now we possibly make more requests than specified, who cares :)

              assert.equal(stats.successful, 33, "should report how many requests were succesful");
              assert.equals(stats.statusCodes[200], 33);
              assert.equals(stats.statusCodes[404], 33);
              assert.equals(stats.statusCodes[500], 33);
              assert.equal(stats.times.length, 99, "should report access times for all requests");
              assert.done();
            }
        )
    },
    "can handle timeouts": function(assert) {
        statusCodes=[200,0];
        e = new exerciser.Exerciser({host:'127.0.0.1',port:9999});
        e.run('/blah',10,1, function(stats) {

              // right now we possibly make more requests than specified, who cares :)

              assert.equal(stats.successful, 5, "should report how many requests were succesful");
              assert.equal(stats.timeouts, 5, "should report how many requests were timeouts");
              assert.equal(stats.times.length, 10, "should report access times for all requests");
              assert.done();
            }
        )
    },

  tearDown: function(callback) {
      clearTimeout(timeout);
      svr.close();
      callback();

  }
});