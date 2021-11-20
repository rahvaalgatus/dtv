var _ = require("root/lib/underscore")
var Crypto = require("crypto")

module.exports = function(attrs) {
	var token = attrs.token || Crypto.randomBytes(12)

	var session = _.assign({
		created_at: new Date,
		token_sha256: _.sha256(token),
		method: "id-card",
		deleted_at: null
	}, attrs)

	Object.defineProperty(session, "token", {
		value: token, configurable: true, writable: true, enumerable: false
	})

	return session
}
