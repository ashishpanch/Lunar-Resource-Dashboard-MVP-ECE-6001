@echo off
cd /d "%~dp0"
where python >nul 2>&1
if %errorlevel% neq 0 (
  echo Python was not found.
  echo Install Python from https://www.python.org/downloads/
  pause
  exit /b
)
python server.py
pause
