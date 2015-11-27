Meteor.subscribe('Stations');

Tracker.autorun(function () {
  console.log(Session.get("SelectedStation"))
  Meteor.subscribe('Climat',Session.get("SelectedStation"));
})
