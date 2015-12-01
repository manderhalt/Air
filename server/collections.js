Meteor.publish("Stations",function(){
  var S = Climat.find({
    date: new Date("2000-01-01T00:00:00Z"),
    temperature:{$ne:null},
    precipitation:{$ne:null}
  }).map(function(x){return x._id_Station})

    return Stations.find({
      _id:{$in:S},
      name:{$ne:"BLAGNAC AEROP. TOULOUSE-BLAGNAC"}
    },{fields:{name:1,location:1,sta_id:1}});
});

Meteor.publish("Climat",function(_id_Station){
  //console.log(_id_Station)
    return Climat.find(
      {
        _id_Station:_id_Station,
        date:{$gte:new Date(2000,0,1),$lt:new Date(2014,0,1)}
      },
      {
        fields:
        {
          date:1,
          _id_Station:1,
          temperature:1,
          precipitation:1
        }
      });
});
