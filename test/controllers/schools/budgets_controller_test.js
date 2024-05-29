var Paths = require("root/lib/paths")
var DateFns = require("date-fns")
var ValidAccount = require("root/test/valid_account")
var ValidSchool = require("root/test/valid_school")
var ValidBudget = require("root/test/valid_budget")
var ValidIdea = require("root/test/valid_idea")
var accountsDb = require("root/db/accounts_db")
var schoolsDb = require("root/db/schools_db")
var budgetsDb = require("root/db/budgets_db")
var votersDb = require("root/db/voters_db")
var ideasDb = require("root/db/ideas_db")
var {createSession} = require("root/test/fixtures")
var {createTeacher} = require("root/test/fixtures")
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
		describe("given budget before voting", function() {
			beforeEach(function*() {
				this.school = yield schoolsDb.create(new ValidSchool)

				this.budget = yield budgetsDb.create(new ValidBudget({
					school_id: this.school.id
				}))
			})

			it("must render given no ideas", function*() {
				var res = yield this.request(Paths.budgetPath(this.school, this.budget))
				res.statusCode.must.equal(200)
			})

			it("must render idea author names if signed in", function*() {
				var idea = yield ideasDb.create(new ValidIdea({
					budget_id: this.budget.id,
					account_id: (yield accountsDb.create(new ValidAccount)).id,
					author_names: "John Smithes"
				}))

				var account = yield accountsDb.create(new ValidAccount)

				var res = yield this.request(
					Paths.budgetPath(this.school, this.budget),
					{session: yield createSession(account)}
				)

				res.statusCode.must.equal(200)
				res.body.must.include(idea.author_names)
			})

			it("must not render idea author names if not signed in", function*() {
				var idea = yield ideasDb.create(new ValidIdea({
					budget_id: this.budget.id,
					account_id: (yield accountsDb.create(new ValidAccount)).id,
					author_names: "John Smithes"
				}))

				var res = yield this.request(Paths.budgetPath(this.school, this.budget))
				res.statusCode.must.equal(200)
				res.body.must.not.include(idea.author_names)
			})
		})

		describe("given budget in voting", function() {
			beforeEach(function*() {
				this.school = yield schoolsDb.create(new ValidSchool)

				this.budget = yield budgetsDb.create(new ValidBudget({
					school_id: this.school.id,
					voting_starts_at: DateFns.startOfDay(new Date),
					voting_ends_at: DateFns.endOfDay(new Date)
				}))
			})


			it("must render given no ideas", function*() {
				var res = yield this.request(Paths.budgetPath(this.school, this.budget))
				res.statusCode.must.equal(200)
			})

			it("must render idea author names if signed in", function*() {
				var idea = yield ideasDb.create(new ValidIdea({
					budget_id: this.budget.id,
					account_id: (yield accountsDb.create(new ValidAccount)).id,
					author_names: "John Smithes"
				}))

				var account = yield accountsDb.create(new ValidAccount)

				var res = yield this.request(
					Paths.budgetPath(this.school, this.budget),
					{session: yield createSession(account)}
				)

				res.statusCode.must.equal(200)
				res.body.must.include(idea.author_names)
			})

			it("must not render idea author names if not signed in", function*() {
				var idea = yield ideasDb.create(new ValidIdea({
					budget_id: this.budget.id,
					account_id: (yield accountsDb.create(new ValidAccount)).id,
					author_names: "John Smithes"
				}))

				var res = yield this.request(Paths.budgetPath(this.school, this.budget))
				res.statusCode.must.equal(200)
				res.body.must.not.include(idea.author_names)
			})
		})

		describe("given budget after voting", function() {
			beforeEach(function*() {
				this.school = yield schoolsDb.create(new ValidSchool)

				this.budget = yield budgetsDb.create(new ValidBudget({
					school_id: this.school.id,
					voting_starts_at: DateFns.startOfDay(new Date),
					voting_ends_at: new Date
				}))
			})

			it("must render given no ideas", function*() {
				var res = yield this.request(Paths.budgetPath(this.school, this.budget))
				res.statusCode.must.equal(200)
			})

			it("must render idea author names if signed in", function*() {
				var idea = yield ideasDb.create(new ValidIdea({
					budget_id: this.budget.id,
					account_id: (yield accountsDb.create(new ValidAccount)).id,
					author_names: "John Smithes"
				}))

				var account = yield accountsDb.create(new ValidAccount)

				var res = yield this.request(
					Paths.budgetPath(this.school, this.budget),
					{session: yield createSession(account)}
				)

				res.statusCode.must.equal(200)
				res.body.must.include(idea.author_names)
			})

			it("must not render idea author names if not signed in", function*() {
				var idea = yield ideasDb.create(new ValidIdea({
					budget_id: this.budget.id,
					account_id: (yield accountsDb.create(new ValidAccount)).id,
					author_names: "John Smithes"
				}))

				var res = yield this.request(Paths.budgetPath(this.school, this.budget))
				res.statusCode.must.equal(200)
				res.body.must.not.include(idea.author_names)
			})
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
