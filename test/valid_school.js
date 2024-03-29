var _ = require("root/lib/underscore")

module.exports = function(attrs) {
	var name = attrs && attrs.name || "School " + _.uniqueId()

	return _.assign({
		name: name,
		slug: slugify(name),
		logo: null,
		logo_type: null
	}, attrs)
}

function slugify(name) { return name.toLowerCase().replace(/ /g, "-") }
