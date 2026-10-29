# Deploy

Requirements: PHP 8.1+, `pdo_mysql`, `gd`, `fileinfo`, `mbstring`, and MySQL or MariaDB.

1. Create the `nih_hub` database. Import `backend/database/migrations/001_schema.sql`, `002_seed.sql`, then `003_admin.sql` in order.
2. Copy `backend/config.example.php` to `backend/config.local.php`. Set database credentials, `app_url` to the HTTPS site URL, and Stripe and Razorpay keys.
3. In `frontend/`, run `npm ci` and `npm run build`.
4. Upload the contents of `frontend/dist/` to the site root. Upload `backend/` as `/api/`. Do not overwrite `config.local.php`; make `api/uploads/` writable by Apache.
5. Set the Stripe webhook URL to `https://SITE/api/webhooks/stripe` for `checkout.session.completed`. Set the Razorpay webhook URL to `https://SITE/api/webhooks/razorpay` for `payment.captured` and `order.paid`.
6. Create the first admin by importing `backend/database/migrations/003_admin.sql`. Change its password immediately: run `php -r "echo password_hash('YOUR_NEW_PASSWORD', PASSWORD_BCRYPT), PHP_EOL;"`, then update `admins.password_hash` for `admin@nih.local` with the generated hash.
7. The CRM lives at `/crm`.

## Local development

The XAMPP backend URL is `http://localhost/c.cpanel/3d_stall_design_web/NIH/backend/`. Run `npm run dev` in `frontend/`; Vite proxies `/api` to that backend.

The demo admin account is `admin@nih.local`, seeded by `003_admin.sql`. If its local password is unknown, set a new one with the hash command in step 6.
