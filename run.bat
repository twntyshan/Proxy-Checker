@off
title Menjalankan ProProxy Checker...
cls
echo ==================================================
echo   MENGAKTIFKAN SERVER PROPROXY... MOHON TUNGGU
echo ==================================================
echo.

:: Masuk ke folder project Anda
cd /d C:\Users\Shan\Desktop\PROXCHEK

:: Jalankan server secara background dan otomatis buka browser Chrome
start /b node server.js
timeout /t 2 >nul
start http://localhost:3000

echo.
echo ==================================================
echo   SERVER AKTIF! JANGAN TUTUP JENDELA INI
echo   JIKA SUDAH SELESAI, TEKAN 'Ctrl + C' DI SINI
echo ==================================================
pause