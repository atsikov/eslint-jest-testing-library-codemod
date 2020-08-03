// @ts-nocheck
it('test', () => {
  const rendered = render(<A />)
  const { getByText } = rendered
  expect(getByText('text')).toBeInTheDocument()
})
