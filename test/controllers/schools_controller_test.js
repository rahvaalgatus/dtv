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
var {createTeacher} = require("root/test/fixtures")
var sql = require("sqlate")
var outdent = require("root/lib/outdent")
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

	describe("GET /new", function() {
		it("must respond with 401 if not signed in", function*() {
			var res = yield this.request(Paths.schoolsPath + "/new")
			res.statusCode.must.equal(401)
			res.statusMessage.must.equal("Unauthorized")
		})

		describe("as regular account", function() {
			require("root/test/fixtures").account()

			it("must respond with 403", function*() {
				var res = yield this.request(Paths.schoolsPath + "/new")
				res.statusCode.must.equal(403)
				res.statusMessage.must.equal("Not an Admin")
			})
		})

		describe("as admin", function() {
			require("root/test/fixtures").adminAccount()

			it("must respond with 403", function*() {
				var res = yield this.request(Paths.schoolsPath + "/new")
				res.statusCode.must.equal(200)
			})
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

	describe("POST /", function() {
		require("root/test/fixtures").csrf()

		it("must respond with 401 if not signed in", function*() {
			var res = yield this.request(Paths.schoolsPath, {method: "POST"})
			res.statusCode.must.equal(401)
			res.statusMessage.must.equal("Unauthorized")
		})

		describe("as regular account", function() {
			require("root/test/fixtures").account()

			it("must respond with 403", function*() {
			var res = yield this.request(Paths.schoolsPath, {method: "POST"})
				res.statusCode.must.equal(403)
				res.statusMessage.must.equal("Not an Admin")
			})
		})

		describe("as admin", function() {
			require("root/test/fixtures").adminAccount()

			it("must create school", function*() {
				var res = yield this.request(Paths.schoolsPath, {
					method: "POST",

					form: {
						name: "Hogwarts",
						slug: "hogwarts",
						description: "Magical.",
						background_color: "#ffaabb",
						foreground_color: "#deafbe",

						teachers: outdent`
							38706180001
							38706180002
							38706180003
						`
					}
				})

				res.statusCode.must.equal(303)
				res.statusMessage.must.equal("School Created")

				var school = yield schoolsDb.read(sql`SELECT * FROM schools`)
				res.headers.location.must.equal(Paths.schoolPath(school))

				school.must.eql(new ValidSchool({
					id: 1,
					name: "Hogwarts",
					slug: "hogwarts",
					description: "Magical.",
					background_color: "#ffaabb",
					foreground_color: "#deafbe"
				}))

				yield teachersDb.search(sql`SELECT * FROM teachers`).must.then.eql([
					{school_id: school.id, country: "EE", personal_id: "38706180001"},
					{school_id: school.id, country: "EE", personal_id: "38706180002"},
					{school_id: school.id, country: "EE", personal_id: "38706180003"}
				])
			})
		})
	})

	describe("GET /:id/edit", function() {
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

		describe("as regular account", function() {
			require("root/test/fixtures").account()

			it("must respond with 403", function*() {
				var school = yield schoolsDb.create(new ValidSchool)

				var res = yield this.request(Paths.schoolPath(school), {
					method: "PUT",
					form: {name: "Hogwarts"}
				})

				res.statusCode.must.equal(403)
				res.statusMessage.must.equal("Not a Teacher")
				yield schoolsDb.read(school.id).must.then.eql(school)
			})
		})

		describe("as teacher", function() {
			require("root/test/fixtures").account()

			it("must update school", function*() {
				var school = yield schoolsDb.create(new ValidSchool)
				yield createTeacher(school, this.account)

				var res = yield this.request(Paths.schoolPath(school), {
					method: "PUT",

					form: {
						name: "Hogwarts",
						slug: "notwarts",
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

			it("must not update slug nor teachers", function*() {
				var school = yield schoolsDb.create(new ValidSchool)
				var a = yield createTeacher(school, this.account)

				var b = yield createTeacher(
					school,
					yield accountsDb.create(new ValidAccount)
				)

				var c = yield createTeacher(
					school,
					yield accountsDb.create(new ValidAccount)
				)

				var res = yield this.request(Paths.schoolPath(school), {
					method: "PUT",

					form: {
						name: "Hogwarts",
						slug: "notwarts",
						description: "Magical.",

						teachers: outdent`
							38706180001
							38706180002
							38706180003
						`
					}
				})

				res.statusCode.must.equal(303)
				res.statusMessage.must.equal("School Updated")

				yield schoolsDb.read(school.id).must.then.eql({
					__proto__: school,
					name: "Hogwarts",
					description: "Magical."
				})

				yield teachersDb.search(sql`
					SELECT * FROM teachers
				`).must.then.eql([a, b, c])
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

		describe("as admin", function() {
			require("root/test/fixtures").adminAccount()

			it("must update school and teachers", function*() {
				var school = yield schoolsDb.create(new ValidSchool)

				var teacherA = yield accountsDb.create(new ValidAccount)
				var teacherB = yield accountsDb.create(new ValidAccount)
				yield createTeacher(school, teacherA)
				yield createTeacher(school, teacherB)

				var res = yield this.request(Paths.schoolPath(school), {
					method: "PUT",

					form: {
						name: "Hogwarts",
						slug: "notwarts",
						description: "Magical.",

						teachers: outdent`
							38706180001
							38706180002
							38706180003
						`
					}
				})

				res.statusCode.must.equal(303)
				res.statusMessage.must.equal("School Updated")
				res.headers.location.must.equal(Paths.updateSchoolPath(school))

				yield schoolsDb.read(school.id).must.then.eql({
					__proto__: school,
					name: "Hogwarts",
					slug: "notwarts",
					description: "Magical."
				})

				yield teachersDb.search(sql`SELECT * FROM teachers`).must.then.eql([
					{school_id: school.id, country: "EE", personal_id: "38706180001"},
					{school_id: school.id, country: "EE", personal_id: "38706180002"},
					{school_id: school.id, country: "EE", personal_id: "38706180003"}
				])
			})

			it("must not remove teachers from other schools", function*() {
				var school = yield schoolsDb.create(new ValidSchool)
				var otherSchool = yield schoolsDb.create(new ValidSchool)

				var otherTeacher = yield createTeacher(
					otherSchool,
					yield accountsDb.create(new ValidAccount)
				)

				yield createTeacher(school, yield accountsDb.create(new ValidAccount))

				var res = yield this.request(Paths.schoolPath(school), {
					method: "PUT",
					form: {teachers: "38706180001"}
				})

				res.statusCode.must.equal(303)
				res.statusMessage.must.equal("School Updated")

				yield schoolsDb.read(school.id).must.then.eql(school)
				yield teachersDb.search(sql`SELECT * FROM teachers`).must.then.eql([
					otherTeacher,
					{school_id: school.id, country: "EE", personal_id: "38706180001"},
				])
			})

			it("must permit slugs with Estonian characters", function*() {
				var school = yield schoolsDb.create(new ValidSchool)

				var res = yield this.request(Paths.schoolPath(school), {
					method: "PUT",
					form: {slug: "pähklimäe-gümnaasium"}
				})

				res.statusCode.must.equal(303)
				res.statusMessage.must.equal("School Updated")

				yield schoolsDb.read(school.id).must.then.eql({
					__proto__: school,
					slug: "pähklimäe-gümnaasium"
				})
			})
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
