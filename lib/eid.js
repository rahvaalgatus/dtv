var _ = require("./underscore")
var Config = require("root/config")
var MediaType = require("medium-type")
var HttpError = require("standard-http-error")
var tsl = require("root").tsl
var VALID_ISSUERS = Config.issuers.map((p) => p.join(","))
VALID_ISSUERS = VALID_ISSUERS.map(tsl.getBySubjectName.bind(tsl))

exports.getRequestEidMethod = function(req) {
	var type = (
		req.headers["content-type"] &&
		MediaType.parse(req.headers["content-type"]).name
	)

	return (
		type == "application/x-www-form-urlencoded" ? req.body.method :
		type == "application/json" ? req.body.method :
		type == "application/pkix-cert" ? "id-card" :
		type == "application/vnd.rahvaalgatus.signature" ? "id-card" :
		null
	)
}

exports.ensureAreaCode = function(number) {
	number = number.replace(/[-()[\] ]/g, "")
	if (/^\+/.test(number)) return number
	if (/^3[567][0-9]/.test(number)) return "+" + number
	return "+372" + number
}


exports.validateCertificate = function(cert) {
	// Undersign's Certificates.prototype.getIssuer confirms the cert was also
	// signed by the issuer.
	var issuer = tsl.getIssuer(cert)

	if (!VALID_ISSUERS.includes(issuer))
		return new HttpError(422, "Invalid Issuer", {
			description: "Andestust, kuid me ei toeta veel sinu sertifikaati. Palun anna meile sellest teada."
		})

	if (cert.validFrom > new Date)
		return new HttpError(422, "Certificate Not Yet Valid", {
			description: "Andestust, kuid sinu sertifikaat ei paista olevat veel aktiivne."
		})

	if (cert.validUntil <= new Date)
		return new HttpError(422, "Certificate Expired", {
			description: "Andestust, kuid sinu sertifikaat paistab olevat juba aegunud."
		})

	return null
}

exports.getCertificatePersonalId = function(cert) {
	var obj = _.assign({}, ...cert.subject), pno

	if (pno = /^PNO([A-Z][A-Z])-(\d+)$/.exec(obj.serialNumber))
		return [pno[1], pno[2]]
	else
		return [obj.countryName, obj.serialNumber]
}

exports.getCertificatePersonName = function(cert) {
	var obj = _.assign({}, ...cert.subject)
	return capitalizeName(obj.givenName + " " + obj.surname)
}

exports.waitForSession = function*(wait, timeout, session) {
	var res
	for (
		var started = Date.now() / 1000, elapsed = 0;
		res == null && elapsed < timeout;
		elapsed = Date.now() / 1000 - started
	) res = yield wait(session, timeout - elapsed)
	return res
}

exports.getNormalizedMobileIdErrorCode = function(err) {
	return (
		isMobileIdPersonalIdError(err) ? "NOT_FOUND" :
		isMobileIdPhoneNumberError(err) ? "NOT_FOUND"
		: err.code
	)

	function isMobileIdPersonalIdError(err) {
		return (
			err.code == "BAD_REQUEST" &&
			err.message.match(/\bnationalIdentityNumber\b/)
		)
	}

	function isMobileIdPhoneNumberError(err) {
		return (
			err.code == "BAD_REQUEST" &&
			err.message.match(/\bphoneNumber\b/)
		)
	}
}

function capitalizeName(name) {
	return name.toLowerCase().replace(/((?:^|[-_ '’]).)/gu, (char) => (
		char.toUpperCase()
	))
}
