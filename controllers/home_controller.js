var _ = require("root/lib/underscore")
var Router = require("express").Router
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
