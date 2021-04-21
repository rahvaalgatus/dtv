var _ = require("root/lib/underscore")
var Http = require("http")
var Web = require("root/bin/web")
var fetchDefaults = require("fetch-defaults")

var request = require("fetch-off")
request = require("fetch-parse")(request, {"text/html": true})

request = _.wrap(request, function(request, url, opts) {
	return request(url, opts).then(nodeify)
})

exports = module.exports = function() {
	before(exports.listen)
	after(exports.close)
}

exports.listen = function*() {
	this.server = new Http.Server(Web)
	this.server.listen(0, "127.0.0.1")
	yield wait(this.server, "listening")

	this.url = "http://localhost:" + this.server.address().port
	this.request = fetchDefaults(request, this.url)
}

exports.close = function(done) {
	this.server.close(done)
}

function nodeify(res) {
	var msg = res.valueOf()
	if ("body" in res) msg.body = res.body
	return msg
}

function wait(obj, event) {
	return new Promise(obj.once.bind(obj, event))
}
