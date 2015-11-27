Meteor.publish("Stations",function(){
    return Stations.find({},{fields:{name:1,location:1}});
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
