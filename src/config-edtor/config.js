import _ from 'lodash'
import Color from './color'
import {
  getValueAtKeyPath,
  setValueAtKeyPath,
  deleteValueAtKeyPath,
  pushKeyPath,
  splitKeyPath
} from './key-path-helpers'

const isPlainObject = value =>
  _.isObject(value) && !Array.isArray(value) && !_.isFunction(value) && !_.isString(value) && !(value instanceof Color)

const sortObject = value => {
  if (!isPlainObject(value)) {
    return value
  }
  const result = {}
  for (let key of Object.keys(value).sort()) {
    result[key] = sortObject(value[key])
  }
  return result
}

const withoutEmptyObjects = object => {
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
const deepClone = object => {
  if (object instanceof Color) {
    return object.clone()
  } else if (Array.isArray(object)) {
    return object.map(value => deepClone(value))
  } else if (isPlainObject(object)) {
    return _.mapObject(object, (key, value) => [key, deepClone(value)])
  } else {
    return object
  }
}

/**
 * @private
 * @type {Function}
 * @param {*} target
 */
const deepDefaults = function(target) {
  let result = target
  let i = 0
  while (++i < arguments.length) {
    const object = arguments[i]
    if (isPlainObject(result) && isPlainObject(object)) {
      for (let key of Object.keys(object)) {
        result[key] = deepDefaults(result[key], object[key])
      }
    } else {
      if (result == null) {
        result = deepClone(object)
      }
    }
  }
  return result
}

/**
 * Used to access all of Vision's configuration details.
 *
 * An instance of this class is always available as the `vision.config` global.
 * @example
 * const ConfigSchema = require('./config-schema')
 * ConfigSchema.projectHome = {
 *   type: 'string',
 *   default: path.join(fs.getHomeDirectory(), 'Projects'),
 *   description: 'The directory where projects are assumed to be located. Packages created using the Package Generator will be stored here by default.'
 * }
 *
 * const configPath = path.join(process.env.VISION_HOME, 'config.cson')
 *
 * this.config = new Config({
 *   saveCallback: settings => {
 *     this.applicationDelegate.setUserSettings(settings, configPath)
 *   },
 *   mainSource: configPath,
 *   projectHomeSchema: ConfigSchema.projectHome
 * })
 *
 * this.config.setSchema(null, {type: 'object', properties: _.clone(ConfigSchema)})
 * this.config.resetUserSettings(userSettings)
 */
export default class Config {
  constructor(params = {}) {
    this.clear()
    this.initialize(params)
  }

  clear() {
    this.schema = {
      type: 'object',
      properties: {}
    }

    this.defaultSettings = {}
    this.settings = {}
  }

  initialize({ saveCallback, mainSource, projectHomeSchema }) {
    if (saveCallback) {
      this.saveCallback = saveCallback
    }

    if (mainSource) this.mainSource = mainSource

    if (projectHomeSchema) {
      // этот уровень вложенности может не существовать!!!
      this.schema.properties.core.properties.projectHome = projectHomeSchema
      this.defaultSettings.core.projectHome = projectHomeSchema.default
    }
  }

  getUserConfigPath() {
    return this.mainSource
  }

  save() {
    if (this.saveCallback) {
      let allSettings = { '*': this.settings }
      // allSettings = Object.assign(allSettings, this.scopedSettingsStore.propertiesForSource(this.mainSource))
      allSettings = sortObject(allSettings)
      this.saveCallback(allSettings)
    }
  }

  /**
   * Note that with no value set, ::get returns the setting's default value.
   * @type {Function}
   * @param  {...any} args
   * @example
   * vision.config.get('my-package.myKey') // -> 'defaultValue' if no value set
   *
   * vision.config.set('my-package.myKey', 'value')
   * vision.config.get('my-package.myKey') // -> 'value'
   *
   */
  get(...args) {
    let keyPath, options, scope
    if (args.length > 1) {
      if (typeof args[0] === 'string' || args[0] == null) {
        ;[keyPath, options] = args
        ;({ scope } = options)
      }
    } else {
      ;[keyPath] = args
    }
    return this.getRawValue(keyPath, options)
  }

  /**
   * @private
   * @type {Function}
   * @param {*} keyPath
   * @param {*} options
   */
  getRawValue(keyPath, options = {}) {
    let value
    if (!options.excludeSources || !options.excludeSources.includes(this.mainSource)) {
      value = getValueAtKeyPath(this.settings, keyPath)
      if (this.projectFile != null) {
        const projectValue = getValueAtKeyPath(this.projectSettings, keyPath)
        value = projectValue === undefined ? value : projectValue
      }
    }

    let defaultValue
    if (!options.sources || options.sources.length === 0) {
      defaultValue = getValueAtKeyPath(this.defaultSettings, keyPath)
    }

    if (value != null) {
      value = deepClone(value)
      if (isPlainObject(value) && isPlainObject(defaultValue)) {
        deepDefaults(value, defaultValue)
      }
      return value
    } else {
      return deepClone(defaultValue)
    }
  }
}

// Base schema enforcers. These will coerce raw input into the specified type,
// and will throw an error when the value cannot be coerced. Throwing the error
// will indicate that the value should not be set.
//
// Enforcers are run from most specific to least. For a schema with type
// `integer`, all the enforcers for the `integer` type will be run first, in
// order of specification. Then the `*` enforcers will be run, in order of
// specification.
Config.addSchemaEnforcers({
  any: {
    coerce(keyPath, value, schema) {
      return value
    }
  },

  integer: {
    coerce(keyPath, value, schema) {
      value = parseInt(value)
      if (isNaN(value) || !isFinite(value)) {
        throw new Error(`Validation failed at ${keyPath}, ${JSON.stringify(value)} cannot be coerced into an int`)
      }
      return value
    }
  },

  number: {
    coerce(keyPath, value, schema) {
      value = parseFloat(value)
      if (isNaN(value) || !isFinite(value)) {
        throw new Error(`Validation failed at ${keyPath}, ${JSON.stringify(value)} cannot be coerced into a number`)
      }
      return value
    }
  },

  boolean: {
    coerce(keyPath, value, schema) {
      switch (typeof value) {
        case 'string':
          if (value.toLowerCase() === 'true') {
            return true
          } else if (value.toLowerCase() === 'false') {
            return false
          } else {
            throw new Error(
              `Validation failed at ${keyPath}, ${JSON.stringify(
                value
              )} must be a boolean or the string 'true' or 'false'`
            )
          }
        case 'boolean':
          return value
        default:
          throw new Error(
            `Validation failed at ${keyPath}, ${JSON.stringify(
              value
            )} must be a boolean or the string 'true' or 'false'`
          )
      }
    }
  },

  string: {
    validate(keyPath, value, schema) {
      if (typeof value !== 'string') {
        throw new Error(`Validation failed at ${keyPath}, ${JSON.stringify(value)} must be a string`)
      }
      return value
    },

    validateMaximumLength(keyPath, value, schema) {
      if (typeof schema.maximumLength === 'number' && value.length > schema.maximumLength) {
        return value.slice(0, schema.maximumLength)
      } else {
        return value
      }
    }
  },

  null: {
    // null sort of isnt supported. It will just unset in this case
    coerce(keyPath, value, schema) {
      if (![undefined, null].includes(value)) {
        throw new Error(`Validation failed at ${keyPath}, ${JSON.stringify(value)} must be null`)
      }
      return value
    }
  },

  object: {
    coerce(keyPath, value, schema) {
      if (!isPlainObject(value)) {
        throw new Error(`Validation failed at ${keyPath}, ${JSON.stringify(value)} must be an object`)
      }
      if (schema.properties == null) {
        return value
      }

      let defaultChildSchema = null
      let allowsAdditionalProperties = true
      if (isPlainObject(schema.additionalProperties)) {
        defaultChildSchema = schema.additionalProperties
      }
      if (schema.additionalProperties === false) {
        allowsAdditionalProperties = false
      }

      const newValue = {}
      for (let prop in value) {
        const propValue = value[prop]
        const childSchema = schema.properties[prop] != null ? schema.properties[prop] : defaultChildSchema
        if (childSchema != null) {
          try {
            newValue[prop] = this.executeSchemaEnforcers(pushKeyPath(keyPath, prop), propValue, childSchema)
          } catch (error) {
            console.warn(`Error setting item in object: ${error.message}`)
          }
        } else if (allowsAdditionalProperties) {
          // Just pass through un-schema'd values
          newValue[prop] = propValue
        } else {
          console.warn(`Illegal object key: ${keyPath}.${prop}`)
        }
      }

      return newValue
    }
  },

  array: {
    coerce(keyPath, value, schema) {
      if (!Array.isArray(value)) {
        throw new Error(`Validation failed at ${keyPath}, ${JSON.stringify(value)} must be an array`)
      }
      const itemSchema = schema.items
      if (itemSchema != null) {
        const newValue = []
        for (let item of value) {
          try {
            newValue.push(this.executeSchemaEnforcers(keyPath, item, itemSchema))
          } catch (error) {
            console.warn(`Error setting item in array: ${error.message}`)
          }
        }
        return newValue
      } else {
        return value
      }
    }
  },

  color: {
    coerce(keyPath, value, schema) {
      const color = Color.parse(value)
      if (color == null) {
        throw new Error(`Validation failed at ${keyPath}, ${JSON.stringify(value)} cannot be coerced into a color`)
      }
      return color
    }
  },

  '*': {
    coerceMinimumAndMaximum(keyPath, value, schema) {
      if (typeof value !== 'number') {
        return value
      }
      if (schema.minimum != null && typeof schema.minimum === 'number') {
        value = Math.max(value, schema.minimum)
      }
      if (schema.maximum != null && typeof schema.maximum === 'number') {
        value = Math.min(value, schema.maximum)
      }
      return value
    },

    validateEnum(keyPath, value, schema) {
      let possibleValues = schema.enum

      if (Array.isArray(possibleValues)) {
        possibleValues = possibleValues.map(value => {
          if (value.hasOwnProperty('value')) {
            return value.value
          } else {
            return value
          }
        })
      }

      if (possibleValues == null || !Array.isArray(possibleValues) || !possibleValues.length) {
        return value
      }

      for (let possibleValue of possibleValues) {
        // Using `isEqual` for possibility of placing enums on array and object schemas
        if (_.isEqual(possibleValue, value)) {
          return value
        }
      }

      throw new Error(
        `Validation failed at ${keyPath}, ${JSON.stringify(value)} is not one of ${JSON.stringify(possibleValues)}`
      )
    }
  }
})
