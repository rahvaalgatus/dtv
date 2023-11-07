var _ = require("root/lib/underscore")
var Http = require("http")
var Web = require("root/bin/web")
var Cookie = require("tough-cookie").Cookie
var {request} = require("./fixtures")
var fetchDefaults = require("fetch-defaults")

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

exports.parseCookies = function(header) {
	return _.mapValues(_.groupBy(header.map(Cookie.parse), "key"), (cookies) => (
		cookies.length > 1 ? cookies : cookies[0]
	))
}

function wait(obj, event) {
	return new Promise(obj.once.bind(obj, event))
}
