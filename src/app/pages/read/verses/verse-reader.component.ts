import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import {
  AnnotatedVerse,
  VerseTarget,
  VerseSelection,
  NoteAnnotation,
} from 'src/app/interfaces';
import { VerseTextSegmentsPipe } from 'src/app/pipes/verse-text-segments.pipe';
import { ScrollToDirective } from './scroll-to.directive';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-verse-reader',
  imports: [IonButton, IonIcon, VerseTextSegmentsPipe, ScrollToDirective],
  templateUrl: './verse-reader.component.html',
  styleUrls: ['./verse-reader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerseReaderComponent {
  private storage = inject(StorageService);
  private host: HTMLElement = inject(ElementRef).nativeElement;
  verses = input<AnnotatedVerse[]>([]);
  selection = input<VerseSelection>({ targets: [] });
  versesToFocus = input<number[]>([]);
  searchTerm = input<string>('');

  verseClick = output<AnnotatedVerse>();
  textSelection = output<VerseSelection>();
  noteClick = output<{ event: Event; note: NoteAnnotation }>();
  tagClick = output<{ event: Event; verse: AnnotatedVerse }>();

  selectedVerseNumbers = computed(() => {
    return new Set(this.selection().targets.map((target) => target.verse));
  });

  protected readonly renderNotes = this.storage.getSignal('renderNotes');

  onVerseClick(event: MouseEvent, verse: AnnotatedVerse): void {
    if (!window.getSelection()?.isCollapsed) return;

    const highlightId = Number((event.target as HTMLElement).closest<HTMLElement>(
      '[data-highlight-id]',
    )?.dataset['highlightId']);
    if (Number.isFinite(highlightId)) {
      const highlight = verse.highlights.find((candidate) => candidate.id === highlightId);
      if (highlight) {
        this.textSelection.emit({ targets: highlight.targets, highlightId: highlight.id });
        return;
      }
    }
    this.verseClick.emit(verse);
  }

  onTextSelection(): void {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const targets = Array.from(this.host.querySelectorAll<HTMLElement>('.verse-text[data-verse-id]'))
      .filter((element) => range.intersectsNode(element))
      .map((element) => this.createVerseTarget(range, element))
      .filter((target): target is VerseTarget => target !== undefined);

    if (targets.length) this.textSelection.emit({ targets });
  }

  onNoteClick(event: Event, note: NoteAnnotation): void {
    this.noteClick.emit({ event, note });
  }

  onTagClick(event: Event, verse: AnnotatedVerse): void {
    event.stopImmediatePropagation();
    this.tagClick.emit({ event, verse });
  }

  private createVerseTarget(
    range: Range,
    element: HTMLElement,
  ): VerseTarget | undefined {
    const intersection = document.createRange();
    intersection.selectNodeContents(element);

    if (range.compareBoundaryPoints(Range.START_TO_START, intersection) > 0) {
      intersection.setStart(range.startContainer, range.startOffset);
    }
    if (range.compareBoundaryPoints(Range.END_TO_END, intersection) < 0) {
      intersection.setEnd(range.endContainer, range.endOffset);
    }

    const textBeforeSelection = document.createRange();
    textBeforeSelection.selectNodeContents(element);
    textBeforeSelection.setEnd(intersection.startContainer, intersection.startOffset);

    const verse = this.verses().find((candidate) => candidate.id === Number(element.dataset['verseId']));
    if (!verse) return undefined;
    const verseStart = element.textContent.indexOf(verse.text);
    if (verseStart < 0) return undefined;

    const startOffset = Math.max(0, textBeforeSelection.toString().length - verseStart);
    const endOffset = Math.min(
      verse.text.length,
      startOffset + intersection.toString().length,
    );
    const quote = verse.text.slice(startOffset, endOffset);
    if (!quote.trim()) return undefined;

    return {
      translation: verse.translation,
      bookNumber: verse.bookNumber,
      bookUsfm: verse.bookUsfm,
      bookName: verse.bookName,
      chapter: verse.chapter,
      verse: verse.verse,
      startOffset,
      endOffset,
      quote,
      textBefore: verse.text.slice(Math.max(0, startOffset - 24), startOffset),
      textAfter: verse.text.slice(endOffset, endOffset + 24),
    };
  }
}
