Router.configure({
    layoutTemplate: 'main',
    loadingTemplate: 'loading',
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


Router.route('Infos',{
    template: 'Infos',
    path: '/Infos',
    name: 'Infos'
});

Router.route('Download',{
    template: 'Download',
    path: '/Download',
    name: 'Download'
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
        //return Contacts.findOne({'_id':new Meteor.Collection.ObjectID(this.params._id)});
    },
    waitOn:function(){
      return [
        //Meteor.subscribe("Contacts",new Meteor.Collection.ObjectID(this.params._id)),
        //Meteor.subscribe("Delegates",new Meteor.Collection.ObjectID(this.params._id))
      ]
    },
    onBeforeAction:function(){
      //Session.set('SelectedContact',new Meteor.Collection.ObjectID(this.params._id));
      //console.log(Session.get('SelectedContact'));
      this.next();
    }
});
