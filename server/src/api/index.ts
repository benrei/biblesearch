import { Database } from "bun:sqlite";
import { Hono } from "hono";

export const apiRoutes = new Hono();
const db = new Database("bible.db", { create: true });

apiRoutes.get("/search", async (c) => {
  const query = c.req.query("q");
  const text = String(query)?.trim().split(" ").join(" OR ");
  console.time("search");
  const results = db.query(
    `SELECT * FROM Verses_fts WHERE text MATCH '${text}' ORDER BY rank LIMIT 7`
  );
  console.timeEnd("search");
  try {
    return c.json(results.all());
  } catch (error) {
    console.error("Error fetching data from external API:", error);
    return c.json(null);
  }
});

// route to get read books
apiRoutes.get("/verses", async (c) => {
  const { book, chapter } = c.req.queries();
  const results = db.query(
    `SELECT * FROM Verses WHERE book = '${book}' AND chapter = '${chapter}'`
  );
  try {
    return c.json(results.all());
  } catch (error) {
    console.error("Error fetching data from external API:", error);
    return c.json(null);
  }
});
