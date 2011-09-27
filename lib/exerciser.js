var http = require("http"),
    sys = require("sys");

var Exerciser = function(options) {
    this.options=options;

};

Exerciser.prototype.run = function(callback) {
    var o = this.options;
    this.paths.forEach(function(path) {
        http.get({ host:o.host,port:o.port,path:path},callback);
    },this);
};

exports.Exerciser = Exerciser;