var DateFns = require("date-fns")
var Certificate = require("undersign/lib/certificate")
var ValidAccount = require("root/test/valid_account")
var ValidSession = require("root/test/valid_session")
var sessionsDb = require("root/db/sessions_db")
var {newCertificate} = require("root/test/fixtures")
var {parseCookies} = require("root/test/web")
var accountsDb = require("root/db/accounts_db")
var sql = require("sqlate")
var tsl = require("root").tsl
var PERSONAL_ID = "38706181337"
var {VALID_ISSUERS} = require("root/test/fixtures")
var {JOHN_RSA_KEYS} = require("root/test/fixtures")
var SESSION_COOKIE_NAME = require("root/config").sessionCookieName

describe("SessionsController", function() {
	require("root/test/web")()
	require("root/test/db")()
	require("root/test/fixtures").csrf()

	describe("GET /", function() {
		describe("when not logged in", function() {
			it("must redirect to /sessions/new", function*() {
				var res = yield this.request("/sessions")
				res.statusCode.must.equal(302)
				res.headers.location.must.equal("/sessions/new")
			})
		})

		describe("when logged in", function() {
			require("root/test/fixtures").account()

			it("must redirect to /", function*() {
				var res = yield this.request("/sessions")
				res.statusCode.must.equal(302)
				res.headers.location.must.equal("/")
			})
		})
	})

	describe("/new", function() {
		describe("when not logged in", function() {
			it("must render signin page", function*() {
				var res = yield this.request("/sessions/new")
				res.statusCode.must.equal(200)
			})
		})

		describe("when logged in", function() {
			require("root/test/fixtures").account()

			it("must redirect to /", function*() {
				var res = yield this.request("/sessions/new")
				res.statusCode.must.equal(302)
				res.statusMessage.must.equal("Already Signed In")
				res.headers.location.must.equal("/")
			})
		})
	})

	describe("POST /", function() {
		describe("when authenticating via Id-Card", function() {
			it("must create user and session", function*() {
				var cert = new Certificate(newCertificate({
					subject: {
						countryName: "EE",
						organizationName: "ESTEID",
						organizationalUnitName: "authentication",
						commonName: `SMITH,JOHN,${PERSONAL_ID}`,
						surname: "SMITH",
						givenName: "JOHN",
						serialNumber: `PNOEE-${PERSONAL_ID}`
					},

					issuer: VALID_ISSUERS[0],
					publicKey: JOHN_RSA_KEYS.publicKey
				}))

				var res = yield this.request("/sessions", {
					method: "POST",

					headers: {
						"User-Agent": "Mozilla/1.0",
						"X-Client-Certificate": serializeCertificateForHeader(cert),
						"X-Client-Certificate-Verification": "SUCCESS"
					},

					form: {method: "id-card"}
				})

				res.statusCode.must.equal(302)
				res.statusMessage.must.equal("Signed In")

				var cookies = parseCookies(res.headers["set-cookie"])
				var sessionCookie = cookies[SESSION_COOKIE_NAME].value
				var sessionToken = Buffer.from(sessionCookie, "hex")

				var accounts = yield accountsDb.search(sql`SELECT * FROM accounts`)

				accounts.must.eql([new ValidAccount({
					id: accounts[0].id,
					country: "EE",
					personal_id: PERSONAL_ID,
					name: "John Smith",
					created_at: accounts[0].created_at,
					updated_at: accounts[0].updated_at
				})])

				var sessions = yield sessionsDb.search(sql`SELECT * FROM sessions`)

				sessions.must.eql([new ValidSession({
					id: sessions[0].id,
					account_id: accounts[0].id,
					method: "id-card",
					token: sessionToken,
					created_ip: "127.0.0.1",
					created_user_agent: "Mozilla/1.0",
					created_at: sessions[0].created_at
				})])
			})

			it("must err given failure from Nginx", function*() {
				var cert = new Certificate(newCertificate({
					subject: {
						countryName: "EE",
						organizationName: "ESTEID",
						organizationalUnitName: "authentication",
						commonName: `SMITH,JOHN,${PERSONAL_ID}`,
						surname: "SMITH",
						givenName: "JOHN",
						serialNumber: `PNOEE-${PERSONAL_ID}`
					},

					issuer: VALID_ISSUERS[0],
					publicKey: JOHN_RSA_KEYS.publicKey
				}))

				var res = yield this.request("/sessions", {
					method: "POST",

					headers: {
						"X-Client-Certificate": serializeCertificateForHeader(cert),
						"X-Client-Certificate-Verification": "FAILURE"
					},

					form: {method: "id-card"}
				})

				res.statusCode.must.equal(422)
				res.statusMessage.must.equal("Invalid Signature")
				res.headers["content-type"].must.equal("text/html; charset=utf-8")
				res.headers.must.not.have.property("set-cookie")

				yield accountsDb.search(sql`
					SELECT * FROM accounts
				`).must.then.be.empty()

				yield sessionsDb.search(sql`
					SELECT * FROM sessions
				`).must.then.be.empty()
			})

			it("must err given certificate from untrusted issuer", function*() {
				var cert = new Certificate(newCertificate({
					subject: {
						countryName: "EE",
						organizationName: "ESTEID",
						organizationalUnitName: "authentication",
						commonName: `SMITH,JOHN,${PERSONAL_ID}`,
						surname: "SMITH",
						givenName: "JOHN",
						serialNumber: `PNOEE-${PERSONAL_ID}`
					},

					issuer: tsl.getBySubjectName([
						"C=EE",
						"O=AS Sertifitseerimiskeskus",
						"OU=Sertifitseerimisteenused",
						"CN=EID-SK 2007",
					].join(",")),

					publicKey: JOHN_RSA_KEYS.publicKey
				}))

				var res = yield this.request("/sessions", {
					method: "POST",

					headers: {
						"X-Client-Certificate": serializeCertificateForHeader(cert),
						"X-Client-Certificate-Verification": "FAILURE"
					},

					form: {method: "id-card"}
				})

				res.statusCode.must.equal(422)
				res.statusMessage.must.equal("Invalid Issuer")
				res.headers["content-type"].must.equal("text/html; charset=utf-8")
			})

			it("must err given future certificate", function*() {
				var cert = new Certificate(newCertificate({
					subject: {
						countryName: "EE",
						organizationName: "ESTEID",
						organizationalUnitName: "authentication",
						commonName: `SMITH,JOHN,${PERSONAL_ID}`,
						surname: "SMITH",
						givenName: "JOHN",
						serialNumber: `PNOEE-${PERSONAL_ID}`
					},

					validFrom: DateFns.addSeconds(new Date, 1),
					issuer: VALID_ISSUERS[0],
					publicKey: JOHN_RSA_KEYS.publicKey
				}))

				var res = yield this.request("/sessions", {
					method: "POST",

					headers: {
						"X-Client-Certificate": serializeCertificateForHeader(cert),
						"X-Client-Certificate-Verification": "FAILURE"
					},

					form: {method: "id-card"}
				})

				res.statusCode.must.equal(422)
				res.statusMessage.must.equal("Certificate Not Yet Valid")
				res.headers["content-type"].must.equal("text/html; charset=utf-8")
			})

			it("must err given past certificate", function*() {
				var cert = new Certificate(newCertificate({
					subject: {
						countryName: "EE",
						organizationName: "ESTEID",
						organizationalUnitName: "authentication",
						commonName: `SMITH,JOHN,${PERSONAL_ID}`,
						surname: "SMITH",
						givenName: "JOHN",
						serialNumber: `PNOEE-${PERSONAL_ID}`
					},

					validUntil: new Date,
					issuer: VALID_ISSUERS[0],
					publicKey: JOHN_RSA_KEYS.publicKey
				}))

				var res = yield this.request("/sessions", {
					method: "POST",

					headers: {
						"X-Client-Certificate": serializeCertificateForHeader(cert),
						"X-Client-Certificate-Verification": "FAILURE"
					},

					form: {method: "id-card"}
				})

				res.statusCode.must.equal(422)
				res.statusMessage.must.equal("Certificate Expired")
				res.headers["content-type"].must.equal("text/html; charset=utf-8")
			})
		})
	})
})

function serializeCertificateForHeader(cert) {
	// Should match the output of Nginx's $ssl_client_cert.
	// Apparently Nginx leaves the PEM header and replaces \n with \t.
	return cert.toString("pem").replace(/\n/g, "\t")
}
