// @ts-nocheck
import React from 'react'

it('test', () => {
  const rendered = render(<A />)
  expect(rendered.getByText('text')).toBeInTheDocument()
  rendered.foo
})
