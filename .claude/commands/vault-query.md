---
description: Ask the vault a question. Consults existing articles; archives the answer as a new article if it passes the 30-day criterion.
---

# /vault-query <question>

The user is asking a substantive question and wants the vault consulted + the answer potentially archived.

1. **Read the question.** If the user didn't provide one after `/vault-query`, ask for it in one line.

2. **Consult the wiki:**
   - Read `vault/wiki/_master-index.md` to identify candidate categories.
   - Read the relevant category `_index.md` file(s).
   - Read up to 5 most-relevant articles (by title/TL;DR match + internal links).

3. **Answer the question** using the vault content. Cite sources: `[[article-name]]`.

4. **Apply the 30-day criterion:**

   Would I want to re-read this answer in 30 days? Apply these tests:
   - ✅ Original synthesis across multiple articles? → archive.
   - ✅ New insight not present in any single article? → archive.
   - ✅ Non-trivial decision with reasoning? → archive.
   - ✅ Research requiring web search or new data? → archive.
   - ❌ Pure lookup (e.g., "what's in article X?") → don't archive.
   - ❌ Chatty back-and-forth → don't archive.
   - ❌ Already fully covered by existing article → link to it instead.

5. **If archiving:**
   - Write article in `vault/wiki/<category>/<slug>.md`.
   - Include a section: `## Source query` with the original question.
   - Add links to every article cited.
   - Update category `_index.md`.
   - Append `vault/log.md`: `[ISO] QUERY→WIKI: <topic> → <article>.md`.
   - End response with: `📝 Archived as [[<article>]].`

6. **If not archiving:** just answer. Don't mention the criterion unless asked.

**Constraints:**
- Never fabricate wiki content. If the wiki doesn't know, say so and use web search or the user's knowledge instead.
- If multiple articles contradict each other, flag the contradiction and suggest a `/vault-lint`.
