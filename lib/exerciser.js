var http = require("http"),
    sys = require("sys");

var Exerciser = function(options) {
    this.options=options;
};

Exerciser.prototype.run = function(path,requests,callback) {

    var o = this.options, pending=requests, i,successful=0;
    for (i=0;i<requests;i++) {
        http.get({ host:o.host,port:o.port,path:path},function(res) {
            if (res.statusCode == 200)
                successful++;
            if (!--pending) callback({successful:successful});
        }).on("error", function() {
                sys.log("error!");
            });
    }

};

exports.Exerciser = Exerciser;