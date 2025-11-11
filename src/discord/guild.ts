import { DiscordClient } from ".";
import { DiscordGuild } from "./types";

export async function getAllGuilds(client: DiscordClient): Promise<DiscordGuild[]> {
  const response = await client(`/users/@me/guilds`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch guilds: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  const guilds = await response.json<DiscordGuild[]>();
  return guilds;
}