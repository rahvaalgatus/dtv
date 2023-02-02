var _ = require("root/lib/underscore")
var fetch = require("fetch-off/request")
var fetchDefaults = require("fetch-defaults")
var URL = "https://demokraatia.rahvaalgatus.ee"
var HEADERS = {headers: {"User-Agent": "DTV Tests"}}

if (/\bserver\b/.test(process.env.TEST_TAGS))
describe("https://kaasavkool.rahvaalgatus.ee", function() {
	this.timeout(5000)

	var request = fetchDefaults(
		fetch,
		"https://kaasavkool.rahvaalgatus.ee",
		HEADERS
	)

	_.each({
		"/": "/eelarve",
		"/help": "/eelarve/abi",
		"/help/": "/eelarve/abi",
		"/account": "/account",
		"/schools": "/koolid",
		"/schools/": "/koolid",
		"/schools/42": "/koolid/42/eelarved/42",
		"/schools/42/": "/koolid/42/eelarved/42",
		"/schools/42/ideas": "/koolid/42/eelarved/42",
		"/schools/42/ideas/": "/koolid/42/eelarved/42",
		"/schools/42/ideas/14": "/koolid/42/eelarved/42/ideed/14",
		"/schools/42/ideas/14/": "/koolid/42/eelarved/42/ideed/14",
		"/schools/42/paper-votes": "/koolid/42/eelarved/42/paberh%C3%A4%C3%A4led",
		"/schools/42/paper-votes/": "/koolid/42/eelarved/42/paberh%C3%A4%C3%A4led"
	}, function(to, from) {
		it(`must redirect ${from} to ${to}`, function*() {
			var res = yield request(from, {method: "HEAD"})
			res.statusCode.must.equal(301)
			res.headers.location.must.equal(URL + to)
		})
	})
})

if (/\bserver\b/.test(process.env.TEST_TAGS)) _.each({
	"http://demokraatia.rahvaalgatus.ee":
		"https://demokraatia.rahvaalgatus.ee",

	"http://idcard.demokraatia.rahvaalgatus.ee":
		"https://idcard.demokraatia.rahvaalgatus.ee",

	"http://eelarveldaja.rahvaalgatus.ee":
		"https://eelarveldaja.rahvaalgatus.ee",

	"http://kaasavkool.rahvaalgatus.ee":
		"https://kaasavkool.rahvaalgatus.ee",

	"http://idcard.kaasavkool.rahvaalgatus.ee":
		"https://idcard.kaasavkool.rahvaalgatus.ee",

	"https://idcard.kaasavkool.rahvaalgatus.ee":
		"https://kaasavkool.rahvaalgatus.ee",

	"https://eelarveldaja.rahvaalgatus.ee":
		"https://kaasavkool.rahvaalgatus.ee"
}, function(to, from) {
	describe(from, function() {
		mustRedirectTo(from, to)
	})
})

function mustRedirectTo(from, to) {
  var request = fetchDefaults(fetch, from, HEADERS)

	describe("/", function() {
		it("must redirect to " + to, function*() {
			var res = yield request("/", {method: "HEAD"})
			res.statusCode.must.equal(301)
			res.headers.location.must.equal(to + "/")
		})
	})

	describe("/foo/bar?42", function() {
		it("must redirect to same path on " + to, function*() {
			var res = yield request("/foo/bar?42", {method: "HEAD"})
			res.statusCode.must.equal(301)
			res.headers.location.must.equal(to + "/foo/bar?42")
		})
	})
}
