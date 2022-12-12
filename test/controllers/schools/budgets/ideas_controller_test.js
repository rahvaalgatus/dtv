var Paths = require("root/lib/paths")
var ValidSchool = require("root/test/valid_school")
var ValidIdea = require("root/test/valid_idea")
var ValidBudget = require("root/test/valid_budget")
var ValidAccount = require("root/test/valid_account")
var schoolsDb = require("root/db/schools_db")
var budgetsDb = require("root/db/budgets_db")
var accountsDb = require("root/db/accounts_db")
var teachersDb = require("root/db/teachers_db")
var ideasDb = require("root/db/ideas_db")
var votersDb = require("root/db/voters_db")

describe("IdeasController", function() {
	require("root/test/web")()
	require("root/test/db")()
	require("root/test/fixtures").csrf()
	require("root/test/fixtures").account()

	describe("GET /:id", function() {
		it("must render", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var idea = yield ideasDb.create(new ValidIdea({
				budget_id: budget.id,
				account_id: this.account.id
			}))

			var res = yield this.request(Paths.ideaPath(school, idea))
			res.statusCode.must.equal(200)
		})
	})

	describe("GET /new", function() {
		it("must render if teacher", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			yield createTeacher(school, this.account)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var res = yield this.request(Paths.createIdeaPath(school, budget))
			res.statusCode.must.equal(200)
		})

		it("must render if voter", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			createVoter(budget, this.account)
			var res = yield this.request(Paths.createIdeaPath(school, budget))
			res.statusCode.must.equal(200)
		})

		it("must err if neither teacher nor voter", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var res = yield this.request(Paths.createIdeaPath(school, budget))
			res.statusCode.must.equal(403)
			res.statusMessage.must.equal("Not Permitted to Create Ideas")
		})
	})

	describe("GET /:id", function() {
		it("must render if author", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var idea = yield ideasDb.create(new ValidIdea({
				budget_id: budget.id,
				account_id: this.account.id
			}))

			var res = yield this.request(Paths.ideaPath(school, idea))
			res.statusCode.must.equal(200)
		})
	})

	describe("GET /:id/edit", function() {
		it("must render if author", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var idea = yield ideasDb.create(new ValidIdea({
				budget_id: budget.id,
				account_id: this.account.id
			}))

			var res = yield this.request(Paths.updateIdeaPath(school, idea))
			res.statusCode.must.equal(200)
		})

		it("must err if not author", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var idea = yield ideasDb.create(new ValidIdea({
				budget_id: budget.id,
				account_id: (yield accountsDb.create(new ValidAccount)).id
			}))

			var res = yield this.request(Paths.updateIdeaPath(school, idea))
			res.statusCode.must.equal(403)
			res.statusMessage.must.equal("Not Idea Author")
		})

		it("must err if not author but teacher", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			yield createTeacher(school, this.account)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var idea = yield ideasDb.create(new ValidIdea({
				budget_id: budget.id,
				account_id: (yield accountsDb.create(new ValidAccount)).id
			}))

			var res = yield this.request(Paths.updateIdeaPath(school, idea))
			res.statusCode.must.equal(403)
			res.statusMessage.must.equal("Not Idea Author")
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

function createVoter(budget, account) {
	return votersDb.create({
		budget_id: budget.id,
		country: account.country,
		personal_id: account.personal_id
	})
}
