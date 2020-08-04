// @ts-nocheck
import { cleanup, render, screen } from '@testing-library/react'

afterEach(() => {
  foo()
  cleanup()
})
