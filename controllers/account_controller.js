var Router = require("express").Router
var HttpError = require("standard-http-error")
var next = require("co-next")
var accountsDb = require("root/db/accounts_db")
exports.router = Router({mergeParams: true})

exports.router.get("/", assertAccount, function(req, res) {
	var {account} = req
	res.render("accounts/read_page.jsx", {account})
})

exports.router.put("/", assertAccount, next(function*(req, res) {
	var {account} = req
	yield accountsDb.update(account, parse(req.body))
	res.redirect(303, req.baseUrl)
}))

function parse(obj) {
	return {name: obj.name}
}

function assertAccount(req, _res, next) {
	if (req.account == null) throw new HttpError(401, {
		description: req.t("401_error_page.description")
	})

	next()
}
