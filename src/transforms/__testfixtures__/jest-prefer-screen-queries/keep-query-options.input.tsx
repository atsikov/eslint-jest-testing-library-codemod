// @ts-nocheck
import React from 'react'

it('test', () => {
  const { getByText } = render(<A />)
  expect(getByText(container, options)).toBeInTheDocument()
  expect(getByText(container, undefined, options)).toBeInTheDocument()
})
