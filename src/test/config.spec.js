import chai, { expect } from 'chai'
import deepEql from 'deep-eql'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import * as R from 'ramda'

chai.use(sinonChai)
chai.use(chaiAsPromised)

import Config from '../config-edtor/config'

const config = new Config()
/*
describe('emptyObject() spec', () => {
  it('init', () => {
    const CONFIG_SCHEMA = {
      someKey: {
        type: 'string',
        default: 'foo',
        description: 'some description'
      }
    }

    let savedSettings

    const config = new Config({
      saveCallback: settings => {
        // do whaever you want with settings object
        savedSettings = settings
      },
      mainSource: '/some/path/config.json'
    })

    config.setSchema(null, { type: 'object', properties: R.clone(CONFIG_SCHEMA) })

    config.set('someKey', '42')

    config.save()

    expect(savedSettings).to.deep.equal({
      someKey: 'foo'
    })
  })
})
*/

describe('Config', () => {
  let savedSettings
  beforeEach(() => {
    config.clear()
    config.settingsLoaded = true

    savedSettings = []
    config.saveCallback = settings => {
      savedSettings.push(settings)
    }
  })

  describe('.get(keyPath, {scope, sources, excludeSources})', () => {
    it("allows a key path's value to be read", () => {
      expect(config.set('foo.bar.baz', 42)).to.be.true
      expect(config.get('foo.bar.baz')).to.equal(42)
      expect(config.get('foo.quux')).to.be.undefined
    })

    it("returns a deep clone of the key path's value", () => {
      config.set('value', { array: [1, { b: 2 }, 3] })
      const retrievedValue = config.get('value')
      retrievedValue.array[0] = 4
      retrievedValue.array[1].b = 2.1
      expect(config.get('value')).to.deep.equal({ array: [1, { b: 2 }, 3] })
    })

    it('merges defaults into the returned value if both the assigned value and the default value are objects', () => {
      config.setDefaults('foo.bar', { baz: 1, ok: 2 })
      config.set('foo.bar', { baz: 3 })
      expect(config.get('foo.bar')).to.deep.equal({ baz: 3, ok: 2 })

      config.setDefaults('other', { baz: 1 })
      config.set('other', 7)
      expect(config.get('other')).to.equal(7)

      config.set('bar.baz', { a: 3 })
      config.setDefaults('bar', { baz: 7 })
      expect(config.get('bar.baz')).to.deep.equal({ a: 3 })
    })
  })

  describe('when the value equals the default value', () => {
    it("does not store the value in the user's config", () => {
      config.setSchema('foo', {
        type: 'object',
        properties: {
          same: {
            type: 'number',
            default: 1
          },
          changes: {
            type: 'number',
            default: 1
          },
          sameArray: {
            type: 'array',
            default: [1, 2, 3]
          },
          sameObject: {
            type: 'object',
            default: { a: 1, b: 2 }
          },
          null: {
            type: '*',
            default: null
          },
          undefined: {
            type: '*',
            default: undefined
          }
        }
      })
      expect(config.settings.foo).to.be.undefined

      config.set('foo.same', 1)
      config.set('foo.changes', 2)
      config.set('foo.sameArray', [1, 2, 3])
      config.set('foo.null', undefined)
      config.set('foo.undefined', null)
      config.set('foo.sameObject', { b: 2, a: 1 })

      const userConfigPath = config.getUserConfigPath()

      expect(config.get('foo.same', { sources: [userConfigPath] })).to.be.undefined

      expect(config.get('foo.changes')).to.equal(2)
      expect(config.get('foo.changes', { sources: [userConfigPath] })).to.equal(2)

      config.set('foo.changes', 1)
      expect(config.get('foo.changes', { sources: [userConfigPath] })).to.be.undefined
    })
  })

  describe('when the value has an "integer" type', () => {
    beforeEach(() => {
      const schema = {
        type: 'integer',
        default: 12
      }
      config.setSchema('foo.bar.anInt', schema)
    })

    it('coerces a string to an int', () => {
      config.set('foo.bar.anInt', '123')
      expect(config.get('foo.bar.anInt')).to.equal(123)
    })

    it('does not allow infinity', () => {
      config.set('foo.bar.anInt', Infinity)
      expect(config.get('foo.bar.anInt')).to.equal(12)
    })

    it('coerces a float to an int', () => {
      config.set('foo.bar.anInt', 12.3)
      expect(config.get('foo.bar.anInt')).to.equal(12)
    })

    it('will not set non-integers', () => {
      config.set('foo.bar.anInt', null)
      expect(config.get('foo.bar.anInt')).to.equal(12)

      config.set('foo.bar.anInt', 'nope')
      expect(config.get('foo.bar.anInt')).to.equal(12)
    })

    describe('when the minimum and maximum keys are used', () => {
      beforeEach(() => {
        const schema = {
          type: 'integer',
          minimum: 10,
          maximum: 20,
          default: 12
        }
        config.setSchema('foo.bar.anInt', schema)
      })

      it('keeps the specified value within the specified range', () => {
        config.set('foo.bar.anInt', '123')
        expect(config.get('foo.bar.anInt')).to.equal(20)

        config.set('foo.bar.anInt', '1')
        expect(config.get('foo.bar.anInt')).to.equal(10)
      })
    })
  })

  describe('when the value has an "integer" and "string" type', () => {
    beforeEach(() => {
      const schema = {
        type: ['integer', 'string'],
        default: 12
      }
      config.setSchema('foo.bar.anInt', schema)
    })

    it('can coerce an int, and fallback to a string', () => {
      config.set('foo.bar.anInt', '123')
      expect(config.get('foo.bar.anInt')).to.equal(123)

      config.set('foo.bar.anInt', 'cats')
      expect(config.get('foo.bar.anInt')).to.equal('cats')
    })
  })

  describe('when the value has an "string" and "boolean" type', () => {
    beforeEach(() => {
      const schema = {
        type: ['string', 'boolean'],
        default: 'def'
      }
      config.setSchema('foo.bar', schema)
    })

    it('can set a string, a boolean, and revert back to the default', () => {
      config.set('foo.bar', 'ok')
      expect(config.get('foo.bar')).to.equal('ok')

      config.set('foo.bar', false)
      expect(config.get('foo.bar')).to.equal(false)

      config.set('foo.bar', undefined)
      expect(config.get('foo.bar')).to.equal('def')
    })
  })

  describe('when the value has a "number" type', () => {
    beforeEach(() => {
      const schema = {
        type: 'number',
        default: 12.1
      }
      config.setSchema('foo.bar.aFloat', schema)
    })

    it('coerces a string to a float', () => {
      config.set('foo.bar.aFloat', '12.23')
      expect(config.get('foo.bar.aFloat')).to.equal(12.23)
    })

    it('will not set non-numbers', () => {
      config.set('foo.bar.aFloat', null)
      expect(config.get('foo.bar.aFloat')).to.equal(12.1)

      config.set('foo.bar.aFloat', 'nope')
      expect(config.get('foo.bar.aFloat')).to.equal(12.1)
    })

    describe('when the minimum and maximum keys are used', () => {
      beforeEach(() => {
        const schema = {
          type: 'number',
          minimum: 11.2,
          maximum: 25.4,
          default: 12.1
        }
        config.setSchema('foo.bar.aFloat', schema)
      })

      it('keeps the specified value within the specified range', () => {
        config.set('foo.bar.aFloat', '123.2')
        expect(config.get('foo.bar.aFloat')).to.equal(25.4)

        config.set('foo.bar.aFloat', '1.0')
        expect(config.get('foo.bar.aFloat')).to.equal(11.2)
      })
    })
  })

  describe('when the value has a "boolean" type', () => {
    beforeEach(() => {
      const schema = {
        type: 'boolean',
        default: true
      }
      config.setSchema('foo.bar.aBool', schema)
    })

    it('coerces various types to a boolean', () => {
      config.set('foo.bar.aBool', 'true')
      expect(config.get('foo.bar.aBool')).to.equal(true)
      config.set('foo.bar.aBool', 'false')
      expect(config.get('foo.bar.aBool')).to.equal(false)
      config.set('foo.bar.aBool', 'TRUE')
      expect(config.get('foo.bar.aBool')).to.equal(true)
      config.set('foo.bar.aBool', 'FALSE')
      expect(config.get('foo.bar.aBool')).to.equal(false)
      config.set('foo.bar.aBool', 1)
      expect(config.get('foo.bar.aBool')).to.equal(false)
      config.set('foo.bar.aBool', 0)
      expect(config.get('foo.bar.aBool')).to.equal(false)
      config.set('foo.bar.aBool', {})
      expect(config.get('foo.bar.aBool')).to.equal(false)
      config.set('foo.bar.aBool', null)
      expect(config.get('foo.bar.aBool')).to.equal(false)
    })

    it('reverts back to the default value when undefined is passed to set', () => {
      config.set('foo.bar.aBool', 'false')
      expect(config.get('foo.bar.aBool')).to.equal(false)

      config.set('foo.bar.aBool', undefined)
      expect(config.get('foo.bar.aBool')).to.equal(true)
    })
  })

  describe('when the value has an "string" type', () => {
    beforeEach(() => {
      const schema = {
        type: 'string',
        default: 'ok'
      }
      config.setSchema('foo.bar.aString', schema)
    })

    it('allows strings', () => {
      config.set('foo.bar.aString', 'yep')
      expect(config.get('foo.bar.aString')).to.equal('yep')
    })

    it('will only set strings', () => {
      expect(config.set('foo.bar.aString', 123)).to.be.false
      expect(config.get('foo.bar.aString')).to.equal('ok')

      expect(config.set('foo.bar.aString', true)).to.be.false
      expect(config.get('foo.bar.aString')).to.equal('ok')

      expect(config.set('foo.bar.aString', null)).to.be.false
      expect(config.get('foo.bar.aString')).to.equal('ok')

      expect(config.set('foo.bar.aString', [])).to.be.false
      expect(config.get('foo.bar.aString')).to.equal('ok')

      expect(config.set('foo.bar.aString', { nope: 'nope' })).to.be.false
      expect(config.get('foo.bar.aString')).to.equal('ok')
    })

    it('does not allow setting children of that key-path', () => {
      expect(config.set('foo.bar.aString.something', 123)).to.be.false
      expect(config.get('foo.bar.aString')).to.equal('ok')
    })

    describe('when the schema has a "maximumLength" key', () =>
      it('trims the string to be no longer than the specified maximum', () => {
        const schema = {
          type: 'string',
          default: 'ok',
          maximumLength: 3
        }
        config.setSchema('foo.bar.aString', schema)
        config.set('foo.bar.aString', 'abcdefg')
        expect(config.get('foo.bar.aString')).to.equal('abc')
      }))
  })

  describe('when the value has an "object" type', () => {
    beforeEach(() => {
      const schema = {
        type: 'object',
        properties: {
          anInt: {
            type: 'integer',
            default: 12
          },
          nestedObject: {
            type: 'object',
            properties: {
              nestedBool: {
                type: 'boolean',
                default: false
              }
            }
          }
        }
      }
      config.setSchema('foo.bar', schema)
    })

    it('converts and validates all the children', () => {
      config.set('foo.bar', {
        anInt: '23',
        nestedObject: {
          nestedBool: 'true'
        }
      })
      expect(config.get('foo.bar')).to.deep.equal({
        anInt: 23,
        nestedObject: {
          nestedBool: true
        }
      })
    })

    it('will set only the values that adhere to the schema', () => {
      expect(
        config.set('foo.bar', {
          anInt: 'nope',
          nestedObject: {
            nestedBool: true
          }
        })
      ).to.be.true
      expect(config.get('foo.bar.anInt')).to.equal(12)
      expect(config.get('foo.bar.nestedObject.nestedBool')).to.equal(true)
    })

    describe('when the value has additionalProperties set to false', () =>
      it('does not allow other properties to be set on the object', () => {
        config.setSchema('foo.bar', {
          type: 'object',
          properties: {
            anInt: {
              type: 'integer',
              default: 12
            }
          },
          additionalProperties: false
        })

        expect(config.set('foo.bar', { anInt: 5, somethingElse: 'ok' })).to.be.true
        expect(config.get('foo.bar.anInt')).to.equal(5)
        expect(config.get('foo.bar.somethingElse')).to.be.undefined

        expect(config.set('foo.bar.somethingElse', { anInt: 5 })).to.be.false
        expect(config.get('foo.bar.somethingElse')).to.be.undefined
      }))

    describe('when the value has an additionalProperties schema', () =>
      it('validates properties of the object against that schema', () => {
        config.setSchema('foo.bar', {
          type: 'object',
          properties: {
            anInt: {
              type: 'integer',
              default: 12
            }
          },
          additionalProperties: {
            type: 'string'
          }
        })

        expect(config.set('foo.bar', { anInt: 5, somethingElse: 'ok' })).to.be.true
        expect(config.get('foo.bar.anInt')).to.equal(5)
        expect(config.get('foo.bar.somethingElse')).to.equal('ok')

        expect(config.set('foo.bar.somethingElse', 7)).to.be.false
        expect(config.get('foo.bar.somethingElse')).to.equal('ok')

        expect(config.set('foo.bar', { anInt: 6, somethingElse: 7 })).to.be.true
        expect(config.get('foo.bar.anInt')).to.equal(6)
        expect(config.get('foo.bar.somethingElse')).to.be.undefined
      }))
  })

  describe('when the value has an "array" type', () => {
    beforeEach(() => {
      const schema = {
        type: 'array',
        default: [1, 2, 3],
        items: {
          type: 'integer'
        }
      }
      config.setSchema('foo.bar', schema)
    })

    it('converts an array of strings to an array of ints', () => {
      config.set('foo.bar', ['2', '3', '4'])
      expect(config.get('foo.bar')).to.deep.equal([2, 3, 4])
    })

    it('does not allow setting children of that key-path', () => {
      expect(config.set('foo.bar.child', 123)).to.be.false
      expect(config.set('foo.bar.child.grandchild', 123)).to.be.false
      expect(config.get('foo.bar')).to.deep.equal([1, 2, 3])
    })
  })

  describe('when the value has a "color" type', () => {
    beforeEach(() => {
      const schema = {
        type: 'color',
        default: 'white'
      }
      config.setSchema('foo.bar.aColor', schema)
    })

    it.skip('returns a Color object', () => {
      let color = config.get('foo.bar.aColor')
      expect(color.toHexString()).to.equal('#ffffff')
      expect(color.toRGBAString()).to.equal('rgba(255, 255, 255, 1)')

      color.red = 0
      color.green = 0
      color.blue = 0
      color.alpha = 0
      config.set('foo.bar.aColor', color)

      color = config.get('foo.bar.aColor')
      expect(color.toHexString()).to.equal('#000000')
      expect(color.toRGBAString()).to.equal('rgba(0, 0, 0, 0)')

      color.red = 300
      color.green = -200
      color.blue = -1
      color.alpha = 'not see through'
      config.set('foo.bar.aColor', color)

      color = config.get('foo.bar.aColor')
      expect(color.toHexString()).to.equal('#ff0000')
      expect(color.toRGBAString()).to.equal('rgba(255, 0, 0, 1)')

      color.red = 11
      color.green = 11
      color.blue = 124
      color.alpha = 1
      config.set('foo.bar.aColor', color)

      color = config.get('foo.bar.aColor')
      expect(color.toHexString()).to.equal('#0b0b7c')
      expect(color.toRGBAString()).to.equal('rgba(11, 11, 124, 1)')
    })

    it.skip('coerces various types to a color object', () => {
      config.set('foo.bar.aColor', 'red')
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 255,
          green: 0,
          blue: 0,
          alpha: 1
        })
      ).to.be.true

      config.set('foo.bar.aColor', '#020')
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 0,
          green: 34,
          blue: 0,
          alpha: 1
        })
      ).to.be.true

      config.set('foo.bar.aColor', '#abcdef')
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 171,
          green: 205,
          blue: 239,
          alpha: 1
        })
      ).to.be.true

      config.set('foo.bar.aColor', 'rgb(1,2,3)')
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 1,
          green: 2,
          blue: 3,
          alpha: 1
        })
      ).to.be.true

      config.set('foo.bar.aColor', 'rgba(4,5,6,.7)')
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 4,
          green: 5,
          blue: 6,
          alpha: 0.7
        })
      ).to.be.true

      config.set('foo.bar.aColor', 'hsl(120,100%,50%)')
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 0,
          green: 255,
          blue: 0,
          alpha: 1
        })
      ).to.be.true

      config.set('foo.bar.aColor', 'hsla(120,100%,50%,0.3)')
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 0,
          green: 255,
          blue: 0,
          alpha: 0.3
        })
      ).to.be.true

      config.set('foo.bar.aColor', {
        red: 100,
        green: 255,
        blue: 2,
        alpha: 0.5
      }).to.be.true
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 100,
          green: 255,
          blue: 2,
          alpha: 0.5
        })
      ).to.be.true

      config.set('foo.bar.aColor', { red: 255 })
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 255,
          green: 0,
          blue: 0,
          alpha: 1
        })
      ).to.be.true

      config.set('foo.bar.aColor', { red: 1000 })
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 255,
          green: 0,
          blue: 0,
          alpha: 1
        })
      ).to.be.true

      config.set('foo.bar.aColor', { red: 'dark' })
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 0,
          green: 0,
          blue: 0,
          alpha: 1
        })
      ).to.be.true
    })

    it.skip('reverts back to the default value when undefined is passed to set', () => {
      config.set('foo.bar.aColor', undefined)
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 255,
          green: 255,
          blue: 255,
          alpha: 1
        })
      ).to.be.true
    })

    it.skip('will not set non-colors', () => {
      config.set('foo.bar.aColor', null)
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 255,
          green: 255,
          blue: 255,
          alpha: 1
        })
      ).to.be.true

      config.set('foo.bar.aColor', 'nope')
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 255,
          green: 255,
          blue: 255,
          alpha: 1
        })
      ).to.be.true

      config.set('foo.bar.aColor', 30)
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 255,
          green: 255,
          blue: 255,
          alpha: 1
        })
      ).to.be.true

      config.set('foo.bar.aColor', false)
      expect(
        config.get('foo.bar.aColor').isEqual({
          red: 255,
          green: 255,
          blue: 255,
          alpha: 1
        })
      ).to.be.true
    })

    it('returns a clone of the Color when returned in a parent object', () => {
      const color1 = config.get('foo.bar').aColor
      const color2 = config.get('foo.bar').aColor
      expect(color1.toRGBAString()).to.equal('rgba(255, 255, 255, 1)')
      expect(color2.toRGBAString()).to.equal('rgba(255, 255, 255, 1)')
      expect(color1).not.to.equal(color2)
      expect(color1.isEqual(color2)).to.be.true
    })
  })

  describe('when the `enum` key is used', () => {
    beforeEach(() => {
      const schema = {
        type: 'object',
        properties: {
          str: {
            type: 'string',
            default: 'ok',
            enum: ['ok', 'one', 'two']
          },
          int: {
            type: 'integer',
            default: 2,
            enum: [2, 3, 5]
          },
          arr: {
            type: 'array',
            default: ['one', 'two'],
            items: {
              type: 'string',
              enum: ['one', 'two', 'three']
            }
          },
          str_options: {
            type: 'string',
            default: 'one',
            enum: [{ value: 'one', description: 'One' }, 'two', { value: 'three', description: 'Three' }]
          }
        }
      }

      config.setSchema('foo.bar', schema)
    })

    it('will only set a string when the string is in the enum values', () => {
      expect(config.set('foo.bar.str', 'nope')).to.be.false
      expect(config.get('foo.bar.str')).to.equal('ok')

      expect(config.set('foo.bar.str', 'one')).to.be.true
      expect(config.get('foo.bar.str')).to.equal('one')
    })

    it('will only set an integer when the integer is in the enum values', () => {
      expect(config.set('foo.bar.int', '400')).to.be.false
      expect(config.get('foo.bar.int')).to.equal(2)

      expect(config.set('foo.bar.int', '3')).to.be.true
      expect(config.get('foo.bar.int')).to.equal(3)
    })

    it('will only set an array when the array values are in the enum values', () => {
      expect(config.set('foo.bar.arr', ['one', 'five'])).to.be.true
      expect(config.get('foo.bar.arr')).to.deep.equal(['one'])

      expect(config.set('foo.bar.arr', ['two', 'three'])).to.be.true
      expect(config.get('foo.bar.arr')).to.deep.equal(['two', 'three'])
    })

    it('will honor the enum when specified as an array', () => {
      expect(config.set('foo.bar.str_options', 'one')).to.be.true
      expect(config.get('foo.bar.str_options')).to.equal('one')

      expect(config.set('foo.bar.str_options', 'two')).to.be.true
      expect(config.get('foo.bar.str_options')).to.equal('two')

      expect(config.set('foo.bar.str_options', 'One')).to.be.false
      expect(config.get('foo.bar.str_options')).to.equal('two')
    })
  })
})
