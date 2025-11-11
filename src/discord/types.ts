export type DiscordChannel = {
  id: string;
  type: number;
  guild_id?: string;
  name?: string;
  topic?: string | null;
  nsfw?: boolean;
  last_message_id?: string | null;
  recipients?: any[];
}

export type DiscordUser = {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string | null;
  avatar?: string | null;
}

export type DiscordGuild = {
  id: string;
  name: string;
  icon?: string | null;
  owner?: boolean;
  permissions?: string;
}