var _ = require("root/lib/underscore")
var Router = require("express").Router
var HttpError = require("standard-http-error")
var DateFns = require("date-fns")
var schoolsDb = require("root/db/schools_db")
var teachersDb = require("root/db/teachers_db")
var votersDb = require("root/db/voters_db")
var votesDb = require("root/db/votes_db")
var ideasDb = require("root/db/ideas_db")
var {isValidImageType} = require("root/lib/image")
var next = require("co-next")
var sql = require("sqlate")
exports.router = Router({mergeParams: true})
exports.assertAccount = assertAccount
exports.assertTeacher = assertTeacher

exports.router.get("/", (_req, res) => res.redirect(302, "/"))

exports.router.use("/:id", next(function*(req, _res, next) {
	var school = yield schoolsDb.read(sql`
		SELECT
			id, name, description, voting_starts_at, voting_ends_at,
			background_color, foreground_color, logo_type

		FROM schools
		WHERE id = ${req.params.id}
	`)

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
		WITH merged_votes AS (
			SELECT vote.idea_id
			FROM votes AS vote

			LEFT JOIN paper_votes AS paper_vote
			ON paper_vote.school_id = vote.school_id
			AND paper_vote.voter_country = vote.voter_country
			AND paper_vote.voter_personal_id = vote.voter_personal_id

			WHERE vote.school_id = ${school.id}
			AND paper_vote.voter_personal_id IS NULL

			UNION ALL

			SELECT idea_id FROM paper_votes
			WHERE school_id = ${school.id}
		)

		SELECT idea_id, COUNT(*) AS count
		FROM merged_votes
		GROUP BY idea_id
	`), "idea_id"), (votes) => votes.count)

	var ideas = yield ideasDb.search(sql`
		SELECT
			id, school_id, account_id, title, description, author_names,
			created_at, updated_at, image_type

		FROM ideas
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

exports.router.get("/:id/logo", next(function*(req, res) {
	var {school} = req

	var logo = yield schoolsDb.read(sql`
		SELECT logo AS data, logo_type AS type FROM schools WHERE id = ${school.id}
	`)

	if (logo.data == null) throw new HttpError(404)

	res.setHeader("Content-Type", logo.type)
	res.setHeader("Content-Length", logo.data.length)
	res.end(logo.data)
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
	var attrs = parse(req.body, req.files)
	var voters = parseVoterPersonalIds(req.body.voters)
	voters.forEach((voter) => voter.school_id = school.id)

	yield schoolsDb.update(school, attrs)
	yield votersDb.execute(sql`DELETE FROM voters WHERE school_id = ${school.id}`)
	yield votersDb.create(voters)

	res.redirect(303, req.baseUrl + req.path + "/edit")
}))

_.each({
	"/:id/ideas": require("./schools/ideas_controller").router,
	"/:id/votes": require("./schools/votes_controller").router,
	"/:id/paper-votes": require("./schools/paper_votes_controller").router,
}, (router, path) => exports.router.use(path, router))

function parse(obj, files) {
	var attrs = {
		name: obj.name,
		description: obj.description || null,

		background_color:
			obj.background_color ? parseColor(obj.background_color) : null,

		foreground_color:
			obj.foreground_color ? parseColor(obj.foreground_color) : null
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

	if (files.logo && isValidImageType(files.logo.mimetype)) {
		attrs.logo = files.logo.buffer
		attrs.logo_type = files.logo.mimetype
	}

	return attrs
}

function parseColor(color) {
	// As <input type=color> always defaults to black if empty, pick one color to
	// imply that it was not changed
	if (color == "#000001") return null
	if (/^#[A-Za-z0-9]{1,8}$/.test(color)) return color
	return null
}

function parseVoterPersonalIds(personalIds) {
	personalIds = _.uniq(personalIds.trim().split(/\s+/g).map(cleanPersonalId))
	return personalIds.map((id) => ({country: "EE", personal_id: id}))
}

function assertAccount(req, _res, next) {
	if (req.account == null) throw new HttpError(401, {
		description: "Palun logi lehe nägemiseks sisse."
	})

	else next()
}

function assertTeacher(req, _res, next) {
	if (req.role != "teacher") throw new HttpError(403, "Not a Teacher")
	else next()
}

function cleanPersonalId(personalId) {
	return personalId.replace(/[^0-9]/g, "")
}
