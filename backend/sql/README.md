This folder contains SQL initialization scripts used by the BrightBuy MySQL container.

Files (split for clarity):

- 01_seed.sql (root `seed.sql` already present at repo root, mounted as 01_seed.sql in compose)
- functions.sql - SQL functions (e.g. fn_calculate_order_total)
- procedures.sql - Stored procedures (sp_create_order, sp_add_order_item, sp_create_payment)
- triggers.sql - Database triggers (order item totals, stock checks)
- indexes.sql - Non-unique and helpful indexes
- constraints.sql - CHECK constraints and FOREIGN KEY constraints

How these are applied in Docker Compose
- docker-compose mounts these files into `/docker-entrypoint-initdb.d/` inside the MySQL image in numeric order. The MySQL image executes any `*.sql` files found there on first initialization.

Notes and recommended workflow
- These scripts are idempotent where possible. In production, verify data quality before enabling foreign keys or constraints that may fail.
- If you modify these scripts after the database has been initialized, you'll need to either:
  - Run them manually against the database (e.g. via `mysql` client), or
  - Recreate the database volume (danger: data loss) to re-run initialization.

Running manually example:

```sql
-- from a mysql client connected to the BrightBuy DB
SOURCE ./backend/sql/functions.sql;
SOURCE ./backend/sql/procedures.sql;
SOURCE ./backend/sql/triggers.sql;
SOURCE ./backend/sql/indexes.sql;
SOURCE ./backend/sql/constraints.sql;
```

If you'd like, I can also:
- Add one aggregated `init.sql` that sources the parts (useful for non-docker local runs), or
- Add MySQL `*.sh` wrappers that check idempotency before applying changes.
