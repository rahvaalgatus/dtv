var _ = require("root/lib/underscore")
var DateFns = require("date-fns")
var ValidAccount = require("root/test/valid_account")
var ValidSession = require("root/test/valid_session")
var ValidSchool = require("root/test/valid_school")
var ValidBudget = require("root/test/valid_budget")
var ValidIdea = require("root/test/valid_idea")
var ValidVote = require("root/test/valid_vote")
var accountsDb = require("root/db/accounts_db")
var sessionsDb = require("root/db/sessions_db")
var schoolsDb = require("root/db/schools_db")
var budgetsDb = require("root/db/budgets_db")
var ideasDb = require("root/db/ideas_db")
var votersDb = require("root/db/voters_db")
var votesDb = require("root/db/votes_db")
var teachersDb = require("root/db/teachers_db")
var paperVotesDb = require("root/db/paper_votes_db")
var {randomPersonalId} = require("root/test/valid_account")
var {createTeacher} = require("root/test/fixtures")
var anonymize = require("root/bin/anonymize")
var sql = require("sqlate")

describe("anonymize", function() {
	require("root/test/db")()
	require("root/test/time")()

	describe("given budgets", function() {
		it("must expire budgets if a week since voting ended", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id,
				voting_ends_at: DateFns.addDays(new Date, -7)
			}))

			yield anonymize()

			yield budgetsDb.read(budget.id).must.then.eql(_.defaults({
				expired_at: new Date
			}, budget))
		})

		it("must not expire budgets if less than a week since voting ended",
			function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id,
				voting_ends_at: DateFns.addMilliseconds(DateFns.addDays(new Date, -7), 1)
			}))

			yield anonymize()
			yield budgetsDb.read(budget.id).must.then.eql(budget)
		})

		it("must not expire already expired budgets",
			function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id,
				voting_ends_at: DateFns.addDays(new Date, -8),
				expired_at: DateFns.addDays(new Date, -1)
			}))

			yield anonymize()
			yield budgetsDb.read(budget.id).must.then.eql(budget)
		})

		it("must anonymize budgets if a week since expiration", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id,
				expired_at: DateFns.addDays(new Date, -7)
			}))

			yield votersDb.create(_.times(3, (i) => ({
				budget_id: budget.id,
				country: "EE",
				personal_id: "3870618000" + i
			})))

			var author = yield accountsDb.create(new ValidAccount)

			var ideas = yield ideasDb.create(_.times(3, () => new ValidIdea({
				budget_id: budget.id,
				account_id: author.id
			})))

			var votes = yield votesDb.create(_.times(9, (i) => new ValidVote({
				budget_id: budget.id,
				idea_id: ideas[i % 3].id
			})))

			yield paperVotesDb.create(_.times(3, (i) => ({
				budget_id: budget.id,
				idea_id: ideas[i % 3].id,
				voter_country: "EE",
				voter_personal_id: randomPersonalId()
			})))

			yield paperVotesDb.create({
				budget_id: budget.id,
				idea_id: ideas[1].id,
				voter_country: votes[0].voter_country,
				voter_personal_id: votes[0].voter_personal_id
			})

			yield anonymize()

			yield budgetsDb.read(budget.id).must.then.eql(_.defaults({
				anonymized_at: new Date
			}, budget))

			yield ideasDb.search(sql`
				SELECT * FROM ideas
			`).must.then.eql(ideas.map((idea, i) => _.defaults({
				vote_count: i == 0 ? 3 : i == 1 ? 5 : 4
			}, idea)))

			yield votersDb.search(sql`SELECT * FROM voters`).must.then.be.empty()
			yield votesDb.search(sql`SELECT * FROM votes`).must.then.be.empty()

			yield paperVotesDb.search(sql`
				SELECT * FROM paper_votes
			`).must.then.be.empty()
		})

		it("must not anonymize other budgets", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			yield budgetsDb.create(new ValidBudget({
				school_id: school.id,
				expired_at: DateFns.addDays(new Date, -7)
			}))

			var otherBudget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id
			}))

			var author = yield accountsDb.create(new ValidAccount)

			var ideas = yield ideasDb.create(_.times(3, () => new ValidIdea({
				budget_id: otherBudget.id,
				account_id: author.id
			})))

			var voters = yield votersDb.create(_.times(3, (i) => ({
				budget_id: otherBudget.id,
				country: "EE",
				personal_id: "3870618000" + i
			})))

			var votes = yield votesDb.create(_.times(3, (i) => new ValidVote({
				budget_id: otherBudget.id,
				idea_id: ideas[i % 3].id
			})))

			var paperVotes = yield paperVotesDb.create(_.times(3, (i) => ({
				budget_id: otherBudget.id,
				idea_id: ideas[i % 3].id,
				voter_country: "EE",
				voter_personal_id: randomPersonalId()
			})))

			yield anonymize()

			yield budgetsDb.read(otherBudget.id).must.then.eql(otherBudget)
			yield ideasDb.search(sql`SELECT * FROM ideas`).must.then.eql(ideas)
			yield votersDb.search(sql`SELECT * FROM voters`).must.then.eql(voters)
			yield votesDb.search(sql`SELECT * FROM votes`).must.then.eql(votes)

			yield paperVotesDb.search(sql`
				SELECT * FROM paper_votes
			`).must.then.eql(paperVotes)
		})

		it("must not anonymize budgets if less than a week since expiration",
			function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id,
				expired_at: DateFns.addMilliseconds(DateFns.addDays(new Date, -7), 1)
			}))

			yield anonymize()
			yield budgetsDb.read(budget.id).must.then.eql(budget)
		})

		it("must not anonymize already anonymized budgets", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var budget = yield budgetsDb.create(new ValidBudget({
				school_id: school.id,
				expired_at: DateFns.addDays(new Date, -8),
				anonymized_at: DateFns.addDays(new Date, -1)
			}))

			yield anonymize()
			yield budgetsDb.read(budget.id).must.then.eql(budget)
		})
	})

	describe("given accounts", function() {
		it("must anonymize accounts with sessions last used before a year",
			function*() {
			var account = yield accountsDb.create(new ValidAccount({
				country: "EE",
				personal_id: "38706181337",
				name: "Johnny",
				official_name: "John Smith",
			}))

			var session = yield sessionsDb.create(new ValidSession({
				account_id: account.id,
				created_ip: "127.0.0.1",
				created_user_agent: "Mozilla/1.0",
				last_used_on: DateFns.addYears(new Date, -1)
			}))

			yield anonymize()

			yield accountsDb.read(account.id).must.then.eql(_.defaults({
				country: null,
				personal_id: null,
				name: null,
				official_name: null,
				anonymized_at: new Date
			}, account))

			yield sessionsDb.read(session.id).must.then.eql(_.defaults({
				created_ip: null,
				created_user_agent: null,
				deleted_at: new Date
			}, session))
		})

		it("must not anonymize accounts with one session newer than year",
			function*() {
			var account = yield accountsDb.create(new ValidAccount)

			var a = yield sessionsDb.create(new ValidSession({
				account_id: account.id,
				last_used_on: DateFns.addYears(new Date, -1)
			}))

			var b = yield sessionsDb.create(new ValidSession({
				account_id: account.id,
				last_used_on: DateFns.addDays(DateFns.addYears(new Date, -1), 1),
				deleted_at: new Date
			}))

			var c = yield sessionsDb.create(new ValidSession({
				account_id: account.id,
				last_used_on: DateFns.addYears(new Date, -1)
			}))

			yield anonymize()

			yield accountsDb.read(account.id).must.then.eql(account)

			yield sessionsDb.search(sql`
				SELECT * FROM sessions
			`).must.then.eql([a, b, c])
		})

		it("must not anonymize accounts with never used session", function*() {
			var account = yield accountsDb.create(new ValidAccount)

			var session = yield sessionsDb.create(new ValidSession({
				account_id: account.id
			}))

			yield anonymize()
			yield accountsDb.read(account.id).must.then.eql(account)
			yield sessionsDb.read(session.id).must.then.eql(session)
		})

		it("must not anonymize accounts without sessions", function*() {
			var account = yield accountsDb.create(new ValidAccount)
			yield anonymize()
			yield accountsDb.read(account.id).must.then.eql(account)
		})

		it("must not anonymize other accounts and sessions",
			function*() {
			var account = yield accountsDb.create(new ValidAccount)
			var otherAccount = yield accountsDb.create(new ValidAccount)

			var session = yield sessionsDb.create(new ValidSession({
				account_id: account.id,
				last_used_on: DateFns.addYears(new Date, -1)
			}))

			var otherSession = yield sessionsDb.create(new ValidSession({
				account_id: otherAccount.id
			}))

			yield anonymize()

			yield accountsDb.search(sql`
				SELECT * FROM accounts
			`).must.then.eql([_.defaults({
				country: null,
				personal_id: null,
				name: null,
				official_name: null,
				anonymized_at: new Date
			}, account), otherAccount])

			yield sessionsDb.search(sql`SELECT * FROM sessions`).must.then.eql([
				_.defaults({deleted_at: new Date}, session),
				otherSession
			])
		})

		it("must delete teachers for anonymized accounts", function*() {
			var account = yield accountsDb.create(new ValidAccount)

			yield sessionsDb.create(new ValidSession({
				account_id: account.id,
				last_used_on: DateFns.addYears(new Date, -1)
			}))

			var school = yield schoolsDb.create(new ValidSchool)
			yield createTeacher(school, account)

			yield anonymize()
			yield teachersDb.search(sql`SELECT * FROM teachers`).must.then.be.empty()
		})

		it("must not delete others teachers", function*() {
			var account = yield accountsDb.create(new ValidAccount)

			yield sessionsDb.create(new ValidSession({
				account_id: account.id,
				last_used_on: DateFns.addYears(new Date, -1)
			}))

			var school = yield schoolsDb.create(new ValidSchool)
			var otherAccount = yield accountsDb.create(new ValidAccount)
			var teacher = yield createTeacher(school, otherAccount)

			yield anonymize()
			yield teachersDb.read(sql`SELECT * FROM teachers`).must.then.eql(teacher)
		})
	})

	describe("given teachers", function() {
		it("must delete teachers without accounts created a year ago", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			yield teachersDb.create({
				school_id: school.id,
				country: "EE",
				personal_id: "38706180001",
				created_at: DateFns.addYears(new Date, -1)
			})

			yield anonymize()
			yield teachersDb.search(sql`SELECT * FROM teachers`).must.then.be.empty()
		})

		// Teachers with unused accounts are handled by account-expiration.
		it("must not delete teachers with accounts created a year ago", function*() {
			var school = yield schoolsDb.create(new ValidSchool)
			var account = yield accountsDb.create(new ValidAccount)

			var teacher = yield teachersDb.create({
				school_id: school.id,
				country: account.country,
				personal_id: account.personal_id,
				created_at: DateFns.addYears(new Date, -1)
			})

			yield anonymize()
			yield teachersDb.read(sql`SELECT * FROM teachers`).must.then.eql(teacher)
		})

		it("must not delete teachers created earlier than a year", function*() {
			var school = yield schoolsDb.create(new ValidSchool)

			var teacher = yield teachersDb.create({
				school_id: school.id,
				country: "EE",
				personal_id: "38706180001",
				created_at: DateFns.addMilliseconds(DateFns.addDays(new Date, -7), 1)
			})

			yield anonymize()
			yield teachersDb.read(sql`SELECT * FROM teachers`).must.then.eql(teacher)
		})
	})
})
