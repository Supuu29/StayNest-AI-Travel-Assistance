# StayNest Backend

Express 5 + MongoDB (Mongoose) API for StayNest: user accounts, stays, bookings and an AI budget planner.

## Setup

```bash
cd backend
npm install
cp .env.example .env     # then fill in every value
npm run seed:listings    # loads the 45 stays into MongoDB
npm run dev              # http://localhost:5000
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm start` | Runs the server with Node |
| `npm run dev` | Runs the server with nodemon (auto-restart) |
| `npm run seed:listings` | Inserts or updates stays from `seed/listings.json` (safe to run twice) |

## Environment variables

See `.env.example`. Never commit `.env`.

## Who can do what

- **Normal users** sign up and log in (JWT). They can browse stays, book, see and cancel only their own bookings, and use the AI planner.
- **The StayNest owner** manages stays through `/api/admin/*` using the `x-admin-key` header. There are no admin accounts, and user JWTs never work on admin routes.

## API

All errors look like `{ "error": "message" }`. Auth means `Authorization: Bearer <token>`.

### Health
| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| GET | `/api/health` | none | `{ status, time }` |

### Auth
| Method | Path | Auth | Body | Success |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/signup` | none | `{ name, email, password }` | 201 `{ token, user: { id, name, email } }` |
| POST | `/api/auth/login` | none | `{ email, password }` | 200 `{ token, user }` |
| GET | `/api/auth/me` | user | none | 200 `{ user }` |

### Listings (public)
| Method | Path | Success |
| --- | --- | --- |
| GET | `/api/listings` | 200 `{ listings, total, page, pages }` |
| GET | `/api/listings/cities` | 200 `{ cities }` |
| GET | `/api/listings/:id` | 200 `{ listing }` |

Query filters: `city, type, costTier, minPrice, maxPrice, guests, guestFavourite, sort (rating | price_asc | price_desc | newest), page, limit`.

### Admin (header `x-admin-key`)
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/admin/listings` | Includes removed stays; `?isActive=true|false` |
| GET | `/api/admin/listings/:id` | |
| POST | `/api/admin/listings` | 201 `{ listing }` |
| PATCH | `/api/admin/listings/:id` | Send only changed fields |
| DELETE | `/api/admin/listings/:id` | Soft delete (`isActive: false`) |

### Bookings (user)
| Method | Path | Body | Success |
| --- | --- | --- | --- |
| POST | `/api/bookings` | `{ listingId, checkIn, checkOut, guests }` (dates `YYYY-MM-DD`) | 201 `{ booking }` |
| GET | `/api/bookings/my-bookings` | none | 200 `{ bookings }` |
| PUT | `/api/bookings/:id/cancel` | none | 200 `{ booking }` |

Price, nights and total are always computed by the server.

### AI planner
| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/ai/budget-plan` | optional | Body `{ destination, travelers, days, budget }`. 10 requests/min per IP. Saved only if logged in. |
| GET | `/api/ai/my-plans` | user | Last 10 plans |

Response of `budget-plan`: `{ plan, perNightStayBudget, perPersonFoodPerDay, explanation, source, recommendedStays, budgetNote }`.
`source` is `"llm"` or `"fallback"`.

## Status codes used

400 bad input, 401 not logged in or bad token or bad admin key, 403 not your booking, 404 not found, 409 duplicate or dates taken, 413 body too large, 429 rate limited, 500 server error, 503 admin API not configured.

## Known limitations

- Double-booking is possible if two users book the same dates in the same few milliseconds (check-then-insert; no transaction).
- The admin key is one shared secret, with no per-person accountability.
- Image files are not uploaded through the API; copy them into the frontend `public/` folder.