# FRC RAG Frontend

The responsive web interface for the FRC RAG platform - a Retrieval-Augmented Generation platform designed for FIRST Robotics Competition teams.

> **Note:** This repository contains the frontend application. For the backend API server, see [FRC-RAG-Backend](https://github.com/AadiJo/FRC-RAG-Backend).

## Overview

FRC teams often spend time creating new designs for mechanisms that other teams have already built successfully in past seasons. This happens because teams don't have an easy way to see what solutions already exist from previous competitions.

This project creates a searchable database that collects publicly shared technical documents from top-performing FRC teams across different seasons. The system uses RAG (Retrieval-Augmented Generation) technology to help users describe what they need and find relevant designs from past robots.

When teams search for solutions, the system looks through its collection to find mechanisms from earlier seasons that could work for current challenges. For example, a team looking for ways to pick up game pieces in the 2024 Reefscape season might discover that intake designs from the 2022 Rapid React cargo challenge could be modified to work with algae collection. The system shows pictures of actual robots and CAD drawings when available to help teams understand how the mechanisms work.

This tool helps FRC teams build on existing knowledge instead of starting from scratch, saving time and helping teams create better robots by learning from successful designs used by other teams.

## Features

- **Intuitive Query Interface**: Clean, responsive UI for natural language mechanism searches
- **Visual Results Display**: Rich presentation of mechanism solutions with robot photos and CAD screenshots
- **Real-time Streaming**: Live response streaming for immediate feedback during queries
- **Mobile-Responsive Design**: Optimized experience across desktop and mobile devices
- **Authentication**: Secure user authentication powered by Clerk

## What makes FRC RAG different?

Users can upload documents, CAD files, and forum threads in real time, keeping the knowledge base up to date with current season innovations. The system uses multi-season mechanism retrieval and game-piece context mapping to return solutions that are truly relevant to the current challenge. With caching, rate limiting, and real-time monitoring, the platform is designed to be production-ready and deployable, so teams can integrate it into their workflow immediately.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set your environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
CLERK_SECRET_KEY=your-clerk-secret-key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

### 3. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
├── src/                   # Source code
│   ├── app/               # Next.js App Router pages
│   │   ├── api/           # API routes
│   │   ├── sign-in/       # Authentication pages
│   │   └── sign-up/       # Authentication pages
│   ├── components/        # React components
│   │   └── ui/            # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utility functions
├── public/                # Static assets
├── package.json           # Dependencies and scripts
├── tailwind.config.ts     # Tailwind CSS configuration
├── next.config.ts         # Next.js configuration
└── tsconfig.json          # TypeScript configuration
```

## Configuration

Key environment variables (see `.env.example` for full list):

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000` |
| `CLERK_SECRET_KEY` | Clerk authentication secret key | - |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | - |

## Planned Additions

* **Dynamic Source Integration**: Real-time document upload capability letting users add team publications, Chief Delphi threads, and other relevant resources directly to the database during their current session
* **Visual Search Results**: Multi-modal query responses that combine text solution descriptions with corresponding robot photos and CAD screenshots for complete technical understanding
* **Mobile Application**: iOS and Android app providing full platform functionality
* **Shareable Collaboration**: Link generation system enabling teams to share specific search results and findings through persistent URLs for quick information sharing