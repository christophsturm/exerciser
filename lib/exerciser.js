var http = require("http"),
    sys = require("sys");

var Exerciser = function(options) {
    this.options=options;

};

Exerciser.prototype.run = function(callback) {
    var o = this.options, pending=this.paths.length;
    this.paths.forEach(function(path) {
        http.get({ host:o.host,port:o.port,path:path},function() {
            if (--pending) callback();
        });
    },this);
};

exports.Exerciser = Exerciser;