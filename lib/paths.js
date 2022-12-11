exports.schoolPath = function(school) {
	return "/schools/" + school.id + "-" + school.slug
}

exports.ideaPath = function(school, idea) {
	return exports.schoolPath(school) + "/ideas/" + idea.id
}
