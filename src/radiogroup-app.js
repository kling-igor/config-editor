import './app.css'
import React, { Component, PureComponent, useState } from 'react'
import {
  Button,
  ButtonGroup,
  Intent,
  Checkbox,
  FormGroup,
  InputGroup,
  Label,
  HTMLSelect,
  Position,
  Tooltip,
  PanelStack,
  Divider,
  Icon
} from '@blueprintjs/core'

import theme from './themes/ui/light'

import styled, { createGlobalStyle, ThemeProvider } from 'styled-components'

import EditableRadioGroup from './config-edtor/components/editable-radiogroup'

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
    color: #9da5b4;
    font-size: 1.2em;
  }

  /*иначе погруженные в tooltip формы скукоживаются*/
  span.bp3-popover-target {
    display: block;
  }
`

/**************************** EDITABLE GROUP *****************************/

const noop = () => {}

export default class App extends Component {
  render() {
    return (
      <ThemeProvider theme={theme}>
        <>
          <GlobalStyle theme={theme} />
          <EditableRadioGroup
            theme={theme}
            array={['http://blackhole.dev.marm.com', 'http://lic.dev.marm.com', 'http://monitoring.dev.marm.com']}
            addButtonLabel="Add URL"
            inputPlaceholder="URL..."
          />
        </>
      </ThemeProvider>
    )
  }
}
