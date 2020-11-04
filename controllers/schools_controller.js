var _ = require("root/lib/underscore")
var Router = require("express").Router
var HttpError = require("standard-http-error")
var DateFns = require("date-fns")
var next = require("co-next")
var schoolsDb = require("root/db/schools_db")
var teachersDb = require("root/db/teachers_db")
var votersDb = require("root/db/voters_db")
var votesDb = require("root/db/votes_db")
var ideasDb = require("root/db/ideas_db")
var sql = require("sqlate")
exports.router = Router({mergeParams: true})

exports.router.get("/", next(function*(_req, res) {
	var schools = yield schoolsDb.search(sql`SELECT * FROM schools`)
	res.render("schools/index_page.jsx", {schools})
}))

exports.router.use("/:id", next(function*(req, _res, next) {
	var school = yield schoolsDb.read(req.params.id)

	if (school == null) throw new HttpError(404, "School Not Found", {
		description: "Kooli ei leitud."
	})

	req.school = school

	var {account} = req

	req.role = (
		account && (yield teachersDb.read(sql`
			SELECT 1 FROM teachers
			WHERE school_id = ${school.id}
			AND country = ${account.country}
			AND personal_id = ${account.personal_id}
		`)) ? "teacher" :

		account && (yield votersDb.read(sql`
			SELECT 1 FROM voters
			WHERE school_id = ${school.id}
			AND country = ${account.country}
			AND personal_id = ${account.personal_id}
		`)) ? "voter" :

		null
	)

	next()
}))

exports.router.get("/:id", next(function*(req, res) {
	var {school} = req
	var {teachers} = req
	var {account} = req
	var thank = req.query.voted

	var voter = account ? yield votersDb.read(sql`
		SELECT * FROM voters
		WHERE school_id = ${school.id}
		AND country = ${account.country}
		AND personal_id = ${account.personal_id}
	`) : null

	var votesByIdea = _.mapValues(_.indexBy(yield votesDb.search(sql`
		SELECT idea_id, COUNT(*) AS count FROM votes
		WHERE school_id = ${school.id}
		GROUP BY idea_id
	`), "idea_id"), (votes) => votes.count)

	var ideas = yield ideasDb.search(sql`
		SELECT * FROM ideas
		WHERE school_id = ${school.id}
	`)

	res.render("schools/read_page.jsx", {
		school,
		teachers,
		voter,
		votesByIdea,
		ideas,
		thank
	})
}))

exports.router.get("/:id/edit",
	assertAccount,
	assertTeacher,
	next(function*(req, res) {
	var {school} = req

	var teachers = yield teachersDb.search(sql`
		SELECT teacher.*, account.name AS name
		FROM teachers AS teacher

		LEFT JOIN accounts AS account
		ON account.country = teacher.country
		AND account.personal_id = teacher.personal_id

		WHERE school_id = ${school.id}
	`)

	var voters = yield votersDb.search(sql`
		SELECT voter.*, COALESCE(account.name, vote.voter_name) AS name
		FROM voters AS voter

		LEFT JOIN accounts AS account
		ON account.country = voter.country
		AND account.personal_id = voter.personal_id

		LEFT JOIN votes AS vote
		ON vote.school_id = ${school.id}
		AND vote.voter_country = voter.country
		AND vote.voter_personal_id = voter.personal_id

		WHERE voter.school_id = ${school.id}
	`)

	res.render("schools/update_page.jsx", {school, voters, teachers})
}))

exports.router.put("/:id",
	assertAccount,
	assertTeacher,
	next(function*(req, res) {
	var {school} = req
	var attrs = parse(req.body)
	var voters = parseVoterPersonalIds(req.body.voters)
	voters.forEach((voter) => voter.school_id = school.id)

	yield schoolsDb.update(school, attrs)
	yield votersDb.execute(sql`DELETE FROM voters WHERE school_id = ${school.id}`)
	yield votersDb.create(voters)

	res.redirect(303, req.baseUrl + req.path + "/edit")
}))

exports.router.use("/:id/ideas", require("./schools/ideas_controller").router)
exports.router.use("/:id/votes", require("./schools/votes_controller").router)

function parse(obj) {
	return {
		name: obj.name,
		description: obj.description || null,

		voting_starts_at: obj.voting_starts_on
			? _.parseIsoDate(obj.voting_starts_on)
			: null,

		voting_ends_at: obj.voting_ends_on
			? DateFns.addDays(_.parseIsoDate(obj.voting_ends_on), 1)
			: null
	}
}

function parseVoterPersonalIds(personalIds) {
	personalIds = _.uniq(personalIds.trim().split(/\s+/g).map(cleanPersonalId))
	return personalIds.map((id) => ({country: "EE", personal_id: id}))
}

function assertAccount(req, _res, next) {
	if (req.account == null) throw new HttpError(401)
	else next()
}

function assertTeacher(req, _res, next) {
	if (req.role != "teacher") throw new HttpError(403, "Not a Teacher")
	else next()
}

function cleanPersonalId(personalId) {
	return personalId.replace(/[^0-9]/g, "")
}
