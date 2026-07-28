import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import UnsubscribePage from './(unsubscribe)/unsubscribe/page'

describe('unsubscribe page', () => {
  it('does not submit without an email', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<UnsubscribePage />)
    fireEvent.submit(screen.getByRole('button', { name: 'Unsubscribe' }).closest('form')!)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('submits unsubscribe requests and shows success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    render(<UnsubscribePage />)
    fireEvent.change(screen.getByPlaceholderText('agent@email.com'), {
      target: { value: 'reader@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }))

    expect(await screen.findByText('Unsubscribed')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reader@example.com' }),
    })
  })

  it('shows errors for server and network failures', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockRejectedValueOnce(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    const { rerender } = render(<UnsubscribePage key="server-error" />)
    fireEvent.change(screen.getByPlaceholderText('agent@email.com'), {
      target: { value: 'reader@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }))
    expect(await screen.findByText('Something went wrong. Try again.')).toBeInTheDocument()

    rerender(<UnsubscribePage key="network-error" />)
    fireEvent.change(screen.getByPlaceholderText('agent@email.com'), {
      target: { value: 'reader@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Something went wrong. Try again.')).toBeInTheDocument()
  })
})
