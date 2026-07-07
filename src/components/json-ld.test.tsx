import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { JsonLd } from './json-ld'

describe('JsonLd', () => {
  it('renders escaped structured data', () => {
    const { container } = render(<JsonLd data={{ '@type': 'Article', headline: '<script>alert(1)</script>' }} />)

    const script = container.querySelector('script')
    expect(script).toHaveAttribute('type', 'application/ld+json')
    expect(script?.innerHTML).toContain('\\u003cscript>')
    expect(script?.innerHTML).not.toContain('<script>alert')
  })
})
