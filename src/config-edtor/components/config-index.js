import React, { Component, useState } from 'react'
import styled, { withTheme } from 'styled-components'
import { ScrollLink } from 'react-scroll'

const IndexContainerStyle = styled.div`
  width: 150px;
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

const LinkComponent = ScrollLink(IndexElementTitleStyle)

const IndexElementComponent = ({ keyProp, title, matches = '', scrollContainerId }) => (
  <IndexElementStyle>
    <LinkComponent
      // activeClass="active"
      to={keyProp}
      spy={true}
      smooth={true}
      offset={-50}
      duration={500}
      containerId={scrollContainerId}
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

export default ({ items, scrollContainerId }) => (
  <IndexContainerStyle>
    <IndexListStyle>
      {items.map(item => {
        const { title, key, matches = '' } = item
        return (
          <IndexElementComponent
            key={key}
            keyProp={key}
            title={title}
            matches={matches}
            scrollContainerId={scrollContainerId}
          />
        )
      })}
    </IndexListStyle>
  </IndexContainerStyle>
)
