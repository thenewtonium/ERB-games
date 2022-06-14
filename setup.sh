#!/usr/bin/env bash

cd $BASH_SOURCE
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm install 16.15.1
nvm use 16.15.1
npm install

node deploy-commands-global.js

corepack enable
yarn global add pm2

export PATH="${HOME}/.yarn/bin:${PATH}"

pm2 start index.js --name MadLibs
pm2 save