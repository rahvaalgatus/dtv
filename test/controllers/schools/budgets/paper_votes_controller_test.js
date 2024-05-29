var Paths = require("root/lib/paths")
var ValidSchool = require("root/test/valid_school")
var ValidIdea = require("root/test/valid_idea")
var ValidBudget = require("root/test/valid_budget")
var schoolsDb = require("root/db/schools_db")
var budgetsDb = require("root/db/budgets_db")
var votersDb = require("root/db/voters_db")
var paperVotesDb = require("root/db/paper_votes_db")
var ideasDb = require("root/db/ideas_db")
var parseDom = require("root/lib/dom").parse
var {createTeacher} = require("root/test/fixtures")
var outdent = require("root/lib/outdent")
var sql = require("sqlate")

describe("PaperVotesController", function() {
	require("root/test/web")()
	require("root/test/db")()
	require("root/test/fixtures").csrf()
	require("root/test/fixtures").account()

	describe("GET /", function() {
		it("must render given no paper votes", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			yield createTeacher(school, this.account)

			var res = yield this.request(Paths.paperVotesPath(school, budget))
			res.statusCode.must.equal(200)

			var dom = parseDom(res.body)
			var table = dom.body.querySelector("#paper-votes")
			table.rows.length.must.equal(1)
		})
	})

	describe("POST /", function() {
		it("must create paper votes", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			yield createTeacher(school, this.account)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			yield votersDb.create([
				{budget_id: budget.id, country: "EE", personal_id: "38706180001"},
				{budget_id: budget.id, country: "EE", personal_id: "38706180002"},
				{budget_id: budget.id, country: "EE", personal_id: "38706180003"}
			])

			var ideas = yield ideasDb.create([
				new ValidIdea({budget_id: budget.id, account_id: this.account.id}),
				new ValidIdea({budget_id: budget.id, account_id: this.account.id})
			])

			var res = yield this.request(Paths.paperVotesPath(school, budget), {
				method: "PUT",

				form: {"paper-votes": outdent`
					38706180001, ${ideas[0].id}
					38706180002, ${ideas[1].id}
					38706180003, ${ideas[0].id}
				`}
			})

			res.statusCode.must.equal(303)
			res.statusMessage.must.equal("Paper Votes Updated")
			res.headers.location.must.equal(Paths.paperVotesPath(school, budget))

			yield paperVotesDb.search(sql`
				SELECT * FROM paper_votes ORDER BY voter_personal_id
			`).must.then.eql([{
				budget_id: budget.id,
				idea_id: ideas[0].id,
				voter_country: "EE",
				voter_personal_id: "38706180001"
			}, {
				budget_id: budget.id,
				idea_id: ideas[1].id,
				voter_country: "EE",
				voter_personal_id: "38706180002"
			}, {
				budget_id: budget.id,
				idea_id: ideas[0].id,
				voter_country: "EE",
				voter_personal_id: "38706180003"
			}])
		})

		it("must err on duplicates", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			yield createTeacher(school, this.account)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			yield votersDb.create({
				budget_id: budget.id,
				country: "EE",
				personal_id: "38706180001"
			})

			var ideas = yield ideasDb.create([
				new ValidIdea({budget_id: budget.id, account_id: this.account.id}),
				new ValidIdea({budget_id: budget.id, account_id: this.account.id})
			])

			var res = yield this.request(Paths.paperVotesPath(school, budget), {
				method: "PUT",

				form: {"paper-votes": outdent`
					38706180001, ${ideas[0].id}
					38706180001, ${ideas[1].id}
				`}
			})

			res.statusCode.must.equal(422)
			res.statusMessage.must.equal("Invalid Voters")

			var dom = parseDom(res.body)
			var el = dom.querySelector("main .description")
			el.textContent.must.include("38706180001")
		})

		it("must err given personal id not in voters", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			yield createTeacher(school, this.account)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var idea = yield ideasDb.create(new ValidIdea({
				budget_id: budget.id,
				account_id: this.account.id
			}))

			var res = yield this.request(Paths.paperVotesPath(school, budget), {
				method: "PUT",
				form: {"paper-votes": `38706180001, ${idea.id}`}
			})

			res.statusCode.must.equal(422)
			res.statusMessage.must.equal("Invalid Voters")

			var dom = parseDom(res.body)
			var el = dom.querySelector("main .description")
			el.textContent.must.include("38706180001")
		})
	})
})
