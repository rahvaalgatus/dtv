var _ = require("root/lib/underscore")
var Certificate = require("undersign/lib/certificate")
var Crypto = require("crypto")
var Router = require("express").Router
var HttpError = require("standard-http-error")
var MobileId = require("undersign/lib/mobile_id")
var MobileIdError = require("undersign/lib/mobile_id").MobileIdError
var SmartId = require("undersign/lib/smart_id")
var SmartIdError = require("undersign/lib/smart_id").SmartIdError
var ExpiringMap = require("root/lib/expiring_map")
var Paths = require("root/lib/paths")
var next = require("co-next")
var {getRequestEidMethod} = require("root/lib/eid")
var {ensureAreaCode} = require("root/lib/eid")
var {validateCertificate} = require("root/lib/eid")
var {getCertificatePersonalId} = require("root/lib/eid")
var {getCertificatePersonName} = require("root/lib/eid")
var {waitForSession} = require("root/lib/eid")
var {getNormalizedMobileIdErrorCode} = require("root/lib/eid")
var ideasDb = require("root/db/ideas_db")
var votersDb = require("root/db/voters_db")
var votesDb = require("root/db/votes_db")
var sql = require("sqlate")
var co = require("co")
var logger = require("root").logger
var mobileId = require("root").mobileId
var smartId = require("root").smartId
var hades = require("root").hades
var votings = new ExpiringMap(process.env.ENV == "test" ? 5 : 5 * 60)

var waitForMobileIdSession =
	waitForSession.bind(null, mobileId.waitForSignature.bind(mobileId))
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
		"Hääletamine võttis liiga kaua. Palun proovi uuesti."
	],

	NOT_MID_CLIENT: [
		410,
		"Mobile-Id Certificates Not Activated",
		"Sinu sertifikaat pole veel aktiveeritud. Palun proovi hiljem uuesti. Probleemi püsimisel võta palun ühendust oma teenusepakkujaga."
	],

	USER_CANCELLED: [
		410,
		"Mobile-Id Cancelled",
		"Katkestasid hääletamise."
	],

	SIGNATURE_HASH_MISMATCH: [
		410,
		"Mobile-Id Signature Hash Mismatch",
		"Mobiil-Id-lt tulnud allkirjakinnitus ei vastanud turvanõuetele. Palun proovi uuesti."
	],

	PHONE_ABSENT: [
		410,
		"Mobile-Id Phone Absent",
		"Telefon on välja lülitatud või ei ole leviulatuses."
	],

	DELIVERY_ERROR: [
		410,
		"Mobile-Id Delivery Error",
		"Telefon ei ole allkirjastamiseks tehniliselt sobiv või on võrgu töö ajutiselt häiritud."
	],

	SIM_ERROR: [
		410,
		"Mobile-Id SIM Application Error",
		"SIM-kaardi rakenduse viga. Proovi palun uuesti. Probleemi püsimisel võta palun ühendust oma teenusepakkujaga."
	],

	// Custom responses:
	INVALID_SIGNATURE: [
		410,
		"Invalid Mobile-Id Signature",
		"Hääletamine ebaõnnestus, sest digiallkiri ei vasta sertifikaadile."
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
		"Katkestasid hääletamise."
	],

	TIMEOUT: [
		410,
		"Smart-Id Timeout",
		"Hääletamine võttis liiga kaua. Palun proovi uuesti."
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
	INVALID_SIGNATURE: [
		410,
		"Invalid Smart-Id Signature",
		"Hääletamine ebaõnnestus, sest digiallkirja ei vasta sertifikaadile."
	]
}

exports.router = Router({mergeParams: true})
exports.router.use(require("root/lib/eid").parseSignatureBody)

