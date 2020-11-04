var Db = require("root/lib/db")
var sqlite = require("root").sqlite
exports = module.exports = new Db(Object, sqlite, "voters")
exports.idAttribute = null
exports.idColumn = null
