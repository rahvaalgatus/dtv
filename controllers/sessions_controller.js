var _ = require("root/lib/underscore")
var Url = require("url")
var Config = require("root/config")
var Crypto = require("crypto")
var Router = require("express").Router
var HttpError = require("standard-http-error")
var MobileId = require("undersign/lib/mobile_id")
var MobileIdError = require("undersign/lib/mobile_id").MobileIdError
var SmartId = require("undersign/lib/smart_id")
var SmartIdError = require("undersign/lib/smart_id").SmartIdError
var Certificate = require("undersign/lib/certificate")
var logger = require("root").logger
var next = require("co-next")
var mobileId = require("root").mobileId
var smartId = require("root").smartId
var accountsDb = require("root/db/accounts_db")
var sessionsDb = require("root/db/sessions_db")
var {getRequestEidMethod} = require("root/lib/eid")
var {ensureAreaCode} = require("root/lib/eid")
var {validateCertificate} = require("root/lib/eid")
var {getCertificatePersonalId} = require("root/lib/eid")
var {getCertificatePersonName} = require("root/lib/eid")
var {getNormalizedMobileIdErrorCode} = require("root/lib/eid")
var {waitForSession} = require("root/lib/eid")
var co = require("co")
var sql = require("sqlate")
var outdent = require("root/lib/outdent")

var waitForMobileIdSession =
	waitForSession.bind(null, mobileId.waitForAuthentication.bind(mobileId))
var waitForSmartIdSession =
	waitForSession.bind(null, smartId.wait.bind(smartId))

var MOBILE_ID_ERRORS = {
	// Initiation responses:
	NOT_FOUND: [
		422,
		"Not a Mobile-Id User or Personal Id Mismatch",
		"Puudub Mobiil-Id tugi. Palun kontrolli telefoninumbrit ja isikukoodi."
	],

	NOT_ACTIVE: [
		422,
		"Mobile-Id Certificates Not Activated",
		"Sinu sertifikaat pole veel aktiveeritud. Palun proovi hiljem uuesti. Probleemi püsimisel võta palun ühendust oma teenusepakkujaga."
	],

	// Session responses;
	TIMEOUT: [
		410,
		"Mobile-Id Timeout",
		"Sisselogimine võttis liiga kaua. Palun proovi uuesti."
	],

	NOT_MID_CLIENT: [
		410,
		"Mobile-Id Certificates Not Activated",
		"Sinu sertifikaat pole veel aktiveeritud. Palun proovi hiljem uuesti. Probleemi püsimisel võta palun ühendust oma teenusepakkujaga."
	],

	USER_CANCELLED: [
		410,
		"Mobile-Id Cancelled",
		"Katkestasid sisselogimise."
	],

	SIGNATURE_HASH_MISMATCH: [
		410,
		"Mobile-Id Signature Hash Mismatch",
		"Mobiil-Id-lt tulnud sisselogimise kinnitus ei vastanud turvanõuetele. Palun proovi uuesti."
	],

	PHONE_ABSENT: [
		410,
		"Mobile-Id Phone Absent",
		"Telefon on välja lülitatud või ei ole leviulatuses."
	],

	DELIVERY_ERROR: [
		410,
		"Mobile-Id Delivery Error",
		"Telefon ei ole sisselogimiseks tehniliselt sobiv või on võrgu töö ajutiselt häiritud."
	],

	SIM_ERROR: [
		410,
		"Mobile-Id SIM Application Error",
		"SIM-kaardi rakenduse viga. Proovi palun uuesti. Probleemi püsimisel võta palun ühendust oma teenusepakkujaga."
	],

	// Custom responses:
	CERTIFICATE_MISMATCH: [
		409,
		"Authentication Certificate Doesn't Match",
		"Autentimissertifikaat ei vasta oodatule."
	],

	INVALID_SIGNATURE: [
		410,
		"Invalid Mobile-Id Signature",
		"Sisselogimine ebaõnnestus, sest digiallkiri ei vasta sertifikaadile."
	]
}

