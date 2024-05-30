var _ = require("root/lib/underscore")
var Xades = require("undersign/xades")
var Certificate = require("undersign/lib/certificate")
var {newCertificate} = require("root/test/fixtures")
var {randomPersonalId} = require("root/test/valid_account")

var xades = Xades.parse(String(new Xades(new Certificate(newCertificate({
	subject: {countryName: "EE"},
	issuer: {countryName: "EE"}
})), [])))

module.exports = function(attrs) {
	return _.assign({
		created_at: new Date,
		voter_country: attrs && attrs.country || "EE",
		voter_personal_id: attrs && attrs.personal_id || randomPersonalId(),
		voter_name: attrs && attrs.name || "John " + _.uniqueId(),
		method: "id-card",
		signable: "I vote for " + _.uniqueId() + ".",
		xades
	}, attrs)
}
