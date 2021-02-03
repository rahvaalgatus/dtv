var Fs = require("fs")
var Config = require("root/config")
var lazy = require("lazy-object").defineLazyProperty
var ENV = process.env.ENV

lazy(exports, "errorReporter", function() {
  switch (ENV) {
		case "test": return function() {}
		default: return require("root/lib/console_error_reporter")
  }
})

lazy(exports, "sqlite", function() {
	var connect = require("root/lib/sqlite")

	switch (ENV) {
		case "test":
			var sqlite = connect(":memory:")	
			var sql = require("sqlate")
			sqlite.batch(String(Fs.readFileSync(__dirname + "/db/schema.sql")))
			sqlite(sql`PRAGMA foreign_keys = ON`) // Schema resets foreign_keys.
			return sqlite

		default: return connect(__dirname + "/config/" + ENV + ".sqlite3")
	}
})

lazy(exports, "logger", function() {
  switch (ENV) {
		default: return console
  }
})

lazy(exports, "tsl", function() {
	var Tsl = require("undersign/lib/tsl")
	var estonia = Tsl.parse(Fs.readFileSync(__dirname + "/config/tsl/ee.xml"))
	var certificates = estonia.certificates

  switch (ENV) {
		case "development":
		case "production":
			var testPath = __dirname + "/config/tsl/ee_test.xml"
			var test = Tsl.parse(Fs.readFileSync(testPath))
			test.certificates.forEach(certificates.add.bind(certificates))
			return certificates

		default: return certificates
  }
})

lazy(exports, "hades", function() {
	var Hades = require("undersign")

	return new Hades({
		certificates: exports.tsl,
		timemarkUrl: Config.timemarkUrl,
		timestampUrl: Config.timestampUrl
	})
})

lazy(exports, "mobileId", function() {
	var MobileId = require("undersign/lib/mobile_id")
	var user = Config.mobileIdUser
	var password = Config.mobileIdPassword

  switch (ENV) {
		case "development": return MobileId.demo
		default: return new MobileId({user: user, password: password})
  }
})

lazy(exports, "smartId", function() {
	var SmartId = require("undersign/lib/smart_id")
	var user = Config.smartIdUser
	var password = Config.smartIdPassword

  switch (ENV) {
		case "development": return SmartId.demo
		default: return new SmartId({user: user, password: password})
  }
})
