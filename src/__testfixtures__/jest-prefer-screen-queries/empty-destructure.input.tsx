// @ts-nocheck
it('test', () => {
  const { getByTestId } = render({ foo: true })

  expect(getByTestId('foo')).toBeInTheDocument()
})
