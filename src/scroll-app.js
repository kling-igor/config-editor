import React, { Component } from 'react'
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components'
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
    background-color: #ffffff;
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
  }

  .active {
    color: white;
  }
`

const elements = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const colors = ['white', 'yellow', 'magenta', 'cyan', 'orange', 'red', 'green', 'blue', 'purple', 'grey']

const ElementComponent = styled.div`
  height: 300px;
  width: 100%;
  color: black;
  background-color: ${({ backgroundColor }) => backgroundColor};
`

const ScrollableElement = ScrollElement(ElementComponent)

export default class App extends Component {
  render() {
    return (
      <>
        <GlobalStyle />
        <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', flexDirection: 'row' }}>
          <div style={{ width: '300px', height: '100%', backgroundColor: 'yellow', overflow: 'auto' }}>
            <ul style={{ margin: 8, paddingInlineStart: 0 }}>
              {elements.map((item, index) => {
                const key = `item${item}`

                return (
                  <Link
                    activeClass="active"
                    to={key}
                    spy={true}
                    smooth={true}
                    offset={0}
                    duration={500}
                    containerId="scrollcontainer"
                    onSetActive={data => {
                      // console.log(`set active ${data}`)
                    }}
                    onSetInactive={data => {
                      // console.log(`set inactive ${data}`)
                    }}
                  >
                    <li
                      key={key}
                      onClick={() => {
                        // console.log('click on:', key)
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
                      {`item${item}`}
                    </li>
                  </Link>
                )
              })}
            </ul>
          </div>
          <div
            id="scrollcontainer"
            style={{ width: '100%', height: '100%', backgroundColor: 'green', overflow: 'auto' }}
          >
            {elements.map((item, index) => {
              const key = `item${item}`

              return (
                <ScrollableElement key={key} name={key} backgroundColor={colors[index]}>
                  {key}
                </ScrollableElement>
              )
            })}
            <ScrollableElement
              key="footer"
              name={'footer'}
              backgroundColor="transparent"
              style={{ height: 'calc(100% - 300px)' }}
            />
          </div>
        </div>
      </>
    )
  }
}
