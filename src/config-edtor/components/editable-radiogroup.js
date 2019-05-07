import React, { Component, useState } from 'react'
import styled, { withTheme } from 'styled-components'
import { FormGroup, InputGroup, NumericInput, Keys } from '@blueprintjs/core'

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
  background-color: ${({ theme: { type }, hovering }) => {
    if (hovering) {
      if (type === 'dark') return '#3a3d3e'

      return '#e5e5e5'
    }
  }};
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
  width: calc(100% - 42px);
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

const AddItemButtonStyle = styled.button`
  margin-top: 2px;
  width: 80px;
  border-radius: 0px;
`

const ListItem = withTheme(props => {
  const [hovering, setHovering] = useState(false)

  const handleMouseEnter = () => {
    setHovering(true)
  }

  const handleMouseLeave = () => {
    setHovering(false)
  }

  const { value, onEditClick = () => {}, onDeleteClick = () => {}, onSelect, selected, theme } = props

  const suffix = theme.type === 'dark' ? '-dark' : ''

  return (
    <ListItemStyle
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      hovering={hovering}
    >
      <LabelContainerStyle>
        <input type="radio" checked={selected} onChange={onSelect} />
        <LabelStyle>{value}</LabelStyle>
      </LabelContainerStyle>
      {hovering && (
        <ButtonGroupStyle>
          <ListItemIconEditButtonStyle
            src={`assets/ui/edit${suffix}.svg`}
            width={16}
            height={16}
            onClick={onEditClick}
          />
          <ListItemIconEditButtonStyle
            src={`assets/ui/close${suffix}.svg`}
            width={16}
            height={16}
            onClick={onDeleteClick}
          />
        </ButtonGroupStyle>
      )}
    </ListItemStyle>
  )
})

const NewItemContainerStyle = styled.div`
  height: 24px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  width: 100%;
`

const NewItemInputStyle = styled.input`
  border-radius: 0px;
  font-size: 14px;
`

const NewItemButtonStyle = styled.button`
  margin-left: 2px;
  width: 80px;
  border-radius: 0px;
`

const ItemInputForm = withTheme(({ onOk, onCancel, onChange, value, unique, placeholder }) => {
  const okDisabled = value === '' || !unique

  const handleKeyDown = e => {
    if (e.keyCode === Keys.ENTER && !okDisabled) {
      onOk()
    }
  }

  const intent = unique ? 'bp3-intent-primary' : 'bp3-intent-warning'

  return (
    <NewItemContainerStyle>
      <NewItemInputStyle
        className={`bp3-input bp3-fill bp3-small ${intent}`}
        type="text"
        placeholder={placeholder}
        dir="auto"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
      />
      <NewItemButtonStyle
        type="button"
        className="bp3-button bp3-intent-primary bp3-small"
        disabled={okDisabled}
        onClick={onOk}
      >
        Ok
      </NewItemButtonStyle>
      <NewItemButtonStyle type="button" className="bp3-button bp3-intent-primary bp3-small" onClick={onCancel}>
        Cancel
      </NewItemButtonStyle>
    </NewItemContainerStyle>
  )
})

export default class EditableRadioGroup extends Component {
  state = {
    selectedItem: 0,
    array: [],
    editingValue: '',
    previousValue: null, // add new value - no previous value available
    editingIndex: -1, // в случае отказа - если это последнее значение в списке и previousValue: null - обрезаем списокб иначе это было редактирование непоследнего значения - просто возвращаем старое
    unique: true // уникально ли вводимое значение
  }

  constructor(props) {
    super(props)
    this.state.array = props.array || []
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

    const unique = !array.includes(value)

    this.setState({ editingValue: value, unique })
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
      let newArray

      if (editingIndex !== -1) {
        newArray = [...array.slice(0, editingIndex), previousValue, ...array.slice(editingIndex + 1, array.length)]
      } else {
        newArray = array
      }

      this.setState({
        array: newArray,
        editingValue: this.state.array[index],
        previousValue: this.state.array[index],
        editingIndex: index
      })
    }
  }

  renderItem = (value, index) => {
    if (this.state.editingIndex === index) {
      return (
        <ItemInputForm
          key="__edit__"
          placeholder={this.props.inputPlaceholder || 'Item...'}
          onOk={this.onOk}
          onCancel={this.onCancel}
          onChange={this.onChange}
          value={this.state.editingValue}
          unique={this.state.unique}
        />
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
        key={value}
        value={value}
        onEditClick={editItem}
        onDeleteClick={deleteItem}
        onSelect={onSelect}
        selected={this.state.selectedItem === index}
      />
    )
  }

  renderAddButton = () => {
    const { editingIndex, array, previousValue } = this.state
    const { addButtonLabel = 'Add Item' } = this.props

    if (editingIndex === -1 || editingIndex < array.length - 1 || previousValue != null) {
      return (
        <AddItemButtonStyle
          type="button"
          className="bp3-button bp3-intent-primary bp3-small"
          onClick={this.onAddPressed}
        >
          {addButtonLabel}
        </AddItemButtonStyle>
      )
    }

    return null
  }

  render() {
    const {
      theme: { type }
    } = this.props

    const className = type === 'dark' ? 'bp3-dark' : undefined

    return (
      <ComponentStyle className={className}>
        {this.state.array.map((value, index) => this.renderItem(value, index))}
        {this.renderAddButton()}
      </ComponentStyle>
    )
  }
}
