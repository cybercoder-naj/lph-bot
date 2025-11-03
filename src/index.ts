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

import { searchChampionships, searchRaces } from "./simgrid";
import { parseChampionshipPage, parseRacePage } from "./parser";
import { postProcessChampionships } from "./core";

export default {
	// The fetch handler is used to test the scheduled handler.
	// You can ignore it if you don't need to test your scheduled handler
	// via HTTP requests.
	async fetch(req) {
		const url = new URL(req.url);
		url.pathname = '/__scheduled';
		url.searchParams.append('cron', '* * * * *');
		return new Response(`To test the scheduled handler, ensure you have used the "--test-scheduled" then try running "curl ${url.href}".`);
	},

	// The scheduled handler is invoked at the interval set in our wrangler.jsonc's
	// [[triggers]] configuration.
	async scheduled(event, env, ctx): Promise<void> {
		const debug = false; // Set to true to enable debug logging

		console.log(`trigger fired at ${new Date().toISOString()}`);

		const championshipSearchPage = await searchChampionships();
		const championships = parseChampionshipPage(championshipSearchPage, debug);

		const processedChampionships = postProcessChampionships(championships);

		console.log(`Parsed ${processedChampionships.length} events from search results.`);

		for (const championshipId in processedChampionships) {
			const championship = processedChampionships[championshipId];
			const races = await searchRaces(championship.racesLink);
			const parsedRaces = parseRacePage(races, debug);

			console.log(`Parsed ${parsedRaces.length} races for championship: ${championship.name}`);

			processedChampionships[championshipId] = {
				...championship,
				races: parsedRaces,
			}
		}

	},
} satisfies ExportedHandler<Env>;
