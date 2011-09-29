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
    for(i=100;i<600;i++)
        statusCodes[i]=0;
    testStartTime = new Date().getMilliseconds();
    var doRequest=function() {
        var requestStartTime = new Date().getMilliseconds();
        var handler=function(res) {
            clearTimeout(timeoutTimer);
            times.push(new Date().getMilliseconds()-requestStartTime);
            if (res)
                statusCodes[res.statusCode]++;
            else
                timeouts++;

            if (--pending>=concurrent)
                process.nextTick(doRequest);
            if (!pending)
                callback({statusCodes:statusCodes,
                          successful:statusCodes[200],
                          times:times,
                          timeouts:timeouts,
                          totalTime:new Date().getMilliseconds()-testStartTime});
        };
        var timeoutTimer=setTimeout(function() {
            req.abort();
            handler(null);
        },timeout);
        var req = http.get({ host:o.host,port:o.port,path:path},handler);
        req.on("error", function() {
                sys.debug("error");
            });
    };
    for (i=0;i<concurrent;i++)
        process.nextTick(doRequest);

};

exports.Exerciser = Exerciser;