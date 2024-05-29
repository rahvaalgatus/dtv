var Paths = require("root/lib/paths")
var ValidSchool = require("root/test/valid_school")
var ValidIdea = require("root/test/valid_idea")
var ValidBudget = require("root/test/valid_budget")
var ValidAccount = require("root/test/valid_account")
var accountsDb = require("root/db/accounts_db")
var schoolsDb = require("root/db/schools_db")
var budgetsDb = require("root/db/budgets_db")
var ideasDb = require("root/db/ideas_db")
var votersDb = require("root/db/voters_db")
var {createSession} = require("root/test/fixtures")
var {createTeacher} = require("root/test/fixtures")

describe("IdeasController", function() {
	require("root/test/web")()
	require("root/test/db")()
	require("root/test/fixtures").csrf()

	describe("GET /:id", function() {
		it("must render", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var idea = yield ideasDb.create(new ValidIdea({
				budget_id: budget.id,
				account_id: (yield accountsDb.create(new ValidAccount)).id
			}))

			var res = yield this.request(Paths.ideaPath(school, idea))
			res.statusCode.must.equal(200)
		})

		it("must render if signed in as author", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var author = yield accountsDb.create(new ValidAccount)

			var idea = yield ideasDb.create(new ValidIdea({
				budget_id: budget.id,
				account_id: author.id
			}))

			var res = yield this.request(Paths.ideaPath(school, idea), {
				session: yield createSession(author)
			})

			res.statusCode.must.equal(200)
		})

		it("must render author names if signed in", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var idea = yield ideasDb.create(new ValidIdea({
				budget_id: budget.id,
				account_id: (yield accountsDb.create(new ValidAccount)).id,
				author_names: "John Smithes"
			}))

			var account = yield accountsDb.create(new ValidAccount)

			var res = yield this.request(Paths.ideaPath(school, idea), {
				session: yield createSession(account)
			})

			res.statusCode.must.equal(200)
			res.body.must.include(idea.author_names)
		})

		it("must not render author names if not signed in", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var idea = yield ideasDb.create(new ValidIdea({
				budget_id: budget.id,
				account_id: (yield accountsDb.create(new ValidAccount)).id,
				author_names: "John Smithes"
			}))

			var res = yield this.request(Paths.ideaPath(school, idea))
			res.statusCode.must.equal(200)
			res.body.must.not.include(idea.author_names)
		})
	})

	describe("GET /new", function() {
		require("root/test/fixtures").account()

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

	describe("GET /:id/edit", function() {
		require("root/test/fixtures").account()

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

function createVoter(budget, account) {
	return votersDb.create({
		budget_id: budget.id,
		country: account.country,
		personal_id: account.personal_id
	})
}
