import React from 'react'
import { Checkbox } from '@blueprintjs/core'
import { FormGroup, InputGroup, NumericInput } from '@blueprintjs/core'
import { Label, HTMLSelect } from '@blueprintjs/core'
import { Tooltip, Position, Intent } from '@blueprintjs/core'
import styled, { withTheme } from 'styled-components'

const LabelStyle = styled.p`
  margin-bottom: 2px;
  font-size: 1.2em;
`

const DescriptionStyle = styled.p`
  font-size: 0.9em;
  margin-bottom: 4px;
  opacity: 0.6;
`

const CheckboxDescriptionStyle = styled.p`
  font-size: 0.9em;
  margin-left: 26px;
  opacity: 0.6;
`

export const CheckboxComponent = (label, defaultValue, description) => ({ value, onChange }) => {
  const onchange = ({ target: { checked } }) => onChange(checked)

  const tooltip = <span>{`Default: ${defaultValue}`}</span>
  return (
    <>
      <Tooltip content={tooltip} intent={Intent.PRIMARY} position={Position.BOTTOM_LEFT}>
        <Checkbox className="vision" label={label} checked={value} onChange={onchange} />
      </Tooltip>
      <CheckboxDescriptionStyle>{description}</CheckboxDescriptionStyle>
    </>
  )
}

export const TextInputComponent = (label, defaultValue, description) => ({ value, onChange }) => {
  const onchange = ({ target: { value } }) => onChange(value)
  const placeholder = `Default: ${defaultValue}`
  const tooltip = <span>{placeholder}</span>
  const actualValue = value === defaultValue ? undefined : value
  return (
    <>
      <LabelStyle>{label}</LabelStyle>
      <DescriptionStyle>{description}</DescriptionStyle>
      <Tooltip content={tooltip} intent={Intent.PRIMARY} position={Position.TOP_LEFT}>
        <InputGroup fill={true} small placeholder={placeholder} onChange={onchange} value={actualValue} />
      </Tooltip>
    </>
  )
}

export const NumberInputComponent = (label, defaultValue, description) => ({ value, onChange }) => {
  const onchange = ({ target: { value } }) => onChange(value)
  const placeholder = `Default: ${defaultValue}`
  const tooltip = <span>{placeholder}</span>
  const actualValue = value === defaultValue ? undefined : value

  return (
    <>
      <LabelStyle>{label}</LabelStyle>
      <DescriptionStyle>{description}</DescriptionStyle>
      <Tooltip content={tooltip} intent={Intent.PRIMARY} usePortal={true} position={Position.TOP_LEFT}>
        <NumericInput fill={true} small placeholder={placeholder} onChange={onchange} value={actualValue} min={0} />
      </Tooltip>
    </>
  )
}

export const IntegerInputComponent = (label, defaultValue, description) => ({ value, onChange }) => {
  const onchange = ({ target: { value } }) => onChange(value)
  const placeholder = `Default: ${defaultValue}`
  const tooltip = <span>{placeholder}</span>
  const actualValue = value === defaultValue ? undefined : value
  return (
    <>
      <LabelStyle>{label}</LabelStyle>
      <DescriptionStyle>{description}</DescriptionStyle>
      <Tooltip intent={Intent.PRIMARY} content={tooltip} position={Position.TOP_LEFT}>
        <NumericInput
          fill={true}
          small
          placeholder={placeholder}
          onChange={onchange}
          value={actualValue}
          min={0}
          minorStepSize={null}
          majorStepSize={null}
        />
      </Tooltip>
    </>
  )
}

export const OptionsComponent = (label, options, defaultValue, description) => ({ value, onChange }) => {
  const onchange = ({ target: { value } }) => onChange(value)
  const tooltip = <span>{`Default: ${defaultValue}`}</span>
  return (
    <>
      <LabelStyle>{label}</LabelStyle>
      <DescriptionStyle>{description}</DescriptionStyle>
      <Tooltip content={tooltip} intent={Intent.PRIMARY} position={Position.TOP_LEFT}>
        <HTMLSelect options={options} fill onChange={onchange} value={value} />
      </Tooltip>
    </>
  )
}
