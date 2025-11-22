#!/bin/bash

# Script to initialize restaurant using the web interface
# This triggers the client-side Firebase creation

echo "🍽️  Initializing sample restaurant via web interface..."
echo ""
echo "Opening browser to: http://localhost:3000/admin/init"
echo ""
echo "💡 The page will automatically create the restaurant when you click the button."
echo "   Or you can manually visit: http://localhost:3000/admin/init"
echo ""

# Try to open in browser (macOS)
if command -v open &> /dev/null; then
    open http://localhost:3000/admin/init
    echo "✅ Browser opened! Click 'Create Sample Restaurant' button."
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000/admin/init
    echo "✅ Browser opened! Click 'Create Sample Restaurant' button."
else
    echo "Please visit: http://localhost:3000/admin/init"
fi

