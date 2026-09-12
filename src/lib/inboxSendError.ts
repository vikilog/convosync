export type FriendlySendError = {
  title: string
  description: string
}

function rawMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message.trim() ? err.message : fallback
}

export function friendlySendError(err: unknown, fallback = 'Message could not be sent'): FriendlySendError {
  const raw = rawMessage(err, fallback).toLowerCase()

  if (
    raw.includes('messaging window') ||
    raw.includes('allowed window') ||
    raw.includes('2534022') ||
    raw.includes('human_agent') ||
    raw.includes('24 hour') ||
    raw.includes('24-hour')
  ) {
    return {
      title: 'Message not delivered',
      description: 'This chat is outside the 24-hour reply window. Wait for the customer to message you again, then reply.',
    }
  }

  if (raw.includes('token') || raw.includes('reconnect') || raw.includes('expired') || raw.includes('invalid')) {
    return {
      title: 'Message not delivered',
      description: 'This channel is disconnected. Reconnect it from Integrations and try again.',
    }
  }

  if (raw.includes('rate limit') || raw.includes('too many') || raw.includes('throttl')) {
    return {
      title: 'Message not delivered',
      description: 'Too many messages were sent. Wait a moment and try again.',
    }
  }

  if (raw.includes('not connected') || raw.includes('no account')) {
    return {
      title: 'Message not delivered',
      description: 'This channel is not connected. Connect it from Integrations.',
    }
  }

  return {
    title: 'Message not delivered',
    description: 'The message could not be sent. Please try again.',
  }
}
