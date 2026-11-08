# Database notes

The `entries` table is a module-scoped record store. Every row has a UUID owner, module key, title, date and JSONB payload. RLS ensures authenticated users can access only rows where `user_id = auth.uid()`. The UI module registry in `src/lib/modules.ts` controls each module’s form fields.

## Module keys
`study`, `fitness`, `skills`, `certifications`, `projects`, `journal`, `expenses`, `goals`, `habits`, `tasks`, `calendar`.

## Sharing
A random 256-bit token is generated for each share. Only its SHA-256 hash is stored. The public page hashes the supplied token, checks the link is not revoked or expired, and returns one record. Share links expire after seven days. The service-role key is used only in a server component and must remain secret.
