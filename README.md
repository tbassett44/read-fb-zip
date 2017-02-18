# Read Facebook Export Zip
Module to allow reading of facebook export
# Install
        npm install read-fb-zip
# Example Script
        var fbzip = require('read-fb-zip');

        fbzip.process({
                file:'/path-to-fbdata.zip',
                onLink:function(url){
                        //console.log('link: '+url)
                },
                onImage:function(image,album){
                        //console.log('album: '+album+' image: '+image)
                },
                onVideo:function(video,id){
                        //console.log('video: '+JSON.stringify(video)+' id: '+id)
                },
                onComplete:function(data){
                        console.log(data);
                }
        })
