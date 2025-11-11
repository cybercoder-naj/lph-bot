import { DiscordClient } from '.';

/**
 * Post a message to a guild text or DM channel. Returns a message object. Fires a Message Create Gateway event.
 * @param client The Discord API Client
 * @param channelId The ID of the channel to send the message to
 * @param message The content of the message to send.
 */
export async function sendMessage(client: DiscordClient, channelId: string, message: string): Promise<void> {
  const response = await client(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content: message })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send message: ${response.status} ${response.statusText} - ${errorText}`);
  }

  console.log(`Message sent successfully: ${message}`);
}
