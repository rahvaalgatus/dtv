var _ = require("root/lib/underscore")
var Db = require("root/lib/db")
var Xades = require("undersign/xades")
var sqlite = require("root").sqlite
var sql = require("sqlate")
exports = module.exports = new Db(Object, sqlite, "votes")
exports.idAttribute = "token"
exports.idColumn = "token"

exports.parse = function(attrs) {
	return _.defaults({
		created_at: attrs.created_at && new Date(attrs.created_at),
		xades: attrs.xades && Xades.parse(attrs.xades)
	}, attrs)
}

exports.serialize = function(model) {
	var obj = _.clone(model)
	if (model.xades instanceof Xades) obj.xades = String(model.xades)
	return obj
}

exports.countVotesByIdea = function*(budgetId) {
	return _.mapValues(_.indexBy(yield exports.search(sql`
		WITH merged_votes AS (
			SELECT vote.idea_id
			FROM votes AS vote

			LEFT JOIN paper_votes AS paper_vote
			ON paper_vote.budget_id = vote.budget_id
			AND paper_vote.voter_country = vote.voter_country
			AND paper_vote.voter_personal_id = vote.voter_personal_id

			WHERE vote.budget_id = ${budgetId}
			AND paper_vote.voter_personal_id IS NULL

			UNION ALL

			SELECT idea_id FROM paper_votes
			WHERE budget_id = ${budgetId}
		)

		SELECT idea_id, COUNT(*) AS count
		FROM merged_votes
		GROUP BY idea_id
	`), "idea_id"), (votes) => votes.count)
}
