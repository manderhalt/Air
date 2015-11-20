Meteor.publish("Stations",function(){
    return Stations.find({},{fields:{name:1,location:1}});
});
