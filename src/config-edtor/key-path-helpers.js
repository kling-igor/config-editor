const ESCAPED_DOT = /\\\./g
const ANY_DOT = /\./g

export function hasKeyPath(object, keyPath) {
  var keys = splitKeyPath(keyPath)
  for (var i = 0, len = keys.length; i < len; i++) {
    var key = keys[i]
    if (object == null || !object.hasOwnProperty(key)) {
      return false
    }
    object = object[key]
  }
  return true
}

export function getValueAtKeyPath(object, keyPath) {
  if (!keyPath) return object

  var keys = splitKeyPath(keyPath)
  for (var i = 0, len = keys.length; i < len; i++) {
    var key = keys[i]
    object = object[key]
    if (object == null) {
      return object
    }
  }
  return object
}

export function setValueAtKeyPath(object, keyPath, value) {
  var keys = splitKeyPath(keyPath)
  while (keys.length > 1) {
    var key = keys.shift()
    if (object[key] == null) {
      object[key] = {}
    }
    object = object[key]
  }
  object[keys.shift()] = value
}

export function deleteValueAtKeyPath(object, keyPath) {
  var keys = splitKeyPath(keyPath)
  while (keys.length > 1) {
    var key = keys.shift()
    if (object[key] == null) return
    object = object[key]
  }
  delete object[keys.shift()]
}

export function splitKeyPath(keyPath) {
  if (keyPath == null) return []

  var startIndex = 0,
    keyPathArray = []
  for (var i = 0, len = keyPath.length; i < len; i++) {
    var char = keyPath[i]
    if (char === '.' && (i === 0 || keyPath[i - 1] !== '\\')) {
      keyPathArray.push(keyPath.substring(startIndex, i).replace(ESCAPED_DOT, '.'))
      startIndex = i + 1
    }
  }
  keyPathArray.push(keyPath.substr(startIndex, keyPath.length).replace(ESCAPED_DOT, '.'))

  return keyPathArray
}

export function pushKeyPath(keyPath, key) {
  key = key.replace(ANY_DOT, '\\.')
  if (keyPath && keyPath.length > 0) return keyPath + '.' + key
  else return key
}
