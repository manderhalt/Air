# Air

Start a MongoDB Instance
```
mongod --dbpath ./.meteor/local/db/ --port 3002 --setParameter textSearchEnabled=true
```

Start meteor with the Mongo Instance
```
export MONGO_URL=mongodb://127.0.0.1:3002/meteor
meteor
```

Start a Mongo shell
```
mongo --port 3002 meteor
```
