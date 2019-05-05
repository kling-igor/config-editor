import React, { Component } from 'react'
import { action, observable, decorate } from 'mobx'
import { observer } from 'mobx-react'
import {
  Link,
  Element,
  ScrollElement,
  ScrollLink,
  Events,
  animateScroll as scroll,
  scrollSpy,
  scroller
} from 'react-scroll'

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
  color: ${({ theme: { type } }) => (type === 'dark' ? '#9da5b4' : '#717171')};
  font-weight: normal;
  font-size: 1.2em;
`

const SectionLabelStyle = styled.p`
  color: ${({ theme: { type } }) => (type === 'dark' ? '#dbdbdb' : '#292929')};
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: bold;
  font-size: 1.75em;
`

const SectionDescriptionStyle = styled.p`
  color: ${({ theme: { type } }) => (type === 'dark' ? '#9da5b4' : '#474747')};
  font-size: 12px;
  margin-bottom: 0px;
`

const DescriptionStyle = styled.p`
  font-size: 12px;
  margin-bottom: 0px;
  color: ${({ theme: { type } }) => (type === 'dark' ? 'rgba(157, 165, 180, 0.6)' : '#949494')};
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

const SearchResultBadgeStyle = styled.div`
  display: block;
  background-color: ${({ theme: { type } }) => (type === 'dark' ? '#444444' : '#bcbcbc')};
  color: ${({ theme: { type } }) => (type === 'dark' ? '#f4f4f4' : '#2d2d2d')};
  padding-left: 8px;
  padding-right: 8px;
  padding-top: 2px;
  padding-bottom: 1px;
  border-radius: 2px;
  font-size: 12px;
  margin: 0;
  margin-top: 3px;
  margin-right: 3px;
  user-select: none;
`

const SearchResultCount = withTheme(({ count }) => {
  if (count == null) return null

  return <SearchResultBadgeStyle>{`${count} Settings Found`}</SearchResultBadgeStyle>
})

const SearchContainerStyle = styled.div`
  overflow: hidden;

  position: relative;
  padding: 2px;
  top: 0px;
  left: 0px;
  height: 35px;
  min-height: 35px;
  width: 100%;
`

const ContentContainerStyle = styled.div`
  height: calc(100% - 35px);
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: row;
`

const IndexContainerStyle = styled.div`
  width: 300px;
  height: 100%;
  background-color: gray;
  overflow: auto;
`

const SettingsContainerStyle = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  padding-left: 16px;
  padding-right: 16px;
