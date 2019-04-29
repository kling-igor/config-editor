import React from 'react'
import { Checkbox } from '@blueprintjs/core'
import { FormGroup, InputGroup, NumericInput } from '@blueprintjs/core'
import { Label, HTMLSelect } from '@blueprintjs/core'

export const CheckboxComponent = label => ({ value, onChange }) => (
  <Checkbox label={label} checked={value} onChange={onChange} />
)

export const TextInputComponent = (key, label, placeholder, required) => ({ value, onChange }) => (
  // <FormGroup label={label} labelFor={`${key}-text-input`} labelInfo={required && '(required)'}>
  <InputGroup id={`${key}-text-input`} fill={true} placeholder={placeholder} onChange={onChange} small value={value} />
  // </FormGroup>
)

export const NumberInputComponent = (key, label, placeholder, required) => ({ value, onChange }) => (
  // <FormGroup label={label} labelFor={`${key}-number-input`} labelInfo={required && '(required)'}>
  <NumericInput
    id={`${key}-number-input`}
    fill={true}
    placeholder={placeholder}
    onChange={onChange}
    small
    value={value}
  />
  // </FormGroup>
)

export const OptionsComponent = (label, options) => ({ value, onChange }) => (
  // <Label>
  // {label}
  <HTMLSelect options={options} onChange={onChange} value={value} />
  // </Label>
)
