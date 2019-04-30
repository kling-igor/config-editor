import React from 'react'
import { Checkbox } from '@blueprintjs/core'
import { FormGroup, InputGroup, NumericInput } from '@blueprintjs/core'
import { Label, HTMLSelect } from '@blueprintjs/core'

export const CheckboxComponent = (label, description) => ({ value, onChange }) => (
  <>
    <Checkbox className="vision" label={label} checked={value} onChange={onChange} />
    <p style={{ fontSize: '0.9em', marginLeft: '26px' }}>{description}</p>
  </>
)

export const TextInputComponent = (label, placeholder, description) => ({ value, onChange }) => (
  <>
    <p style={{ marginBottom: '2px' }}>{label}</p>
    <p style={{ fontSize: '0.9em', marginBottom: '4px' }}>{description}</p>
    <InputGroup fill={true} small placeholder={placeholder} onChange={onChange} value={value} />
  </>
)

export const NumberInputComponent = (label, placeholder, description) => ({ value, onChange }) => (
  <>
    <p style={{ marginBottom: '2px' }}>{label}</p>
    <p style={{ fontSize: '0.9em', marginBottom: '4px' }}>{description}</p>
    <NumericInput fill={true} small placeholder={placeholder} onChange={onChange} value={value} />
  </>
)

export const OptionsComponent = (label, options, description) => ({ value, onChange }) => (
  // <Label>
  // {label}
  <HTMLSelect options={options} onChange={onChange} value={value} />
  // </Label>
)
