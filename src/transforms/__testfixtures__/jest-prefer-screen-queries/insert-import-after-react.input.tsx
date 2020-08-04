// @ts-nocheck
import React from 'react'

it('test', () => {
  const { getByText } = render(<A />)
  expect(getByText('text')).toBeInTheDocument()
})
