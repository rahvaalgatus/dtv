var _ = require("root/lib/underscore")
var Fs = require("fs")
var Pem = require("undersign/lib/pem")
var Config = require("root/config")
var Crypto = require("crypto")
var ValidAccount = require("root/test/valid_account")
var ValidSession = require("root/test/valid_session")
var X509Asn = require("undersign/lib/x509_asn")
var Certificate = require("undersign/lib/certificate")
var LdapAttributes = require("undersign/lib/ldap_attributes")
var fetchDefaults = require("fetch-defaults")
var accountsDb = require("root/db/accounts_db")
var sessionsDb = require("root/db/sessions_db")
var teachersDb = require("root/db/teachers_db")
var EMPTY_BUFFER = new Buffer(0)
var NO_PARAMS = Buffer.from("0500", "hex")
var nextSerialNumber = Math.floor(10000 * Math.random())

exports.JOHN_RSA_KEYS = readKeyPairSync(
	__dirname + "/fixtures/john_rsa.key",
	__dirname + "/fixtures/john_rsa.pub"
)

exports.ISSUER_KEYS = _.mapValues({
	"EID-SK 2007": "eid_2007_rsa",
	"ESTEID-SK 2011": "esteid_2011_rsa",
	"ESTEID-SK 2015": "esteid_2015_rsa",
	"ESTEID2018": "esteid_2018_ecdsa",
	"EID-SK 2016": "eid_2016_rsa"
}, (path) => readKeyPairSync(
	__dirname + `/fixtures/${path}.key`,
	__dirname + `/fixtures/${path}.pub`
))

// Load TSL only after setting ISSUER_KEYS as they're used for setting the
// public keys.
var tsl = require("root").tsl

exports.VALID_ISSUERS = Config.issuers
	.map((parts) => parts.join(","))
	.map(tsl.getBySubjectName.bind(tsl))

var request = require("fetch-off")
request = require("fetch-formify")(request)
request = require("root/lib/fetch_cook")(request)
request = fetchSession(request)

request = require("fetch-parse")(request, {
	"text/plain": true,
	"text/html": true
})

request = _.wrap(request, function(request, url, opts) {
	return request(url, opts).then(fetchNodeify)
})

exports.request = request

exports.csrf = function() {
	beforeEach(function() {
		this.csrfToken = Crypto.randomBytes(16).toString("hex")

		this.request = fetchDefaults(this.request, {
			headers: {"X-CSRF-Token": this.csrfToken},
			cookies: {[Config.csrfCookieName]: this.csrfToken}
		})
	})
}

exports.account = function(attrs) {
	beforeEach(function*() {
		var account = yield accountsDb.create(new ValidAccount(attrs))
		var session = new ValidSession({account_id: account.id})
		session = _.assign(yield sessionsDb.create(session), {token: session.token})

		this.account = account
		this.session = session
		this.request = fetchDefaults(this.request, {session: session})
	})
}

exports.adminAccount = function(attrs) {
	exports.account(_.assign({
		country: Config.adminPersonalIds[0].slice(0, 2),
		personal_id: Config.adminPersonalIds[0].slice(2)
	}, attrs))
}

exports.newCertificate = function(opts) {
	var issuer = opts && opts.issuer

	var publicKey = opts && opts.publicKey && (typeof opts.publicKey == "string"
		? X509Asn.SubjectPublicKeyInfo.decode(Pem.parse(opts.publicKey))
		: opts.publicKey
	) || {
		algorithm: {algorithm: X509Asn.RSA, parameters: NO_PARAMS},
		subjectPublicKey: {unused: 0, data: EMPTY_BUFFER}
	}

	var validFrom = opts && opts.validFrom || new Date(2000, 0, 1)
	var validUntil = opts && opts.validUntil || new Date(2030, 0, 1)

	var signatureAlgorithm = issuer instanceof Certificate
		? hashAlgorithm(issuer.asn.tbsCertificate.subjectPublicKeyInfo.algorithm)
		: {algorithm: X509Asn.RSA_SHA256, parameters: NO_PARAMS}

	var unsignedCertificate = {
		serialNumber: nextSerialNumber++,
		signature: signatureAlgorithm,
		subject: serializeSubjectName(opts && opts.subject || Object),
		issuer: serializeSubjectName(issuer || Object),

		validity: {
			notBefore: {type: "utcTime", value: validFrom},
			notAfter: {type: "utcTime", value: validUntil},
		},

		subjectPublicKeyInfo: publicKey
	}

	var signature = EMPTY_BUFFER

	if (issuer instanceof Certificate) {
		var commonName = _.merge({}, ...issuer.subject).commonName
		var keys = exports.ISSUER_KEYS[commonName]
		if (keys == null) throw new Error("No keys for " + commonName)

		var der = X509Asn.TBSCertificate.encode(unsignedCertificate)
		var signer = Crypto.createSign("sha256")
		signature = signer.update(der).sign(keys.privateKey)
	}

	return X509Asn.Certificate.encode({
		tbsCertificate: unsignedCertificate,
		signatureAlgorithm: signatureAlgorithm,
		signature: {unused: 0, data: signature}
	})
}

exports.createSession = function*(account) {
	var session = new ValidSession({account_id: account.id})
	return _.assign(yield sessionsDb.create(session), {token: session.token})
}

exports.createTeacher = function(school, account) {
	return teachersDb.create({
		school_id: school.id,
		country: account.country,
		personal_id: account.personal_id
	})
}

function fetchSession(fetch) {
	return _.assign(function(url, opts) {
		var session = opts && opts.session

		if (session) {
			if (opts.cookies == null) opts.cookies = {}
			opts.cookies[Config.sessionCookieName] = session.token.toString("hex")
		}

		return fetch(url, opts)
	}, fetch)
}

function fetchNodeify(res) {
	var msg = res.valueOf()
	if ("body" in res) msg.body = res.body
	return msg
}

function serializeSubjectName(names) {
	if (names instanceof Certificate) return names.asn.tbsCertificate.subject
	if (Buffer.isBuffer(names)) return X509Asn.Name.decode(names)
	if (Array.isArray(names)) names = _.merge({}, ...names)

	return {type: "rdnSequence", value: _.map(names, function(value, name) {
		if (!LdapAttributes.has(name)) throw new Error("Unsupported name: " + name)

		return [{
			type: LdapAttributes.get(name).oid,
			value: LdapAttributes.serialize(name, value)
		}]
	})}
}

function readKeyPairSync(keyPath, pubPath) {
	return {
		privateKey: Fs.readFileSync(keyPath, "utf8"),
		publicKey: Fs.readFileSync(pubPath, "utf8")
	}
}

function hashAlgorithm(algorithm) {
	var oid = algorithm.algorithm, oidWithHash
	if (_.deepEquals(oid, X509Asn.RSA)) oidWithHash = X509Asn.RSA_SHA256
	else if (_.deepEquals(oid, X509Asn.ECDSA)) oidWithHash = X509Asn.ECDSA_SHA256
	else throw new RangeError("Unsupported algorithm: " + oid.join("."))
	return {algorithm: oidWithHash, parameters: algorithm.parameters}
}
