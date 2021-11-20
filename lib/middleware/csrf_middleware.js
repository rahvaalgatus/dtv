var Config = require("root/config")
var Crypto = require("crypto")
var HttpError = require("standard-http-error")
var SAFE = ["GET", "HEAD", "OPTIONS"]
var QUERY = "csrf-token"
var HEADER = "x-csrf-token"
var BODY = "_csrf_token"
exports = module.exports = CsrfMiddleware
exports.reset = reset

function CsrfMiddleware(req, res, next) {
	req.csrfToken = getFromClient(req, res) || reset(req, res)
	if (SAFE.includes(req.method)) return void next()

	var a = req.csrfToken
	var b = getFromRequest(req)
	next(a && b && a === b ? null : new HttpError(412, "Bad CSRF Token"))
}

function getFromClient(req) {
	return req.cookies && req.cookies[Config.csrfCookieName]
}

function getFromRequest(req) {
	return req.headers[HEADER] || req.query[QUERY] || req.body && req.body[BODY]
}

function reset(req, res, token) {
	if (token == null) token = Crypto.randomBytes(16).toString("hex")

	res.cookie(Config.csrfCookieName, token, {
		httpOnly: true,
		secure: req.secure,
		domain: Config.cookieDomain
	})

	req.csrfToken = token
	return token
}
