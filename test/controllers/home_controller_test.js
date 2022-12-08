var _ = require("root/lib/underscore")
var ValidSchool = require("root/test/valid_school")
var schoolsDb = require("root/db/schools_db")
var parseDom = require("root/lib/dom").parse

describe("HomeController", function() {
	require("root/test/web")()
	require("root/test/db")()

	describe("/eelarve", function() {
		it("must render given no schools", function*() {
			var res = yield this.request("/eelarve")
			res.statusCode.must.equal(200)

			var dom = parseDom(res.body)
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
})
