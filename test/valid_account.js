var _ = require("root/lib/underscore")

module.exports = function(attrs) {
	var createdAt = new Date
	var country = attrs && attrs.country || "EE"

	var personalId = attrs && "personal_id" in attrs
		? attrs.personal_id
		: randomPersonalId()

	var name = attrs && attrs.name || "John " + _.uniqueId()

	return _.assign({
		created_at: createdAt,
		updated_at: createdAt,
		country: country,
		personal_id: personalId,
		name: name,
		official_name: personalId == null ? null : name
	}, attrs)
}

function randomPersonalId() {
	return _.padLeft(String(Math.floor(Math.random() * 1e11)), 11, "1")
}
