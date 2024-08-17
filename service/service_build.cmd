@echo on
setlocal enabledelayedexpansion

set LOG_FILE=build.log

:: Change to service directory and build
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
rd /s /q hhuuDeploy\templates

echo Creating necessary directories...
mkdir hhuuDeploy\dist
mkdir hhuuDeploy\templates

:: Copy files to deploy directories
echo Copying files...
copy service\pm2.conf.json hhuuDeploy\pm2.conf.json
copy service\package.json hhuuDeploy\package.json
copy service\README.md hhuuDeploy\README.md
copy service\.env.example hhuuDeploy\.env.example

xcopy /e /i /y service\templates hhuuDeploy\templates
xcopy /e /i /y service\dist hhuuDeploy\dist

cd service

echo Build completed >> %LOG_FILE%