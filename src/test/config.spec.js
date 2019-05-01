import chai, { expect } from 'chai'
import deepEql from 'deep-eql'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import * as R from 'ramda'

chai.use(sinonChai)
chai.use(chaiAsPromised)

import Config from '../config-edtor/config'

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
