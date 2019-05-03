import React, { Component } from 'react'
import { action, observable, decorate } from 'mobx'
import { observer } from 'mobx-react'

import { Checkbox } from '@blueprintjs/core'
import { FormGroup, InputGroup, NumericInput, Keys } from '@blueprintjs/core'
import { Label, HTMLSelect } from '@blueprintjs/core'
import { Tooltip, Position, Intent } from '@blueprintjs/core'
import styled, { withTheme } from 'styled-components'
import ReactMarkdown from 'react-markdown'

import { isPlainObject, uncamelcase } from './utils'

const LabelStyle = styled.p`
  margin-bottom: 2px;
  font-size: 1.2em;
`

const DescriptionStyle = styled.div`
  font-size: 0.9em;
  margin-bottom: 4px;
  opacity: 0.6;
`

const CheckboxDescriptionStyle = styled.div`
  font-size: 0.9em;
  margin-left: 26px;
  opacity: 0.6;
`

const Description = Style => ({ children }) => {
  return (
    <Style>
      <ReactMarkdown
        source={children}
        allowedTypes={['text', 'paragraph', 'emphasis', 'strong', 'delete', 'link', 'heading', 'inlineCode', 'code']}
      />
    </Style>
  )
}

const CheckboxDescription = Description(CheckboxDescriptionStyle)

const RegularDescription = Description(DescriptionStyle)

const makeCheckboxComponent = ({ label, default: defaultValue, description }) => ({ value, onChange }) => {
  const onchange = ({ target: { checked } }) => {
    onChange(checked)
  }

  const tooltip = <span>{`Default: ${defaultValue}`}</span>

  return (
    <>
      <Tooltip content={tooltip} intent={Intent.PRIMARY} position={Position.BOTTOM_LEFT}>
        <Checkbox className="vision" label={label} checked={value} onChange={onchange} />
      </Tooltip>
      <CheckboxDescription>{description}</CheckboxDescription>
    </>
  )
}

const makeNumberInputComponent = ({ label, default: defaultValue, description, minimum, maximum }) => ({
  value,
  onChange
}) => {
  const placeholder = `Default: ${defaultValue}`
  const tooltip = <span>{placeholder}</span>
  const actualValue = value === defaultValue ? undefined : value

  const onValueChange = (value, asString) => {
    if (!Number.isNaN(value)) {
      onChange(value)
    }
  }

  const handleKeyDown = e => {
    if (e.keyCode === Keys.ENTER) {
      let value

      try {
        value = parseFloat(e.target.value)
      } catch (e) {}

      onChange(value)
    }
  }

  const handleBlur = e => {
    let value

    try {
      value = parseFloat(e.target.value)
    } catch (e) {}

    onChange(value)
  }

  return (
    <>
      <LabelStyle>{label}</LabelStyle>
      <RegularDescription>{description}</RegularDescription>
      <Tooltip content={tooltip} intent={Intent.PRIMARY} usePortal={true} position={Position.TOP_LEFT}>
        <NumericInput
          fill={true}
          small
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onValueChange={onValueChange}
          onBlur={handleBlur}
          value={actualValue}
          min={minimum}
          max={maximum}
        />
      </Tooltip>
    </>
  )
}

const makeIntegerInputComponent = ({ label, default: defaultValue, description, minimum, maximum }) => ({
  value,
  onChange
}) => {
  const placeholder = `Default: ${defaultValue}`
  const tooltip = <span>{placeholder}</span>
  const actualValue = value === defaultValue ? undefined : value

  const onValueChange = (value, asString) => {
    if (!Number.isNaN(value)) {
      onChange(value)
    }
  }

  const handleKeyDown = e => {
    if (e.keyCode === Keys.ENTER) {
      let value

      try {
        value = parseInt(e.target.value)
      } catch (e) {}

      onChange(value)
    }
  }

  const handleBlur = e => {
    let value

    try {
      value = parseInt(e.target.value)
    } catch (e) {}

    onChange(value)
  }

  return (
    <>
      <LabelStyle>{label}</LabelStyle>
      <RegularDescription>{description}</RegularDescription>
      <Tooltip intent={Intent.PRIMARY} content={tooltip} position={Position.TOP_LEFT}>
        <NumericInput
          fill={true}
          small
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onValueChange={onValueChange}
          onBlur={handleBlur}
          value={actualValue}
          min={minimum}
          max={maximum}
          minorStepSize={null}
          majorStepSize={null}
        />
      </Tooltip>
    </>
  )
}

const makeOptionsComponent = ({ label, enum: enumValues, default: defaultValue, description }) => ({
  value,
  onChange
}) => {
  const onchange = ({ target: { value } }) => onChange(value)
  const tooltip = <span>{`Default: ${defaultValue}`}</span>

  const options = enumValues.map(item => {
    if (isPlainObject(item)) {
      const { value } = item
      return value
    }
    return item
  })

  return (
    <>
      <LabelStyle>{label}</LabelStyle>
      <RegularDescription>{description}</RegularDescription>
      <Tooltip content={tooltip} intent={Intent.PRIMARY} position={Position.TOP_LEFT}>
        <HTMLSelect options={options} fill onChange={onchange} value={value} />
      </Tooltip>
    </>
  )
}

const COMPONENT_MAKERS = {
  boolean: makeCheckboxComponent,
  number: makeNumberInputComponent,
  integer: makeIntegerInputComponent
}

const makeDefaultComponent = ({ label, default: defaultValue, description }) => ({ value, onChange }) => {
  return (
    <div>
      <h3>{label}</h3>
      <p>{description}</p>
      <p>{value.toString()}</p>
    </div>
  )
}

/**
 * @type {Function}
 * @param {Object} schema
 * @returns {Function}
 */
const componentMaker = schema => {
  if (schema.enum) {
    return makeOptionsComponent
  }

  return COMPONENT_MAKERS[schema.type] || makeDefaultComponent
}

@observer
export default class ConfigEditor extends Component {
  elements = []

  constructor(props) {
    super(props)

    const { config } = props

    const divisions = {}

    // по всем корневым разделам (core, editor и т.д.)
    for (const key of Object.keys(config.schema.properties)) {
      divisions[key] = {
        title: config.schema.properties[key].title,
        description: config.schema.properties[key].description,
        properties: []
      }

      for (const subkey of Object.keys(config.schema.properties[key].properties)) {
        // схема элемента
        const schema = config.schema.properties[key].properties[subkey]
        const propertyKey = `${key}.${subkey}`
        // хранилище для свойста

        const store = new (class {
          key = propertyKey
          schema = schema
          @observable value = ''
          @action.bound updateValue(value) {
            this.value = value
          }
          setValue = value => {
            config.set(propertyKey, value)
          }
          disposable = config.observe(propertyKey, this.updateValue)
        })()

        divisions[key].properties.push(store)
      }
    }

    this.elements = Object.entries(divisions).map(([key, { title, description, properties }]) => {
      return (
        <div key={key}>
          <h1 key={key}>{title}</h1>
          {description && <p>{description}</p>}
          {properties.map(item => {
            const { key: propertyKey, schema, value, setValue } = item

            const label = uncamelcase(propertyKey.split('.').pop())

            const FormComponent = componentMaker(schema)({ label, ...{ ...schema } })

            return <FormComponent key={propertyKey} value={value} onChange={setValue} />
          })}
        </div>
      )
    })
  }

  render() {
    return <div>{this.elements}</div>
  }
}
