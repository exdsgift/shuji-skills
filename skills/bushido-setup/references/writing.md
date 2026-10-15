# Writing rules

Every file an agent reads is written with these ten rules. They take the sentence rules of Simplified Technical
English that address real weaknesses of language models (long sentences, chained clauses, stacked nouns), in our own
words, and leave out its approved-word dictionary, which addresses a weakness models do not have and makes text about
30% longer.

## The rules

1. Write one instruction per sentence or bullet, and start it with the verb.
2. Use the active voice. When the actor is not the reader, name the actor.
3. Put the condition first: "When X, do Y."
4. Keep the instruction under about 20 words. Put its reason in the next sentence, and keep the reason.
5. Give each concept one name and use it everywhere. Define a coined term once, where it first appears.
6. Use concrete verbs and checkable limits ("run `uv run pytest`", "under 100 lines"), not vague ones ("handle",
   "properly", "as needed").
7. Number the steps that must run in order. Give each step one action and a way to tell it is done.
8. Write whole sentences. To shorten a text, delete the sentences that change nothing; keep the words of the rest.
9. Split a long chain of "and" or "or" into a list. Keep noun stacks to three words at most.
10. Say what to do. When a prohibition is needed, follow it with what to do instead.

## Where they apply

| Text | How |
| --- | --- |
| Precepts, `AGENTS.md`, checklists, process skills and their steps | Strictly: these are read on every turn or followed step by step. |
| `docs/`, ADRs, `GLOSSARY.md`, references | Loosely: one name per concept, split sentences where it is easy, keep reasons, examples and nuance. |
| A skill's `description` | Not at all: third person, what it does first, then when to use it. |
| READMEs and other text for people | Not at all: plain, natural prose. |

Never label a file with the name of the standard: these are our rules, not a certified form of it.
