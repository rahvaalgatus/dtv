var _ = require("root/lib/underscore")
var Db = require("root/lib/db")
var sqlite = require("root").sqlite
exports = module.exports = new Db(Object, sqlite, "schools")

exports.parse = function(attrs) {
	return _.defaults({
		voting_starts_at: attrs.voting_starts_at &&
			new Date(attrs.voting_starts_at),

		voting_ends_at: attrs.voting_ends_at && new Date(attrs.voting_ends_at),
	}, attrs)
}
