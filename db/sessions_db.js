var _ = require("root/lib/underscore")
var Db = require("root/lib/db")
var sqlite = require("root").sqlite
exports = module.exports = new Db(Object, sqlite, "sessions")

exports.parse = function(attrs) {
	return _.defaults({
		created_at: attrs.created_at && new Date(attrs.created_at),
		last_used_on: attrs.last_used_on && _.parseIsoDate(attrs.last_used_on),
		deleted_at: attrs.deleted_at && new Date(attrs.deleted_at)
	}, attrs)
}

exports.serialize = function(model) {
	var obj = _.clone(model)

	if (model.last_used_on)
		obj.last_used_on = _.formatDate("iso", model.last_used_on)

	return obj
}
