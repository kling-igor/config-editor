import React, { Component, useState } from 'react'
import { InputGroup } from '@blueprintjs/core'
import styled, { withTheme } from 'styled-components'

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

export default ({ query, onQueryChange, searchResultCount }) => (
  <SearchContainerStyle>
    <InputGroup
      leftIcon="search"
      onChange={onQueryChange}
      placeholder="Search settings"
      rightElement={<SearchResultCount count={searchResultCount} />}
      small={true}
      fill={true}
      value={query}
    />
  </SearchContainerStyle>
)
