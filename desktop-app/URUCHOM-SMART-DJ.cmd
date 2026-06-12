@echo off
if exist "%~dp0Smart DJ Transition Finder.html" (
  start "" "%~dp0Smart DJ Transition Finder.html"
) else (
  start "" "%~dp0SmartDJTransitionFinder.html"
)
