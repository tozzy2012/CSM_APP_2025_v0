# Zapper CS - Project Fixes

I have unified the backend and frontend into a single Docker Compose configuration.

## Changes Made

1.  **Backend Unification**:
    *   Created `server/Dockerfile` to run the Python FastAPI application.
    *   Created `server/requirements.txt` with all necessary dependencies (FastAPI, SQLAlchemy, OpenAI, etc.).
    *   Updated `server/main.py` to correctly initialize the database tables on startup and use configured CORS settings.

2.  **Frontend Configuration**:
    *   Created `client/Dockerfile` to run the React/Vite application.
    *   Ensured `vite.config.ts` points to the correct backend URL.

3.  **Orchestration**:
    *   Rewrote `docker-compose.yml` to run:
        *   `postgres`: Database
        *   `redis`: Cache
        *   `backend`: The Python API (Port 8000)
        *   `frontend`: The React App (Port 3003)

## How to Run

1.  **Prerequisites**: Ensure you have Docker Desktop installed and running.
2.  **Start**: Double-click `start.bat` or run:
    ```bash
    docker-compose up --build
    ```
3.  **Access**:
    *   Frontend: [http://localhost:3003](http://localhost:3003)
    *   Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## Notes

*   The database will be initialized automatically on the first run.
*   If you need to add more Python dependencies, add them to `server/requirements.txt` and rebuild.
