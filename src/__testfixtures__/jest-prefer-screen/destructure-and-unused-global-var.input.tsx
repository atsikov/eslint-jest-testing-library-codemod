// @ts-nocheck
let rendered: any

it('test', () => {
  rendered = render(<A />)
  const { getByText } = rendered
  expect(getByText('text')).toBeInTheDocument()
})
