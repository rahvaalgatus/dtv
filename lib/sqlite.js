var Sqlite3 = require("sqlite3")
var Sql = require("sqlate").Sql
var co = require("co")
var sql = require("sqlate")

module.exports = function(path, mode) {
	if (mode == null) mode = Sqlite3.OPEN_READWRITE
	var sqlite = new Sqlite3.Database(path, mode)
	sqlite.serialize()
	sqlite.run("PRAGMA foreign_keys = ON")

	var db = execute.bind(null, sqlite)
	db.all = withSerializedParameters.bind(null, sqlite.all.bind(sqlite))
	db.get = withSerializedParameters.bind(null, sqlite.get.bind(sqlite))
	db.run = withSerializedParameters.bind(null, sqlite.run.bind(sqlite))
	db.prepare = withSerializedParameters.bind(null, sqlite.prepare.bind(sqlite))
	db.transactAsync = co.wrap(transactAsync).bind(null, db)
	db.batch = sqlite.exec.bind(sqlite)
	return db
}

function execute(sqlite, sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)

	return new Promise((resolve, reject) => (
		sqlite.all(String(sql), sql.parameters.map(serialize), (err, res) => (
			err ? reject(err) : resolve(res)
		))
	))
}

function* transactAsync(sqlite, fn) {
	yield sqlite(sql`SAVEPOINT transacting`)

	try {
		var res = yield fn()
		yield sqlite(sql`RELEASE transacting`)
		return res
	}
	catch (err) {
		yield sqlite(sql`ROLLBACK TO transacting`)
		yield sqlite(sql`RELEASE transacting`)
		throw err
	}
}

function withSerializedParameters(fn, sql, params, done) {
	return fn(sql, params.map(serialize), done)
}

function serialize(value) {
	if (value instanceof Date) return value.toISOString()
	return value
}
