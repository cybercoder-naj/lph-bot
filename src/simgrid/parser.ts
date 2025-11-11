import * as cheerio from 'cheerio';
import type { Championship, Race, SupportedGames } from '../types';
import { normalize } from './utils';
import { SIMGRID_BASE_URL } from './constants';

export function parseChampionshipPage(html: string): Championship[] {
  console.log('Parsing championship page HTML...');
  const $ = cheerio.load(html);
  const championships: Championship[] = [];

  // biome-ignore lint/suspicious/noExplicitAny: cheerio types are not very specific
  const getImageLink = (el: cheerio.Cheerio<any>): string => {
    const imgEl = el.find('.loading_image img').first();
    return imgEl.attr('src') ?? '';
  };

  // biome-ignore lint/suspicious/noExplicitAny: cheerio types are not very specific
  const getNameAndCommunity = (el: cheerio.Cheerio<any>): Pick<Championship, 'id' | 'name' | 'community'> | null => {
    const name = el.find('.card-body a[href^="/championships/"]').first();
    const community = el.find('.card-body a[href^="/communities/"]').first();

    const nameHref = name.attr('href');
    if (!nameHref) return null;

    const id = nameHref.split('/')?.pop();
    if (!id) return null;

    return {
      id: +id,
      name: normalize(name.text()),
      community: normalize(community.text())
    };
  };

  // biome-ignore lint/suspicious/noExplicitAny: cheerio types are not very specific
  const getGame = (el: cheerio.Cheerio<any>): SupportedGames | null => {
    const badges: string[] = [];
    el.find('.badge:not(.card-footer .badge)').each((_, badgeEl) => {
      const badge = $(badgeEl).text().trim();
      badges.push(badge);
    });
    if (badges.length < 2) return null;
    return normalize(badges[1]) as SupportedGames; // <- hacky way to get the game badge
  };

  // biome-ignore lint/suspicious/noExplicitAny: cheerio types are not very specific
  const getFooter = (el: cheerio.Cheerio<any>): Pick<Championship, 'registration' | 'dates' | 'rounds'> => {
    const footerInformation: Record<string, string> = {};
    el.find('.card-footer .list-group-item .meta-wrapper').each((_, footerEl) => {
      const label = $(footerEl).find('dt').text().trim().toLowerCase();
      const value = $(footerEl).find('dd').text().trim();

      if (label === 'registration' || label === 'dates' || label === 'rounds')
        footerInformation[label] = normalize(value);
    });
    return footerInformation as Pick<Championship, 'registration' | 'dates' | 'rounds'>;
  };

  // biome-ignore lint/suspicious/noExplicitAny: cheerio types are not very specific
  const buildChampionship = (el: cheerio.Cheerio<any>): Championship | null => {
    const nameAndCommunity = getNameAndCommunity(el);
    if (!nameAndCommunity) return null;

    const game = getGame(el);
    if (!game) return null;

    const footer = getFooter(el);
    const image = getImageLink(el);

    return {
      ...nameAndCommunity,
      game,
      ...footer,
      image
    };
  };

  const els = $('.lazy-pagination-wrapper .lazy-pagination-element:not(.graphic-block)');
  els.each((_, el) => {
    const champ = buildChampionship($(el));
    if (champ) championships.push(champ);
  });

  return championships;
}

export function parseRacePage(html: string, championship: Championship): Race[] {
  console.log('Parsing race page HTML for championship ID:', championship.id);
  const $ = cheerio.load(html);
  const races: Race[] = [];

  // biome-ignore lint/suspicious/noExplicitAny: cheerio types are not very specific
  const getRaceImageLink = (el: cheerio.Cheerio<any>): Race['imageLink'] => {
    const style = el.find('.card-image').first().attr('style');
    const match = style?.match(/url\(["']?([^"']+)["']?\)/);
    return match ? `${SIMGRID_BASE_URL}${match[1]}` : '';
  };

  // biome-ignore lint/suspicious/noExplicitAny: cheerio types are not very specific
  const getRaceName = (el: cheerio.Cheerio<any>): Race['name'] => {
    return normalize(el.find('.tab-pane.active.show .card .card-body').text());
  };

  // biome-ignore lint/suspicious/noExplicitAny: cheerio types are not very specific
  const getRaceDetails = (el: cheerio.Cheerio<any>): Pick<Race, 'date' | 'track'> => {
    const details: Record<string, string> = {};
    el.find('.tab-pane.active.show .card .card-footer .list-group-item').each((_, detailEl) => {
      const label = $(detailEl).find('dt span').text().trim().toLowerCase();
      const valueEl = $(detailEl).find('dd span:not(.badge) time');

      const value = !valueEl.text().trim()
        ? $(detailEl).find('dd').text().trim()
        : valueEl.attr('datetime') || valueEl.text().trim();

      if (label === 'date' || label === 'track') details[label] = normalize(value);
    });
    return details as Pick<Race, 'date' | 'track'>;
  };

  // biome-ignore lint/suspicious/noExplicitAny: cheerio types are not very specific
  const buildRace = (el: cheerio.Cheerio<any>, championship: Championship): Race => {
    return {
      id: 0,
      name: getRaceName(el),
      imageLink: getRaceImageLink(el),
      ...getRaceDetails(el),
      championship
    };
  };

  const els = $('.event-block');
  els.each((_, el) => {
    races.push(buildRace($(el), championship));
  });

  return races;
}
