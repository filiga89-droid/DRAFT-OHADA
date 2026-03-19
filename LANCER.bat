@echo off
chcp 65001 >nul
title OHADA Draft
color 1F
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║            OHADA Draft - Démarrage                  ║
echo ╚══════════════════════════════════════════════════════╝
echo.

:: Vérifier que Node.js est installé
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 4F
    echo ❌ Node.js n'est pas installé.
    echo    Lancez d'abord INSTALLER.bat
    echo.
    pause
    exit /b 1
)

:: Vérifier que les dépendances sont installées
if not exist "node_modules" (
    color 4F
    echo ❌ Les dépendances ne sont pas installées.
    echo    Lancez d'abord INSTALLER.bat
    echo.
    pause
    exit /b 1
)

echo ⏳ Lancement de OHADA Draft...
echo    (une fenêtre va s'ouvrir dans quelques secondes)
echo.
echo    Pour fermer : fermez la fenêtre de l'application
echo    ou appuyez sur Ctrl+C ici.
echo.

call npm run electron:dev
