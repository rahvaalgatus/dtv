var _ = require("lodash")
var O = require("oolong")
var Crypto = require("crypto")
var egal = require("egal")
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
exports.omit = _.omit
exports.indexBy = _.keyBy
exports.groupBy = _.groupBy
exports.max = _.max
exports.sortBy = _.sortBy
exports.wrap = _.wrap
exports.uniqueId = _.uniqueId
exports.fill = _.fill
exports.isEmpty = O.isEmpty
exports.countBy = _.countBy
exports.toEntries = _.toPairs
exports.fromEntries = _.fromPairs
exports.times = _.times
exports.deepEquals = egal.deepEgal
exports.const = function(value) { return function() { return value } }
exports.add = function(a, b) { return a + b }
exports.sum = function(array) { return array.reduce(exports.add, 0) }
exports.first = function(array) { return array[0] }
exports.second = function(array) { return array[1] }
exports.isArray = Array.isArray
exports.concat = Array.prototype.concat.bind(Array.prototype)

exports.formatDate = function(format, date) {
	switch (format) {
		case "iso": return formatDateTime(date, "YYYY-MM-DD")
		case "et": return formatDateTime(date, "D.MM.YYYY")
		case "en": return formatDateTime(date, "MMM D, YYYY")
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

exports.split2 = function(array, at) {
	var index = array.indexOf(at)
	return index >= 0 ? [array.slice(0, index), array.slice(index + 1)] : [array]
}

exports.intersperse = function(array, elem) {
	if (array.length < 2) return array

	var output = new Array(array.length + array.length - 1)
	output[0] = array[0]

	for (var i = 1; i < array.length; ++i) {
		output[i * 2 - 1] = elem
		output[i * 2] = array[i]
	}

	return output
}
