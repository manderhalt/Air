Router.configure({
    layoutTemplate: 'main',
    loadingTemplate: 'loading',
    notFoundTemplate: 'NotFound',
    yieldTemplates: {
        'header': { to: 'header' },
        'footer': { to: 'footer' }
    }
});

Router.route('home',{
    template: 'home',
    path: '/',
    name: 'home'
});

Router.route('Download',{
    template: 'Download',
    path: '/Download',
    name: 'Download',
    waitOn:function(){
      return Meteor.subscribe("Stations")
    }
});

Router.route('Stations',{
    template: 'Stations',
    path: '/Stations',
    name: 'Stations',
    waitOn:function(){
      return Meteor.subscribe("Stations")
    }
});

Router.route('/Station/:_id',{
    template: 'Station',
    path: '/Station/:_id',
    name: 'Station',
    data:function(){
        return Stations.findOne({'_id':new Meteor.Collection.ObjectID(this.params._id)});
    },
    waitOn:function(){
      return Meteor.subscribe("Climat",new Meteor.Collection.ObjectID(this.params._id));

    },
    onBeforeAction:function(){
      Session.set('SelectedStation',new Meteor.Collection.ObjectID(this.params._id));
      console.log(Session.get('SelectedStation'))
      this.next();
    }
});
