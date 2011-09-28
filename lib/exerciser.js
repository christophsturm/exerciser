var http = require("http"),
    sys = require("sys");

var Exerciser = function(options) {
    this.options=options;
};

Exerciser.prototype.run = function(path,requests,callback) {
    var o = this.options, pending=requests, i;
    for (i=0;i<requests;i++) {
        http.get({ host:o.host,port:o.port,path:path},function(res) {
            if (!--pending) callback();
        }).on("error", function() {
                sys.log("error!");
            });
    }

};

exports.Exerciser = Exerciser;