exports.router.post("/", assertVoting, next(function*(req, res) {
	var {school} = req
	var method = getRequestEidMethod(req)
	var cert, country, verificationCode, err, personalId, xades

	// The Id-card method uses a query parameter for ideaId as its body is
	// the person's certificate.
	var ideaId = req.body.idea_id || req.query.idea_id

	if (ideaId == null) throw new HttpError(422, "Idea Missing", {
		description: "Ära unusta ideed valimast!"
	})

	var idea = yield ideasDb.read(sql`
		SELECT * FROM ideas
		WHERE school_id = ${school.id}
		AND id = ${ideaId}
	`)

	if (idea == null) throw new HttpError(422, "Invalid Idea", {
		description: "Ei leidnud valitud ideed."
	})

	var signable = `Hääletan idee "${idea.title}" poolt.`

	switch (method) {
		case "id-card":
			var voteToken = req.query["vote-token"]

			if (voteToken == null) {
				cert = Certificate.parse(req.body)
				if (err = validateCertificate(cert)) throw err

				;[country, personalId] = getCertificatePersonalId(cert)
				if (err = yield validateVoter(school, country, personalId)) throw err

				var token = Crypto.randomBytes(16)
				xades = newXades(cert, signable)

				var signUrl = req.baseUrl
				signUrl += `?idea_id=${idea.id}&vote-token=${token.toString("hex")}`
				res.setHeader("Location", signUrl)
				res.setHeader("Content-Type", "application/vnd.rahvaalgatus.signable")
				res.status(202).end(xades.signableHash)

				votings.set(token, {
					school_id: idea.school_id,
					idea_id: idea.id,
					voter_country: country,
					voter_personal_id: personalId,
					voter_name: getCertificatePersonName(xades.certificate),
					method: method,
					created_at: new Date,
					signable: signable,
					xades: xades
				})
			}
			else {
				var vote = votings.delete(Buffer.from(voteToken || "", "hex"))

				if (!vote) throw new HttpError(404, "Vote Not Found", {
					description: "Kahjuks hääletamine aegus. Palun proovi uuesti."
				})

				xades = vote.xades

				if (!xades.certificate.hasSigned(xades.signable, req.body))
					throw new HttpError(409, "Invalid Signature", {
						description: "Digiallkiri ei vasta sertifikaadile."
					})

				xades.setSignature(req.body)

				console.info("Requesting timemark for %s.", vote.voter_personal_id)
				xades.setOcspResponse(yield hades.timemark(xades))

				yield replaceVote(vote)
				var schoolPath = Paths.schoolPath(school) + "?voted=true#thanks"
				res.setHeader("Content-Type", "application/json")
				res.status(201).end(JSON.stringify({code: "OK", location: schoolPath}))
			}
			break

		case "mobile-id":
			var phoneNumber = ensureAreaCode(req.body.phoneNumber)
			personalId = req.body.personalId

			// Early double validation to prevent possible misuse.
			if (err = yield validateVoter(school, "EE", personalId)) throw err

			// Log Mobile-Id requests to confirm SK's billing.
			logger.info(
				"Requesting Mobile-Id certificate for %s and %s.",
				phoneNumber,
				personalId
			)

			cert = yield mobileId.readCertificate(phoneNumber, personalId)
			if (err = validateCertificate(cert)) throw err

			;[country, personalId] = getCertificatePersonalId(cert)
			if (err = yield validateVoter(school, country, personalId)) throw err

			xades = newXades(cert, signable)

			logger.info(
				"Signing via Mobile-Id for %s and %s.",
				phoneNumber,
				personalId
			)

			var sessionId = yield mobileId.sign(
				phoneNumber,
				personalId,
				xades.signableHash
			)

			verificationCode = MobileId.confirmation(xades.signableHash)
			respondWithVerificationCode(verificationCode, res)

			co(waitForMobileIdSignature(school, {
				school_id: idea.school_id,
				idea_id: idea.id,
				voter_country: country,
				voter_personal_id: personalId,
				voter_name: getCertificatePersonName(xades.certificate),
				method: method,
				created_at: new Date,
				signable: signable,
				xades: xades
			}, sessionId, res))
			break

		case "smart-id":
			personalId = req.body.personalId

			// Early double validation to prevent possible misuse.
			if (err = yield validateVoter(school, "EE", personalId)) throw err

			// Log Smart-Id requests to confirm SK's billing.
			logger.info("Requesting Smart-Id certificate for %s.", personalId)

			cert = yield smartId.certificate("PNOEE-" + personalId)
			cert = yield waitForSmartIdSession(90, cert)
			if (cert == null) throw new SmartIdError("TIMEOUT")
			if (err = validateCertificate(cert)) throw err

			;[country, personalId] = getCertificatePersonalId(cert)
			if (err = yield validateVoter(school, country, personalId)) throw err

			xades = newXades(cert, signable)

			// The Smart-Id API returns any signing errors only when its status is
			// queried, not when signing is initiated.
			logger.info("Signing via Smart-Id for %s.", personalId)
			var session = yield smartId.sign(cert, xades.signableHash)

			verificationCode = SmartId.verification(xades.signableHash)
			respondWithVerificationCode(verificationCode, res)

			co(waitForSmartIdSignature(school, {
				school_id: idea.school_id,
				idea_id: idea.id,
				voter_country: country,
				voter_personal_id: personalId,
				voter_name: getCertificatePersonName(xades.certificate),
				method: method,
				created_at: new Date,
				signable: signable,
				xades: xades
			}, session, res))
			break

		default: throw new HttpError(422, "Unknown Voting Method")
	}

	function newXades(cert, signable) {
		return hades.new(cert, [{
			path: "vote.txt",
			type: "text/plain",
			hash: _.sha256(signable)
		}], {policy: "bdoc"})
	}

	function respondWithVerificationCode(verificationCode, res) {
		// Without a byte of body, Firefox won't resolve the Fetch promise.
		res.statusCode = 202
		res.setHeader("X-Accel-Buffering", "no")
		res.setHeader("X-Verification-Code", _.padLeft(verificationCode, 4, 0))
		res.setHeader("Content-Type", "application/json")
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

function* validateVoter(school, country, personalId) {
	var voter = yield votersDb.read(sql`
		SELECT * FROM voters
		WHERE school_id = ${school.id}
		AND country = ${country}
		AND personal_id = ${personalId}
	`)

	if (voter == null) return new HttpError(422, "Not a Permitted Voter", {
		description: "Sa ei ole lubatud hääletajate seast. Uuri lisainfot oma õpetajalt."
	})

	return null
}

function assertVoting(req, _res, next) {
	var {school} = req

	if (!(school.voting_starts_at && new Date >= school.voting_starts_at))
		throw new HttpError(403, "Voting Not Yet Started", {
			description: "Hääletamine pole veel alanud."
		})

	if (!(school.voting_ends_at == null || new Date < school.voting_ends_at))
		throw new HttpError(403, "Voting Ended", {
			description: "Hääletamine läbi."
		})

	next()
}

function* replaceVote(vote) {
	yield votesDb.execute(sql`
		DELETE FROM votes
		WHERE school_id = ${vote.school_id}
		AND voter_country = ${vote.voter_country}
		AND voter_personal_id = ${vote.voter_personal_id}
	`)

	return yield votesDb.create(vote)
}

function* waitForMobileIdSignature(school, vote, sessionId, res) {
	try {
		var signatureHash = yield waitForMobileIdSession(120, sessionId)
		if (signatureHash == null) throw new MobileIdError("TIMEOUT")

		var xades = vote.xades
		if (!xades.certificate.hasSigned(xades.signable, signatureHash))
			throw new MobileIdError("INVALID_SIGNATURE")

		xades.setSignature(signatureHash)

		console.info("Requesting timemark for %s.", vote.voter_personal_id)
		xades.setOcspResponse(yield hades.timemark(xades))

		yield replaceVote(vote)
		var schoolPath = Paths.schoolPath(school) + "?voted=true#thanks"
		res.end(JSON.stringify({code: "OK", location: schoolPath}))
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

function* waitForSmartIdSignature(school, vote, session, res) {
	try {
		var certAndSignatureHash = yield waitForSmartIdSession(120, session)
		if (certAndSignatureHash == null) throw new SmartIdError("TIMEOUT")

		var xades = vote.xades
		var [_cert, signatureHash] = certAndSignatureHash
		if (!xades.certificate.hasSigned(xades.signable, signatureHash))
			throw new SmartIdError("INVALID_SIGNATURE")

		xades.setSignature(signatureHash)

		console.info("Requesting timemark for %s.", vote.voter_personal_id)
		xades.setOcspResponse(yield hades.timemark(xades))

		yield replaceVote(vote)
		var schoolPath = Paths.schoolPath(school) + "?voted=true#thanks"
		res.end(JSON.stringify({code: "OK", location: schoolPath}))
	}
	catch (ex) {
		if (!(ex instanceof SmartIdError && ex.code in SMART_ID_ERRORS))
			logger.error(ex)

		res.end(serializeError(ex))
	}
}

function serializeError(err) {
	return JSON.stringify({code: err.code, message: err.message})
}
