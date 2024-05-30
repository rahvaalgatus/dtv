var _ = require("root/lib/underscore")
var Db = require("root/lib/db")
var sqlite = require("root").sqlite
exports = module.exports = new Db(Object, sqlite, "budgets")

exports.parse = function(attrs) {
	return _.defaults({
		created_at: attrs.created_at && new Date(attrs.created_at),
		expired_at: attrs.expired_at && new Date(attrs.expired_at),
		anonymized_at: attrs.anonymized_at && new Date(attrs.anonymized_at),

		voting_starts_at: attrs.voting_starts_at &&
			new Date(attrs.voting_starts_at),

		voting_ends_at: attrs.voting_ends_at && new Date(attrs.voting_ends_at),
	}, attrs)
}
