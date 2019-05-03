import React, { Component } from 'react'
import { action, observable, decorate } from 'mobx'
import { observer } from 'mobx-react'

// hello --> Hello
export const capitalize = word => (word ? word[0].toUpperCase() + word.slice(1) : '')

// helloWorld --> Hello World
export const uncamelcase = string => {
  if (!string) return ''

  const result = string.replace(/([A-Z])|_+/g, (match, letter = '') => ` ${letter}`)
  return capitalize(result.trim())
}
@observer
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
        const propertyKey = `${key}.${subkey}`
        // хранилище для свойста
        const store = new (function() {
          this.key = propertyKey
          this.schema = schema
          this.value = null
          this.setValue = value => config.set(propertyKey, value)
          this.disposable = config.observe(propertyKey, value => (this.value = value))
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
    // const { config } = this.props

    return (
      <div>
        {Object.entries(this.divisions).map(([key, { title, description, properties }]) => {
          return (
            <div key={key}>
              <h1 key={key}>{title}</h1>
              {description && <p>{description}</p>}
              {properties.map(item => {
                const { key: propertyKey, schema, value, setValue } = item
                const { type, description: propertyDescription } = schema

                const name = uncamelcase(propertyKey.split('.').pop())

                return (
                  <div key={propertyKey}>
                    <h3>{name}</h3>
                    <p>{propertyDescription}</p>
                    <p>{value.toString()}</p>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }
}
