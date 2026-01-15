#!/bin/bash

# Kill running node processes (optional, un-comment if you want to force kill old servers first)
# pkill -f "node"

echo "Starting Backend on Port 5001..."
# Open a new terminal tab for the backend
osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'/server\" && npm run dev"'

echo "Starting Frontend..."
# Open a new terminal tab for the frontend
osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'\" && npm run dev"'

echo "Servers starting in separate tabs!"
