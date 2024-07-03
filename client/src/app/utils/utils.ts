import { Verse } from '../pages/read/verses/verses.page';

export default class Utils {
  static addVerseToLocalStorage(verse: Verse) {
    // Retrieve the array from localStorage
    const array = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    // Check the length of the array
    if (array.length >= 5) {
      // Remove the last element if the array is at max length
      array.pop();
    }
    // Add the new value to the beginning of the array
    array.unshift(verse);
    // Store the updated array back to localStorage
    localStorage.setItem('bookmarks', JSON.stringify(array));
  }
}
