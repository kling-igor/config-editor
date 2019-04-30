import React from 'react'
import { Checkbox } from '@blueprintjs/core'
import { FormGroup, InputGroup, NumericInput } from '@blueprintjs/core'
import { Label, HTMLSelect } from '@blueprintjs/core'
import styled, { withTheme } from 'styled-components'

const LabelStyle = styled.p`
  margin-bottom: 2px;
  font-weight: 700;
`

const DescriptionStyle = styled.p`
  font-size: 0.9em;
  margin-bottom: 4px;
`

const CheckboxDescriptionStyle = styled.p`
  font-size: 0.9em;
  margin-left: 26px;
`

export const CheckboxComponent = (label, description) => ({ value, onChange }) => (
  <>
    <Checkbox className="vision" label={label} checked={value} onChange={onChange} />
    <CheckboxDescriptionStyle>{description}</CheckboxDescriptionStyle>
  </>
)

export const TextInputComponent = (label, placeholder, description) => ({ value, onChange }) => (
  <>
    <LabelStyle>{label}</LabelStyle>
    <DescriptionStyle>{description}</DescriptionStyle>
    <InputGroup fill={true} small placeholder={placeholder} onChange={onChange} value={value} />
  </>
)

export const NumberInputComponent = (label, placeholder, description) => ({ value, onChange }) => (
  <>
    <LabelStyle>{label}</LabelStyle>
    <DescriptionStyle>{description}</DescriptionStyle>
    <NumericInput fill={true} small placeholder={placeholder} onChange={onChange} value={value} min={0} />
  </>
)

export const IntegerInputComponent = (label, placeholder, description) => ({ value, onChange }) => (
  <>
    <LabelStyle>{label}</LabelStyle>
    <DescriptionStyle>{description}</DescriptionStyle>
    <NumericInput
      fill={true}
      small
      placeholder={placeholder}
      onChange={onChange}
      value={value}
      min={0}
      minorStepSize={null}
      majorStepSize={null}
    />
  </>
)

export const OptionsComponent = (label, options, description) => ({ value, onChange }) => (
  // <Label>
  // {label}
  <HTMLSelect options={options} onChange={onChange} value={value} />
  // </Label>
)
