# Integration Consultation Externe - Sommeil

## Overview
This document describes the integration between the sommeil project and the consultation externe system.

## Architecture

### Backend (sommeil-back)
- **Port**: 3000
- **Technology**: NestJS
- **Purpose**: Acts as a proxy/gateway to the consultation externe backend
- **Key Files**:
  - `src/consultations/consultations.module.ts` - Module definition
  - `src/consultations/consultations.controller.ts` - API endpoints
  - `src/consultations/consultations.service.ts` - Service layer with HTTP client

### Frontend (sommeil-front)
- **Port**: 3001 (default Next.js)
- **Technology**: Next.js + React Query
- **Purpose**: UI for sleep consultations with integration to consultation externe
- **Key Files**:
  - `hooks/use-consultations.ts` - React Query hooks for API calls
  - `lib/api/consultation.ts` - API client functions
  - `lib/api/consultation-config.ts` - Configuration for API endpoints
  - `app/(app)/consultation/page.tsx` - Main consultation list page
  - `app/(app)/consultation/traitement/page.tsx` - Consultation treatment page

## Configuration

### Environment Variables

**sommeil-back (.env)**:
```
CONSULTATION_EXTERNE_URL=http://localhost:3001
CONSULTATION_EXTERNE_TOKEN=
PORT=3000
```

**sommeil-front (.env.local)**:
```
NEXT_PUBLIC_CONSULTATION_URL=http://localhost:3000
```

## Features Integrated

### 1. Consultation List (Fil de travail)
- Real-time consultation list from consultation externe
- Filtering by date, status, visit type
- Patient information display
- Arrival status tracking
- Priority sorting (urgent > arrived > normal)

### 2. Consultation Treatment
- **Observation Tab**: Medical diagnosis and notes
- **Paramètres Cliniques Tab**: Clinical parameters (BP, temperature, weight, etc.)
- **Prescriptions Tab**: Integration with prescription service
- Finalization of consultations with all data

### 3. API Endpoints (via sommeil-back)
- `GET /consultations` - List all consultations
- `GET /consultations/:id` - Get consultation details
- `POST /consultations/:id/finalize` - Finalize consultation
- `POST /consultations/:id/traiter` - Process consultation actions
- `GET /consultations/patient/:patientId/history` - Patient history

## Integration Flow

1. **Frontend** calls sommeil-back API via React Query hooks
2. **sommeil-back** proxies requests to consultation externe backend
3. **consultation externe** processes the request and returns data
4. **sommeil-back** returns response to frontend
5. **Frontend** displays data with sleep-specific UI

## Running the Integration

### Prerequisites
- consultation externe backend running on port 3001
- prescription service running (for prescriptions integration)

### Start sommeil-back
```bash
cd D:\sommeil\sommeil-back
npm install
npm run start:dev
```

### Start sommeil-front
```bash
cd D:\sommeil\sommeil-front
npm install
npm run dev
```

## Future Enhancements

- WebSocket integration for real-time updates
- Direct integration with prescription service UI
- Sleep-specific clinical parameters
- Polysomnography results integration
- CPAP treatment tracking
