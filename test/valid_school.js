var _ = require("root/lib/underscore")

module.exports = function(attrs) {
	return _.assign({
		name: attrs && attrs.name || "School " + _.uniqueId()
	}, attrs)
}
