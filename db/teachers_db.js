var Db = require("root/lib/db")
var sqlite = require("root").sqlite
exports = module.exports = new Db(Object, sqlite, "teachers")
exports.idAttribute = null
exports.idColumn = null
