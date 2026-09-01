# MedAlign

MedAlign is a healthcare queue and clinic operations platform designed to streamline patient flow, doctor management, prescription workflows, and AI-assisted triage for clinics. The system combines an admin dashboard, doctor workspace, reception flow, patient queue tracker, and AI-based clinical guidance into a single healthcare experience.

## Overview

MedAlign helps clinics manage:

- patient check-in and queue tracking
- doctor scheduling and availability
- queue handoff from reception to clinicians
- prescription generation and digital medical vault access
- patient alerts and wait-time communication
- AI-powered symptom triage and patient summary support

The project includes a Laravel backend API and a React frontend, with Docker support for local setup and testing.

---

## Key Features

### Clinic Internal Workflow

- Admin dashboard with queue snapshot and live operational insights
- Doctor activity overview and availability monitoring
- Subscription status and clinic plan visibility
- Doctors management with add, edit, and scheduling support
- Staff and role-based access management
- Analytics including average wait time, patient counts, and walkout trends
- Reception and counter coordination for patient handling

### Doctor Workflow

- Doctor dashboard for current and next patients
- Queue actions such as call next, skip, recall, and mark complete
- Rapid prescription engine for issuing medications and instructions
- Template-based, faster clinical documentation
- Patient history lookup and clinical summary support
- Prescription delivery through secure digital links or PDF-style flows

### Patient Experience

- Patient queue tracker with token number and live position updates
- Estimated wait time and patient status updates
- OTP-based login and secure medical vault access
- Prescription history and medical record lookup
- Alert preferences for SMS/WhatsApp notifications
- Secure medical access after consultation

### AI Integration

MedAlign includes AI-powered clinical support for both patients and clinicians:

- Symptom-to-specialty recommendation engine using rule-based medical keyword analysis
- Suggested doctor matching based on symptoms and clinic specialties
- Emergency/red-flag detection for urgent problem descriptions
- Patient clinical summary generation for doctors based on prior prescriptions and visit history
- Triage preparation guidance and recommendation notes

Examples of AI features in the project:

- `POST /api/ai/suggest-doctor` for symptom-based doctor matching
- `GET /api/ai/patient-summary/{patient_id}` for AI-assisted clinical summary generation

These features are designed to improve triage, reduce time-to-care, and help clinicians make faster, informed decisions.

---

## Product Flow

The project flow is described in the design diagrams under the docs folder:

- [docs/flow-diagram/README.md](docs/flow-diagram/README.md)
- [docs/flow-diagram/medalign-app-flow.drawio](docs/flow-diagram/medalign-app-flow.drawio)
- [docs/flow-diagram/MedAlign_ERD.drawio](docs/flow-diagram/MedAlign_ERD.drawio)

The app flow includes:

- Landing page and marketing content
- Clinic onboarding and plan selection
- Login and role-based redirects
- Admin dashboard setup
- Doctor and reception workflows
- Patient queue tracker and medical vault
- Prescription generation and delivery

---

## Architecture

### Backend

- Laravel 10 application
- REST API routes for auth, admin, doctor, patient, and AI endpoints
- MySQL database with clinic, patient, doctor, queue, prescription, and analytics models
- OTP-based authentication flow and email notifications
- Docker-ready environment for local onboarding

### Frontend

- React + Vite application
- Responsive healthcare dashboard interfaces
- Multi-role user flows for admin, doctors, and patients
- Tailwind-based styling

### Database

The project includes relational data models for:

- clinics
- subscription plans
- users and roles
- doctors and schedules
- patients
- counters and queue tokens
- prescriptions and items
- alerts and daily analytics

---

## Tech Stack

- PHP 8.x
- Laravel 10
- MySQL
- React
- Vite
- Docker / Docker Compose
- Tailwind CSS
- Mailpit for email testing

---

## Project Structure

