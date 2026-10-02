# Laravel API Starter Template

This is a **Laravel API-only starter template** intended for students to build their own projects. 

The backend is fully prepared for RESTful API development, and students are expected to create a frontend separately in a `client` folder.

---

## Features

- Laravel 10 backend
- API routes only (no Blade templates)
- Sanctum authentication setup (optional)
- Ready for React or other frontend clients
- Example routes and controllers to get started

---

## Prerequisites

Make sure you have the following installed:

- PHP >= 8.4
- Composer
- MySQL / PostgreSQL / SQLite
- Node.js and npm/yarn (for the frontend client)

---

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd <project-folder>

## Docker development

From this directory, start the Laravel API and MySQL database with:

```bash
docker compose up --build
```

The API is available at `http://localhost:8000`. The first startup runs the
migrations and seeds a doctor account for local testing:

- Email: `doctor@medalign.test`
- Password: `password`

The React frontend runs separately from `../frontend` with `npm install` and
`npm run dev`.
