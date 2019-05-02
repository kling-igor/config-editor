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
    config.settingsLoaded = true

    savedSettings = []
    config.saveCallback = settings => {
      savedSettings.push(settings)
    }
  })

  describe('.get(keyPath, {scope, sources, excludeSources})', () => {
    it("allows a key path's value to be read", () => {
      expect(config.set('foo.bar.baz', 42)).to.equal(true)
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
})
