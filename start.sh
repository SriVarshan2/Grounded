#!/bin/bash
echo "Starting Grounded..."

# Resolve script directory absolute path
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Activate python virtual environment if it exists
if [ -d "$SCRIPT_DIR/venv" ]; then
    echo "Activating virtual environment at $SCRIPT_DIR/venv..."
    source "$SCRIPT_DIR/venv/bin/activate"
fi

# Find correct python command
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "Error: Python is not installed or not in PATH."
    exit 1
fi

# Find correct pip command
if command -v pip3 &>/dev/null; then
    PIP_CMD="pip3"
elif command -v pip &>/dev/null; then
    PIP_CMD="pip"
else
    echo "Error: pip is not installed or not in PATH."
    exit 1
fi

# Backend setup
cd "$SCRIPT_DIR/backend"
$PIP_CMD install -r ../requirements.txt -q
$PYTHON_CMD -m spacy download en_core_web_sm -q

# Find uvicorn (check local virtualenv bin first)
if [ -f "$SCRIPT_DIR/venv/bin/uvicorn" ]; then
    UVICORN_CMD="$SCRIPT_DIR/venv/bin/uvicorn"
elif command -v uvicorn &>/dev/null; then
    UVICORN_CMD="uvicorn"
else
    UVICORN_CMD="$PYTHON_CMD -m uvicorn"
fi

$UVICORN_CMD main:app --reload --port 8000 &
BACKEND_PID=$!
echo "Backend running on http://localhost:8000"

# Frontend setup
cd "$SCRIPT_DIR/frontend"
npm install -q
npm start &
FRONTEND_PID=$!
echo "Frontend running on http://localhost:3000"

echo ""
echo "Grounded is running."
echo "Open http://localhost:3000"
echo ""

# Handle graceful shutdown on Ctrl+C / Exit
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM EXIT

wait
