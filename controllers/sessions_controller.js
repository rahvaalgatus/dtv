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
var ExpiringMap = require("root/lib/expiring_map")
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
var authentications = new ExpiringMap(process.env.ENV == "test" ? 5 : 5 * 60)

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

exports.router.get("/new", function(req, res) {
	if (req.account) res.redirect(302, referTo(req, req.headers.referer, "/"))
	else res.render("sessions/create_page.jsx")
})

exports.router.post("/", next(function*(req, res) {
	var method = getRequestEidMethod(req)
	var cert, country, token, tokenHash, verificationCode, err, personalId

	switch (method) {
		case "id-card":
			var authToken = req.query["authentication-token"]

			if (authToken == null) {
				cert = Certificate.parse(req.body)
				if (err = validateCertificate(cert)) throw err

				;[country, personalId] = getCertificatePersonalId(cert)
				if (country != "EE") throw new HttpError(422, "Estonian Users Only")

				token = Crypto.randomBytes(16)
				tokenHash = _.sha256(token)

				var authUrl = req.baseUrl
				authUrl += "?authentication-token=" + token.toString("hex")
				res.setHeader("Location", authUrl)
				res.setHeader("Content-Type", "application/vnd.rahvaalgatus.signable")
				res.status(202).end(tokenHash)

				authentications.set(token, {
					country: country,
					personal_id: personalId,
					method: "id-card",
					certificate: cert,
					token: token,
					created_ip: req.ip,
					created_user_agent: req.headers["user-agent"]
				})
			}
			else {
				var auth = authentications.delete(Buffer.from(authToken || "", "hex"))

				if (!auth) throw new HttpError(404, "Authentication Not Found", {
					description: "Kahjuks sisselogimine aegus. Palun proovi uuesti."
				})

				if (!auth.certificate.hasSigned(auth.token, req.body))
					throw new HttpError(409, "Invalid Signature", {
						description: "Digiallkiri ei vasta sertifikaadile."
					})

				var sessionToken = Crypto.randomBytes(16)
				var account = yield readOrCreateAccount(auth)
				yield createSession(auth, account, sessionToken)
				signIn(sessionToken, req, res)
				res.setHeader("Content-Type", "application/json")
				res.status(201).end(JSON.stringify({code: "OK", location: "/"}))
			}
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

			token = Crypto.randomBytes(16)
			tokenHash = _.sha256(token)

			var sessionId = yield mobileId.authenticate(
				phoneNumber,
				personalId,
				tokenHash
			)

			verificationCode = MobileId.confirmation(tokenHash)
			respondWithVerificationCode(token, verificationCode, res)

			co(waitForMobileIdAuthentication({
				country: country,
				personal_id: personalId,
				method: "mobile-id",
				token: token,
				created_ip: req.ip,
				created_user_agent: req.headers["user-agent"]
			}, sessionId, res))
			break

		case "smart-id":
			personalId = req.body.personalId

			// Log Smart-Id requests to confirm SK's billing.
			logger.info("Authenticating via Smart-Id for %s.", personalId)

			token = Crypto.randomBytes(16)
			tokenHash = _.sha256(token)

			var session = yield smartId.authenticate("PNOEE-" + personalId, tokenHash)

			verificationCode = SmartId.verification(tokenHash)
			respondWithVerificationCode(token, verificationCode, res)

			co(waitForSmartIdAuthentication({
				country: "EE",
				personal_id: personalId,
				method: "smart-id",
				token: token,
				created_ip: req.ip,
				created_user_agent: req.headers["user-agent"]
			}, session, res))
			break

		default: throw new HttpError(422, "Unknown Authentication Method")
	}

	function respondWithVerificationCode(token, verificationCode, res) {
		// Without a byte of body, Firefox won't resolve the Fetch promise.
		res.statusCode = 202
		res.setHeader("X-Accel-Buffering", "no")
		res.setHeader("X-Verification-Code", _.padLeft(verificationCode, 4, 0))
		res.setHeader("Content-Type", "application/json")

		// TODO: Reuse signed token or generate new?
		signIn(token, req, res)
		res.write("\n")
	}
}), function(err, _req, res, next) {
	if (err instanceof HttpError) {
		res.statusCode = err.code
		res.statusMessage = err.message

		res.json({
			code: err.code,
			message: err.message,
			description: err.description
		})
	}
	else if (err instanceof MobileIdError) {
		var code = getNormalizedMobileIdErrorCode(err)

		if (code in MOBILE_ID_ERRORS) {
			res.statusCode = MOBILE_ID_ERRORS[code][0]
			res.statusMessage = MOBILE_ID_ERRORS[code][1]

			res.json({
				code: res.statusCode,
				message: res.statusMessage,
				description: MOBILE_ID_ERRORS[code][2]
			})
		}
		else throw new HttpError(500, "Unknown Mobile-Id Error", {error: err})
	}
	else if (err instanceof SmartIdError) {
		if (err.code in SMART_ID_ERRORS) {
			res.statusCode = SMART_ID_ERRORS[err.code][0]
			res.statusMessage = SMART_ID_ERRORS[err.code][1]

			res.json({
				code: res.statusCode,
				message: res.statusMessage,
				description: SMART_ID_ERRORS[err.code][2]
			})
		}
		else throw new HttpError(500, "Unknown Smart-Id Error", {error: err})
	}
	else next(err)
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
		secure: req.secure
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

function* waitForMobileIdAuthentication(authentication, sessionId, res) {
	try {
		var certAndSignatureHash = yield waitForMobileIdSession(120, sessionId)
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
		yield createSession(authentication, account, authentication.token)
		res.end(JSON.stringify({code: "OK", location: "/"}))
	}
	catch (ex) {
		if (!(
			ex instanceof HttpError ||
			ex instanceof MobileIdError &&
			getNormalizedMobileIdErrorCode(ex) in MOBILE_ID_ERRORS
		)) logger.error(ex)

		res.end(serializeError(ex))
	}
}

function* waitForSmartIdAuthentication(authentication, session, res) {
	try {
		var certAndSignatureHash = yield waitForSmartIdSession(120, session)
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
		yield createSession(authentication, account, authentication.token)
		res.end(JSON.stringify({code: "OK", location: "/"}))
	}
	catch (ex) {
		if (!(
			ex instanceof HttpError ||
			ex instanceof SmartIdError && ex.code in SMART_ID_ERRORS
		)) logger.error(ex)

		res.end(serializeError(ex))
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

function* createSession(authentication, account, sessionToken) {
	yield sessionsDb.create({
		account_id: account.id,
		token_sha256: _.sha256(sessionToken),
		method: authentication.method,
		created_ip: authentication.created_ip,
		created_user_agent: authentication.created_user_agent
	})
}

function signIn(token, req, res) {
	res.cookie(Config.sessionCookieName, token.toString("hex"), {
		httpOnly: true,
		secure: req.secure,
		maxAge: 365 * 86400 * 1000
	})
}

function serializeError(err) {
	return JSON.stringify({code: err.code, message: err.message})
}
