// @ts-nocheck
import { getByText, within } from '@testing-library/react'

it('test', () => {
  render(<A />)
  expect(getByText('text')).not.toBeNull()
})
