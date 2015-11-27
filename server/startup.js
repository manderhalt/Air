Meteor.startup(function(){
  // Ensure mongo Indexes at startup
  Stations._ensureIndex({sta_id:1},{unique:1});
  Stations._ensureIndex({location:"2dsphere"})
  Climat._ensureIndex({date:1});
  Climat._ensureIndex({_id_Station:1});
});
