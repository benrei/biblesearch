import { Pipe, type PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlightSearch',
  standalone: true,
})
export class HighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string, search: string): SafeHtml {
    if (!search || !value) {
      return value;
    }

    const words = search.split(/\s+/).filter((word) => word.length > 0);
    const escapedWords = words.map((word) =>
      word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    );
    const regex = new RegExp(escapedWords.join('|'), 'gi');

    const replacedValue = value.replace(
      regex,
      (match) => `<b style="color: wheat;">${match}</b>`
    );
    return this.sanitizer.bypassSecurityTrustHtml(replacedValue);
  }
}
