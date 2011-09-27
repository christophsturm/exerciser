var http = require("http"),
    sugar = require("sugar"),
    sys = require("sys");

var Exerciser = function(options) {
    this.options=Object.extended(options);

};

Exerciser.prototype.run = function(callback) {
    this.paths.each(function(path) {
        sys.log(this);
        http.get(this.options.merge({path:path}),callback);
        return true;
    }.bind(this));
};

exports.Exerciser = Exerciser;