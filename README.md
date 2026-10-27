# Brownie Cake Online Ordering Starter

A first working MVP for a small local bakery: customer order form, WhatsApp click-to-chat links, PostgreSQL persistence, and an order dashboard that refreshes every 5 seconds.

## Requirements
- Docker Desktop with Docker Compose, OR Java 21 + Maven + PostgreSQL 17.
- Do not expose the admin dashboard publicly until authentication has been added.

## Run locally
1. Extract this zip.
2. Open a terminal in the extracted `brownie-order-system` directory.
3. Edit `docker-compose.yml`:
   - Change `change_this_password` to a strong password in both services.
   - Change `91XXXXXXXXXX` to your WhatsApp number including country code, digits only (India: 91 + 10-digit number).
   - Set `BROWNIE_PRICE` to your actual price per unit.
   - Set `BROWNIE_PRODUCT_NAME` to your product name.
4. Run: `docker compose up --build`
5. Customer order page: http://localhost:8080/
6. Admin dashboard: http://localhost:8080/admin.html
7. API configuration: `GET http://localhost:8080/api/config`
8. List orders: `GET http://localhost:8080/api/orders`

## Important before public deployment
This is a starter MVP, not a secure production system. The admin page and order APIs have no authentication or rate limiting. Do not deploy this version with real customer data on a public URL until admin authentication, HTTPS, CORS/security review, backups, and abuse protection are implemented. Use a managed PostgreSQL service with persistent storage. Keep secrets in host environment variables, not source control.

## Current MVP features
- Saves orders to PostgreSQL.
- Validates required fields and quantity (1–100).
- Calculates totals server-side.
- Generates order IDs.
- Dashboard shows phone, full address, quantity, total, notes and status.
- Status changes persist.
- Dashboard polls every five seconds.
- WhatsApp links open a customer chat; this does not automatically ingest WhatsApp messages or send API notifications.

## Next build steps
1. Add admin login/role protection.
2. Add Flyway migrations and automated tests.
3. Add WhatsApp Cloud API webhook to turn incoming messages into pending orders.
4. Add official WhatsApp templates/consent and automated order status messages.
5. Deploy backend and database with secure environment variables.
6. Add Instagram profile link and test the complete journey from a second phone.
