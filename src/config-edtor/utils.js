import _ from 'lodash'
import Color from './color'

// hello --> Hello
export const capitalize = word => (word ? word[0].toUpperCase() + word.slice(1) : '')

// helloWorld --> Hello World
export const uncamelcase = string => {
  if (!string) return ''

  const result = string.replace(/([A-Z])|_+/g, (match, letter = '') => ` ${letter}`)
  return capitalize(result.trim())
}

export const isPlainObject = value =>
  _.isObject(value) && !Array.isArray(value) && !_.isFunction(value) && !_.isString(value) && !(value instanceof Color)

/**
 * Transform the given object into another object.
 * @param {Object} object - the object to transform.
 * @param {Function} iterator - A function that takes `(key, value)` arguments and returns a `[key, value]` tuple
 */
export const mapObject = (object, iterator) => {
  const newObject = {}
  Object.keys(object).forEach(objectKey => {
    const [key, value] = iterator(objectKey, object[objectKey])
    newObject[key] = value
  })

  return newObject
}

export const sortObject = value => {
  if (!isPlainObject(value)) {
    return value
  }
  const result = {}
  for (let key of Object.keys(value).sort()) {
    result[key] = sortObject(value[key])
  }
  return result
}

export const withoutEmptyObjects = object => {
  let resultObject
  if (isPlainObject(object)) {
    for (let key in object) {
      const value = object[key]
      const newValue = withoutEmptyObjects(value)
      if (newValue != null) {
        if (resultObject == null) {
          resultObject = {}
        }
        resultObject[key] = newValue
      }
    }
  } else {
    resultObject = object
  }
  return resultObject
}

/**
 * @private
 * @type {Function}
 * @param {Any} object
 */
export const deepClone = object => {
  if (object instanceof Color) {
    return object.clone()
  } else if (Array.isArray(object)) {
    return object.map(value => deepClone(value))
  } else if (isPlainObject(object)) {
    return mapObject(object, (key, value) => [key, deepClone(value)])
  } else {
    return object
  }
}
