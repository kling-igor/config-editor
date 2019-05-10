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

import styled, { withTheme } from 'styled-components'

import Fuse from 'fuse.js'
import { uncamelcase } from './utils'

import { componentMaker } from './components/form-components'
import SearchInput from './components/search-input'
import ConfigIndex from './components/config-index'

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

const ContentContainerStyle = styled.div`
  height: calc(100% - 35px);
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: row;
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
  margin-bottom: 0px;
`

const SettingsContainerStyle = styled.div`
  padding-left: 16px;
  padding-right: 16px;
  overflow: auto;
  width: calc(100% - 150px);
  min-width: 300px;
  height: 100%;
`

const ConfigEditor = withTheme(
  observer(
    class extends Component {
      topicElements = []

      settingsElements = []

      subscriptions = []

      briefs = []

      state = { query: '', searchResultCount: null, elements: [], index: [] }

      constructor(props) {
        super(props)

        this.debouncedFilterSettings = debounce(this.filterSettings, 1000)

        const { config } = props

        for (const key of Object.keys(config.schema.properties)) {
          const { title: topicTitle, description: topicDescription } = config.schema.properties[key]

          this.topicElements.push({
            key,
            component: (
              <Element name={key} key={key}>
                <div>
                  <SectionLabelStyle>{topicTitle}</SectionLabelStyle>
                  {topicDescription && <SectionDescriptionStyle>{topicDescription}</SectionDescriptionStyle>}
                </div>
              </Element>
            )
          })

          for (const subkey of Object.keys(config.schema.properties[key].properties)) {
            const schema = config.schema.properties[key].properties[subkey]
            const propertyKey = `${key}.${subkey}`

            const store = new (class {
              @observable value = ''
              @action.bound updateValue(value) {
                this.value = value
              }
              setValue = value => {
                config.set(propertyKey, value)
              }
            })()

            this.subscriptions.push(config.observe(propertyKey, store.updateValue))

            const label = uncamelcase(subkey)

            this.briefs.push({ key: propertyKey, label, description: schema.description })

            const FormComponent = componentMaker(schema)({ label, ...{ ...schema } })

            this.settingsElements.push({
              key: propertyKey,
              component: (
                <Element name={propertyKey} key={propertyKey}>
                  <FormComponent store={store} />
                </Element>
              )
            })
          }
        }

        this.fuse = new Fuse(this.briefs, settingsSearchOptions)

        this.state.searchResultCount = this.briefs.length
        this.state.elements = this.makeDefaultContent()
        this.state.index = this.makeDefaultIndex()
      }

      dispose() {
        this.setState({})
        this.subscriptions.forEach(subscription => subscription.dispose())
        this.subscriptions = null
        this.briefs = null

        this.settingsElements = null
        this.topicElements = null

        this.fuse = null
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

        return elements
      }

      makeDefaultIndex = () => {
        const {
          config: { schema }
        } = this.props

        return Object.keys(schema.properties).map(key => ({
          title: schema.properties[key].title,
          key
        }))
      }

      handleQueryChange = event => {
        this.setState({ query: event.target.value })

        if (event.target.value.length > 0) {
          this.debouncedFilterSettings()
        } else {
          this.setState({
            searchResultCount: this.briefs.length,
            elements: this.makeDefaultContent(),
            index: this.makeDefaultIndex()
          })
        }
      }

      filterSettings = () => {
        if (this.state.query.length === 0) return

        const result = this.fuse.search(this.state.query)

        if (result.length === 0) {
          this.setState({ searchResultCount: 'No', elements: [] })
        } else {
          const elements = []

          const categories = {}

          for (const item of result) {
            const { key: resultKey } = item
            const settingsElement = this.settingsElements.find(({ key }) => key === resultKey)
            if (settingsElement) {
              elements.push(settingsElement.component)

              const category = resultKey.slice(0, resultKey.indexOf('.'))
              if (categories.hasOwnProperty(category)) {
                categories[category] += 1
              } else {
                categories[category] = 1
              }
            }
          }

          const {
            config: { schema }
          } = this.props

          const index = Object.keys(schema.properties).reduce((acc, key) => {
            const matches = categories[key]
            if (matches) {
              return [
                ...acc,
                {
                  title: schema.properties[key].title,
                  key,
                  matches
                }
              ]
            }

            return acc
          }, [])

          this.setState({ searchResultCount: result.length, elements, index })
        }
      }

      render() {
        const className = this.props.theme.type === 'dark' ? 'bp3-dark' : undefined

        return (
          <RootStyle className={className}>
            <SearchInput
              query={this.state.query}
              onQueryChange={this.handleQueryChange}
              searchResultCount={this.state.searchResultCount}
            />
            <ContentContainerStyle>
              <ConfigIndex items={this.state.index} scrollContainerId="settingsContainer" />
              <SettingsContainerStyle id="settingsContainer">{this.state.elements}</SettingsContainerStyle>
            </ContentContainerStyle>
          </RootStyle>
        )
      }
    }
  )
)

export default ConfigEditor
