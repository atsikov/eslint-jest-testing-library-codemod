// @ts-nocheck
import React from 'react'

it('test', () => {
  const rendered = render(<A />)
  expect(rendered.getByText('text')).toBeInTheDocument()

  arr.forEach(() => {
    const rendered = render(<A />)
    expect(rendered.foo('text')).toBeInTheDocument()
  })
})
