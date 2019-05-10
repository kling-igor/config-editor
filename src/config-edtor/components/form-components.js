import React, { Component, useState } from 'react'
import styled, { withTheme } from 'styled-components'
import { observer } from 'mobx-react'

import { Checkbox } from '@blueprintjs/core'
import { FormGroup, InputGroup, NumericInput, Keys } from '@blueprintjs/core'
import { Label, HTMLSelect } from '@blueprintjs/core'
import { Tooltip, Position, Intent } from '@blueprintjs/core'
import ReactMarkdown from 'react-markdown'

import { isPlainObject } from '../utils'

const ComponentContainer = styled.div`
  margin-top: 8px;
  margin-bottom: 8px;
`

const DescriptionStyle = styled.div`
  font-size: 12px;
  color: ${({ theme: { type } }) => (type === 'dark' ? 'rgba(157, 165, 180, 0.6)' : '#949494')};
  margin-bottom: 0px;
`
const CheckboxDescriptionStyle = styled(DescriptionStyle)`
  margin-left: 26px;
  margin-bottom: 0px;
`

const LabelStyle = styled.p`
  margin-bottom: 2px;
  color: ${({ theme: { type } }) => (type === 'dark' ? '#9da5b4' : '#717171')};
  font-weight: normal;
  font-size: 1.2em;
`

const Description = Style => ({ children }) => {
  return (
    <Style>
      <ReactMarkdown
        source={children}
        allowedTypes={['text', 'paragraph', 'emphasis', 'strong', 'delete', 'link', 'heading', 'inlineCode', 'code']}
      />
    </Style>
  )
}

const RegularDescription = Description(DescriptionStyle)
const CheckboxDescription = Description(CheckboxDescriptionStyle)

const makeCheckboxComponent = ({ label, default: defaultValue, description }) =>
  observer(({ store: { value, setValue } }) => {
    const onChange = ({ target: { checked } }) => {
      setValue(checked)
    }

    const tooltip = <span>{`Default: ${defaultValue}`}</span>

    return (
      <ComponentContainer>
        <Tooltip content={tooltip} intent={Intent.PRIMARY} position={Position.BOTTOM_LEFT}>
          <Checkbox className="vision" label={label} checked={value} onChange={onChange} />
        </Tooltip>
        <CheckboxDescription>{description}</CheckboxDescription>
      </ComponentContainer>
    )
  })

const makeNumberInputComponent = ({ label, default: defaultValue, description, minimum, maximum }) =>
  observer(({ store: { value, setValue } }) => {
    const placeholder = `Default: ${defaultValue}`
    const tooltip = <span>{placeholder}</span>
    const actualValue = value === defaultValue ? undefined : value

    const onValueChange = (value, asString) => {
      if (!Number.isNaN(value)) {
        setValue(value)
      }
    }

    const handleKeyDown = e => {
      if (e.keyCode === Keys.ENTER) {
        let value

        try {
          value = parseFloat(e.target.value)
        } catch (e) {}

        setValue(value)
      }
    }

    const handleBlur = e => {
      let value

      try {
        value = parseFloat(e.target.value)
      } catch (e) {}

      setValue(value)
    }

    return (
      <ComponentContainer>
        <LabelStyle>{label}</LabelStyle>
        <RegularDescription>{description}</RegularDescription>
        <Tooltip content={tooltip} intent={Intent.PRIMARY} usePortal={true} position={Position.TOP_LEFT}>
          <NumericInput
            fill={true}
            small
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            onValueChange={onValueChange}
            onBlur={handleBlur}
            value={actualValue}
            min={minimum}
            max={maximum}
          />
        </Tooltip>
      </ComponentContainer>
    )
  })

const makeIntegerInputComponent = ({ label, default: defaultValue, description, minimum, maximum }) =>
  observer(({ store: { value, setValue } }) => {
    const placeholder = `Default: ${defaultValue}`
    const tooltip = <span>{placeholder}</span>
    const actualValue = value === defaultValue ? undefined : value

    const onValueChange = (value, asString) => {
      if (!Number.isNaN(value)) {
        setValue(value)
      }
    }

    const handleKeyDown = e => {
      if (e.keyCode === Keys.ENTER) {
        let value

        try {
          value = parseInt(e.target.value)
        } catch (e) {}

        setValue(value)
      }
    }

    const handleBlur = e => {
      let value

      try {
        value = parseInt(e.target.value)
      } catch (e) {}

      setValue(value)
    }

    return (
      <ComponentContainer>
        <LabelStyle>{label}</LabelStyle>
        <RegularDescription>{description}</RegularDescription>
        <Tooltip intent={Intent.PRIMARY} content={tooltip} position={Position.TOP_LEFT}>
          <NumericInput
            fill={true}
            small
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            onValueChange={onValueChange}
            onBlur={handleBlur}
            value={actualValue}
            min={minimum}
            max={maximum}
            minorStepSize={null}
            majorStepSize={null}
          />
        </Tooltip>
      </ComponentContainer>
    )
  })

const makeOptionsComponent = ({ label, enum: enumValues, default: defaultValue, description }) =>
  observer(({ store: { value, setValue } }) => {
    const onChange = ({ target: { value } }) => setValue(value)
    const tooltip = <span>{`Default: ${defaultValue}`}</span>

    const options = enumValues.map(item => {
      if (isPlainObject(item)) {
        const { value } = item
        return value
      }
      return item
    })

    return (
      <ComponentContainer>
        <LabelStyle>{label}</LabelStyle>
        <RegularDescription>{description}</RegularDescription>
        <Tooltip content={tooltip} intent={Intent.PRIMARY} position={Position.TOP_LEFT}>
          <HTMLSelect options={options} fill onChange={onChange} value={value} />
        </Tooltip>
      </ComponentContainer>
    )
  })

const makeDefaultComponent = ({ label, default: defaultValue, description }) =>
  observer(({ store: { value, setValue } }) => {
    return (
      <ComponentContainer>
        <h3>{label}</h3>
        <p>{description}</p>
        <p>{value.toString()}</p>
      </ComponentContainer>
    )
  })

const COMPONENT_MAKERS = {
  boolean: makeCheckboxComponent,
  number: makeNumberInputComponent,
  integer: makeIntegerInputComponent
}

/**
 * @type {Function}
 * @param {Object} schema
 * @returns {Function}
 */
export const componentMaker = schema => {
  if (schema.enum) {
    return makeOptionsComponent
  }

  return COMPONENT_MAKERS[schema.type] || makeDefaultComponent
}
