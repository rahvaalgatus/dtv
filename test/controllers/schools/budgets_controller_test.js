var Paths = require("root/lib/paths")
var ValidSchool = require("root/test/valid_school")
var ValidBudget = require("root/test/valid_budget")
var schoolsDb = require("root/db/schools_db")
var budgetsDb = require("root/db/budgets_db")
var teachersDb = require("root/db/teachers_db")
var votersDb = require("root/db/voters_db")
var outdent = require("root/lib/outdent")
var sql = require("sqlate")

describe("SchoolBudgetsController", function() {
	require("root/test/web")()
	require("root/test/db")()

	describe("GET /", function() {
		it("must redirect to school page", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			var res = yield this.request(Paths.budgetsPath(school))
			res.statusCode.must.equal(302)
			res.headers.location.must.equal(Paths.schoolPath(school))
		})
	})

	describe("POST", function() {
		require("root/test/fixtures").csrf()
		require("root/test/fixtures").account()

		it("must create budget", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			yield createTeacher(school, this.account)

			var res = yield this.request(Paths.budgetsPath(school), {
				method: "POST",

				form: {
					title: "Hogwarts Wand Fest",
					description: "Magical.",
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
			res.statusMessage.must.equal("Budget Created")

			var budgets = yield budgetsDb.search(sql`SELECT * FROM budgets`)
			budgets.length.must.equal(1)
			var budget = budgets[0]

			res.headers.location.must.equal(Paths.budgetPath(school, budget))

			budget.must.eql({
				id: budget.id,
				school_id: school.id,
				title: "Hogwarts Wand Fest",
				description: "Magical.",
				created_at: budget.created_at,
				voting_starts_at: new Date(2015, 5, 18),
				voting_ends_at: new Date(2015, 5, 22)
			})

			yield votersDb.search(sql`SELECT * FROM voters`).must.then.eql([
				{budget_id: budget.id, country: "EE", personal_id: "38706180001"},
				{budget_id: budget.id, country: "EE", personal_id: "38706180002"},
				{budget_id: budget.id, country: "EE", personal_id: "38706180003"}
			])
		})

		it("must err if not teacher", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var res = yield this.request(Paths.budgetsPath(school), {
				method: "POST",
				form: {name: "Hogwarts"}
			})

			res.statusCode.must.equal(403)
			res.statusMessage.must.equal("Not a Teacher")
			yield budgetsDb.search(sql`SELECT * FROM budgets`).must.then.be.empty()
		})
	})

	describe("GET /new", function() {
		require("root/test/fixtures").csrf()
		require("root/test/fixtures").account()

		it("must render", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			yield createTeacher(school, this.account)
			var res = yield this.request(Paths.createBudgetPath(school))
			res.statusCode.must.equal(200)
		})
	})

	describe("GET /:id", function() {
		it("must render given no ideas", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var res = yield this.request(Paths.budgetPath(school, budget))
			res.statusCode.must.equal(200)
		})
	})

	describe("PUT /:id", function() {
		require("root/test/fixtures").csrf()
		require("root/test/fixtures").account()

		it("must update budget", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			yield createTeacher(school, this.account)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var res = yield this.request(Paths.budgetPath(school, budget), {
				method: "PUT",

				form: {
					title: "Hogwarts Wand Fest",
					description: "Magical.",
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
			res.statusMessage.must.equal("Budget Updated")
			res.headers.location.must.equal(Paths.updateBudgetPath(school, budget))

			yield budgetsDb.read(budget.id).must.then.eql({
				__proto__: budget,
				title: "Hogwarts Wand Fest",
				description: "Magical.",
				voting_starts_at: new Date(2015, 5, 18),
				voting_ends_at: new Date(2015, 5, 22)
			})

			yield votersDb.search(sql`SELECT * FROM voters`).must.then.eql([
				{budget_id: budget.id, country: "EE", personal_id: "38706180001"},
				{budget_id: budget.id, country: "EE", personal_id: "38706180002"},
				{budget_id: budget.id, country: "EE", personal_id: "38706180003"}
			])
		})

		it("must err if not teacher", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var res = yield this.request(Paths.budgetPath(school, budget), {
				method: "PUT",
				form: {name: "Hogwarts"}
			})

			res.statusCode.must.equal(403)
			res.statusMessage.must.equal("Not a Teacher")
			yield budgetsDb.read(budget.id).must.then.eql(budget)
		})
	})

	describe("GET /:id/edit", function() {
		require("root/test/fixtures").csrf()
		require("root/test/fixtures").account()

		it("must render", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			yield createTeacher(school, this.account)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var res = yield this.request(Paths.updateBudgetPath(school, budget))
			res.statusCode.must.equal(200)
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
