"use strict";

var http = require("http");

var Exerciser = function(options) {
    this.options=options;
};


Exerciser.prototype.run = function(options,callback) {
    var path=options.path,requests=options.requests,concurrent=options.concurrent,timeout=options.timeout,
        o = this.options, pending=requests, i,times=[], statusCodes={},testStartTime,totalErrors=0,succesful=0;
    if (concurrent === undefined) concurrent = 1;
    if (timeout === undefined) timeout=1000;
    testStartTime = new Date().getTime();
    var doRequest=function() {
        var requestStartTime = new Date().getTime();
        var handler=function(res) {
            clearTimeout(timeoutTimer);
            times.push(new Date().getTime()-requestStartTime);
            if (res) {
                var sc=res.statusCode;
                if (sc >= 200 && sc < 400)
                    succesful++;
                statusCodes[sc] = statusCodes[sc] ? statusCodes[sc]+1 : 1;
            }

            if (--pending>=concurrent)
                process.nextTick(doRequest);
            if (!pending)
                callback({statusCodes:statusCodes,
                          successful:succesful,
                          times:times,
                          totalErrors:totalErrors,
                          totalTime:new Date().getTime()-testStartTime});
        };
        var timeoutTimer=setTimeout(function() {
            req.abort();
            totalErrors++;
            handler({statusCode:"timeout"});
        },timeout);
        var req = http.get({ host:o.host,port:o.port,path:path,headers:options.headers,agent:false},function(res) {
          res.on("end", function () {
            handler(res);
          });

        });
        req.on("error", function(e) {
            totalErrors++;
            handler({statusCode:e.message});
        });
    };
    for (i=0;i<concurrent;i++)
        process.nextTick(doRequest);
};

Exerciser.cli = function(host, port,lines, requests, concurrent, callback, silent) {
  var pathStats={},hadErrors=false;

  var e = new Exerciser({host:host,port:port});
  var currentLine=0,totalLines=lines.length;
  var handleLine=function() {
    var line=lines[currentLine],
        headers,
        pathAndHeaders=line.split(/\s/);
    if (pathAndHeaders[1])
      headers=JSON.parse(pathAndHeaders[1]);
    var path = pathAndHeaders[0];
    e.run({path:path,requests:requests,concurrent:concurrent,headers:headers}, function(stats) {
      stats.rps=requests/stats.totalTime*1000;
      stats.times=undefined;
      pathStats[path]=stats;
      if (!silent || requests != stats.successful)
        console.log(path+ "\t"+stats.totalTime+"\t\t"+Math.round(stats.rps));
      if (requests != stats.successful) {
        console.log("status codes: %j",stats.statusCodes);
        hadErrors=true;
      }
      if (++currentLine<totalLines)
        handleLine();
      else {
        callback(hadErrors, pathStats);
      }
    });
  };
handleLine();

};

exports.Exerciser = Exerciser;