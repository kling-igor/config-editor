import '../app.css'
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

import styled, { createGlobalStyle } from 'styled-components'

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
    background-color: #282c34;
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

const ComponentStyle = styled.div`
  padding: 12;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
`

const ListItemStyle = styled.div`
  padding: 0px;
  height: 24px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ hovering }) => (hovering ? '#3a3d3e' : 'transparent')};
`

const ButtonGroupStyle = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`

const LabelContainerStyle = styled.span`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  /* width: '350px', */
  width: calc(100% - 32px);
  overflow: hidden;
`

const LabelStyle = styled.span`
  margin-left: 8px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`

const ListItemIconEditButtonStyle = styled.img`
  margin-right: 5px;
  user-select: none;
`

const ListItem = props => {
  const [hovering, setHovering] = useState(false)

  const handleMouseEnter = () => {
    setHovering(true)
  }

  const handleMouseLeave = () => {
    setHovering(false)
  }

  const { url, onEditClick = () => {}, onDeleteClick = () => {}, onSelect, selected } = props

  {
    /* <ListItemStyle pointerEvents="none" hovering={hovering}> */
  }

  return (
    <ListItemStyle onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} hovering={hovering}>
      <LabelContainerStyle>
        <input type="radio" checked={selected} onChange={onSelect} />
        <LabelStyle>{url}</LabelStyle>
      </LabelContainerStyle>
      {hovering && (
        <ButtonGroupStyle>
          <ListItemIconEditButtonStyle src="assets/ui/edit-dark.svg" width={16} height={16} onClick={onEditClick} />
          <ListItemIconEditButtonStyle src="assets/ui/close-dark.svg" width={16} height={16} onClick={onDeleteClick} />
        </ButtonGroupStyle>
      )}
    </ListItemStyle>
  )
}

export default class App extends Component {
  state = {
    selectedItem: 0,
    array: ['http://blackhole.dev.marm.com', 'http://lic.dev.marm.com', 'http://monitoring.dev.marm.com'],
    editingValue: '',
    previousValue: null, // add new value - no previous value available
    editingIndex: -1, // в случае отказа - если это последнее значение в списке и previousValue: null - обрезаем списокб иначе это было редактирование непоследнего значения - просто возвращаем старое
    uniqe: true // уникально ли вводимое значение
  }

  onOk = () => {
    const { array, editingIndex, editingValue } = this.state

    this.setState({
      array: [...array.slice(0, editingIndex), editingValue, ...array.slice(editingIndex + 1, array.length)],
      editingIndex: -1,
      previousValue: null
    })
  }

  onCancel = () => {
    const { array, editingIndex, editingValue, previousValue } = this.state

    // если последний элемент (и он не был изначально в списке)
    if (editingIndex === array.length - 1 && previousValue == null) {
      this.setState({
        array: array.slice(0, editingIndex),
        editingIndex: -1
      })
    } else {
      this.setState({
        array: [...array.slice(0, editingIndex), previousValue, ...array.slice(editingIndex + 1, array.length)],
        editingIndex: -1,
        previousValue: null
      })
    }
  }

  onAddPressed = () => {
    this.setState({
      array: [...this.state.array, ''],
      editingIndex: this.state.array.length,
      editingValue: '',
      previousValue: null,
      uniqe: false
    })
  }

  onChange = ({ target }) => {
    const { value } = target

    const array = [
      ...this.state.array.slice(0, this.state.editingIndex),
      ...this.state.array.slice(this.state.editingIndex + 1, this.state.array.length)
    ]

    const uniqe = !array.includes(value)

    this.setState({ editingValue: value, uniqe })
  }

  onSelect = index => {
    this.setState({
      selectedItem: index
    })
  }

  deleteItem = index => {
    const array = [...this.state.array.slice(0, index), ...this.state.array.slice(index + 1, this.state.array.length)]

    let selectedItem = this.state.selectedItem

    if (this.state.selectedItem >= index) {
      selectedItem = this.state.selectedItem - 1
    }

    if (selectedItem < 0) {
      if (this.state.array.length > 0) {
        selectedItem = 0
      }
    }

    this.setState({
      selectedItem,
      array,
      editingValue: '',
      previousValue: null,
      editingIndex: -1
    })
  }

  editItem = index => {
    const { array, editingIndex, editingValue, previousValue } = this.state

    if (editingIndex === array.length - 1 && previousValue == null) {
      this.setState({
        array: array.slice(0, editingIndex),
        editingValue: this.state.array[index],
        previousValue: this.state.array[index],
        editingIndex: index
      })
    } else {
      let newHosts

      if (editingIndex !== -1) {
        newHosts = [...array.slice(0, editingIndex), previousValue, ...array.slice(editingIndex + 1, array.length)]
      } else {
        newHosts = array
      }

      this.setState({
        array: newHosts,
        editingValue: this.state.array[index],
        previousValue: this.state.array[index],
        editingIndex: index
      })
    }
  }

  renderUrl = (url, index) => {
    if (this.state.editingIndex === index) {
      return (
        <div
          key={url || '__edit__'}
          style={{
            height: '24px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            width: '400px'
          }}
        >
          <input
            className="bp3-input bp3-fill bp3-small bp3-intent-primary"
            type="text"
            placeholder="url"
            dir="auto"
            style={{ borderRadius: '0px', fontSize: '14px' }}
            value={this.state.editingValue}
            onChange={this.onChange}
          />
          <button
            type="button"
            className="bp3-button bp3-intent-primary bp3-small"
            style={{ marginLeft: '2px', width: '80px', borderRadius: '0px' }}
            disabled={this.state.editingValue === '' || !this.state.uniqe}
            onClick={this.onOk}
          >
            Ok
          </button>
          <button
            type="button"
            className="bp3-button bp3-intent-primary bp3-small"
            style={{ marginLeft: '2px', width: '80px', borderRadius: '0px' }}
            onClick={this.onCancel}
          >
            Cancel
          </button>
        </div>
      )
    }

    const editItem = () => {
      this.editItem(index)
    }

    const deleteItem = () => {
      this.deleteItem(index)
    }

    const onSelect = () => {
      this.onSelect(index)
    }

    return (
      <ListItem
        key={url}
        url={url}
        onEditClick={editItem}
        onDeleteClick={deleteItem}
        onSelect={onSelect}
        selected={this.state.selectedItem === index}
      />
    )
  }

  renderAddButton = () => {
    const { editingIndex, array, previousValue } = this.state

    if (editingIndex === -1 || editingIndex < array.length - 1 || previousValue != null) {
      return (
        <button
          type="button"
          className="bp3-button bp3-intent-primary bp3-small"
          style={{ marginTop: '2px', width: '80px', borderRadius: '0px' }}
          onClick={this.onAddPressed}
        >
          Add URL
        </button>
      )
    }

    return null
  }

  render() {
    return (
      <>
        <GlobalStyle />
        <ComponentStyle className="bp3-dark styles-stack">
          {this.state.array.map((url, index) => this.renderUrl(url, index))}
          {this.renderAddButton()}
        </ComponentStyle>
      </>
    )
  }
}