`

@observer
export default class ConfigEditor extends Component {
  // элементы отображения заголовков секций
  topicElements = []

  // элементы отображения форм
  settingsElements = []

  briefs = []

  state = { query: '', searchResultCount: null, elements: [] }

  index = []

  constructor(props) {
    super(props)

    const { config } = props

    const topics = {}

    // по всем корневым разделам (core, editor и т.д.)
    // TODO: возможно следует сократить количество обходов схемы!!!
    for (const key of Object.keys(config.schema.properties)) {
      topics[key] = {
        title: config.schema.properties[key].title,
        description: config.schema.properties[key].description,
        properties: []
      }

      this.index.push({ title: config.schema.properties[key].title, key })

      for (const subkey of Object.keys(config.schema.properties[key].properties)) {
        // схема элемента
        const schema = config.schema.properties[key].properties[subkey]
        const propertyKey = `${key}.${subkey}`
        // хранилище для свойста

        const title = uncamelcase(subkey.split('.').pop())
        this.index.push({ title, key: propertyKey })

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

    // TODO: возможно следует сократить количество обходов схемы!!!
    // заранее сохраняем элементы отображения заголовков секций
    this.topicElements = Object.entries(topics).map(([key, { title, description }]) => {
      return {
        key,
        Element: (
          <Element name={key}>
            <div key={key}>
              <SectionLabelStyle>{title}</SectionLabelStyle>
              {description && <SectionDescriptionStyle>{description}</SectionDescriptionStyle>}
            </div>
          </Element>
        )
      }
    })

    // TODO: возможно следует сократить количество обходов схемы!!!
    // заранее сохраняем эелементы форм одним массивом и данные для поиска
    Object.entries(topics).forEach(([key, { properties }]) => {
      properties.forEach(item => {
        const { key: propertyKey, schema, value, setValue } = item
        const label = uncamelcase(propertyKey.split('.').pop())
        const FormComponent = ScrollElement(componentMaker(schema)({ label, ...{ ...schema } }))

        this.briefs.push({ key: propertyKey, label, description: schema.description })

        this.settingsElements.push({
          key: propertyKey,
          Element: <FormComponent name={propertyKey} key={propertyKey} value={value} onChange={setValue} />
        })
      })
    })

    // this.elements = Object.entries(topics).map(([key, { title, description, properties }]) => {
    //   return (
    //     <div key={key}>
    //       <SectionLabelStyle>{title}</SectionLabelStyle>
    //       {description && <SectionDescriptionStyle>{description}</SectionDescriptionStyle>}
    //       {properties.map(item => {
    //         const { key: propertyKey, schema, value, setValue } = item
    //         const label = uncamelcase(propertyKey.split('.').pop())
    //         const FormComponent = componentMaker(schema)({ label, ...{ ...schema } })

    //         return <FormComponent key={propertyKey} value={value} onChange={setValue} />
    //       })}
    //     </div>
    //   )
    // })

    this.state.searchResultCount = this.briefs.length

    this.fuse = new Fuse(this.briefs, settingsSearchOptions)

    this.state.elements = this.makeDefaultContent()
  }

  makeDefaultContent = () => {
    let elements = []
    this.topicElements.forEach(({ key: topicKey, Element: TopicElement }) => {
      elements = [...elements, TopicElement]
      const settingsElements = this.settingsElements
        .filter(({ key }) => key.startsWith(`${topicKey}.`))
        .map(({ Element: SettingsElement }) => SettingsElement)
      elements = [...elements, ...settingsElements]
    })
    return elements
  }

  handleQueryChange = event => {
    this.setState({ query: event.target.value })

    if (event.target.value.length > 0) {
      const result = this.fuse.search(event.target.value)

      if (result.length === 0) {
        this.setState({ searchResultCount: 'No', elements: [] })
      } else {
        const elements = this.settingsElements
          .filter(({ key }) => !!result.find(({ key: resultKey }) => resultKey === key))
          .map(({ Element }) => Element)
        this.setState({ searchResultCount: result.length, elements })
      }
    } else {
      this.setState({ searchResultCount: this.briefs.length, elements: this.makeDefaultContent() })
    }
  }

  render() {
    const className = this.props.theme.type === 'dark' ? 'bp3-dark' : undefined

    return (
      <div className={className} style={{ height: '100%', width: '100%' }}>
        <SearchContainerStyle>
          <InputGroup
            leftIcon="search"
            onChange={this.handleQueryChange}
            placeholder="Search settings"
            rightElement={<SearchResultCount count={this.state.searchResultCount} />}
            small={true}
            fill={true}
            value={this.state.query}
          />
        </SearchContainerStyle>
        <ContentContainerStyle>
          <IndexContainerStyle>
            <ul style={{ margin: 8, paddingInlineStart: 0 }}>
              {this.index.map(item => {
                const { title, key } = item
                return (
                  <Link
                    activeClass="active"
                    to={key}
                    spy={true}
                    smooth={true}
                    offset={-100}
                    duration={500}
                    containerId="settingsContainer"
                    onSetActive={data => {
                      console.log(`set active ${data}`)
                    }}
                  >
                    <li
                      key={key}
                      onClick={() => {
                        console.log(key)
                      }}
                      style={{
                        fontSize: '13px',
                        listStyleType: 'none',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        userSelect: 'none'
                      }}
                    >
                      {title}
                    </li>
                  </Link>
                )
              })}
            </ul>
          </IndexContainerStyle>
          <SettingsContainerStyle id="settingsContainer">{this.state.elements}</SettingsContainerStyle>
        </ContentContainerStyle>
      </div>
    )
  }
}
