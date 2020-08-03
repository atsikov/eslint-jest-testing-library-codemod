// @ts-nocheck
import { getByText as gbt } from '@testing-library/dom'

it('test', () => {
  render(<A />)
  expect(gbt(container, 'text')).not.toBeNull()
})
