@echo off
setlocal
echo ===================================================
echo   Khoi dong DBeaver voi du an VAMOS STORE
echo ===================================================

set DBEAVER_EXE=%LOCALAPPDATA%\DBeaver\dbeaver.exe
if not exist "%DBEAVER_EXE%" (
    set DBEAVER_EXE=C:\Program Files\DBeaver\dbeaver.exe
)

if exist "%DBEAVER_EXE%" (
    echo Tim thay DBeaver tai: %DBEAVER_EXE%
    start "" "%DBEAVER_EXE%"
) else (
    echo Khong tim thay dbeaver.exe tu dong. Dang thu goi lenh 'dbeaver'...
    start "" dbeaver
)
