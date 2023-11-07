var L10n = require("root/lib/l10n")
var Config = require("root/config")

module.exports = function(req, res, next) {
	var lang = req.cookies[Config.languageCookieName]
	var l10n = new L10n(L10n.LANGUAGES.has(lang) ? lang : "et")
	req.l10n = res.locals.l10n = l10n
	req.t = res.locals.t = l10n.t
	next()
}