var SMART_ID_ERRORS = {
	// Initiation responses:
	ACCOUNT_NOT_FOUND: [
		422,
		"Not a Smart-Id User",
		"Sellel isikukoodil ei tundu olevat Smart-Id-d."
	],

	// Session responses:
	USER_REFUSED: [
		410,
		"Smart-Id Cancelled",
		"Katkestasid sisselogimise."
	],

	TIMEOUT: [
		410,
		"Smart-Id Timeout",
		"Sisselogimine võttis liiga kaua. Palun proovi uuesti."
	],

	DOCUMENT_UNUSABLE: [
		410,
		"Smart-Id Certificate Unusable",
		"Smart-Id sertifikaat ei ole kasutatav. Palun võta meiega ühendust."
	],

	WRONG_VC: [
		410,
		"Wrong Smart-Id Verification Code Chosen",
		"Kahjuks ei olnud valitud kinnituskood õige. Palun proovi uuesti. "
	],

	// Custom responses:
	CERTIFICATE_MISMATCH: [
		409,
		"Authentication Certificate Doesn't Match",
		"Autentimissertifikaat ei vasta oodatule."
	],

	INVALID_SIGNATURE: [
		410,
		"Invalid Smart-Id Signature",
		"Sisselogimine ebaõnnestus, sest digiallkirja ei vasta sertifikaadile."
	]
}

exports.router = Router({mergeParams: true})
exports.router.use(require("root/lib/eid").parseSignatureBody)

exports.router.get("/", function(req, res) {
	if (req.account) res.redirect(302, referTo(req, req.headers.referer, "/"))
	else res.redirect(302, "/sessions/new")
})

exports.router.get("/new", function(req, res) {
	if (req.account) {
		res.statusMessage = "Already Signed In"
		res.redirect(302, referTo(req, req.headers.referer, "/"))
	}
	else res.render("sessions/create_page.jsx")
})

