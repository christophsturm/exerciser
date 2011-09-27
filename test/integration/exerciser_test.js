require.paths.push(__dirname + '/../../lib');

nodeUnit = require("nodeunit");
exerciser = require("exerciser");
http = require("http");

module.exports = nodeUnit.testCase({

  setUp: function (callback) {
      requests=0;
      svr = http.createServer(function (req, res) {
          requests++;
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end(req.url);
      });
      svr.listen(9999);

    callback();
  },
  "can run http requests": function(assert) {
      e = new exerciser.Exerciser({host:'127.0.0.1',port:9999});
      e.paths = ['/blah'];
      e.requests = 1;
      e.run(function() {
            assert.equal(requests, 1, "should run 1 http request before calling callback");
            assert.done();
          }
      )
  },
  tearDown: function(callback) {
      svr.close();
      callback();
  }
});