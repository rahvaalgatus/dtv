var _ = require("root/lib/underscore")
var Router = require("express").Router
var HttpError = require("standard-http-error")
var ideasDb = require("root/db/ideas_db")
var next = require("co-next")
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

	var idea = yield ideasDb.create(_.assign(parse(req.body), {
		school_id: school.id,
		account_id: account.id
	}))

	res.redirect(303, req.baseUrl + "/" + idea.id)
}))

exports.router.use("/:id", next(function*(req, _res, next) {
	var idea = yield ideasDb.read(req.params.id)
	if (idea == null) throw new HttpError(404, "Idea Not Found")
	req.idea = idea
	next()
}))

exports.router.get("/:id", function(req, res) {
	var {school} = req
	var {idea} = req
	res.render("schools/ideas/read_page.jsx", {school, idea})
})

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

	yield ideasDb.update(idea, _.assign(parse(req.body), {updated_at: new Date}))
	res.redirect(303, req.baseUrl + "/" + idea.id)
}))

function parse(obj) {
	return {
		title: obj.title,
		description: obj.description || null,
		author_names: obj.author_names || null
	}
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
