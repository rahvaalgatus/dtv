exports.schoolsPath = "/koolid"

exports.schoolPath = function(school) {
	return [
		exports.schoolsPath,
		school.id + "-" + encodeURIComponent(school.slug)
	].join("/")
}

exports.updateSchoolPath = function(school) {
	return exports.schoolPath(school) + "/edit"
}

exports.budgetsPath = function(school) {
	return exports.schoolPath(school) + "/eelarved"
}

exports.createBudgetPath = function(school) {
	return exports.budgetsPath(school) + "/new"
}

exports.budgetPath = function(school, budget) {
	return exports.budgetsPath(school) + "/" + budget.id
}

exports.updateBudgetPath = function(school, budget) {
	return exports.budgetsPath(school) + "/" + budget.id + "/edit"
}

exports.votesPath = function(school, budget) {
	return exports.budgetPath(school, budget) + encodeURI("/hääled")
}

exports.ideasPath = function(school, budget) {
	return exports.budgetPath(school, budget) + "/ideed"
}

exports.createIdeaPath = function(school, budget) {
	return exports.ideasPath(school, budget) + "/new"
}

exports.ideaPath = function(school, idea) {
	return exports.ideasPath(school, {id: idea.budget_id}) + "/" + idea.id
}

exports.updateIdeaPath = function(school, idea) {
	return exports.ideasPath(school, {id: idea.budget_id}) + "/" + idea.id + "/edit"
}

exports.paperVotesPath = function(school, budget) {
	return exports.budgetPath(school, budget) + encodeURI("/paberhääled")
}
