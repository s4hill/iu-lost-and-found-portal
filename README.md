# Invertis University Lost & Found Portal

A campus lost-and-found web application for reporting misplaced belongings, browsing items found on campus, and submitting ownership claims. The portal includes an admin area for reviewing reports and managing claims.

## Screenshots

| Home page | Lost items |
| --- | --- |
| ![Home page](./screenshots/home-page.png) | ![Lost items](./screenshots/lost-items.png) |

| Found items | Report a lost item |
| --- | --- |
| ![Found items](./screenshots/found-items.png) | ![Report a lost item](./screenshots/report-lost.png) |

| Report a found item | Admin login |
| --- | --- |
| ![Report a found item](./screenshots/report-found.png) | ![Admin login](./screenshots/admin-login.png) |

## Features

- Browse separate lists of lost and found items.
- Search item names and descriptions, filter by category and campus location, and navigate paginated results.
- Submit lost-item and found-item reports with item details and contact information.
- Optionally attach an image to a report (up to 5 MB).
- View individual item details and submit a claim for a found item with proof of ownership.
- See portal statistics and recently reported items on the home page.
- Use the admin dashboard to review reports and claims, approve or reject claims, mark items as returned, and delete reports.
- Store application data in a local SQLite database through Sequelize.
- Use responsive page layouts for desktop and mobile screens.

## Tech stack

- **Backend:** Node.js, Express
- **Frontend:** HTML, CSS, vanilla JavaScript
- **Database/ORM:** SQLite, Sequelize
- **Other libraries:** Multer for image uploads, bcryptjs for password hashing, express-session for sessions

## Getting started

### Prerequisites

- Node.js and npm

### Install and run

```bash
git clone <your-repository-url>
cd <repository-folder>
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The development command uses Nodemon and restarts the server when files change.

To run without Nodemon:

```bash
npm start
```

The server uses port `3000` by default. You can choose a different port with the `PORT` environment variable, for example:

```bash
PORT=4000 npm start
```

The SQLite database is stored at `database.sqlite` in the project root and is created/synchronized when the server starts. On a fresh database, the application seeds a demo admin account and sample item records.

### Demo admin login

Use these demo credentials to try the admin page locally:

```text
Username: admin
Password: admin123
```

These are public demo credentials for this project only. Do not reuse this password or use this demo authentication setup for a production deployment.

## Application pages

| Page | URL | Purpose |
| --- | --- | --- |
| Home | `/` | Portal overview, statistics, and recent reports |
| Lost items | `/lost` | Browse and search lost-item reports |
| Found items | `/found` | Browse and search found-item reports |
| Report lost | `/report-lost` | Submit a lost-item report |
| Report found | `/report-found` | Submit a found-item report |
| Item details | `/item?id=<id>&type=<lost\|found>` | View an individual report |
| Claim item | `/claim?itemId=<id>&type=found` | Submit a claim for a found item |
| Admin | `/admin` | Admin login and dashboard |

## API overview

The Express server exposes these JSON API routes:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/stats` | Get lost, found, returned, and pending-claim counts |
| `GET` | `/api/lost` | List lost-item reports |
| `GET` | `/api/lost/search` | Search/filter lost items; supports `q`, `category`, `location`, `page`, and `limit` |
| `GET`, `POST` | `/api/lost/:id` or `/api/lost` | Get a report or create one |
| `PUT`, `DELETE` | `/api/lost/:id/return` or `/api/lost/:id` | Mark a report returned or delete it |
| `GET` | `/api/found` | List found-item reports |
| `GET` | `/api/found/search` | Search/filter found items; supports `q`, `category`, `location`, `page`, and `limit` |
| `GET`, `POST` | `/api/found/:id` or `/api/found` | Get a report or create one |
| `PUT`, `DELETE` | `/api/found/:id/return` or `/api/found/:id` | Mark a report returned or delete it |
| `GET`, `POST` | `/api/claims` | List claims or submit a claim |
| `PUT` | `/api/claims/:id/approve` | Approve a claim |
| `PUT` | `/api/claims/:id/reject` | Reject a claim |
| `POST` | `/api/admin/login` | Authenticate an admin and establish a session |
| `POST` | `/api/admin/logout` | End the admin session |
| `GET` | `/api/admin/check` | Check whether an admin session is active |

Item report creation accepts `multipart/form-data` when an image is attached. Search endpoints return paginated results.

## Project structure

```text
.
├── models/                  # Sequelize models and SQLite initialization
├── public/
│   ├── css/style.css        # Shared site styles
│   ├── images/              # Logo, favicon, and campus background
│   ├── js/                  # Page, search, and admin interactions
│   └── *.html               # Static application pages
├── routes/                  # Route modules
├── screenshots/             # README screenshots
├── server.js                # Express server and API endpoints
├── database.sqlite          # Local SQLite database (created/used at runtime)
├── package.json
└── package-lock.json
```

## Before publishing or deploying

- **Admin authentication is for demonstration only.** The current admin page contains a hard-coded client-side credential check, and the database setup seeds a default admin account (`admin` / `admin123`). These demo credentials and the session secret are present in source and will be visible in a public repository. Replace this with properly protected server-side authentication and rotate the session secret before deploying the app publicly.
- The session secret is hard-coded in `server.js`. Use a strong secret from the environment and configure secure cookies before production use.
- Reports contain names and contact details. Review and remove any real or personal records from `database.sqlite` before publishing; do not commit a database containing private data.
- Uploaded report images are stored under `public/uploads/`. Review those files before publishing as well.
- Font Awesome and Google Fonts are loaded from external CDNs, so those fonts/icons require an internet connection.

## License

No license file is currently included. Add a license if you want to specify how others may use, modify, or distribute this project.
