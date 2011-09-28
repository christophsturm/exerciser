var http = require("http"),
    sys = require("sys");

var Exerciser = function(options) {
    this.options=options;
};


Exerciser.prototype.run = function(path,requests,concurrent, callback) {

    var o = this.options, pending=requests, i,successful=0,times=[], statusCodes={},timeouts=0;
    for(i=100;i<600;i++)
        statusCodes[i]=0;

    var doRequest=function() {
        var start = new Date().getMilliseconds();
        var handler=function(res) {
            clearTimeout(timeout);
            times.push(new Date().getMilliseconds()-start);
            if (res)
                statusCodes[res.statusCode]++;
            else
                timeouts++;

            if (--pending>=concurrent)
                process.nextTick(doRequest);
            if (!pending)
                callback({statusCodes:statusCodes, successful:statusCodes[200],times:times,timeouts:timeouts});
        };
        var timeout=setTimeout(function() {
            req.abort();
            handler(null);
        },100);
        var req = http.get({ host:o.host,port:o.port,path:path},handler);
        req.on("error", function() {
                sys.debug("error");
            });
    };
    for (i=0;i<concurrent;i++)
        process.nextTick(doRequest);

};

exports.Exerciser = Exerciser;