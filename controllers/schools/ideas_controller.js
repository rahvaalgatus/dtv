var _ = require("root/lib/underscore")
var Router = require("express").Router
var HttpError = require("standard-http-error")
var ideasDb = require("root/db/ideas_db")
var next = require("co-next")
var {isValidImageType} = require("root/lib/image")
var sql = require("sqlate")
exports.router = Router({mergeParams: true})

exports.router.get("/new",
	assertAccount,
	assertNotVoting,
	assertVoter,
	function(req, res) {
	var {school} = req
	res.render("schools/ideas/create_page.jsx", {school})
})

exports.router.post("/",
	assertAccount,
	assertNotVoting,
	assertVoter,
	next(function*(req, res) {
	var {account} = req
	var {school} = req

	var idea = yield ideasDb.create(_.assign(parse(req.body, req.files), {
		school_id: school.id,
		account_id: account.id
	}))

	res.redirect(303, req.baseUrl + "/" + idea.id)
}))

exports.router.use("/:id", next(function*(req, _res, next) {
	var {school} = req

	var idea = yield ideasDb.read(sql`
		SELECT
			id, school_id, account_id, title, description, author_names,
			created_at, updated_at, image_type

		FROM ideas
		WHERE id = ${req.params.id}
		AND school_id = ${school.id}
	`)

	if (idea == null) throw new HttpError(404, "Idea Not Found")
	req.idea = idea
	next()
}))

exports.router.get("/:id", function(req, res) {
	var {school} = req
	var {idea} = req
	res.render("schools/ideas/read_page.jsx", {school, idea})
})

exports.router.get("/:id/image", next(function*(req, res) {
	var {idea} = req

	var image = yield ideasDb.read(sql`
		SELECT image AS data, image_type AS type FROM ideas WHERE id = ${idea.id}
	`)

	if (image.data == null) throw new HttpError(404)

	res.setHeader("Content-Type", image.type)
	res.setHeader("Content-Length", image.data.length)
	res.end(image.data)
}))

exports.router.get("/:id/edit",
	assertAccount,
	assertAuthor,
	assertNotVoting,
	function(req, res) {
	var {idea} = req
	var {school} = req
	res.render("schools/ideas/update_page.jsx", {school, idea})
})

exports.router.put("/:id",
	assertAccount,
	assertAuthor,
	assertNotVoting,
	next(function*(req, res) {
	var {account} = req
	var {idea} = req
	if (idea.account_id != account.id) throw new HttpError(403)

	yield ideasDb.update(idea, _.assign(parse(req.body, req.files), {
		updated_at: new Date
	}))

	res.redirect(303, req.baseUrl + "/" + idea.id)
}))

function parse(obj, files) {
	var attrs = {
		title: obj.title,
		description: obj.description || null,
		author_names: obj.author_names || null
	}

	if (files.image && isValidImageType(files.image.mimetype)) {
		attrs.image = files.image.buffer
		attrs.image_type = files.image.mimetype
	}

	return attrs
}

function assertAccount(req, _res, next) {
	if (req.account == null) throw new HttpError(401)
	next()
}

function assertAuthor(req, _res, next) {
	var {account} = req
	var {idea} = req
	if (idea.account_id != account.id) throw new HttpError(403)
	next()
}

function assertNotVoting(req, _res, next) {
	var {school} = req

	if (school.voting_starts_at && new Date >= school.voting_starts_at)
		throw new HttpError(403, "Cannot Edit After Voting Started")

	next()
}

function assertVoter(req, _res, next) {
	if (req.role == "teacher" || req.role == "voter") next()
	else throw new HttpError(403, "Not Permitted to Create Ideas")
}
