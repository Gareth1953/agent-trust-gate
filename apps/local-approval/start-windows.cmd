@echo off
setlocal
title ATG Local Synthetic Approval Evaluation
cd /d "%~dp0..\.."
where node >nul 2>nul
if errorlevel 1 goto missingnode
for /f "delims=" %%V in ('node -p "Number(process.versions.node.split('.')[0])"') do set "ATG_NODE_MAJOR=%%V"
if %ATG_NODE_MAJOR% LSS 24 goto missingnode
echo Preparing the source-only LOCAL SYNTHETIC evaluation. No money moves.
call npm ci --ignore-scripts
if errorlevel 1 goto failed
call npm run build --silent
if errorlevel 1 goto failed
call npm ci --ignore-scripts --prefix apps/local-approval
if errorlevel 1 goto failed
for /f "delims=" %%V in ('node -p "'approval-evaluation-'+Date.now()"') do set "ATG_EVALUATION_NAME=%%V"
set "ATG_APPROVAL_STATE=%LOCALAPPDATA%\AgentTrustGate\%ATG_EVALUATION_NAME%"
if not exist "%LOCALAPPDATA%\AgentTrustGate" mkdir "%LOCALAPPDATA%\AgentTrustGate"
node apps/local-approval/server.mjs setup "%ATG_APPROVAL_STATE%"
if errorlevel 1 goto failed
echo.
echo Your private one-time code follows. Enter it only at http://localhost:8796
type "%ATG_APPROVAL_STATE%\enrollment-code.txt"
echo.
echo Keep this terminal open. Open the localhost address after the server starts.
echo To restart THIS evaluation later, use:
echo node apps/local-approval/server.mjs serve "%ATG_APPROVAL_STATE%"
echo.
node apps/local-approval/server.mjs serve "%ATG_APPROVAL_STATE%"
if errorlevel 1 goto failed
goto finished
:missingnode
echo Install Node.js 24 LTS from https://nodejs.org/ and run this again.
goto finished
:failed
echo Setup or startup stopped. Do not erase existing state or bypass a refusal.
echo Read apps\local-approval\README.md for next steps.
:finished
pause
endlocal
