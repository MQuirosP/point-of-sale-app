@echo off

cd /d "C:\Proyectos\verduleria-app"
start cmd /k npm start

cd /d "C:\Proyectos\verduleria-app\frontend"
start cmd /k pm2 start start-server.js --name "verduleria-app" --no-autorestart
