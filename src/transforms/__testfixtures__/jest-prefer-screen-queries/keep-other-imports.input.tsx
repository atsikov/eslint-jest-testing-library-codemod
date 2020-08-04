// @ts-nocheck
import { getByText, screen, within } from '@testing-library/react'

it('test', () => {
  const { getByText } = render(<A />)
  expect(getByText('text')).toBeInTheDocument()
})
