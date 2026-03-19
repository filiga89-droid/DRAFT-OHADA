@echo off
chcp 65001 >nul
title OHADA Draft - Installation
color 1F
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║          OHADA Draft - Installation                 ║
echo ║    Application de documents juridiques OHADA        ║
echo ╚══════════════════════════════════════════════════════╝
echo.

:: Vérifier que Node.js est installé
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 4F
    echo ❌ ERREUR : Node.js n'est pas installé !
    echo.
    echo    Veuillez d'abord installer Node.js :
    echo    1. Allez sur https://nodejs.org
    echo    2. Téléchargez la version LTS
    echo    3. Installez-le et redémarrez votre PC
    echo    4. Relancez ce fichier
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js détecté
echo.

:: Installation des dépendances
echo ⏳ Installation des dépendances (cela peut prendre 1-2 minutes)...
echo.
call npm install
if %ERRORLEVEL% neq 0 (
    color 4F
    echo.
    echo ❌ ERREUR lors de l'installation des dépendances.
    echo    Vérifiez votre connexion internet et relancez ce fichier.
    echo.
    pause
    exit /b 1
)
echo.
echo ✅ Dépendances installées
echo.

:: Génération des templates Word
echo ⏳ Génération des modèles Word...
call node scripts/generate-templates.js
if %ERRORLEVEL% neq 0 (
    color 4F
    echo.
    echo ❌ ERREUR lors de la génération des modèles.
    echo.
    pause
    exit /b 1
)
echo.
echo ✅ Modèles Word générés
echo.

:: Terminé
color 2F
echo ╔══════════════════════════════════════════════════════╗
echo ║       ✅ Installation terminée avec succès !        ║
echo ║                                                      ║
echo ║  Pour lancer l'application, double-cliquez sur :    ║
echo ║  👉  LANCER.bat                                     ║
echo ╚══════════════════════════════════════════════════════╝
echo.
pause
