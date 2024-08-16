@echo on
setlocal enabledelayedexpansion

set LOG_FILE=build.log

:: Change to admin directory and build
echo Changing to admin directory...
cd admin
if %errorlevel% neq 0 (
    echo Failed to change to admin directory >> %LOG_FILE%
    exit /b %errorlevel%
)
echo Current directory: %cd% >> %LOG_FILE%

echo Running pnpm build in admin directory...
call pnpm build
if %errorlevel% neq 0 (
    echo Failed to run pnpm build in admin directory >> %LOG_FILE%
    exit /b %errorlevel%
)
cd ..

:: Change to chat directory and build
echo Changing to chat directory...
cd chat
if %errorlevel% neq 0 (
    echo Failed to change to chat directory >> %LOG_FILE%
    exit /b %errorlevel%
)
echo Current directory: %cd% >> %LOG_FILE%

echo Running pnpm build in chat directory...
call pnpm build
if %errorlevel% neq 0 (
    echo Failed to run pnpm build in chat directory >> %LOG_FILE%
    exit /b %errorlevel%
)
cd ..

:: Change to service directory and build
echo Changing to service directory...
cd service
if %errorlevel% neq 0 (
    echo Failed to change to service directory >> %LOG_FILE%
    exit /b %errorlevel%
)
echo Current directory: %cd% >> %LOG_FILE%

echo Running pnpm build in service directory...
call pnpm build
if %errorlevel% neq 0 (
    echo Failed to run pnpm build in service directory >> %LOG_FILE%
    exit /b %errorlevel%
)
cd ..

:: Clean and prepare deploy directories
echo Cleaning hhuuDeploy directory...
rd /s /q hhuuDeploy\dist
rd /s /q hhuuDeploy\public
rd /s /q hhuuDeploy\templates

echo Creating necessary directories...
mkdir hhuuDeploy\dist
mkdir hhuuDeploy\public\admin
mkdir hhuuDeploy\templates

:: Copy files to deploy directories
echo Copying files...
copy service\pm2.conf.json hhuuDeploy\pm2.conf.json
copy service\package.json hhuuDeploy\package.json
copy service\README.md hhuuDeploy\README.md
copy service\.env.example hhuuDeploy\.env.example

xcopy /e /i /y service\templates hhuuDeploy\templates
xcopy /e /i /y service\dist hhuuDeploy\dist
xcopy /e /i /y admin\dist hhuuDeploy\public\admin
xcopy /e /i /y chat\dist hhuuDeploy\public

echo Build completed >> %LOG_FILE%