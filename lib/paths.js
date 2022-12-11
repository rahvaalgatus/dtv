exports.schoolsPath = "/koolid"

exports.schoolPath = function(school) {
	return exports.schoolsPath + "/" + school.id + "-" + school.slug
}

exports.editSchoolPath = function(school) {
	return exports.schoolPath(school) + "/edit"
}

exports.votesPath = function(school) {
	return exports.schoolPath(school) + encodeURI("/hääled")
}

exports.ideasPath = function(school) {
	return exports.schoolPath(school) + "/ideed"
}

exports.ideaPath = function(school, idea) {
	return exports.schoolPath(school) + "/ideed/" + idea.id
}

exports.paperVotesPath = function(school) {
	return exports.schoolPath(school) + encodeURI("/paberhääled")
}
