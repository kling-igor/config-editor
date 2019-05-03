import React, { Component } from 'react'
import { action, observable, decorate } from 'mobx'
import { observer } from 'mobx-react'

import { Checkbox } from '@blueprintjs/core'
import { FormGroup, InputGroup, NumericInput, Keys } from '@blueprintjs/core'
import { Label, HTMLSelect } from '@blueprintjs/core'
import { Tooltip, Position, Intent } from '@blueprintjs/core'
import styled, { withTheme } from 'styled-components'
import ReactMarkdown from 'react-markdown'

import Fuse from 'fuse.js'
import { isPlainObject, uncamelcase } from './utils'

const settingsSearchOptions = {
  shouldSort: true,
  tokenize: true,
  threshold: 0,
  location: 0,
  distance: 0,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: ['label', 'description']
}

const LabelStyle = styled.p`
  margin-bottom: 2px;
  color: #9da5b4;
  font-weight: normal;
  font-size: 1.2em;
`

const SectionLabelStyle = styled.p`
  color: white;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: bold;
  font-size: 1.75em;
`

const SectionDescriptionStyle = styled.p`
  color: #9da5b4;
  font-size: 12px;
  margin-bottom: 0px;
`

const DescriptionStyle = styled.p`
  font-size: 12px;
  margin-bottom: 0px;
  color: rgba(157, 165, 180, 0.6);
`

const CheckboxDescriptionStyle = styled(DescriptionStyle)`
  margin-left: 26px;
  margin-bottom: 0px;
`

const ComponentContainer = styled.div`
  margin-top: 8px;
  margin-bottom: 8px;
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
    <ComponentContainer>
      <Tooltip content={tooltip} intent={Intent.PRIMARY} position={Position.BOTTOM_LEFT}>
        <Checkbox className="vision" label={label} checked={value} onChange={onchange} />
      </Tooltip>
      <CheckboxDescription>{description}</CheckboxDescription>
    </ComponentContainer>
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
    <ComponentContainer>
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
    </ComponentContainer>
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
    <ComponentContainer>
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
    </ComponentContainer>
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
    <ComponentContainer>
      <LabelStyle>{label}</LabelStyle>
      <RegularDescription>{description}</RegularDescription>
      <Tooltip content={tooltip} intent={Intent.PRIMARY} position={Position.TOP_LEFT}>
        <HTMLSelect options={options} fill onChange={onchange} value={value} />
      </Tooltip>
    </ComponentContainer>
  )
}

const COMPONENT_MAKERS = {
  boolean: makeCheckboxComponent,
  number: makeNumberInputComponent,
  integer: makeIntegerInputComponent
}

const makeDefaultComponent = ({ label, default: defaultValue, description }) => ({ value, onChange }) => {
  return (
    <ComponentContainer>
      <h3>{label}</h3>
      <p>{description}</p>
      <p>{value.toString()}</p>
    </ComponentContainer>
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

const SearchResultCount = ({ count }) => {
  if (count == null) return null

  return (
    <div
      style={{
        display: 'block',
        backgroundColor: '#444444',
        color: '#f4f4f4',
        paddingLeft: '8px',
        paddingRight: '8px',
        paddingTop: '2px',
        paddingBottom: '1px',
        borderRadius: 2,
        fontSize: '12px',
        margin: 0,
        marginTop: '3px',
        userSelect: 'none'
      }}
    >
      {`${count} Settings Found`}
    </div>
  )
}

@observer
export default class ConfigEditor extends Component {
  elements = []

  briefs = []

  state = { query: '', searchResultCount: null }

  constructor(props) {
    super(props)

    const { config } = props

    const topics = {}

    // по всем корневым разделам (core, editor и т.д.)
    for (const key of Object.keys(config.schema.properties)) {
      topics[key] = {
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

        topics[key].properties.push(store)
      }
    }

    this.elements = Object.entries(topics).map(([key, { title, description, properties }]) => {
      return (
        <div key={key}>
          <SectionLabelStyle>{title}</SectionLabelStyle>
          {description && <SectionDescriptionStyle>{description}</SectionDescriptionStyle>}
          {properties.map(item => {
            const { key: propertyKey, schema, value, setValue } = item
            const label = uncamelcase(propertyKey.split('.').pop())
            const FormComponent = componentMaker(schema)({ label, ...{ ...schema } })

            this.briefs.push({ key: propertyKey, label, description: schema.description })

            return <FormComponent key={propertyKey} value={value} onChange={setValue} />
          })}
        </div>
      )
    })

    this.state.searchResultCount = this.briefs.length

    this.fuse = new Fuse(this.briefs, settingsSearchOptions)
  }

  handleQueryChange = event => {
    this.setState({ query: event.target.value })

    if (event.target.value.length > 0) {
      const result = this.fuse.search(event.target.value)

      console.log('result:', result)

      if (result.length === 0) {
        this.setState({ searchResultCount: 'No' })
      } else {
        this.setState({ searchResultCount: result.length })
      }
    } else {
      this.setState({ searchResultCount: this.briefs.length })
    }
  }

  render() {
    return (
      <div className="bp3-dark">
        <InputGroup
          // leftIcon="search"
          onChange={this.handleQueryChange}
          placeholder="Search settings"
          rightElement={<SearchResultCount count={this.state.searchResultCount} />}
          small={true}
          fill={true}
          value={this.state.query}
          // onKeyDown={onKeyDown}
        />
        {this.elements}
      </div>
    )
  }
}
