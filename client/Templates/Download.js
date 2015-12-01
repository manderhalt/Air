Template.Download.helpers({
  // geo query of the nearest station based on a 2d sphere index
  Stations:function(){
    var s = Stations.find().map(function(x){
      x['RRFile'] = '/data/EOBS/Precipitations/RR_STAID'+pad(x['sta_id'],6,0)+'.txt';
      x['TFile'] = '/data/EOBS/Temperatures/TG_STAID'+pad(x['sta_id'],6,0)+'.txt';
      return x;
    })
    console.log(s)
    return s
  }
})
