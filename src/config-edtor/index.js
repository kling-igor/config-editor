import React, { Component } from 'react'
import { action, observable, decorate } from 'mobx'

export default class ConfigEditor extends Component {
  divisions = {}

  constructor(props) {
    super(props)

    const { config } = props

    // по всем корневым разделам (core, editor и т.д.)
    for (const key of Object.keys(config.schema.properties)) {
      this.divisions[key] = {
        title: config.schema.properties[key].title,
        description: config.schema.properties[key].description,
        properties: []
      }

      for (const subkey of Object.keys(config.schema.properties[key].properties)) {
        // схема элемента
        const schema = config.schema.properties[key].properties[subkey]
        const propertKey = `${key}.${subkey}`
        // хранилище для свойста
        const store = new (function() {
          this.schema = schema
          this.value = null
          this.setValue = value => config.set(propertKey, value)
          this.disposable = config.observe(propertKey, value => (this.value = value))
        })()

        decorate(store, {
          value: observable,
          setValue: action
        })

        this.divisions[key].properties.push(store)
      }
    }

    console.log('divisions:', this.divisions)
  }

  render() {
    const { config } = this.props
    console.log('CONFIG:', config)
    return <div>HELLO WORLD</div>
  }
}
