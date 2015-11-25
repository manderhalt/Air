Meteor.startup(function(){
  // Ensure mongo Indexes at startup
  console.log('Hello ensure index');
  Stations._ensureIndex({sta_id:1},{unique:1});
  Stations._ensureIndex({location:"2dsphere"})
  Temperatures._ensureIndex({date:1});
  Precipitations._ensureIndex({date:1});
});
