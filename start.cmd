@echo off
rem Startet den Entwicklungsserver und oeffnet die Seite im Browser (Node.js erforderlich).
cd /d "%~dp0"
start "" "http://127.0.0.1:8080/"
node tools\serve.mjs 8080
