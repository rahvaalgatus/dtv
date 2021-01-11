module.exports = ExpiringMap

function ExpiringMap(timeoutInSeconds) {
	this.timeout = timeoutInSeconds * 1000
	this.values = Object.create(null)
	this.timers = Object.create(null)
}

ExpiringMap.prototype.set = function(key, value) {
	key = hash(key)
	if (this.values[key]) throw new Error("Duplicate value")

	this.values[key] = value
	this.timers[key] = setTimeout(this.delete.bind(this), this.timeout, key)
}

ExpiringMap.prototype.delete = function(key) {
	key = hash(key)
	var value = this.values[key]
	if (value == null) return null

	clearTimeout(this.timers[key])
	delete this.values[key]
	delete this.timers[key]
	return value
}

function hash(key) {
	if (key instanceof Buffer) return key.toString("hex")
	if (typeof key == "string") return key
	throw new TypeError("Invalid key type: " + key)
}
