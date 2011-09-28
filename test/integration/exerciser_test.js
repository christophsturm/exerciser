require.paths.push(__dirname + '/../../lib');

var nodeUnit = require("nodeunit"),
    exerciser = require("exerciser"),
    http = require("http"),
    assert = require("assert");


module.exports = nodeUnit.testCase({

  setUp: function (callback) {
      requests=0;
      svr = http.createServer(function (req, res) {
          requests++;
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end(req.url);
      });
      svr.listen(9999);
      timeout = setTimeout(function () {assert.fail(null,null, "timeout"); },10000);
    callback();
  },
  "can run http requests and collect stats": function(assert) {
      e = new exerciser.Exerciser({host:'127.0.0.1',port:9999});
      e.run('/blah',10,function(stats) {
            assert.equal(requests, 10, "should run 10 http request before calling callback");
            assert.equal(stats.successful, 10, "should report that it ran 10 succesful requests");
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