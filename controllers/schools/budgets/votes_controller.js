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
		"Not a Mobile-ID User or Personal Id Mismatch",
		"eid_view.mobile_id_errors.not_found"
	],

	// Session responses;
	TIMEOUT: [
		410,
		"Mobile-ID Timeout",
		"eid_view.mobile_id_errors.sign_timeout"
	],

	NOT_MID_CLIENT: [
		410,
		"Mobile-ID Certificates Not Activated",
		"eid_view.mobile_id_errors.not_active"
	],

	USER_CANCELLED: [
		410,
		"Mobile-ID Cancelled",
		"eid_view.mobile_id_errors.sign_cancelled"
	],

	SIGNATURE_HASH_MISMATCH: [
		410,
		"Mobile-ID Signature Hash Mismatch",
		"eid_view.mobile_id_errors.sign_hash_mismatch"
	],

	PHONE_ABSENT: [
		410,
		"Mobile-ID Phone Absent",
		"eid_view.mobile_id_errors.sign_phone_absent"
	],

	DELIVERY_ERROR: [
		410,
		"Mobile-ID Delivery Error",
		"eid_view.mobile_id_errors.sign_delivery_error"
	],

	SIM_ERROR: [
		410,
		"Mobile-ID SIM Application Error",
		"eid_view.mobile_id_errors.sim_error"
	],

	// Custom responses:
	INVALID_SIGNATURE: [
		410,
		"Invalid Mobile-ID Signature",
		"eid_view.mobile_id_errors.sign_invalid_signature"
	]
}

var SMART_ID_ERRORS = {
	// Initiation responses:
	ACCOUNT_NOT_FOUND: [
		422,
		"Not a Smart-ID User",
		"eid_view.smart_id_errors.not_found"
	],

	// Session responses:
	USER_REFUSED: [
		410,
		"Smart-ID Cancelled",
		"eid_view.smart_id_errors.sign_cancelled"
	],

	TIMEOUT: [
		410,
		"Smart-ID Timeout",
		"eid_view.smart_id_errors.sign_timeout"
	],

	NO_SUITABLE_CERTIFICATE: [
		410,
		"No Smart-ID Certificate",
		"eid_view.smart_id_errors.sign_no_suitable_certificate"
	],

	DOCUMENT_UNUSABLE: [
		410,
		"Smart-ID Certificate Unusable",
		"eid_view.smart_id_errors.document_unusable"
	],

	WRONG_VC: [
		410,
		"Wrong Smart-ID Verification Code Chosen",
		"eid_view.smart_id_errors.wrong_vc"
	],

	// Custom responses:
	INVALID_SIGNATURE: [
		410,
		"Invalid Smart-ID Signature",
		"eid_view.smart_id_errors.sign_invalid_signature"
	]
}

exports.router = Router({mergeParams: true})
exports.router.use(require("root/lib/eid").parseSignatureBody)

exports.router.post("/", assertVoting, next(function*(req, res) {
	var {t} = req
	var {school} = req
	var {budget} = req
	var method = getRequestEidMethod(req)
	var cert, country, verificationCode, err, personalId, xades

	// The Id-card method uses a query parameter for ideaId as its body is
	// the person's certificate.
	var ideaId = req.body.idea_id || req.query.idea_id

	if (ideaId == null) throw new HttpError(422, "Idea Missing", {
		description: t("budget_page.voting.errors.idea_missing")
	})

	var idea = yield ideasDb.read(sql`
		SELECT * FROM ideas
		WHERE budget_id = ${budget.id}
		AND id = ${ideaId}
	`)

	if (idea == null) throw new HttpError(422, "Invalid Idea", {
		description: t("budget_page.voting.errors.invalid_idea")
	})

	var signable = t("budget_page.voting.signable")

	switch (method) {
		case "id-card":
			var voteToken = req.query["vote-token"]

			if (voteToken == null) {
				cert = Certificate.parse(req.body)
				if (err = validateCertificate(t, cert)) throw err

				;[country, personalId] = getCertificatePersonalId(cert)
				if (err = yield validateVoter(t, budget, country, personalId)) throw err

				var token = Crypto.randomBytes(16)
				xades = newXades(cert, signable)

				var signUrl = req.baseUrl
				signUrl += `?idea_id=${idea.id}&vote-token=${token.toString("hex")}`
				res.setHeader("Location", signUrl)
				res.setHeader("Content-Type", "application/vnd.rahvaalgatus.signable")
				res.status(202).end(xades.signableHash)

				votings.set(token, {
					budget_id: idea.budget_id,
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
					description: t("budget_page.voting.errors.voting_expired")
				})

				xades = vote.xades

				if (!xades.certificate.hasSigned(xades.signable, req.body))
					throw new HttpError(409, "Invalid Signature", {
						description: t("eid_view.id_card_errors.sign_invalid_signature")
					})

				xades.setSignature(req.body)

				console.info("Requesting timestamp for %s.", vote.voter_personal_id)
				xades.setTimestamp(yield hades.timestamp(xades))
				xades.setOcspResponse(yield hades.ocsp(xades.certificate))

				yield replaceVote(vote)
				var budgetPath = Paths.budgetPath(school, budget) + "?voted=true#thanks"
				res.setHeader("Content-Type", "application/json")
				res.status(201).end(JSON.stringify({code: "OK", location: budgetPath}))
			}
			break

		case "mobile-id":
			var phoneNumber = ensureAreaCode(req.body.phoneNumber)
			personalId = req.body.personalId

			// Early double validation to prevent possible misuse.
			if (err = yield validateVoter(t, budget, "EE", personalId)) throw err

			// Log Mobile-ID requests to confirm SK's billing.
			logger.info(
				"Requesting Mobile-ID certificate for %s and %s.",
				phoneNumber,
				personalId
			)

			cert = yield mobileId.readCertificate(phoneNumber, personalId)
			if (err = validateCertificate(t, cert)) throw err

			;[country, personalId] = getCertificatePersonalId(cert)
			if (err = yield validateVoter(t, budget, country, personalId)) throw err

			xades = newXades(cert, signable)

			logger.info(
				"Signing via Mobile-ID for %s and %s.",
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

			co(waitForMobileIdSignature(school, budget, {
				budget_id: idea.budget_id,
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
			if (err = yield validateVoter(t, budget, "EE", personalId)) throw err

			// Log Smart-ID requests to confirm SK's billing.
			logger.info("Requesting Smart-ID certificate for %s.", personalId)

			cert = yield smartId.certificate("PNOEE-" + personalId)
			cert = yield waitForSmartIdSession(90, cert)
			if (cert == null) throw new SmartIdError("TIMEOUT")
			if (err = validateCertificate(t, cert)) throw err

			;[country, personalId] = getCertificatePersonalId(cert)
			if (err = yield validateVoter(t, budget, country, personalId)) throw err

			xades = newXades(cert, signable)

			// The Smart-ID API returns any signing errors only when its status is
			// queried, not when signing is initiated.
			logger.info("Signing via Smart-ID for %s.", personalId)
			var session = yield smartId.sign(cert, xades.signableHash)

			verificationCode = SmartId.verification(xades.signableHash)
			respondWithVerificationCode(verificationCode, res)

			co(waitForSmartIdSignature(school, budget, {
				budget_id: idea.budget_id,
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
		}])
	}

	function respondWithVerificationCode(verificationCode, res) {
		// Without a byte of body, Firefox won't resolve the Fetch promise.
		res.statusCode = 202
		res.setHeader("X-Accel-Buffering", "no")
		res.setHeader("X-Verification-Code", _.padLeft(verificationCode, 4, 0))
		res.setHeader("Content-Type", "application/json")
		res.write("\n")
	}
}), function(err, req, res, next) {
	var {t} = req

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
				description: t(MOBILE_ID_ERRORS[code][2])
			})
		}
		else throw new HttpError(500, "Unknown Mobile-ID Error", {error: err})
	}
	else if (err instanceof SmartIdError) {
		if (err.code in SMART_ID_ERRORS) {
			res.statusCode = SMART_ID_ERRORS[err.code][0]
			res.statusMessage = SMART_ID_ERRORS[err.code][1]

			res.json({
				code: res.statusCode,
				message: res.statusMessage,
				description: t(SMART_ID_ERRORS[err.code][2])
			})
		}
		else throw new HttpError(500, "Unknown Smart-ID Error", {error: err})
	}
	else next(err)
})

