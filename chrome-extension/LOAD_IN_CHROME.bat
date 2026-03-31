@echo off
REM Quick script to open Chrome extensions page
REM This helps you load the TRUST SENSE extension

echo Opening Chrome Extensions Page...
echo.
echo Instructions:
echo 1. Chrome will open with the extensions page (chrome://extensions/)
echo 2. Enable "Developer mode" (top-right toggle)
echo 3. Click "Load unpacked"
echo 4. Navigate to: chrome-extension folder in this project
echo 5. Click Select Folder
echo.
echo The TRUST SENSE extension will appear in your extensions list!
echo.

start chrome://extensions/

echo Press any key when extension is loaded...
pause

echo.
echo Next: Open a webpage and click the TRUST SENSE extension icon!
echo Try these test sites:
echo   - https://www.wikipedia.org
echo   - https://www.bbc.com
echo   - https://www.reddit.com
echo.
pause
