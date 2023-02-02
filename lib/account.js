var Config = require("root/config")

exports.isAdmin = function(account) {
	return Config.adminPersonalIds.includes(exports.serializePersonalId(account))
}

exports.serializePersonalId = function(account) {
	return account.country + account.personal_id
}

exports.cleanPersonalId = function(personalId) {
	return personalId.replace(/[^0-9]/g, "")
}
