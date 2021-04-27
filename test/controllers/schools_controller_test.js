var ValidSchool = require("root/test/valid_school")
var FormData = require("form-data")
var schoolsDb = require("root/db/schools_db")
var teachersDb = require("root/db/teachers_db")
var votersDb = require("root/db/voters_db")
var outdent = require("root/lib/outdent")
var sql = require("sqlate")
var LOGO_SIZE_LIMIT = 128
var PNG = new Array(LOGO_SIZE_LIMIT + 1 + 1).join("_")

describe("SchoolsController", function() {
	require("root/test/web")()
	require("root/test/db")()

	describe("GET /", function() {
		it("must redirect to home page", function*() {
			var res = yield this.request("/schools")
			res.statusCode.must.equal(302)
			res.headers.location.must.equal("/")
		})
	})

	describe("PUT /:id", function() {
		require("root/test/fixtures").csrf()
		require("root/test/fixtures").account()

		it("must update school", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			yield createTeacher(school, this.account)

			var res = yield this.request(`/schools/${school.id}`, {
				method: "PUT",

				form: {
					name: "Hogwarts",
					description: "Magical.",
					background_color: "#ffaabb",
					foreground_color: "#deafbe",
					voting_starts_on: "2015-06-18",
					voting_ends_on: "2015-06-21",

					voters: outdent`
						38706180001
						38706180002
						38706180003
					`
				}
			})

			res.statusCode.must.equal(303)
			res.headers.location.must.equal(`/schools/${school.id}/edit`)

			yield schoolsDb.read(school.id).must.then.eql({
				__proto__: school,
				name: "Hogwarts",
				description: "Magical.",
				background_color: "#ffaabb",
				foreground_color: "#deafbe",
				voting_starts_at: new Date(2015, 5, 18),
				voting_ends_at: new Date(2015, 5, 22)
			})

			yield votersDb.search(sql`SELECT * FROM voters`).must.then.eql([
				{school_id: school.id, country: "EE", personal_id: "38706180001"},
				{school_id: school.id, country: "EE", personal_id: "38706180002"},
				{school_id: school.id, country: "EE", personal_id: "38706180003"}
			])
		})

		it("must render error if logo size too large", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			yield createTeacher(school, this.account)

			var form = new FormData

			form.append("logo", PNG, {
				filename: "image.png",
				contentType: "image/png"
			})

			var res = yield this.request(`/schools/${school.id}`, {
				method: "PUT",
				headers: form.getHeaders(),
				body: form.getBuffer()
			})

			res.statusCode.must.equal(422)
			res.statusMessage.must.equal("File Too Large")
		})
	})
})

function createTeacher(school, account) {
	return teachersDb.create({
		school_id: school.id,
		country: account.country,
		personal_id: account.personal_id
	})
}