function* validateVoter(t, budget, country, personalId) {
	var voter = yield votersDb.read(sql`
		SELECT * FROM voters
		WHERE budget_id = ${budget.id}
		AND country = ${country}
		AND personal_id = ${personalId}
	`)

	if (voter == null) return new HttpError(422, "Not a Permitted Voter", {
		description: t("budget_page.voting.errors.not_permitted")
	})

	return null
}

function assertVoting(req, _res, next) {
	var {t} = req
	var {budget} = req

	if (!(budget.voting_starts_at && new Date >= budget.voting_starts_at))
		throw new HttpError(403, "Voting Not Yet Started", {
			description: t("budget_page.voting.errors.not_started")
		})

	if (!(budget.voting_ends_at == null || new Date < budget.voting_ends_at))
		throw new HttpError(403, "Voting Ended", {
			description: t("budget_page.voting.errors.ended")
		})

	next()
}

function* replaceVote(vote) {
	yield votesDb.execute(sql`
		DELETE FROM votes
		WHERE budget_id = ${vote.budget_id}
		AND voter_country = ${vote.voter_country}
		AND voter_personal_id = ${vote.voter_personal_id}
	`)

	return yield votesDb.create(vote)
}

function* waitForMobileIdSignature(school, budget, vote, sessionId, res) {
	try {
		var signatureHash = yield waitForMobileIdSession(120, sessionId)
		if (signatureHash == null) throw new MobileIdError("TIMEOUT")

		var xades = vote.xades
		if (!xades.certificate.hasSigned(xades.signable, signatureHash))
			throw new MobileIdError("INVALID_SIGNATURE")

		xades.setSignature(signatureHash)

		console.info("Requesting timestamp for %s.", vote.voter_personal_id)
		xades.setTimestamp(yield hades.timestamp(xades))
		xades.setOcspResponse(yield hades.ocsp(xades.certificate))

		yield replaceVote(vote)

		var budgetPath = Paths.budgetPath(school, budget) + "?voted=true#thanks"
		res.end(JSON.stringify({code: "OK", location: budgetPath}))
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

function* waitForSmartIdSignature(school, budget, vote, session, res) {
	try {
		var certAndSignatureHash = yield waitForSmartIdSession(120, session)
		if (certAndSignatureHash == null) throw new SmartIdError("TIMEOUT")

		var xades = vote.xades
		var [_cert, signatureHash] = certAndSignatureHash
		if (!xades.certificate.hasSigned(xades.signable, signatureHash))
			throw new SmartIdError("INVALID_SIGNATURE")

		xades.setSignature(signatureHash)

		console.info("Requesting timestamp for %s.", vote.voter_personal_id)
		xades.setTimestamp(yield hades.timestamp(xades))
		xades.setOcspResponse(yield hades.ocsp(xades.certificate))

		yield replaceVote(vote)

		var budgetPath = Paths.budgetPath(school, budget) + "?voted=true#thanks"
		res.end(JSON.stringify({code: "OK", location: budgetPath}))
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
