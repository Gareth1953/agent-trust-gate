@echo off
setlocal EnableExtensions EnableDelayedExpansion
title ATG Resume Existing Local Approval (Retain Passkey)
cd /d "%~dp0..\.."
echo This resumes a PREVIOUS local synthetic evaluation. It never runs setup.
echo Before proceeding, close the old ATG application with Ctrl+C.
echo No real money moves. Never paste passkeys, PINs or local state into chat.
echo.
where node >nul 2>nul
if errorlevel 1 goto missingnode
for /f "delims=" %%V in ('node -p "Number(process.versions.node.split('.')[0])"') do set "ATG_NODE_MAJOR=%%V"
if !ATG_NODE_MAJOR! LSS 24 goto missingnode
set "ATG_FOUND=0"
set "ATG_STATE="
if not exist "%LOCALAPPDATA%\AgentTrustGate" goto nostate
for /d %%D in ("%LOCALAPPDATA%\AgentTrustGate\approval-evaluation-*") do (
  if exist "%%~fD\approval.sqlite" if exist "%%~fD\witness.sqlite" (
    set /a ATG_FOUND+=1
    set "ATG_STATE=%%~fD"
  )
)
if !ATG_FOUND! EQU 0 goto nostate
if not !ATG_FOUND! EQU 1 goto ambiguous
echo Found exactly one existing evaluation. It will be reused, not reset.
echo Preparing updated application source...
call npm ci --ignore-scripts
if errorlevel 1 goto failed
call npm run build --silent
if errorlevel 1 goto failed
call npm ci --ignore-scripts --prefix apps/local-approval
if errorlevel 1 goto failed
echo.
echo Resuming the existing passkey and transaction record. No fresh setup.
echo Open http://localhost:8796 in Microsoft Edge after startup.
node apps/local-approval/server.mjs serve "!ATG_STATE!"
if errorlevel 1 goto failed
goto finished
:ambiguous
echo Multiple existing evaluations found. No one was selected or changed.
echo See apps\local-approval\README.md for a manual serve command using
echo the exact previously recorded private state folder.
goto finished
:nostate
echo No existing local approval evaluation was found. Nothing was changed.
echo Do NOT make a new enrollment just to work around a sign-in error.
goto finished
:missingnode
echo Node.js 24 or newer is required. No evaluation state was changed.
goto finished
:failed
echo Resume stopped. Your existing evaluation and passkey were not reset.
echo Confirm the previous ATG server is closed. Do not delete server.lock
echo unless the local guide's stale-lock verification procedure is followed.
:finished
pause
endlocal
