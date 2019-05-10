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

import debounce from 'lodash.debounce'

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

const RootStyle = styled.div`
  max-width: 800px;
  width: 800px;
  height: 100%;
  display: block;
  margin-left: auto;
  margin-right: auto;
`

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

const SectionDescriptionStyle = styled.div`
  color: ${({ theme: { type } }) => (type === 'dark' ? '#9da5b4' : '#474747')};
  font-size: 12px;
  /* margin-bottom: 0px; */ /*UNCOMMENT THIS*/
  margin-bottom: 200px; /*REMOVE THIS!!!*/
`

const DescriptionStyle = styled.div`
  font-size: 12px;
  color: ${({ theme: { type } }) => (type === 'dark' ? 'rgba(157, 165, 180, 0.6)' : '#949494')};
  /* margin-bottom: 0px; */ /*UNCOMMENT THIS*/
  margin-bottom: 200px; /*REMOVE THIS!!!*/
`

const CheckboxDescriptionStyle = styled(DescriptionStyle)`
  margin-left: 26px;
  /* margin-bottom: 0px; */ /*UNCOMMENT THIS*/
  margin-bottom: 200px; /*REMOVE THIS!!!*/
`

const ComponentContainer = styled.div`
  margin-top: 8px;
  margin-bottom: 8px;
`

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

const SearchContainerStyle = styled.div`
  overflow: hidden;

  position: relative;
  padding: 2px;
  top: 0px;
  left: 0px;
  height: 35px;
  min-height: 35px;
  max-width: 800px;
  width: 800px;
`

const ContentContainerStyle = styled.div`
  height: calc(100% - 35px);
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: row;
`

const IndexContainerStyle = styled.div`
  width: 250px;
  height: 100%;
  overflow: auto;
`

const IndexListStyle = styled.ul`
  margin: 8;
  padding-inline-start: 0;
`

const IndexElementStyle = styled.li`
  font-size: 13px;
  list-style-type: none;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  user-select: none;
  color: black;
`

const IndexElementTitleStyle = styled.span`
  opacity: 0.6;
  :hover {
    opacity: 1;
  }
`

const IndexElementMatchesCountStyle = styled.span`
  opacity: 0.8;
`

const SettingsContainerStyle = styled.div`
  padding-left: 16px;
  padding-right: 16px;
  overflow: auto;
  width: calc(100% - 250px);
  min-width: 300px;
  height: 100%;
`

const DumbStyle = styled.div`
  height: 100%;
  display: block;
  ::after {
    content: '.';
    visibility: hidden;
  }
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

const SearchResultCount = withTheme(({ count }) => {
  if (count == null) return null

  return <SearchResultBadgeStyle>{`${count} Settings Found`}</SearchResultBadgeStyle>
})

const LinkComponent = ScrollLink(IndexElementTitleStyle)

const IndexElementComponent = ({ keyProp, title, matches = '' }) => (
  <IndexElementStyle>
    <LinkComponent
      activeClass="active"
      to={keyProp}
      spy={true}
      smooth={true}
      offset={-50}
      duration={500}
      containerId="settingsContainer"
      onSetActive={data => {
        // console.log(`set active ${data}`)
      }}
      onSetInactive={data => {
        // console.log(`set inactive ${data}`)
      }}
      onClick={() => {
        // console.log('click on:', key)
      }}
    >
      {title}
    </LinkComponent>
    {!!matches && <IndexElementMatchesCountStyle>&nbsp;({matches})</IndexElementMatchesCountStyle>}
  </IndexElementStyle>
)

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

    this.debouncedFilterSettings = debounce(this.filterSettings, 1000)

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
        component: (
          <Element name={key} key={key}>
            <div>
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

        this.briefs.push({ key: propertyKey, label, description: schema.description })

        const FormComponent = componentMaker(schema)({ label, ...{ ...schema } })

        this.settingsElements.push({
          key: propertyKey,
          component: (
            <Element name={propertyKey} key={propertyKey}>
              <FormComponent value={value} onChange={setValue} />
            </Element>
          )
        })
      })
    })

    this.state.searchResultCount = this.briefs.length

    this.fuse = new Fuse(this.briefs, settingsSearchOptions)

    this.state.elements = this.makeDefaultContent()
  }

  makeDefaultContent = () => {
    let elements = []
    this.topicElements.forEach(({ key: topicKey, component: TopicComponent }) => {
      elements = [...elements, TopicComponent]
      const settingsElements = this.settingsElements
        .filter(({ key }) => key.startsWith(`${topicKey}.`))
        .map(({ component: SettingsComponent }) => SettingsComponent)
      elements = [...elements, ...settingsElements]
    })

    // elements.push(
    //   <Element name="__dumb__" key="__dumb__">
    //     <DumbStyle />
    //   </Element>
    // )

    return elements
  }

  handleQueryChange = event => {
    this.setState({ query: event.target.value })

    if (event.target.value.length > 0) {
      this.debouncedFilterSettings()
    } else {
      this.setState({ searchResultCount: this.briefs.length, elements: this.makeDefaultContent() })
    }
  }

  filterSettings = () => {
    if (this.state.query.length === 0) return

    const result = this.fuse.search(this.state.query)

    if (result.length === 0) {
      this.setState({ searchResultCount: 'No', elements: [] })
    } else {
      const elements = this.settingsElements
        .filter(({ key }) => !!result.find(({ key: resultKey }) => resultKey === key))
        .map(({ component }) => component)
      // elements.push(
      //   <Element name="__dumb__" key="__dumb__">
      //     <DumbStyle />
      //   </Element>
      // )

      this.setState({ searchResultCount: result.length, elements })
    }
  }

  render() {
    const className = this.props.theme.type === 'dark' ? 'bp3-dark' : undefined

    return (
      <RootStyle className={className}>
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
        <ContentContainerStyle id="ContentContainerStyle">
          <IndexContainerStyle>
            <IndexListStyle>
              {this.index.map(item => {
                const { title, key } = item
                return <IndexElementComponent key={key} keyProp={key} title={title} matches={11} />
              })}
            </IndexListStyle>
          </IndexContainerStyle>
          <SettingsContainerStyle id="settingsContainer">{this.state.elements}</SettingsContainerStyle>
        </ContentContainerStyle>
      </RootStyle>
    )
  }
}
