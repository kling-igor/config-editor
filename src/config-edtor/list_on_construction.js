import React, { Component, PureComponent } from 'react'
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

const listItemStyle = {
  padding: '0px',
  height: '24px',
  width: '400px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}
const buttonGroupStyle = { display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }

class ListItem extends PureComponent {
  state = { hovering: false }

  mouseEnter = event => {
    this.setState({ hovering: true })
  }

  mouseLeave = event => {
    this.setState({ hovering: false })
  }

  render() {
    const { url, onEditClick = () => {}, onDeleteClick = () => {}, onSelect, selected } = this.props

    const style = this.state.hovering ? Object.assign({}, listItemStyle, { backgroundColor: '#3a3d3e' }) : listItemStyle

    return (
      <div style={style} onMouseEnter={this.mouseEnter} onMouseLeave={this.mouseLeave} pointerEvents="none">
        <span
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            width: '350px',
            overflow: 'hidden'
          }}
        >
          <input type="radio" checked={selected} onChange={onSelect} />
          <span style={{ marginLeft: '8px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {url}
          </span>
        </span>
        {this.state.hovering && (
          <span style={buttonGroupStyle}>
            <Icon icon="edit" style={{ marginRight: '5px' }} onClick={onEditClick} iconSize={16} color="#c5c5c5" />
            <Icon icon="cross" style={{ marginRight: '5px' }} onClick={onDeleteClick} iconSize={10} color="#e8e8e8" />
          </span>
        )}
      </div>
    )
  }
}

export default class App extends Component {
  state = {
    selectedItem: 0,
    hosts: ['http://blackhole.dev.marm.com', 'http://lic.dev.marm.com', 'http://monitoring.dev.marm.com'],
    editingValue: '',
    previousValue: null, // add new value - no previous value available
    editingIndex: -1, // в случае отказа - если это последнее значение в списке и previousValue: null - обрезаем списокб иначе это было редактирование непоследнего значения - просто возвращаем старое
    uniqe: true // уникально ли вводимое значение
  }

  onOk = () => {
    const { hosts, editingIndex, editingValue } = this.state

    this.setState({
      hosts: [...hosts.slice(0, editingIndex), editingValue, ...hosts.slice(editingIndex + 1, hosts.length)],
      editingIndex: -1,
      previousValue: null
    })
  }

  onCancel = () => {
    const { hosts, editingIndex, editingValue, previousValue } = this.state

    // если последний элемент (и он не был изначально в списке)
    if (editingIndex === hosts.length - 1 && previousValue == null) {
      this.setState({
        hosts: hosts.slice(0, editingIndex),
        editingIndex: -1
      })
    } else {
      this.setState({
        hosts: [...hosts.slice(0, editingIndex), previousValue, ...hosts.slice(editingIndex + 1, hosts.length)],
        editingIndex: -1,
        previousValue: null
      })
    }
  }

  onAddPressed = () => {
    this.setState({
      hosts: [...this.state.hosts, ''],
      editingIndex: this.state.hosts.length,
      editingValue: '',
      previousValue: null,
      uniq: false
    })
  }

  onChange = ({ target }) => {
    const { value } = target

    const hosts = [
      ...this.state.hosts.slice(0, this.state.editingIndex),
      ...this.state.hosts.slice(this.state.editingIndex + 1, this.state.hosts.length)
    ]

    const uniq = !hosts.includes(value)

    this.setState({ editingValue: value, uniq })
  }

  onSelect = index => {
    this.setState({
      selectedItem: index
    })
  }

  deleteItem = index => {
    const hosts = [...this.state.hosts.slice(0, index), ...this.state.hosts.slice(index + 1, this.state.hosts.length)]

    let selectedItem = this.state.selectedItem

    if (this.state.selectedItem >= index) {
      selectedItem = this.state.selectedItem - 1
    }

    if (selectedItem < 0) {
      if (this.state.hosts.length > 0) {
        selectedItem = 0
      }
    }

    this.setState({
      selectedItem,
      hosts,
      editingValue: '',
      previousValue: null,
      editingIndex: -1
    })
  }

  editItem = index => {
    const { hosts, editingIndex, editingValue, previousValue } = this.state

    if (editingIndex === hosts.length - 1 && previousValue == null) {
      this.setState({
        hosts: hosts.slice(0, editingIndex),
        editingValue: this.state.hosts[index],
        previousValue: this.state.hosts[index],
        editingIndex: index
      })
    } else {
      let newHosts

      if (editingIndex !== -1) {
        newHosts = [...hosts.slice(0, editingIndex), previousValue, ...hosts.slice(editingIndex + 1, hosts.length)]
      } else {
        newHosts = hosts
      }

      this.setState({
        hosts: newHosts,
        editingValue: this.state.hosts[index],
        previousValue: this.state.hosts[index],
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
            disabled={this.state.editingValue === '' || !this.state.uniq}
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
    const { editingIndex, hosts, previousValue } = this.state

    if (editingIndex === -1 || editingIndex < hosts.length - 1 || previousValue != null) {
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
      <div
        className="bp3-dark styles-stack"
        style={{
          padding: 12,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'flex-start'
        }}
      >
        {this.state.hosts.map((url, i) => this.renderUrl(url, i))}
        {this.renderAddButton()}
      </div>
    )
  }
}
