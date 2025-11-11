export function makeClient(token: string) {
  return (url: string, options: RequestInit = {}) => {
    const base = 'https://discord.com/api/v10';
    return fetch(base + url, {
      ...options,
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DiscordBot (https://lph-bot.cybercoder-nishant.workers.dev, 0.1.0)',
        ...(options.headers || {}),
      },
    });
  }
}

export type DiscordClient = ReturnType<typeof makeClient>;

export * from './channel';
export * from './guild';
export * from './message';