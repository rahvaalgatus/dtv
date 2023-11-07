var _ = require("root/lib/underscore")
var Config = require("root/config")
var ValidSchool = require("root/test/valid_school")
var schoolsDb = require("root/db/schools_db")
var parseDom = require("root/lib/dom").parse
var {parseCookies} = require("root/test/web")

describe("HomeController", function() {
	require("root/test/web")()
	require("root/test/db")()
	require("root/test/fixtures").csrf()

	describe("GET /eelarve", function() {
		it("must render given no schools in default Estonian", function*() {
			var res = yield this.request("/eelarve")
			res.statusCode.must.equal(200)

			var dom = parseDom(res.body)
			dom.documentElement.lang.must.equal("et")
			dom.body.querySelector("#schools").children.length.must.equal(0)
		})

		it("must render given no schools in English", function*() {
			var res = yield this.request("/eelarve", {
				cookies: {[Config.languageCookieName]: "en"}
			})

			res.statusCode.must.equal(200)

			var dom = parseDom(res.body)
			dom.documentElement.lang.must.equal("en")
			dom.body.querySelector("#schools").children.length.must.equal(0)
		})

		it("must render schools", function*() {
			yield schoolsDb.create([
				new ValidSchool({name: "School of Hard Knocks"}),
				new ValidSchool({name: "Hogwarts"}),
				new ValidSchool({name: "Springfield High"})
			])

			var res = yield this.request("/eelarve")
			res.statusCode.must.equal(200)

			var dom = parseDom(res.body)
			var el = dom.body.querySelector("#schools")

			_.map(el.children, "textContent").must.eql([
				"Hogwarts",
				"School of Hard Knocks",
				"Springfield High"
			])
		})
	})

	describe("PUT /language", function() {
		beforeEach(function() { Config.languageCookieDomain = null })

		it("must set the language cookie", function*() {
			var res = yield this.request("/language", {
				method: "PUT",
				form: {language: "en"}
			})

			res.statusCode.must.equal(303)
			res.statusMessage.must.equal("Language Updated")
			res.headers.location.must.equal("/")

			var languageCookie = parseCookies(res.headers["set-cookie"]).language
			languageCookie.value.must.equal("en")
			languageCookie.maxAge.must.equal(365 * 86400)
			languageCookie.httpOnly.must.be.true()
		})

		it("must set the language cookie on separate domain", function*() {
			Config.languageCookieDomain = "rahvaalgatus.test"

			var res = yield this.request("/language", {
				method: "PUT",
				form: {language: "en"}
			})

			res.statusCode.must.equal(303)
			res.statusMessage.must.equal("Language Updated")
			res.headers.location.must.equal("/")

			var languageCookie = parseCookies(res.headers["set-cookie"]).language
			languageCookie.value.must.equal("en")
			languageCookie.domain.must.equal("rahvaalgatus.test")
			languageCookie.maxAge.must.equal(365 * 86400)
			languageCookie.httpOnly.must.be.true()
		})

		it("must delete the language cookie from current domain", function*() {
			Config.languageCookieDomain = "rahvaalgatus.test"

			var res = yield this.request("/language", {
				method: "PUT",
				cookies: {[Config.languageCookieName]: "en"},
				form: {language: "en"}
			})

			res.statusCode.must.equal(303)
			res.statusMessage.must.equal("Language Updated")
			res.headers.location.must.equal("/")

			var languageCookies = parseCookies(res.headers["set-cookie"]).language
			languageCookies.must.be.an.array()
			languageCookies.must.have.length(2)

			languageCookies[0].value.must.equal("")
			languageCookies[0].must.have.property("domain", null)
			languageCookies[0].expires.must.eql(new Date(0))
			languageCookies[0].httpOnly.must.be.true()

			languageCookies[1].value.must.equal("en")
			languageCookies[1].domain.must.equal("rahvaalgatus.test")
			languageCookies[1].maxAge.must.equal(365 * 86400)
			languageCookies[1].httpOnly.must.be.true()
		})

		it("must redirect back to referrer", function*() {
			var res = yield this.request("/language", {
				method: "PUT",
				form: {language: "en"},
				headers: {referer: "/foo"}
			})

			res.statusCode.must.equal(303)
			res.statusMessage.must.equal("Language Updated")
			res.headers.location.must.equal("/foo")
		})
	})
})
