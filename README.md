# read-fb-zip
Module to allow reading of facebook export

  var fbzip = require('read-fb-zip');

  fbzip.process({
    file:'/root/fbdata.zip',
    onLink:function(url){
      console.log('link: '+url)
    },
    onImage:function(path){
      console.log('image: '+path)
    },
    onVideo:function(path){
      console.log('video: '+path)
    }
  })
