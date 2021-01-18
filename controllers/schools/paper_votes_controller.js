var _ = require("root/lib/underscore")
var Router = require("express").Router
var HttpError = require("standard-http-error")
var {assertAccount} = require("../schools_controller")
var {assertTeacher} = require("../schools_controller")
var ideasDb = require("root/db/ideas_db")
var paperVotesDb = require("root/db/paper_votes_db")
var next = require("co-next")
var sql = require("sqlate")

exports.router = Router({mergeParams: true})
exports.router.use(assertAccount, assertTeacher)

exports.router.get("/", next(function*(req, res) {
	var {school} = req

	var ideas = _.indexBy(yield ideasDb.search(sql`
		SELECT id, title FROM ideas WHERE school_id = ${school.id}
	`), "id")

	var paperVotes = yield paperVotesDb.search(sql`
		SELECT * FROM paper_votes WHERE school_id = ${school.id}
	`)

	res.render("schools/paper_votes/index_page.jsx", {school, ideas, paperVotes})
}))

exports.router.put("/", next(function*(req, res) {
	var err
	var school = req.school

	var ideaIds = new Set((yield ideasDb.search(sql`
		SELECT id FROM ideas WHERE school_id = ${school.id}
	`)).map((idea) => idea.id))

	var votes = parse(req.body)
	if (err = validateVotes(ideaIds, votes)) throw err

	yield paperVotesDb.execute(sql`
		DELETE FROM paper_votes WHERE school_id = ${school.id}
	`)

	yield paperVotesDb.create(votes.map((vote) => ({
		__proto__: vote,
		school_id: school.id
	})))

	res.redirect(303, req.baseUrl + req.path)
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

function validateVotes(ideaIds, votes) {
	var errors = []
	var seenPersonalIds = Object.create(null)

	votes.forEach(function(vote) {
		if (seenPersonalIds[vote.voter_personal_id]) errors.push(
			"Hääletaja " + vote.voter_personal_id + " on rohkem kui üks kord."
		)
		else seenPersonalIds[vote.voter_personal_id] = true

		if (!ideaIds.has(vote.idea_id)) errors.push(
			"Idee identifikaatoriga " + vote.idea_id + " ei eksisteeri."
		)
	})

	if (errors.length > 0) return new HttpError(422, "Invalid Voters", {
		description: _.uniq(errors).join("\n")
	})
	else return null
}
