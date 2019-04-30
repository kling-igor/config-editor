import React, { PureComponent } from 'react'

import styled, { createGlobalStyle } from 'styled-components'

import './app.css'

import ConfigEditor from './config-edtor'

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
    background-color: white;
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
    font-size: 1.2em;
  }

  /*иначе погруженные в tooltip формы скукоживаются*/
  span.bp3-popover-target {
    display: block;
  }
`
// считанные данные из файла
const config = { core: { openEmptyEditorOnStart: false, warnOnLargeFileLimit: 20 } }

export default class App extends PureComponent {
  render() {
    return (
      <>
        <GlobalStyle />
        <ConfigEditor config={config} />
      </>
    )
  }
}
