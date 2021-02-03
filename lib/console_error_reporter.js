var inspect = require("util").inspect

module.exports = function(err, data) {
  console.error(serialize(err), serialize(data))
}

function serialize(obj) { return inspect(obj, {depth: null}) }
