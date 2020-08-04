// @ts-nocheck
import React from 'react'
import { getByText } from '@testing-library/react'

it('test', () => {
  const { container, getByTestId } = render(<A />)
  expect(getByText(container, 'text')).toBeInTheDocument()
  expect(getByTestId('id')).toBeInTheDocument()
})
