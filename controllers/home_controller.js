var _ = require("root/lib/underscore")
var Config = require("root/config")
var Router = require("express").Router
var L10n = require("root/lib/l10n")
var schoolsDb = require("root/db/schools_db")
var sql = require("sqlate")
var next = require("co-next")
exports.router = Router({mergeParams: true})

exports.router.get("/eelarve", next(function*(_req, res) {
	var schools = yield schoolsDb.search(sql`
		SELECT id, slug, name FROM schools
		ORDER BY name ASC
	`)

	res.render("budgeting/index_page.jsx", {schools})
}))

_.each({
	"/": "index_page.jsx",
	"/eelarve/abi": "budgeting/help_page.jsx"
}, (page, path) => exports.router.get(path, (_req, res) => res.render(page)))

exports.router.put("/language", function(req, res) {
	var lang = req.body.language

	if (L10n.LANGUAGES.has(lang)) {
		if (
			req.cookies[Config.languageCookieName] &&
			Config.languageCookieDomain
		) res.clearCookie(Config.languageCookieName, {
			httpOnly: true,
			secure: req.secure
		})

		res.cookie(Config.languageCookieName, lang, {
			httpOnly: true,
			secure: req.secure,
			maxAge: 365 * 86400 * 1000,
			domain: Config.languageCookieDomain
		})

		res.statusMessage = "Language Updated"
	}
	else res.statusMessage = "Unknown Language"

	res.redirect(303, req.headers.referer || "/")
})