exports.router.post("/", next(function*(req, res) {
	var method = getRequestEidMethod(req)
	var cert, country, personalId
	var sessionToken, sessionTokenHash, verificationCode
	var err

	switch (method) {
		case "id-card":
			var pem = req.headers["x-client-certificate"]
			if (pem == null) throw new HttpError(400, "Missing Certificate", {
				description: "Tundub, et kas veebilehitseja ei alustanud ID-kaardiga autentimist või otsustasid autentimise katkestada. Kas ID-kaardi tarkvara on installitud ja mujal töötab? Vahel on abi veebilehitseja taasavamisest. Kui vajad abi, palun võta meiega ühendust."
			})

			cert = Certificate.parse(pem.replace(/\t/g, "\n"))
			if (err = validateCertificate(cert)) throw err

			if (req.headers["x-client-certificate-verification"] != "SUCCESS")
				throw new HttpError(422, "Invalid Signature", {
					description: outdent`
						Kahjuks autentimine ei õnnestunud.
						See võib olla tingitud nii valest digiallkirjast kui ka tühistatud ID-kaardist.
						Kui arvad, et tegu on eksitusega, palun võta meiega ühendust.
					`
				})

			;[country, personalId] = getCertificatePersonalId(cert)
			sessionToken = Crypto.randomBytes(16)

			var auth = {
				country: country,
				personal_id: personalId,
				method: "id-card",
				token: sessionToken,
				certificate: cert,
				created_ip: req.ip,
				created_user_agent: req.headers["user-agent"]
			}

			var account = yield readOrCreateAccount(auth)
			yield createSession(auth, account)
			signIn(sessionToken, req, res)

			res.statusMessage = "Signed In"
			res.redirect(302, "/")
			break

		case "mobile-id":
			var phoneNumber = ensureAreaCode(req.body.phoneNumber)
			personalId = req.body.personalId

			// Log Mobile-Id requests to confirm SK's billing.
			logger.info(
				"Authenticating via Mobile-Id for %s and %s.",
				phoneNumber,
				personalId
			)

			cert = yield mobileId.readCertificate(phoneNumber, personalId)
			if (err = validateCertificate(cert)) throw err

			;[country, personalId] = getCertificatePersonalId(cert)
			if (country != "EE") throw new HttpError(422, "Estonian Users Only")

			sessionToken = Crypto.randomBytes(16)
			sessionTokenHash = _.sha256(sessionToken)

			var mobileIdSession = yield mobileId.authenticate(
				phoneNumber,
				personalId,
				sessionTokenHash
			)

			verificationCode = MobileId.confirmation(sessionTokenHash)
			respondWithVerificationCode(sessionToken, verificationCode, res)

			co(waitForMobileIdAuthentication({
				country: country,
				personal_id: personalId,
				method: "mobile-id",
				token: sessionToken,
				created_ip: req.ip,
				created_user_agent: req.headers["user-agent"]
			}, mobileIdSession, res))
			break

		case "smart-id":
			personalId = req.body.personalId

			// Log Smart-Id requests to confirm SK's billing.
			logger.info("Authenticating via Smart-Id for %s.", personalId)

			sessionToken = Crypto.randomBytes(16)
			sessionTokenHash = _.sha256(sessionToken)

			var smartIdSession = yield smartId.authenticate(
				"PNOEE-" + personalId,
				sessionTokenHash
			)

			verificationCode = SmartId.verification(sessionTokenHash)
			respondWithVerificationCode(sessionToken, verificationCode, res)

			co(waitForSmartIdAuthentication({
				country: "EE",
				personal_id: personalId,
				method: "smart-id",
				token: sessionToken,
				created_ip: req.ip,
				created_user_agent: req.headers["user-agent"]
			}, smartIdSession, res))
			break

		default: throw new HttpError(422, "Unknown Authentication Method")
	}

	function respondWithVerificationCode(sessionToken, verificationCode, res) {
		// Without a byte of body, Firefox won't resolve the Fetch promise.
		res.statusCode = 202
		res.setHeader("X-Accel-Buffering", "no")
		res.setHeader("X-Verification-Code", _.padLeft(verificationCode, 4, 0))
		res.setHeader("Content-Type", "application/json")

		// Reuse signed token or generate new?
		signIn(sessionToken, req, res)
		res.write("\n")
	}
}), function(err, _req, _res, next) {
	if (
		err instanceof MobileIdError ||
		err instanceof SmartIdError
	) err = serializeError(err)

	next(err)
})

exports.router.use("/:id", next(function*(req, _res, next) {
	if (req.account == null) throw new HttpError(401)

	var id = Number(req.params.id)
	var session = req.session.id == id ? req.session : yield sessionsDb.read(sql`
		SELECT * FROM sessions WHERE id = ${id} AND account_id = ${req.account.id}
	`)

	if (session == null) throw new HttpError(404, "Session Not Found")
	req.editableSession = session
	next()
}))

exports.router.delete("/:id", next(function*(req, res) {
	var session = req.editableSession
	if (session.deleted_at) throw new HttpError(410, "Session Gone")

	yield sessionsDb.update(session, {deleted_at: new Date})

	// NOTE: There's no security benefit in resetting the CSRF token on signout.
	if (req.session.id == session.id) res.clearCookie(Config.sessionCookieName, {
		httpOnly: true,
		secure: req.secure,
		domain: Config.cookieDomain
	})

	var to = req.headers.referer
	if (to && Url.parse(to).pathname == "/account") to = "/"
	else if (!to) to = "/"
	res.redirect(303, to)
}))

function referTo(req, referrer, fallback) {
	if (referrer == null) return fallback
	var referrerHost = Url.parse(referrer).hostname
	return req.hostname == referrerHost ? referrer : fallback
}

