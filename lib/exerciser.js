var http = require("http"),
    sys = require("sys");

var Exerciser = function(options) {
    this.options=options;
};


Exerciser.prototype.run = function(options,callback) {
    var path=options.path,requests=options.requests,concurrent=options.concurrent,timeout=options.timeout,
        o = this.options, pending=requests, i,times=[], statusCodes={},timeouts=0,testStartTime;
    if (concurrent === undefined) concurrent = 1;
    if (timeout === undefined) timeout=1000;
    testStartTime = new Date().getTime();
    var doRequest=function() {
        var requestStartTime = new Date().getTime();
        var handler=function(res) {
            clearTimeout(timeoutTimer);
            times.push(new Date().getTime()-requestStartTime);
            if (res)
                statusCodes[res.statusCode] = statusCodes[res.statusCode] ? statusCodes[res.statusCode]+1 : 1;
            else
                timeouts++;

            if (--pending>=concurrent)
                process.nextTick(doRequest);
            if (!pending)
                callback({statusCodes:statusCodes,
                          successful:statusCodes[200],
                          times:times,
                          timeouts:timeouts,
                          totalTime:new Date().getTime()-testStartTime});
        };
        var timeoutTimer=setTimeout(function() {
            req.abort();
            handler(null);
        },timeout);
        var req = http.get({ host:o.host,port:o.port,path:path,headers:options.headers},handler);
        req.on("error", function(err) {
                sys.debug(err);
                handler(null);
            });
    };
    for (i=0;i<concurrent;i++)
        process.nextTick(doRequest);

};

exports.Exerciser = Exerciser;