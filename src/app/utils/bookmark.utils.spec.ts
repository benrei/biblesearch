import { VerseTarget } from '../interfaces';
import BookmarkUtils from './bookmark.utils';

const target = (verse: number): VerseTarget => ({
  translation: 'KJV',
  bookNumber: 43,
  bookUsfm: 'JHN',
  bookName: 'John',
  chapter: 3,
  verse,
});

describe('BookmarkUtils', () => {
  it('returns an empty title when there are no targets', () => {
    expect(BookmarkUtils.getTitle()).toBe('');
    expect(BookmarkUtils.getTitle({ targets: [] })).toBe('');
  });

  it('formats a single verse title', () => {
    expect(BookmarkUtils.getTitle({ targets: [target(16)] })).toBe('John 3:16');
  });

  it('formats a verse range title', () => {
    expect(BookmarkUtils.getTitle({ targets: [target(16), target(18)] })).toBe('John 3:16-18');
  });
});
