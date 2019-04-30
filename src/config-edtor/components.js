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
  const tooltip = <span>{`Default: ${defaultValue}`}</span>
  return (
    <>
      <Tooltip content={tooltip} intent={Intent.PRIMARY} position={Position.RIGHT}>
        <Checkbox className="vision" label={label} checked={value} onChange={onChange} />
      </Tooltip>
      <CheckboxDescriptionStyle>{description}</CheckboxDescriptionStyle>
    </>
  )
}

export const TextInputComponent = (label, defaultValue, description) => ({ value, onChange }) => {
  const placeholder = `Default: ${defaultValue}`
  const tooltip = <span>{placeholder}</span>
  return (
    <>
      <LabelStyle>{label}</LabelStyle>
      <DescriptionStyle>{description}</DescriptionStyle>
      <Tooltip content={tooltip} intent={Intent.PRIMARY}>
        <InputGroup fill={true} small placeholder={placeholder} onChange={onChange} value={value} />
      </Tooltip>
    </>
  )
}

export const NumberInputComponent = (label, defaultValue, description) => ({ value, onChange }) => {
  const placeholder = `Default: ${defaultValue}`
  const tooltip = <span>{placeholder}</span>
  return (
    <>
      <LabelStyle>{label}</LabelStyle>
      <DescriptionStyle>{description}</DescriptionStyle>
      <Tooltip content={tooltip} intent={Intent.PRIMARY} usePortal={true}>
        <NumericInput fill={true} small placeholder={placeholder} onChange={onChange} value={value} min={0} />
      </Tooltip>
    </>
  )
}

export const IntegerInputComponent = (label, defaultValue, description) => ({ value, onChange }) => {
  const placeholder = `Default: ${defaultValue}`
  const tooltip = <span>{placeholder}</span>
  return (
    <>
      <LabelStyle>{label}</LabelStyle>
      <DescriptionStyle>{description}</DescriptionStyle>
      <Tooltip intent={Intent.PRIMARY} content={tooltip}>
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
      </Tooltip>
    </>
  )
}

export const OptionsComponent = (label, options, defaultValue, description) => ({ value, onChange }) => {
  const tooltip = <span>{`Default: ${defaultValue}`}</span>
  return (
    <>
      <LabelStyle>{label}</LabelStyle>
      <DescriptionStyle>{description}</DescriptionStyle>
      <Tooltip content={tooltip} intent={Intent.PRIMARY}>
        <HTMLSelect options={options} fill onChange={onChange} value={value} />
      </Tooltip>
    </>
  )
}
