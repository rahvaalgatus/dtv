var _ = require("lodash")
var O = require("oolong")
var Crypto = require("crypto")
var formatDateTime = require("date-fns/format")
var ISO8601_DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/

exports.assign = O.assign
exports.create = O.create
exports.defaults = O.defaults
exports.merge = O.merge
exports.clone = O.clone
exports.mapValues = O.map
exports.values = O.values
exports.each = _.each
exports.padLeft = _.padStart
exports.find = _.find
exports.uniq = _.uniq
exports.map = _.map
exports.indexBy = _.keyBy
exports.max = _.max
exports.sortBy = _.sortBy
exports.wrap = _.wrap
exports.uniqueId = _.uniqueId
exports.isEmpty = O.isEmpty
exports.const = function(value) { return function() { return value } }
exports.add = function(a, b) { return a + b }
exports.sum = function(array) { return array.reduce(exports.add, 0) }
exports.first = function(array) { return array[0] }
exports.second = function(array) { return array[1] }

exports.formatDate = function(format, date) {
	switch (format) {
		case "iso": return formatDateTime(date, "YYYY-MM-DD")
		case "et": return formatDateTime(date, "D.MM.YYYY")
		default: throw new RangeError("Invalid format: " + format)
	}
}

exports.parseIsoDate = function(date) {
	var match = ISO8601_DATE.exec(date)
	if (match == null) throw new SyntaxError("Invalid Date: " + date)
	return new Date(+match[1], +match[2] - 1, +match[3])
}

exports.sha256 = function(data) {
	return new Crypto.Hash("sha256").update(data).digest()
}

exports.plural = function(n, singular, plural) {
	return n == 1 ? singular : plural
}

