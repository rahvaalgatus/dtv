var _ = require("root/lib/underscore")

module.exports = function(attrs) {
	var title = attrs && attrs.title || "Budget " + _.uniqueId()

	return _.assign({
		title: title,
		expired_at: null,
		anonymized_at: null
	}, attrs)
}
