# BlockFinax Frontend

React + TypeScript frontend application for the BlockFinax cryptocurrency escrow platform.

## Features

- Modern React 18 with TypeScript
- Responsive UI with Tailwind CSS and Radix UI components
- Real-time updates with React Query
- Form handling with React Hook Form + Zod validation
- Client-side routing with Wouter
- Cryptocurrency integration with OnchainKit
- Interactive charts and data visualization

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, Radix UI, Framer Motion
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: Wouter
- **Form Handling**: React Hook Form + Zod
- **Crypto**: Coinbase OnchainKit, Ethers.js
- **Charts**: Recharts
- **UI Components**: Radix UI primitives

## Project Structure

```
frontend/
├── src/
│   ├── components/    # Reusable React components
│   ├── pages/        # Page components and routing
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions and configurations
│   └── types/        # TypeScript type definitions
├── shared/           # Shared schemas and types with backend
├── attached_assets/  # Static assets (images, logos, etc.)
└── public/          # Public assets served by Vite
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Type check with TypeScript

## Environment Setup

The frontend communicates with the backend API. Make sure the backend is running on the expected port (usually :3000).

## Key Components

- **Authentication**: User login/register flows
- **Dashboard**: Main user interface with wallet and transaction views
- **Escrow Management**: Create, manage, and track escrow transactions
- **Profile Management**: User profile and settings
- **Admin Panel**: Administrative functions and monitoring
- **Referral System**: User referral tracking and rewards

## Styling

This project uses:
- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible component primitives
- **Framer Motion** for animations
- **Custom CSS** for specific component styling

## API Integration

The frontend integrates with:
- Backend REST API for core functionality
- WebSocket connection for real-time updates
- Blockchain networks via OnchainKit
- External crypto services

## Build for Production

```bash
npm run build
```

Built files will be in the `dist/` directory, ready to be served by any static hosting service.
