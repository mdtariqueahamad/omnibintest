@echo off
echo ===================================================
echo Starting OmniBin Smart Waste Management System
echo ===================================================

echo [1/3] Starting FastAPI Backend Server...
start "OmniBin Backend" cmd /k "call venv\Scripts\activate && uvicorn app.main:app --reload"

echo [2/3] Starting MQTT IoT Listener Service...
start "OmniBin MQTT Listener" cmd /k "call venv\Scripts\activate && python mqtt_listener.py"

echo [3/3] Starting React Frontend Application...
start "OmniBin Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services have been launched in separate windows!
echo - Backend available at: http://127.0.0.1:8000/docs
echo - Frontend available at: http://localhost:5173
echo.
pause
