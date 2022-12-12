var sql = require("sqlate")
var sqlite = require("root").sqlite

exports = module.exports = function() {
	beforeEach(exports.delete)
}

exports.delete = function*() {
	yield sqlite(sql`DELETE FROM paper_votes`)
	yield sqlite(sql`DELETE FROM voters`)
	yield sqlite(sql`DELETE FROM ideas`)
	yield sqlite(sql`DELETE FROM budgets`)
	yield sqlite(sql`DELETE FROM teachers`)
	yield sqlite(sql`DELETE FROM schools`)
	yield sqlite(sql`DELETE FROM sessions`)
	yield sqlite(sql`DELETE FROM accounts`)
}
