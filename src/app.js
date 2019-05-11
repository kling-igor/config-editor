import React, { Component } from 'react'
import { observable, action } from 'mobx'
import { observer } from 'mobx-react'
import * as R from 'ramda'

import styled, { createGlobalStyle, ThemeProvider } from 'styled-components'

import './app.css'

import lightTheme from './themes/ui/light'
import darkTheme from './themes/ui/dark'

import ConfigEditor from './config-edtor'

import Config from './config-edtor/config'

const GlobalStyle = createGlobalStyle`
  html {
    
    height: 100%;
    margin: 0;
  }

  body {
    padding: 0;
    margin: 0;
    font-family: Roboto, sans-serif;
    overflow: hidden;
    background-color: ${({ theme: { type } }) => (type === 'dark' ? '#282c34' : '#ffffff')};
    height: 100%;
    margin: 0;
    overflow: hidden !important;
  }

  #app {
    min-height: 100%;
    position: fixed;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;

    padding: 8px;
  }

  .bp3-control.vision {
    margin-bottom: 4px;
  }

  label.bp3-control.bp3-checkbox.vision {
    color: ${({ theme: { type } }) => (type === 'dark' ? '#9da5b4' : '#474747')};
    font-size: 1.2em;
  }

  /*иначе погруженные в tooltip формы скукоживаются*/
  span.bp3-popover-target {
    display: block;
  }

  /* .active {
    color:#137CBD;
    opacity: 0.9;
    font-weight: bold;
    letter-spacing: -0.4px;
    
  } */

  ::-webkit-scrollbar {
    width: 10px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: darkgray;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: #888;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }


`
// считанные данные из файла
// const config = { core: { openEmptyEditorOnStart: false, warnOnLargeFileLimit: 20 } }

const configPath = './config.json'
const config = new Config({
  saveCallback: settings => {
    // this.applicationDelegate.setUserSettings(settings, configPath)
    console.log('SAVE:', settings)
  },
  mainSource: configPath
})

const ConfigSchema = {
  core: {
    type: 'object',
    title: 'Core Settings',
    description: `These are Vision's core settings which affect behavior unrelated to text editing. Individual packages may have their own additional settings found within their package card in the Packages list.`,
    properties: {
      theme: {
        type: 'string',
        enum: ['dark', 'light'],
        default: 'dark',
        description: 'UI theme'
      },
      rootFolderWhiteList: {
        type: 'array',
        default: ['controllers', 'views', 'models', 'styles', 'services', 'printforms', 'files', 'README.md'],
        items: {
          type: 'string'
        },
        description: 'The list of entries to be shown in file tree'
      },
      openEmptyEditorOnStart: {
        type: 'boolean',
        description:
          'When checked opens an untitled editor when loading a blank environment (such as with _File > New Window_ or when **Restore Previous Windows On Start** is unchecked); otherwise no editor is opened when loading a blank environment. This setting has no effect when restoring a previous state.',
        default: true
      },
      restorePreviousWindowsOnStart: {
        type: 'string',
        enum: ['no', 'yes', 'always'],
        default: 'yes',
        description:
          "When selected 'no', a blank environment is loaded. When selected 'yes' and Vision is started from the icon, restores the last state of Vision window; otherwise a blank environment is loaded. When selected 'always', restores the last state of Vision window always, no matter how Vision is started."
      },
      reopenProjectMenuCount: {
        type: 'integer',
        default: 15,
        description: 'How many recent projects to show in the _Reopen Project_ menu.'
      },
      automaticallyUpdate: {
        type: 'boolean',
        default: true,
        description: 'Automatically update Vision when a new release is available.'
      },
      warnOnLargeFileLimit: {
        type: 'number',
        default: 40,
        description: 'Warn before opening files larger than this number of megabytes.'
      }
    }
  },
  editor: {
    type: 'object',
    title: 'Editor Settings',
    description: 'These settings are related to text editing.',
    properties: {
      showLineNumbers: {
        type: 'boolean',
        default: true,
        description: "Show line numbers in the editor's gutter."
      }
    }
  }
}
const userSettings = { core: { openEmptyEditorOnStart: true, warnOnLargeFileLimit: 20 } }
config.setSchema(null, { type: 'object', properties: R.clone(ConfigSchema) })
config.resetSettings(userSettings)

class Store {
  themes = {
    dark: darkTheme,
    light: lightTheme
  }

  @observable theme = 'dark'

  @action.bound setTheme(theme) {
    this.theme = this.themes[theme]
  }

  constructor(config) {
    config.observe('core.theme', theme => {
      this.setTheme(theme)
    })
  }
}

const store = new Store(config)

@observer
export default class App extends Component {
  render() {
    return (
      <>
        <GlobalStyle theme={store.theme} />
        <ThemeProvider theme={store.theme}>
          <ConfigEditor config={config} />
        </ThemeProvider>
      </>
    )
  }
}
