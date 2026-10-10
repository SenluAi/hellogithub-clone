@echo off
cd /d "%~dp0"
"C:\Program Files\nodejs\node.exe" "%~dp0update.js" %* >> "%~dp0update-stdout.log" 2>&1
