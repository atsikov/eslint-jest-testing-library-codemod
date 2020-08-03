// @ts-nocheck
it('test', () => {
  const { container, getByText } = render(<div />)
  expect(getByText('text')).toBeInTheDocument()
})
