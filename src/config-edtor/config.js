import _ from 'lodash'
import { Emitter } from 'event-kit'
import Color from './color'
import {
  getValueAtKeyPath,
  setValueAtKeyPath,
  deleteValueAtKeyPath,
  pushKeyPath,
  splitKeyPath
} from './key-path-helpers'

const schemaEnforcers = {}

const isPlainObject = value =>
  _.isObject(value) && !Array.isArray(value) && !_.isFunction(value) && !_.isString(value) && !(value instanceof Color)

/**
 * Transform the given object into another object.
 * @param {Object} object - the object to transform.
 * @param {Function} iterator -  A function that takes `(key, value)` arguments and returns a `[key, value]` tuple
 */
const mapObject = (object, iterator) => {
  const newObject = {}
  Object.keys(object).forEach(objectKey => {
    const [key, value] = iterator(objectKey, object[objectKey])
    newObject[key] = value
  })

  return newObject
}

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
    return mapObject(object, (key, value) => [key, deepClone(value)])
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
 * const configPath = path.join(process.env.VISION_HOME, 'config.json')
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
  static addSchemaEnforcer(typeName, enforcerFunction) {
    if (schemaEnforcers[typeName] == null) {
      schemaEnforcers[typeName] = []
    }
    return schemaEnforcers[typeName].push(enforcerFunction)
  }

  static addSchemaEnforcers(filters) {
    for (let typeName in filters) {
      const functions = filters[typeName]
      for (let name in functions) {
        const enforcerFunction = functions[name]
        this.addSchemaEnforcer(typeName, enforcerFunction)
      }
    }
  }

  static executeSchemaEnforcers(keyPath, value, schema) {
    let error = null
    let types = schema.type
    if (!Array.isArray(types)) {
      types = [types]
    }
    for (let type of types) {
      try {
        const enforcerFunctions = schemaEnforcers[type].concat(schemaEnforcers['*'])
        for (let enforcer of enforcerFunctions) {
          // At some point in one's life, one must call upon an enforcer.
          value = enforcer.call(this, keyPath, value, schema)
        }
        error = null
        break
      } catch (e) {
        error = e
      }
    }

    if (error != null) {
      throw error
    }
    return value
  }

  constructor(params = {}) {
    this.clear()
    this.initialize(params)
  }

  clear() {
    this.emitter = new Emitter()

    this.schema = {
      type: 'object',
      properties: {}
    }

    this.defaultSettings = {}
    this.settings = {}
    this.projectSettings = {}
    this.projectFile = null

    this.transactDepth = 0
    this.pendingOperations = []

    this.requestSave = _.debounce(() => this.save(), 1)
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
   * Retrieves the setting for the given key
   * Note that with no value set, ::get returns the setting's default value.
   * @type {Function}
   * @param {String} keyPath - the name of the key to retrieve
   * @param {Object} [options]
   * @param {String[]} [options.sources] - source names. If provided, only values that were associated with these sources during {::set} will be used
   * @param {String[]} [options.excludeSources] - source names. If provided, values that  were associated with these sources during {::set} will not be used.
   * @returns {Any} - the value from Vision's default settings, the user's configuration file in the type specified by the configuration schema
   * @example
   * // You might want to know what themes are enabled, so check `core.themes`
   * vision.config.get('core.themes')
   * @example
   * vision.config.get('my-package.myKey') // -> 'defaultValue' if no value set
   * @example
   * vision.config.set('my-package.myKey', 'value')
   * vision.config.get('my-package.myKey') // -> 'value'
   */
  get(...args) {
    let keyPath, options
    if (args.length > 1) {
      if (typeof args[0] === 'string' || args[0] == null) {
        ;[keyPath, options] = args
      }
    } else {
      ;[keyPath] = args
    }
    return this.getRawValue(keyPath, options)
  }

  /**
   * Sets the value for a configuration setting
   * @type {Function}
   * @param {String} keyPath - the name of the key
   * @param {Any} [value] - the value of the setting. Passing `undefined` will revert the setting to the default value
   * @param {String} [source] - the name of a file with which the settingis associated. Defaults to the user's config file
   * @returns {Boolean} - `true` if the value was set, `false` if the value was not able to be coerced to the type specified in the setting's schema
   * @example
   * vision.config.set('core.themes', ['light-ui', 'light-syntax'])
   */
  set(...args) {
    let [keyPath, value, options = {}] = args

    if (!this.settingsLoaded) {
      this.pendingOperations.push(() => this.set(keyPath, value, options))
    }

    let source = options.source
    const shouldSave = options.save != null ? options.save : true

    if (!source) source = this.mainSource

    if (value !== undefined) {
      try {
        value = this.makeValueConformToSchema(keyPath, value)
      } catch (e) {
        return false
      }
    }

    this.setRawValue(keyPath, value, { source })

    if (source === this.mainSource && shouldSave && this.settingsLoaded) {
      this.requestSave()
    }
    return true
  }

  /**
   * Restore the setting at `keyPath` to its default value.
   * @type {Function}
   * @param {String} keyPath - the name of the key
   * @param {String} [source] - the name of a file with which the settingis associated. Defaults to the user's config file
   */
  unset(keyPath, source) {
    if (!this.settingsLoaded) {
      this.pendingOperations.push(() => this.unset(keyPath, source))
    }

    if (source == null) {
      source = this.mainSource
    }

    if (keyPath != null && source === this.mainSource) {
      return this.set(keyPath, getValueAtKeyPath(this.defaultSettings, keyPath))
    }
  }

  /**
   * @private
   * @type {Function}
   * @param {String} keyPath
   * @param {Any} value
   * @param {Object} [options = {}]
   */
  setRawValue(keyPath, value, options = {}) {
    const source = options.source ? options.source : undefined
    const settingsToChange = source === this.projectFile ? 'projectSettings' : 'settings'
    const defaultValue = getValueAtKeyPath(this.defaultSettings, keyPath)

    if (_.isEqual(defaultValue, value)) {
      if (keyPath != null) {
        deleteValueAtKeyPath(this[settingsToChange], keyPath)
      } else {
        this[settingsToChange] = null
      }
    } else {
      if (keyPath != null) {
        setValueAtKeyPath(this[settingsToChange], keyPath, value)
      } else {
        this[settingsToChange] = value
      }
    }
    return this.emitChangeEvent()
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

  setSchema(keyPath, schema) {
    if (!isPlainObject(schema)) {
      throw new Error(`Error loading schema for ${keyPath}: schemas can only be objects!`)
    }

    if (schema.type == null) {
      throw new Error(`Error loading schema for ${keyPath}: schema objects must have a type attribute`)
    }

    let rootSchema = this.schema
    if (keyPath) {
      for (let key of splitKeyPath(keyPath)) {
        rootSchema.type = 'object'
        if (rootSchema.properties == null) {
          rootSchema.properties = {}
        }
        const { properties } = rootSchema
        if (properties[key] == null) {
          properties[key] = {}
        }
        rootSchema = properties[key]
      }
    }

    Object.assign(rootSchema, schema)
    this.transact(() => {
      this.setDefaults(keyPath, this.extractDefaultsFromSchema(schema))
      this.resetSettingsForSchemaChange()
    })
  }

  emitChangeEvent() {
    if (this.transactDepth <= 0) {
      return this.emitter.emit('did-change')
    }
  }

  /**
   * Retrieve the schema for a specific key path. The schema will tell you what
   * type the keyPath expects, and other metadata about the config option.
   * @type {Function}
   * @param {String} keyPath - name of the key
   * @returns {(Object|null)} eg. `{type: 'integer', default: 23, minimum: 1}` or `null` when the keyPath has no schema specified, but is accessible from the root schema.
   */
  getSchema(keyPath) {
    const keys = splitKeyPath(keyPath)
    let { schema } = this
    for (let key of keys) {
      let childSchema
      if (schema.type === 'object') {
        childSchema = schema.properties != null ? schema.properties[key] : undefined
        if (childSchema == null) {
          if (isPlainObject(schema.additionalProperties)) {
            childSchema = schema.additionalProperties
          } else if (schema.additionalProperties === false) {
            return null
          } else {
            return { type: 'any' }
          }
        }
      } else {
        return null
      }
      schema = childSchema
    }
    return schema
  }

  setRawDefault(keyPath, value) {
    setValueAtKeyPath(this.defaultSettings, keyPath, value)
    return this.emitChangeEvent()
  }

  setDefaults(keyPath, defaults) {
    if (defaults != null && isPlainObject(defaults)) {
      const keys = splitKeyPath(keyPath)
      this.transact(() => {
        const result = []
        for (let key in defaults) {
          const childValue = defaults[key]
          if (!defaults.hasOwnProperty(key)) {
            continue
          }
          result.push(this.setDefaults(keys.concat([key]).join('.'), childValue))
        }
        return result
      })
    } else {
      try {
        defaults = this.makeValueConformToSchema(keyPath, defaults)
        this.setRawDefault(keyPath, defaults)
      } catch (e) {
        console.warn(
          `'${keyPath}' could not set the default. Attempted default: ${JSON.stringify(
            defaults
          )}; Schema: ${JSON.stringify(this.getSchema(keyPath))}`
        )
      }
    }
  }

  extractDefaultsFromSchema(schema) {
    if (schema.default != null) {
      return schema.default
    } else if (schema.type === 'object' && schema.properties != null && isPlainObject(schema.properties)) {
      const defaults = {}
      const properties = schema.properties || {}
      for (let key in properties) {
        const value = properties[key]
        defaults[key] = this.extractDefaultsFromSchema(value)
      }
      return defaults
    }
  }

  makeValueConformToSchema(keyPath, value, options) {
    if (options != null ? options.suppressException : undefined) {
      try {
        return this.makeValueConformToSchema(keyPath, value)
      } catch (e) {
        return undefined
      }
    } else {
      let schema
      if ((schema = this.getSchema(keyPath)) == null) {
        if (schema === false) {
          throw new Error(`Illegal key path ${keyPath}`)
        }
      }
      return this.constructor.executeSchemaEnforcers(keyPath, value, schema)
    }
  }

  /**
   * When the schema is changed / added, there may be values set in the config
   * that do not conform to the schema. This will reset make them conform
   * @type {Function}
   * @param {String} source
   */
  resetSettingsForSchemaChange(source) {
    if (source == null) {
      source = this.mainSource
    }
    return this.transact(() => {
      this.settings = this.makeValueConformToSchema(null, this.settings, { suppressException: true })
    })
  }

  // Private: Suppress calls to handler functions registered with {::onDidChange}
  // and {::observe} for the duration of the {Promise} returned by `callback`.
  // After the {Promise} is either resolved or rejected, handlers will be called
  // once if the value for their key-path has changed.
  //
  // * `callback` {Function} that returns a {Promise}, which will be executed
  //   while suppressing calls to handlers.
  //
  // Returns a {Promise} that is either resolved or rejected according to the
  // `{Promise}` returned by `callback`. If `callback` throws an error, a
  // rejected {Promise} will be returned instead.
  transactAsync(callback) {
    let endTransaction
    this.beginTransaction()
    try {
      endTransaction = fn => (...args) => {
        this.endTransaction()
        return fn(...args)
      }
      const result = callback()
      return new Promise((resolve, reject) => {
        return result.then(endTransaction(resolve)).catch(endTransaction(reject))
      })
    } catch (error) {
      this.endTransaction()
      return Promise.reject(error)
    }
  }

  beginTransaction() {
    this.transactDepth++
  }

  endTransaction() {
    this.transactDepth--
    this.emitChangeEvent()
  }

  // Extended: Suppress calls to handler functions registered with {::onDidChange}
  // and {::observe} for the duration of `callback`. After `callback` executes,
  // handlers will be called once if the value for their key-path has changed.
  //
  // * `callback` {Function} to execute while suppressing calls to handlers.
  transact(callback) {
    this.beginTransaction()
    try {
      return callback()
    } finally {
      this.endTransaction()
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
