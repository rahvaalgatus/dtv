var _ = require("root/lib/underscore")
var Path = require("path")
var Router = require("express").Router
var HttpError = require("standard-http-error")
var DateFns = require("date-fns")
var {assertAccount} = require("../schools_controller")
var {assertTeacher} = require("../schools_controller")
var votersDb = require("root/db/voters_db")
var votesDb = require("root/db/votes_db")
var ideasDb = require("root/db/ideas_db")
var budgetsDb = require("root/db/budgets_db")
var sql = require("sqlate")
var next = require("co-next")
exports.router = Router({mergeParams: true})

var NEW_BUDGET = {
	title: ""
}

exports.router.get("/", function(req, res) {
	res.redirect(302, Path.dirname(req.baseUrl))
})

exports.router.post("/",
	assertAccount,
	assertTeacher,
	next(function*(req, res) {
	var {school} = req

	var attrs = parse(req.body)
	attrs.school_id = school.id
	var voters = parseVoterPersonalIds(req.body.voters)
	var budget = yield budgetsDb.create(attrs)
	voters.forEach((voter) => voter.budget_id = budget.id)
	yield votersDb.create(voters)

	res.statusMessage = "Budget Created"
	res.redirect(303, req.baseUrl + "/" + budget.id)
}))

exports.router.get("/new",
	assertAccount,
	assertTeacher,
	function(_req, res) {
	res.render("schools/budgets/create_page.jsx", {
		budget: NEW_BUDGET,
		voters: []
	})
})

exports.router.use("/:id", next(function*(req, res, next) {
	var {account} = req
	var {school} = req

	var budget = yield budgetsDb.read(sql`
		SELECT * FROM budgets
		WHERE id = ${req.params.id}
		AND school_id = ${school.id}
	`)

	if (budget == null) throw new HttpError(404, "Budget Not Found", {
		description: "Eelarvet ei leitud."
	})

	req.role = req.role || (
		account && (yield votersDb.read(sql`
			SELECT 1 FROM voters
			WHERE budget_id = ${budget.id}
			AND country = ${account.country}
			AND personal_id = ${account.personal_id}
		`)) ? "voter" :

		null
	)

	req.budget = res.locals.budget = budget
	next()
}))

exports.router.get("/:id", next(function*(req, res) {
	var {budget} = req
	var {account} = req
	var thank = req.query.voted

	var voter = account ? yield votersDb.read(sql`
		SELECT * FROM voters
		WHERE budget_id = ${budget.id}
		AND country = ${account.country}
		AND personal_id = ${account.personal_id}
	`) : null

	var votesByIdea = _.mapValues(_.indexBy(yield votesDb.search(sql`
		WITH merged_votes AS (
			SELECT vote.idea_id
			FROM votes AS vote

			LEFT JOIN paper_votes AS paper_vote
			ON paper_vote.budget_id = vote.budget_id
			AND paper_vote.voter_country = vote.voter_country
			AND paper_vote.voter_personal_id = vote.voter_personal_id

			WHERE vote.budget_id = ${budget.id}
			AND paper_vote.voter_personal_id IS NULL

			UNION ALL

			SELECT idea_id FROM paper_votes
			WHERE budget_id = ${budget.id}
		)

		SELECT idea_id, COUNT(*) AS count
		FROM merged_votes
		GROUP BY idea_id
	`), "idea_id"), (votes) => votes.count)

	var ideas = yield ideasDb.search(sql`
		SELECT
			id, budget_id, account_id, title, description, author_names,
			created_at, updated_at, image_type

		FROM ideas
		WHERE budget_id = ${budget.id}
	`)

	res.render("schools/budgets/read_page.jsx", {
		voter,
		votesByIdea,
		ideas,
		thank
	})
}))

exports.router.put("/:id",
	assertAccount,
	assertTeacher,
	next(function*(req, res) {
	var {budget} = req

	var attrs = parse(req.body)
	var voters = parseVoterPersonalIds(req.body.voters)
	voters.forEach((voter) => voter.budget_id = budget.id)

	yield budgetsDb.update(budget, attrs)
	yield votersDb.execute(sql`DELETE FROM voters WHERE budget_id = ${budget.id}`)
	yield votersDb.create(voters)

	res.statusMessage = "Budget Updated"
	res.redirect(303, req.baseUrl + req.path + "/edit")
}))

exports.router.get("/:id/edit",
	assertAccount,
	assertTeacher,
	next(function*(req, res) {
	var {budget} = req

	var voters = yield votersDb.search(sql`
		SELECT
			voter.*,
			COALESCE(account.name, vote.voter_name) AS name,
			vote.voter_personal_id IS NOT NULL AS has_voted

		FROM voters AS voter

		LEFT JOIN accounts AS account
		ON account.country = voter.country
		AND account.personal_id = voter.personal_id

		LEFT JOIN votes AS vote
		ON vote.budget_id = ${budget.id}
		AND vote.voter_country = voter.country
		AND vote.voter_personal_id = voter.personal_id

		WHERE voter.budget_id = ${budget.id}
	`)

	voters.forEach(function(voter) {
		voter.has_voted = Boolean(voter.has_voted)
	})

	res.render("schools/budgets/update_page.jsx", {voters})
}))

_.each({
	"/ideed": require("./budgets/ideas_controller").router,
	"/hääled": require("./budgets/votes_controller").router,
	"/paberhääled": require("./budgets/paper_votes_controller").router
}, (router, path) => exports.router.use("/:id" + encodeURI(path), router))

function parse(obj) {
	var attrs = {
		title: obj.title,
		description: obj.description || null
	}

	try {
		attrs.voting_starts_at = obj.voting_starts_on
			? _.parseIsoDate(obj.voting_starts_on)
			: null
	}
	catch (ex) {
		if (ex.message.startsWith("Invalid Date:"))
			throw new HttpError(422, "Invalid Attributes", {
				description: "Hääletamise algus ei tundu õiges formaadis."
			})

		else throw ex
	}

	try {
		attrs.voting_ends_at = obj.voting_ends_on
			? DateFns.addDays(_.parseIsoDate(obj.voting_ends_on), 1)
			: null
	}
	catch (ex) {
		if (ex.message.startsWith("Invalid Date:"))
			throw new HttpError(422, "Invalid Attributes", {
				description: "Hääletamise lõpp ei tundu õiges formaadis."
			})

		else throw ex
	}

	return attrs
}

function parseVoterPersonalIds(personalIds) {
	personalIds = _.uniq(personalIds.trim().split(/\s+/g).map(cleanPersonalId))
	personalIds = personalIds.filter(Boolean)
	return personalIds.map((id) => ({country: "EE", personal_id: id}))
}

function cleanPersonalId(personalId) {
	return personalId.replace(/[^0-9]/g, "")
}
