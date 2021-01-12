exports.isValidImageType = function(type) {
  switch (type) {
    case "image/png":
    case "image/jpeg":
    case "image/gif": return true
    default: return false
  }
}
