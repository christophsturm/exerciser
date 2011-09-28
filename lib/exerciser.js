var http = require("http"),
    sys = require("sys");

var Exerciser = function(options) {
    this.options=options;
};


Exerciser.prototype.run = function(path,requests,concurrent, callback) {

    var o = this.options, pending=requests, i,successful=0,times=[];

    var doRequest=function() {
        var start = new Date().getMilliseconds();
        http.get({ host:o.host,port:o.port,path:path},function(res) {
            times.push(new Date().getMilliseconds()-start);
            if (res.statusCode == 200)
                successful++;
            if (--pending)
                process.nextTick(doRequest);
            else
                callback({successful:successful,times:times});
        }).on("error", function() {
            });
    };
    while (concurrent--)
        process.nextTick(doRequest);

};

exports.Exerciser = Exerciser;