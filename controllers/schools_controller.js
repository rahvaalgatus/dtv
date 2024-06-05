var _ = require("root/lib/underscore")
var Path = require("path")
var Paths = require("root/lib/paths")
var Router = require("express").Router
var HttpError = require("standard-http-error")
var schoolsDb = require("root/db/schools_db")
var budgetsDb = require("root/db/budgets_db")
var teachersDb = require("root/db/teachers_db")
var ideasDb = require("root/db/ideas_db")
var {isValidImageType} = require("root/lib/image")
var {cleanPersonalId} = require("root/lib/account")
var {isAdmin} = require("root/lib/account")
var SCHOOL_PATH = "/:id:slug(-[^/]+)?"
var next = require("co-next")
var sql = require("sqlate")
exports.router = Router({mergeParams: true})
exports.assertAccount = assertAccount
exports.assertTeacher = assertTeacher

exports.router.get("/", (_req, res) => res.redirect(302, "/"))

exports.router.get("/new", assertAccount, assertAdmin, function(_req, res) {
	res.render("schools/create_page.jsx")
})

exports.router.post("/", assertAccount, assertAdmin, next(function*(req, res) {
	var school = yield schoolsDb.create(parseAsAdmin(req.body, req.files))

	var teachers = parseTeacherPersonalIds(req.body.teachers)

	teachers.forEach((teacher) => {
		teacher.school_id = school.id
		teacher.created_at = new Date
	})

	yield teachersDb.create(teachers)

	res.statusMessage = "School Created"
	res.redirect(303, Paths.schoolPath(school))
}))

exports.router.use(SCHOOL_PATH, next(function*(req, res, next) {
	var {t} = req
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
		description: t("school_page.404_error.description")
	})

	if (school.slug != slug) {
		var path = Path.dirname(req.baseUrl) + "/" + school.id + "-" + school.slug
		path += req.url == "/" ? "" : req.url
		return void res.redirect(308, path)
	}

	req.school = res.locals.school = school

	if (account && (yield teachersDb.read(sql`
		SELECT 1 FROM teachers
		WHERE school_id = ${school.id}
		AND country = ${account.country}
		AND personal_id = ${account.personal_id}
	`))) req.roles.push("teacher")

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
	var {account} = req
	var {school} = req
	var attrs = (isAdmin(account) ? parseAsAdmin : parse)(req.body, req.files)
	yield schoolsDb.update(school, attrs)


	if ("teachers" in req.body && isAdmin(account)) {
		var teachers = parseTeacherPersonalIds(req.body.teachers)

		// SQLite v3.28 used currently doesn't support multiple tuples in an `IN`
		// query. Sometime after v3.28 and before v3.46 it became possible.
		yield teachersDb.execute(sql`
			DELETE FROM teachers WHERE school_id = ${school.id}

			AND NOT (${teachers.length ? concatSql(_.intersperse(teachers.map((t) =>
				sql`country = ${t.country} AND personal_id = ${t.personal_id}`
			), sql` OR `)) : sql`false`})
		`)

		var now = new Date

		if (teachers.length) yield teachersDb.execute(sql`
			INSERT INTO teachers (school_id, country, personal_id, created_at)
			VALUES ${sql.csv(teachers.map((teacher) => sql.tuple([
				school.id,
				teacher.country,
				teacher.personal_id,
				now
			])))}
			ON CONFLICT (school_id, country, personal_id) DO NOTHING
		`)
	}

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
	var attrs = {}

	if ("name" in obj) attrs.name = String(obj.name)
	if ("description" in obj) attrs.description = String(obj.description) || null

	if ("background_color" in obj) attrs.background_color =
		obj.background_color ? parseColor(obj.background_color) : null

	if ("foreground_color" in obj) attrs.foreground_color =
		obj.foreground_color ? parseColor(obj.foreground_color) : null

	if (files.logo && isValidImageType(files.logo.mimetype)) {
		attrs.logo = files.logo.buffer
		attrs.logo_type = files.logo.mimetype
	}

	return attrs
}

function parseAsAdmin(obj, files) {
	var attrs = parse(obj, files)

	if ("slug" in obj)
		attrs.slug = obj.slug.toLowerCase().replace(/[^-_\wäöüõ]/g, "")

	return attrs
}

function parseColor(color) {
	// As <input type=color> always defaults to black if empty, pick one color to
	// imply that it was not changed
	if (color == "#000001") return null
	if (/^#[A-Za-z0-9]{1,8}$/.test(color)) return color
	return null
}

function assertAccount({t, account}, _res, next) {
	if (account == null) throw new HttpError(401, {
		description: t("401_error_page.description")
	})

	else next()
}

function assertAdmin({t, account}, _res, next) {
	if (isAdmin(account)) next()
	else throw new HttpError(403, "Not an Admin", {
		description: t("403_error_page.admin_description")
	})
}

function assertTeacher(req, _res, next) {
	if (req.roles.includes("admin") || req.roles.includes("teacher")) next()
	else throw new HttpError(403, "Not a Teacher")
}

function parseTeacherPersonalIds(personalIds) {
	personalIds = _.uniq(personalIds.trim().split(/\s+/g).map(cleanPersonalId))
	personalIds = personalIds.filter(Boolean)
	return personalIds.map((id) => ({country: "EE", personal_id: id}))
}

function concatSql(sqls) {
	return sql.apply(null, [_.fill(new Array(sqls.length + 1), "")].concat(sqls))
}
