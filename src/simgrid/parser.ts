import * as cheerio from 'cheerio';
import { SIMGRID_BASE_URL } from '../constants';
import type { Championship, Race, SupportedGames } from '../types';

export function parseChampionshipPage(html: string): Championship[] {
  const $ = cheerio.load(html);
  const championships: Championship[] = [];

  const getImageLink = (el: cheerio.Cheerio<any>): string => {
    const imgEl = el.find('.loading_image img').first();
    return imgEl.attr('src') ?? '';
  }

  const getNameAndCommunity = (el: cheerio.Cheerio<any>): Pick<Championship, 'id' | 'name' | 'community'> | null => {
    const name = el.find('.card-body a[href^="/championships/"]').first();
    const community = el.find('.card-body a[href^="/communities/"]').first();
    
    const nameHref = name.attr('href');
    if (!nameHref) return null;
    const id = nameHref.split('/')?.pop();
    
    return {
      id: +id!,
      name: name.text().trim(),
      community: community.text().trim(),
    }
  }

  // any because cheerio types are not very specific
  const getGame = (el: cheerio.Cheerio<any>): SupportedGames | null => {
    const badges: string[] = [];
    el.find('.badge:not(.card-footer .badge)').each((_, badgeEl) => {
      const badge = $(badgeEl).text().trim();
      badges.push(badge);
    });
    if (badges.length < 2) return null;
    return badges[1] as SupportedGames; // <- hacky way to get the game badge
  };

  const getFooter = (el: cheerio.Cheerio<any>): Pick<Championship, 'registration' | 'dates' | 'rounds'> => {
    const footerInformation: Record<string, string> = {};
    el.find('.card-footer .list-group-item .meta-wrapper').each((_, footerEl) => {
      const label = $(footerEl).find('dt').text().trim().toLowerCase();
      const value = $(footerEl).find('dd').text().trim();
    
      if (label === 'registration' || label === 'dates' || label === 'rounds')
        footerInformation[label] = value;
    });
    return footerInformation as Pick<Championship, 'registration' | 'dates' | 'rounds'>;
  };

  const buildChampionship = (el: cheerio.Cheerio<any>): Championship | null => {
    const nameAndCommunity = getNameAndCommunity(el);
    if (!nameAndCommunity) 
      return null;

    const game = getGame(el);
    if (!game) 
      return null;

    const footer = getFooter(el);
    const image = getImageLink(el);
    
    return {
      ...nameAndCommunity,
      game,
      ...footer,
      image,
    };
  }

  const els = $('.lazy-pagination-wrapper .lazy-pagination-element:not(.graphic-block)');
  els.each((_, el) => {
    const champ = buildChampionship($(el));
    if (champ)
      championships.push(champ);
  });

  return championships;
}

export function parseRacePage(html: string, championshipId: number): Race[] {
  const $ = cheerio.load(html);
  const races: Race[] = [];

  const getRaceImageLink = (el: cheerio.Cheerio<any>): Race['imageLink'] => {
    const style = el.find('.card-image').first().attr('style');
    const match = style?.match(/url\(["']?([^"']+)["']?\)/);
    return match ? `${SIMGRID_BASE_URL}${match[1]}` : '';
  }

  const getRaceName = (el: cheerio.Cheerio<any>): Race['name'] => {
    return el.find('.tab-pane.active.show .card .card-body').text().trim();
  };

  const getRaceDetails = (el: cheerio.Cheerio<any>): Pick<Race, 'date' | 'track'> => {
    const details: Record<string, string> = {};
    el.find('.tab-pane.active.show .card .card-footer .list-group-item').each((_, detailEl) => {
      const label = $(detailEl).find('dt span').text().trim().toLowerCase();
      const valueEl = $(detailEl).find('dd span:not(.badge) time');
      
      const value = !valueEl.text().trim() ?
        $(detailEl).find('dd').text().trim() :
        valueEl.attr('datetime') || valueEl.text().trim();

      if (label === 'date' || label === 'track')
        details[label] = value;
    });
    return details as Pick<Race, 'date' | 'track'>;
  };


  const buildRace = (el: cheerio.Cheerio<any>, championshipId: number): Race => {
    return {
      name: getRaceName(el),
      imageLink: getRaceImageLink(el),
      ...getRaceDetails(el),
      championshipId
    };
  };

  const els = $('.event-block');
  els.each((_, el) => {
    races.push(buildRace($(el), championshipId));
  });

  return races;
}