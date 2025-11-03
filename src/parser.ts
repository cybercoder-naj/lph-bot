import * as cheerio from 'cheerio';
import { SIMGRID_BASE_URL } from './constants';

// TODO : Define proper types for the returned events
export function parseChampionshipPage(html: string, debug = false): any[] {
  const $ = cheerio.load(html);
  const championships = [];

  const getImageLink = (el: cheerio.Cheerio<any>) => {
    const imgEl = el.find('.loading_image img').first();
    return imgEl.attr('src') ? imgEl.attr('src') : null;
  }

  const getNameAndCommunity = (el: cheerio.Cheerio<any>) => {
    const name = el.find('.card-body a[href^="/championships/"]').first();
    const community = el.find('.card-body a[href^="/communities/"]').first();
    
    return {
      name: name.text().trim(),
      championshipLink: `${SIMGRID_BASE_URL}${name.attr('href')}`,
      community: community.text().trim(),
      communityLink: `${SIMGRID_BASE_URL}${community.attr('href')}`,
      racesLink: `${SIMGRID_BASE_URL}${name.attr('href')}/races`,
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

  const buildChampionship = (el: cheerio.Cheerio<any>) => {
    const nameAndCommunity = getNameAndCommunity(el);
    const badges = getBadges(el);
    const footer = getFooter(el);
    const imageLink = getImageLink(el);
    
    return {
      ...nameAndCommunity,
      game: badges[1], // <- hacky way to get the game badge
      ...footer,
      imageLink,
    };
  }

  const els = $('.lazy-pagination-wrapper .lazy-pagination-element:not(.graphic-block)');
  if (debug) {
    // Only parse the first event for debugging purposes
    const el = els.first();
    championships.push(buildChampionship(el));
    console.log('Debug Championship:', championships[0]);
  } else {
    // Parse all events
    els.each((_, el) => {
        championships.push(buildChampionship($(el)));
    });
  }

  return championships;
}

export function parseRacePage(html: string, debug = false): any[] {
  const $ = cheerio.load(html);
  const races = [];

  const getRaceImageLink = (el: cheerio.Cheerio<any>) => {
    const style = el.find('.card-image').first().attr('style');
    const match = style?.match(/url\(["']?([^"']+)["']?\)/);
    return match ? `${SIMGRID_BASE_URL}${match[1]}` : null;
  }

  const getRaceName = (el: cheerio.Cheerio<any>) => {
    return el.find('.tab-pane.active.show .card .card-body').text().trim();
  };

  const getRaceDetails = (el: cheerio.Cheerio<any>) => {
    const details: Record<string, string> = {};
    el.find('.tab-pane.active.show .card .card-footer .list-group-item').each((_, detailEl) => {
      const label = $(detailEl).find('dt span').text().trim().toLowerCase();
      const valueEl = $(detailEl).find('dd span:not(.badge) time');
      
      const value = !valueEl.text().trim() ?
        $(detailEl).find('dd').text().trim() :
        valueEl.attr('datetime') || valueEl.text().trim();

      details[label] = value;
    });
    return details;
  };


  const buildRace = (el: cheerio.Cheerio<any>) => {
    return {
      name: getRaceName(el),
      imageLink: getRaceImageLink(el),
      ...getRaceDetails(el),
    };
  };

  const els = $('.event-block');
  if (debug) {
    const el = els.first();
    races.push(buildRace(el));
    console.log('Debug Race:', races[0]);
  } else {
    els.each((_, el) => {
      races.push(buildRace($(el)));
    });
  }

  return races;
}