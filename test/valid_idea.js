var _ = require("root/lib/underscore")

module.exports = function(attrs) {
	var createdAt = new Date

	return _.assign({
		created_at: createdAt,
		updated_at: createdAt,
		title: "Idea #" + _.uniqueId(),
		description: "More representation of number " + _.uniqueId(),
		author_names: "Bob the #" + _.uniqueId()
	}, attrs)
}