function* waitForMobileIdAuthentication(authentication, mobileIdSession, res) {
	try {
		var certAndSignatureHash =
			yield waitForMobileIdSession(120, mobileIdSession)

		if (certAndSignatureHash == null) throw new MobileIdError("TIMEOUT")
		var [cert, signatureHash] = certAndSignatureHash

		var err
		if (err = validateCertificate(cert)) throw err

		var [country, personalId] = getCertificatePersonalId(cert)
		if (
			authentication.country != country ||
			authentication.personal_id != personalId
		) throw new MobileIdError("CERTIFICATE_MISMATCH")

		if (!cert.hasSigned(authentication.token, signatureHash))
			throw new MobileIdError("INVALID_SIGNATURE")

		authentication.certificate = cert
		var account = yield readOrCreateAccount(authentication)
		yield createSession(authentication, account)
		res.end(JSON.stringify({code: "OK", location: "/"}))
	}
	catch (ex) {
		if (!(
			ex instanceof HttpError ||
			ex instanceof MobileIdError &&
			getNormalizedMobileIdErrorCode(ex) in MOBILE_ID_ERRORS
		)) logger.error(ex)

		res.end(jsonfiyError(serializeError(ex)))
	}
}

function* waitForSmartIdAuthentication(authentication, smartIdSession, res) {
	try {
		var certAndSignatureHash = yield waitForSmartIdSession(120, smartIdSession)
		if (certAndSignatureHash == null) throw new SmartIdError("TIMEOUT")
		var [cert, signature] = certAndSignatureHash

		var err
		if (err = validateCertificate(cert)) throw err

		var [country, personalId] = getCertificatePersonalId(cert)
		if (
			authentication.country != country ||
			authentication.personal_id != personalId
		) throw new SmartIdError("CERTIFICATE_MISMATCH")

		if (!cert.hasSigned(authentication.token, signature))
			throw new SmartIdError("INVALID_SIGNATURE")

		authentication.certificate = cert
		var account = yield readOrCreateAccount(authentication)
		yield createSession(authentication, account)
		res.end(JSON.stringify({code: "OK", location: "/"}))
	}
	catch (ex) {
		if (!(
			ex instanceof HttpError ||
			ex instanceof SmartIdError && ex.code in SMART_ID_ERRORS
		)) logger.error(ex)

		res.end(jsonfiyError(serializeError(ex)))
	}
}

function* readOrCreateAccount(auth) {
	var account = yield accountsDb.read(sql`
		SELECT * FROM accounts
		WHERE country = ${auth.country}
		AND personal_id = ${auth.personal_id}
	`)

	if (account) return account
	if (auth.country != "EE") throw new HttpError(501, "Estonian Accounts Only")

	var officialName = getCertificatePersonName(auth.certificate)

	return accountsDb.create({
		country: auth.country,
		personal_id: auth.personal_id,
		name: officialName,
		official_name: officialName,
		created_at: new Date,
		updated_at: new Date
	})
}

function* createSession(authentication, account) {
	yield sessionsDb.create({
		account_id: account.id,
		token_sha256: _.sha256(authentication.token),
		method: authentication.method,
		created_ip: authentication.created_ip,
		created_user_agent: authentication.created_user_agent
	})
}

function signIn(token, req, res) {
	res.cookie(Config.sessionCookieName, token.toString("hex"), {
		httpOnly: true,
		secure: req.secure,
		domain: Config.cookieDomain,
		maxAge: 365 * 86400 * 1000
	})
}

function serializeError(err) {
	if (err instanceof MobileIdError) {
		var code = getNormalizedMobileIdErrorCode(err)

		if (code in MOBILE_ID_ERRORS) return new HttpError(
			MOBILE_ID_ERRORS[code][0],
			MOBILE_ID_ERRORS[code][1],
			{description: MOBILE_ID_ERRORS[code][2]}
		)
		else return new HttpError(500, "Unknown Mobile-Id Error", {error: err})
	}
	else if (err instanceof SmartIdError) {
		if (err.code in SMART_ID_ERRORS) return new HttpError(
			SMART_ID_ERRORS[err.code][0],
			SMART_ID_ERRORS[err.code][1],
			{description: SMART_ID_ERRORS[err.code][2]}
		)
		else return new HttpError(500, "Unknown Smart-Id Error", {error: err})
	}
	else return err
}

function jsonfiyError(err) {
	return JSON.stringify({
		code: err.code,
		message: err.message,
		description: err.description
	})
}
