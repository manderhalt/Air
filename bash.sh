#!/bin/bash
gnome-terminal --working-diretory="~/Github/Air" --tab -e "mongod --dbpath ./.meteor/local/db/ --port 3002 --setParameter textSearchEnabled=true" --tab -e "export MONGO_URL=mongodb://127.0.0.1:3002/meteor;meteor" --tab -e "mongo --port 3002 meteor" --tab -e "ipython"
