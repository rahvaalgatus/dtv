var _ = require("root/lib/underscore")

module.exports = function(attrs) {
	var title = attrs && attrs.title || "Budget " + _.uniqueId()

	return _.assign({
		title: title
	}, attrs)
}