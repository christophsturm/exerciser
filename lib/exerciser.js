var http = require("http"),
    sys = require("sys");

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
                var sc=res.statusCode
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
        var req = http.get({ host:o.host,port:o.port,path:path,headers:options.headers},handler);
        req.on("error", function(e) {
            totalErrors++;
            handler({statusCode:e.message});
        });
    };
    for (i=0;i<concurrent;i++)
        process.nextTick(doRequest);

};

exports.Exerciser = Exerciser;