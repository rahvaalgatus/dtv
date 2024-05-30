var _ = require("root/lib/underscore")
var DateFns = require("date-fns")
var Config = require("root/config")
var accountsDb = require("root/db/accounts_db")
var sessionsDb = require("root/db/sessions_db")
var next = require("co-next")
var sql = require("sqlate")

module.exports = next(function*(req, _res, next) {
	req.session = null
	req.account = null

	var sessionToken = req.cookies[Config.sessionCookieName]
	if (sessionToken == null) return void next()

	var session = yield sessionsDb.read(sql`
		SELECT * FROM sessions
		WHERE token_sha256 = ${_.sha256(Buffer.from(sessionToken, "hex"))}
		AND deleted_at IS NULL
	`)

	if (session == null) return void next()

	var today = DateFns.startOfDay(new Date)

	if (session.last_used_on == null || session.last_used_on < today)
		session = yield sessionsDb.update(session, {last_used_on: today})

	var account = yield accountsDb.read(session.account_id)
	if (account.anonymized_at) return void next()

	req.session = session
	req.account = account
	next()
})
