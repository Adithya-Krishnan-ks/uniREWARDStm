# UniRewards

## Overview
UniRewards is a point-based marketplace system designed for universities.
It enables professors to reward students with points that can be used inside a digital marketplace. Students can transfer points to peers and participate in auctions to redeem rewards.(This is base that could be designed as per users choice).
The system implements role-based access control (RBAC) with separate workflows for students, professors, and administrators.

## Key Features
**Student Features**
- Earn reward points from professors
- Transfer points to other students
- Browse marketplace items
- Bid on items in auctions
- View transaction history

**Professor Features**
- View assigned students
- Allocate reward points based on predefined Allocation Rules
- Track student engagement
- *Click-to-fill* allocation rules for faster point distribution(a Nonsql application)

**Admin Features**
- Approve or manage users
- Modify student point balances
- Add or edit marketplace products
- Manage and resolve auctions
- Create and manage Allocation Rules
- Maintain platform integrity

## Technology Stack
**Frontend**
- Vanilla JavaScript
- HTML5
- CSS3 (Custom Glassmorphism UI)
- Fetch API for Backend Communication
- Supabase JS SDK (loaded via CDN)

**Backend**
- Node.js
- Express.js
- REST API architecture

**Database & Authentication**
- Supabase
- PostgreSQL
- JWT authentication
- Row Level Security (RLS)
- PostgreSQL RPC functions
- Firestore

## System Architecture
```
Frontend (Vanilla HTML/JS/CSS) served statically
        |
        | REST API (Fetch)
        |
Backend (Node.js + Express)
        |
        | Supabase Client
        |
PostgreSQL Database (Supabase)
```

## Installation & Setup
**1. Clone the repository**
```bash
git clone https://github.com/your-username/unirewards.git
cd unirewards
```

**2. Install backend dependencies**
```bash
cd server
npm install
```

**3. Environment Variables**
Create a `.env` file inside the `server` directory:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=5000
```

**4. Database Setup**
1. Create a project in Supabase
2. Open the SQL editor and run the following migrations from `server/db` in order:
   - `migration.sql`
   - `add_profile_details_migration.sql`
   - `add_description_migration.sql`
   - `add_allocation_rules.sql`
3. Run the admin seed script:
```bash
node db/seed-admin.js
```
*(This sets up the master admin account seeded in code for simplicity(could be changed as per need))*

## Running the Project
Because the frontend is served statically by the Node server, you only need to run the backend:

```bash
cd server
npm start
```
The application will be available at:
**http://localhost:5000**

## Security Features
- JWT authentication
- Role-based access control
- Row Level Security (Supabase)
- Stored procedures for transaction integrity to prevent race conditions
- Protected API routes
