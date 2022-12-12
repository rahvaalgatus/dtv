var Path = require("path")
var Router = require("express").Router
var HttpError = require("standard-http-error")
var schoolsDb = require("root/db/schools_db")
var budgetsDb = require("root/db/budgets_db")
var teachersDb = require("root/db/teachers_db")
var ideasDb = require("root/db/ideas_db")
var {isValidImageType} = require("root/lib/image")
var SCHOOL_PATH = "/:id:slug(-[^/]+)?"
var next = require("co-next")
var sql = require("sqlate")
exports.router = Router({mergeParams: true})
exports.assertAccount = assertAccount
exports.assertTeacher = assertTeacher

exports.router.get("/", (_req, res) => res.redirect(302, "/"))

exports.router.use(SCHOOL_PATH, next(function*(req, res, next) {
	var {account} = req
	var slug = (req.params.slug || "").replace(/^-/, "")

	var school = yield schoolsDb.read(sql`
		SELECT
			id, slug, name, description,
			background_color, foreground_color, logo_type

		FROM schools
		WHERE id = ${req.params.id}
	`)

	if (school == null) throw new HttpError(404, "School Not Found", {
		description: "Kooli ei leitud."
	})

	if (school.slug != slug) {
		var path = Path.dirname(req.baseUrl) + "/" + school.id + "-" + school.slug
		path += req.url == "/" ? "" : req.url
		return void res.redirect(308, path)
	}

	req.school = res.locals.school = school

	req.role = (
		account && (yield teachersDb.read(sql`
			SELECT 1 FROM teachers
			WHERE school_id = ${school.id}
			AND country = ${account.country}
			AND personal_id = ${account.personal_id}
		`)) ? "teacher" :

		null
	)

	next()
}))

exports.router.get(SCHOOL_PATH, next(function*(req, res) {
	var {school} = req

	var budgets = yield budgetsDb.search(sql`
		SELECT * FROM budgets
		WHERE school_id = ${school.id}
		ORDER BY created_at DESC
	`)

	res.render("schools/read_page.jsx", {budgets})
}))

exports.router.get(SCHOOL_PATH + "/logo", next(function*(req, res) {
	var {school} = req

	var logo = yield schoolsDb.read(sql`
		SELECT logo AS data, logo_type AS type FROM schools WHERE id = ${school.id}
	`)

	if (logo.data == null) throw new HttpError(404)

	res.setHeader("Content-Type", logo.type)
	res.setHeader("Content-Length", logo.data.length)
	res.end(logo.data)
}))

exports.router.get(SCHOOL_PATH + "/edit",
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

	res.render("schools/update_page.jsx", {teachers})
}))

exports.router.put(SCHOOL_PATH,
	assertAccount,
	assertTeacher,
	next(function*(req, res) {
	var {school} = req
	yield schoolsDb.update(school, parse(req.body, req.files))
	res.statusMessage = "School Updated"
	res.redirect(303, req.baseUrl + req.path + "/edit")
}))

exports.router.get(SCHOOL_PATH + "/ideed/:ideaId", next(function*(req, res) {
	var {school} = req

	var idea = yield ideasDb.read(sql`
		SELECT idea.id, idea.budget_id
		FROM ideas AS idea
		JOIN budgets AS budget ON budget.id = idea.budget_id
		WHERE idea.id = ${req.params.id}
		AND budget.school_id = ${school.id}
	`)

	if (idea == null) throw new HttpError(404, "Idea Not Found")
	var schoolPath = req.baseUrl + "/" + req.params.id + req.params.slug
	var path = schoolPath + "/eelarved/" + idea.budget_id + "/ideed/" + idea.id
	res.redirect(307, path)
}))

exports.router.use(
	SCHOOL_PATH + "/eelarved",
	require("./schools/budgets_controller").router
)

function parse(obj, files) {
	var attrs = {
		name: obj.name,
		description: obj.description || null,

		background_color:
			obj.background_color ? parseColor(obj.background_color) : null,

		foreground_color:
			obj.foreground_color ? parseColor(obj.foreground_color) : null
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
