exports.printMsg = function() {
  console.log("This is a message from the demo package");
}
exports.process = function(opts){
	var unzip=require('unzip');
	var app={
		out:{},
		init:function(opts){
			var self=this;
			self.fs=require('fs');
			self.cheerio=require('cheerio');
			self.md5File = require('md5-file');
			self.async = require('async');
			self.opts=opts;
			self.unzip(function(){
				self.processData();
			})
		},
		unzip:function(cb){
			var self=this;
			self.md5File(opts.file,function(err,hash){
				if(err){
					console.log('The file ['+opts.file+'] does not exist!');
					return false;
				}
				self.saveto='/tmp/'+hash;

				self.fs.stat(self.saveto, function (err, stats) {
					if(err){//doesnt exist		
						console.log('unzipping')		
						self.fs.createReadStream(opts.file).pipe(unzip.Extract({ path: self.saveto })).on('close', function (entry) {
		            		cb()
		            	});
					}else{
						console.log('already unzipped!')
						cb()
					}
		            
		        });
			})
		},
		findUrls:function( text ){
		    var source = (text || '').toString();
		    var urlArray = [];
		    var url;
		    var matchArray;

		    // Regular expression to find FTP, HTTP(S) and email URLs.
		    var regexToken = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g;

		    // Iterate through any URLs in the text.
		    while( (matchArray = regexToken.exec( source )) !== null )
		    {
		        var token = matchArray[0];
		        urlArray.push( token );
		    }

		    return urlArray;
		},
		getDirectoryContents:function(path,cb){
			var self=this;
			var items=self.fs.readdirSync(path);
			var out={};	
			var returnobj=[]	 
		    for (var i=0; i<items.length; i++) {
		    	if(items[i]=='index.htm') continue;
		    	var tpath=path+'/'+items[i];
		    	if(self.fs.lstatSync(tpath).isDirectory()){
		    		out[items[i]]=self.getDirectoryContents(tpath);
		    	}else{
		    		returnobj.push(tpath);
		    	}
		    }
		    //console.log(out)
		    if(cb) cb(out);
		    else return returnobj;
		},
		getDirectoryContents2:function(path,cb){
			var self=this;
			var items=self.fs.readdirSync(path);
			var out={};	
		    for (var i=0; i<items.length; i++) {
		    	if(items[i]=='index.htm') continue;
		    	var tpath=path+'/'+items[i];
		    	var p=items[i].split('.');
		    	if(!out[p[0]]) out[p[0]]={};
		    	if(p[1]=='mp4'){
		    		out[p[0]]['video']=tpath;
		    	}else{
		    		out[p[0]]['cover']=tpath;
		    	}
		    }
		    //console.log(out)
		    cb(out);
		},
		processData:function(){
			var self=this;
			var queue = self.async.queue(function (opts, fin) {
			    switch(opts.type){
			    	case 'links':
			    		self.fs.readFile(self.saveto+'/html/timeline.htm', 'utf8', function(err, data){
						 if (err){
						     return console.log(err);
						 }
						 var $ = self.cheerio.load(data);
						 app.out.links=[];
						 $('.comment').each(function(i,v){
						 	var text=$(v).text();
						 	var urls=self.findUrls(text);
						 	if(urls.length){
						 		for (var i = 0; i < urls.length; i++) {
						 			var v=urls[i];
						 			if(self.opts.onLink) self.opts.onLink(v);
						 			app.out.links.push(v);
						 		};
						 	}
						 })
						 fin();
						});
			    	break;
			    	case 'photos':
			    		self.getDirectoryContents(self.saveto+'/photos',function(data){
							if(self.opts.onImage){
								for(album in data){
									var talbum=data[album];
									for (var i = 0; i < talbum.length; i++) {
										var img=talbum[i];
										self.opts.onImage(img,album);
									};
								}
							}
							app.out.images=data;
							fin();
						});
			    	break;
			    	case 'videos':
			    		self.getDirectoryContents2(self.saveto+'/videos',function(data){
							if(self.opts.onVideo){
								for (video in data) {
									var tvideo=data[video];
									self.opts.onVideo(tvideo,video);
								};
							}
							app.out.videos=data;
							fin();
						});
			    	break;
			    }
			}, 100);
			queue.drain = function() {
				if(app.opts.onComplete) app.opts.onComplete(app.out)
		        process.exit(0);
			}
			queue.push({
				type:'links'
			})
			queue.push({
				type:'photos'
			})
			queue.push({
				type:'videos'
			})
		}
	}
	app.init(opts);
}