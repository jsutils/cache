utils.define('jqutils.cache', function(cache,_cache_) {

	var json = utils.module('utils.json');
	var localStorage = window.localStorage || utils._module('jqutils.cache.cookies');
	var cacheCounter = 0;
	var defaultCache;
	
	cache.set = function(key,value){
		return defaultCache.set(key,value);
	};
	
	cache.get = function(key){
		return defaultCache.get(key);
	};
	
	cache._instance_ = function Cache(cacheName){
		this.id = cacheName || cacheCounter++;

	};
	
	_cache_.set = function(key,value){
		return localStorage.setItem(this.id + "#" + key,json.stringify({ 'time' : '0', text : value}));
	};
	_cache_.has = function(key){
		return !!localStorage.getItem(this.id + "#"+ key);
	};
	_cache_.get = function(key){
		var x = json.parse(localStorage.getItem(this.id + "#"+ key))
		return (x==undefined) ? null : x.text;
	};
	_cache_.saveText = function(key,value){
		return localStorage.setItem(this.id + "#" + key,value);
	};
	_cache_.getText = function(key){
		return localStorage.getItem(this.id + "#"+ key)
	};
	
	cache._execute_ = function(){
		defaultCache = cache.instance();
	};
	
	cache._ready_ = function(){
		
		
	};
	
});

utils.proxy("jqutils.cache.files").intercept('utils.files').as(function(files,_,intercept){
	
	var file_cache = utils.module('jqutils.cache').instance('file_cache');
	var module_files_url = file_cache.get('module_files_url') || {};
	var module_files_source = utils.module('jqutils.cache').instance('module_files_source');
	var cache_script = false;
	var executed = {};
	
	files.get = function(url,data){
		if(cache_script && module_files_source.has(url)){
			var D  = $.Deferred(function(d){
				d.resolve(module_files_source.get(url));
			});
			return D.promise();
		}
		return $.get.apply(this,arguments).done(function(resp){
			module_files_source.set(url,resp);
		});
	}
	
	files._cssload_ = function(resource){
		if(module_files_source.has(resource.url)){
			return $.when(module_files_source.get(resource.url))
		} else {
			return $.get(resource.url).done(function(resp){
				module_files_source.set(resource.url,resp)
			});
		}
	};
	
	files._jsload_ = function(resource){
		
		var urls = [];
		var module_files = resource.module_files.filter(function(module){
			if(module_files_url[module] !== undefined){
				urls.push(module_files_url[module])
				return false;
			} else return true;
		});
		
		urls = urls.filter(function(url,index){
			return urls.indexOf(url) == index;
		});
		var REQS = urls.map(function(url){
			return files._jsload2_({url : url});
		});
		if(module_files.length>0){
			REQS.push(files._jsload2_(files.prepare_js_request(module_files)))
		}
		return $.when.apply($, REQS);
	};
	
	files._jsload2_ = function(resource){
		var url = resource.url;
		if(cache_script && module_files_source.has(url)){
			var source = module_files_source.getText(url);
			var D  = $.Deferred(function(d){
				if(!executed[url]){
					console.info("executing script...",url);
					executed[url] = true;
					files.execute(source);
				}
				d.resolve(source);
			});
			return D.promise();
		}
		return $.ajax({
			async: resource.async || false,
			url: resource.url,
			dataType: resource.dataType || "script",
			cache : resource.cache || true
		}).done(function(resp){
			if(resource.module_files!==undefined){
				for(var i in resource.module_files){
					module_files_url[resource.module_files[i]] = resource.url
				}
				file_cache.set("module_files_url",module_files_url);
			}
			if(cache_script) module_files_source.saveText(url,files.cleanScriptSource(resp));
		})
	};
	
	files.execute = function(source){
		var script = document.createElement('script');
		script.onload = function() {
		  //optional callback
		};
		script.innerHTML = source;
		return document.body.appendChild(script);
		
		
		try	{
			console.error(source);
			return JSON.parse(source);
		} catch( e ) {
			console.error(source);
			return false;
		}
		//JSON.parse();
		//
	}
	
	files.cleanScriptSource = function(source){
		return source; 
		//return (source+"").replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, '');
		//return source;
		//return source.replace(/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,'');
	}
	
	intercept._config_ = function(config){
		cache_script = config.cache_script;
	};
	
});

