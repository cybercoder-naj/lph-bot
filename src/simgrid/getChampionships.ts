import * as cheerio from "cheerio";
import { SIMGRID_BASE_URL } from "../constants";

async function getSearchResultWebsite() {
  let response: Response | null;
  try {
    response = await fetch("https://www.thesimgrid.com/search?search=Endurance&games[]=1&games[]=65");
  } catch (error) {
    console.error(`Error fetching search results: ${error}`);
    throw error;
  }

  if (!response.ok) {
    console.error(`Failed to fetch search results: ${response.status} ${response.statusText}`);
    throw new Error(`Error fetching search results: ${response.statusText}`);
  }

  const data = await response.text();
  console.log(`Fetched search results successfully, length: ${data.length} characters`);
  return data;
}

// TODO : Define proper types for the returned events
async function parseSearchResults(html: string, debug = false): Promise<any[]> {
  const $ = cheerio.load(html);
  const events = [];

  const getNameAndCommunity = (el: cheerio.Cheerio<any>) => {
    const name = el.find('.card-body a[href^="/championships/"]').first();
    const community = el.find('.card-body a[href^="/communities/"]').first();
    
    return {
      name: name.text().trim(),
      championshipLink: `${SIMGRID_BASE_URL}${name.attr('href')}`,
      community: community.text().trim(),
      communityLink: `${SIMGRID_BASE_URL}${community.attr('href')}`,
    }
  }

  // any because cheerio types are not very specific
  const getBadges = (el: cheerio.Cheerio<any>) => {
    const badges: string[] = [];
    el.find('.badge:not(.card-footer .badge)').each((_, badgeEl) => {
      const badge = $(badgeEl).text().trim();
      badges.push(badge);
    });
    return badges;
  };

  const getFooter = (el: cheerio.Cheerio<any>) => {
    const footerInformation: Record<string, string> = {};
    el.find('.card-footer .list-group-item .meta-wrapper').each((_, footerEl) => {
      const label = $(footerEl).find('dt').text().trim().toLowerCase();
      const value = $(footerEl).find('dd').text().trim();
    
      footerInformation[label] = value;
    });
    return footerInformation;
  };

  if (debug) {
    const el = $('.lazy-pagination-wrapper .lazy-pagination-element:not(.graphic-block)').first();
    const nameAndCommunity = getNameAndCommunity(el);
    const badges = getBadges(el);
    const footer = getFooter(el);

    events.push({
      ...nameAndCommunity,
      game: badges[1], // <- hacky way to get the game badge
      ...footer
    });
  
    console.log('Debug Event:', events[0]);
  } else {
    $('.lazy-pagination-wrapper .lazy-pagination-element:not(.graphic-block)')
      .each((_, el) => {
        const $el = $(el);
        const nameAndCommunity = getNameAndCommunity($el);
        const badges = getBadges($el);
        const footer = getFooter($el);

        events.push({
          ...nameAndCommunity,
          game: badges[1], // <- hacky way to get the game badge
          ...footer
        });
    })
  }

  return events;
}

export async function getChampionships(env: Env) {
  const html = await getSearchResultWebsite();
  const events = await parseSearchResults(html, false);

  const filteredEvents = events.filter(event =>
    event.registration != 'Closed' && event.drivers == 'Teams'
  );

  console.log(`Found ${filteredEvents.length} upcoming team endurance championships.`);
  console.log('Championships:', filteredEvents);
  return filteredEvents;
}
