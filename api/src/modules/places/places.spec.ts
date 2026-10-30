import { PlacesService } from './places.service';
import { todayIn, utcOffsetHours } from './timezone.util';

describe('timezone offsets', () => {
  it('handles India, Nepal and US daylight saving', () => {
    expect(utcOffsetHours('Asia/Kolkata', 1990, 6, 15, 14, 30)).toBe(5.5);
    expect(utcOffsetHours('Asia/Kathmandu', 2000, 1, 1)).toBe(5.75);
    expect(utcOffsetHours('America/New_York', 1990, 1, 15)).toBe(-5);
    expect(utcOffsetHours('America/New_York', 1990, 7, 15)).toBe(-4);
  });

  it('gives a calendar date', () => {
    expect(todayIn('Asia/Kolkata')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('PlacesService', () => {
  const places = new PlacesService();

  it('finds Indian cities first with time zone', () => {
    const r = places.search('indo');
    expect(r[0]).toMatchObject({ name: 'Indore', country: 'India', timezone: 'Asia/Kolkata' });
  });

  it('finds foreign cities and looks them up by id', () => {
    const ny = places.search('new york')[0];
    expect(ny.timezone).toBe('America/New_York');
    expect(places.getById(ny.id).name).toBe(ny.name);
  });

  it('ignores very short queries', () => {
    expect(places.search('a')).toEqual([]);
  });
});
