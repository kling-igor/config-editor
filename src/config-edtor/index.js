import React, { Component } from 'react'
import styled, { withTheme } from 'styled-components'
import * as R from 'ramda'

import configSchema from './config-schema'

import { CheckboxComponent, TextInputComponent, NumberInputComponent, OptionsComponent } from './components'

// hello --> Hello
export const capitalize = word => (word ? word[0].toUpperCase() + word.slice(1) : '')

// helloWorld --> Hello World
export const uncamelcase = string => {
  if (!string) return ''

  const result = string.replace(/([A-Z])|_+/g, (match, letter = '') => ` ${letter}`)
  return capitalize(result.trim())
}

export const lensSet = (path, value, target) => {
  const lens = R.lensPath(path.split('.'))
  return R.set(lens, value, target)
}

const onChange = state => key => ({ target }) => {
  const { type, value, checked } = target
  const actualValue = type === 'checkbox' ? checked : value

  Object.assign(state, lensSet(key, actualValue, state))
  // propertiesDidChange()
}

const onClick = state => key => value => {
  Object.assign(state, lensSet(key, value, state))
  // propertiesDidChange()
}

const onSelect = state => key => value => {
  Object.assign(state, lensSet(key, value, state))
  // propertiesDidChange()
}

export default class ConfigEditor extends Component {
  constructor(props) {
    super(props)

    // ПОКА ТОЛЬКО ДЛЯ CORE ДЕЛАЕМ
    this.items = Object.values(configSchema.core)

    // сюда нужно мержить значения из считанного файла и убирать те, что равны дефолтным
    this.configState = Object.assign({}, configSchema.core)
  }

  render() {
    return (
      <div style={{ height: '100%' }}>
        {Object.entries(configSchema.core).map(([key, item]) => {
          console.log(item.description)

          let Control = null
          if (item.type === 'boolean') {
            Control = CheckboxComponent(uncamelcase(key))
          } else if (item.type === 'string') {
            Control = TextInputComponent(key, uncamelcase(key), `Default: ${item.default}`)
          } else if (item.type === 'number') {
            // Control = NumberInputComponent(key, uncamelcase(key), `Default: ${item.default}`)
            Control = <></>
          }

          return (
            <div key={key}>
              <p>{uncamelcase(key)}</p>
              <p style={{ fontSize: '0.9em' }}>{item.description}</p>
              <Control
                key={key}
                value={this.configState[key].value}
                onChange={onChange(this.configState)(key)}
                onClick={onClick(this.configState)(key)}
                onSelect={onSelect(this.configState)(key)}
              />
            </div>
          )
        })}
      </div>
    )
  }
}
