# Python Backend Server

Token provisioning server for Gemini Live API ephemeral tokens.

## Quick Start

```bash
cd python-server
source venv/bin/activate
python main.py
```

Server runs at `http://localhost:8080`

## Prerequisites

- Python 3.10+
- Virtual environment with dependencies installed
- `firebase-service-account.json` in this directory
- `.env` file with `GEMINI_API_KEY`

## Setup (First Time)

```bash
cd python-server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Environment Variables

Create `.env` in the `python-server` directory:

```env
GEMINI_API_KEY=your-gemini-api-key
PORT=8080
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/token` | POST | Get ephemeral Gemini token |
| `/api/analytics` | GET | Teacher analytics data |
| `/api/review/generate` | POST | Generate weekly review lesson |

## Frontend Configuration

Ensure the frontend `.env` has:

```env
VITE_API_URL=http://localhost:8080
```

Restart the frontend dev server after changing env variables.

## Troubleshooting

**Connection Refused**: Check the port matches between frontend `VITE_API_URL` and backend `PORT`.

**Token Errors**: Verify `GEMINI_API_KEY` is valid and `firebase-service-account.json` exists.
