/// <reference lib="webworker" />

import sqlite3InitModule, {
  type BindingSpec,
  type Database,
  type SqlValue,
  type Sqlite3Static,
} from '@sqlite.org/sqlite-wasm';
import { BibleWorkerRequest } from './interfaces/bible-worker';
import type { TranslationLoadingPhase } from './services/app-event-bus.service';

let sqlite3: Sqlite3Static | undefined;
const dbConnections = new Map<string, Database>();

async function fetchDatabase(
  translation: string,
  onProgress: (progress: number) => void,
): Promise<ArrayBuffer> {
  const databaseUrl = new URL(`assets/databases/${translation}.db`, self.location.href);

  if ('caches' in self) {
    try {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const match = await cache.match(databaseUrl);
        if (match) {
          onProgress(100);
          return await match.arrayBuffer();
        }
      }
    } catch {
      // Ignore cache match errors
    }
  }

  const response = await fetch(databaseUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch database ${translation}: ${response.status} ${response.statusText}`);
  }

  const responseToCache = response.clone();

  const contentLength = Number(response.headers.get('content-length'));
  let databaseBuffer: ArrayBuffer;

  if (!response.body || !Number.isFinite(contentLength) || contentLength <= 0) {
    onProgress(0);
    databaseBuffer = await response.arrayBuffer();
    onProgress(100);
  } else {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;
    onProgress(0);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      receivedBytes += value.byteLength;
      onProgress(Math.round((receivedBytes / contentLength) * 100));
    }

    const database = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      database.set(chunk, offset);
      offset += chunk.byteLength;
    }
    databaseBuffer = database.buffer;
  }

  if ('caches' in self) {
    try {
      const cache = await caches.open('bible-databases');
      await cache.put(databaseUrl, responseToCache);
    } catch {
      // Ignore cache put errors
    }
  }

  return databaseBuffer;
}

async function getSqlite(): Promise<Sqlite3Static> {
  if (sqlite3) return sqlite3;
  sqlite3 = await sqlite3InitModule();
  return sqlite3;
}

async function getDb(
  translation: string,
  onLoading: (phase: TranslationLoadingPhase, progress?: number) => void = () => undefined,
): Promise<Database> {
  const normalizedTranslation = translation.toUpperCase();
  const existing = dbConnections.get(normalizedTranslation);
  if (existing) return existing;

  onLoading('engine');
  const sqlite = await getSqlite();
  const databaseBytes = await fetchDatabase(normalizedTranslation, (progress) => {
    onLoading('download', progress);
  });
  onLoading('database');
  const db = new sqlite.oo1.DB(':memory:');
  const databasePointer = sqlite.wasm.allocFromTypedArray(databaseBytes);
  const flags =
    sqlite.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
    sqlite.capi.SQLITE_DESERIALIZE_READONLY;
  const resultCode = sqlite.capi.sqlite3_deserialize(
    db,
    'main',
    databasePointer,
    databaseBytes.byteLength,
    databaseBytes.byteLength,
    flags,
  );

  if (resultCode !== sqlite.capi.SQLITE_OK) {
    db.close();
    throw new Error(
      `Failed to open ${normalizedTranslation} database: ${sqlite.capi.sqlite3_js_rc_str(resultCode)}`,
    );
  }

  dbConnections.set(normalizedTranslation, db);
  onLoading('ready');
  return db;
}

// Query helper to run statements and map outputs to objects
function queryAll(
  db: Database,
  sql: string,
  params: BindingSpec = [],
): Record<string, SqlValue>[] {
  return db.exec({
    sql,
    bind: params,
    rowMode: 'object',
    returnValue: 'resultRows',
  });
}

// Normalization & query mapping rules translated from back-end
function normalizeBookSearch(bookName: string): [string, string, string] {
  const clean = bookName.trim().toLowerCase();
  
  if (clean.startsWith('1 ') || clean.startsWith('1st ') || clean.startsWith('i ')) {
    const root = clean.replace(/^(1st\s+|1\s+|i\s+)/, '');
    return [`1 ${root}%`, `I ${root}%`, `1JN%`];
  }
  if (clean.startsWith('2 ') || clean.startsWith('2nd ') || clean.startsWith('ii ')) {
    const root = clean.replace(/^(2nd\s+|2\s+|ii\s+)/, '');
    return [`2 ${root}%`, `II ${root}%`, `2JN%`];
  }
  if (clean.startsWith('3 ') || clean.startsWith('3rd ') || clean.startsWith('iii ')) {
    const root = clean.replace(/^(3rd\s+|3\s+|iii\s+)/, '');
    return [`3 ${root}%`, `III ${root}%`, `3JN%`];
  }
  return [`${bookName}%`, `${bookName}%`, `${bookName}%`];
}

function buildFtsQuery(term: string, useOr = false): string {
  const regex = /"[^"]+"|\S+/g;
  const tokens = term.match(regex) || [];
  
  const processed = tokens.map(token => {
    if (token.startsWith('"') && token.endsWith('"')) {
      const inner = token.slice(1, -1).trim().replace(/[^\p{L}\p{N}\s_]/gu, ' ').replace(/\s+/g, ' ');
      if (inner) {
        return `"${inner}"`;
      }
      return '';
    } else {
      const clean = token.replace(/[^\p{L}\p{N}_]/gu, '');
      if (clean) {
        return clean.length >= 3 ? `${clean}*` : clean;
      }
      return '';
    }
  }).filter(Boolean);

  if (processed.length === 0) return '';
  
  const delimiter = useOr ? ' OR ' : ' ';
  return `text : (${processed.join(delimiter)})`;
}

// Unified route-handling within the Web Worker
addEventListener('message', async ({ data }: MessageEvent<BibleWorkerRequest>) => {
  const { id, type, payload } = data;
  if (!id) return;

  try {
    switch (type) {
      case 'GET_BOOKS': {
        const { translation } = payload;
        const db = await getDb(translation, (phase, progress) => {
          postMessage({ id, loading: { translation, phase, progress } });
        });
        const rows = queryAll(
          db,
          `SELECT name, bookNumber, chapters, usfm, canon, translation
           FROM Books
           WHERE translation = ?
           ORDER BY bookNumber`,
          [translation.toUpperCase()],
        );
        postMessage({ id, success: true, data: rows });
        break;
      }

      case 'GET_VERSES': {
        const { translation, bookUsfm, chapter } = payload;
        const db = await getDb(translation, (phase, progress) => {
          postMessage({ id, loading: { translation, phase, progress } });
        });
        const rows = queryAll(
          db,
          'SELECT * FROM v_Verses WHERE bookUsfm = ? AND chapter = ?',
          [bookUsfm, Number(chapter)]
        );
        postMessage({ id, success: true, data: rows });
        break;
      }

      case 'SEARCH': {
        const { query: rawQuery, translations, canon, books, sort = 'chronological' } = payload;
        const term = (rawQuery || '').trim();
        const pageSize = 500;
        const page = Math.max(1, Math.floor(Number(payload.page) || 1));
        const fetchLimit = page * pageSize;
        const activeTranslations = translations
          ? translations.split(',').map((translation) => translation.trim()).filter(Boolean)
          : ['KJV'];
        const combinedVerses: Record<string, SqlValue>[] = [];
        let combinedCount = 0;

        for (const activeTranslation of activeTranslations) {
          const db = await getDb(activeTranslation, (phase, progress) => {
            postMessage({
              id,
              loading: { translation: activeTranslation, phase, progress },
            });
          });

          const whereClauses: string[] = [];
          const queryParams: (string | number)[] = [];

        if (canon) {
          whereClauses.push('canon = ?');
          queryParams.push(canon);
        }

        if (books) {
          const booksArr = books.split(',').map((b: string) => b.trim()).filter(Boolean);
          if (booksArr.length > 0) {
            const placeholders = booksArr.map(() => '?').join(',');
            whereClauses.push(`bookUsfm IN (${placeholders})`);
            booksArr.forEach((b: string) => queryParams.push(b));
          }
        }

        // Parse structures: Book Chapter:Verse, Book Chapter, Chapter:Verse
        const matchBookChapterVerse = term.match(/^(.*?)\s+(\d+)(?::|\s+)(\d+)$/);
        const matchChapterVerseOnly = term.match(/^(\d+):(\d+)$/);
        const matchChapter = term.match(/^(.*?)\s+(\d+)$/);

        let tableName = 'v_Verses';
        let selectClause = 'v_Verses.*';
        let orderByClause = 'bookNumber, chapter, verse';
        let isStructuredParsed = false;

        if (matchBookChapterVerse) {
          const [, bookName, chapter, verse] = matchBookChapterVerse;
          const [v1, v2, v3] = normalizeBookSearch(bookName);
          const bookCheck = queryAll(
            db,
            'SELECT COUNT(*) as count FROM Books WHERE (name LIKE ? OR name LIKE ? OR usfm LIKE ?)',
            [v1, v2, v3]
          )[0];

          if (Number(bookCheck?.['count'] ?? 0) > 0) {
            whereClauses.push('(bookName LIKE ? OR bookName LIKE ? OR bookUsfm LIKE ?)');
            whereClauses.push('chapter = ?');
            whereClauses.push('verse = ?');
            queryParams.push(v1, v2, v3, Number(chapter), Number(verse));
            
            tableName = 'v_Verses';
            orderByClause = 'bookNumber, chapter, verse';
            isStructuredParsed = true;
          }
        } else if (matchChapter) {
          const [, bookName, chapter] = matchChapter;
          const [v1, v2, v3] = normalizeBookSearch(bookName);
          const bookCheck = queryAll(
            db,
            'SELECT COUNT(*) as count FROM Books WHERE (name LIKE ? OR name LIKE ? OR usfm LIKE ?)',
            [v1, v2, v3]
          )[0];

          if (Number(bookCheck?.['count'] ?? 0) > 0) {
            whereClauses.push('(bookName LIKE ? OR bookName LIKE ? OR bookUsfm LIKE ?)');
            whereClauses.push('chapter = ?');
            queryParams.push(v1, v2, v3, Number(chapter));

            tableName = 'v_Verses';
            orderByClause = 'bookNumber, chapter, verse';
            isStructuredParsed = true;
          }
        }

        if (!isStructuredParsed && matchChapterVerseOnly) {
          const [, chapter, verse] = matchChapterVerseOnly;
          whereClauses.push('chapter = ?');
          whereClauses.push('verse = ?');
          queryParams.push(Number(chapter), Number(verse));
          tableName = 'v_Verses';
          orderByClause = 'bookNumber, chapter, verse';
          isStructuredParsed = true;
        }

        // Full-Text keyword queries
        if (!isStructuredParsed && term !== '') {
          const ftsQuery = buildFtsQuery(term, false);
          if (ftsQuery !== '') {
            whereClauses.push('Verses_fts MATCH ?');
            queryParams.push(ftsQuery);
            tableName = 'Verses_fts JOIN v_Verses ON v_Verses.id = Verses_fts.rowid';
            // Custom BM25 rank scoring in SQLite WASM FTS5 (use text column weight, others 0)
            selectClause = 'v_Verses.*, bm25(Verses_fts, 1.0) as score';
            orderByClause = sort === 'relevance' ? 'score' : 'bookNumber, chapter, verse';
          } else {
            if (whereClauses.length === 0) {
              continue;
            }
            tableName = 'v_Verses';
          }
        } else if (!isStructuredParsed && term === '') {
          if (whereClauses.length === 0) {
            continue;
          }
          tableName = 'v_Verses';
        }

        const WHERE = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Exec standard count query
        const countQuery = `SELECT COUNT(*) as count FROM ${tableName} ${WHERE}`;
        const countRes = queryAll(db, countQuery, queryParams)[0];
        let count = Number(countRes?.['count'] ?? 0);

        let actualQueryParams = [...queryParams];
        // Intelligent OR fallback if FTS returns no elements
        if (!isStructuredParsed && count === 0 && term !== '') {
          const tokens = term.match(/"[^"]+"|\S+/g) || [];
          if (tokens.length > 1) {
            const ftsOrQuery = buildFtsQuery(term, true);
            if (ftsOrQuery !== '') {
              const matchIdx = whereClauses.indexOf('Verses_fts MATCH ?');
              if (matchIdx !== -1) {
                const checkParams = [...queryParams];
                checkParams[matchIdx] = ftsOrQuery;
                const checkCountRes = queryAll(db, countQuery, checkParams)[0];
                const checkCount = Number(checkCountRes?.['count'] ?? 0);
                if (checkCount > 0) {
                  count = checkCount;
                  actualQueryParams = checkParams;
                }
              }
            }
          }
        }

        const mainQuery = `
          SELECT ${selectClause}
          FROM ${tableName}
          ${WHERE}
          ORDER BY ${orderByClause}
          LIMIT ?
        `;

          const verses = queryAll(db, mainQuery, [...actualQueryParams, fetchLimit]);
          combinedCount += count;
          combinedVerses.push(...verses);
        }

        combinedVerses.sort((left, right) => {
          if (sort === 'relevance') {
            return Number(left['score'] ?? 0) - Number(right['score'] ?? 0);
          }
          return (
            Number(left['bookNumber']) - Number(right['bookNumber']) ||
            Number(left['chapter']) - Number(right['chapter']) ||
            Number(left['verse']) - Number(right['verse']) ||
            String(left['translation']).localeCompare(String(right['translation']))
          );
        });

        postMessage({
          id,
          success: true,
          data: {
            count: combinedCount,
            verses: combinedVerses.slice(0, fetchLimit),
          },
        });
        break;
      }

      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  } catch (error: unknown) {
    console.error(`[Worker] Error handling ${type}:`, error);
    postMessage({
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Web Worker error',
    });
  }
});
