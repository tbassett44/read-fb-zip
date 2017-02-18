exports.printMsg = function() {
  console.log("This is a message from the demo package");
}
exports.process = function(opts){
	var unzip=require('unzip');
	var app={
		init:function(opts){
			var self=this;
			self.fs=require('fs');
			self.cheerio=require('cheerio');
			self.md5File = require('md5-file');
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
		processData:function(){
			var self=this;
			self.fs.readFile(self.saveto+'/html/timeline.htm', 'utf8', function(err, data){
			 if (err){
			     return console.log(err);
			 }
			 var $ = self.cheerio.load(data);
			 $('.comment').each(function(i,v){
			 	var text=$(v).text();
			 	var urls=self.findUrls(text);
			 	if(urls.length){
			 		for (var i = 0; i < urls.length; i++) {
			 			var v=urls[i];
			 			self.opts.onLink(v);
			 		};
			 	}
			 })
			});
			self.fs.readFile(self.saveto+'/html/photos.htm', 'utf8', function(err, data){
			 if (err){
			     return console.log(err);
			 }
			 var $ = self.cheerio.load(data);
			 $('.block').each(function(i,v){
			 	var img=$(v).find('img').attr('src').replace('../',self.saveto+'/');
			 	self.opts.onImage(img);
			 })
			});
			self.fs.readFile(self.saveto+'/html/videos.htm', 'utf8', function(err, data){
			 if (err){
			     return console.log(err);
			 }
			 var $ = self.cheerio.load(data);
			 $('.block').each(function(i,v){
			 	var vid=$(v).find('a').attr('href').replace('../',self.saveto+'/');
			 	self.opts.onVideo(vid);
			 })
			});
		}
	}
	app.init(opts);
}