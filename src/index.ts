/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Scheduled Worker: a Worker that can run on a
 * configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `pnpm run dev` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to see your Worker in action
 * - Run `pnpm run deploy` to publish your Worker
 *
 * Bind resources to your Worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `pnpm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { waitUntil } from 'cloudflare:workers';
import { getAllChannels, getAllGuilds, makeClient, sendMessage } from './discord';
import { syncChampionshipAndRaces } from './simgrid';

export default {
  // The fetch handler is used to test the scheduled handler.
  // You can ignore it if you don't need to test your scheduled handler
  // via HTTP requests.
  async fetch(req) {
    const url = new URL(req.url);
    url.pathname = '/__scheduled';
    url.searchParams.append('cron', '0 9 * * *');
    return new Response(
      `To test the scheduled handler, ensure you have used the "--test-scheduled" then try running "curl ${url.href}".`
    );
  },

  // The scheduled handler is invoked at the interval set in our wrangler.jsonc's
  // [[triggers]] configuration.
  async scheduled(event, env, _ctx): Promise<void> {
    console.log('Scheduled event triggered at', event.scheduledTime);

    const discordClient = makeClient(env.DISCORD_TOKEN);

    const syncResults = await syncChampionshipAndRaces(env.DB);

    const guilds = await getAllGuilds(discordClient);
    const lphGuild = guilds.find(guild => guild.name.startsWith('Los Patos'));
    if (!lphGuild) {
      throw new Error('LPH Guild not found');
    }

    const channels = await getAllChannels(discordClient, lphGuild.id);
    const botChannel = channels.find(channel => channel.name === 'endurance-bot');
    if (!botChannel) {
      throw new Error('Bot channel not found');
    }

    console.log('Sync results:', syncResults);

    waitUntil(sendMessage(discordClient, botChannel.id, `Hello LPH! Daily sync completed. Here are new races:`));

    for (const race of syncResults.inserted) {
      waitUntil(sendMessage(discordClient, botChannel.id, `- New race found: ${race.name}`));
    }
  }
} satisfies ExportedHandler<Env>;
