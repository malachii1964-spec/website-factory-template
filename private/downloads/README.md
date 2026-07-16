# Product download files

Put each product's deliverable here as `<product-slug>.pdf`
(e.g. `easy-ai-prompt-mastery.pdf`, `ultimate-chatgpt-prompt-vault.pdf`).

The slugs come from `src/lib/products.ts`.

These files are gitignored on purpose — they're your paid products and must
never be committed to the repo. For production, host them in a PRIVATE bucket
and set `DOWNLOAD_STORAGE_URL` instead (see `.env.example`).
