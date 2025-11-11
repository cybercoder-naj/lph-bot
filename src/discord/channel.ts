import { DiscordClient } from '.';
import { DiscordChannel } from './types';

/**
 * Returns a list of guild channel objects. Does not include threads.
 *
 * @param client The Discord API client
 * @param guildId The ID of the guild to fetch channels from
 * @returns A promise that resolves to an array of DiscordChannel objects
 */
export async function getAllChannels(client: DiscordClient, guildId: string): Promise<DiscordChannel[]> {
  const response = await client(`/guilds/${guildId}/channels`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch channels: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const channels = await response.json<DiscordChannel[]>();
  return channels;
}
