import * as cheerio from 'cheerio';
import { SIMGRID_BASE_URL } from './constants';

// TODO : Define proper types for the returned events
export function parseSearchResults(html: string, debug = false): any[] {
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

  const buildEvent = (el: cheerio.Cheerio<any>) => {
    const nameAndCommunity = getNameAndCommunity(el);
    const badges = getBadges(el);
    const footer = getFooter(el);
    
    return {
      ...nameAndCommunity,
      game: badges[1], // <- hacky way to get the game badge
      ...footer
    };
  }

  const els = $('.lazy-pagination-wrapper .lazy-pagination-element:not(.graphic-block)');
  if (debug) {
    // Only parse the first event for debugging purposes
    const el = els.first();
    events.push(buildEvent(el));
    console.log('Debug Event:', events[0]);
  } else {
    // Parse all events
    els.each((_, el) => {
        events.push(buildEvent($(el)));
    });
  }

  return events;
}