var _ = require("./underscore")
var TEXTS = require("./texts")
exports = module.exports = L10n
var LANGS = exports.LANGUAGES = new Set(["et", "en"])

function L10n(lang) {
	if (!LANGS.has(lang)) throw new RangeError("Invalid language: " + lang)
	this.language = lang
	this.t = this.t.bind(this)
}

L10n.prototype.t = function(id, props) {
	var texts = TEXTS[id]
	if (texts == null) throw new RangeError("Invalid text id: " + id)
	var text = texts[this.language] || texts.et
	return props == null ? text : interpolate(id, text, props)
}

L10n.prototype.formatDate = function(date) {
	return _.formatDate(this.language, date)
}

function interpolate(id, string, props) {
	return string.replace(/\{(\w+)\}/g, function(_match, propId) {
		if (propId in props) return props[propId]
		else throw new RangeError("Missing property for " + id + ": " + propId)
	})
}
