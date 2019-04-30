import React, { Component } from 'react'
import styled, { withTheme } from 'styled-components'
import * as R from 'ramda'

import configSchema from './config-schema'

import {
  CheckboxComponent,
  TextInputComponent,
  NumberInputComponent,
  IntegerInputComponent,
  OptionsComponent
} from './components'

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

    const { config } = props

    this.configState = this.configToState(config)
    console.log('configState:', this.configState)
  }

  /**
   * для всех ключей, что есть в схеме создаем объект состояния значением берется из объекта config или если нет, то дефолтное значение схемы
   */
  configToState = config => {
    const state = {}

    const configKeys = Object.keys(config.core)

    for (const key in configSchema.core) {
      if (key in configKeys) {
        state[key] = config.core[key]
      } else {
        state[key] = configSchema.core[key]['default']
      }
    }

    return state
  }

  /**
   * для всех ключей, что есть в схеме
   * если значение в состоянии ЕСТЬ и совпадает с дефолтным, то пропускаем этот ключ
   * если значение в состоянии ЕСТЬ и не совпадает, то заносим в результат
   * иначе пропускаем
   */
  stateToConf = state => {
    const config = { core: {} }

    for (const key in configSchema.core) {
      if (state.core[key] != null && state.core[key] !== configSchema.core[key]['default']) {
        config.core[key] = state.core[key]
      }
    }

    return config
  }

  render() {
    return (
      <div style={{ height: '100%' }}>
        {Object.entries(configSchema.core).map(([key, item]) => {
          let Control = null
          const label = uncamelcase(key)

          if (item.enum) {
            Control = OptionsComponent(label, item.enum, item.default, item.description)
          } else if (item.type === 'boolean') {
            Control = CheckboxComponent(label, item.default, item.description)
          } else if (item.type === 'string') {
            Control = TextInputComponent(label, item.default, item.description)
          } else if (item.type === 'number') {
            Control = NumberInputComponent(label, item.default, item.description)
          } else if (item.type === 'integer') {
            Control = IntegerInputComponent(label, item.default, item.description)
          }

          return (
            <div key={key} style={{ marginTop: 10, marginBottom: 10 }}>
              <Control
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
