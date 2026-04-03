# Uber Clone with Appwrite

A real-time ride-hailing app built with Next.js, Tailwind CSS, and Appwrite. Uses **geo queries** to match riders with nearby drivers and **realtime subscriptions** for live ride tracking.

![Rider dashboard](https://raw.githubusercontent.com/appwrite-community/uber-clone-nextjs/main/preview.png)

## Features

- Rider and driver roles with separate dashboards
- Geo queries with spatial indexes to find nearby rides within 5km
- Realtime subscriptions for live location tracking during rides
- OTP verification at pickup
- Dev mode to mock GPS locations for testing
- Dark mode UI with Leaflet + OpenStreetMap

## Tech stack

- [Next.js](https://nextjs.org) (App Router)
- [Tailwind CSS](https://tailwindcss.com)
- [Appwrite](https://appwrite.io) (Auth, Databases, Realtime)
- [Leaflet](https://leafletjs.com) + [OpenStreetMap](https://www.openstreetmap.org)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/appwrite-community/uber-clone-nextjs.git
cd uber-clone-nextjs
pnpm install
```

### 2. Appwrite project

Create an Appwrite project and set up the database with three tables:

- **profiles** - userId (varchar), name (varchar), role (enum)
- **driver-locations** - driverId (varchar), location (point), available (boolean)
- **rides** - riderId, driverId (varchar), pickupLocation, dropLocation (point), pickupAddress, dropAddress (varchar), status (enum), otp (varchar), driverLocation, riderLocation (point)

Add spatial indexes on `driver-locations.location` and `rides.pickupLocation`.

Enable row security on all tables.

### 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
```

### 4. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tutorial

This project accompanies the tutorial [Build an Uber clone with geo queries and realtime](https://appwrite.io/blog/post/uber-clone-nextjs-appwrite) on the Appwrite blog.

## License

MIT
