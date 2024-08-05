#!/bin/bash

set -e

echo "Changing to admin directory..."
cd admin/
pnpm build
cd ..

echo "Changing to chat directory..."
cd chat/
pnpm build
cd ..

echo "Changing to service directory..."
cd service/
pnpm build
cd ..

echo "Cleaning hhuuDeploy directory..."
rm -rf hhuuDeploy/dist/* hhuuDeploy/public/* hhuuDeploy/templates/*

echo "Creating necessary directories..."
mkdir -p hhuuDeploy/dist hhuuDeploy/public/admin hhuuDeploy/templates

echo "Copying files..."
cp service/pm2.conf.json hhuuDeploy/pm2.conf.json
cp service/package.json hhuuDeploy/package.json
cp service/README.md hhuuDeploy/README.md
cp service/.env.example hhuuDeploy/.env.example

cp -r service/templates/* hhuuDeploy/templates
cp -r service/dist/* hhuuDeploy/dist
cp -r admin/dist/* hhuuDeploy/public/admin
cp -r chat/dist/* hhuuDeploy/public

echo "build completed"
