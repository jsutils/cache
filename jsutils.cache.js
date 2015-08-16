define({
	name : 'jsutils.cache',
	modules : ['jsutils.json']
}).as(function(cache,json) {

	var localStorage = window.localStorage || module('jsutils.cache.cookies');
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
		this.tables = {};
	};
	_cache_.set = function(key,value){
		return localStorage.setItem(this.id + "#" + key,json.stringify({ 'time' : '0', text : value}));
	};
	_cache_.has = function(key){
		var value = localStorage.getItem(this.id + "#"+ key);
		return (typeof value === 'string');
	};
	_cache_.get = function(key){
		var xString = localStorage.getItem(this.id + "#"+ key);
		var x = json.parse(xString)
		return (x==undefined) ? null : x.text;
	};
	
	_cache_.saveText = function(key,value){
		if(typeof value !== "string"){
			return localStorage.setItem(this.id + "#" + key,json.stringify(value));
		} else {
			return localStorage.setItem(this.id + "#" + key,value);
		}
	};
	
	_cache_.getText = function(key){
		return localStorage.getItem(this.id + "#"+ key)
	};
	
	_cache_.load = function(key,fallback,updateCache){
		var self = this;
		var D = $.Deferred(function(_D){
			if(updateCache!=true && self.has(key)){
				_D.resolve(self.get(key));
			} else if(fallback !== undefined){
				console.info("lokking for",key)
				if(self.has(key)){
					_D.notify(self.get(key));
				}
				var p2 = fallback();
				if(typeof p2.done === 'function'){
					p2.done(function(resp3){
						self.set(key,resp3)
						_D.notify(resp3);
						_D.resolve(resp3);
					});					
				} else {
					self.set(key,p2)
					_D.notify(p2);
					_D.resolve(p2);
				}
			} else {
				_D.reject(key);
			}
		});
		var p = D.promise();
		return  p;
	};
	
	var CacheTable = function CacheTable(records){
		this.push.apply(this,records);
	};
	CacheTable.prototype = new Array();
	
	_cache_.table = function(tablename){
		if(this.tables[tablename]){
			return this.tables[tablename];
		}
		var tableCache = this.get("#_TABLE_");
		if(tableCache == null){
			tableCache = { list : table , _index_ : null}
			this.set("#_TABLE_",tableCache);
		}
		this.tables[tablename] = new CacheTable(tableCache.list);
		this.tables[tablename].index(tableCache._index_);
		this.tables[tablename]._cacheid_ = this.id
		return this.tables[tablename];
	};
	
	CacheTable.prototype.index = function(fun){
		this._index_ = fun;
	};
	CacheTable.prototype.save = function(fun){
		this._index_ = fun;
	};
	
	cache._execute_ = function(){
		var APP_VERSION = localStorage.getItem("APP_VERSION");
		var CONFIG = utils.config.get();
		if(CONFIG.version !== APP_VERSION){
			for(var i in localStorage){
				delete localStorage[i];
			}
		}
		localStorage.setItem("APP_VERSION",CONFIG.version);
		defaultCache = cache.instance();
	};
	
	cache._ready_ = function(){ 
	};
	
});