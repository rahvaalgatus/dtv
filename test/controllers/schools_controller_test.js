var Paths = require("root/lib/paths")
var ValidSchool = require("root/test/valid_school")
var ValidBudget = require("root/test/valid_budget")
var ValidIdea = require("root/test/valid_idea")
var ValidAccount = require("root/test/valid_account")
var FormData = require("form-data")
var schoolsDb = require("root/db/schools_db")
var budgetsDb = require("root/db/budgets_db")
var teachersDb = require("root/db/teachers_db")
var ideasDb = require("root/db/ideas_db")
var accountsDb = require("root/db/accounts_db")
var LOGO_SIZE_LIMIT = 128
var PNG = new Array(LOGO_SIZE_LIMIT + 1 + 1).join("_")

describe("SchoolsController", function() {
	require("root/test/web")()
	require("root/test/db")()

	describe("GET /", function() {
		it("must redirect to home page", function*() {
			var res = yield this.request(Paths.schoolsPath)
			res.statusCode.must.equal(302)
			res.headers.location.must.equal("/")
		})
	})

	describe("GET /:id", function() {
		it("must redirect given only numeric id", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			var res = yield this.request(`/koolid/${school.id}`)
			res.statusCode.must.equal(308)
			res.headers.location.must.equal(Paths.schoolPath(school))
		})

		it("must redirect given different slug", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			var res = yield this.request(`/koolid/${school.id}-foo`)
			res.statusCode.must.equal(308)
			res.headers.location.must.equal(Paths.schoolPath(school))
		})

		it("must redirect with subpath and query given different slug",
			function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			var res = yield this.request(`/koolid/${school.id}-foo/bar?baz=qux`)
			res.statusCode.must.equal(308)
			res.headers.location.must.equal(Paths.schoolPath(school) + "/bar?baz=qux")
		})

		it("must not redirect given valid slug", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			var res = yield this.request(`/koolid/${school.id}-${school.slug}`)
			res.statusCode.must.equal(200)
		})

		it("must render given no budgets", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			var res = yield this.request(Paths.schoolPath(school))
			res.statusCode.must.equal(200)
		})

		it("must render given budgets", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			yield budgetsDb.create([
				new ValidBudget({school_id: school.id}),
				new ValidBudget({school_id: school.id}),
				new ValidBudget({school_id: school.id})
			])

			var res = yield this.request(Paths.schoolPath(school))
			res.statusCode.must.equal(200)
		})
	})

	describe("PUT /:id/edit", function() {
		require("root/test/fixtures").csrf()
		require("root/test/fixtures").account()

		it("must render", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			yield createTeacher(school, this.account)
			var res = yield this.request(Paths.updateSchoolPath(school))
			res.statusCode.must.equal(200)
		})
	})

	describe("PUT /:id", function() {
		require("root/test/fixtures").csrf()
		require("root/test/fixtures").account()

		it("must update school", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			yield createTeacher(school, this.account)

			var res = yield this.request(Paths.schoolPath(school), {
				method: "PUT",

				form: {
					name: "Hogwarts",
					description: "Magical.",
					background_color: "#ffaabb",
					foreground_color: "#deafbe"
				}
			})

			res.statusCode.must.equal(303)
			res.statusMessage.must.equal("School Updated")
			res.headers.location.must.equal(Paths.updateSchoolPath(school))

			yield schoolsDb.read(school.id).must.then.eql({
				__proto__: school,
				name: "Hogwarts",
				description: "Magical.",
				background_color: "#ffaabb",
				foreground_color: "#deafbe"
			})
		})

		it("must err if not teacher", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var res = yield this.request(Paths.schoolPath(school), {
				method: "PUT",
				form: {name: "Hogwarts"}
			})

			res.statusCode.must.equal(403)
			res.statusMessage.must.equal("Not a Teacher")
			yield schoolsDb.read(school.id).must.then.eql(school)
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

	describe("GET /ideed/:id", function() {
		it("must redirect to same school's budget's path", function*() {
			var account = yield accountsDb.create(new ValidAccount)
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var idea = yield ideasDb.create(new ValidIdea({
				budget_id: budget.id,
				account_id: account.id
			}))

			var schoolPath = Paths.schoolPath(school)
			var res = yield this.request(schoolPath + `/ideed/${idea.id}`)
			res.statusCode.must.equal(307)
			res.headers.location.must.equal(Paths.ideaPath(school, idea))
		})

		it("must respond with 404 if idea non-existent", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			var res = yield this.request(Paths.schoolPath(school) + `/ideed/42`)
			res.statusCode.must.equal(404)
			res.statusMessage.must.equal("Idea Not Found")
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
