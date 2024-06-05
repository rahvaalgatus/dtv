var _ = require("root/lib/underscore")
var Db = require("root/lib/db")
var sqlite = require("root").sqlite
exports = module.exports = new Db(Object, sqlite, "teachers")
exports.idAttribute = null
exports.idColumn = null

exports.parse = function(attrs) {
	return _.defaults({
		created_at: attrs.created_at && new Date(attrs.created_at)
	}, attrs)
}
