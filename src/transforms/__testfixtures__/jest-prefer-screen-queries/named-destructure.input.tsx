// @ts-nocheck
it('test', () => {
  const { getByText: gbt } = render(<A />)
  expect(gbt('text')).not.toBeNull()
})
