var _ = require("root/lib/underscore")
var Router = require("express").Router
var HttpError = require("standard-http-error")
var {assertAccount} = require("../../schools_controller")
var {assertTeacher} = require("../../schools_controller")
var ideasDb = require("root/db/ideas_db")
var votersDb = require("root/db/voters_db")
var paperVotesDb = require("root/db/paper_votes_db")
var next = require("co-next")
var sql = require("sqlate")

exports.router = Router({mergeParams: true})
exports.router.use(assertAccount, assertTeacher)

exports.router.get("/", next(function*(req, res) {
	var {budget} = req

	var ideas = _.indexBy(yield ideasDb.search(sql`
		SELECT id, title FROM ideas WHERE budget_id = ${budget.id}
	`), "id")

	var paperVotes = yield paperVotesDb.search(sql`
		SELECT * FROM paper_votes WHERE budget_id = ${budget.id}
	`)

	res.render("schools/budgets/paper_votes/index_page.jsx", {ideas, paperVotes})
}))

exports.router.put("/", next(function*(req, res) {
	var err
	var {budget} = req

	var ideaIds = new Set(_.map(yield ideasDb.search(sql`
		SELECT id FROM ideas WHERE budget_id = ${budget.id}
	`), "id"))

	var voterPersonalId = new Set(_.map(yield votersDb.search(sql`
		SELECT country || personal_id AS id FROM voters
		WHERE budget_id = ${budget.id}
	`), "id"))

	var votes = parse(req.body)
	if (err = validateVotes(ideaIds, voterPersonalId, votes)) throw err

	yield paperVotesDb.execute(sql`
		DELETE FROM paper_votes WHERE budget_id = ${budget.id}
	`)

	yield paperVotesDb.create(votes.map((vote) => ({
		__proto__: vote,
		budget_id: budget.id
	})))

	res.statusMessage = "Paper Votes Updated"
	res.redirect(303, req.baseUrl)
}))

function parse(obj) {
	return parsePaperVotes(obj["paper-votes"])
}

function parsePaperVotes(csv) {
	return csv.trim().split(/\n+/g).map(function(line) {
		if (line == "") return null

		var [voterPersonalId, ideaId] = line.split(/,/)

		if (voterPersonalId == null || ideaId == null)
			throw new HttpError(422, "Vote Line Parse Error", {
				description: "Ei õnnestu tõlgendada rida: " + line
			})

		return {
			idea_id: Number(ideaId),
			voter_country: "EE",
			voter_personal_id: voterPersonalId.trim()
		}
	}).filter(Boolean)
}

function validateVotes(ideaIds, voterPersonalIds, votes) {
	var errors = []
	var seenPersonalIds = Object.create(null)

	votes.forEach(function(vote) {
		if (!ideaIds.has(vote.idea_id)) errors.push(
			`Idee identifikaatoriga ${vote.idea_id} ei eksisteeri.`
		)

		if (seenPersonalIds[vote.voter_personal_id]) errors.push(
			`Hääletaja ${vote.voter_personal_id} on rohkem kui üks kord.`
		)
		else seenPersonalIds[vote.voter_personal_id] = true

		if (!voterPersonalIds.has(vote.voter_country + vote.voter_personal_id))
			errors.push(
				`Hääletaja ${vote.voter_personal_id} pole hääletajate nimekirjas.`
			)
	})

	if (errors.length > 0) return new HttpError(422, "Invalid Voters", {
		description: _.uniq(errors).join("\n")
	})
	else return null
}
