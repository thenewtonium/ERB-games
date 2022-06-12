#!/usr/bin/env bash

#cd $BASH_SOURCE
export PATH="${HOME}/.yarn/bin:${PATH}"

pm2 stop MadLibs
pm2 save --force