// @ts-nocheck
import React from 'react'
import { getByText } from '@testing-library/react'

it('test', () => {
  const { container } = render(<A />)
  expect(getByText(container, 'text')).toBeInTheDocument()
  expect(getByText(container, /text/)).toBeInTheDocument()
})