```text
MedAlign/
├── backend/                  # Laravel API backend
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── public/
│   ├── routes/
│   ├── tests/
│   ├── .env.example
│   ├── composer.json
│   ├── Dockerfile
│   └── README.md
├── frontend/                 # React frontend app
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── docs/
│   └── flow-diagram/
├── docker-compose.yml
├── docker-compose.services.yml
├── README.md
└── .gitignore
```

---

## Installation Guide

### Prerequisites

Make sure the following are installed on your machine:

- Git
- Docker + Docker Compose
- Node.js 18+ and npm
- Composer
- PHP 8.1+

---

### Option 1: Quick Start with Docker

From the project root:

```bash
docker compose up --build
```

This starts the application stack, including:

- Laravel backend on `http://localhost:8000`
- MySQL database on `localhost:3307`
- Mailpit on `http://localhost:8025`
- phpMyAdmin on `http://localhost:8080`

Then run backend migrations and seed data:

```bash
docker compose exec app php artisan migrate --seed
```

If the app container is not already running or you need to initialize from scratch, you can also run:

```bash
docker compose run --rm app php artisan migrate --seed
```

---

### Option 2: Manual Local Setup

#### 1. Clone the repo

```bash
git clone https://github.com/Akib-1243/MedAlign.git
cd MedAlign
```

#### 2. Set up backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Update the database configuration in `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=medalign_db
DB_USERNAME=root
DB_PASSWORD=
```

Then create the database and run migrations:

```bash
php artisan migrate --seed
```

Start the Laravel API:

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

#### 3. Set up frontend

```bash
cd ../frontend
npm install
npm run dev
```

The frontend typically runs at:

```text
http://localhost:5173
```

---

### Mail and OTP Setup

The app is configured to send OTP emails through Mailpit in the local Docker flow.

Mailpit UI:

```text
http://localhost:8025
```

For local non-Docker development, update SMTP values in the backend `.env` file as needed.

---

## Default Local Test Accounts

After running migrations and seeding, the project seeds example clinic and doctor data.

Example doctor account:

- Email: `doctor@medalign.test`
- Password: `password`

Example admin account:

- Email: `admin@medalign.test`
- Password: `password`

---

## AI Integration Details

### Symptom-based Doctor Suggestion

Endpoint:

```http
POST /api/ai/suggest-doctor
```

Request body:

```json
{
  "symptoms": "Crushing chest pain and shortness of breath"
}
```

The engine maps symptoms to specialties such as:

- Cardiology
- Orthopedics
- Neurology
- Pediatrics
- Dermatology
- General Medicine
- ENT
- Gynecology
- Ophthalmology
- Psychiatry

It also detects urgency based on red-flag phrases and returns recommended doctors with matching confidence and preparation advice.

### AI Patient Summary

Endpoint:

```http
GET /api/ai/patient-summary/{patient_id}
```

This endpoint summarizes prior prescription history and generates a concise clinical view for doctors. It includes medication trends, visit history, and suggested follow-up actions.

---

## Usage Notes

- Admin users manage clinics, doctors, patients, and queue health.
- Doctors use the dashboard to call the next patient and generate prescriptions.
- Reception handles token assignment and queue coordination.
- Patients can track queue position, set alerts, and access their history.
- AI support helps with triage and patient summary review but should be treated as a clinical decision-support layer, not a replacement for medical judgment.

---

## Documentation

Related design documents and flow references:

- [docs/flow-diagram/README.md](docs/flow-diagram/README.md)
- [docs/flow-diagram/medalign-app-flow.drawio](docs/flow-diagram/medalign-app-flow.drawio)
- [docs/flow-diagram/MedAlign_ERD.drawio](docs/flow-diagram/MedAlign_ERD.drawio)

---

## Contributing

1. Create a feature branch.
2. Make the change and test locally.
3. Open a pull request with a clear summary.
4. Keep docs and setup notes updated when changing the workflow or environment.

---

## License

This project is currently intended for internal project use and learning/demo purposes unless otherwise stated by the repository owner.
