var Router = require("express").Router
var schoolsDb = require("root/db/schools_db")
var sql = require("sqlate")
var next = require("co-next")
exports.router = Router({mergeParams: true})

exports.router.get("/", next(function*(_req, res) {
	var schools = yield schoolsDb.search(sql`SELECT * FROM schools`)
	res.render("index_page.jsx", {schools})
}))
