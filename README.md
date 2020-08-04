# eslint-jest-testing-library-codemod

**eslint-jest-testing-library-codemod** provides a set of autofixes to make migration to [eslint-plugin-testing-library](https://github.com/testing-library/eslint-plugin-testing-library) ruleset less painful. Codemod is based on [jscodeshift](https://github.com/facebook/jscodeshift).

## Usage
`yarn transform <path to folder>`

Codemod will pick all js, jsx, ts, tsx files, ignoring `node_modules`. [jscodeshift](https://github.com/facebook/jscodeshift) params could be passed as well.

Looks cool, right?

![Sample transform diff](https://github.com/atsikov/eslint-jest-testing-library-codemod/blob/master/images/sample-transform.png)

## Fixers

### prefer-screen-queries

Fixes `testing-library/prefer-screen-queries` rule.

Fixer is capable to fix various scenarios. `screen` import will be added if necessary.

* Replace query taken from `render()` result
```
const { getByText } = render(<div />)
expect(getByText('text')).not.toBeNull()
```
is transformed to
```
render(<div />)
expect(screen.getByText('text')).not.toBeNull()
```

* Replace query taken from `render()` result, which was assigned to var
```
const rendered = render(<div />)
const { getByText } = rendered
expect(getByText('text')).not.toBeNull()
```
is transformed to
```
render(<div />)
expect(screen.getByText('text')).not.toBeNull()
```

* Handle globally imported queries
```
import { getByText as gBT, screen } from '@testing-library/react'
render(<div />)
const child = screen.getByText('child')
expect(gBT(child, 'text')).not.toBeNull()
```
is transformed to
```
import { screen, within } from '@testing-library/react'
render(<div />)
const child = screen.getByText('child')
expect(within(child).getByText('text')).not.toBeNull()
```

* Replace query taken from variable where `render()` result was assigned, removing this var when it is not referenced (with `memberExpression: true` option)
```
const rendered = render(<div />)
expect(rendered.getByText('text')).not.toBeNull()
```
is transformed to
```
render(<div />)
expect(screen.getByText('text')).not.toBeNull()
```
Handles variables from upper scope
```
let rendered
it('test', () => {
  rendered = render(<div />)
  expect(rendered.getByText('text')).not.toBeNull()
})
```
is transformed to
```
it('test', () => {
  render(<div />) 
  expect(screen.getByText('text')).not.toBeNull()
})
```
Unused type will also be removed
```
import { RenderResult } from '@testing-library/react'
let rendered
rendered = render(<div />)
expect(rendered.getByText('text')).not.toBeNull()
```
is transformed to
```
import { screen } from '@testing-library/react'
render(<div />)
expect(screen.getByText('text')).not.toBeNull()
```

### no-manual-cleanup

Fixes `testing-library/no-manual-cleanup` rule.

* Removes `cleanup` calls
```
import { cleanup } from '@testing-library/react'

it('test', () => {
  cleanup()
  render(<div />)
})
```
is transformed to 
```
it('test', () => {
  render(<div />)
})
```

* Removes jest lifecycle methods in case `cleanup` was the only call
```
import { cleanup, render } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

test('test', () => {
  render()
})
```
is transformed to 
```
import { render } from '@testing-library/react'

it('test', () => {
  render(<div />)
})
```

* Handles case when `cleanup` is passed to jest lifecycle method as a callback
```
import { cleanup, render } from '@testing-library/react'

afterEach(cleanup)

test('test', () => {
  render()
})
```
is transformed to 
```
import { render } from '@testing-library/react'

it('test', () => {
  render(<div />)
})
```

### prefer-presence-queries

Fixes `testing-library/prefer-presence-queries` rule.

* Replace truthy assertions with `getBy*` queries
* Replace falsy assertions with `queryBy*` queries
