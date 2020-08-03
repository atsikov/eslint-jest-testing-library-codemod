// @ts-nocheck
import { foo } from '@testing-library/react'

it('test', () => {
  const { getByText } = render(<A />)
  expect(getByText('text')).not.toBeNull()
})
