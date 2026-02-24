#!/bin/bash
set -e

echo "Initializing environment..."

# 1. Create Python venv if missing
if [ ! -d "backend/.venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv backend/.venv
fi

# 2. Install backend dependencies
echo "Installing backend dependencies..."
./backend/.venv/bin/pip install -r backend/requirements.txt || echo "No requirements found."

# 3. Install pre-commit (Global tool for Git)
echo "Setting up Git protection (pre-commit)..."
pip3 install pre-commit --break-system-packages --no-warn-script-location

# 4. Install the Git hooks
# This ensures every commit is formatted by Black/Prettier
if [ -f ".pre-commit-config.yaml" ]; then
    pre-commit install
    echo "Git hooks installed."
else
    echo ".pre-commit-config.yaml missing. Skipping hook setup."
fi

echo "Environment ready."
