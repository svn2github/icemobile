(function(
	userConfig,
	defaultConfig
){
	// summary:
	//		This is the "source loader" and is the entry point for Dojo during development. You may also load Dojo with
	//		any AMD-compliant loader via the package main module dojo/main.
	// description:
	//		This is the "source loader" for Dojo. It provides an AMD-compliant loader that can be configured
	//		to operate in either synchronous or asynchronous modes. After the loader is defined, dojo is loaded
	//		IAW the package main module dojo/main. In the event you wish to use a foreign loader, you may load dojo as a package
	//		via the package main module dojo/main and this loader is not required; see dojo/package.json for details.
	//
	//		In order to keep compatibility with the v1.x line, this loader includes additional machinery that enables
	//		the dojo.provide, dojo.require et al API. This machinery is loaded by default, but may be dynamically removed
	//		via the has.js API and statically removed via the build system.
	//
	//		This loader includes sniffing machinery to determine the environment; the following environments are supported:
	//
	//		- browser
	//		- node.js
	//		- rhino
	//
	//		This is the so-called "source loader". As such, it includes many optional features that may be discadred by
	//		building a customized verion with the build system.

	// Design and Implementation Notes
	//
	// This is a dojo-specific adaption of bdLoad, donated to the dojo foundation by Altoviso LLC.
	//
	// This function defines an AMD-compliant (http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition)
	// loader that can be configured to operate in either synchronous or asynchronous modes.
	//
	// Since this machinery implements a loader, it does not have the luxury of using a load system and/or
	// leveraging a utility library. This results in an unpleasantly long file; here is a road map of the contents:
	//
	//	 1. Small library for use implementing the loader.
	//	 2. Define the has.js API; this is used throughout the loader to bracket features.
	//	 3. Define the node.js and rhino sniffs and sniff.
	//	 4. Define the loader's data.
	//	 5. Define the configuration machinery.
	//	 6. Define the script element sniffing machinery and sniff for configuration data.
	//	 7. Configure the loader IAW the provided user, default, and sniffing data.
	//	 8. Define the global require function.
	//	 9. Define the module resolution machinery.
	//	10. Define the module and plugin module definition machinery
	//	11. Define the script injection machinery.
	//	12. Define the window load detection.
	//	13. Define the logging API.
	//	14. Define the tracing API.
	//	16. Define the AMD define function.
	//	17. Define the dojo v1.x provide/require machinery--so called "legacy" modes.
	//	18. Publish global variables.
	//
	// Language and Acronyms and Idioms
	//
	// moduleId: a CJS module identifier, (used for public APIs)
	// mid: moduleId (used internally)
	// packageId: a package identifier (used for public APIs)
	// pid: packageId (used internally); the implied system or default package has pid===""
	// pack: package is used internally to reference a package object (since javascript has reserved words including "package")
	// prid: plugin resource identifier
	// The integer constant 1 is used in place of true and 0 in place of false.

	// define a minimal library to help build the loader
	var	noop = function(){
		},

		isEmpty = function(it){
			for(var p in it){
				return 0;
			}
			return 1;
		},

		toString = {}.toString,

		isFunction = function(it){
			return toString.call(it) == "[object Function]";
		},

		isString = function(it){
			return toString.call(it) == "[object String]";
		},

		isArray = function(it){
			return toString.call(it) == "[object Array]";
		},

		forEach = function(vector, callback){
			if(vector){
				for(var i = 0; i < vector.length;){
					callback(vector[i++]);
				}
			}
		},

		mix = function(dest, src){
			for(var p in src){
				dest[p] = src[p];
			}
			return dest;
		},

		makeError = function(error, info){
			return mix(new Error(error), {src:"dojoLoader", info:info});
		},

		uidSeed = 1,

		uid = function(){
			// Returns a unique indentifier (within the lifetime of the document) of the form /_d+/.
			return "_" + uidSeed++;
		},

		// FIXME: how to doc window.require() api

		// this will be the global require function; define it immediately so we can start hanging things off of it
		req = function(
			config,		  //(object, optional) hash of configuration properties
			dependencies, //(array of commonjs.moduleId, optional) list of modules to be loaded before applying callback
			callback	  //(function, optional) lamda expression to apply to module values implied by dependencies
		){
			return contextRequire(config, dependencies, callback, 0, req);
		},

		// the loader uses the has.js API to control feature inclusion/exclusion; define then use throughout
		global = this,

		doc = global.document,

		element = doc && doc.createElement("DiV"),

		has = req.has = function(name){
			return isFunction(hasCache[name]) ? (hasCache[name] = hasCache[name](global, doc, element)) : hasCache[name];
		},

		hasCache = has.cache = defaultConfig.hasCache;

	has.add = function(name, test, now, force){
		(hasCache[name]===undefined || force) && (hasCache[name] = test);
		return now && has(name);
	};

	 0 && has.add("host-node", userConfig.has && "host-node" in userConfig.has ?
		userConfig.has["host-node"] :
		(typeof process == "object" && process.versions && process.versions.node && process.versions.v8));
	if( 0 ){
		// fixup the default config for node.js environment
		require("./_base/configNode.js").config(defaultConfig);
		// remember node's require (with respect to baseUrl==dojo's root)
		defaultConfig.loaderPatch.nodeRequire = require;
	}

	 0 && has.add("host-rhino", userConfig.has && "host-rhino" in userConfig.has ?
		userConfig.has["host-rhino"] :
		(typeof load == "function" && (typeof Packages == "function" || typeof Packages == "object")));
	if( 0 ){
		// owing to rhino's lame feature that hides the source of the script, give the user a way to specify the baseUrl...
		for(var baseUrl = userConfig.baseUrl || ".", arg, rhinoArgs = this.arguments, i = 0; i < rhinoArgs.length;){
			arg = (rhinoArgs[i++] + "").split("=");
			if(arg[0] == "baseUrl"){
				baseUrl = arg[1];
				break;
			}
		}
		load(baseUrl + "/_base/configRhino.js");
		rhinoDojoConfig(defaultConfig, baseUrl, rhinoArgs);
	}

	// userConfig has tests override defaultConfig has tests; do this after the environment detection because
	// the environment detection usually sets some has feature values in the hasCache.
	for(var p in userConfig.has){
		has.add(p, userConfig.has[p], 0, 1);
	}

	//
	// define the loader data
	//

	// the loader will use these like symbols if the loader has the traceApi; otherwise
	// define magic numbers so that modules can be provided as part of defaultConfig
	var	requested = 1,
		arrived = 2,
		nonmodule = 3,
		executing = 4,
		executed = 5;

	if( 0 ){
		// these make debugging nice; but using strings for symbols is a gross rookie error; don't do it for production code
		requested = "requested";
		arrived = "arrived";
		nonmodule = "not-a-module";
		executing = "executing";
		executed = "executed";
	}

	var legacyMode = 0,
		sync = "sync",
		xd = "xd",
		syncExecStack = [],
		dojoRequirePlugin = 0,
		checkDojoRequirePlugin = noop,
		transformToAmd = noop,
		getXhr;
	if( 0 ){
		req.isXdUrl = noop;

		req.initSyncLoader = function(dojoRequirePlugin_, checkDojoRequirePlugin_, transformToAmd_){
			// the first dojo/_base/loader loaded gets to define these variables; they are designed to work
			// in the presense of zero to many mapped dojo/_base/loaders
			if(!dojoRequirePlugin){
				dojoRequirePlugin = dojoRequirePlugin_;
				checkDojoRequirePlugin = checkDojoRequirePlugin_;
				transformToAmd = transformToAmd_;
			}

			return {
				sync:sync,
				requested:requested,
				arrived:arrived,
				nonmodule:nonmodule,
				executing:executing,
				executed:executed,
				syncExecStack:syncExecStack,
				modules:modules,
				execQ:execQ,
				getModule:getModule,
				injectModule:injectModule,
				setArrived:setArrived,
				signal:signal,
				finishExec:finishExec,
				execModule:execModule,
				dojoRequirePlugin:dojoRequirePlugin,
				getLegacyMode:function(){return legacyMode;},
				guardCheckComplete:guardCheckComplete
			};
		};

		if( 1 ){
			// in legacy sync mode, the loader needs a minimal XHR library

			var locationProtocol = location.protocol,
				locationHost = location.host;
			req.isXdUrl = function(url){
				if(/^\./.test(url)){
					// begins with a dot is always relative to page URL; therefore not xdomain
					return false;
				}
				if(/^\/\//.test(url)){
					// for v1.6- backcompat, url starting with // indicates xdomain
					return true;
				}
				// get protocol and host
				// \/+ takes care of the typical file protocol that looks like file:///drive/path/to/file
				// locationHost is falsy if file protocol => if locationProtocol matches and is "file:", || will return false
				var match = url.match(/^([^\/\:]+\:)\/+([^\/]+)/);
				return match && (match[1] != locationProtocol || (locationHost && match[2] != locationHost));
			};


			// note: to get the file:// protocol to work in FF, you must set security.fileuri.strict_origin_policy to false in about:config
			 1 || has.add("dojo-xhr-factory", 1);
			has.add("dojo-force-activex-xhr",  1  && !doc.addEventListener && window.location.protocol == "file:");
			has.add("native-xhr", typeof XMLHttpRequest != "undefined");
			if(has("native-xhr") && !has("dojo-force-activex-xhr")){
				getXhr = function(){
					return new XMLHttpRequest();
				};
			}else{
				// if in the browser an old IE; find an xhr
				for(var XMLHTTP_PROGIDS = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'], progid, i = 0; i < 3;){
					try{
						progid = XMLHTTP_PROGIDS[i++];
						if(new ActiveXObject(progid)){
							// this progid works; therefore, use it from now on
							break;
						}
					}catch(e){
						// squelch; we're just trying to find a good ActiveX progid
						// if they all fail, then progid ends up as the last attempt and that will signal the error
						// the first time the client actually tries to exec an xhr
					}
				}
				getXhr = function(){
					return new ActiveXObject(progid);
				};
			}
			req.getXhr = getXhr;

			has.add("dojo-gettext-api", 1);
			req.getText = function(url, async, onLoad){
				var xhr = getXhr();
				xhr.open('GET', fixupUrl(url), false);
				xhr.send(null);
				if(xhr.status == 200 || (!location.host && !xhr.status)){
					if(onLoad){
						onLoad(xhr.responseText, async);
					}
				}else{
					throw makeError("xhrFailed", xhr.status);
				}
				return xhr.responseText;
			};
		}
	}else{
		req.async = 1;
	}

	//
	// loader eval
	//
	var eval_ =
		// use the function constructor so our eval is scoped close to (but not in) in the global space with minimal pollution
		new Function('return eval(arguments[0]);');

	req.eval =
		function(text, hint){
			return eval_(text + "\r\n////@ sourceURL=" + hint);
		};

	//
	// loader micro events API
	//
	var listenerQueues = {},
		error = "error",
		signal = req.signal = function(type, args){
			var queue = listenerQueues[type];
			// notice we run a copy of the queue; this allows listeners to add/remove
			// other listeners without affecting this particular signal
			forEach(queue && queue.slice(0), function(listener){
				listener.apply(null, isArray(args) ? args : [args]);
			});
		},
		on = req.on = function(type, listener){
			// notice a queue is not created until a client actually connects
			var queue = listenerQueues[type] || (listenerQueues[type] = []);
			queue.push(listener);
			return {
				remove:function(){
					for(var i = 0; i<queue.length; i++){
						if(queue[i]===listener){
							queue.splice(i, 1);
							return;
						}
					}
				}
			};
		};

	// configuration machinery; with an optimized/built defaultConfig, all configuration machinery can be discarded
	// lexical variables hold key loader data structures to help with minification; these may be completely,
	// one-time initialized by defaultConfig for optimized/built versions
	var
		aliases
			// a vector of pairs of [regexs or string, replacement] => (alias, actual)
			= [],

		paths
			// CommonJS paths
			= {},

		pathsMapProg
			// list of (from-path, to-path, regex, length) derived from paths;
			// a "program" to apply paths; see computeMapProg
			= [],

		packs
			// a map from packageId to package configuration object; see fixupPackageInfo
			= {},

		map = req.map
			// AMD map config variable; dojo/_base/kernel needs req.map to figure out the scope map
			= {},

		mapProgs
			// vector of quads as described by computeMapProg; map-key is AMD map key, map-value is AMD map value
			= [],

		modules
			// A hash:(mid) --> (module-object) the module namespace
			//
			// pid: the package identifier to which the module belongs (e.g., "dojo"); "" indicates the system or default package
			// mid: the fully-resolved (i.e., mappings have been applied) module identifier without the package identifier (e.g., "dojo/io/script")
			// url: the URL from which the module was retrieved
			// pack: the package object of the package to which the module belongs
			// executed: 0 => not executed; executing => in the process of tranversing deps and running factory; executed => factory has been executed
			// deps: the dependency vector for this module (vector of modules objects)
			// def: the factory for this module
			// result: the result of the running the factory for this module
			// injected: (0 | requested | arrived) the status of the module; nonmodule means the resource did not call define
			// load: plugin load function; applicable only for plugins
			//
			// Modules go through several phases in creation:
			//
			// 1. Requested: some other module's definition or a require application contained the requested module in
			//	  its dependency vector or executing code explicitly demands a module via req.require.
			//
			// 2. Injected: a script element has been appended to the insert-point element demanding the resource implied by the URL
			//
			// 3. Loaded: the resource injected in [2] has been evalated.
			//
			// 4. Defined: the resource contained a define statement that advised the loader about the module. Notice that some
			//	  resources may just contain a bundle of code and never formally define a module via define
			//
			// 5. Evaluated: the module was defined via define and the loader has evaluated the factory and computed a result.
			= {},

		cacheBust
			// query string to append to module URLs to bust browser cache
			= "",

		cache
			// hash:(mid | url)-->(function | string)
			//
			// A cache of resources. The resources arrive via a config.cache object, which is a hash from either mid --> function or
			// url --> string. The url key is distinguished from the mid key by always containing the prefix "url:". url keys as provided
			// by config.cache always have a string value that represents the contents of the resource at the given url. mid keys as provided
			// by configl.cache always have a function value that causes the same code to execute as if the module was script injected.
			//
			// Both kinds of key-value pairs are entered into cache via the function consumePendingCache, which may relocate keys as given
			// by any mappings *iff* the config.cache was received as part of a module resource request.
			//
			// Further, for mid keys, the implied url is computed and the value is entered into that key as well. This allows mapped modules
			// to retrieve cached items that may have arrived consequent to another namespace.
			//
			 = {},

		urlKeyPrefix
			// the prefix to prepend to a URL key in the cache.
			= "url:",

		pendingCacheInsert
			// hash:(mid)-->(function)
			//
			// Gives a set of cache modules pending entry into cache. When cached modules are published to the loader, they are
			// entered into pendingCacheInsert; modules are then pressed into cache upon (1) AMD define or (2) upon receiving another
			// independent set of cached modules. (1) is the usual case, and this case allows normalizing mids given in the pending
			// cache for the local configuration, possibly relocating modules.
			 = {},

		dojoSniffConfig
			// map of configuration variables
			// give the data-dojo-config as sniffed from the document (if any)
			= {};

	if( 1 ){
		var consumePendingCacheInsert = function(referenceModule){
				var p, item, match, now, m;
				for(p in pendingCacheInsert){
					item = pendingCacheInsert[p];
					match = p.match(/^url\:(.+)/);
					if(match){
						cache[urlKeyPrefix + toUrl(match[1], referenceModule)] =  item;
					}else if(p=="*now"){
						now = item;
					}else if(p!="*noref"){
						m = getModuleInfo(p, referenceModule);
						cache[m.mid] = cache[urlKeyPrefix + m.url] = item;
					}
				}
				if(now){
					now(createRequire(referenceModule));
				}
				pendingCacheInsert = {};
			},

			escapeString = function(s){
				return s.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, function(c){ return "\\" + c; });
			},

			computeMapProg = function(map, dest){
				// This routine takes a map as represented by a JavaScript object and initializes dest, a vector of
				// quads of (map-key, map-value, refex-for-map-key, length-of-map-key), sorted decreasing by length-
				// of-map-key. The regex looks for the map-key followed by either "/" or end-of-string at the beginning
				// of a the search source. Notice the map-value is irrelevent to the algorithm
				dest.splice(0, dest.length);
				for(var p in map){
					dest.push([
						p,
						map[p],
						new RegExp("^" + escapeString(p) + "(\/|$)"),
						p.length]);
				}
				dest.sort(function(lhs, rhs){ return rhs[3] - lhs[3]; });
				return dest;
			},

			fixupPackageInfo = function(packageInfo){
				// calculate the precise (name, location, main, mappings) for a package
				var name = packageInfo.name;
				if(!name){
					// packageInfo must be a string that gives the name
					name = packageInfo;
					packageInfo = {name:name};
				}
				packageInfo = mix({main:"main"}, packageInfo);
				packageInfo.location = packageInfo.location ? packageInfo.location : name;

				// packageMap is depricated in favor of AMD map
				if(packageInfo.packageMap){
					map[name] = packageInfo.packageMap;
				}

				if(!packageInfo.main.indexOf("./")){
					packageInfo.main = packageInfo.main.substring(2);
				}

				// now that we've got a fully-resolved package object, push it into the configuration
				packs[name] = packageInfo;
			},

			delayedModuleConfig
				// module config cannot be consummed until the loader is completely initialized; therefore, all
				// module config detected during booting is memorized and applied at the end of loader initialization
				// TODO: this is a bit of a kludge; all config should be moved to end of loader initialization, but
				// we'll delay this chore and do it with a final loader 1.x cleanup after the 2.x loader prototyping is complete
				= [],


			config = function(config, booting, referenceModule){
				for(var p in config){
					if(p=="waitSeconds"){
						req.waitms = (config[p] || 0) * 1000;
					}
					if(p=="cacheBust"){
						cacheBust = config[p] ? (isString(config[p]) ? config[p] : (new Date()).getTime() + "") : "";
					}
					if(p=="baseUrl" || p=="combo"){
						req[p] = config[p];
					}
					if( 0  && p=="async"){
						// falsy or "sync" => legacy sync loader
						// "xd" => sync but loading xdomain tree and therefore loading asynchronously (not configurable, set automatically by the loader)
						// "legacyAsync" => permanently in "xd" by choice
						// "debugAtAllCosts" => trying to load everything via script injection (not implemented)
						// otherwise, must be truthy => AMD
						// legacyMode: sync | legacyAsync | xd | false
						var mode = config[p];
						req.legacyMode = legacyMode = (isString(mode) && /sync|legacyAsync/.test(mode) ? mode : (!mode ? sync : false));
						req.async = !legacyMode;
					}
					if(config[p]!==hasCache){
						// accumulate raw config info for client apps which can use this to pass their own config
						req.rawConfig[p] = config[p];
						p!="has" && has.add("config-"+p, config[p], 0, booting);
					}
				}

				// make sure baseUrl exists
				if(!req.baseUrl){
					req.baseUrl = "./";
				}
				// make sure baseUrl ends with a slash
				if(!/\/$/.test(req.baseUrl)){
					req.baseUrl += "/";
				}

				// now do the special work for has, packages, packagePaths, paths, aliases, and cache

				for(p in config.has){
					has.add(p, config.has[p], 0, booting);
				}

				// for each package found in any packages config item, augment the packs map owned by the loader
				forEach(config.packages, fixupPackageInfo);

				// for each packagePath found in any packagePaths config item, augment the packageConfig
				// packagePaths is depricated; remove in 2.0
				for(baseUrl in config.packagePaths){
					forEach(config.packagePaths[baseUrl], function(packageInfo){
						var location = baseUrl + "/" + packageInfo;
						if(isString(packageInfo)){
							packageInfo = {name:packageInfo};
						}
						packageInfo.location = location;
						fixupPackageInfo(packageInfo);
					});
				}

				// notice that computeMapProg treats the dest as a reference; therefore, if/when that variable
				// is published (see dojo-publish-privates), the published variable will always hold a valid value.

				// this must come after all package processing since package processing may mutate map
				computeMapProg(mix(map, config.map), mapProgs);
				forEach(mapProgs, function(item){
					item[1] = computeMapProg(item[1], []);
					if(item[0]=="*"){
						mapProgs.star = item;
					}
				});

				// push in any paths and recompute the internal pathmap
				computeMapProg(mix(paths, config.paths), pathsMapProg);

				// aliases
				forEach(config.aliases, function(pair){
					if(isString(pair[0])){
						pair[0] = new RegExp("^" + escapeString(pair[0]) + "$");
					}
					aliases.push(pair);
				});

				if(booting){
					delayedModuleConfig.push({config:config.config});
				}else{
					for(p in config.config){
						var module = getModule(p, referenceModule);
						module.config = mix(module.config || {}, config.config[p]);
					}
				}

				// push in any new cache values
				if(config.cache){
					consumePendingCacheInsert();
					pendingCacheInsert = config.cache;
					if(config.cache["*noref"]){
						consumePendingCacheInsert();
					}
				}

				signal("config", [config, req.rawConfig]);
			};

		//
		// execute the various sniffs; userConfig can override and value
		//

		if(has("dojo-cdn") ||  0 ){
			// the sniff regex looks for a src attribute ending in dojo.js, optionally preceeded with a path.
			// match[3] returns the path to dojo.js (if any) without the trailing slash. This is used for the
			// dojo location on CDN deployments and baseUrl when either/both of these are not provided
			// explicitly in the config data; this is the 1.6- behavior.

			var scripts = doc.getElementsByTagName("script"),
				i = 0,
				script, dojoDir, src, match;
			while(i < scripts.length){
				script = scripts[i++];
				if((src = script.getAttribute("src")) && (match = src.match(/(((.*)\/)|^)dojo\.js(\W|$)/i))){
					// sniff dojoDir and baseUrl
					dojoDir = match[3] || "";
					defaultConfig.baseUrl = defaultConfig.baseUrl || dojoDir;

					// sniff configuration on attribute in script element
					src = (script.getAttribute("data-dojo-config") || script.getAttribute("djConfig"));
					if(src){
						dojoSniffConfig = req.eval("({ " + src + " })", "data-dojo-config");
					}

					// sniff requirejs attribute
					if( 0 ){
						var dataMain = script.getAttribute("data-main");
						if(dataMain){
							dojoSniffConfig.deps = dojoSniffConfig.deps || [dataMain];
						}
					}
					break;
				}
			}
		}

		if( 0 ){
			// pass down doh.testConfig from parent as if it were a data-dojo-config
			try{
				if(window.parent != window && window.parent.require){
					var doh = window.parent.require("doh");
					doh && mix(dojoSniffConfig, doh.testConfig);
				}
			}catch(e){}
		}

		// configure the loader; let the user override defaults
		req.rawConfig = {};
		config(defaultConfig, 1);

		// do this before setting userConfig/sniffConfig to allow userConfig/sniff overrides
		if(has("dojo-cdn")){
			packs.dojo.location = dojoDir;
			if(dojoDir){
				dojoDir += "/";
			}
			packs.dijit.location = dojoDir + "../dijit/";
			packs.dojox.location = dojoDir + "../dojox/";
		}

		config(userConfig, 1);
		config(dojoSniffConfig, 1);

	}else{
		// no config API, assume defaultConfig has everything the loader needs...for the entire lifetime of the application
		paths = defaultConfig.paths;
		pathsMapProg = defaultConfig.pathsMapProg;
		packs = defaultConfig.packs;
		aliases = defaultConfig.aliases;
		mapProgs = defaultConfig.mapProgs;
		modules = defaultConfig.modules;
		cache = defaultConfig.cache;
		cacheBust = defaultConfig.cacheBust;

		// remember the default config for other processes (e.g., dojo/config)
		req.rawConfig = defaultConfig;
	}


	if( 0 ){
		req.combo = req.combo || {add:noop};
		var	comboPending = 0,
			combosPending = [],
			comboPendingTimer = null;
	}


	// build the loader machinery iaw configuration, including has feature tests
	var	injectDependencies = function(module){
			// checkComplete!=0 holds the idle signal; we're not idle if we're injecting dependencies
			guardCheckComplete(function(){
				forEach(module.deps, injectModule);
				if( 0  && comboPending && !comboPendingTimer){
					comboPendingTimer = setTimeout(function() {
						comboPending = 0;
						comboPendingTimer = null;
						req.combo.done(function(mids, url) {
							var onLoadCallback= function(){
								// defQ is a vector of module definitions 1-to-1, onto mids
								runDefQ(0, mids);
								checkComplete();
							};
							combosPending.push(mids);
							injectingModule = mids;
							req.injectUrl(url, onLoadCallback, mids);
							injectingModule = 0;
						}, req);
					}, 0);
				}
			});
		},

		contextRequire = function(a1, a2, a3, referenceModule, contextRequire){
			var module, syntheticMid;
			if(isString(a1)){
				// signature is (moduleId)
				module = getModule(a1, referenceModule, true);
				if(module && module.executed){
					return module.result;
				}
				throw makeError("undefinedModule", a1);
			}
			if(!isArray(a1)){
				// a1 is a configuration
				config(a1, 0, referenceModule);

				// juggle args; (a2, a3) may be (dependencies, callback)
				a1 = a2;
				a2 = a3;
			}
			if(isArray(a1)){
				// signature is (requestList [,callback])
				if(!a1.length){
					a2 && a2();
				}else{
					syntheticMid = "require*" + uid();

					// resolve the request list with respect to the reference module
					for(var mid, deps = [], i = 0; i < a1.length;){
						mid = a1[i++];
						deps.push(getModule(mid, referenceModule));
					}

					// construct a synthetic module to control execution of the requestList, and, optionally, callback
					module = mix(makeModuleInfo("", syntheticMid, 0, ""), {
						injected: arrived,
						deps: deps,
						def: a2 || noop,
						require: referenceModule ? referenceModule.require : req,
						gc: 1 //garbage collect
					});
					modules[module.mid] = module;

					// checkComplete!=0 holds the idle signal; we're not idle if we're injecting dependencies
					injectDependencies(module);

					// try to immediately execute
					// if already traversing a factory tree, then strict causes circular dependency to abort the execution; maybe
					// it's possible to execute this require later after the current traversal completes and avoid the circular dependency.
					// ...but *always* insist on immediate in synch mode
					var strict = checkCompleteGuard && legacyMode!=sync;
					guardCheckComplete(function(){
						execModule(module, strict);
					});
					if(!module.executed){
						// some deps weren't on board or circular dependency detected and strict; therefore, push into the execQ
						execQ.push(module);
					}
					checkComplete();
				}
			}
			return contextRequire;
		},

		createRequire = function(module){
			if(!module){
				return req;
			}
			var result = module.require;
			if(!result){
				result = function(a1, a2, a3){
					return contextRequire(a1, a2, a3, module, result);
				};
				module.require = mix(result, req);
				result.module = module;
				result.toUrl = function(name){
					return toUrl(name, module);
				};
				result.toAbsMid = function(mid){
					return toAbsMid(mid, module);
				};
				if( 0 ){
					result.undef = function(mid){
						req.undef(mid, module);
					};
				}
				if( 0 ){
					result.syncLoadNls = function(mid){
						var nlsModuleInfo = getModuleInfo(mid, module),
							nlsModule = modules[nlsModuleInfo.mid];
						if(!nlsModule || !nlsModule.executed){
							cached = cache[nlsModuleInfo.mid] || cache[urlKeyPrefix + nlsModuleInfo.url];
							if(cached){
								evalModuleText(cached);
								nlsModule = modules[nlsModuleInfo.mid];
							}
						}
						return nlsModule && nlsModule.executed && nlsModule.result;
					};
				}

			}
			return result;
		},

		execQ =
			// The list of modules that need to be evaluated.
			[],

		defQ =
			// The queue of define arguments sent to loader.
			[],

		waiting =
			// The set of modules upon which the loader is waiting for definition to arrive
			{},

		setRequested = function(module){
			module.injected = requested;
			waiting[module.mid] = 1;
			if(module.url){
				waiting[module.url] = module.pack || 1;
			}
			startTimer();
		},

		setArrived = function(module){
			module.injected = arrived;
			delete waiting[module.mid];
			if(module.url){
				delete waiting[module.url];
			}
			if(isEmpty(waiting)){
				clearTimer();
				 0  && legacyMode==xd && (legacyMode = sync);
			}
		},

		execComplete = req.idle =
			// says the loader has completed (or not) its work
			function(){
				return !defQ.length && isEmpty(waiting) && !execQ.length && !checkCompleteGuard;
			},

		runMapProg = function(targetMid, map){
			// search for targetMid in map; return the map item if found; falsy otherwise
			if(map){
			for(var i = 0; i < map.length; i++){
				if(map[i][2].test(targetMid)){
					return map[i];
				}
			}
			}
			return 0;
		},

		compactPath = function(path){
			var result = [],
				segment, lastSegment;
			path = path.replace(/\\/g, '/').split('/');
			while(path.length){
				segment = path.shift();
				if(segment==".." && result.length && lastSegment!=".."){
					result.pop();
					lastSegment = result[result.length - 1];
				}else if(segment!="."){
					result.push(lastSegment= segment);
				} // else ignore "."
			}
			return result.join("/");
		},

		makeModuleInfo = function(pid, mid, pack, url){
			if( 0 ){
				var xd= req.isXdUrl(url);
				return {pid:pid, mid:mid, pack:pack, url:url, executed:0, def:0, isXd:xd, isAmd:!!(xd || (packs[pid] && packs[pid].isAmd))};
			}else{
				return {pid:pid, mid:mid, pack:pack, url:url, executed:0, def:0};
			}
		},

		getModuleInfo_ = function(mid, referenceModule, packs, modules, baseUrl, mapProgs, pathsMapProg, alwaysCreate){
			// arguments are passed instead of using lexical variables so that this function my be used independent of the loader (e.g., the builder)
			// alwaysCreate is useful in this case so that getModuleInfo never returns references to real modules owned by the loader
			var pid, pack, midInPackage, mapProg, mapItem, url, result, isRelative, requestedMid;
			requestedMid = mid;
			isRelative = /^\./.test(mid);
			if(/(^\/)|(\:)|(\.js$)/.test(mid) || (isRelative && !referenceModule)){
				// absolute path or protocol of .js filetype, or relative path but no reference module and therefore relative to page
				// whatever it is, it's not a module but just a URL of some sort
				// note: pid===0 indicates the routine is returning an unmodified mid

				return makeModuleInfo(0, mid, 0, mid);
			}else{
				// relative module ids are relative to the referenceModule; get rid of any dots
				mid = compactPath(isRelative ? (referenceModule.mid + "/../" + mid) : mid);
				if(/^\./.test(mid)){
					throw makeError("irrationalPath", mid);
				}
				// at this point, mid is an absolute mid

				// map the mid
				if(referenceModule){
					mapItem = runMapProg(referenceModule.mid, mapProgs);
				}
				mapItem = mapItem || mapProgs.star;
				mapItem = mapItem && runMapProg(mid, mapItem[1]);

				if(mapItem){
					mid = mapItem[1] + mid.substring(mapItem[3]);
					}

				match = mid.match(/^([^\/]+)(\/(.+))?$/);
				pid = match ? match[1] : "";
				if((pack = packs[pid])){
					mid = pid + "/" + (midInPackage = (match[3] || pack.main));
				}else{
					pid = "";
				}

				// search aliases
				var candidateLength = 0,
					candidate = 0;
				forEach(aliases, function(pair){
					var match = mid.match(pair[0]);
					if(match && match.length>candidateLength){
						candidate = isFunction(pair[1]) ? mid.replace(pair[0], pair[1]) : pair[1];
					}
				});
				if(candidate){
					return getModuleInfo_(candidate, 0, packs, modules, baseUrl, mapProgs, pathsMapProg, alwaysCreate);
				}

				result = modules[mid];
				if(result){
					return alwaysCreate ? makeModuleInfo(result.pid, result.mid, result.pack, result.url) : modules[mid];
				}
			}
			// get here iff the sought-after module does not yet exist; therefore, we need to compute the URL given the
			// fully resolved (i.e., all relative indicators and package mapping resolved) module id

			// note: pid!==0 indicates the routine is returning a url that has .js appended unmodified mid
			mapItem = runMapProg(mid, pathsMapProg);
			if(mapItem){
				url = mapItem[1] + mid.substring(mapItem[3]);
			}else if(pid){
				url = pack.location + "/" + midInPackage;
			}else if( 0 ){
				url = "../" + mid;
			}else{
				url = mid;
			}
			// if result is not absolute, add baseUrl
			if(!(/(^\/)|(\:)/.test(url))){
				url = baseUrl + url;
			}
			url += ".js";
			return makeModuleInfo(pid, mid, pack, compactPath(url));
		},

		getModuleInfo = function(mid, referenceModule){
			return getModuleInfo_(mid, referenceModule, packs, modules, req.baseUrl, mapProgs, pathsMapProg);
		},

		resolvePluginResourceId = function(plugin, prid, referenceModule){
			return plugin.normalize ? plugin.normalize(prid, function(mid){return toAbsMid(mid, referenceModule);}) : toAbsMid(prid, referenceModule);
		},

		dynamicPluginUidGenerator = 0,

		getModule = function(mid, referenceModule, immediate){
			// compute and optionally construct (if necessary) the module implied by the mid with respect to referenceModule
			var match, plugin, prid, result;
			match = mid.match(/^(.+?)\!(.*)$/);
			if(match){
				// name was <plugin-module>!<plugin-resource-id>
				plugin = getModule(match[1], referenceModule, immediate);

				if( 0  && legacyMode == sync && !plugin.executed){
					injectModule(plugin);
					if(plugin.injected===arrived && !plugin.executed){
						guardCheckComplete(function(){
							execModule(plugin);
						});
					}
					if(plugin.executed){
						promoteModuleToPlugin(plugin);
					}else{
						// we are in xdomain mode for some reason
						execQ.unshift(plugin);
					}
				}



				if(plugin.executed === executed && !plugin.load){
					// executed the module not knowing it was a plugin
					promoteModuleToPlugin(plugin);
				}

				// if the plugin has not been loaded, then can't resolve the prid and  must assume this plugin is dynamic until we find out otherwise
				if(plugin.load){
					prid = resolvePluginResourceId(plugin, match[2], referenceModule);
					mid = (plugin.mid + "!" + (plugin.dynamic ? ++dynamicPluginUidGenerator + "!" : "") + prid);
				}else{
					prid = match[2];
					mid = plugin.mid + "!" + (++dynamicPluginUidGenerator) + "!waitingForPlugin";
				}
				result = {plugin:plugin, mid:mid, req:createRequire(referenceModule), prid:prid};
			}else{
				result = getModuleInfo(mid, referenceModule);
			}
			return modules[result.mid] || (!immediate && (modules[result.mid] = result));
		},

		toAbsMid = req.toAbsMid = function(mid, referenceModule){
			return getModuleInfo(mid, referenceModule).mid;
		},

		toUrl = req.toUrl = function(name, referenceModule){
			var moduleInfo = getModuleInfo(name+"/x", referenceModule),
				url= moduleInfo.url;
			return fixupUrl(moduleInfo.pid===0 ?
				// if pid===0, then name had a protocol or absolute path; either way, toUrl is the identify function in such cases
				name :
				// "/x.js" since getModuleInfo automatically appends ".js" and we appended "/x" to make name look likde a module id
				url.substring(0, url.length-5)
			);
		},

		nonModuleProps = {
			injected: arrived,
			executed: executed,
			def: nonmodule,
			result: nonmodule
		},

		makeCjs = function(mid){
			return modules[mid] = mix({mid:mid}, nonModuleProps);
		},

		cjsRequireModule = makeCjs("require"),
		cjsExportsModule = makeCjs("exports"),
		cjsModuleModule = makeCjs("module"),

		runFactory = function(module, args){
			req.trace("loader-run-factory", [module.mid]);
			var factory = module.def,
				result;
			 0  && syncExecStack.unshift(module);
			if( 0 ){
				try{
					result= isFunction(factory) ? factory.apply(null, args) : factory;
				}catch(e){
					signal(error, module.result = makeError("factoryThrew", [module, e]));
				}
			}else{
				result= isFunction(factory) ? factory.apply(null, args) : factory;
			}
			module.result = result===undefined && module.cjs ? module.cjs.exports : result;
			 0  && syncExecStack.shift(module);
		},

		abortExec = {},

		defOrder = 0,

		promoteModuleToPlugin = function(pluginModule){
			var plugin = pluginModule.result;
			pluginModule.dynamic = plugin.dynamic;
			pluginModule.normalize = plugin.normalize;
			pluginModule.load = plugin.load;
			return pluginModule;
		},

		resolvePluginLoadQ = function(plugin){
			// plugins is a newly executed module that has a loadQ waiting to run

			// step 1: traverse the loadQ and fixup the mid and prid; remember the map from original mid to new mid
			// recall the original mid was created before the plugin was on board and therefore it was impossible to
			// compute the final mid; accordingly, prid may or may not change, but the mid will definitely change
			var map = {};
			forEach(plugin.loadQ, function(pseudoPluginResource){
				// manufacture and insert the real module in modules
				var prid = resolvePluginResourceId(plugin, pseudoPluginResource.prid, pseudoPluginResource.req.module),
					mid = plugin.dynamic ? pseudoPluginResource.mid.replace(/waitingForPlugin$/, prid) : (plugin.mid + "!" + prid),
					pluginResource = mix(mix({}, pseudoPluginResource), {mid:mid, prid:prid, injected:0});
				if(!modules[mid]){
					// create a new (the real) plugin resource and inject it normally now that the plugin is on board
					injectPlugin(modules[mid] = pluginResource);
				} // else this was a duplicate request for the same (plugin, rid) for a nondynamic plugin

				// pluginResource is really just a placeholder with the wrong mid (because we couldn't calculate it until the plugin was on board)
				// mark is as arrived and delete it from modules; the real module was requested above
				map[pseudoPluginResource.mid] = modules[mid];
				setArrived(pseudoPluginResource);
				delete modules[pseudoPluginResource.mid];
			});
			plugin.loadQ = 0;

			// step2: replace all references to any placeholder modules with real modules
			var substituteModules = function(module){
				for(var replacement, deps = module.deps || [], i = 0; i<deps.length; i++){
					replacement = map[deps[i].mid];
					if(replacement){
						deps[i] = replacement;
					}
				}
			};
			for(var p in modules){
				substituteModules(modules[p]);
			}
			forEach(execQ, substituteModules);
		},

		finishExec = function(module){
			req.trace("loader-finish-exec", [module.mid]);
			module.executed = executed;
			module.defOrder = defOrder++;
			 0  && forEach(module.provides, function(cb){ cb(); });
			if(module.loadQ){
				// the module was a plugin
				promoteModuleToPlugin(module);
				resolvePluginLoadQ(module);
			}
			// remove all occurences of this module from the execQ
			for(i = 0; i < execQ.length;){
				if(execQ[i] === module){
					execQ.splice(i, 1);
				}else{
					i++;
				}
			}
			// delete references to synthetic modules
			if (/^require\*/.test(module.mid)) {
				delete modules[module.mid];
			}
		},

		circleTrace = [],

		execModule = function(module, strict){
			// run the dependency vector, then run the factory for module
			if(module.executed === executing){
				req.trace("loader-circular-dependency", [circleTrace.concat(module.mid).join("->")]);
				return (!module.def || strict) ? abortExec :  (module.cjs && module.cjs.exports);
			}
			// at this point the module is either not executed or fully executed


			if(!module.executed){
				if(!module.def){
					return abortExec;
				}
				var mid = module.mid,
					deps = module.deps || [],
					arg, argResult,
					args = [],
					i = 0;

				if( 0 ){
					circleTrace.push(mid);
					req.trace("loader-exec-module", ["exec", circleTrace.length, mid]);
				}

				// for circular dependencies, assume the first module encountered was executed OK
				// modules that circularly depend on a module that has not run its factory will get
				// the premade cjs.exports===module.result. They can take a reference to this object and/or
				// add properties to it. When the module finally runs its factory, the factory can
				// read/write/replace this object. Notice that so long as the object isn't replaced, any
				// reference taken earlier while walking the deps list is still valid.
				module.executed = executing;
				while(i < deps.length){
					arg = deps[i++];
					argResult = ((arg === cjsRequireModule) ? createRequire(module) :
									((arg === cjsExportsModule) ? module.cjs.exports :
										((arg === cjsModuleModule) ? module.cjs :
											execModule(arg, strict))));
					if(argResult === abortExec){
						module.executed = 0;
						req.trace("loader-exec-module", ["abort", mid]);
						 0  && circleTrace.pop();
						return abortExec;
					}
					args.push(argResult);
				}
				runFactory(module, args);
				finishExec(module);
				 0  && circleTrace.pop();
			}
			// at this point the module is guaranteed fully executed

			return module.result;
		},


		checkCompleteGuard = 0,

		guardCheckComplete = function(proc){
			try{
				checkCompleteGuard++;
				proc();
			}finally{
				checkCompleteGuard--;
			}
			if(execComplete()){
				signal("idle", []);
			}
		},

		checkComplete = function(){
			// keep going through the execQ as long as at least one factory is executed
			// plugins, recursion, cached modules all make for many execution path possibilities
			if(checkCompleteGuard){
				return;
			}
			guardCheckComplete(function(){
				checkDojoRequirePlugin();
				for(var currentDefOrder, module, i = 0; i < execQ.length;){
					currentDefOrder = defOrder;
					module = execQ[i];
					execModule(module);
					if(currentDefOrder!=defOrder){
						// defOrder was bumped one or more times indicating something was executed (note, this indicates
						// the execQ was modified, maybe a lot (for example a later module causes an earlier module to execute)
						checkDojoRequirePlugin();
						i = 0;
					}else{
						// nothing happened; check the next module in the exec queue
						i++;
					}
				}
			});
		};


	if( 0 ){
		req.undef = function(moduleId, referenceModule){
			// In order to reload a module, it must be undefined (this routine) and then re-requested.
			// This is useful for testing frameworks (at least).
			var module = getModule(moduleId, referenceModule);
			setArrived(module);
			delete modules[module.mid];
		};
	}

	if( 1 ){
		if(has("dojo-loader-eval-hint-url")===undefined){
			has.add("dojo-loader-eval-hint-url", 1);
		}

		var fixupUrl= function(url){
				url += ""; // make sure url is a Javascript string (some paths may be a Java string)
				return url + (cacheBust ? ((/\?/.test(url) ? "&" : "?") + cacheBust) : "");
			},

			injectPlugin = function(
				module
			){
				// injects the plugin module given by module; may have to inject the plugin itself
				var plugin = module.plugin;

				if(plugin.executed === executed && !plugin.load){
					// executed the module not knowing it was a plugin
					promoteModuleToPlugin(plugin);
				}

				var onLoad = function(def){
						module.result = def;
						setArrived(module);
						finishExec(module);
						checkComplete();
					};

				if(plugin.load){
					plugin.load(module.prid, module.req, onLoad);
				}else if(plugin.loadQ){
					plugin.loadQ.push(module);
				}else{
					// the unshift instead of push is important: we don't want plugins to execute as
					// dependencies of some other module because this may cause circles when the plugin
					// loadQ is run; also, generally, we want plugins to run early since they may load
					// several other modules and therefore can potentially unblock many modules
					plugin.loadQ = [module];
					execQ.unshift(plugin);
					injectModule(plugin);
				}
			},

			// for IE, injecting a module may result in a recursive execution if the module is in the cache

			cached = 0,

			injectingModule = 0,

			injectingCachedModule = 0,

			evalModuleText = function(text, module){
				// see def() for the injectingCachedModule bracket; it simply causes a short, safe curcuit
				if(has("config-stripStrict")){
					text = text.replace(/"use strict"/g, '');
				}
				injectingCachedModule = 1;
				if( 0 ){
					try{
						if(text===cached){
							cached.call(null);
						}else{
							req.eval(text, has("dojo-loader-eval-hint-url") ? module.url : module.mid);
						}
					}catch(e){
						signal(error, makeError("evalModuleThrew", module));
					}
				}else{
					if(text===cached){
						cached.call(null);
					}else{
						req.eval(text, has("dojo-loader-eval-hint-url") ? module.url : module.mid);
					}
				}
				injectingCachedModule = 0;
			},

			injectModule = function(module){
				// Inject the module. In the browser environment, this means appending a script element into
				// the document; in other environments, it means loading a file.
				//
				// If in synchronous mode, then get the module synchronously if it's not xdomainLoading.

				var mid = module.mid,
					url = module.url;
				if(module.executed || module.injected || waiting[mid] || (module.url && ((module.pack && waiting[module.url]===module.pack) || waiting[module.url]==1))){
					return;
				}
				setRequested(module);

				if( 0 ){
					var viaCombo = 0;
					if(module.plugin && module.plugin.isCombo){
						// a combo plugin; therefore, must be handled by combo service
						// the prid should have already been converted to a URL (if required by the plugin) during
						// the normalze process; in any event, there is no way for the loader to know how to
						// to the conversion; therefore the third argument is zero
						req.combo.add(module.plugin.mid, module.prid, 0, req);
						viaCombo = 1;
					}else if(!module.plugin){
						viaCombo = req.combo.add(0, module.mid, module.url, req);
					}
					if(viaCombo){
						comboPending= 1;
						return;
					}
				}

				if(module.plugin){
					injectPlugin(module);
					return;
				} // else a normal module (not a plugin)


				var onLoadCallback = function(){
					runDefQ(module);
					if(module.injected !== arrived){
						// the script that contained the module arrived and has been executed yet
						// nothing was added to the defQ (so it wasn't an AMD module) and the module
						// wasn't marked as arrived by dojo.provide (so it wasn't a v1.6- module);
						// therefore, it must not have been a module; adjust state accordingly
						setArrived(module);
						mix(module, nonModuleProps);
						req.trace("loader-define-nonmodule", [module.url]);
					}

					if( 0  && legacyMode){
						// must call checkComplete even in for sync loader because we may be in xdomainLoading mode;
						// but, if xd loading, then don't call checkComplete until out of the current sync traversal
						// in order to preserve order of execution of the dojo.required modules
						!syncExecStack.length && checkComplete();
					}else{
						checkComplete();
					}
				};
				cached = cache[mid] || cache[urlKeyPrefix + module.url];
				if(cached){
					req.trace("loader-inject", ["cache", module.mid, url]);
					evalModuleText(cached, module);
					onLoadCallback();
					return;
				}
				if( 0  && legacyMode){
					if(module.isXd){
						// switch to async mode temporarily; if current legacyMode!=sync, then is must be one of {legacyAsync, xd, false}
						legacyMode==sync && (legacyMode = xd);
						// fall through and load via script injection
					}else if(module.isAmd && legacyMode!=sync){
						// fall through and load via script injection
					}else{
						// mode may be sync, xd/legacyAsync, or async; module may be AMD or legacy; but module is always located on the same domain
						var xhrCallback = function(text){
							if(legacyMode==sync){
								// the top of syncExecStack gives the current synchronously executing module; the loader needs
								// to know this if it has to switch to async loading in the middle of evaluating a legacy module
								// this happens when a modules dojo.require's a module that must be loaded async because it's xdomain
								// (using unshift/shift because there is no back() methods for Javascript arrays)
								syncExecStack.unshift(module);
								evalModuleText(text, module);
								syncExecStack.shift();

								// maybe the module was an AMD module
								runDefQ(module);

								// legacy modules never get to defineModule() => cjs and injected never set; also evaluation implies executing
								if(!module.cjs){
									setArrived(module);
									finishExec(module);
								}

								if(module.finish){
									// while synchronously evaluating this module, dojo.require was applied referencing a module
									// that had to be loaded async; therefore, the loader stopped answering all dojo.require
									// requests so they could be answered completely in the correct sequence; module.finish gives
									// the list of dojo.requires that must be re-applied once all target modules are available;
									// make a synthetic module to execute the dojo.require's in the correct order

									// compute a guarnateed-unique mid for the synthetic finish module; remember the finish vector; remove it from the reference module
									// TODO: can we just leave the module.finish...what's it hurting?
									var finishMid = mid + "*finish",
										finish = module.finish;
									delete module.finish;

									def(finishMid, ["dojo", ("dojo/require!" + finish.join(",")).replace(/\./g, "/")], function(dojo){
										forEach(finish, function(mid){ dojo.require(mid); });
									});
									// unshift, not push, which causes the current traversal to be reattempted from the top
									execQ.unshift(getModule(finishMid));
								}
								onLoadCallback();
							}else{
								text = transformToAmd(module, text);
								if(text){
									evalModuleText(text, module);
									onLoadCallback();
								}else{
									// if transformToAmd returned falsy, then the module was already AMD and it can be script-injected
									// do so to improve debugability(even though it means another download...which probably won't happen with a good browser cache)
									injectingModule = module;
									req.injectUrl(fixupUrl(url), onLoadCallback, module);
									injectingModule = 0;
								}
							}
						};

						req.trace("loader-inject", ["xhr", module.mid, url, legacyMode!=sync]);
						if( 0 ){
							try{
								req.getText(url, legacyMode!=sync, xhrCallback);
							}catch(e){
								signal(error, makeError("xhrInjectFailed", [module, e]));
							}
						}else{
							req.getText(url, legacyMode!=sync, xhrCallback);
						}
						return;
					}
				} // else async mode or fell through in xdomain loading mode; either way, load by script injection
				req.trace("loader-inject", ["script", module.mid, url]);
				injectingModule = module;
				req.injectUrl(fixupUrl(url), onLoadCallback, module);
				injectingModule = 0;
			},

			defineModule = function(module, deps, def){
				req.trace("loader-define-module", [module.mid, deps]);

				if( 0  && module.plugin && module.plugin.isCombo){
					// the module is a plugin resource loaded by the combo service
					// note: check for module.plugin should be enough since normal plugin resources should
					// not follow this path; module.plugin.isCombo is future-proofing belt and suspenders
					module.result = isFunction(def) ? def() : def;
					setArrived(module);
					finishExec(module);
					return module;
				};

				var mid = module.mid;
				if(module.injected === arrived){
					signal(error, makeError("multipleDefine", module));
					return module;
				}
				mix(module, {
					deps: deps,
					def: def,
					cjs: {
						id: module.mid,
						uri: module.url,
						exports: (module.result = {}),
						setExports: function(exports){
							module.cjs.exports = exports;
						},
						config:function(){
							return module.config;
						}
					}
				});

				// resolve deps with respect to this module
				for(var i = 0; i < deps.length; i++){
					deps[i] = getModule(deps[i], module);
				}

				if( 0  && legacyMode && !waiting[mid]){
					// the module showed up without being asked for; it was probably in a <script> element
					injectDependencies(module);
					execQ.push(module);
					checkComplete();
				}
				setArrived(module);

				if(!isFunction(def) && !deps.length){
					module.result = def;
					finishExec(module);
				}

				return module;
			},

			runDefQ = function(referenceModule, mids){
				// defQ is an array of [id, dependencies, factory]
				// mids (if any) is a vector of mids given by a combo service
				var definedModules = [],
					module, args;
				while(defQ.length){
					args = defQ.shift();
					mids && (args[0]= mids.shift());
					// explicit define indicates possible multiple modules in a single file; delay injecting dependencies until defQ fully
					// processed since modules earlier in the queue depend on already-arrived modules that are later in the queue
					// TODO: what if no args[0] and no referenceModule
					module = (args[0] && getModule(args[0])) || referenceModule;
					definedModules.push([module, args[1], args[2]]);
				}
				consumePendingCacheInsert(referenceModule);
				forEach(definedModules, function(args){
					injectDependencies(defineModule.apply(null, args));
				});
			};
	}

	var timerId = 0,
		clearTimer = noop,
		startTimer = noop;
	if( 0 ){
		// Timer machinery that monitors how long the loader is waiting and signals an error when the timer runs out.
		clearTimer = function(){
			timerId && clearTimeout(timerId);
			timerId = 0;
		},

		startTimer = function(){
			clearTimer();
			if(req.waitms){
				timerId = window.setTimeout(function(){
					clearTimer();
					signal(error, makeError("timeout", waiting));
				}, req.waitms);
			}
		};
	}

	if( 1 ){
		// the typically unnecessary !! in front of doc.attachEvent is due to an opera bug; see	#15096
		has.add("ie-event-behavior", !!doc.attachEvent && (typeof opera === "undefined" || opera.toString() != "[object Opera]"));
	}

	if( 1  && ( 1  ||  1 )){
		var domOn = function(node, eventName, ieEventName, handler){
				// Add an event listener to a DOM node using the API appropriate for the current browser;
				// return a function that will disconnect the listener.
				if(!has("ie-event-behavior")){
					node.addEventListener(eventName, handler, false);
					return function(){
						node.removeEventListener(eventName, handler, false);
					};
				}else{
					node.attachEvent(ieEventName, handler);
					return function(){
						node.detachEvent(ieEventName, handler);
					};
				}
			},
			windowOnLoadListener = domOn(window, "load", "onload", function(){
				req.pageLoaded = 1;
				doc.readyState!="complete" && (doc.readyState = "complete");
				windowOnLoadListener();
			});

		if( 1 ){
			// if the loader is on the page, there must be at least one script element
			// getting its parent and then doing insertBefore solves the "Operation Aborted"
			// error in IE from appending to a node that isn't properly closed; see
			// dojo/tests/_base/loader/requirejs/simple-badbase.html for an example
			var sibling = doc.getElementsByTagName("script")[0],
				insertPoint= sibling.parentNode;
			req.injectUrl = function(url, callback, owner){
				// insert a script element to the insert-point element with src=url;
				// apply callback upon detecting the script has loaded.

				var node = owner.node = doc.createElement("script"),
					onLoad = function(e){
						e = e || window.event;
						var node = e.target || e.srcElement;
						if(e.type === "load" || /complete|loaded/.test(node.readyState)){
							loadDisconnector();
							errorDisconnector();
							callback && callback();
						}
					},
					loadDisconnector = domOn(node, "load", "onreadystatechange", onLoad),
					errorDisconnector = domOn(node, "error", "onerror", function(e){
						loadDisconnector();
						errorDisconnector();
						signal(error, makeError("scriptError", [url, e]));
					});

				node.type = "text/javascript";
				node.charset = "utf-8";
				node.src = url;
				insertPoint.insertBefore(node, sibling);
				return node;
			};
		}
	}

	if( 0 ){
		req.log = function(){
			try{
				for(var i = 0; i < arguments.length; i++){
					console.log(arguments[i]);
				}
			}catch(e){}
		};
	}else{
		req.log = noop;
	}

	if( 0 ){
		var trace = req.trace = function(
			group,	// the trace group to which this application belongs
			args	// the contents of the trace
		){
			///
			// Tracing interface by group.
			//
			// Sends the contents of args to the console iff (req.trace.on && req.trace[group])

			if(trace.on && trace.group[group]){
				signal("trace", [group, args]);
				for(var arg, dump = [], text= "trace:" + group + (args.length ? (":" + args[0]) : ""), i= 1; i<args.length;){
					arg = args[i++];
					if(isString(arg)){
						text += ", " + arg;
					}else{
						dump.push(arg);
					}
				}
				req.log(text);
				dump.length && dump.push(".");
				req.log.apply(req, dump);
			}
		};
		mix(trace, {
			on:1,
			group:{},
			set:function(group, value){
				if(isString(group)){
					trace.group[group]= value;
				}else{
					mix(trace.group, group);
				}
			}
		});
		trace.set(mix(mix(mix({}, defaultConfig.trace), userConfig.trace), dojoSniffConfig.trace));
		on("config", function(config){
			config.trace && trace.set(config.trace);
		});
	}else{
		req.trace = noop;
	}

	var def = function(
		mid,		  //(commonjs.moduleId, optional) list of modules to be loaded before running factory
		dependencies, //(array of commonjs.moduleId, optional)
		factory		  //(any)
	){
		///
		// Advises the loader of a module factory. //Implements http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition.
		///
		//note
		// CommonJS factory scan courtesy of http://requirejs.org

		var arity = arguments.length,
			defaultDeps = ["require", "exports", "module"],
			// the predominate signature...
			args = [0, mid, dependencies];
		if(arity==1){
			args = [0, (isFunction(mid) ? defaultDeps : []), mid];
		}else if(arity==2 && isString(mid)){
			args = [mid, (isFunction(dependencies) ? defaultDeps : []), dependencies];
		}else if(arity==3){
			args = [mid, dependencies, factory];
		}

		if( 0  && args[1]===defaultDeps){
			args[2].toString()
				.replace(/(\/\*([\s\S]*?)\*\/|\/\/(.*)$)/mg, "")
				.replace(/require\(["']([\w\!\-_\.\/]+)["']\)/g, function(match, dep){
				args[1].push(dep);
			});
		}

		req.trace("loader-define", args.slice(0, 2));
		var targetModule = args[0] && getModule(args[0]),
			module;
		if(targetModule && !waiting[targetModule.mid]){
			// given a mid that hasn't been requested; therefore, defined through means other than injecting
			// consequent to a require() or define() application; examples include defining modules on-the-fly
			// due to some code path or including a module in a script element. In any case,
			// there is no callback waiting to finish processing and nothing to trigger the defQ and the
			// dependencies are never requested; therefore, do it here.
			injectDependencies(defineModule(targetModule, args[1], args[2]));
		}else if(!has("ie-event-behavior") || ! 1  || injectingCachedModule){
			// not IE path: anonymous module and therefore must have been injected; therefore, onLoad will fire immediately
			// after script finishes being evaluated and the defQ can be run from that callback to detect the module id
			defQ.push(args);
		}else{
			// IE path: possibly anonymous module and therefore injected; therefore, cannot depend on 1-to-1,
			// in-order exec of onLoad with script eval (since it's IE) and must manually detect here
			targetModule = targetModule || injectingModule;
			if(!targetModule){
				for(mid in waiting){
					module = modules[mid];
					if(module && module.node && module.node.readyState === 'interactive'){
						targetModule = module;
						break;
					}
				}
				if( 0  && !targetModule){
					for(var i = 0; i<combosPending.length; i++){
						targetModule = combosPending[i];
						if(targetModule.node && targetModule.node.readyState === 'interactive'){
							break;
						}
						targetModule= 0;
					}
				}
			}
			if( 0  && isArray(targetModule)){
				injectDependencies(defineModule(getModule(targetModule.shift()), args[1], args[2]));
				if(!targetModule.length){
					combosPending.splice(i, 1);
				}
			}else if(targetModule){
				consumePendingCacheInsert(targetModule);
				injectDependencies(defineModule(targetModule, args[1], args[2]));
			}else{
				signal(error, makeError("ieDefineFailed", args[0]));
			}
			checkComplete();
		}
	};
	def.amd = {
		vendor:"dojotoolkit.org"
	};

	if( 0 ){
		req.def = def;
	}

	// allow config to override default implemention of named functions; this is useful for
	// non-browser environments, e.g., overriding injectUrl, getText, log, etc. in node.js, Rhino, etc.
	// also useful for testing and monkey patching loader
	mix(mix(req, defaultConfig.loaderPatch), userConfig.loaderPatch);

	// now that req is fully initialized and won't change, we can hook it up to the error signal
	on(error, function(arg){
		try{
			console.error(arg);
			if(arg instanceof Error){
				for(var p in arg){
					console.log(p + ":", arg[p]);
				}
				console.log(".");
			}
		}catch(e){}
	});

	// always publish these
	mix(req, {
		uid:uid,
		cache:cache,
		packs:packs
	});


	if( 0 ){
		mix(req, {
			// these may be interesting to look at when debugging
			paths:paths,
			aliases:aliases,
			modules:modules,
			legacyMode:legacyMode,
			execQ:execQ,
			defQ:defQ,
			waiting:waiting,

			// these are used for testing
			// TODO: move testing infrastructure to a different has feature
			packs:packs,
			mapProgs:mapProgs,
			pathsMapProg:pathsMapProg,
			listenerQueues:listenerQueues,

			// these are used by the builder (at least)
			computeMapProg:computeMapProg,
			runMapProg:runMapProg,
			compactPath:compactPath,
			getModuleInfo:getModuleInfo_
		});
	}

	// the loader can be defined exactly once; look for global define which is the symbol AMD loaders are
	// *required* to define (as opposed to require, which is optional)
	if(global.define){
		if( 0 ){
			signal(error, makeError("defineAlreadyDefined", 0));
		}
		return;
	}else{
		global.define = def;
		global.require = req;
		if( 0 ){
			require= req;
		}
	}

	if( 0  && req.combo && req.combo.plugins){
		var plugins = req.combo.plugins,
			pluginName;
		for(pluginName in plugins){
			mix(mix(getModule(pluginName), plugins[pluginName]), {isCombo:1, executed:"executed", load:1});
		}
	}

	if( 1 ){
		forEach(delayedModuleConfig, function(c){ config(c); });
		var bootDeps = dojoSniffConfig.deps ||	userConfig.deps || defaultConfig.deps,
			bootCallback = dojoSniffConfig.callback || userConfig.callback || defaultConfig.callback;
		req.boot = (bootDeps || bootCallback) ? [bootDeps || [], bootCallback] : 0;
	}
	if(! 1 ){
		!req.async && req(["dojo"]);
		req.boot && req.apply(null, req.boot);
	}
})
(this.dojoConfig || this.djConfig || this.require || {}, {
		async:1,
		hasCache:{
				'config-selectorEngine':"lite",
				'config-tlmSiblingOfDojo':1,
				'dojo-built':1,
				'dojo-loader':1,
				dom:1,
				'host-browser':1
		},
		packages:[
				{
					 location:"../dijit",
					 name:"dijit"
				},
				{
					 location:".",
					 name:"dojo"
				},
				{
					 location:"../dojox",
					 name:"dojox"
				}
		]
});require({cache:{
'dojo/request/default':function(){
define("dojo/request/default", [
	'exports',
	'require',
	'../has'
], function(exports, require, has){
	var defId = has('config-requestProvider'),
		platformId;

	if( 1 ){
		platformId = './xhr';
	}else if( 0 ){
		platformId = './node';
	/* TODO:
	}else if( 0 ){
		platformId = './rhino';
   */
	}

	if(!defId){
		defId = platformId;
	}

	exports.getPlatformDefaultId = function(){
		return platformId;
	};

	exports.load = function(id, parentRequire, loaded, config){
		require([id == 'platform' ? platformId : defId], function(provider){
			loaded(provider);
		});
	};
});

},
'dojo/_base/fx':function(){
define(["./kernel", "./config", /*===== "./declare", =====*/ "./lang", "../Evented", "./Color", "./connect", "./sniff", "../dom", "../dom-style"],
	function(dojo, config, /*===== declare, =====*/ lang, Evented, Color, connect, has, dom, style){
	// module:
	//		dojo/_base/fx
	// notes:
	//		Animation loosely package based on Dan Pupius' work, contributed under CLA; see
	//		http://pupius.co.uk/js/Toolkit.Drawing.js

	var _mixin = lang.mixin;

	// Module export
	var basefx = {
		// summary:
		//		This module defines the base dojo/_base/fx implementation.
	};

	var _Line = basefx._Line = function(/*int*/ start, /*int*/ end){
		// summary:
		//		Object used to generate values from a start value to an end value
		// start: int
		//		Beginning value for range
		// end: int
		//		Ending value for range
		this.start = start;
		this.end = end;
	};

	_Line.prototype.getValue = function(/*float*/ n){
		// summary:
		//		Returns the point on the line
		// n:
		//		a floating point number greater than 0 and less than 1
		return ((this.end - this.start) * n) + this.start; // Decimal
	};

	var Animation = basefx.Animation = function(args){
		// summary:
		//		A generic animation class that fires callbacks into its handlers
		//		object at various states.
		// description:
		//		A generic animation class that fires callbacks into its handlers
		//		object at various states. Nearly all dojo animation functions
		//		return an instance of this method, usually without calling the
		//		.play() method beforehand. Therefore, you will likely need to
		//		call .play() on instances of `Animation` when one is
		//		returned.
		// args: Object
		//		The 'magic argument', mixing all the properties into this
		//		animation instance.

		_mixin(this, args);
		if(lang.isArray(this.curve)){
			this.curve = new _Line(this.curve[0], this.curve[1]);
		}

	};
	Animation.prototype = new Evented();

	lang.extend(Animation, {
		// duration: Integer
		//		The time in milliseconds the animation will take to run
		duration: 350,

	/*=====
		// curve: _Line|Array
		//		A two element array of start and end values, or a `_Line` instance to be
		//		used in the Animation.
		curve: null,

		// easing: Function?
		//		A Function to adjust the acceleration (or deceleration) of the progress
		//		across a _Line
		easing: null,
	=====*/

		// repeat: Integer?
		//		The number of times to loop the animation
		repeat: 0,

		// rate: Integer?
		//		the time in milliseconds to wait before advancing to next frame
		//		(used as a fps timer: 1000/rate = fps)
		rate: 20 /* 50 fps */,

	/*=====
		// delay: Integer?
		//		The time in milliseconds to wait before starting animation after it
		//		has been .play()'ed
		delay: null,

		// beforeBegin: Event?
		//		Synthetic event fired before a Animation begins playing (synchronous)
		beforeBegin: null,

		// onBegin: Event?
		//		Synthetic event fired as a Animation begins playing (useful?)
		onBegin: null,

		// onAnimate: Event?
		//		Synthetic event fired at each interval of the Animation
		onAnimate: null,

		// onEnd: Event?
		//		Synthetic event fired after the final frame of the Animation
		onEnd: null,

		// onPlay: Event?
		//		Synthetic event fired any time the Animation is play()'ed
		onPlay: null,

		// onPause: Event?
		//		Synthetic event fired when the Animation is paused
		onPause: null,

		// onStop: Event
		//		Synthetic event fires when the Animation is stopped
		onStop: null,

	=====*/

		_percent: 0,
		_startRepeatCount: 0,

		_getStep: function(){
			var _p = this._percent,
				_e = this.easing
			;
			return _e ? _e(_p) : _p;
		},
		_fire: function(/*Event*/ evt, /*Array?*/ args){
			// summary:
			//		Convenience function.  Fire event "evt" and pass it the
			//		arguments specified in "args".
			// description:
			//		Convenience function.  Fire event "evt" and pass it the
			//		arguments specified in "args".
			//		Fires the callback in the scope of this Animation
			//		instance.
			// evt:
			//		The event to fire.
			// args:
			//		The arguments to pass to the event.
			var a = args||[];
			if(this[evt]){
				if(config.debugAtAllCosts){
					this[evt].apply(this, a);
				}else{
					try{
						this[evt].apply(this, a);
					}catch(e){
						// squelch and log because we shouldn't allow exceptions in
						// synthetic event handlers to cause the internal timer to run
						// amuck, potentially pegging the CPU. I'm not a fan of this
						// squelch, but hopefully logging will make it clear what's
						// going on
						console.error("exception in animation handler for:", evt);
						console.error(e);
					}
				}
			}
			return this; // Animation
		},

		play: function(/*int?*/ delay, /*Boolean?*/ gotoStart){
			// summary:
			//		Start the animation.
			// delay:
			//		How many milliseconds to delay before starting.
			// gotoStart:
			//		If true, starts the animation from the beginning; otherwise,
			//		starts it from its current position.
			// returns: Animation
			//		The instance to allow chaining.

			var _t = this;
			if(_t._delayTimer){ _t._clearTimer(); }
			if(gotoStart){
				_t._stopTimer();
				_t._active = _t._paused = false;
				_t._percent = 0;
			}else if(_t._active && !_t._paused){
				return _t;
			}

			_t._fire("beforeBegin", [_t.node]);

			var de = delay || _t.delay,
				_p = lang.hitch(_t, "_play", gotoStart);

			if(de > 0){
				_t._delayTimer = setTimeout(_p, de);
				return _t;
			}
			_p();
			return _t;	// Animation
		},

		_play: function(gotoStart){
			var _t = this;
			if(_t._delayTimer){ _t._clearTimer(); }
			_t._startTime = new Date().valueOf();
			if(_t._paused){
				_t._startTime -= _t.duration * _t._percent;
			}

			_t._active = true;
			_t._paused = false;
			var value = _t.curve.getValue(_t._getStep());
			if(!_t._percent){
				if(!_t._startRepeatCount){
					_t._startRepeatCount = _t.repeat;
				}
				_t._fire("onBegin", [value]);
			}

			_t._fire("onPlay", [value]);

			_t._cycle();
			return _t; // Animation
		},

		pause: function(){
			// summary:
			//		Pauses a running animation.
			var _t = this;
			if(_t._delayTimer){ _t._clearTimer(); }
			_t._stopTimer();
			if(!_t._active){ return _t; /*Animation*/ }
			_t._paused = true;
			_t._fire("onPause", [_t.curve.getValue(_t._getStep())]);
			return _t; // Animation
		},

		gotoPercent: function(/*Decimal*/ percent, /*Boolean?*/ andPlay){
			// summary:
			//		Sets the progress of the animation.
			// percent:
			//		A percentage in decimal notation (between and including 0.0 and 1.0).
			// andPlay:
			//		If true, play the animation after setting the progress.
			var _t = this;
			_t._stopTimer();
			_t._active = _t._paused = true;
			_t._percent = percent;
			if(andPlay){ _t.play(); }
			return _t; // Animation
		},

		stop: function(/*boolean?*/ gotoEnd){
			// summary:
			//		Stops a running animation.
			// gotoEnd:
			//		If true, the animation will end.
			var _t = this;
			if(_t._delayTimer){ _t._clearTimer(); }
			if(!_t._timer){ return _t; /* Animation */ }
			_t._stopTimer();
			if(gotoEnd){
				_t._percent = 1;
			}
			_t._fire("onStop", [_t.curve.getValue(_t._getStep())]);
			_t._active = _t._paused = false;
			return _t; // Animation
		},

		status: function(){
			// summary:
			//		Returns a string token representation of the status of
			//		the animation, one of: "paused", "playing", "stopped"
			if(this._active){
				return this._paused ? "paused" : "playing"; // String
			}
			return "stopped"; // String
		},

		_cycle: function(){
			var _t = this;
			if(_t._active){
				var curr = new Date().valueOf();
				// Allow durations of 0 (instant) by setting step to 1 - see #13798
				var step = _t.duration === 0 ? 1 : (curr - _t._startTime) / (_t.duration);

				if(step >= 1){
					step = 1;
				}
				_t._percent = step;

				// Perform easing
				if(_t.easing){
					step = _t.easing(step);
				}

				_t._fire("onAnimate", [_t.curve.getValue(step)]);

				if(_t._percent < 1){
					_t._startTimer();
				}else{
					_t._active = false;

					if(_t.repeat > 0){
						_t.repeat--;
						_t.play(null, true);
					}else if(_t.repeat == -1){
						_t.play(null, true);
					}else{
						if(_t._startRepeatCount){
							_t.repeat = _t._startRepeatCount;
							_t._startRepeatCount = 0;
						}
					}
					_t._percent = 0;
					_t._fire("onEnd", [_t.node]);
					!_t.repeat && _t._stopTimer();
				}
			}
			return _t; // Animation
		},

		_clearTimer: function(){
			// summary:
			//		Clear the play delay timer
			clearTimeout(this._delayTimer);
			delete this._delayTimer;
		}

	});

	// the local timer, stubbed into all Animation instances
	var ctr = 0,
		timer = null,
		runner = {
			run: function(){}
		};

	lang.extend(Animation, {

		_startTimer: function(){
			if(!this._timer){
				this._timer = connect.connect(runner, "run", this, "_cycle");
				ctr++;
			}
			if(!timer){
				timer = setInterval(lang.hitch(runner, "run"), this.rate);
			}
		},

		_stopTimer: function(){
			if(this._timer){
				connect.disconnect(this._timer);
				this._timer = null;
				ctr--;
			}
			if(ctr <= 0){
				clearInterval(timer);
				timer = null;
				ctr = 0;
			}
		}

	});

	var _makeFadeable =
		has("ie") ? function(node){
			// only set the zoom if the "tickle" value would be the same as the
			// default
			var ns = node.style;
			// don't set the width to auto if it didn't already cascade that way.
			// We don't want to f anyones designs
			if(!ns.width.length && style.get(node, "width") == "auto"){
				ns.width = "auto";
			}
		} :
		function(){};

	basefx._fade = function(/*Object*/ args){
		// summary:
		//		Returns an animation that will fade the node defined by
		//		args.node from the start to end values passed (args.start
		//		args.end) (end is mandatory, start is optional)

		args.node = dom.byId(args.node);
		var fArgs = _mixin({ properties: {} }, args),
			props = (fArgs.properties.opacity = {});

		props.start = !("start" in fArgs) ?
			function(){
				return +style.get(fArgs.node, "opacity")||0;
			} : fArgs.start;
		props.end = fArgs.end;

		var anim = basefx.animateProperty(fArgs);
		connect.connect(anim, "beforeBegin", lang.partial(_makeFadeable, fArgs.node));

		return anim; // Animation
	};

	/*=====
	var __FadeArgs = declare(null, {
		// node: DOMNode|String
		//		The node referenced in the animation
		// duration: Integer?
		//		Duration of the animation in milliseconds.
		// easing: Function?
		//		An easing function.
	});
	=====*/

	basefx.fadeIn = function(/*__FadeArgs*/ args){
		// summary:
		//		Returns an animation that will fade node defined in 'args' from
		//		its current opacity to fully opaque.
		return basefx._fade(_mixin({ end: 1 }, args)); // Animation
	};

	basefx.fadeOut = function(/*__FadeArgs*/ args){
		// summary:
		//		Returns an animation that will fade node defined in 'args'
		//		from its current opacity to fully transparent.
		return basefx._fade(_mixin({ end: 0 }, args)); // Animation
	};

	basefx._defaultEasing = function(/*Decimal?*/ n){
		// summary:
		//		The default easing function for Animation(s)
		return 0.5 + ((Math.sin((n + 1.5) * Math.PI)) / 2);	// Decimal
	};

	var PropLine = function(properties){
		// PropLine is an internal class which is used to model the values of
		// an a group of CSS properties across an animation lifecycle. In
		// particular, the "getValue" function handles getting interpolated
		// values between start and end for a particular CSS value.
		this._properties = properties;
		for(var p in properties){
			var prop = properties[p];
			if(prop.start instanceof Color){
				// create a reusable temp color object to keep intermediate results
				prop.tempColor = new Color();
			}
		}
	};

	PropLine.prototype.getValue = function(r){
		var ret = {};
		for(var p in this._properties){
			var prop = this._properties[p],
				start = prop.start;
			if(start instanceof Color){
				ret[p] = Color.blendColors(start, prop.end, r, prop.tempColor).toCss();
			}else if(!lang.isArray(start)){
				ret[p] = ((prop.end - start) * r) + start + (p != "opacity" ? prop.units || "px" : 0);
			}
		}
		return ret;
	};

	/*=====
	var __AnimArgs = declare(__FadeArgs, {
		// properties: Object?
		//		A hash map of style properties to Objects describing the transition,
		//		such as the properties of _Line with an additional 'units' property
		properties: {}

		//TODOC: add event callbacks
	});
	=====*/

	basefx.animateProperty = function(/*__AnimArgs*/ args){
		// summary:
		//		Returns an animation that will transition the properties of
		//		node defined in `args` depending how they are defined in
		//		`args.properties`
		//
		// description:
		//		Foundation of most `dojo/_base/fx`
		//		animations. It takes an object of "properties" corresponding to
		//		style properties, and animates them in parallel over a set
		//		duration.
		//
		// example:
		//		A simple animation that changes the width of the specified node.
		//	|	basefx.animateProperty({
		//	|		node: "nodeId",
		//	|		properties: { width: 400 },
		//	|	}).play();
		//		Dojo figures out the start value for the width and converts the
		//		integer specified for the width to the more expressive but
		//		verbose form `{ width: { end: '400', units: 'px' } }` which you
		//		can also specify directly. Defaults to 'px' if omitted.
		//
		// example:
		//		Animate width, height, and padding over 2 seconds... the
		//		pedantic way:
		//	|	basefx.animateProperty({ node: node, duration:2000,
		//	|		properties: {
		//	|			width: { start: '200', end: '400', units:"px" },
		//	|			height: { start:'200', end: '400', units:"px" },
		//	|			paddingTop: { start:'5', end:'50', units:"px" }
		//	|		}
		//	|	}).play();
		//		Note 'paddingTop' is used over 'padding-top'. Multi-name CSS properties
		//		are written using "mixed case", as the hyphen is illegal as an object key.
		//
		// example:
		//		Plug in a different easing function and register a callback for
		//		when the animation ends. Easing functions accept values between
		//		zero and one and return a value on that basis. In this case, an
		//		exponential-in curve.
		//	|	basefx.animateProperty({
		//	|		node: "nodeId",
		//	|		// dojo figures out the start value
		//	|		properties: { width: { end: 400 } },
		//	|		easing: function(n){
		//	|			return (n==0) ? 0 : Math.pow(2, 10 * (n - 1));
		//	|		},
		//	|		onEnd: function(node){
		//	|			// called when the animation finishes. The animation
		//	|			// target is passed to this function
		//	|		}
		//	|	}).play(500); // delay playing half a second
		//
		// example:
		//		Like all `Animation`s, animateProperty returns a handle to the
		//		Animation instance, which fires the events common to Dojo FX. Use `aspect.after`
		//		to access these events outside of the Animation definition:
		//	|	var anim = basefx.animateProperty({
		//	|		node:"someId",
		//	|		properties:{
		//	|			width:400, height:500
		//	|		}
		//	|	});
		//	|	aspect.after(anim, "onEnd", function(){
		//	|		console.log("animation ended");
		//	|	}, true);
		//	|	// play the animation now:
		//	|	anim.play();
		//
		// example:
		//		Each property can be a function whose return value is substituted along.
		//		Additionally, each measurement (eg: start, end) can be a function. The node
		//		reference is passed directly to callbacks.
		//	|	basefx.animateProperty({
		//	|		node:"mine",
		//	|		properties:{
		//	|			height:function(node){
		//	|				// shrink this node by 50%
		//	|				return domGeom.position(node).h / 2
		//	|			},
		//	|			width:{
		//	|				start:function(node){ return 100; },
		//	|				end:function(node){ return 200; }
		//	|			}
		//	|		}
		//	|	}).play();
		//

		var n = args.node = dom.byId(args.node);
		if(!args.easing){ args.easing = dojo._defaultEasing; }

		var anim = new Animation(args);
		connect.connect(anim, "beforeBegin", anim, function(){
			var pm = {};
			for(var p in this.properties){
				// Make shallow copy of properties into pm because we overwrite
				// some values below. In particular if start/end are functions
				// we don't want to overwrite them or the functions won't be
				// called if the animation is reused.
				if(p == "width" || p == "height"){
					this.node.display = "block";
				}
				var prop = this.properties[p];
				if(lang.isFunction(prop)){
					prop = prop(n);
				}
				prop = pm[p] = _mixin({}, (lang.isObject(prop) ? prop: { end: prop }));

				if(lang.isFunction(prop.start)){
					prop.start = prop.start(n);
				}
				if(lang.isFunction(prop.end)){
					prop.end = prop.end(n);
				}
				var isColor = (p.toLowerCase().indexOf("color") >= 0);
				function getStyle(node, p){
					// domStyle.get(node, "height") can return "auto" or "" on IE; this is more reliable:
					var v = { height: node.offsetHeight, width: node.offsetWidth }[p];
					if(v !== undefined){ return v; }
					v = style.get(node, p);
					return (p == "opacity") ? +v : (isColor ? v : parseFloat(v));
				}
				if(!("end" in prop)){
					prop.end = getStyle(n, p);
				}else if(!("start" in prop)){
					prop.start = getStyle(n, p);
				}

				if(isColor){
					prop.start = new Color(prop.start);
					prop.end = new Color(prop.end);
				}else{
					prop.start = (p == "opacity") ? +prop.start : parseFloat(prop.start);
				}
			}
			this.curve = new PropLine(pm);
		});
		connect.connect(anim, "onAnimate", lang.hitch(style, "set", anim.node));
		return anim; // Animation
	};

	basefx.anim = function(	/*DOMNode|String*/	node,
							/*Object*/			properties,
							/*Integer?*/		duration,
							/*Function?*/		easing,
							/*Function?*/		onEnd,
							/*Integer?*/		delay){
		// summary:
		//		A simpler interface to `animateProperty()`, also returns
		//		an instance of `Animation` but begins the animation
		//		immediately, unlike nearly every other Dojo animation API.
		// description:
		//		Simpler (but somewhat less powerful) version
		//		of `animateProperty`.  It uses defaults for many basic properties
		//		and allows for positional parameters to be used in place of the
		//		packed "property bag" which is used for other Dojo animation
		//		methods.
		//
		//		The `Animation` object returned will be already playing, so
		//		calling play() on it again is (usually) a no-op.
		// node:
		//		a DOM node or the id of a node to animate CSS properties on
		// duration:
		//		The number of milliseconds over which the animation
		//		should run. Defaults to the global animation default duration
		//		(350ms).
		// easing:
		//		An easing function over which to calculate acceleration
		//		and deceleration of the animation through its duration.
		//		A default easing algorithm is provided, but you may
		//		plug in any you wish. A large selection of easing algorithms
		//		are available in `dojo/fx/easing`.
		// onEnd:
		//		A function to be called when the animation finishes
		//		running.
		// delay:
		//		The number of milliseconds to delay beginning the
		//		animation by. The default is 0.
		// example:
		//		Fade out a node
		//	|	basefx.anim("id", { opacity: 0 });
		// example:
		//		Fade out a node over a full second
		//	|	basefx.anim("id", { opacity: 0 }, 1000);
		return basefx.animateProperty({ // Animation
			node: node,
			duration: duration || Animation.prototype.duration,
			properties: properties,
			easing: easing,
			onEnd: onEnd
		}).play(delay || 0);
	};


	if( 1 ){
		_mixin(dojo, basefx);
		// Alias to drop come 2.0:
		dojo._Animation = Animation;
	}

	return basefx;
});

},
'dojo/dom-form':function(){
define(["./_base/lang", "./dom", "./io-query", "./json"], function(lang, dom, ioq, json){
	// module:
	//		dojo/dom-form

    function setValue(/*Object*/ obj, /*String*/ name, /*String*/ value){
        // summary:
        //		For the named property in object, set the value. If a value
        //		already exists and it is a string, convert the value to be an
        //		array of values.

        // Skip it if there is no value
        if(value === null){
            return;
        }

        var val = obj[name];
        if(typeof val == "string"){ // inline'd type check
            obj[name] = [val, value];
        }else if(lang.isArray(val)){
            val.push(value);
        }else{
            obj[name] = value;
        }
    }

	var exclude = "file|submit|image|reset|button";

	var form = {
		// summary:
		//		This module defines form-processing functions.

		fieldToObject: function fieldToObject(/*DOMNode|String*/ inputNode){
			// summary:
			//		Serialize a form field to a JavaScript object.
			// description:
			//		Returns the value encoded in a form field as
			//		as a string or an array of strings. Disabled form elements
			//		and unchecked radio and checkboxes are skipped.	Multi-select
			//		elements are returned as an array of string values.
			// inputNode: DOMNode|String
			// returns: Object

			var ret = null;
			inputNode = dom.byId(inputNode);
			if(inputNode){
				var _in = inputNode.name, type = (inputNode.type || "").toLowerCase();
				if(_in && type && !inputNode.disabled){
					if(type == "radio" || type == "checkbox"){
						if(inputNode.checked){
							ret = inputNode.value;
						}
					}else if(inputNode.multiple){
						ret = [];
						var nodes = [inputNode.firstChild];
						while(nodes.length){
							for(var node = nodes.pop(); node; node = node.nextSibling){
								if(node.nodeType == 1 && node.tagName.toLowerCase() == "option"){
									if(node.selected){
										ret.push(node.value);
									}
								}else{
									if(node.nextSibling){
										nodes.push(node.nextSibling);
									}
									if(node.firstChild){
										nodes.push(node.firstChild);
									}
									break;
								}
							}
						}
					}else{
						ret = inputNode.value;
					}
				}
			}
			return ret; // Object
		},

		toObject: function formToObject(/*DOMNode|String*/ formNode){
			// summary:
			//		Serialize a form node to a JavaScript object.
			// description:
			//		Returns the values encoded in an HTML form as
			//		string properties in an object which it then returns. Disabled form
			//		elements, buttons, and other non-value form elements are skipped.
			//		Multi-select elements are returned as an array of string values.
			// formNode: DOMNode|String
			// example:
			//		This form:
			//		|	<form id="test_form">
			//		|		<input type="text" name="blah" value="blah">
			//		|		<input type="text" name="no_value" value="blah" disabled>
			//		|		<input type="button" name="no_value2" value="blah">
			//		|		<select type="select" multiple name="multi" size="5">
			//		|			<option value="blah">blah</option>
			//		|			<option value="thud" selected>thud</option>
			//		|			<option value="thonk" selected>thonk</option>
			//		|		</select>
			//		|	</form>
			//
			//		yields this object structure as the result of a call to
			//		formToObject():
			//
			//		|	{
			//		|		blah: "blah",
			//		|		multi: [
			//		|			"thud",
			//		|			"thonk"
			//		|		]
			//		|	};

			var ret = {}, elems = dom.byId(formNode).elements;
			for(var i = 0, l = elems.length; i < l; ++i){
				var item = elems[i], _in = item.name, type = (item.type || "").toLowerCase();
				if(_in && type && exclude.indexOf(type) < 0 && !item.disabled){
					setValue(ret, _in, form.fieldToObject(item));
					if(type == "image"){
						ret[_in + ".x"] = ret[_in + ".y"] = ret[_in].x = ret[_in].y = 0;
					}
				}
			}
			return ret; // Object
		},

		toQuery: function formToQuery(/*DOMNode|String*/ formNode){
			// summary:
			//		Returns a URL-encoded string representing the form passed as either a
			//		node or string ID identifying the form to serialize
			// formNode: DOMNode|String
			// returns: String

			return ioq.objectToQuery(form.toObject(formNode)); // String
		},

		toJson: function formToJson(/*DOMNode|String*/ formNode, /*Boolean?*/ prettyPrint){
			// summary:
			//		Create a serialized JSON string from a form node or string
			//		ID identifying the form to serialize
			// formNode: DOMNode|String
			// prettyPrint: Boolean?
			// returns: String

			return json.stringify(form.toObject(formNode), null, prettyPrint ? 4 : 0); // String
		}
	};

    return form;
});

},
'dojo/promise/tracer':function(){
define([
	"../_base/lang",
	"./Promise",
	"../Evented"
], function(lang, Promise, Evented){
	"use strict";

	// module:
	//		dojo/promise/tracer

	/*=====
	return {
		// summary:
		//		Trace promise fulfillment.
		// description:
		//		Trace promise fulfillment. Calling `.trace()` or `.traceError()` on a
		//		promise enables tracing. Will emit `resolved`, `rejected` or `progress`
		//		events.

		on: function(type, listener){
			// summary:
			//		Subscribe to traces.
			// description:
			//		See `dojo/Evented#on()`.
			// type: String
			//		`resolved`, `rejected`, or `progress`
			// listener: Function
			//		The listener is passed the traced value and any arguments
			//		that were used with the `.trace()` call.
		}
	};
	=====*/

	var evented = new Evented;
	var emit = evented.emit;
	evented.emit = null;
	// Emit events asynchronously since they should not change the promise state.
	function emitAsync(args){
		setTimeout(function(){
			emit.apply(evented, args);
		}, 0);
	}

	Promise.prototype.trace = function(){
		// summary:
		//		Trace the promise.
		// description:
		//		Tracing allows you to transparently log progress,
		//		resolution and rejection of promises, without affecting the
		//		promise itself. Any arguments passed to `trace()` are
		//		emitted in trace events. See `dojo/promise/tracer` on how
		//		to handle traces.
		// returns: dojo/promise/Promise
		//		The promise instance `trace()` is called on.

		var args = lang._toArray(arguments);
		this.then(
			function(value){ emitAsync(["resolved", value].concat(args)); },
			function(error){ emitAsync(["rejected", error].concat(args)); },
			function(update){ emitAsync(["progress", update].concat(args)); }
		);
		return this;
	};

	Promise.prototype.traceRejected = function(){
		// summary:
		//		Trace rejection of the promise.
		// description:
		//		Tracing allows you to transparently log progress,
		//		resolution and rejection of promises, without affecting the
		//		promise itself. Any arguments passed to `trace()` are
		//		emitted in trace events. See `dojo/promise/tracer` on how
		//		to handle traces.
		// returns: dojo/promise/Promise
		//		The promise instance `traceRejected()` is called on.

		var args = lang._toArray(arguments);
		this.otherwise(function(error){
			emitAsync(["rejected", error].concat(args));
		});
		return this;
	};

	return evented;
});

},
'dojo/errors/RequestError':function(){
define(['./create'], function(create){
	// module:
	//		dojo/errors/RequestError

	/*=====
	 return function(){
		 // summary:
		 //		TODOC
	 };
	 =====*/

	return create("RequestError", function(message, response){
		this.response = response;
	});
});

},
'dojo/_base/kernel':function(){
define(["../has", "./config", "require", "module"], function(has, config, require, module){
	// module:
	//		dojo/_base/kernel

	// This module is the foundational module of the dojo boot sequence; it defines the dojo object.

	var
		// loop variables for this module
		i, p,

		// create dojo, dijit, and dojox
		// FIXME: in 2.0 remove dijit, dojox being created by dojo
		dijit = {},
		dojox = {},
		dojo = {
			// summary:
			//		This module is the foundational module of the dojo boot sequence; it defines the dojo object.

			// notice dojo takes ownership of the value of the config module
			config:config,
			global:this,
			dijit:dijit,
			dojox:dojox
		};


	// Configure the scope map. For a 100% AMD application, the scope map is not needed other than to provide
	// a _scopeName property for the dojo, dijit, and dojox root object so those packages can create
	// unique names in the global space.
	//
	// Built, legacy modules use the scope map to allow those modules to be expressed as if dojo, dijit, and dojox,
	// where global when in fact they are either global under different names or not global at all. In v1.6-, the
	// config variable "scopeMap" was used to map names as used within a module to global names. This has been
	// subsumed by the AMD map configuration variable which can relocate packages to different names. For backcompat,
	// only the "*" mapping is supported. See http://livedocs.dojotoolkit.org/developer/design/loader#legacy-cross-domain-mode for details.
	//
	// The following computations contort the packageMap for this dojo instance into a scopeMap.
	var scopeMap =
			// a map from a name used in a legacy module to the (global variable name, object addressed by that name)
			// always map dojo, dijit, and dojox
			{
				dojo:["dojo", dojo],
				dijit:["dijit", dijit],
				dojox:["dojox", dojox]
			},

		packageMap =
			// the package map for this dojo instance; note, a foreign loader or no pacakgeMap results in the above default config
			(require.map && require.map[module.id.match(/[^\/]+/)[0]]),

		item;


	// process all mapped top-level names for this instance of dojo
	for(p in packageMap){
		if(scopeMap[p]){
			// mapped dojo, dijit, or dojox
			scopeMap[p][0] = packageMap[p];
		}else{
			// some other top-level name
			scopeMap[p] = [packageMap[p], {}];
		}
	}

	// publish those names to _scopeName and, optionally, the global namespace
	for(p in scopeMap){
		item = scopeMap[p];
		item[1]._scopeName = item[0];
		if(!config.noGlobals){
			this[item[0]] = item[1];
		}
	}
	dojo.scopeMap = scopeMap;

	/*===== dojo.__docParserConfigureScopeMap(scopeMap); =====*/

	// FIXME: dojo.baseUrl and dojo.config.baseUrl should be deprecated
	dojo.baseUrl = dojo.config.baseUrl = require.baseUrl;
	dojo.isAsync = ! 1  || require.async;
	dojo.locale = config.locale;

	var rev = "$Rev: 30226 $".match(/\d+/);
	dojo.version = {
		// summary:
		//		Version number of the Dojo Toolkit
		// description:
		//		Hash about the version, including
		//
		//		- major: Integer: Major version. If total version is "1.2.0beta1", will be 1
		//		- minor: Integer: Minor version. If total version is "1.2.0beta1", will be 2
		//		- patch: Integer: Patch version. If total version is "1.2.0beta1", will be 0
		//		- flag: String: Descriptor flag. If total version is "1.2.0beta1", will be "beta1"
		//		- revision: Number: The SVN rev from which dojo was pulled

		major: 1, minor: 8, patch: 3, flag: "",
		revision: rev ? +rev[0] : NaN,
		toString: function(){
			var v = dojo.version;
			return v.major + "." + v.minor + "." + v.patch + v.flag + " (" + v.revision + ")";	// String
		}
	};

	// If  1  is truthy, then as a dojo module is defined it should push it's definitions
	// into the dojo object, and conversely. In 2.0, it will likely be unusual to augment another object
	// as a result of defining a module. This has feature gives a way to force 2.0 behavior as the code
	// is migrated. Absent specific advice otherwise, set extend-dojo to truthy.
	 1 || has.add("extend-dojo", 1);


	(Function("d", "d.eval = function(){return d.global.eval ? d.global.eval(arguments[0]) : eval(arguments[0]);}"))(dojo);
	/*=====
	dojo.eval = function(scriptText){
		// summary:
		//		A legacy method created for use exclusively by internal Dojo methods. Do not use this method
		//		directly unless you understand its possibly-different implications on the platforms your are targeting.
		// description:
		//		Makes an attempt to evaluate scriptText in the global scope. The function works correctly for browsers
		//		that support indirect eval.
		//
		//		As usual, IE does not. On IE, the only way to implement global eval is to
		//		use execScript. Unfortunately, execScript does not return a value and breaks some current usages of dojo.eval.
		//		This implementation uses the technique of executing eval in the scope of a function that is a single scope
		//		frame below the global scope; thereby coming close to the global scope. Note carefully that
		//
		//		dojo.eval("var pi = 3.14;");
		//
		//		will define global pi in non-IE environments, but define pi only in a temporary local scope for IE. If you want
		//		to define a global variable using dojo.eval, write something like
		//
		//		dojo.eval("window.pi = 3.14;")
		// scriptText:
		//		The text to evaluation.
		// returns:
		//		The result of the evaluation. Often `undefined`
	};
	=====*/


	if( 0 ){
		dojo.exit = function(exitcode){
			quit(exitcode);
		};
	}else{
		dojo.exit = function(){
		};
	}

	 1 || has.add("dojo-guarantee-console",
		// ensure that console.log, console.warn, etc. are defined
		1
	);
	if( 1 ){
		typeof console != "undefined" || (console = {});
		//	Be careful to leave 'log' always at the end
		var cn = [
			"assert", "count", "debug", "dir", "dirxml", "error", "group",
			"groupEnd", "info", "profile", "profileEnd", "time", "timeEnd",
			"trace", "warn", "log"
		];
		var tn;
		i = 0;
		while((tn = cn[i++])){
			if(!console[tn]){
				(function(){
					var tcn = tn + "";
					console[tcn] = ('log' in console) ? function(){
						var a = Array.apply({}, arguments);
						a.unshift(tcn + ":");
						console["log"](a.join(" "));
					} : function(){};
					console[tcn]._fake = true;
				})();
			}
		}
	}

	 0 && has.add("dojo-debug-messages",
		// include dojo.deprecated/dojo.experimental implementations
		!!config.isDebug
	);
	dojo.deprecated = dojo.experimental =  function(){};
	if( 0 ){
		dojo.deprecated = function(/*String*/ behaviour, /*String?*/ extra, /*String?*/ removal){
			// summary:
			//		Log a debug message to indicate that a behavior has been
			//		deprecated.
			// behaviour: String
			//		The API or behavior being deprecated. Usually in the form
			//		of "myApp.someFunction()".
			// extra: String?
			//		Text to append to the message. Often provides advice on a
			//		new function or facility to achieve the same goal during
			//		the deprecation period.
			// removal: String?
			//		Text to indicate when in the future the behavior will be
			//		removed. Usually a version number.
			// example:
			//	| dojo.deprecated("myApp.getTemp()", "use myApp.getLocaleTemp() instead", "1.0");

			var message = "DEPRECATED: " + behaviour;
			if(extra){ message += " " + extra; }
			if(removal){ message += " -- will be removed in version: " + removal; }
			console.warn(message);
		};

		dojo.experimental = function(/* String */ moduleName, /* String? */ extra){
			// summary:
			//		Marks code as experimental.
			// description:
			//		This can be used to mark a function, file, or module as
			//		experimental.	 Experimental code is not ready to be used, and the
			//		APIs are subject to change without notice.	Experimental code may be
			//		completed deleted without going through the normal deprecation
			//		process.
			// moduleName: String
			//		The name of a module, or the name of a module file or a specific
			//		function
			// extra: String?
			//		some additional message for the user
			// example:
			//	| dojo.experimental("dojo.data.Result");
			// example:
			//	| dojo.experimental("dojo.weather.toKelvin()", "PENDING approval from NOAA");

			var message = "EXPERIMENTAL: " + moduleName + " -- APIs subject to change without notice.";
			if(extra){ message += " " + extra; }
			console.warn(message);
		};
	}

	 0 && has.add("dojo-modulePaths",
		// consume dojo.modulePaths processing
		1
	);
	if( 0 ){
		// notice that modulePaths won't be applied to any require's before the dojo/_base/kernel factory is run;
		// this is the v1.6- behavior.
		if(config.modulePaths){
			dojo.deprecated("dojo.modulePaths", "use paths configuration");
			var paths = {};
			for(p in config.modulePaths){
				paths[p.replace(/\./g, "/")] = config.modulePaths[p];
			}
			require({paths:paths});
		}
	}

	 0 && has.add("dojo-moduleUrl",
		// include dojo.moduleUrl
		1
	);
	if( 0 ){
		dojo.moduleUrl = function(/*String*/module, /*String?*/url){
			// summary:
			//		Returns a URL relative to a module.
			// example:
			//	|	var pngPath = dojo.moduleUrl("acme","images/small.png");
			//	|	console.dir(pngPath); // list the object properties
			//	|	// create an image and set it's source to pngPath's value:
			//	|	var img = document.createElement("img");
			//	|	img.src = pngPath;
			//	|	// add our image to the document
			//	|	dojo.body().appendChild(img);
			// example:
			//		you may de-reference as far as you like down the package
			//		hierarchy.  This is sometimes handy to avoid lenghty relative
			//		urls or for building portable sub-packages. In this example,
			//		the `acme.widget` and `acme.util` directories may be located
			//		under different roots (see `dojo.registerModulePath`) but the
			//		the modules which reference them can be unaware of their
			//		relative locations on the filesystem:
			//	|	// somewhere in a configuration block
			//	|	dojo.registerModulePath("acme.widget", "../../acme/widget");
			//	|	dojo.registerModulePath("acme.util", "../../util");
			//	|
			//	|	// ...
			//	|
			//	|	// code in a module using acme resources
			//	|	var tmpltPath = dojo.moduleUrl("acme.widget","templates/template.html");
			//	|	var dataPath = dojo.moduleUrl("acme.util","resources/data.json");

			dojo.deprecated("dojo.moduleUrl()", "use require.toUrl", "2.0");

			// require.toUrl requires a filetype; therefore, just append the suffix "/*.*" to guarantee a filetype, then
			// remove the suffix from the result. This way clients can request a url w/out a filetype. This should be
			// rare, but it maintains backcompat for the v1.x line (note: dojo.moduleUrl will be removed in v2.0).
			// Notice * is an illegal filename so it won't conflict with any real path map that may exist the paths config.
			var result = null;
			if(module){
				result = require.toUrl(module.replace(/\./g, "/") + (url ? ("/" + url) : "") + "/*.*").replace(/\/\*\.\*/, "") + (url ? "" : "/");
			}
			return result;
		};
	}

	dojo._hasResource = {}; // for backward compatibility with layers built with 1.6 tooling

	return dojo;
});

},
'dojo/io-query':function(){
define(["./_base/lang"], function(lang){

// module:
//		dojo/io-query

var backstop = {};

return {
// summary:
//		This module defines query string processing functions.

	objectToQuery: function objectToQuery(/*Object*/ map){
		// summary:
        //		takes a name/value mapping object and returns a string representing
        //		a URL-encoded version of that object.
        // example:
        //		this object:
        //
        //	|	{
        //	|		blah: "blah",
        //	|		multi: [
        //	|			"thud",
        //	|			"thonk"
        //	|		]
        //	|	};
        //
        //		yields the following query string:
        //
        //	|	"blah=blah&multi=thud&multi=thonk"

        // FIXME: need to implement encodeAscii!!
        var enc = encodeURIComponent, pairs = [];
        for(var name in map){
            var value = map[name];
            if(value != backstop[name]){
                var assign = enc(name) + "=";
                if(lang.isArray(value)){
                    for(var i = 0, l = value.length; i < l; ++i){
                        pairs.push(assign + enc(value[i]));
                    }
                }else{
                    pairs.push(assign + enc(value));
                }
            }
        }
        return pairs.join("&"); // String
    },

	queryToObject: function queryToObject(/*String*/ str){
        // summary:
        //		Create an object representing a de-serialized query section of a
        //		URL. Query keys with multiple values are returned in an array.
        //
        // example:
        //		This string:
        //
        //	|		"foo=bar&foo=baz&thinger=%20spaces%20=blah&zonk=blarg&"
        //
        //		results in this object structure:
        //
        //	|		{
        //	|			foo: [ "bar", "baz" ],
        //	|			thinger: " spaces =blah",
        //	|			zonk: "blarg"
        //	|		}
        //
        //		Note that spaces and other urlencoded entities are correctly
        //		handled.

        // FIXME: should we grab the URL string if we're not passed one?
        var dec = decodeURIComponent, qp = str.split("&"), ret = {}, name, val;
        for(var i = 0, l = qp.length, item; i < l; ++i){
            item = qp[i];
            if(item.length){
                var s = item.indexOf("=");
                if(s < 0){
                    name = dec(item);
                    val = "";
                }else{
                    name = dec(item.slice(0, s));
                    val  = dec(item.slice(s + 1));
                }
                if(typeof ret[name] == "string"){ // inline'd type check
                    ret[name] = [ret[name]];
                }

                if(lang.isArray(ret[name])){
                    ret[name].push(val);
                }else{
                    ret[name] = val;
                }
            }
        }
        return ret; // Object
    }
};
});
},
'dojo/query':function(){
define(["./_base/kernel", "./has", "./dom", "./on", "./_base/array", "./_base/lang", "./selector/_loader", "./selector/_loader!default"],
	function(dojo, has, dom, on, array, lang, loader, defaultEngine){

	"use strict";

	has.add("array-extensible", function(){
		// test to see if we can extend an array (not supported in old IE)
		return lang.delegate([], {length: 1}).length == 1 && !has("bug-for-in-skips-shadowed");
	});
	
	var ap = Array.prototype, aps = ap.slice, apc = ap.concat, forEach = array.forEach;

	var tnl = function(/*Array*/ a, /*dojo/NodeList?*/ parent, /*Function?*/ NodeListCtor){
		// summary:
		//		decorate an array to make it look like a `dojo/NodeList`.
		// a:
		//		Array of nodes to decorate.
		// parent:
		//		An optional parent NodeList that generated the current
		//		list of nodes. Used to call _stash() so the parent NodeList
		//		can be accessed via end() later.
		// NodeListCtor:
		//		An optional constructor function to use for any
		//		new NodeList calls. This allows a certain chain of
		//		NodeList calls to use a different object than dojo/NodeList.
		var nodeList = new (NodeListCtor || this._NodeListCtor || nl)(a);
		return parent ? nodeList._stash(parent) : nodeList;
	};

	var loopBody = function(f, a, o){
		a = [0].concat(aps.call(a, 0));
		o = o || dojo.global;
		return function(node){
			a[0] = node;
			return f.apply(o, a);
		};
	};

	// adapters

	var adaptAsForEach = function(f, o){
		// summary:
		//		adapts a single node function to be used in the forEach-type
		//		actions. The initial object is returned from the specialized
		//		function.
		// f: Function
		//		a function to adapt
		// o: Object?
		//		an optional context for f
		return function(){
			this.forEach(loopBody(f, arguments, o));
			return this;	// Object
		};
	};

	var adaptAsMap = function(f, o){
		// summary:
		//		adapts a single node function to be used in the map-type
		//		actions. The return is a new array of values, as via `dojo.map`
		// f: Function
		//		a function to adapt
		// o: Object?
		//		an optional context for f
		return function(){
			return this.map(loopBody(f, arguments, o));
		};
	};

	var adaptAsFilter = function(f, o){
		// summary:
		//		adapts a single node function to be used in the filter-type actions
		// f: Function
		//		a function to adapt
		// o: Object?
		//		an optional context for f
		return function(){
			return this.filter(loopBody(f, arguments, o));
		};
	};

	var adaptWithCondition = function(f, g, o){
		// summary:
		//		adapts a single node function to be used in the map-type
		//		actions, behaves like forEach() or map() depending on arguments
		// f: Function
		//		a function to adapt
		// g: Function
		//		a condition function, if true runs as map(), otherwise runs as forEach()
		// o: Object?
		//		an optional context for f and g
		return function(){
			var a = arguments, body = loopBody(f, a, o);
			if(g.call(o || dojo.global, a)){
				return this.map(body);	// self
			}
			this.forEach(body);
			return this;	// self
		};
	};

	var NodeList = function(array){
		// summary:
		//		Array-like object which adds syntactic
		//		sugar for chaining, common iteration operations, animation, and
		//		node manipulation. NodeLists are most often returned as the
		//		result of dojo.query() calls.
		// description:
		//		NodeList instances provide many utilities that reflect
		//		core Dojo APIs for Array iteration and manipulation, DOM
		//		manipulation, and event handling. Instead of needing to dig up
		//		functions in the dojo.* namespace, NodeLists generally make the
		//		full power of Dojo available for DOM manipulation tasks in a
		//		simple, chainable way.
		// example:
		//		create a node list from a node
		//		|	new query.NodeList(dojo.byId("foo"));
		// example:
		//		get a NodeList from a CSS query and iterate on it
		//		|	var l = dojo.query(".thinger");
		//		|	l.forEach(function(node, index, nodeList){
		//		|		console.log(index, node.innerHTML);
		//		|	});
		// example:
		//		use native and Dojo-provided array methods to manipulate a
		//		NodeList without needing to use dojo.* functions explicitly:
		//		|	var l = dojo.query(".thinger");
		//		|	// since NodeLists are real arrays, they have a length
		//		|	// property that is both readable and writable and
		//		|	// push/pop/shift/unshift methods
		//		|	console.log(l.length);
		//		|	l.push(dojo.create("span"));
		//		|
		//		|	// dojo's normalized array methods work too:
		//		|	console.log( l.indexOf(dojo.byId("foo")) );
		//		|	// ...including the special "function as string" shorthand
		//		|	console.log( l.every("item.nodeType == 1") );
		//		|
		//		|	// NodeLists can be [..] indexed, or you can use the at()
		//		|	// function to get specific items wrapped in a new NodeList:
		//		|	var node = l[3]; // the 4th element
		//		|	var newList = l.at(1, 3); // the 2nd and 4th elements
		// example:
		//		the style functions you expect are all there too:
		//		|	// style() as a getter...
		//		|	var borders = dojo.query(".thinger").style("border");
		//		|	// ...and as a setter:
		//		|	dojo.query(".thinger").style("border", "1px solid black");
		//		|	// class manipulation
		//		|	dojo.query("li:nth-child(even)").addClass("even");
		//		|	// even getting the coordinates of all the items
		//		|	var coords = dojo.query(".thinger").coords();
		// example:
		//		DOM manipulation functions from the dojo.* namespace area also available:
		//		|	// remove all of the elements in the list from their
		//		|	// parents (akin to "deleting" them from the document)
		//		|	dojo.query(".thinger").orphan();
		//		|	// place all elements in the list at the front of #foo
		//		|	dojo.query(".thinger").place("foo", "first");
		// example:
		//		Event handling couldn't be easier. `dojo.connect` is mapped in,
		//		and shortcut handlers are provided for most DOM events:
		//		|	// like dojo.connect(), but with implicit scope
		//		|	dojo.query("li").connect("onclick", console, "log");
		//		|
		//		|	// many common event handlers are already available directly:
		//		|	dojo.query("li").onclick(console, "log");
		//		|	var toggleHovered = dojo.hitch(dojo, "toggleClass", "hovered");
		//		|	dojo.query("p")
		//		|		.onmouseenter(toggleHovered)
		//		|		.onmouseleave(toggleHovered);
		// example:
		//		chainability is a key advantage of NodeLists:
		//		|	dojo.query(".thinger")
		//		|		.onclick(function(e){ /* ... */ })
		//		|		.at(1, 3, 8) // get a subset
		//		|			.style("padding", "5px")
		//		|			.forEach(console.log);
		var isNew = this instanceof nl && has("array-extensible");
		if(typeof array == "number"){
			array = Array(array);
		}
		var nodeArray = (array && "length" in array) ? array : arguments;
		if(isNew || !nodeArray.sort){
			// make sure it's a real array before we pass it on to be wrapped 
			var target = isNew ? this : [],
				l = target.length = nodeArray.length;
			for(var i = 0; i < l; i++){
				target[i] = nodeArray[i];
			}
			if(isNew){
				// called with new operator, this means we are going to use this instance and push
				// the nodes on to it. This is usually much faster since the NodeList properties
				//	don't need to be copied (unless the list of nodes is extremely large).
				return target;
			}
			nodeArray = target;
		}
		// called without new operator, use a real array and copy prototype properties,
		// this is slower and exists for back-compat. Should be removed in 2.0.
		lang._mixin(nodeArray, nlp);
		nodeArray._NodeListCtor = function(array){
			// call without new operator to preserve back-compat behavior
			return nl(array);
		};
		return nodeArray;
	};
	
	var nl = NodeList, nlp = nl.prototype = 
		has("array-extensible") ? [] : {};// extend an array if it is extensible

	// expose adapters and the wrapper as private functions

	nl._wrap = nlp._wrap = tnl;
	nl._adaptAsMap = adaptAsMap;
	nl._adaptAsForEach = adaptAsForEach;
	nl._adaptAsFilter  = adaptAsFilter;
	nl._adaptWithCondition = adaptWithCondition;

	// mass assignment

	// add array redirectors
	forEach(["slice", "splice"], function(name){
		var f = ap[name];
		//Use a copy of the this array via this.slice() to allow .end() to work right in the splice case.
		// CANNOT apply ._stash()/end() to splice since it currently modifies
		// the existing this array -- it would break backward compatibility if we copy the array before
		// the splice so that we can use .end(). So only doing the stash option to this._wrap for slice.
		nlp[name] = function(){ return this._wrap(f.apply(this, arguments), name == "slice" ? this : null); };
	});
	// concat should be here but some browsers with native NodeList have problems with it

	// add array.js redirectors
	forEach(["indexOf", "lastIndexOf", "every", "some"], function(name){
		var f = array[name];
		nlp[name] = function(){ return f.apply(dojo, [this].concat(aps.call(arguments, 0))); };
	});

	lang.extend(NodeList, {
		// copy the constructors
		constructor: nl,
		_NodeListCtor: nl,
		toString: function(){
			// Array.prototype.toString can't be applied to objects, so we use join
			return this.join(",");
		},
		_stash: function(parent){
			// summary:
			//		private function to hold to a parent NodeList. end() to return the parent NodeList.
			//
			// example:
			//		How to make a `dojo/NodeList` method that only returns the third node in
			//		the dojo/NodeList but allows access to the original NodeList by using this._stash:
			//	|	dojo.extend(NodeList, {
			//	|		third: function(){
			//	|			var newNodeList = NodeList(this[2]);
			//	|			return newNodeList._stash(this);
			//	|		}
			//	|	});
			//	|	// then see how _stash applies a sub-list, to be .end()'ed out of
			//	|	dojo.query(".foo")
			//	|		.third()
			//	|			.addClass("thirdFoo")
			//	|		.end()
			//	|		// access to the orig .foo list
			//	|		.removeClass("foo")
			//	|
			//
			this._parent = parent;
			return this; // dojo/NodeList
		},

		on: function(eventName, listener){
			// summary:
			//		Listen for events on the nodes in the NodeList. Basic usage is:
			//		| query(".my-class").on("click", listener);
			//		This supports event delegation by using selectors as the first argument with the event names as
			//		pseudo selectors. For example:
			//		| dojo.query("#my-list").on("li:click", listener);
			//		This will listen for click events within `<li>` elements that are inside the `#my-list` element.
			//		Because on supports CSS selector syntax, we can use comma-delimited events as well:
			//		| dojo.query("#my-list").on("li button:mouseover, li:click", listener);
			var handles = this.map(function(node){
				return on(node, eventName, listener); // TODO: apply to the NodeList so the same selector engine is used for matches
			});
			handles.remove = function(){
				for(var i = 0; i < handles.length; i++){
					handles[i].remove();
				}
			};
			return handles;
		},

		end: function(){
			// summary:
			//		Ends use of the current `NodeList` by returning the previous NodeList
			//		that generated the current NodeList.
			// description:
			//		Returns the `NodeList` that generated the current `NodeList`. If there
			//		is no parent NodeList, an empty NodeList is returned.
			// example:
			//	|	dojo.query("a")
			//	|		.filter(".disabled")
			//	|			// operate on the anchors that only have a disabled class
			//	|			.style("color", "grey")
			//	|		.end()
			//	|		// jump back to the list of anchors
			//	|		.style(...)
			//
			if(this._parent){
				return this._parent;
			}else{
				//Just return empty list.
				return new this._NodeListCtor(0);
			}
		},

		// http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array#Methods

		// FIXME: handle return values for #3244
		//		http://trac.dojotoolkit.org/ticket/3244

		// FIXME:
		//		need to wrap or implement:
		//			join (perhaps w/ innerHTML/outerHTML overload for toString() of items?)
		//			reduce
		//			reduceRight

		/*=====
		slice: function(begin, end){
			// summary:
			//		Returns a new NodeList, maintaining this one in place
			// description:
			//		This method behaves exactly like the Array.slice method
			//		with the caveat that it returns a dojo/NodeList and not a
			//		raw Array. For more details, see Mozilla's [slice
			//		documentation](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/slice)
			// begin: Integer
			//		Can be a positive or negative integer, with positive
			//		integers noting the offset to begin at, and negative
			//		integers denoting an offset from the end (i.e., to the left
			//		of the end)
			// end: Integer?
			//		Optional parameter to describe what position relative to
			//		the NodeList's zero index to end the slice at. Like begin,
			//		can be positive or negative.
			return this._wrap(a.slice.apply(this, arguments));
		},

		splice: function(index, howmany, item){
			// summary:
			//		Returns a new NodeList, manipulating this NodeList based on
			//		the arguments passed, potentially splicing in new elements
			//		at an offset, optionally deleting elements
			// description:
			//		This method behaves exactly like the Array.splice method
			//		with the caveat that it returns a dojo/NodeList and not a
			//		raw Array. For more details, see Mozilla's [splice
			//		documentation](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/splice)
			//		For backwards compatibility, calling .end() on the spliced NodeList
			//		does not return the original NodeList -- splice alters the NodeList in place.
			// index: Integer
			//		begin can be a positive or negative integer, with positive
			//		integers noting the offset to begin at, and negative
			//		integers denoting an offset from the end (i.e., to the left
			//		of the end)
			// howmany: Integer?
			//		Optional parameter to describe what position relative to
			//		the NodeList's zero index to end the slice at. Like begin,
			//		can be positive or negative.
			// item: Object...?
			//		Any number of optional parameters may be passed in to be
			//		spliced into the NodeList
			return this._wrap(a.splice.apply(this, arguments));	// dojo/NodeList
		},

		indexOf: function(value, fromIndex){
			// summary:
			//		see dojo.indexOf(). The primary difference is that the acted-on
			//		array is implicitly this NodeList
			// value: Object
			//		The value to search for.
			// fromIndex: Integer?
			//		The location to start searching from. Optional. Defaults to 0.
			// description:
			//		For more details on the behavior of indexOf, see Mozilla's
			//		[indexOf
			//		docs](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf)
			// returns:
			//		Positive Integer or 0 for a match, -1 of not found.
			return d.indexOf(this, value, fromIndex); // Integer
		},

		lastIndexOf: function(value, fromIndex){
			// summary:
			//		see dojo.lastIndexOf(). The primary difference is that the
			//		acted-on array is implicitly this NodeList
			// description:
			//		For more details on the behavior of lastIndexOf, see
			//		Mozilla's [lastIndexOf
			//		docs](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf)
			// value: Object
			//		The value to search for.
			// fromIndex: Integer?
			//		The location to start searching from. Optional. Defaults to 0.
			// returns:
			//		Positive Integer or 0 for a match, -1 of not found.
			return d.lastIndexOf(this, value, fromIndex); // Integer
		},

		every: function(callback, thisObject){
			// summary:
			//		see `dojo.every()` and the [Array.every
			//		docs](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every).
			//		Takes the same structure of arguments and returns as
			//		dojo.every() with the caveat that the passed array is
			//		implicitly this NodeList
			// callback: Function
			//		the callback
			// thisObject: Object?
			//		the context
			return d.every(this, callback, thisObject); // Boolean
		},

		some: function(callback, thisObject){
			// summary:
			//		Takes the same structure of arguments and returns as
			//		`dojo.some()` with the caveat that the passed array is
			//		implicitly this NodeList.  See `dojo.some()` and Mozilla's
			//		[Array.some
			//		documentation](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some).
			// callback: Function
			//		the callback
			// thisObject: Object?
			//		the context
			return d.some(this, callback, thisObject); // Boolean
		},
		=====*/

		concat: function(item){
			// summary:
			//		Returns a new NodeList comprised of items in this NodeList
			//		as well as items passed in as parameters
			// description:
			//		This method behaves exactly like the Array.concat method
			//		with the caveat that it returns a `NodeList` and not a
			//		raw Array. For more details, see the [Array.concat
			//		docs](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/concat)
			// item: Object?
			//		Any number of optional parameters may be passed in to be
			//		spliced into the NodeList

			//return this._wrap(apc.apply(this, arguments));
			// the line above won't work for the native NodeList, or for Dojo NodeLists either :-(

			// implementation notes:
			// Array.concat() doesn't recognize native NodeLists or Dojo NodeLists
			// as arrays, and so does not inline them into a unioned array, but
			// appends them as single entities. Both the original NodeList and the
			// items passed in as parameters must be converted to raw Arrays
			// and then the concatenation result may be re-_wrap()ed as a Dojo NodeList.

			var t = aps.call(this, 0),
				m = array.map(arguments, function(a){
					return aps.call(a, 0);
				});
			return this._wrap(apc.apply(t, m), this);	// dojo/NodeList
		},

		map: function(/*Function*/ func, /*Function?*/ obj){
			// summary:
			//		see dojo.map(). The primary difference is that the acted-on
			//		array is implicitly this NodeList and the return is a
			//		NodeList (a subclass of Array)
			return this._wrap(array.map(this, func, obj), this); // dojo/NodeList
		},

		forEach: function(callback, thisObj){
			// summary:
			//		see `dojo.forEach()`. The primary difference is that the acted-on
			//		array is implicitly this NodeList. If you want the option to break out
			//		of the forEach loop, use every() or some() instead.
			forEach(this, callback, thisObj);
			// non-standard return to allow easier chaining
			return this; // dojo/NodeList
		},
		filter: function(/*String|Function*/ filter){
			// summary:
			//		"masks" the built-in javascript filter() method (supported
			//		in Dojo via `dojo.filter`) to support passing a simple
			//		string filter in addition to supporting filtering function
			//		objects.
			// filter:
			//		If a string, a CSS rule like ".thinger" or "div > span".
			// example:
			//		"regular" JS filter syntax as exposed in dojo.filter:
			//		|	dojo.query("*").filter(function(item){
			//		|		// highlight every paragraph
			//		|		return (item.nodeName == "p");
			//		|	}).style("backgroundColor", "yellow");
			// example:
			//		the same filtering using a CSS selector
			//		|	dojo.query("*").filter("p").styles("backgroundColor", "yellow");

			var a = arguments, items = this, start = 0;
			if(typeof filter == "string"){ // inline'd type check
				items = query._filterResult(this, a[0]);
				if(a.length == 1){
					// if we only got a string query, pass back the filtered results
					return items._stash(this); // dojo/NodeList
				}
				// if we got a callback, run it over the filtered items
				start = 1;
			}
			return this._wrap(array.filter(items, a[start], a[start + 1]), this);	// dojo/NodeList
		},
		instantiate: function(/*String|Object*/ declaredClass, /*Object?*/ properties){
			// summary:
			//		Create a new instance of a specified class, using the
			//		specified properties and each node in the NodeList as a
			//		srcNodeRef.
			// example:
			//		Grabs all buttons in the page and converts them to dijit/form/Button's.
			//	|	var buttons = query("button").instantiate(Button, {showLabel: true});
			var c = lang.isFunction(declaredClass) ? declaredClass : lang.getObject(declaredClass);
			properties = properties || {};
			return this.forEach(function(node){
				new c(properties, node);
			});	// dojo/NodeList
		},
		at: function(/*===== index =====*/){
			// summary:
			//		Returns a new NodeList comprised of items in this NodeList
			//		at the given index or indices.
			//
			// index: Integer...
			//		One or more 0-based indices of items in the current
			//		NodeList. A negative index will start at the end of the
			//		list and go backwards.
			//
			// example:
			//	Shorten the list to the first, second, and third elements
			//	|	query("a").at(0, 1, 2).forEach(fn);
			//
			// example:
			//	Retrieve the first and last elements of a unordered list:
			//	|	query("ul > li").at(0, -1).forEach(cb);
			//
			// example:
			//	Do something for the first element only, but end() out back to
			//	the original list and continue chaining:
			//	|	query("a").at(0).onclick(fn).end().forEach(function(n){
			//	|		console.log(n); // all anchors on the page.
			//	|	})

			var t = new this._NodeListCtor(0);
			forEach(arguments, function(i){
				if(i < 0){ i = this.length + i; }
				if(this[i]){ t.push(this[i]); }
			}, this);
			return t._stash(this); // dojo/NodeList
		}
	});

	function queryForEngine(engine, NodeList){
		var query = function(/*String*/ query, /*String|DOMNode?*/ root){
			// summary:
			//		Returns nodes which match the given CSS selector, searching the
			//		entire document by default but optionally taking a node to scope
			//		the search by. Returns an instance of NodeList.
			if(typeof root == "string"){
				root = dom.byId(root);
				if(!root){
					return new NodeList([]);
				}
			}
			var results = typeof query == "string" ? engine(query, root) : query ? query.orphan ? query : [query] : [];
			if(results.orphan){
				// already wrapped
				return results;
			}
			return new NodeList(results);
		};
		query.matches = engine.match || function(node, selector, root){
			// summary:
			//		Test to see if a node matches a selector
			return query.filter([node], selector, root).length > 0;
		};
		// the engine provides a filtering function, use it to for matching
		query.filter = engine.filter || function(nodes, selector, root){
			// summary:
			//		Filters an array of nodes. Note that this does not guarantee to return a NodeList, just an array.
			return query(selector, root).filter(function(node){
				return array.indexOf(nodes, node) > -1;
			});
		};
		if(typeof engine != "function"){
			var search = engine.search;
			engine = function(selector, root){
				// Slick does it backwards (or everyone else does it backwards, probably the latter)
				return search(root || document, selector);
			};
		}
		return query;
	}
	var query = queryForEngine(defaultEngine, NodeList);
	/*=====
	query = function(selector, context){
		// summary:
		//		This modules provides DOM querying functionality. The module export is a function
		//		that can be used to query for DOM nodes by CSS selector and returns a NodeList
		//		representing the matching nodes.
		// selector: String
		//		A CSS selector to search for.
		// context: String|DomNode?
		//		An optional context to limit the searching scope. Only nodes under `context` will be
		//		scanned.
		// example:
		//		add an onclick handler to every submit button in the document
		//		which causes the form to be sent via Ajax instead:
		//	|	require(["dojo/query"], function(query){
		//	|		query("input[type='submit']").on("click", function(e){
		//	|			dojo.stopEvent(e); // prevent sending the form
		//	|			var btn = e.target;
		//	|			dojo.xhrPost({
		//	|				form: btn.form,
		//	|				load: function(data){
		//	|					// replace the form with the response
		//	|					var div = dojo.doc.createElement("div");
		//	|					dojo.place(div, btn.form, "after");
		//	|					div.innerHTML = data;
		//	|					dojo.style(btn.form, "display", "none");
		//	|				}
		//	|			});
		//	|		});
		// |	});
		//
		// description:
		//		dojo/query is responsible for loading the appropriate query engine and wrapping
		//		its results with a `NodeList`. You can use dojo/query with a specific selector engine
		//		by using it as a plugin. For example, if you installed the sizzle package, you could
		//		use it as the selector engine with:
		//		|	require(["dojo/query!sizzle"], function(query){
		//		|		query("div")...
		//
		//		The id after the ! can be a module id of the selector engine or one of the following values:
		//
		//		- acme: This is the default engine used by Dojo base, and will ensure that the full
		//		Acme engine is always loaded.
		//
		//		- css2: If the browser has a native selector engine, this will be used, otherwise a
		//		very minimal lightweight selector engine will be loaded that can do simple CSS2 selectors
		//		(by #id, .class, tag, and [name=value] attributes, with standard child or descendant (>)
		//		operators) and nothing more.
		//
		//		- css2.1: If the browser has a native selector engine, this will be used, otherwise the
		//		full Acme engine will be loaded.
		//
		//		- css3: If the browser has a native selector engine with support for CSS3 pseudo
		//		selectors (most modern browsers except IE8), this will be used, otherwise the
		//		full Acme engine will be loaded.
		//
		//		- Or the module id of a selector engine can be used to explicitly choose the selector engine
		//
		//		For example, if you are using CSS3 pseudo selectors in module, you can specify that
		//		you will need support them with:
		//		|	require(["dojo/query!css3"], function(query){
		//		|		query('#t > h3:nth-child(odd)')...
		//
		//		You can also choose the selector engine/load configuration by setting the query-selector:
		//		For example:
		//		|	<script data-dojo-config="query-selector:'css3'" src="dojo.js"></script>
		//
		return new NodeList(); // dojo/NodeList
	 };
	 =====*/

	// the query that is returned from this module is slightly different than dojo.query,
	// because dojo.query has to maintain backwards compatibility with returning a
	// true array which has performance problems. The query returned from the module
	// does not use true arrays, but rather inherits from Array, making it much faster to
	// instantiate.
	dojo.query = queryForEngine(defaultEngine, function(array){
		// call it without the new operator to invoke the back-compat behavior that returns a true array
		return NodeList(array);	// dojo/NodeList
	});

	query.load = function(id, parentRequire, loaded){
		// summary:
		//		can be used as AMD plugin to conditionally load new query engine
		// example:
		//	|	require(["dojo/query!custom"], function(qsa){
		//	|		// loaded selector/custom.js as engine
		//	|		qsa("#foobar").forEach(...);
		//	|	});
		loader.load(id, parentRequire, function(engine){
			loaded(queryForEngine(engine, NodeList));
		});
	};

	dojo._filterQueryResult = query._filterResult = function(nodes, selector, root){
		return new NodeList(query.filter(nodes, selector, root));
	};
	dojo.NodeList = query.NodeList = NodeList;
	return query;
});

},
'dojo/has':function(){
define(["require", "module"], function(require, module){
	// module:
	//		dojo/has
	// summary:
	//		Defines the has.js API and several feature tests used by dojo.
	// description:
	//		This module defines the has API as described by the project has.js with the following additional features:
	//
	//		- the has test cache is exposed at has.cache.
	//		- the method has.add includes a forth parameter that controls whether or not existing tests are replaced
	//		- the loader's has cache may be optionally copied into this module's has cahce.
	//
	//		This module adopted from https://github.com/phiggins42/has.js; thanks has.js team!

	// try to pull the has implementation from the loader; both the dojo loader and bdLoad provide one
	// if using a foreign loader, then the has cache may be initialized via the config object for this module
	// WARNING: if a foreign loader defines require.has to be something other than the has.js API, then this implementation fail
	var has = require.has || function(){};
	if(! 1 ){
		var
			isBrowser =
				// the most fundamental decision: are we in the browser?
				typeof window != "undefined" &&
				typeof location != "undefined" &&
				typeof document != "undefined" &&
				window.location == location && window.document == document,

			// has API variables
			global = this,
			doc = isBrowser && document,
			element = doc && doc.createElement("DiV"),
			cache = (module.config && module.config()) || {};

		has = function(name){
			// summary:
			//		Return the current value of the named feature.
			//
			// name: String|Integer
			//		The name (if a string) or identifier (if an integer) of the feature to test.
			//
			// description:
			//		Returns the value of the feature named by name. The feature must have been
			//		previously added to the cache by has.add.

			return typeof cache[name] == "function" ? (cache[name] = cache[name](global, doc, element)) : cache[name]; // Boolean
		};

		has.cache = cache;

		has.add = function(name, test, now, force){
			// summary:
			//	 	Register a new feature test for some named feature.
			// name: String|Integer
			//	 	The name (if a string) or identifier (if an integer) of the feature to test.
			// test: Function
			//		 A test function to register. If a function, queued for testing until actually
			//		 needed. The test function should return a boolean indicating
			//	 	the presence of a feature or bug.
			// now: Boolean?
			//		 Optional. Omit if `test` is not a function. Provides a way to immediately
			//		 run the test and cache the result.
			// force: Boolean?
			//	 	Optional. If the test already exists and force is truthy, then the existing
			//	 	test will be replaced; otherwise, add does not replace an existing test (that
			//	 	is, by default, the first test advice wins).
			// example:
			//		A redundant test, testFn with immediate execution:
			//	|	has.add("javascript", function(){ return true; }, true);
			//
			// example:
			//		Again with the redundantness. You can do this in your tests, but we should
			//		not be doing this in any internal has.js tests
			//	|	has.add("javascript", true);
			//
			// example:
			//		Three things are passed to the testFunction. `global`, `document`, and a generic element
			//		from which to work your test should the need arise.
			//	|	has.add("bug-byid", function(g, d, el){
			//	|		// g	== global, typically window, yadda yadda
			//	|		// d	== document object
			//	|		// el == the generic element. a `has` element.
			//	|		return false; // fake test, byid-when-form-has-name-matching-an-id is slightly longer
			//	|	});

			(typeof cache[name]=="undefined" || force) && (cache[name]= test);
			return now && has(name);
		};

		// since we're operating under a loader that doesn't provide a has API, we must explicitly initialize
		// has as it would have otherwise been initialized by the dojo loader; use has.add to the builder
		// can optimize these away iff desired
		 1 || has.add("host-browser", isBrowser);
		 1 || has.add("dom", isBrowser);
		 1 || has.add("dojo-dom-ready-api", 1);
		 0 && has.add("dojo-sniff", 1);
	}

	if( 1 ){
		// Common application level tests
		has.add("dom-addeventlistener", !!document.addEventListener);
		has.add("touch", "ontouchstart" in document);
		// I don't know if any of these tests are really correct, just a rough guess
		has.add("device-width", screen.availWidth || innerWidth);

		// Tests for DOMNode.attributes[] behavior:
		//	 - dom-attributes-explicit - attributes[] only lists explicitly user specified attributes
		//	 - dom-attributes-specified-flag (IE8) - need to check attr.specified flag to skip attributes user didn't specify
		//	 - Otherwise, in IE6-7. attributes[] will list hundreds of values, so need to do outerHTML to get attrs instead.
		var form = document.createElement("form");
		has.add("dom-attributes-explicit", form.attributes.length == 0); // W3C
		has.add("dom-attributes-specified-flag", form.attributes.length > 0 && form.attributes.length < 40);	// IE8
	}

	has.clearElement = function(element){
		// summary:
		//	 Deletes the contents of the element passed to test functions.
		element.innerHTML= "";
		return element;
	};

	has.normalize = function(id, toAbsMid){
		// summary:
		//	 Resolves id into a module id based on possibly-nested tenary expression that branches on has feature test value(s).
		//
		// toAbsMid: Function
		//	 Resolves a relative module id into an absolute module id
		var
			tokens = id.match(/[\?:]|[^:\?]*/g), i = 0,
			get = function(skip){
				var term = tokens[i++];
				if(term == ":"){
					// empty string module name, resolves to 0
					return 0;
				}else{
					// postfixed with a ? means it is a feature to branch on, the term is the name of the feature
					if(tokens[i++] == "?"){
						if(!skip && has(term)){
							// matched the feature, get the first value from the options
							return get();
						}else{
							// did not match, get the second value, passing over the first
							get(true);
							return get(skip);
						}
					}
					// a module
					return term || 0;
				}
			};
		id = get();
		return id && toAbsMid(id);
	};

	has.load = function(id, parentRequire, loaded){
		// summary:
		//		Conditional loading of AMD modules based on a has feature test value.
		// id: String
		//		Gives the resolved module id to load.
		// parentRequire: Function
		//		The loader require function with respect to the module that contained the plugin resource in it's
		//		dependency list.
		// loaded: Function
		//	 Callback to loader that consumes result of plugin demand.

		if(id){
			parentRequire([id], loaded);
		}else{
			loaded();
		}
	};

	return has;
});

},
'dojo/json':function(){
define(["./has"], function(has){
	"use strict";
	var hasJSON = typeof JSON != "undefined";
	has.add("json-parse", hasJSON); // all the parsers work fine
		// Firefox 3.5/Gecko 1.9 fails to use replacer in stringify properly https://bugzilla.mozilla.org/show_bug.cgi?id=509184
	has.add("json-stringify", hasJSON && JSON.stringify({a:0}, function(k,v){return v||1;}) == '{"a":1}');

	/*=====
	return {
		// summary:
		//		Functions to parse and serialize JSON

		parse: function(str, strict){
			// summary:
			//		Parses a [JSON](http://json.org) string to return a JavaScript object.
			// description:
			//		This function follows [native JSON API](https://developer.mozilla.org/en/JSON)
			//		Throws for invalid JSON strings. This delegates to eval() if native JSON
			//		support is not available. By default this will evaluate any valid JS expression.
			//		With the strict parameter set to true, the parser will ensure that only
			//		valid JSON strings are parsed (otherwise throwing an error). Without the strict
			//		parameter, the content passed to this method must come
			//		from a trusted source.
			// str:
			//		a string literal of a JSON item, for instance:
			//		`'{ "foo": [ "bar", 1, { "baz": "thud" } ] }'`
			// strict:
			//		When set to true, this will ensure that only valid, secure JSON is ever parsed.
			//		Make sure this is set to true for untrusted content. Note that on browsers/engines
			//		without native JSON support, setting this to true will run slower.
		},
		stringify: function(value, replacer, spacer){
			// summary:
			//		Returns a [JSON](http://json.org) serialization of an object.
			// description:
			//		Returns a [JSON](http://json.org) serialization of an object.
			//		This function follows [native JSON API](https://developer.mozilla.org/en/JSON)
			//		Note that this doesn't check for infinite recursion, so don't do that!
			// value:
			//		A value to be serialized.
			// replacer:
			//		A replacer function that is called for each value and can return a replacement
			// spacer:
			//		A spacer string to be used for pretty printing of JSON
			// example:
			//		simple serialization of a trivial object
			//	|	define(["dojo/json"], function(JSON){
			// 	|		var jsonStr = JSON.stringify({ howdy: "stranger!", isStrange: true });
			//	|		doh.is('{"howdy":"stranger!","isStrange":true}', jsonStr);
		}
	};
	=====*/

	if(has("json-stringify")){
		return JSON;
	}else{
		var escapeString = function(/*String*/str){
			// summary:
			//		Adds escape sequences for non-visual characters, double quote and
			//		backslash and surrounds with double quotes to form a valid string
			//		literal.
			return ('"' + str.replace(/(["\\])/g, '\\$1') + '"').
				replace(/[\f]/g, "\\f").replace(/[\b]/g, "\\b").replace(/[\n]/g, "\\n").
				replace(/[\t]/g, "\\t").replace(/[\r]/g, "\\r"); // string
		};
		return {
			parse: has("json-parse") ? JSON.parse : function(str, strict){
				if(strict && !/^([\s\[\{]*(?:"(?:\\.|[^"])+"|-?\d[\d\.]*(?:[Ee][+-]?\d+)?|null|true|false|)[\s\]\}]*(?:,|:|$))+$/.test(str)){
					throw new SyntaxError("Invalid characters in JSON");
				}
				return eval('(' + str + ')');
			},
			stringify: function(value, replacer, spacer){
				var undef;
				if(typeof replacer == "string"){
					spacer = replacer;
					replacer = null;
				}
				function stringify(it, indent, key){
					if(replacer){
						it = replacer(key, it);
					}
					var val, objtype = typeof it;
					if(objtype == "number"){
						return isFinite(it) ? it + "" : "null";
					}
					if(objtype == "boolean"){
						return it + "";
					}
					if(it === null){
						return "null";
					}
					if(typeof it == "string"){
						return escapeString(it);
					}
					if(objtype == "function" || objtype == "undefined"){
						return undef; // undefined
					}
					// short-circuit for objects that support "json" serialization
					// if they return "self" then just pass-through...
					if(typeof it.toJSON == "function"){
						return stringify(it.toJSON(key), indent, key);
					}
					if(it instanceof Date){
						return '"{FullYear}-{Month+}-{Date}T{Hours}:{Minutes}:{Seconds}Z"'.replace(/\{(\w+)(\+)?\}/g, function(t, prop, plus){
							var num = it["getUTC" + prop]() + (plus ? 1 : 0);
							return num < 10 ? "0" + num : num;
						});
					}
					if(it.valueOf() !== it){
						// primitive wrapper, try again unwrapped:
						return stringify(it.valueOf(), indent, key);
					}
					var nextIndent= spacer ? (indent + spacer) : "";
					/* we used to test for DOM nodes and throw, but FF serializes them as {}, so cross-browser consistency is probably not efficiently attainable */ 
				
					var sep = spacer ? " " : "";
					var newLine = spacer ? "\n" : "";
				
					// array
					if(it instanceof Array){
						var itl = it.length, res = [];
						for(key = 0; key < itl; key++){
							var obj = it[key];
							val = stringify(obj, nextIndent, key);
							if(typeof val != "string"){
								val = "null";
							}
							res.push(newLine + nextIndent + val);
						}
						return "[" + res.join(",") + newLine + indent + "]";
					}
					// generic object code path
					var output = [];
					for(key in it){
						var keyStr;
						if(it.hasOwnProperty(key)){
							if(typeof key == "number"){
								keyStr = '"' + key + '"';
							}else if(typeof key == "string"){
								keyStr = escapeString(key);
							}else{
								// skip non-string or number keys
								continue;
							}
							val = stringify(it[key], nextIndent, key);
							if(typeof val != "string"){
								// skip non-serializable values
								continue;
							}
							// At this point, the most non-IE browsers don't get in this branch 
							// (they have native JSON), so push is definitely the way to
							output.push(newLine + nextIndent + keyStr + ":" + sep + val);
						}
					}
					return "{" + output.join(",") + newLine + indent + "}"; // String
				}
				return stringify(value, "", "");
			}
		};
	}
});

},
'dojo/dom':function(){
define(["./sniff", "./_base/window"],
		function(has, win){
	// module:
	//		dojo/dom

	// FIXME: need to add unit tests for all the semi-public methods

	if(has("ie") <= 7){
		try{
			document.execCommand("BackgroundImageCache", false, true);
		}catch(e){
			// sane browsers don't have cache "issues"
		}
	}

	// =============================
	// DOM Functions
	// =============================

	// the result object
	var dom = {
		// summary:
		//		This module defines the core dojo DOM API.
	};

	if(has("ie")){
		dom.byId = function(id, doc){
			if(typeof id != "string"){
				return id;
			}
			var _d = doc || win.doc, te = id && _d.getElementById(id);
			// attributes.id.value is better than just id in case the
			// user has a name=id inside a form
			if(te && (te.attributes.id.value == id || te.id == id)){
				return te;
			}else{
				var eles = _d.all[id];
				if(!eles || eles.nodeName){
					eles = [eles];
				}
				// if more than 1, choose first with the correct id
				var i = 0;
				while((te = eles[i++])){
					if((te.attributes && te.attributes.id && te.attributes.id.value == id) || te.id == id){
						return te;
					}
				}
			}
		};
	}else{
		dom.byId = function(id, doc){
			// inline'd type check.
			// be sure to return null per documentation, to match IE branch.
			return ((typeof id == "string") ? (doc || win.doc).getElementById(id) : id) || null; // DOMNode
		};
	}
	/*=====
	 dom.byId = function(id, doc){
		 // summary:
		 //		Returns DOM node with matching `id` attribute or falsy value (ex: null or undefined)
		 //		if not found.  If `id` is a DomNode, this function is a no-op.
		 //
		 // id: String|DOMNode
		 //		A string to match an HTML id attribute or a reference to a DOM Node
		 //
		 // doc: Document?
		 //		Document to work in. Defaults to the current value of
		 //		dojo.doc.  Can be used to retrieve
		 //		node references from other documents.
		 //
		 // example:
		 //		Look up a node by ID:
		 //	|	var n = dojo.byId("foo");
		 //
		 // example:
		 //		Check if a node exists, and use it.
		 //	|	var n = dojo.byId("bar");
		 //	|	if(n){ doStuff() ... }
		 //
		 // example:
		 //		Allow string or DomNode references to be passed to a custom function:
		 //	|	var foo = function(nodeOrId){
		 //	|		nodeOrId = dojo.byId(nodeOrId);
		 //	|		// ... more stuff
		 //	|	}
	 };
	 =====*/

	dom.isDescendant = function(/*DOMNode|String*/ node, /*DOMNode|String*/ ancestor){
		// summary:
		//		Returns true if node is a descendant of ancestor
		// node: DOMNode|String
		//		string id or node reference to test
		// ancestor: DOMNode|String
		//		string id or node reference of potential parent to test against
		//
		// example:
		//		Test is node id="bar" is a descendant of node id="foo"
		//	|	if(dojo.isDescendant("bar", "foo")){ ... }

		try{
			node = dom.byId(node);
			ancestor = dom.byId(ancestor);
			while(node){
				if(node == ancestor){
					return true; // Boolean
				}
				node = node.parentNode;
			}
		}catch(e){ /* squelch, return false */ }
		return false; // Boolean
	};


	// TODO: do we need setSelectable in the base?

	// Add feature test for user-select CSS property
	// (currently known to work in all but IE < 10 and Opera)
	has.add("css-user-select", function(global, doc, element){
		// Avoid exception when dom.js is loaded in non-browser environments
		if(!element){ return false; }
		
		var style = element.style;
		var prefixes = ["Khtml", "O", "ms", "Moz", "Webkit"],
			i = prefixes.length,
			name = "userSelect",
			prefix;

		// Iterate prefixes from most to least likely
		do{
			if(typeof style[name] !== "undefined"){
				// Supported; return property name
				return name;
			}
		}while(i-- && (name = prefixes[i] + "UserSelect"));

		// Not supported if we didn't return before now
		return false;
	});

	/*=====
	dom.setSelectable = function(node, selectable){
		// summary:
		//		Enable or disable selection on a node
		// node: DOMNode|String
		//		id or reference to node
		// selectable: Boolean
		//		state to put the node in. false indicates unselectable, true
		//		allows selection.
		// example:
		//		Make the node id="bar" unselectable
		//	|	dojo.setSelectable("bar");
		// example:
		//		Make the node id="bar" selectable
		//	|	dojo.setSelectable("bar", true);
	};
	=====*/

	var cssUserSelect = has("css-user-select");
	dom.setSelectable = cssUserSelect ? function(node, selectable){
		// css-user-select returns a (possibly vendor-prefixed) CSS property name
		dom.byId(node).style[cssUserSelect] = selectable ? "" : "none";
	} : function(node, selectable){
		node = dom.byId(node);

		// (IE < 10 / Opera) Fall back to setting/removing the
		// unselectable attribute on the element and all its children
		var nodes = node.getElementsByTagName("*"),
			i = nodes.length;

		if(selectable){
			node.removeAttribute("unselectable");
			while(i--){
				nodes[i].removeAttribute("unselectable");
			}
		}else{
			node.setAttribute("unselectable", "on");
			while(i--){
				nodes[i].setAttribute("unselectable", "on");
			}
		}
	};

	return dom;
});

},
'dojo/errors/RequestTimeoutError':function(){
define("dojo/errors/RequestTimeoutError", ['./create', './RequestError'], function(create, RequestError){
	// module:
	//		dojo/errors/RequestTimeoutError

	/*=====
	 return function(){
		 // summary:
		 //		TODOC
	 };
	 =====*/

	return create("RequestTimeoutError", null, RequestError, {
		dojoType: "timeout"
	});
});

},
'dojo/dom-style':function(){
define("dojo/dom-style", ["./sniff", "./dom"], function(has, dom){
	// module:
	//		dojo/dom-style

	// =============================
	// Style Functions
	// =============================

	// getComputedStyle drives most of the style code.
	// Wherever possible, reuse the returned object.
	//
	// API functions below that need to access computed styles accept an
	// optional computedStyle parameter.
	// If this parameter is omitted, the functions will call getComputedStyle themselves.
	// This way, calling code can access computedStyle once, and then pass the reference to
	// multiple API functions.

	// Although we normally eschew argument validation at this
	// level, here we test argument 'node' for (duck)type,
	// by testing nodeType, ecause 'document' is the 'parentNode' of 'body'
	// it is frequently sent to this function even
	// though it is not Element.
	var getComputedStyle, style = {
		// summary:
		//		This module defines the core dojo DOM style API.
	};
	if(has("webkit")){
		getComputedStyle = function(/*DomNode*/ node){
			var s;
			if(node.nodeType == 1){
				var dv = node.ownerDocument.defaultView;
				s = dv.getComputedStyle(node, null);
				if(!s && node.style){
					node.style.display = "";
					s = dv.getComputedStyle(node, null);
				}
			}
			return s || {};
		};
	}else if(has("ie") && (has("ie") < 9 || has("quirks"))){
		getComputedStyle = function(node){
			// IE (as of 7) doesn't expose Element like sane browsers
			// currentStyle can be null on IE8!
			return node.nodeType == 1 /* ELEMENT_NODE*/ && node.currentStyle ? node.currentStyle : {};
		};
	}else{
		getComputedStyle = function(node){
			return node.nodeType == 1 /* ELEMENT_NODE*/ ?
				node.ownerDocument.defaultView.getComputedStyle(node, null) : {};
		};
	}
	style.getComputedStyle = getComputedStyle;
	/*=====
	style.getComputedStyle = function(node){
		// summary:
		//		Returns a "computed style" object.
		//
		// description:
		//		Gets a "computed style" object which can be used to gather
		//		information about the current state of the rendered node.
		//
		//		Note that this may behave differently on different browsers.
		//		Values may have different formats and value encodings across
		//		browsers.
		//
		//		Note also that this method is expensive.  Wherever possible,
		//		reuse the returned object.
		//
		//		Use the dojo.style() method for more consistent (pixelized)
		//		return values.
		//
		// node: DOMNode
		//		A reference to a DOM node. Does NOT support taking an
		//		ID string for speed reasons.
		// example:
		//	|	dojo.getComputedStyle(dojo.byId('foo')).borderWidth;
		//
		// example:
		//		Reusing the returned object, avoiding multiple lookups:
		//	|	var cs = dojo.getComputedStyle(dojo.byId("someNode"));
		//	|	var w = cs.width, h = cs.height;
		return; // CSS2Properties
	};
	=====*/

	var toPixel;
	if(!has("ie")){
		toPixel = function(element, value){
			// style values can be floats, client code may want
			// to round for integer pixels.
			return parseFloat(value) || 0;
		};
	}else{
		toPixel = function(element, avalue){
			if(!avalue){ return 0; }
			// on IE7, medium is usually 4 pixels
			if(avalue == "medium"){ return 4; }
			// style values can be floats, client code may
			// want to round this value for integer pixels.
			if(avalue.slice && avalue.slice(-2) == 'px'){ return parseFloat(avalue); }
			var s = element.style, rs = element.runtimeStyle, cs = element.currentStyle,
				sLeft = s.left, rsLeft = rs.left;
			rs.left = cs.left;
			try{
				// 'avalue' may be incompatible with style.left, which can cause IE to throw
				// this has been observed for border widths using "thin", "medium", "thick" constants
				// those particular constants could be trapped by a lookup
				// but perhaps there are more
				s.left = avalue;
				avalue = s.pixelLeft;
			}catch(e){
				avalue = 0;
			}
			s.left = sLeft;
			rs.left = rsLeft;
			return avalue;
		};
	}
	style.toPixelValue = toPixel;
	/*=====
	style.toPixelValue = function(node, value){
		// summary:
		//		converts style value to pixels on IE or return a numeric value.
		// node: DOMNode
		// value: String
		// returns: Number
	};
	=====*/

	// FIXME: there opacity quirks on FF that we haven't ported over. Hrm.

	var astr = "DXImageTransform.Microsoft.Alpha";
	var af = function(n, f){
		try{
			return n.filters.item(astr);
		}catch(e){
			return f ? {} : null;
		}
	};

	var _getOpacity =
		has("ie") < 9 || (has("ie") < 10 && has("quirks")) ? function(node){
			try{
				return af(node).Opacity / 100; // Number
			}catch(e){
				return 1; // Number
			}
		} :
		function(node){
			return getComputedStyle(node).opacity;
		};

	var _setOpacity =
		has("ie") < 9 || (has("ie") < 10 && has("quirks")) ? function(/*DomNode*/ node, /*Number*/ opacity){
			var ov = opacity * 100, opaque = opacity == 1;
			node.style.zoom = opaque ? "" : 1;

			if(!af(node)){
				if(opaque){
					return opacity;
				}
				node.style.filter += " progid:" + astr + "(Opacity=" + ov + ")";
			}else{
				af(node, 1).Opacity = ov;
			}

			// on IE7 Alpha(Filter opacity=100) makes text look fuzzy so disable it altogether (bug #2661),
			//but still update the opacity value so we can get a correct reading if it is read later.
			af(node, 1).Enabled = !opaque;

			if(node.tagName.toLowerCase() == "tr"){
				for(var td = node.firstChild; td; td = td.nextSibling){
					if(td.tagName.toLowerCase() == "td"){
						_setOpacity(td, opacity);
					}
				}
			}
			return opacity;
		} :
		function(node, opacity){
			return node.style.opacity = opacity;
		};

	var _pixelNamesCache = {
		left: true, top: true
	};
	var _pixelRegExp = /margin|padding|width|height|max|min|offset/; // |border
	function _toStyleValue(node, type, value){
		//TODO: should we really be doing string case conversion here? Should we cache it? Need to profile!
		type = type.toLowerCase();
		if(has("ie")){
			if(value == "auto"){
				if(type == "height"){ return node.offsetHeight; }
				if(type == "width"){ return node.offsetWidth; }
			}
			if(type == "fontweight"){
				switch(value){
					case 700: return "bold";
					case 400:
					default: return "normal";
				}
			}
		}
		if(!(type in _pixelNamesCache)){
			_pixelNamesCache[type] = _pixelRegExp.test(type);
		}
		return _pixelNamesCache[type] ? toPixel(node, value) : value;
	}

	var _floatStyle = has("ie") ? "styleFloat" : "cssFloat",
		_floatAliases = {"cssFloat": _floatStyle, "styleFloat": _floatStyle, "float": _floatStyle};

	// public API

	style.get = function getStyle(/*DOMNode|String*/ node, /*String?*/ name){
		// summary:
		//		Accesses styles on a node.
		// description:
		//		Getting the style value uses the computed style for the node, so the value
		//		will be a calculated value, not just the immediate node.style value.
		//		Also when getting values, use specific style names,
		//		like "borderBottomWidth" instead of "border" since compound values like
		//		"border" are not necessarily reflected as expected.
		//		If you want to get node dimensions, use `dojo.marginBox()`,
		//		`dojo.contentBox()` or `dojo.position()`.
		// node: DOMNode|String
		//		id or reference to node to get style for
		// name: String?
		//		the style property to get
		// example:
		//		Passing only an ID or node returns the computed style object of
		//		the node:
		//	|	dojo.getStyle("thinger");
		// example:
		//		Passing a node and a style property returns the current
		//		normalized, computed value for that property:
		//	|	dojo.getStyle("thinger", "opacity"); // 1 by default

		var n = dom.byId(node), l = arguments.length, op = (name == "opacity");
		if(l == 2 && op){
			return _getOpacity(n);
		}
		name = _floatAliases[name] || name;
		var s = style.getComputedStyle(n);
		return (l == 1) ? s : _toStyleValue(n, name, s[name] || n.style[name]); /* CSS2Properties||String||Number */
	};

	style.set = function setStyle(/*DOMNode|String*/ node, /*String|Object*/ name, /*String?*/ value){
		// summary:
		//		Sets styles on a node.
		// node: DOMNode|String
		//		id or reference to node to set style for
		// name: String|Object
		//		the style property to set in DOM-accessor format
		//		("borderWidth", not "border-width") or an object with key/value
		//		pairs suitable for setting each property.
		// value: String?
		//		If passed, sets value on the node for style, handling
		//		cross-browser concerns.  When setting a pixel value,
		//		be sure to include "px" in the value. For instance, top: "200px".
		//		Otherwise, in some cases, some browsers will not apply the style.
		//
		// example:
		//		Passing a node, a style property, and a value changes the
		//		current display of the node and returns the new computed value
		//	|	dojo.setStyle("thinger", "opacity", 0.5); // == 0.5
		//
		// example:
		//		Passing a node, an object-style style property sets each of the values in turn and returns the computed style object of the node:
		//	|	dojo.setStyle("thinger", {
		//	|		"opacity": 0.5,
		//	|		"border": "3px solid black",
		//	|		"height": "300px"
		//	|	});
		//
		// example:
		//		When the CSS style property is hyphenated, the JavaScript property is camelCased.
		//		font-size becomes fontSize, and so on.
		//	|	dojo.setStyle("thinger",{
		//	|		fontSize:"14pt",
		//	|		letterSpacing:"1.2em"
		//	|	});
		//
		// example:
		//		dojo/NodeList implements .style() using the same syntax, omitting the "node" parameter, calling
		//		dojo.style() on every element of the list. See: `dojo.query()` and `dojo/NodeList`
		//	|	dojo.query(".someClassName").style("visibility","hidden");
		//	|	// or
		//	|	dojo.query("#baz > div").style({
		//	|		opacity:0.75,
		//	|		fontSize:"13pt"
		//	|	});

		var n = dom.byId(node), l = arguments.length, op = (name == "opacity");
		name = _floatAliases[name] || name;
		if(l == 3){
			return op ? _setOpacity(n, value) : n.style[name] = value; // Number
		}
		for(var x in name){
			style.set(node, x, name[x]);
		}
		return style.getComputedStyle(n);
	};

	return style;
});

},
'dojo/dom-geometry':function(){
define(["./sniff", "./_base/window","./dom", "./dom-style"],
		function(has, win, dom, style){
	// module:
	//		dojo/dom-geometry

	// the result object
	var geom = {
		// summary:
		//		This module defines the core dojo DOM geometry API.
	};

	// Box functions will assume this model.
	// On IE/Opera, BORDER_BOX will be set if the primary document is in quirks mode.
	// Can be set to change behavior of box setters.

	// can be either:
	//	"border-box"
	//	"content-box" (default)
	geom.boxModel = "content-box";

	// We punt per-node box mode testing completely.
	// If anybody cares, we can provide an additional (optional) unit
	// that overrides existing code to include per-node box sensitivity.

	// Opera documentation claims that Opera 9 uses border-box in BackCompat mode.
	// but experiments (Opera 9.10.8679 on Windows Vista) indicate that it actually continues to use content-box.
	// IIRC, earlier versions of Opera did in fact use border-box.
	// Opera guys, this is really confusing. Opera being broken in quirks mode is not our fault.

	if(has("ie") /*|| has("opera")*/){
		// client code may have to adjust if compatMode varies across iframes
		geom.boxModel = document.compatMode == "BackCompat" ? "border-box" : "content-box";
	}

	geom.getPadExtents = function getPadExtents(/*DomNode*/ node, /*Object*/ computedStyle){
		// summary:
		//		Returns object with special values specifically useful for node
		//		fitting.
		// description:
		//		Returns an object with `w`, `h`, `l`, `t` properties:
		//	|		l/t/r/b = left/top/right/bottom padding (respectively)
		//	|		w = the total of the left and right padding
		//	|		h = the total of the top and bottom padding
		//		If 'node' has position, l/t forms the origin for child nodes.
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		// node: DOMNode
		// computedStyle: Object?
		//		This parameter accepts computed styles object.
		//		If this parameter is omitted, the functions will call
		//		dojo.getComputedStyle to get one. It is a better way, calling
		//		dojo.computedStyle once, and then pass the reference to this
		//		computedStyle parameter. Wherever possible, reuse the returned
		//		object of dojo/dom-style.getComputedStyle().

		node = dom.byId(node);
		var s = computedStyle || style.getComputedStyle(node), px = style.toPixelValue,
			l = px(node, s.paddingLeft), t = px(node, s.paddingTop), r = px(node, s.paddingRight), b = px(node, s.paddingBottom);
		return {l: l, t: t, r: r, b: b, w: l + r, h: t + b};
	};

	var none = "none";

	geom.getBorderExtents = function getBorderExtents(/*DomNode*/ node, /*Object*/ computedStyle){
		// summary:
		//		returns an object with properties useful for noting the border
		//		dimensions.
		// description:
		//		- l/t/r/b = the sum of left/top/right/bottom border (respectively)
		//		- w = the sum of the left and right border
		//		- h = the sum of the top and bottom border
		//
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		// node: DOMNode
		// computedStyle: Object?
		//		This parameter accepts computed styles object.
		//		If this parameter is omitted, the functions will call
		//		dojo.getComputedStyle to get one. It is a better way, calling
		//		dojo.computedStyle once, and then pass the reference to this
		//		computedStyle parameter. Wherever possible, reuse the returned
		//		object of dojo/dom-style.getComputedStyle().

		node = dom.byId(node);
		var px = style.toPixelValue, s = computedStyle || style.getComputedStyle(node),
			l = s.borderLeftStyle != none ? px(node, s.borderLeftWidth) : 0,
			t = s.borderTopStyle != none ? px(node, s.borderTopWidth) : 0,
			r = s.borderRightStyle != none ? px(node, s.borderRightWidth) : 0,
			b = s.borderBottomStyle != none ? px(node, s.borderBottomWidth) : 0;
		return {l: l, t: t, r: r, b: b, w: l + r, h: t + b};
	};

	geom.getPadBorderExtents = function getPadBorderExtents(/*DomNode*/ node, /*Object*/ computedStyle){
		// summary:
		//		Returns object with properties useful for box fitting with
		//		regards to padding.
		// description:
		//		- l/t/r/b = the sum of left/top/right/bottom padding and left/top/right/bottom border (respectively)
		//		- w = the sum of the left and right padding and border
		//		- h = the sum of the top and bottom padding and border
		//
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		// node: DOMNode
		// computedStyle: Object?
		//		This parameter accepts computed styles object.
		//		If this parameter is omitted, the functions will call
		//		dojo.getComputedStyle to get one. It is a better way, calling
		//		dojo.computedStyle once, and then pass the reference to this
		//		computedStyle parameter. Wherever possible, reuse the returned
		//		object of dojo/dom-style.getComputedStyle().

		node = dom.byId(node);
		var s = computedStyle || style.getComputedStyle(node),
			p = geom.getPadExtents(node, s),
			b = geom.getBorderExtents(node, s);
		return {
			l: p.l + b.l,
			t: p.t + b.t,
			r: p.r + b.r,
			b: p.b + b.b,
			w: p.w + b.w,
			h: p.h + b.h
		};
	};

	geom.getMarginExtents = function getMarginExtents(node, computedStyle){
		// summary:
		//		returns object with properties useful for box fitting with
		//		regards to box margins (i.e., the outer-box).
		//
		//		- l/t = marginLeft, marginTop, respectively
		//		- w = total width, margin inclusive
		//		- h = total height, margin inclusive
		//
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		// node: DOMNode
		// computedStyle: Object?
		//		This parameter accepts computed styles object.
		//		If this parameter is omitted, the functions will call
		//		dojo.getComputedStyle to get one. It is a better way, calling
		//		dojo.computedStyle once, and then pass the reference to this
		//		computedStyle parameter. Wherever possible, reuse the returned
		//		object of dojo/dom-style.getComputedStyle().

		node = dom.byId(node);
		var s = computedStyle || style.getComputedStyle(node), px = style.toPixelValue,
			l = px(node, s.marginLeft), t = px(node, s.marginTop), r = px(node, s.marginRight), b = px(node, s.marginBottom);
		return {l: l, t: t, r: r, b: b, w: l + r, h: t + b};
	};

	// Box getters work in any box context because offsetWidth/clientWidth
	// are invariant wrt box context
	//
	// They do *not* work for display: inline objects that have padding styles
	// because the user agent ignores padding (it's bogus styling in any case)
	//
	// Be careful with IMGs because they are inline or block depending on
	// browser and browser mode.

	// Although it would be easier to read, there are not separate versions of
	// _getMarginBox for each browser because:
	// 1. the branching is not expensive
	// 2. factoring the shared code wastes cycles (function call overhead)
	// 3. duplicating the shared code wastes bytes

	geom.getMarginBox = function getMarginBox(/*DomNode*/ node, /*Object*/ computedStyle){
		// summary:
		//		returns an object that encodes the width, height, left and top
		//		positions of the node's margin box.
		// node: DOMNode
		// computedStyle: Object?
		//		This parameter accepts computed styles object.
		//		If this parameter is omitted, the functions will call
		//		dojo.getComputedStyle to get one. It is a better way, calling
		//		dojo.computedStyle once, and then pass the reference to this
		//		computedStyle parameter. Wherever possible, reuse the returned
		//		object of dojo/dom-style.getComputedStyle().

		node = dom.byId(node);
		var s = computedStyle || style.getComputedStyle(node), me = geom.getMarginExtents(node, s),
			l = node.offsetLeft - me.l, t = node.offsetTop - me.t, p = node.parentNode, px = style.toPixelValue, pcs;
		if(has("mozilla")){
			// Mozilla:
			// If offsetParent has a computed overflow != visible, the offsetLeft is decreased
			// by the parent's border.
			// We don't want to compute the parent's style, so instead we examine node's
			// computed left/top which is more stable.
			var sl = parseFloat(s.left), st = parseFloat(s.top);
			if(!isNaN(sl) && !isNaN(st)){
				l = sl;
				t = st;
			}else{
				// If child's computed left/top are not parseable as a number (e.g. "auto"), we
				// have no choice but to examine the parent's computed style.
				if(p && p.style){
					pcs = style.getComputedStyle(p);
					if(pcs.overflow != "visible"){
						l += pcs.borderLeftStyle != none ? px(node, pcs.borderLeftWidth) : 0;
						t += pcs.borderTopStyle != none ? px(node, pcs.borderTopWidth) : 0;
					}
				}
			}
		}else if(has("opera") || (has("ie") == 8 && !has("quirks"))){
			// On Opera and IE 8, offsetLeft/Top includes the parent's border
			if(p){
				pcs = style.getComputedStyle(p);
				l -= pcs.borderLeftStyle != none ? px(node, pcs.borderLeftWidth) : 0;
				t -= pcs.borderTopStyle != none ? px(node, pcs.borderTopWidth) : 0;
			}
		}
		return {l: l, t: t, w: node.offsetWidth + me.w, h: node.offsetHeight + me.h};
	};

	geom.getContentBox = function getContentBox(node, computedStyle){
		// summary:
		//		Returns an object that encodes the width, height, left and top
		//		positions of the node's content box, irrespective of the
		//		current box model.
		// node: DOMNode
		// computedStyle: Object?
		//		This parameter accepts computed styles object.
		//		If this parameter is omitted, the functions will call
		//		dojo.getComputedStyle to get one. It is a better way, calling
		//		dojo.computedStyle once, and then pass the reference to this
		//		computedStyle parameter. Wherever possible, reuse the returned
		//		object of dojo/dom-style.getComputedStyle().

		// clientWidth/Height are important since the automatically account for scrollbars
		// fallback to offsetWidth/Height for special cases (see #3378)
		node = dom.byId(node);
		var s = computedStyle || style.getComputedStyle(node), w = node.clientWidth, h,
			pe = geom.getPadExtents(node, s), be = geom.getBorderExtents(node, s);
		if(!w){
			w = node.offsetWidth;
			h = node.offsetHeight;
		}else{
			h = node.clientHeight;
			be.w = be.h = 0;
		}
		// On Opera, offsetLeft includes the parent's border
		if(has("opera")){
			pe.l += be.l;
			pe.t += be.t;
		}
		return {l: pe.l, t: pe.t, w: w - pe.w - be.w, h: h - pe.h - be.h};
	};

	// Box setters depend on box context because interpretation of width/height styles
	// vary wrt box context.
	//
	// The value of boxModel is used to determine box context.
	// boxModel can be set directly to change behavior.
	//
	// Beware of display: inline objects that have padding styles
	// because the user agent ignores padding (it's a bogus setup anyway)
	//
	// Be careful with IMGs because they are inline or block depending on
	// browser and browser mode.
	//
	// Elements other than DIV may have special quirks, like built-in
	// margins or padding, or values not detectable via computedStyle.
	// In particular, margins on TABLE do not seems to appear
	// at all in computedStyle on Mozilla.

	function setBox(/*DomNode*/ node, /*Number?*/ l, /*Number?*/ t, /*Number?*/ w, /*Number?*/ h, /*String?*/ u){
		// summary:
		//		sets width/height/left/top in the current (native) box-model
		//		dimensions. Uses the unit passed in u.
		// node:
		//		DOM Node reference. Id string not supported for performance
		//		reasons.
		// l:
		//		left offset from parent.
		// t:
		//		top offset from parent.
		// w:
		//		width in current box model.
		// h:
		//		width in current box model.
		// u:
		//		unit measure to use for other measures. Defaults to "px".
		u = u || "px";
		var s = node.style;
		if(!isNaN(l)){
			s.left = l + u;
		}
		if(!isNaN(t)){
			s.top = t + u;
		}
		if(w >= 0){
			s.width = w + u;
		}
		if(h >= 0){
			s.height = h + u;
		}
	}

	function isButtonTag(/*DomNode*/ node){
		// summary:
		//		True if the node is BUTTON or INPUT.type="button".
		return node.tagName.toLowerCase() == "button" ||
			node.tagName.toLowerCase() == "input" && (node.getAttribute("type") || "").toLowerCase() == "button"; // boolean
	}

	function usesBorderBox(/*DomNode*/ node){
		// summary:
		//		True if the node uses border-box layout.

		// We could test the computed style of node to see if a particular box
		// has been specified, but there are details and we choose not to bother.

		// TABLE and BUTTON (and INPUT type=button) are always border-box by default.
		// If you have assigned a different box to either one via CSS then
		// box functions will break.

		return geom.boxModel == "border-box" || node.tagName.toLowerCase() == "table" || isButtonTag(node); // boolean
	}

	geom.setContentSize = function setContentSize(/*DomNode*/ node, /*Object*/ box, /*Object*/ computedStyle){
		// summary:
		//		Sets the size of the node's contents, irrespective of margins,
		//		padding, or borders.
		// node: DOMNode
		// box: Object
		//		hash with optional "w", and "h" properties for "width", and "height"
		//		respectively. All specified properties should have numeric values in whole pixels.
		// computedStyle: Object?
		//		This parameter accepts computed styles object.
		//		If this parameter is omitted, the functions will call
		//		dojo.getComputedStyle to get one. It is a better way, calling
		//		dojo.computedStyle once, and then pass the reference to this
		//		computedStyle parameter. Wherever possible, reuse the returned
		//		object of dojo/dom-style.getComputedStyle().

		node = dom.byId(node);
		var w = box.w, h = box.h;
		if(usesBorderBox(node)){
			var pb = geom.getPadBorderExtents(node, computedStyle);
			if(w >= 0){
				w += pb.w;
			}
			if(h >= 0){
				h += pb.h;
			}
		}
		setBox(node, NaN, NaN, w, h);
	};

	var nilExtents = {l: 0, t: 0, w: 0, h: 0};

	geom.setMarginBox = function setMarginBox(/*DomNode*/ node, /*Object*/ box, /*Object*/ computedStyle){
		// summary:
		//		sets the size of the node's margin box and placement
		//		(left/top), irrespective of box model. Think of it as a
		//		passthrough to setBox that handles box-model vagaries for
		//		you.
		// node: DOMNode
		// box: Object
		//		hash with optional "l", "t", "w", and "h" properties for "left", "right", "width", and "height"
		//		respectively. All specified properties should have numeric values in whole pixels.
		// computedStyle: Object?
		//		This parameter accepts computed styles object.
		//		If this parameter is omitted, the functions will call
		//		dojo.getComputedStyle to get one. It is a better way, calling
		//		dojo.computedStyle once, and then pass the reference to this
		//		computedStyle parameter. Wherever possible, reuse the returned
		//		object of dojo/dom-style.getComputedStyle().

		node = dom.byId(node);
		var s = computedStyle || style.getComputedStyle(node), w = box.w, h = box.h,
		// Some elements have special padding, margin, and box-model settings.
		// To use box functions you may need to set padding, margin explicitly.
		// Controlling box-model is harder, in a pinch you might set dojo/dom-geometry.boxModel.
			pb = usesBorderBox(node) ? nilExtents : geom.getPadBorderExtents(node, s),
			mb = geom.getMarginExtents(node, s);
		if(has("webkit")){
			// on Safari (3.1.2), button nodes with no explicit size have a default margin
			// setting an explicit size eliminates the margin.
			// We have to swizzle the width to get correct margin reading.
			if(isButtonTag(node)){
				var ns = node.style;
				if(w >= 0 && !ns.width){
					ns.width = "4px";
				}
				if(h >= 0 && !ns.height){
					ns.height = "4px";
				}
			}
		}
		if(w >= 0){
			w = Math.max(w - pb.w - mb.w, 0);
		}
		if(h >= 0){
			h = Math.max(h - pb.h - mb.h, 0);
		}
		setBox(node, box.l, box.t, w, h);
	};

	// =============================
	// Positioning
	// =============================

	geom.isBodyLtr = function isBodyLtr(/*Document?*/ doc){
		// summary:
		//		Returns true if the current language is left-to-right, and false otherwise.
		// doc: Document?
		//		Optional document to query.   If unspecified, use win.doc.
		// returns: Boolean

		doc = doc || win.doc;
		return (win.body(doc).dir || doc.documentElement.dir || "ltr").toLowerCase() == "ltr"; // Boolean
	};

	geom.docScroll = function docScroll(/*Document?*/ doc){
		// summary:
		//		Returns an object with {node, x, y} with corresponding offsets.
		// doc: Document?
		//		Optional document to query.   If unspecified, use win.doc.
		// returns: Object

		doc = doc || win.doc;
		var node = win.doc.parentWindow || win.doc.defaultView;   // use UI window, not dojo.global window.   TODO: use dojo/window::get() except for circular dependency problem
		return "pageXOffset" in node ? {x: node.pageXOffset, y: node.pageYOffset } :
			(node = has("quirks") ? win.body(doc) : doc.documentElement) &&
				{x: geom.fixIeBiDiScrollLeft(node.scrollLeft || 0, doc), y: node.scrollTop || 0 };
	};

	if(has("ie")){
		geom.getIeDocumentElementOffset = function getIeDocumentElementOffset(/*Document?*/ doc){
			// summary:
			//		returns the offset in x and y from the document body to the
			//		visual edge of the page for IE
			// doc: Document?
			//		Optional document to query.   If unspecified, use win.doc.
			// description:
			//		The following values in IE contain an offset:
			//	|		event.clientX
			//	|		event.clientY
			//	|		node.getBoundingClientRect().left
			//	|		node.getBoundingClientRect().top
			//		But other position related values do not contain this offset,
			//		such as node.offsetLeft, node.offsetTop, node.style.left and
			//		node.style.top. The offset is always (2, 2) in LTR direction.
			//		When the body is in RTL direction, the offset counts the width
			//		of left scroll bar's width.  This function computes the actual
			//		offset.

			//NOTE: assumes we're being called in an IE browser

			doc = doc || win.doc;
			var de = doc.documentElement; // only deal with HTML element here, position() handles body/quirks

			if(has("ie") < 8){
				var r = de.getBoundingClientRect(), // works well for IE6+
					l = r.left, t = r.top;
				if(has("ie") < 7){
					l += de.clientLeft;	// scrollbar size in strict/RTL, or,
					t += de.clientTop;	// HTML border size in strict
				}
				return {
					x: l < 0 ? 0 : l, // FRAME element border size can lead to inaccurate negative values
					y: t < 0 ? 0 : t
				};
			}else{
				return {
					x: 0,
					y: 0
				};
			}
		};
	}

	geom.fixIeBiDiScrollLeft = function fixIeBiDiScrollLeft(/*Integer*/ scrollLeft, /*Document?*/ doc){
		// summary:
		//		In RTL direction, scrollLeft should be a negative value, but IE
		//		returns a positive one. All codes using documentElement.scrollLeft
		//		must call this function to fix this error, otherwise the position
		//		will offset to right when there is a horizontal scrollbar.
		// scrollLeft: Number
		// doc: Document?
		//		Optional document to query.   If unspecified, use win.doc.
		// returns: Number

		// In RTL direction, scrollLeft should be a negative value, but IE
		// returns a positive one. All codes using documentElement.scrollLeft
		// must call this function to fix this error, otherwise the position
		// will offset to right when there is a horizontal scrollbar.

		doc = doc || win.doc;
		var ie = has("ie");
		if(ie && !geom.isBodyLtr(doc)){
			var qk = has("quirks"),
				de = qk ? win.body(doc) : doc.documentElement,
				pwin = win.global;	// TODO: use winUtils.get(doc) after resolving circular dependency b/w dom-geometry.js and dojo/window.js
			if(ie == 6 && !qk && pwin.frameElement && de.scrollHeight > de.clientHeight){
				scrollLeft += de.clientLeft; // workaround ie6+strict+rtl+iframe+vertical-scrollbar bug where clientWidth is too small by clientLeft pixels
			}
			return (ie < 8 || qk) ? (scrollLeft + de.clientWidth - de.scrollWidth) : -scrollLeft; // Integer
		}
		return scrollLeft; // Integer
	};

	geom.position = function(/*DomNode*/ node, /*Boolean?*/ includeScroll){
		// summary:
		//		Gets the position and size of the passed element relative to
		//		the viewport (if includeScroll==false), or relative to the
		//		document root (if includeScroll==true).
		//
		// description:
		//		Returns an object of the form:
		//		`{ x: 100, y: 300, w: 20, h: 15 }`.
		//		If includeScroll==true, the x and y values will include any
		//		document offsets that may affect the position relative to the
		//		viewport.
		//		Uses the border-box model (inclusive of border and padding but
		//		not margin).  Does not act as a setter.
		// node: DOMNode|String
		// includeScroll: Boolean?
		// returns: Object

		node = dom.byId(node);
		var	db = win.body(node.ownerDocument),
			ret = node.getBoundingClientRect();
		ret = {x: ret.left, y: ret.top, w: ret.right - ret.left, h: ret.bottom - ret.top};

		if(has("ie") < 9){
			// On IE<9 there's a 2px offset that we need to adjust for, see dojo.getIeDocumentElementOffset()
			var offset = geom.getIeDocumentElementOffset(node.ownerDocument);

			// fixes the position in IE, quirks mode
			ret.x -= offset.x + (has("quirks") ? db.clientLeft + db.offsetLeft : 0);
			ret.y -= offset.y + (has("quirks") ? db.clientTop + db.offsetTop : 0);
		}

		// account for document scrolling
		// if offsetParent is used, ret value already includes scroll position
		// so we may have to actually remove that value if !includeScroll
		if(includeScroll){
			var scroll = geom.docScroll(node.ownerDocument);
			ret.x += scroll.x;
			ret.y += scroll.y;
		}

		return ret; // Object
	};

	// random "private" functions wildly used throughout the toolkit

	geom.getMarginSize = function getMarginSize(/*DomNode*/ node, /*Object*/ computedStyle){
		// summary:
		//		returns an object that encodes the width and height of
		//		the node's margin box
		// node: DOMNode|String
		// computedStyle: Object?
		//		This parameter accepts computed styles object.
		//		If this parameter is omitted, the functions will call
		//		dojo.getComputedStyle to get one. It is a better way, calling
		//		dojo.computedStyle once, and then pass the reference to this
		//		computedStyle parameter. Wherever possible, reuse the returned
		//		object of dojo/dom-style.getComputedStyle().

		node = dom.byId(node);
		var me = geom.getMarginExtents(node, computedStyle || style.getComputedStyle(node));
		var size = node.getBoundingClientRect();
		return {
			w: (size.right - size.left) + me.w,
			h: (size.bottom - size.top) + me.h
		};
	};

	geom.normalizeEvent = function(event){
		// summary:
		//		Normalizes the geometry of a DOM event, normalizing the pageX, pageY,
		//		offsetX, offsetY, layerX, and layerX properties
		// event: Object
		if(!("layerX" in event)){
			event.layerX = event.offsetX;
			event.layerY = event.offsetY;
		}
		if(!has("dom-addeventlistener")){
			// old IE version
			// FIXME: scroll position query is duped from dojo.html to
			// avoid dependency on that entire module. Now that HTML is in
			// Base, we should convert back to something similar there.
			var se = event.target;
			var doc = (se && se.ownerDocument) || document;
			// DO NOT replace the following to use dojo.body(), in IE, document.documentElement should be used
			// here rather than document.body
			var docBody = has("quirks") ? doc.body : doc.documentElement;
			var offset = geom.getIeDocumentElementOffset(doc);
			event.pageX = event.clientX + geom.fixIeBiDiScrollLeft(docBody.scrollLeft || 0, doc) - offset.x;
			event.pageY = event.clientY + (docBody.scrollTop || 0) - offset.y;
		}
	};

	// TODO: evaluate separate getters/setters for position and sizes?

	return geom;
});

},
'dojo/dom-prop':function(){
define(["exports", "./_base/kernel", "./sniff", "./_base/lang", "./dom", "./dom-style", "./dom-construct", "./_base/connect"],
		function(exports, dojo, has, lang, dom, style, ctr, conn){
	// module:
	//		dojo/dom-prop
	// summary:
	//		This module defines the core dojo DOM properties API.
	//		Indirectly depends on dojo.empty() and dojo.toDom().

	// TODOC: summary not showing up in output, see https://github.com/csnover/js-doc-parse/issues/42

	// =============================
	// Element properties Functions
	// =============================

	// helper to connect events
	var _evtHdlrMap = {}, _ctr = 0, _attrId = dojo._scopeName + "attrid";

	exports.names = {
		// properties renamed to avoid clashes with reserved words
		"class": "className",
		"for": "htmlFor",
		// properties written as camelCase
		tabindex: "tabIndex",
		readonly: "readOnly",
		colspan: "colSpan",
		frameborder: "frameBorder",
		rowspan: "rowSpan",
		valuetype: "valueType"
	};

	exports.get = function getProp(/*DOMNode|String*/ node, /*String*/ name){
		// summary:
		//		Gets a property on an HTML element.
		// description:
		//		Handles normalized getting of properties on DOM nodes.
		//
		// node: DOMNode|String
		//		id or reference to the element to get the property on
		// name: String
		//		the name of the property to get.
		// returns:
		//		the value of the requested property or its default value
		//
		// example:
		//	|	// get the current value of the "foo" property on a node
		//	|	dojo.getProp(dojo.byId("nodeId"), "foo");
		//	|	// or we can just pass the id:
		//	|	dojo.getProp("nodeId", "foo");

		node = dom.byId(node);
		var lc = name.toLowerCase(), propName = exports.names[lc] || name;
		return node[propName];	// Anything
	};

	exports.set = function setProp(/*DOMNode|String*/ node, /*String|Object*/ name, /*String?*/ value){
		// summary:
		//		Sets a property on an HTML element.
		// description:
		//		Handles normalized setting of properties on DOM nodes.
		//
		//		When passing functions as values, note that they will not be
		//		directly assigned to slots on the node, but rather the default
		//		behavior will be removed and the new behavior will be added
		//		using `dojo.connect()`, meaning that event handler properties
		//		will be normalized and that some caveats with regards to
		//		non-standard behaviors for onsubmit apply. Namely that you
		//		should cancel form submission using `dojo.stopEvent()` on the
		//		passed event object instead of returning a boolean value from
		//		the handler itself.
		// node: DOMNode|String
		//		id or reference to the element to set the property on
		// name: String|Object
		//		the name of the property to set, or a hash object to set
		//		multiple properties at once.
		// value: String?
		//		The value to set for the property
		// returns:
		//		the DOM node
		//
		// example:
		//	|	// use prop() to set the tab index
		//	|	dojo.setProp("nodeId", "tabIndex", 3);
		//	|
		//
		// example:
		//	Set multiple values at once, including event handlers:
		//	|	dojo.setProp("formId", {
		//	|		"foo": "bar",
		//	|		"tabIndex": -1,
		//	|		"method": "POST",
		//	|		"onsubmit": function(e){
		//	|			// stop submitting the form. Note that the IE behavior
		//	|			// of returning true or false will have no effect here
		//	|			// since our handler is connect()ed to the built-in
		//	|			// onsubmit behavior and so we need to use
		//	|			// dojo.stopEvent() to ensure that the submission
		//	|			// doesn't proceed.
		//	|			dojo.stopEvent(e);
		//	|
		//	|			// submit the form with Ajax
		//	|			dojo.xhrPost({ form: "formId" });
		//	|		}
		//	|	});
		//
		// example:
		//	Style is s special case: Only set with an object hash of styles
		//	|	dojo.setProp("someNode",{
		//	|		id:"bar",
		//	|		style:{
		//	|			width:"200px", height:"100px", color:"#000"
		//	|		}
		//	|	});
		//
		// example:
		//	Again, only set style as an object hash of styles:
		//	|	var obj = { color:"#fff", backgroundColor:"#000" };
		//	|	dojo.setProp("someNode", "style", obj);
		//	|
		//	|	// though shorter to use `dojo.style()` in this case:
		//	|	dojo.style("someNode", obj);

		node = dom.byId(node);
		var l = arguments.length;
		if(l == 2 && typeof name != "string"){ // inline'd type check
			// the object form of setter: the 2nd argument is a dictionary
			for(var x in name){
				exports.set(node, x, name[x]);
			}
			return node; // DomNode
		}
		var lc = name.toLowerCase(), propName = exports.names[lc] || name;
		if(propName == "style" && typeof value != "string"){ // inline'd type check
			// special case: setting a style
			style.set(node, value);
			return node; // DomNode
		}
		if(propName == "innerHTML"){
			// special case: assigning HTML
			// the hash lists elements with read-only innerHTML on IE
			if(has("ie") && node.tagName.toLowerCase() in {col: 1, colgroup: 1,
						table: 1, tbody: 1, tfoot: 1, thead: 1, tr: 1, title: 1}){
				ctr.empty(node);
				node.appendChild(ctr.toDom(value, node.ownerDocument));
			}else{
				node[propName] = value;
			}
			return node; // DomNode
		}
		if(lang.isFunction(value)){
			// special case: assigning an event handler
			// clobber if we can
			var attrId = node[_attrId];
			if(!attrId){
				attrId = _ctr++;
				node[_attrId] = attrId;
			}
			if(!_evtHdlrMap[attrId]){
				_evtHdlrMap[attrId] = {};
			}
			var h = _evtHdlrMap[attrId][propName];
			if(h){
				//h.remove();
				conn.disconnect(h);
			}else{
				try{
					delete node[propName];
				}catch(e){}
			}
			// ensure that event objects are normalized, etc.
			if(value){
				//_evtHdlrMap[attrId][propName] = on(node, propName, value);
				_evtHdlrMap[attrId][propName] = conn.connect(node, propName, value);
			}else{
				node[propName] = null;
			}
			return node; // DomNode
		}
		node[propName] = value;
		return node;	// DomNode
	};
});

},
'dojo/fx/easing':function(){
define(["../_base/lang"], function(lang){

// module:
//		dojo/fx/easing

var easingFuncs = {
	// summary:
	//		Collection of easing functions to use beyond the default
	//		`dojo._defaultEasing` function.
	// description:
	//		Easing functions are used to manipulate the iteration through
	//		an `dojo.Animation`s _Line. _Line being the properties of an Animation,
	//		and the easing function progresses through that Line determining
	//		how quickly (or slowly) it should go. Or more accurately: modify
	//		the value of the _Line based on the percentage of animation completed.
	//
	//		All functions follow a simple naming convention of "ease type" + "when".
	//		If the name of the function ends in Out, the easing described appears
	//		towards the end of the animation. "In" means during the beginning,
	//		and InOut means both ranges of the Animation will applied, both
	//		beginning and end.
	//
	//		One does not call the easing function directly, it must be passed to
	//		the `easing` property of an animation.
	// example:
	//	|	dojo.require("dojo.fx.easing");
	//	|	var anim = dojo.fadeOut({
	//	|		node: 'node',
	//	|		duration: 2000,
	//	|		//	note there is no ()
	//	|		easing: dojo.fx.easing.quadIn
	//	|	}).play();
	//

	linear: function(/* Decimal? */n){
		// summary:
		//		A linear easing function
		return n;
	},

	quadIn: function(/* Decimal? */n){
		return Math.pow(n, 2);
	},

	quadOut: function(/* Decimal? */n){
		return n * (n - 2) * -1;
	},

	quadInOut: function(/* Decimal? */n){
		n = n * 2;
		if(n < 1){ return Math.pow(n, 2) / 2; }
		return -1 * ((--n) * (n - 2) - 1) / 2;
	},

	cubicIn: function(/* Decimal? */n){
		return Math.pow(n, 3);
	},

	cubicOut: function(/* Decimal? */n){
		return Math.pow(n - 1, 3) + 1;
	},

	cubicInOut: function(/* Decimal? */n){
		n = n * 2;
		if(n < 1){ return Math.pow(n, 3) / 2; }
		n -= 2;
		return (Math.pow(n, 3) + 2) / 2;
	},

	quartIn: function(/* Decimal? */n){
		return Math.pow(n, 4);
	},

	quartOut: function(/* Decimal? */n){
		return -1 * (Math.pow(n - 1, 4) - 1);
	},

	quartInOut: function(/* Decimal? */n){
		n = n * 2;
		if(n < 1){ return Math.pow(n, 4) / 2; }
		n -= 2;
		return -1 / 2 * (Math.pow(n, 4) - 2);
	},

	quintIn: function(/* Decimal? */n){
		return Math.pow(n, 5);
	},

	quintOut: function(/* Decimal? */n){
		return Math.pow(n - 1, 5) + 1;
	},

	quintInOut: function(/* Decimal? */n){
		n = n * 2;
		if(n < 1){ return Math.pow(n, 5) / 2; }
		n -= 2;
		return (Math.pow(n, 5) + 2) / 2;
	},

	sineIn: function(/* Decimal? */n){
		return -1 * Math.cos(n * (Math.PI / 2)) + 1;
	},

	sineOut: function(/* Decimal? */n){
		return Math.sin(n * (Math.PI / 2));
	},

	sineInOut: function(/* Decimal? */n){
		return -1 * (Math.cos(Math.PI * n) - 1) / 2;
	},

	expoIn: function(/* Decimal? */n){
		return (n == 0) ? 0 : Math.pow(2, 10 * (n - 1));
	},

	expoOut: function(/* Decimal? */n){
		return (n == 1) ? 1 : (-1 * Math.pow(2, -10 * n) + 1);
	},

	expoInOut: function(/* Decimal? */n){
		if(n == 0){ return 0; }
		if(n == 1){ return 1; }
		n = n * 2;
		if(n < 1){ return Math.pow(2, 10 * (n - 1)) / 2; }
		--n;
		return (-1 * Math.pow(2, -10 * n) + 2) / 2;
	},

	circIn: function(/* Decimal? */n){
		return -1 * (Math.sqrt(1 - Math.pow(n, 2)) - 1);
	},

	circOut: function(/* Decimal? */n){
		n = n - 1;
		return Math.sqrt(1 - Math.pow(n, 2));
	},

	circInOut: function(/* Decimal? */n){
		n = n * 2;
		if(n < 1){ return -1 / 2 * (Math.sqrt(1 - Math.pow(n, 2)) - 1); }
		n -= 2;
		return 1 / 2 * (Math.sqrt(1 - Math.pow(n, 2)) + 1);
	},

	backIn: function(/* Decimal? */n){
		// summary:
		//		An easing function that starts away from the target,
		//		and quickly accelerates towards the end value.
		//
		//		Use caution when the easing will cause values to become
		//		negative as some properties cannot be set to negative values.
		var s = 1.70158;
		return Math.pow(n, 2) * ((s + 1) * n - s);
	},

	backOut: function(/* Decimal? */n){
		// summary:
		//		An easing function that pops past the range briefly, and slowly comes back.
		// description:
		//		An easing function that pops past the range briefly, and slowly comes back.
		//
		//		Use caution when the easing will cause values to become negative as some
		//		properties cannot be set to negative values.

		n = n - 1;
		var s = 1.70158;
		return Math.pow(n, 2) * ((s + 1) * n + s) + 1;
	},

	backInOut: function(/* Decimal? */n){
		// summary:
		//		An easing function combining the effects of `backIn` and `backOut`
		// description:
		//		An easing function combining the effects of `backIn` and `backOut`.
		//		Use caution when the easing will cause values to become negative
		//		as some properties cannot be set to negative values.
		var s = 1.70158 * 1.525;
		n = n * 2;
		if(n < 1){ return (Math.pow(n, 2) * ((s + 1) * n - s)) / 2; }
		n-=2;
		return (Math.pow(n, 2) * ((s + 1) * n + s) + 2) / 2;
	},

	elasticIn: function(/* Decimal? */n){
		// summary:
		//		An easing function the elastically snaps from the start value
		// description:
		//		An easing function the elastically snaps from the start value
		//
		//		Use caution when the elasticity will cause values to become negative
		//		as some properties cannot be set to negative values.
		if(n == 0 || n == 1){ return n; }
		var p = .3;
		var s = p / 4;
		n = n - 1;
		return -1 * Math.pow(2, 10 * n) * Math.sin((n - s) * (2 * Math.PI) / p);
	},

	elasticOut: function(/* Decimal? */n){
		// summary:
		//		An easing function that elasticly snaps around the target value,
		//		near the end of the Animation
		// description:
		//		An easing function that elasticly snaps around the target value,
		//		near the end of the Animation
		//
		//		Use caution when the elasticity will cause values to become
		//		negative as some properties cannot be set to negative values.
		if(n==0 || n == 1){ return n; }
		var p = .3;
		var s = p / 4;
		return Math.pow(2, -10 * n) * Math.sin((n - s) * (2 * Math.PI) / p) + 1;
	},

	elasticInOut: function(/* Decimal? */n){
		// summary:
		//		An easing function that elasticly snaps around the value, near
		//		the beginning and end of the Animation.
		// description:
		//		An easing function that elasticly snaps around the value, near
		//		the beginning and end of the Animation.
		//
		//		Use caution when the elasticity will cause values to become
		//		negative as some properties cannot be set to negative values.
		if(n == 0) return 0;
		n = n * 2;
		if(n == 2) return 1;
		var p = .3 * 1.5;
		var s = p / 4;
		if(n < 1){
			n -= 1;
			return -.5 * (Math.pow(2, 10 * n) * Math.sin((n - s) * (2 * Math.PI) / p));
		}
		n -= 1;
		return .5 * (Math.pow(2, -10 * n) * Math.sin((n - s) * (2 * Math.PI) / p)) + 1;
	},

	bounceIn: function(/* Decimal? */n){
		// summary:
		//		An easing function that 'bounces' near the beginning of an Animation
		return (1 - easingFuncs.bounceOut(1 - n)); // Decimal
	},

	bounceOut: function(/* Decimal? */n){
		// summary:
		//		An easing function that 'bounces' near the end of an Animation
		var s = 7.5625;
		var p = 2.75;
		var l;
		if(n < (1 / p)){
			l = s * Math.pow(n, 2);
		}else if(n < (2 / p)){
			n -= (1.5 / p);
			l = s * Math.pow(n, 2) + .75;
		}else if(n < (2.5 / p)){
			n -= (2.25 / p);
			l = s * Math.pow(n, 2) + .9375;
		}else{
			n -= (2.625 / p);
			l = s * Math.pow(n, 2) + .984375;
		}
		return l;
	},

	bounceInOut: function(/* Decimal? */n){
		// summary:
		//		An easing function that 'bounces' at the beginning and end of the Animation
		if(n < 0.5){ return easingFuncs.bounceIn(n * 2) / 2; }
		return (easingFuncs.bounceOut(n * 2 - 1) / 2) + 0.5; // Decimal
	}
};

lang.setObject("dojo.fx.easing", easingFuncs);

return easingFuncs;
});

},
'dojo/dom-attr':function(){
define(["exports", "./sniff", "./_base/lang", "./dom", "./dom-style", "./dom-prop"],
		function(exports, has, lang, dom, style, prop){
	// module:
	//		dojo/dom-attr
	// summary:
	//		This module defines the core dojo DOM attributes API.

	// TODOC: summary not showing up in output see https://github.com/csnover/js-doc-parse/issues/42

	// =============================
	// Element attribute Functions
	// =============================

	// This module will be obsolete soon. Use dojo/prop instead.

	// dojo.attr() should conform to http://www.w3.org/TR/DOM-Level-2-Core/

	// attribute-related functions (to be obsolete soon)

	var forcePropNames = {
			innerHTML:	1,
			className:	1,
			htmlFor:	has("ie"),
			value:		1
		},
		attrNames = {
			// original attribute names
			classname: "class",
			htmlfor: "for",
			// for IE
			tabindex: "tabIndex",
			readonly: "readOnly"
		};

	function _hasAttr(node, name){
		var attr = node.getAttributeNode && node.getAttributeNode(name);
		return attr && attr.specified; // Boolean
	}

	// There is a difference in the presence of certain properties and their default values
	// between browsers. For example, on IE "disabled" is present on all elements,
	// but it is value is "false"; "tabIndex" of <div> returns 0 by default on IE, yet other browsers
	// can return -1.

	exports.has = function hasAttr(/*DOMNode|String*/ node, /*String*/ name){
		// summary:
		//		Returns true if the requested attribute is specified on the
		//		given element, and false otherwise.
		// node: DOMNode|String
		//		id or reference to the element to check
		// name: String
		//		the name of the attribute
		// returns: Boolean
		//		true if the requested attribute is specified on the
		//		given element, and false otherwise

		var lc = name.toLowerCase();
		return forcePropNames[prop.names[lc] || name] || _hasAttr(dom.byId(node), attrNames[lc] || name);	// Boolean
	};

	exports.get = function getAttr(/*DOMNode|String*/ node, /*String*/ name){
		// summary:
		//		Gets an attribute on an HTML element.
		// description:
		//		Handles normalized getting of attributes on DOM Nodes.
		// node: DOMNode|String
		//		id or reference to the element to get the attribute on
		// name: String
		//		the name of the attribute to get.
		// returns:
		//		the value of the requested attribute or null if that attribute does not have a specified or
		//		default value;
		//
		// example:
		//	|	// get the current value of the "foo" attribute on a node
		//	|	dojo.getAttr(dojo.byId("nodeId"), "foo");
		//	|	// or we can just pass the id:
		//	|	dojo.getAttr("nodeId", "foo");

		node = dom.byId(node);
		var lc = name.toLowerCase(),
			propName = prop.names[lc] || name,
			forceProp = forcePropNames[propName],
			value = node[propName];		// should we access this attribute via a property or via getAttribute()?

		if(forceProp && typeof value != "undefined"){
			// node's property
			return value;	// Anything
		}
		if(propName != "href" && (typeof value == "boolean" || lang.isFunction(value))){
			// node's property
			return value;	// Anything
		}
		// node's attribute
		// we need _hasAttr() here to guard against IE returning a default value
		var attrName = attrNames[lc] || name;
		return _hasAttr(node, attrName) ? node.getAttribute(attrName) : null; // Anything
	};

	exports.set = function setAttr(/*DOMNode|String*/ node, /*String|Object*/ name, /*String?*/ value){
		// summary:
		//		Sets an attribute on an HTML element.
		// description:
		//		Handles normalized setting of attributes on DOM Nodes.
		//
		//		When passing functions as values, note that they will not be
		//		directly assigned to slots on the node, but rather the default
		//		behavior will be removed and the new behavior will be added
		//		using `dojo.connect()`, meaning that event handler properties
		//		will be normalized and that some caveats with regards to
		//		non-standard behaviors for onsubmit apply. Namely that you
		//		should cancel form submission using `dojo.stopEvent()` on the
		//		passed event object instead of returning a boolean value from
		//		the handler itself.
		// node: DOMNode|String
		//		id or reference to the element to set the attribute on
		// name: String|Object
		//		the name of the attribute to set, or a hash of key-value pairs to set.
		// value: String?
		//		the value to set for the attribute, if the name is a string.
		// returns:
		//		the DOM node
		//
		// example:
		//	|	// use attr() to set the tab index
		//	|	dojo.setAttr("nodeId", "tabIndex", 3);
		//
		// example:
		//	Set multiple values at once, including event handlers:
		//	|	dojo.setAttr("formId", {
		//	|		"foo": "bar",
		//	|		"tabIndex": -1,
		//	|		"method": "POST",
		//	|		"onsubmit": function(e){
		//	|			// stop submitting the form. Note that the IE behavior
		//	|			// of returning true or false will have no effect here
		//	|			// since our handler is connect()ed to the built-in
		//	|			// onsubmit behavior and so we need to use
		//	|			// dojo.stopEvent() to ensure that the submission
		//	|			// doesn't proceed.
		//	|			dojo.stopEvent(e);
		//	|
		//	|			// submit the form with Ajax
		//	|			dojo.xhrPost({ form: "formId" });
		//	|		}
		//	|	});
		//
		// example:
		//	Style is s special case: Only set with an object hash of styles
		//	|	dojo.setAttr("someNode",{
		//	|		id:"bar",
		//	|		style:{
		//	|			width:"200px", height:"100px", color:"#000"
		//	|		}
		//	|	});
		//
		// example:
		//	Again, only set style as an object hash of styles:
		//	|	var obj = { color:"#fff", backgroundColor:"#000" };
		//	|	dojo.setAttr("someNode", "style", obj);
		//	|
		//	|	// though shorter to use `dojo.style()` in this case:
		//	|	dojo.setStyle("someNode", obj);

		node = dom.byId(node);
		if(arguments.length == 2){ // inline'd type check
			// the object form of setter: the 2nd argument is a dictionary
			for(var x in name){
				exports.set(node, x, name[x]);
			}
			return node; // DomNode
		}
		var lc = name.toLowerCase(),
			propName = prop.names[lc] || name,
			forceProp = forcePropNames[propName];
		if(propName == "style" && typeof value != "string"){ // inline'd type check
			// special case: setting a style
			style.set(node, value);
			return node; // DomNode
		}
		if(forceProp || typeof value == "boolean" || lang.isFunction(value)){
			return prop.set(node, name, value);
		}
		// node's attribute
		node.setAttribute(attrNames[lc] || name, value);
		return node; // DomNode
	};

	exports.remove = function removeAttr(/*DOMNode|String*/ node, /*String*/ name){
		// summary:
		//		Removes an attribute from an HTML element.
		// node: DOMNode|String
		//		id or reference to the element to remove the attribute from
		// name: String
		//		the name of the attribute to remove

		dom.byId(node).removeAttribute(attrNames[name.toLowerCase()] || name);
	};

	exports.getNodeProp = function getNodeProp(/*DomNode|String*/ node, /*String*/ name){
		// summary:
		//		Returns an effective value of a property or an attribute.
		// node: DOMNode|String
		//		id or reference to the element to remove the attribute from
		// name: String
		//		the name of the attribute
		// returns:
		//		the value of the attribute

		node = dom.byId(node);
		var lc = name.toLowerCase(), propName = prop.names[lc] || name;
		if((propName in node) && propName != "href"){
			// node's property
			return node[propName];	// Anything
		}
		// node's attribute
		var attrName = attrNames[lc] || name;
		return _hasAttr(node, attrName) ? node.getAttribute(attrName) : null; // Anything
	};
});

},
'dojo/dom-construct':function(){
define(["exports", "./_base/kernel", "./sniff", "./_base/window", "./dom", "./dom-attr", "./on"],
		function(exports, dojo, has, win, dom, attr, on){
	// module:
	//		dojo/dom-construct
	// summary:
	//		This module defines the core dojo DOM construction API.

	// TODOC: summary not showing up in output, see https://github.com/csnover/js-doc-parse/issues/42

	// support stuff for toDom()
	var tagWrap = {
			option: ["select"],
			tbody: ["table"],
			thead: ["table"],
			tfoot: ["table"],
			tr: ["table", "tbody"],
			td: ["table", "tbody", "tr"],
			th: ["table", "thead", "tr"],
			legend: ["fieldset"],
			caption: ["table"],
			colgroup: ["table"],
			col: ["table", "colgroup"],
			li: ["ul"]
		},
		reTag = /<\s*([\w\:]+)/,
		masterNode = {}, masterNum = 0,
		masterName = "__" + dojo._scopeName + "ToDomId";

	// generate start/end tag strings to use
	// for the injection for each special tag wrap case.
	for(var param in tagWrap){
		if(tagWrap.hasOwnProperty(param)){
			var tw = tagWrap[param];
			tw.pre = param == "option" ? '<select multiple="multiple">' : "<" + tw.join("><") + ">";
			tw.post = "</" + tw.reverse().join("></") + ">";
			// the last line is destructive: it reverses the array,
			// but we don't care at this point
		}
	}

	function _insertBefore(/*DomNode*/ node, /*DomNode*/ ref){
		var parent = ref.parentNode;
		if(parent){
			parent.insertBefore(node, ref);
		}
	}

	function _insertAfter(/*DomNode*/ node, /*DomNode*/ ref){
		// summary:
		//		Try to insert node after ref
		var parent = ref.parentNode;
		if(parent){
			if(parent.lastChild == ref){
				parent.appendChild(node);
			}else{
				parent.insertBefore(node, ref.nextSibling);
			}
		}
	}

	exports.toDom = function toDom(frag, doc){
		// summary:
		//		instantiates an HTML fragment returning the corresponding DOM.
		// frag: String
		//		the HTML fragment
		// doc: DocumentNode?
		//		optional document to use when creating DOM nodes, defaults to
		//		dojo.doc if not specified.
		// returns:
		//		Document fragment, unless it's a single node in which case it returns the node itself
		// example:
		//		Create a table row:
		//	|	var tr = dojo.toDom("<tr><td>First!</td></tr>");

		doc = doc || win.doc;
		var masterId = doc[masterName];
		if(!masterId){
			doc[masterName] = masterId = ++masterNum + "";
			masterNode[masterId] = doc.createElement("div");
		}

		// make sure the frag is a string.
		frag += "";

		// find the starting tag, and get node wrapper
		var match = frag.match(reTag),
			tag = match ? match[1].toLowerCase() : "",
			master = masterNode[masterId],
			wrap, i, fc, df;
		if(match && tagWrap[tag]){
			wrap = tagWrap[tag];
			master.innerHTML = wrap.pre + frag + wrap.post;
			for(i = wrap.length; i; --i){
				master = master.firstChild;
			}
		}else{
			master.innerHTML = frag;
		}

		// one node shortcut => return the node itself
		if(master.childNodes.length == 1){
			return master.removeChild(master.firstChild); // DOMNode
		}

		// return multiple nodes as a document fragment
		df = doc.createDocumentFragment();
		while((fc = master.firstChild)){ // intentional assignment
			df.appendChild(fc);
		}
		return df; // DocumentFragment
	};

	exports.place = function place(/*DOMNode|String*/ node, /*DOMNode|String*/ refNode, /*String|Number?*/ position){
		// summary:
		//		Attempt to insert node into the DOM, choosing from various positioning options.
		//		Returns the first argument resolved to a DOM node.
		// node: DOMNode|String
		//		id or node reference, or HTML fragment starting with "<" to place relative to refNode
		// refNode: DOMNode|String
		//		id or node reference to use as basis for placement
		// position: String|Number?
		//		string noting the position of node relative to refNode or a
		//		number indicating the location in the childNodes collection of refNode.
		//		Accepted string values are:
		//
		//		- before
		//		- after
		//		- replace
		//		- only
		//		- first
		//		- last
		//
		//		"first" and "last" indicate positions as children of refNode, "replace" replaces refNode,
		//		"only" replaces all children.  position defaults to "last" if not specified
		// returns: DOMNode
		//		Returned values is the first argument resolved to a DOM node.
		//
		//		.place() is also a method of `dojo/NodeList`, allowing `dojo.query` node lookups.
		// example:
		//		Place a node by string id as the last child of another node by string id:
		//	|	dojo.place("someNode", "anotherNode");
		// example:
		//		Place a node by string id before another node by string id
		//	|	dojo.place("someNode", "anotherNode", "before");
		// example:
		//		Create a Node, and place it in the body element (last child):
		//	|	dojo.place("<div></div>", dojo.body());
		// example:
		//		Put a new LI as the first child of a list by id:
		//	|	dojo.place("<li></li>", "someUl", "first");

		refNode = dom.byId(refNode);
		if(typeof node == "string"){ // inline'd type check
			node = /^\s*</.test(node) ? exports.toDom(node, refNode.ownerDocument) : dom.byId(node);
		}
		if(typeof position == "number"){ // inline'd type check
			var cn = refNode.childNodes;
			if(!cn.length || cn.length <= position){
				refNode.appendChild(node);
			}else{
				_insertBefore(node, cn[position < 0 ? 0 : position]);
			}
		}else{
			switch(position){
				case "before":
					_insertBefore(node, refNode);
					break;
				case "after":
					_insertAfter(node, refNode);
					break;
				case "replace":
					refNode.parentNode.replaceChild(node, refNode);
					break;
				case "only":
					exports.empty(refNode);
					refNode.appendChild(node);
					break;
				case "first":
					if(refNode.firstChild){
						_insertBefore(node, refNode.firstChild);
						break;
					}
					// else fallthrough...
				default: // aka: last
					refNode.appendChild(node);
			}
		}
		return node; // DomNode
	};

	exports.create = function create(/*DOMNode|String*/ tag, /*Object*/ attrs, /*DOMNode|String?*/ refNode, /*String?*/ pos){
		// summary:
		//		Create an element, allowing for optional attribute decoration
		//		and placement.
		// description:
		//		A DOM Element creation function. A shorthand method for creating a node or
		//		a fragment, and allowing for a convenient optional attribute setting step,
		//		as well as an optional DOM placement reference.
		//
		//		Attributes are set by passing the optional object through `dojo.setAttr`.
		//		See `dojo.setAttr` for noted caveats and nuances, and API if applicable.
		//
		//		Placement is done via `dojo.place`, assuming the new node to be the action
		//		node, passing along the optional reference node and position.
		// tag: DOMNode|String
		//		A string of the element to create (eg: "div", "a", "p", "li", "script", "br"),
		//		or an existing DOM node to process.
		// attrs: Object
		//		An object-hash of attributes to set on the newly created node.
		//		Can be null, if you don't want to set any attributes/styles.
		//		See: `dojo.setAttr` for a description of available attributes.
		// refNode: DOMNode|String?
		//		Optional reference node. Used by `dojo.place` to place the newly created
		//		node somewhere in the dom relative to refNode. Can be a DomNode reference
		//		or String ID of a node.
		// pos: String?
		//		Optional positional reference. Defaults to "last" by way of `dojo.place`,
		//		though can be set to "first","after","before","last", "replace" or "only"
		//		to further control the placement of the new node relative to the refNode.
		//		'refNode' is required if a 'pos' is specified.
		// example:
		//		Create a DIV:
		//	|	var n = dojo.create("div");
		//
		// example:
		//		Create a DIV with content:
		//	|	var n = dojo.create("div", { innerHTML:"<p>hi</p>" });
		//
		// example:
		//		Place a new DIV in the BODY, with no attributes set
		//	|	var n = dojo.create("div", null, dojo.body());
		//
		// example:
		//		Create an UL, and populate it with LI's. Place the list as the first-child of a
		//		node with id="someId":
		//	|	var ul = dojo.create("ul", null, "someId", "first");
		//	|	var items = ["one", "two", "three", "four"];
		//	|	dojo.forEach(items, function(data){
		//	|		dojo.create("li", { innerHTML: data }, ul);
		//	|	});
		//
		// example:
		//		Create an anchor, with an href. Place in BODY:
		//	|	dojo.create("a", { href:"foo.html", title:"Goto FOO!" }, dojo.body());
		//
		// example:
		//		Create a `dojo/NodeList()` from a new element (for syntactic sugar):
		//	|	dojo.query(dojo.create('div'))
		//	|		.addClass("newDiv")
		//	|		.onclick(function(e){ console.log('clicked', e.target) })
		//	|		.place("#someNode"); // redundant, but cleaner.

		var doc = win.doc;
		if(refNode){
			refNode = dom.byId(refNode);
			doc = refNode.ownerDocument;
		}
		if(typeof tag == "string"){ // inline'd type check
			tag = doc.createElement(tag);
		}
		if(attrs){ attr.set(tag, attrs); }
		if(refNode){ exports.place(tag, refNode, pos); }
		return tag; // DomNode
	};

	var _empty = has("ie") ?
		function(/*DomNode*/ node){
			try{
				node.innerHTML = ""; // really fast when it works
			}catch(e){ // IE can generate Unknown Error
				for(var c; c = node.lastChild;){ // intentional assignment
					_destroy(c, node); // destroy is better than removeChild so TABLE elements are removed in proper order
				}
			}
		} :
		function(/*DomNode*/ node){
			node.innerHTML = "";
		};

	exports.empty = function empty(/*DOMNode|String*/ node){
		 // summary:
		 //		safely removes all children of the node.
		 // node: DOMNode|String
		 //		a reference to a DOM node or an id.
		 // example:
		 //		Destroy node's children byId:
		 //	|	dojo.empty("someId");
		 //
		 // example:
		 //		Destroy all nodes' children in a list by reference:
		 //	|	dojo.query(".someNode").forEach(dojo.empty);

		_empty(dom.byId(node));
	};


	function _destroy(/*DomNode*/ node, /*DomNode*/ parent){
		if(node.firstChild){
			_empty(node);
		}
		if(parent){
			parent.removeChild(node);
		}
	}
	exports.destroy = function destroy(/*DOMNode|String*/ node){
		// summary:
		//		Removes a node from its parent, clobbering it and all of its
		//		children.
		//
		// description:
		//		Removes a node from its parent, clobbering it and all of its
		//		children. Function only works with DomNodes, and returns nothing.
		//
		// node: DOMNode|String
		//		A String ID or DomNode reference of the element to be destroyed
		//
		// example:
		//		Destroy a node byId:
		//	|	dojo.destroy("someId");
		//
		// example:
		//		Destroy all nodes in a list by reference:
		//	|	dojo.query(".someNode").forEach(dojo.destroy);

		node = dom.byId(node);
		if(!node){ return; }
		_destroy(node, node.parentNode);
	};
});

},
'dojo/request/xhr':function(){
define("dojo/request/xhr", [
	'../errors/RequestError',
	'./watch',
	'./handlers',
	'./util',
	'../has'/*=====,
	'../request',
	'../_base/declare' =====*/
], function(RequestError, watch, handlers, util, has/*=====, request, declare =====*/){
	has.add('native-xhr', function(){
		// if true, the environment has a native XHR implementation
		return typeof XMLHttpRequest !== 'undefined';
	});
	has.add('dojo-force-activex-xhr', function(){
		return has('activex') && !document.addEventListener && window.location.protocol === 'file:';
	});

	has.add('native-xhr2', function(){
		if(!has('native-xhr')){ return; }
		var x = new XMLHttpRequest();
		return typeof x['addEventListener'] !== 'undefined' &&
			(typeof opera === 'undefined' || typeof x['upload'] !== 'undefined');
	});

	has.add('native-formdata', function(){
		// if true, the environment has a native FormData implementation
		return typeof FormData === 'function';
	});

	function handleResponse(response, error){
		var _xhr = response.xhr;
		response.status = response.xhr.status;
		response.text = _xhr.responseText;

		if(response.options.handleAs === 'xml'){
			response.data = _xhr.responseXML;
		}

		if(!error){
			try{
				handlers(response);
			}catch(e){
				error = e;
			}
		}

		if(error){
			this.reject(error);
		}else if(util.checkStatus(_xhr.status)){
			this.resolve(response);
		}else{
			error = new RequestError('Unable to load ' + response.url + ' status: ' + _xhr.status, response);

			this.reject(error);
		}
	}

	var isValid, isReady, addListeners, cancel;
	if(has('native-xhr2')){
		// Any platform with XHR2 will only use the watch mechanism for timeout.

		isValid = function(response){
			// summary:
			//		Check to see if the request should be taken out of the watch queue
			return !this.isFulfilled();
		};
		cancel = function(dfd, response){
			// summary:
			//		Canceler for deferred
			response.xhr.abort();
		};
		addListeners = function(_xhr, dfd, response){
			// summary:
			//		Adds event listeners to the XMLHttpRequest object
			function onLoad(evt){
				dfd.handleResponse(response);
			}
			function onError(evt){
				var _xhr = evt.target;
				var error = new RequestError('Unable to load ' + response.url + ' status: ' + _xhr.status, response); 
				dfd.handleResponse(response, error);
			}

			function onProgress(evt){
				if(evt.lengthComputable){
					response.loaded = evt.loaded;
					response.total = evt.total;
					dfd.progress(response);
				}
			}

			_xhr.addEventListener('load', onLoad, false);
			_xhr.addEventListener('error', onError, false);
			_xhr.addEventListener('progress', onProgress, false);

			return function(){
				_xhr.removeEventListener('load', onLoad, false);
				_xhr.removeEventListener('error', onError, false);
				_xhr.removeEventListener('progress', onProgress, false);
			};
		};
	}else{
		isValid = function(response){
			return response.xhr.readyState; //boolean
		};
		isReady = function(response){
			return 4 === response.xhr.readyState; //boolean
		};
		cancel = function(dfd, response){
			// summary:
			//		canceller function for util.deferred call.
			var xhr = response.xhr;
			var _at = typeof xhr.abort;
			if(_at === 'function' || _at === 'object' || _at === 'unknown'){
				xhr.abort();
			}
		};
	}

	var undefined,
		defaultOptions = {
			data: null,
			query: null,
			sync: false,
			method: 'GET',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		};
	function xhr(url, options, returnDeferred){
		var response = util.parseArgs(
			url,
			util.deepCreate(defaultOptions, options),
			has('native-formdata') && options && options.data && options.data instanceof FormData
		);
		url = response.url;
		options = response.options;

		var remover,
			last = function(){
				remover && remover();
			};

		//Make the Deferred object for this xhr request.
		var dfd = util.deferred(
			response,
			cancel,
			isValid,
			isReady,
			handleResponse,
			last
		);
		var _xhr = response.xhr = xhr._create();

		if(!_xhr){
			// If XHR factory somehow returns nothings,
			// cancel the deferred.
			dfd.cancel(new RequestError('XHR was not created'));
			return returnDeferred ? dfd : dfd.promise;
		}

		response.getHeader = function(headerName){
			return this.xhr.getResponseHeader(headerName);
		};

		if(addListeners){
			remover = addListeners(_xhr, dfd, response);
		}

		var data = options.data,
			async = !options.sync,
			method = options.method;

		try{
			// IE6 won't let you call apply() on the native function.
			_xhr.open(method, url, async, options.user || undefined, options.password || undefined);

			if(options.withCredentials){
				_xhr.withCredentials = options.withCredentials;
			}

			var headers = options.headers,
				contentType;
			if(headers){
				for(var hdr in headers){
					if(hdr.toLowerCase() === 'content-type'){
						contentType = headers[hdr];
					}else if(headers[hdr]){
						//Only add header if it has a value. This allows for instance, skipping
						//insertion of X-Requested-With by specifying empty value.
						_xhr.setRequestHeader(hdr, headers[hdr]);
					}
				}
			}

			if(contentType && contentType !== false){
				_xhr.setRequestHeader('Content-Type', contentType);
			}
			if(!headers || !('X-Requested-With' in headers)){
				_xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			}

			if(util.notify){
				util.notify.emit('send', response, dfd.promise.cancel);
			}
			_xhr.send(data);
		}catch(e){
			dfd.reject(e);
		}

		watch(dfd);
		_xhr = null;

		return returnDeferred ? dfd : dfd.promise;
	}

	/*=====
	xhr = function(url, options){
		// summary:
		//		Sends a request using XMLHttpRequest with the given URL and options.
		// url: String
		//		URL to request
		// options: dojo/request/xhr.__Options?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	xhr.__BaseOptions = declare(request.__BaseOptions, {
		// sync: Boolean?
		//		Whether to make a synchronous request or not. Default
		//		is `false` (asynchronous).
		// data: String|Object|FormData?
		//		Data to transfer. This is ignored for GET and DELETE
		//		requests.
		// headers: Object?
		//		Headers to use for the request.
		// user: String?
		//		Username to use during the request.
		// password: String?
		//		Password to use during the request.
		// withCredentials: Boolean?
		//		For cross-site requests, whether to send credentials
		//		or not.
	});
	xhr.__MethodOptions = declare(null, {
		// method: String?
		//		The HTTP method to use to make the request. Must be
		//		uppercase. Default is `"GET"`.
	});
	xhr.__Options = declare([xhr.__BaseOptions, xhr.__MethodOptions]);

	xhr.get = function(url, options){
		// summary:
		//		Send an HTTP GET request using XMLHttpRequest with the given URL and options.
		// url: String
		//		URL to request
		// options: dojo/request/xhr.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	xhr.post = function(url, options){
		// summary:
		//		Send an HTTP POST request using XMLHttpRequest with the given URL and options.
		// url: String
		//		URL to request
		// options: dojo/request/xhr.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	xhr.put = function(url, options){
		// summary:
		//		Send an HTTP PUT request using XMLHttpRequest with the given URL and options.
		// url: String
		//		URL to request
		// options: dojo/request/xhr.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	xhr.del = function(url, options){
		// summary:
		//		Send an HTTP DELETE request using XMLHttpRequest with the given URL and options.
		// url: String
		//		URL to request
		// options: dojo/request/xhr.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	=====*/
	xhr._create = function(){
		// summary:
		//		does the work of portably generating a new XMLHTTPRequest object.
		throw new Error('XMLHTTP not available');
	};
	if(has('native-xhr') && !has('dojo-force-activex-xhr')){
		xhr._create = function(){
			return new XMLHttpRequest();
		};
	}else if(has('activex')){
		try{
			new ActiveXObject('Msxml2.XMLHTTP');
			xhr._create = function(){
				return new ActiveXObject('Msxml2.XMLHTTP');
			};
		}catch(e){
			try{
				new ActiveXObject('Microsoft.XMLHTTP');
				xhr._create = function(){
					return new ActiveXObject('Microsoft.XMLHTTP');
				};
			}catch(e){}
		}
	}

	util.addCommonMethods(xhr);

	return xhr;
});

},
'dojo/request/iframe':function(){
define([
	'module',
	'require',
	'./watch',
	'./util',
	'./handlers',
	'../_base/lang',
	'../io-query',
	'../query',
	'../has',
	'../dom',
	'../dom-construct',
	'../_base/window'/*=====,
	'../request',
	'../_base/declare' =====*/
], function(module, require, watch, util, handlers, lang, ioQuery, query, has, dom, domConstruct, win/*=====, request, declare =====*/){
	var mid = module.id.replace(/[\/\.\-]/g, '_'),
		onload = mid + '_onload';

	if(!win.global[onload]){
		win.global[onload] = function(){
			var dfd = iframe._currentDfd;
			if(!dfd){
				iframe._fireNextRequest();
				return;
			}

			var response = dfd.response,
				options = response.options,
				formNode = dom.byId(options.form) || dfd._tmpForm;

			if(formNode){
				// remove all the hidden content inputs
				var toClean = dfd._contentToClean;
				for(var i=0; i<toClean.length; i++){
					var key = toClean[i];
					//Need to cycle over all nodes since we may have added
					//an array value which means that more than one node could
					//have the same .name value.
					for(var j=0; j<formNode.childNodes.length; j++){
						var childNode = formNode.childNodes[j];
						if(childNode.name === key){
							domConstruct.destroy(childNode);
							break;
						}
					}
				}

				// restore original action + target
				dfd._originalAction && formNode.setAttribute('action', dfd._originalAction);
				if(dfd._originalMethod){
					formNode.setAttribute('method', dfd._originalMethod);
					formNode.method = dfd._originalMethod;
				}
				if(dfd._originalTarget){
					formNode.setAttribute('target', dfd._originalTarget);
					formNode.target = dfd._originalTarget;
				}
			}

			if(dfd._tmpForm){
				domConstruct.destroy(dfd._tmpForm);
				delete dfd._tmpForm;
			}

			dfd._finished = true;
		};
	}

	function create(name, onloadstr, uri){
		if(win.global[name]){
			return win.global[name];
		}

		if(win.global.frames[name]){
			return win.global.frames[name];
		}

		if(!uri){
			if(has('config-useXDomain') && !has('config-dojoBlankHtmlUrl')){
				console.warn('dojo/request/iframe: When using cross-domain Dojo builds,' +
					' please save dojo/resources/blank.html to your domain and set dojoConfig.dojoBlankHtmlUrl' +
					' to the path on your domain to blank.html');
			}
			uri = (has('config-dojoBlankHtmlUrl')||require.toUrl('dojo/resources/blank.html'));
		}

		var frame = domConstruct.place(
			'<iframe id="'+name+'" name="'+name+'" src="'+uri+'" onload="'+onloadstr+
			'" style="position: absolute; left: 1px; top: 1px; height: 1px; width: 1px; visibility: hidden">',
			win.body());

		win.global[name] = frame;

		return frame;
	}

	function setSrc(_iframe, src, replace){
		var frame = win.global.frames[_iframe.name];

		if(frame.contentWindow){
			// We have an iframe node instead of the window
			frame = frame.contentWindow;
		}

		try{
			if(!replace){
				frame.location = src;
			}else{
				frame.location.replace(src);
			}
		}catch(e){
			console.log('dojo/request/iframe.setSrc: ', e);
		}
	}

	function doc(iframeNode){
		if(iframeNode.contentDocument){
			return iframeNode.contentDocument;
		}
		var name = iframeNode.name;
		if(name){
			var iframes = win.doc.getElementsByTagName('iframe');
			if(iframeNode.document && iframes[name].contentWindow && iframes[name].contentWindow.document){
				return iframes[name].contentWindow.document;
			}else if(win.doc.frames[name] && win.doc.frames[name].document){
				return win.doc.frames[name].document;
			}
		}
		return null;
	}

	function createForm(){
		return domConstruct.create('form', {
			name: mid + '_form',
			style: {
				position: 'absolute',
				top: '-1000px',
				left: '-1000px'
			}
		}, win.body());
	}

	function fireNextRequest(){
		// summary:
		//		Internal method used to fire the next request in the queue.
		var dfd;
		try{
			if(iframe._currentDfd || !iframe._dfdQueue.length){
				return;
			}
			do{
				dfd = iframe._currentDfd = iframe._dfdQueue.shift();
			}while(dfd && (dfd.canceled || (dfd.isCanceled && dfd.isCanceled())) && iframe._dfdQueue.length);

			if(!dfd || dfd.canceled || (dfd.isCanceled && dfd.isCanceled())){
				iframe._currentDfd = null;
				return;
			}

			var response = dfd.response,
				options = response.options,
				c2c = dfd._contentToClean = [],
				formNode = dom.byId(options.form),
				notify = util.notify,
				data = options.data || null,
				queryStr;

			if(!dfd._legacy && options.method === 'POST' && !formNode){
				formNode = dfd._tmpForm = createForm();
			}else if(options.method === 'GET' && formNode && response.url.indexOf('?') > -1){
				queryStr = response.url.slice(response.url.indexOf('?') + 1);
				data = lang.mixin(ioQuery.queryToObject(queryStr), data);
			}

			if(formNode){
				if(!dfd._legacy){
					var parentNode = formNode;
					do{
						parentNode = parentNode.parentNode;
					}while(parentNode !== win.doc.documentElement);

					// Append the form node or some browsers won't work
					if(!parentNode){
						formNode.style.position = 'absolute';
						formNode.style.left = '-1000px';
						formNode.style.top = '-1000px';
						win.body().appendChild(formNode);
					}

					if(!formNode.name){
						formNode.name = mid + '_form';
					}
				}

				// if we have things in data, we need to add them to the form
				// before submission
				if(data){
					var createInput = function(name, value){
						domConstruct.create('input', {
							type: 'hidden',
							name: name,
							value: value
						}, formNode);
						c2c.push(name);
					};
					for(var x in data){
						var val = data[x];
						if(lang.isArray(val) && val.length > 1){
							for(var i=0; i<val.length; i++){
								createInput(x, val[i]);
							}
						}else{
							if(!formNode[x]){
								createInput(x, val);
							}else{
								formNode[x].value = val;
							}
						}
					}
				}

				//IE requires going through getAttributeNode instead of just getAttribute in some form cases,
				//so use it for all.  See #2844
				var actionNode = formNode.getAttributeNode('action'),
					methodNode = formNode.getAttributeNode('method'),
					targetNode = formNode.getAttributeNode('target');

				if(response.url){
					dfd._originalAction = actionNode ? actionNode.value : null;
					if(actionNode){
						actionNode.value = response.url;
					}else{
						formNode.setAttribute('action', response.url);
					}
				}

				if(!dfd._legacy){
					dfd._originalMethod = methodNode ? methodNode.value : null;
					if(methodNode){
						methodNode.value = options.method;
					}else{
						formNode.setAttribute('method', options.method);
					}
				}else{
					if(!methodNode || !methodNode.value){
						if(mthdNode){
							mthdNode.value = options.method;
						}else{
							fn.setAttribute("method", options.method);
						}
					}
				}

				dfd._originalTarget = targetNode ? targetNode.value : null;
				if(targetNode){
					targetNode.value = iframe._iframeName;
				}else{
					formNode.setAttribute('target', iframe._iframeName);
				}
				formNode.target = iframe._iframeName;

				notify && notify.emit('send', response, dfd.promise.cancel);
				iframe._notifyStart(response);
				formNode.submit();
			}else{
				// otherwise we post a GET string by changing URL location for the
				// iframe

				var extra = '';
				if(response.options.data){
					extra = response.options.data;
					if(typeof extra !== 'string'){
						extra = ioQuery.objectToQuery(extra);
					}
				}
				var tmpUrl = response.url + (response.url.indexOf('?') > -1 ? '&' : '?') + extra;
				notify && notify.emit('send', response, dfd.promise.cancel);
				iframe._notifyStart(response);
				iframe.setSrc(iframe._frame, tmpUrl, true);
			}
		}catch(e){
			dfd.reject(e);
		}
	}

	// dojo/request/watch handlers
	function isValid(response){
		return !this.isFulfilled();
	}
	function isReady(response){
		return !!this._finished;
	}
	function handleResponse(response, error){
		if(!error){
			try{
				var options = response.options,
					doc = iframe.doc(iframe._frame),
					handleAs = options.handleAs;

				if(handleAs !== 'html'){
					if(handleAs === 'xml'){
						// IE6-8 have to parse the XML manually. See http://bugs.dojotoolkit.org/ticket/6334
						if(doc.documentElement.tagName.toLowerCase() === 'html'){
							query('a', doc.documentElement).orphan();
							var xmlText = doc.documentElement.innerText;
							xmlText = xmlText.replace(/>\s+</g, '><');
							response.text = lang.trim(xmlText);
						}else{
							response.data = doc;
						}
					}else{
						// 'json' and 'javascript' and 'text'
						response.text = doc.getElementsByTagName('textarea')[0].value; // text
					}
					handlers(response);
				}else{
					response.data = doc;
				}
			}catch(e){
				error = e;
			}
		}

		if(error){
			this.reject(error);
		}else if(this._finished){
			this.resolve(response);
		}else{
			this.reject(new Error('Invalid dojo/request/iframe request state'));
		}
	}
	function last(response){
		this._callNext();
	}

	var defaultOptions = {
		method: 'POST'
	};
	function iframe(url, options, returnDeferred){
		var response = util.parseArgs(url, util.deepCreate(defaultOptions, options), true);
		url = response.url;
		options = response.options;

		if(options.method !== 'GET' && options.method !== 'POST'){
			throw new Error(options.method + ' not supported by dojo/request/iframe');
		}

		if(!iframe._frame){
			iframe._frame = iframe.create(iframe._iframeName, onload + '();');
		}

		var dfd = util.deferred(response, null, isValid, isReady, handleResponse, last);
		dfd._callNext = function(){
			if(!this._calledNext){
				this._calledNext = true;
				iframe._currentDfd = null;
				iframe._fireNextRequest();
			}
		};
		dfd._legacy = returnDeferred;

		iframe._dfdQueue.push(dfd);
		iframe._fireNextRequest();

		watch(dfd);

		return returnDeferred ? dfd : dfd.promise;
	}

	/*=====
	iframe = function(url, options){
		// summary:
		//		Sends a request using an iframe element with the given URL and options.
		// url: String
		//		URL to request
		// options: dojo/request/iframe.__Options?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	iframe.__BaseOptions = declare(request.__BaseOptions, {
		// form: DOMNode?
		//		A form node to use to submit data to the server.
		// data: String|Object?
		//		Data to transfer. When making a GET request, this will
		//		be converted to key=value parameters and appended to the
		//		URL.
	});
	iframe.__MethodOptions = declare(null, {
		// method: String?
		//		The HTTP method to use to make the request. Must be
		//		uppercase. Only `"GET"` and `"POST"` are accepted.
		//		Default is `"POST"`.
	});
	iframe.__Options = declare([iframe.__BaseOptions, iframe.__MethodOptions]);

	iframe.get = function(url, options){
		// summary:
		//		Send an HTTP GET request using an iframe element with the given URL and options.
		// url: String
		//		URL to request
		// options: dojo/request/iframe.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	iframe.post = function(url, options){
		// summary:
		//		Send an HTTP POST request using an iframe element with the given URL and options.
		// url: String
		//		URL to request
		// options: dojo/request/iframe.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	=====*/
	iframe.create = create;
	iframe.doc = doc;
	iframe.setSrc = setSrc;

	// TODO: Make these truly private in 2.0
	iframe._iframeName = mid + '_IoIframe';
	iframe._notifyStart = function(){};
	iframe._dfdQueue = [];
	iframe._currentDfd = null;
	iframe._fireNextRequest = fireNextRequest;

	util.addCommonMethods(iframe, ['GET', 'POST']);

	return iframe;
});

},
'dojo/keys':function(){
define("dojo/keys", ["./_base/kernel", "./sniff"], function(dojo, has){

	// module:
	//		dojo/keys

	return dojo.keys = {
		// summary:
		//		Definitions for common key values.  Client code should test keyCode against these named constants,
		//		as the actual codes can vary by browser.

		BACKSPACE: 8,
		TAB: 9,
		CLEAR: 12,
		ENTER: 13,
		SHIFT: 16,
		CTRL: 17,
		ALT: 18,
		META: has("webkit") ? 91 : 224,		// the apple key on macs
		PAUSE: 19,
		CAPS_LOCK: 20,
		ESCAPE: 27,
		SPACE: 32,
		PAGE_UP: 33,
		PAGE_DOWN: 34,
		END: 35,
		HOME: 36,
		LEFT_ARROW: 37,
		UP_ARROW: 38,
		RIGHT_ARROW: 39,
		DOWN_ARROW: 40,
		INSERT: 45,
		DELETE: 46,
		HELP: 47,
		LEFT_WINDOW: 91,
		RIGHT_WINDOW: 92,
		SELECT: 93,
		NUMPAD_0: 96,
		NUMPAD_1: 97,
		NUMPAD_2: 98,
		NUMPAD_3: 99,
		NUMPAD_4: 100,
		NUMPAD_5: 101,
		NUMPAD_6: 102,
		NUMPAD_7: 103,
		NUMPAD_8: 104,
		NUMPAD_9: 105,
		NUMPAD_MULTIPLY: 106,
		NUMPAD_PLUS: 107,
		NUMPAD_ENTER: 108,
		NUMPAD_MINUS: 109,
		NUMPAD_PERIOD: 110,
		NUMPAD_DIVIDE: 111,
		F1: 112,
		F2: 113,
		F3: 114,
		F4: 115,
		F5: 116,
		F6: 117,
		F7: 118,
		F8: 119,
		F9: 120,
		F10: 121,
		F11: 122,
		F12: 123,
		F13: 124,
		F14: 125,
		F15: 126,
		NUM_LOCK: 144,
		SCROLL_LOCK: 145,
		UP_DPAD: 175,
		DOWN_DPAD: 176,
		LEFT_DPAD: 177,
		RIGHT_DPAD: 178,
		// virtual key mapping
		copyKey: has("mac") && !has("air") ? (has("safari") ? 91 : 224 ) : 17
	};
});

},
'dojo/domReady':function(){
define(['./has'], function(has){
	var global = this,
		doc = document,
		readyStates = { 'loaded': 1, 'complete': 1 },
		fixReadyState = typeof doc.readyState != "string",
		ready = !!readyStates[doc.readyState];

	// For FF <= 3.5
	if(fixReadyState){ doc.readyState = "loading"; }

	if(!ready){
		var readyQ = [], tests = [],
			detectReady = function(evt){
				evt = evt || global.event;
				if(ready || (evt.type == "readystatechange" && !readyStates[doc.readyState])){ return; }
				ready = 1;

				// For FF <= 3.5
				if(fixReadyState){ doc.readyState = "complete"; }

				while(readyQ.length){
					(readyQ.shift())(doc);
				}
			},
			on = function(node, event){
				node.addEventListener(event, detectReady, false);
				readyQ.push(function(){ node.removeEventListener(event, detectReady, false); });
			};

		if(!has("dom-addeventlistener")){
			on = function(node, event){
				event = "on" + event;
				node.attachEvent(event, detectReady);
				readyQ.push(function(){ node.detachEvent(event, detectReady); });
			};

			var div = doc.createElement("div");
			try{
				if(div.doScroll && global.frameElement === null){
					// the doScroll test is only useful if we're in the top-most frame
					tests.push(function(){
						// Derived with permission from Diego Perini's IEContentLoaded
						// http://javascript.nwbox.com/IEContentLoaded/
						try{
							div.doScroll("left");
							return 1;
						}catch(e){}
					});
				}
			}catch(e){}
		}

		on(doc, "DOMContentLoaded");
		on(global, "load");

		if("onreadystatechange" in doc){
			on(doc, "readystatechange");
		}else if(!fixReadyState){
			// if the ready state property exists and there's
			// no readystatechange event, poll for the state
			// to change
			tests.push(function(){
				return readyStates[doc.readyState];
			});
		}

		if(tests.length){
			var poller = function(){
				if(ready){ return; }
				var i = tests.length;
				while(i--){
					if(tests[i]()){
						detectReady("poller");
						return;
					}
				}
				setTimeout(poller, 30);
			};
			poller();
		}
	}

	function domReady(callback){
		// summary:
		//		Plugin to delay require()/define() callback from firing until the DOM has finished loading.
		if(ready){
			callback(doc);
		}else{
			readyQ.push(callback);
		}
	}
	domReady.load = function(id, req, load){
		domReady(load);
	};

	return domReady;
});

},
'dojo/_base/lang':function(){
define("dojo/_base/lang", ["./kernel", "../has", "../sniff"], function(dojo, has){
	// module:
	//		dojo/_base/lang

	has.add("bug-for-in-skips-shadowed", function(){
		// if true, the for-in iterator skips object properties that exist in Object's prototype (IE 6 - ?)
		for(var i in {toString: 1}){
			return 0;
		}
		return 1;
	});

	// Helper methods
	var _extraNames =
			has("bug-for-in-skips-shadowed") ?
				"hasOwnProperty.valueOf.isPrototypeOf.propertyIsEnumerable.toLocaleString.toString.constructor".split(".") : [],

		_extraLen = _extraNames.length,

		getProp = function(/*Array*/parts, /*Boolean*/create, /*Object*/context){
			var p, i = 0, dojoGlobal = dojo.global;
			if(!context){
				if(!parts.length){
					return dojoGlobal;
				}else{
					p = parts[i++];
					try{
						context = dojo.scopeMap[p] && dojo.scopeMap[p][1];
					}catch(e){}
					context = context || (p in dojoGlobal ? dojoGlobal[p] : (create ? dojoGlobal[p] = {} : undefined));
				}
			}
			while(context && (p = parts[i++])){
				context = (p in context ? context[p] : (create ? context[p] = {} : undefined));
			}
			return context; // mixed
		},

		opts = Object.prototype.toString,

		efficient = function(obj, offset, startWith){
			return (startWith||[]).concat(Array.prototype.slice.call(obj, offset||0));
		},

		_pattern = /\{([^\}]+)\}/g;

	// Module export
	var lang = {
		// summary:
		//		This module defines Javascript language extensions.

		// _extraNames: String[]
		//		Lists property names that must be explicitly processed during for-in iteration
		//		in environments that have has("bug-for-in-skips-shadowed") true.
		_extraNames:_extraNames,

		_mixin: function(dest, source, copyFunc){
			// summary:
			//		Copies/adds all properties of source to dest; returns dest.
			// dest: Object
			//		The object to which to copy/add all properties contained in source.
			// source: Object
			//		The object from which to draw all properties to copy into dest.
			// copyFunc: Function?
			//		The process used to copy/add a property in source; defaults to the Javascript assignment operator.
			// returns:
			//		dest, as modified
			// description:
			//		All properties, including functions (sometimes termed "methods"), excluding any non-standard extensions
			//		found in Object.prototype, are copied/added to dest. Copying/adding each particular property is
			//		delegated to copyFunc (if any); copyFunc defaults to the Javascript assignment operator if not provided.
			//		Notice that by default, _mixin executes a so-called "shallow copy" and aggregate types are copied/added by reference.
			var name, s, i, empty = {};
			for(name in source){
				// the (!(name in empty) || empty[name] !== s) condition avoids copying properties in "source"
				// inherited from Object.prototype.	 For example, if dest has a custom toString() method,
				// don't overwrite it with the toString() method that source inherited from Object.prototype
				s = source[name];
				if(!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))){
					dest[name] = copyFunc ? copyFunc(s) : s;
				}
			}

			if(has("bug-for-in-skips-shadowed")){
				if(source){
					for(i = 0; i < _extraLen; ++i){
						name = _extraNames[i];
						s = source[name];
						if(!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))){
							dest[name] = copyFunc ? copyFunc(s) : s;
						}
					}
				}
			}

			return dest; // Object
		},

		mixin: function(dest, sources){
			// summary:
			//		Copies/adds all properties of one or more sources to dest; returns dest.
			// dest: Object
			//		The object to which to copy/add all properties contained in source. If dest is falsy, then
			//		a new object is manufactured before copying/adding properties begins.
			// sources: Object...
			//		One of more objects from which to draw all properties to copy into dest. sources are processed
			//		left-to-right and if more than one of these objects contain the same property name, the right-most
			//		value "wins".
			// returns: Object
			//		dest, as modified
			// description:
			//		All properties, including functions (sometimes termed "methods"), excluding any non-standard extensions
			//		found in Object.prototype, are copied/added from sources to dest. sources are processed left to right.
			//		The Javascript assignment operator is used to copy/add each property; therefore, by default, mixin
			//		executes a so-called "shallow copy" and aggregate types are copied/added by reference.
			// example:
			//		make a shallow copy of an object
			//	|	var copy = lang.mixin({}, source);
			// example:
			//		many class constructors often take an object which specifies
			//		values to be configured on the object. In this case, it is
			//		often simplest to call `lang.mixin` on the `this` object:
			//	|	declare("acme.Base", null, {
			//	|		constructor: function(properties){
			//	|			// property configuration:
			//	|			lang.mixin(this, properties);
			//	|
			//	|			console.log(this.quip);
			//	|			//	...
			//	|		},
			//	|		quip: "I wasn't born yesterday, you know - I've seen movies.",
			//	|		// ...
			//	|	});
			//	|
			//	|	// create an instance of the class and configure it
			//	|	var b = new acme.Base({quip: "That's what it does!" });
			// example:
			//		copy in properties from multiple objects
			//	|	var flattened = lang.mixin(
			//	|		{
			//	|			name: "Frylock",
			//	|			braces: true
			//	|		},
			//	|		{
			//	|			name: "Carl Brutanananadilewski"
			//	|		}
			//	|	);
			//	|
			//	|	// will print "Carl Brutanananadilewski"
			//	|	console.log(flattened.name);
			//	|	// will print "true"
			//	|	console.log(flattened.braces);

			if(!dest){ dest = {}; }
			for(var i = 1, l = arguments.length; i < l; i++){
				lang._mixin(dest, arguments[i]);
			}
			return dest; // Object
		},

		setObject: function(name, value, context){
			// summary:
			//		Set a property from a dot-separated string, such as "A.B.C"
			// description:
			//		Useful for longer api chains where you have to test each object in
			//		the chain, or when you have an object reference in string format.
			//		Objects are created as needed along `path`. Returns the passed
			//		value if setting is successful or `undefined` if not.
			// name: String
			//		Path to a property, in the form "A.B.C".
			// value: anything
			//		value or object to place at location given by name
			// context: Object?
			//		Optional. Object to use as root of path. Defaults to
			//		`dojo.global`.
			// example:
			//		set the value of `foo.bar.baz`, regardless of whether
			//		intermediate objects already exist:
			//	| lang.setObject("foo.bar.baz", value);
			// example:
			//		without `lang.setObject`, we often see code like this:
			//	| // ensure that intermediate objects are available
			//	| if(!obj["parent"]){ obj.parent = {}; }
			//	| if(!obj.parent["child"]){ obj.parent.child = {}; }
			//	| // now we can safely set the property
			//	| obj.parent.child.prop = "some value";
			//		whereas with `lang.setObject`, we can shorten that to:
			//	| lang.setObject("parent.child.prop", "some value", obj);

			var parts = name.split("."), p = parts.pop(), obj = getProp(parts, true, context);
			return obj && p ? (obj[p] = value) : undefined; // Object
		},

		getObject: function(name, create, context){
			// summary:
			//		Get a property from a dot-separated string, such as "A.B.C"
			// description:
			//		Useful for longer api chains where you have to test each object in
			//		the chain, or when you have an object reference in string format.
			// name: String
			//		Path to an property, in the form "A.B.C".
			// create: Boolean?
			//		Optional. Defaults to `false`. If `true`, Objects will be
			//		created at any point along the 'path' that is undefined.
			// context: Object?
			//		Optional. Object to use as root of path. Defaults to
			//		'dojo.global'. Null may be passed.
			return getProp(name.split("."), create, context); // Object
		},

		exists: function(name, obj){
			// summary:
			//		determine if an object supports a given method
			// description:
			//		useful for longer api chains where you have to test each object in
			//		the chain. Useful for object and method detection.
			// name: String
			//		Path to an object, in the form "A.B.C".
			// obj: Object?
			//		Object to use as root of path. Defaults to
			//		'dojo.global'. Null may be passed.
			// example:
			//	| // define an object
			//	| var foo = {
			//	|		bar: { }
			//	| };
			//	|
			//	| // search the global scope
			//	| lang.exists("foo.bar"); // true
			//	| lang.exists("foo.bar.baz"); // false
			//	|
			//	| // search from a particular scope
			//	| lang.exists("bar", foo); // true
			//	| lang.exists("bar.baz", foo); // false
			return lang.getObject(name, false, obj) !== undefined; // Boolean
		},

		// Crockford (ish) functions

		isString: function(it){
			// summary:
			//		Return true if it is a String
			// it: anything
			//		Item to test.
			return (typeof it == "string" || it instanceof String); // Boolean
		},

		isArray: function(it){
			// summary:
			//		Return true if it is an Array.
			//		Does not work on Arrays created in other windows.
			// it: anything
			//		Item to test.
			return it && (it instanceof Array || typeof it == "array"); // Boolean
		},

		isFunction: function(it){
			// summary:
			//		Return true if it is a Function
			// it: anything
			//		Item to test.
			return opts.call(it) === "[object Function]";
		},

		isObject: function(it){
			// summary:
			//		Returns true if it is a JavaScript object (or an Array, a Function
			//		or null)
			// it: anything
			//		Item to test.
			return it !== undefined &&
				(it === null || typeof it == "object" || lang.isArray(it) || lang.isFunction(it)); // Boolean
		},

		isArrayLike: function(it){
			// summary:
			//		similar to isArray() but more permissive
			// it: anything
			//		Item to test.
			// returns:
			//		If it walks like a duck and quacks like a duck, return `true`
			// description:
			//		Doesn't strongly test for "arrayness".  Instead, settles for "isn't
			//		a string or number and has a length property". Arguments objects
			//		and DOM collections will return true when passed to
			//		isArrayLike(), but will return false when passed to
			//		isArray().
			return it && it !== undefined && // Boolean
				// keep out built-in constructors (Number, String, ...) which have length
				// properties
				!lang.isString(it) && !lang.isFunction(it) &&
				!(it.tagName && it.tagName.toLowerCase() == 'form') &&
				(lang.isArray(it) || isFinite(it.length));
		},

		isAlien: function(it){
			// summary:
			//		Returns true if it is a built-in function or some other kind of
			//		oddball that *should* report as a function but doesn't
			return it && !lang.isFunction(it) && /\{\s*\[native code\]\s*\}/.test(String(it)); // Boolean
		},

		extend: function(ctor, props){
			// summary:
			//		Adds all properties and methods of props to constructor's
			//		prototype, making them available to all instances created with
			//		constructor.
			// ctor: Object
			//		Target constructor to extend.
			// props: Object
			//		One or more objects to mix into ctor.prototype
			for(var i=1, l=arguments.length; i<l; i++){
				lang._mixin(ctor.prototype, arguments[i]);
			}
			return ctor; // Object
		},

		_hitchArgs: function(scope, method){
			var pre = lang._toArray(arguments, 2);
			var named = lang.isString(method);
			return function(){
				// arrayify arguments
				var args = lang._toArray(arguments);
				// locate our method
				var f = named ? (scope||dojo.global)[method] : method;
				// invoke with collected args
				return f && f.apply(scope || this, pre.concat(args)); // mixed
			}; // Function
		},

		hitch: function(scope, method){
			// summary:
			//		Returns a function that will only ever execute in the a given scope.
			//		This allows for easy use of object member functions
			//		in callbacks and other places in which the "this" keyword may
			//		otherwise not reference the expected scope.
			//		Any number of default positional arguments may be passed as parameters
			//		beyond "method".
			//		Each of these values will be used to "placehold" (similar to curry)
			//		for the hitched function.
			// scope: Object
			//		The scope to use when method executes. If method is a string,
			//		scope is also the object containing method.
			// method: Function|String...
			//		A function to be hitched to scope, or the name of the method in
			//		scope to be hitched.
			// example:
			//	|	lang.hitch(foo, "bar")();
			//		runs foo.bar() in the scope of foo
			// example:
			//	|	lang.hitch(foo, myFunction);
			//		returns a function that runs myFunction in the scope of foo
			// example:
			//		Expansion on the default positional arguments passed along from
			//		hitch. Passed args are mixed first, additional args after.
			//	|	var foo = { bar: function(a, b, c){ console.log(a, b, c); } };
			//	|	var fn = lang.hitch(foo, "bar", 1, 2);
			//	|	fn(3); // logs "1, 2, 3"
			// example:
			//	|	var foo = { bar: 2 };
			//	|	lang.hitch(foo, function(){ this.bar = 10; })();
			//		execute an anonymous function in scope of foo
			if(arguments.length > 2){
				return lang._hitchArgs.apply(dojo, arguments); // Function
			}
			if(!method){
				method = scope;
				scope = null;
			}
			if(lang.isString(method)){
				scope = scope || dojo.global;
				if(!scope[method]){ throw(['lang.hitch: scope["', method, '"] is null (scope="', scope, '")'].join('')); }
				return function(){ return scope[method].apply(scope, arguments || []); }; // Function
			}
			return !scope ? method : function(){ return method.apply(scope, arguments || []); }; // Function
		},

		delegate: (function(){
			// boodman/crockford delegation w/ cornford optimization
			function TMP(){}
			return function(obj, props){
				TMP.prototype = obj;
				var tmp = new TMP();
				TMP.prototype = null;
				if(props){
					lang._mixin(tmp, props);
				}
				return tmp; // Object
			};
		})(),
		/*=====
		delegate: function(obj, props){
			// summary:
			//		Returns a new object which "looks" to obj for properties which it
			//		does not have a value for. Optionally takes a bag of properties to
			//		seed the returned object with initially.
			// description:
			//		This is a small implementation of the Boodman/Crockford delegation
			//		pattern in JavaScript. An intermediate object constructor mediates
			//		the prototype chain for the returned object, using it to delegate
			//		down to obj for property lookup when object-local lookup fails.
			//		This can be thought of similarly to ES4's "wrap", save that it does
			//		not act on types but rather on pure objects.
			// obj: Object
			//		The object to delegate to for properties not found directly on the
			//		return object or in props.
			// props: Object...
			//		an object containing properties to assign to the returned object
			// returns:
			//		an Object of anonymous type
			// example:
			//	|	var foo = { bar: "baz" };
			//	|	var thinger = lang.delegate(foo, { thud: "xyzzy"});
			//	|	thinger.bar == "baz"; // delegated to foo
			//	|	foo.thud == undefined; // by definition
			//	|	thinger.thud == "xyzzy"; // mixed in from props
			//	|	foo.bar = "thonk";
			//	|	thinger.bar == "thonk"; // still delegated to foo's bar
		},
		=====*/

		_toArray: has("ie") ?
			(function(){
				function slow(obj, offset, startWith){
					var arr = startWith||[];
					for(var x = offset || 0; x < obj.length; x++){
						arr.push(obj[x]);
					}
					return arr;
				}
				return function(obj){
					return ((obj.item) ? slow : efficient).apply(this, arguments);
				};
			})() : efficient,
		/*=====
		 _toArray: function(obj, offset, startWith){
			 // summary:
			 //		Converts an array-like object (i.e. arguments, DOMCollection) to an
			 //		array. Returns a new Array with the elements of obj.
			 // obj: Object
			 //		the object to "arrayify". We expect the object to have, at a
			 //		minimum, a length property which corresponds to integer-indexed
			 //		properties.
			 // offset: Number?
			 //		the location in obj to start iterating from. Defaults to 0.
			 //		Optional.
			 // startWith: Array?
			 //		An array to pack with the properties of obj. If provided,
			 //		properties in obj are appended at the end of startWith and
			 //		startWith is the returned array.
		 },
		 =====*/

		partial: function(/*Function|String*/ method /*, ...*/){
			// summary:
			//		similar to hitch() except that the scope object is left to be
			//		whatever the execution context eventually becomes.
			// description:
			//		Calling lang.partial is the functional equivalent of calling:
			//		|	lang.hitch(null, funcName, ...);
			// method:
			//		The function to "wrap"
			var arr = [ null ];
			return lang.hitch.apply(dojo, arr.concat(lang._toArray(arguments))); // Function
		},

		clone: function(/*anything*/ src){
			// summary:
			//		Clones objects (including DOM nodes) and all children.
			//		Warning: do not clone cyclic structures.
			// src:
			//		The object to clone
			if(!src || typeof src != "object" || lang.isFunction(src)){
				// null, undefined, any non-object, or function
				return src;	// anything
			}
			if(src.nodeType && "cloneNode" in src){
				// DOM Node
				return src.cloneNode(true); // Node
			}
			if(src instanceof Date){
				// Date
				return new Date(src.getTime());	// Date
			}
			if(src instanceof RegExp){
				// RegExp
				return new RegExp(src);   // RegExp
			}
			var r, i, l;
			if(lang.isArray(src)){
				// array
				r = [];
				for(i = 0, l = src.length; i < l; ++i){
					if(i in src){
						r.push(lang.clone(src[i]));
					}
				}
				// we don't clone functions for performance reasons
				//		}else if(d.isFunction(src)){
				//			// function
				//			r = function(){ return src.apply(this, arguments); };
			}else{
				// generic objects
				r = src.constructor ? new src.constructor() : {};
			}
			return lang._mixin(r, src, lang.clone);
		},


		trim: String.prototype.trim ?
			function(str){ return str.trim(); } :
			function(str){ return str.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); },
		/*=====
		 trim: function(str){
			 // summary:
			 //		Trims whitespace from both sides of the string
			 // str: String
			 //		String to be trimmed
			 // returns: String
			 //		Returns the trimmed string
			 // description:
			 //		This version of trim() was selected for inclusion into the base due
			 //		to its compact size and relatively good performance
			 //		(see [Steven Levithan's blog](http://blog.stevenlevithan.com/archives/faster-trim-javascript)
			 //		Uses String.prototype.trim instead, if available.
			 //		The fastest but longest version of this function is located at
			 //		lang.string.trim()
		 },
		 =====*/

		replace: function(tmpl, map, pattern){
			// summary:
			//		Performs parameterized substitutions on a string. Throws an
			//		exception if any parameter is unmatched.
			// tmpl: String
			//		String to be used as a template.
			// map: Object|Function
			//		If an object, it is used as a dictionary to look up substitutions.
			//		If a function, it is called for every substitution with following parameters:
			//		a whole match, a name, an offset, and the whole template
			//		string (see https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/String/replace
			//		for more details).
			// pattern: RegEx?
			//		Optional regular expression objects that overrides the default pattern.
			//		Must be global and match one item. The default is: /\{([^\}]+)\}/g,
			//		which matches patterns like that: "{xxx}", where "xxx" is any sequence
			//		of characters, which doesn't include "}".
			// returns: String
			//		Returns the substituted string.
			// example:
			//	|	// uses a dictionary for substitutions:
			//	|	lang.replace("Hello, {name.first} {name.last} AKA {nick}!",
			//	|		{
			//	|			nick: "Bob",
			//	|			name: {
			//	|				first:	"Robert",
			//	|				middle: "X",
			//	|				last:		"Cringely"
			//	|			}
			//	|		});
			//	|	// returns: Hello, Robert Cringely AKA Bob!
			// example:
			//	|	// uses an array for substitutions:
			//	|	lang.replace("Hello, {0} {2}!",
			//	|		["Robert", "X", "Cringely"]);
			//	|	// returns: Hello, Robert Cringely!
			// example:
			//	|	// uses a function for substitutions:
			//	|	function sum(a){
			//	|		var t = 0;
			//	|		arrayforEach(a, function(x){ t += x; });
			//	|		return t;
			//	|	}
			//	|	lang.replace(
			//	|		"{count} payments averaging {avg} USD per payment.",
			//	|		lang.hitch(
			//	|			{ payments: [11, 16, 12] },
			//	|			function(_, key){
			//	|				switch(key){
			//	|					case "count": return this.payments.length;
			//	|					case "min":		return Math.min.apply(Math, this.payments);
			//	|					case "max":		return Math.max.apply(Math, this.payments);
			//	|					case "sum":		return sum(this.payments);
			//	|					case "avg":		return sum(this.payments) / this.payments.length;
			//	|				}
			//	|			}
			//	|		)
			//	|	);
			//	|	// prints: 3 payments averaging 13 USD per payment.
			// example:
			//	|	// uses an alternative PHP-like pattern for substitutions:
			//	|	lang.replace("Hello, ${0} ${2}!",
			//	|		["Robert", "X", "Cringely"], /\$\{([^\}]+)\}/g);
			//	|	// returns: Hello, Robert Cringely!

			return tmpl.replace(pattern || _pattern, lang.isFunction(map) ?
				map : function(_, k){ return lang.getObject(k, false, map); });
		}
	};

	 1  && lang.mixin(dojo, lang);

	return lang;
});


},
'dojo/request/util':function(){
define("dojo/request/util", [
	'exports',
	'../errors/RequestError',
	'../errors/CancelError',
	'../Deferred',
	'../io-query',
	'../_base/array',
	'../_base/lang'
], function(exports, RequestError, CancelError, Deferred, ioQuery, array, lang){
	exports.deepCopy = function deepCopy(target, source){
		for(var name in source){
			var tval = target[name],
				sval = source[name];
			if(tval !== sval){
				if(tval && typeof tval === 'object' && sval && typeof sval === 'object'){
					exports.deepCopy(tval, sval);
				}else{
					target[name] = sval;
				}
			}
		}
		return target;
	};

	exports.deepCreate = function deepCreate(source, properties){
		properties = properties || {};
		var target = lang.delegate(source),
			name, value;

		for(name in source){
			value = source[name];

			if(value && typeof value === 'object'){
				target[name] = exports.deepCreate(value, properties[name]);
			}
		}
		return exports.deepCopy(target, properties);
	};

	var freeze = Object.freeze || function(obj){ return obj; };
	function okHandler(response){
		return freeze(response);
	}

	exports.deferred = function deferred(response, cancel, isValid, isReady, handleResponse, last){
		var def = new Deferred(function(reason){
			cancel && cancel(def, response);

			if(!reason || !(reason instanceof RequestError) && !(reason instanceof CancelError)){
				return new CancelError('Request canceled', response);
			}
			return reason;
		});

		def.response = response;
		def.isValid = isValid;
		def.isReady = isReady;
		def.handleResponse = handleResponse;

		function errHandler(error){
			error.response = response;
			throw error;
		}
		var responsePromise = def.then(okHandler).otherwise(errHandler);

		if(exports.notify){
			responsePromise.then(
				lang.hitch(exports.notify, 'emit', 'load'),
				lang.hitch(exports.notify, 'emit', 'error')
			);
		}

		var dataPromise = responsePromise.then(function(response){
				return response.data || response.text;
			});

		var promise = freeze(lang.delegate(dataPromise, {
			response: responsePromise
		}));


		if(last){
			def.then(function(response){
				last.call(def, response);
			}, function(error){
				last.call(def, response, error);
			});
		}

		def.promise = promise;
		def.then = promise.then;

		return def;
	};

	exports.addCommonMethods = function addCommonMethods(provider, methods){
		array.forEach(methods||['GET', 'POST', 'PUT', 'DELETE'], function(method){
			provider[(method === 'DELETE' ? 'DEL' : method).toLowerCase()] = function(url, options){
				options = lang.delegate(options||{});
				options.method = method;
				return provider(url, options);
			};
		});
	};

	exports.parseArgs = function parseArgs(url, options, skipData){
		var data = options.data,
			query = options.query;
		
		if(data && !skipData){
			if(typeof data === 'object'){
				options.data = ioQuery.objectToQuery(data);
			}
		}

		if(query){
			if(typeof query === 'object'){
				query = ioQuery.objectToQuery(query);
			}
			if(options.preventCache){
				query += (query ? '&' : '') + 'request.preventCache=' + (+(new Date));
			}
		}else if(options.preventCache){
			query = 'request.preventCache=' + (+(new Date));
		}

		if(url && query){
			url += (~url.indexOf('?') ? '&' : '?') + query;
		}

		return {
			url: url,
			options: options,
			getHeader: function(headerName){ return null; }
		};
	};

	exports.checkStatus = function(stat){
		stat = stat || 0;
		return (stat >= 200 && stat < 300) || // allow any 2XX response code
			stat === 304 ||                 // or, get it out of the cache
			stat === 1223 ||                // or, Internet Explorer mangled the status code
			!stat;                         // or, we're Titanium/browser chrome/chrome extension requesting a local file
	};
});

},
'dojo/Evented':function(){
define("dojo/Evented", ["./aspect", "./on"], function(aspect, on){
	// module:
	//		dojo/Evented

 	"use strict";
 	var after = aspect.after;
	function Evented(){
		// summary:
		//		A class that can be used as a mixin or base class,
		//		to add on() and emit() methods to a class
		//		for listening for events and emitting events:
		//
		//		|	define(["dojo/Evented"], function(Evented){
		//		|		var EventedWidget = dojo.declare([Evented, dijit._Widget], {...});
		//		|		widget = new EventedWidget();
		//		|		widget.on("open", function(event){
		//		|		... do something with event
		//		|	 });
		//		|
		//		|	widget.emit("open", {name:"some event", ...});
	}
	Evented.prototype = {
		on: function(type, listener){
			return on.parse(this, type, listener, function(target, type){
				return after(target, 'on' + type, listener, true);
			});
		},
		emit: function(type, event){
			var args = [this];
			args.push.apply(args, arguments);
			return on.emit.apply(on, args);
		}
	};
	return Evented;
});

},
'dojo/mouse':function(){
define("dojo/mouse", ["./_base/kernel", "./on", "./has", "./dom", "./_base/window"], function(dojo, on, has, dom, win){

	// module:
	//		dojo/mouse

    has.add("dom-quirks", win.doc && win.doc.compatMode == "BackCompat");
	has.add("events-mouseenter", win.doc && "onmouseenter" in win.doc.createElement("div"));
	has.add("events-mousewheel", win.doc && 'onmousewheel' in win.doc);

	var mouseButtons;
	if((has("dom-quirks") && has("ie")) || !has("dom-addeventlistener")){
		mouseButtons = {
			LEFT:   1,
			MIDDLE: 4,
			RIGHT:  2,
			// helper functions
			isButton: function(e, button){ return e.button & button; },
			isLeft:   function(e){ return e.button & 1; },
			isMiddle: function(e){ return e.button & 4; },
			isRight:  function(e){ return e.button & 2; }
		};
	}else{
		mouseButtons = {
			LEFT:   0,
			MIDDLE: 1,
			RIGHT:  2,
			// helper functions
			isButton: function(e, button){ return e.button == button; },
			isLeft:   function(e){ return e.button == 0; },
			isMiddle: function(e){ return e.button == 1; },
			isRight:  function(e){ return e.button == 2; }
		};
	}
	dojo.mouseButtons = mouseButtons;

/*=====
	dojo.mouseButtons = {
		// LEFT: Number
		//		Numeric value of the left mouse button for the platform.
		LEFT:   0,
		// MIDDLE: Number
		//		Numeric value of the middle mouse button for the platform.
		MIDDLE: 1,
		// RIGHT: Number
		//		Numeric value of the right mouse button for the platform.
		RIGHT:  2,

		isButton: function(e, button){
			// summary:
			//		Checks an event object for a pressed button
			// e: Event
			//		Event object to examine
			// button: Number
			//		The button value (example: dojo.mouseButton.LEFT)
			return e.button == button; // Boolean
		},
		isLeft: function(e){
			// summary:
			//		Checks an event object for the pressed left button
			// e: Event
			//		Event object to examine
			return e.button == 0; // Boolean
		},
		isMiddle: function(e){
			// summary:
			//		Checks an event object for the pressed middle button
			// e: Event
			//		Event object to examine
			return e.button == 1; // Boolean
		},
		isRight: function(e){
			// summary:
			//		Checks an event object for the pressed right button
			// e: Event
			//		Event object to examine
			return e.button == 2; // Boolean
		}
	};
=====*/

	function eventHandler(type, selectHandler){
		// emulation of mouseenter/leave with mouseover/out using descendant checking
		var handler = function(node, listener){
			return on(node, type, function(evt){
				if(selectHandler){
					return selectHandler(evt, listener);
				}
				if(!dom.isDescendant(evt.relatedTarget, node)){
					return listener.call(this, evt);
				}
			});
		};
		handler.bubble = function(select){
			return eventHandler(type, function(evt, listener){
				// using a selector, use the select function to determine if the mouse moved inside the selector and was previously outside the selector
				var target = select(evt.target);
				var relatedTarget = evt.relatedTarget;
				if(target && (target != (relatedTarget && relatedTarget.nodeType == 1 && select(relatedTarget)))){
					return listener.call(target, evt);
				} 
			});
		};
		return handler;
	}
	var wheel;
	if(has("events-mousewheel")){
		wheel = 'mousewheel';
	}else{ //firefox
		wheel = function(node, listener){
			return on(node, 'DOMMouseScroll', function(evt){
				evt.wheelDelta = -evt.detail;
				listener.call(this, evt);
			});
		};
	}
	return {
		// summary:
		//		This module provide mouse event handling utility functions and exports
		//		mouseenter and mouseleave event emulation.
		// example:
		//		To use these events, you register a mouseenter like this:
		//		|	define(["dojo/on", dojo/mouse"], function(on, mouse){
		//		|		on(targetNode, mouse.enter, function(event){
		//		|			dojo.addClass(targetNode, "highlighted");
		//		|		});
		//		|		on(targetNode, mouse.leave, function(event){
		//		|			dojo.removeClass(targetNode, "highlighted");
		//		|		});

		_eventHandler: eventHandler,		// for dojo/touch

		// enter: Synthetic Event
		//		This is an extension event for the mouseenter that IE provides, emulating the
		//		behavior on other browsers.
		enter: eventHandler("mouseover"),

		// leave: Synthetic Event
		//		This is an extension event for the mouseleave that IE provides, emulating the
		//		behavior on other browsers.
		leave: eventHandler("mouseout"),

		// wheel: Normalized Mouse Wheel Event
		//		This is an extension event for the mousewheel that non-Mozilla browsers provide,
		//		emulating the behavior on Mozilla based browsers.
		wheel: wheel,

		isLeft: mouseButtons.isLeft,
		/*=====
		isLeft: function(){
			// summary:
			//		Test an event object (from a mousedown event) to see if the left button was pressed.
		},
		=====*/

		isMiddle: mouseButtons.isMiddle,
		/*=====
		 isMiddle: function(){
			 // summary:
			 //		Test an event object (from a mousedown event) to see if the middle button was pressed.
		 },
		 =====*/

		isRight: mouseButtons.isRight
		/*=====
		 , isRight: function(){
			 // summary:
			 //		Test an event object (from a mousedown event) to see if the right button was pressed.
		 }
		 =====*/
	};
});

},
'dojo/topic':function(){
define("dojo/topic", ["./Evented"], function(Evented){

	// module:
	//		dojo/topic

	var hub = new Evented;
	return {
		// summary:
		//		Pubsub hub.
		// example:
		//		| 	topic.subscribe("some/topic", function(event){
		//		|	... do something with event
		//		|	});
		//		|	topic.publish("some/topic", {name:"some event", ...});

		publish: function(topic, event){
			// summary:
			//		Publishes a message to a topic on the pub/sub hub. All arguments after
			//		the first will be passed to the subscribers, so any number of arguments
			//		can be provided (not just event).
			// topic: String
			//		The name of the topic to publish to
			// event: Object
			//		An event to distribute to the topic listeners
			return hub.emit.apply(hub, arguments);
		},

		subscribe: function(topic, listener){
			// summary:
			//		Subscribes to a topic on the pub/sub hub
			// topic: String
			//		The topic to subscribe to
			// listener: Function
			//		A function to call when a message is published to the given topic
			return hub.on.apply(hub, arguments);
		}
	};
});

},
'dojo/Deferred':function(){
define([
	"./has",
	"./_base/lang",
	"./errors/CancelError",
	"./promise/Promise",
	"./promise/instrumentation"
], function(has, lang, CancelError, Promise, instrumentation){
	"use strict";

	// module:
	//		dojo/Deferred

	var PROGRESS = 0,
			RESOLVED = 1,
			REJECTED = 2;
	var FULFILLED_ERROR_MESSAGE = "This deferred has already been fulfilled.";

	var freezeObject = Object.freeze || function(){};

	var signalWaiting = function(waiting, type, result, rejection, deferred){
		if( 1 ){
			if(type === REJECTED && Deferred.instrumentRejected && waiting.length === 0){
				Deferred.instrumentRejected(result, false, rejection, deferred);
			}
		}

		for(var i = 0; i < waiting.length; i++){
			signalListener(waiting[i], type, result, rejection);
		}
	};

	var signalListener = function(listener, type, result, rejection){
		var func = listener[type];
		var deferred = listener.deferred;
		if(func){
			try{
				var newResult = func(result);
				if(type === PROGRESS){
					if(typeof newResult !== "undefined"){
						signalDeferred(deferred, type, newResult);
					}
				}else{
					if(newResult && typeof newResult.then === "function"){
						listener.cancel = newResult.cancel;
						newResult.then(
								// Only make resolvers if they're actually going to be used
								makeDeferredSignaler(deferred, RESOLVED),
								makeDeferredSignaler(deferred, REJECTED),
								makeDeferredSignaler(deferred, PROGRESS));
						return;
					}
					signalDeferred(deferred, RESOLVED, newResult);
				}
			}catch(error){
				signalDeferred(deferred, REJECTED, error);
			}
		}else{
			signalDeferred(deferred, type, result);
		}

		if( 1 ){
			if(type === REJECTED && Deferred.instrumentRejected){
				Deferred.instrumentRejected(result, !!func, rejection, deferred.promise);
			}
		}
	};

	var makeDeferredSignaler = function(deferred, type){
		return function(value){
			signalDeferred(deferred, type, value);
		};
	};

	var signalDeferred = function(deferred, type, result){
		if(!deferred.isCanceled()){
			switch(type){
				case PROGRESS:
					deferred.progress(result);
					break;
				case RESOLVED:
					deferred.resolve(result);
					break;
				case REJECTED:
					deferred.reject(result);
					break;
			}
		}
	};

	var Deferred = function(canceler){
		// summary:
		//		Creates a new deferred. This API is preferred over
		//		`dojo/_base/Deferred`.
		// description:
		//		Creates a new deferred, as an abstraction over (primarily)
		//		asynchronous operations. The deferred is the private interface
		//		that should not be returned to calling code. That's what the
		//		`promise` is for. See `dojo/promise/Promise`.
		// canceler: Function?
		//		Will be invoked if the deferred is canceled. The canceler
		//		receives the reason the deferred was canceled as its argument.
		//		The deferred is rejected with its return value, or a new
		//		`dojo/errors/CancelError` instance.

		// promise: dojo/promise/Promise
		//		The public promise object that clients can add callbacks to. 
		var promise = this.promise = new Promise();

		var deferred = this;
		var fulfilled, result, rejection;
		var canceled = false;
		var waiting = [];

		if( 1  && Error.captureStackTrace){
			Error.captureStackTrace(deferred, Deferred);
			Error.captureStackTrace(promise, Deferred);
		}

		this.isResolved = promise.isResolved = function(){
			// summary:
			//		Checks whether the deferred has been resolved.
			// returns: Boolean

			return fulfilled === RESOLVED;
		};

		this.isRejected = promise.isRejected = function(){
			// summary:
			//		Checks whether the deferred has been rejected.
			// returns: Boolean

			return fulfilled === REJECTED;
		};

		this.isFulfilled = promise.isFulfilled = function(){
			// summary:
			//		Checks whether the deferred has been resolved or rejected.
			// returns: Boolean

			return !!fulfilled;
		};

		this.isCanceled = promise.isCanceled = function(){
			// summary:
			//		Checks whether the deferred has been canceled.
			// returns: Boolean

			return canceled;
		};

		this.progress = function(update, strict){
			// summary:
			//		Emit a progress update on the deferred.
			// description:
			//		Emit a progress update on the deferred. Progress updates
			//		can be used to communicate updates about the asynchronous
			//		operation before it has finished.
			// update: any
			//		The progress update. Passed to progbacks.
			// strict: Boolean?
			//		If strict, will throw an error if the deferred has already
			//		been fulfilled and consequently no progress can be emitted.
			// returns: dojo/promise/Promise
			//		Returns the original promise for the deferred.

			if(!fulfilled){
				signalWaiting(waiting, PROGRESS, update, null, deferred);
				return promise;
			}else if(strict === true){
				throw new Error(FULFILLED_ERROR_MESSAGE);
			}else{
				return promise;
			}
		};

		this.resolve = function(value, strict){
			// summary:
			//		Resolve the deferred.
			// description:
			//		Resolve the deferred, putting it in a success state.
			// value: any
			//		The result of the deferred. Passed to callbacks.
			// strict: Boolean?
			//		If strict, will throw an error if the deferred has already
			//		been fulfilled and consequently cannot be resolved.
			// returns: dojo/promise/Promise
			//		Returns the original promise for the deferred.

			if(!fulfilled){
				// Set fulfilled, store value. After signaling waiting listeners unset
				// waiting.
				signalWaiting(waiting, fulfilled = RESOLVED, result = value, null, deferred);
				waiting = null;
				return promise;
			}else if(strict === true){
				throw new Error(FULFILLED_ERROR_MESSAGE);
			}else{
				return promise;
			}
		};

		var reject = this.reject = function(error, strict){
			// summary:
			//		Reject the deferred.
			// description:
			//		Reject the deferred, putting it in an error state.
			// error: any
			//		The error result of the deferred. Passed to errbacks.
			// strict: Boolean?
			//		If strict, will throw an error if the deferred has already
			//		been fulfilled and consequently cannot be rejected.
			// returns: dojo/promise/Promise
			//		Returns the original promise for the deferred.

			if(!fulfilled){
				if( 1  && Error.captureStackTrace){
					Error.captureStackTrace(rejection = {}, reject);
				}
				signalWaiting(waiting, fulfilled = REJECTED, result = error, rejection, deferred);
				waiting = null;
				return promise;
			}else if(strict === true){
				throw new Error(FULFILLED_ERROR_MESSAGE);
			}else{
				return promise;
			}
		};

		this.then = promise.then = function(callback, errback, progback){
			// summary:
			//		Add new callbacks to the deferred.
			// description:
			//		Add new callbacks to the deferred. Callbacks can be added
			//		before or after the deferred is fulfilled.
			// callback: Function?
			//		Callback to be invoked when the promise is resolved.
			//		Receives the resolution value.
			// errback: Function?
			//		Callback to be invoked when the promise is rejected.
			//		Receives the rejection error.
			// progback: Function?
			//		Callback to be invoked when the promise emits a progress
			//		update. Receives the progress update.
			// returns: dojo/promise/Promise
			//		Returns a new promise for the result of the callback(s).
			//		This can be used for chaining many asynchronous operations.

			var listener = [progback, callback, errback];
			// Ensure we cancel the promise we're waiting for, or if callback/errback
			// have returned a promise, cancel that one.
			listener.cancel = promise.cancel;
			listener.deferred = new Deferred(function(reason){
				// Check whether cancel is really available, returned promises are not
				// required to expose `cancel`
				return listener.cancel && listener.cancel(reason);
			});
			if(fulfilled && !waiting){
				signalListener(listener, fulfilled, result, rejection);
			}else{
				waiting.push(listener);
			}
			return listener.deferred.promise;
		};

		this.cancel = promise.cancel = function(reason, strict){
			// summary:
			//		Inform the deferred it may cancel its asynchronous operation.
			// description:
			//		Inform the deferred it may cancel its asynchronous operation.
			//		The deferred's (optional) canceler is invoked and the
			//		deferred will be left in a rejected state. Can affect other
			//		promises that originate with the same deferred.
			// reason: any
			//		A message that may be sent to the deferred's canceler,
			//		explaining why it's being canceled.
			// strict: Boolean?
			//		If strict, will throw an error if the deferred has already
			//		been fulfilled and consequently cannot be canceled.
			// returns: any
			//		Returns the rejection reason if the deferred was canceled
			//		normally.

			if(!fulfilled){
				// Cancel can be called even after the deferred is fulfilled
				if(canceler){
					var returnedReason = canceler(reason);
					reason = typeof returnedReason === "undefined" ? reason : returnedReason;
				}
				canceled = true;
				if(!fulfilled){
					// Allow canceler to provide its own reason, but fall back to a CancelError
					if(typeof reason === "undefined"){
						reason = new CancelError();
					}
					reject(reason);
					return reason;
				}else if(fulfilled === REJECTED && result === reason){
					return reason;
				}
			}else if(strict === true){
				throw new Error(FULFILLED_ERROR_MESSAGE);
			}
		};

		freezeObject(promise);
	};

	Deferred.prototype.toString = function(){
		// returns: String
		//		Returns `[object Deferred]`.

		return "[object Deferred]";
	};

	if(instrumentation){
		instrumentation(Deferred);
	}

	return Deferred;
});

},
'dojo/_base/Color':function(){
define(["./kernel", "./lang", "./array", "./config"], function(dojo, lang, ArrayUtil, config){

	var Color = dojo.Color = function(/*Array|String|Object*/ color){
		// summary:
		//		Takes a named string, hex string, array of rgb or rgba values,
		//		an object with r, g, b, and a properties, or another `Color` object
		//		and creates a new Color instance to work from.
		//
		// example:
		//		Work with a Color instance:
		//	 | var c = new Color();
		//	 | c.setColor([0,0,0]); // black
		//	 | var hex = c.toHex(); // #000000
		//
		// example:
		//		Work with a node's color:
		//	 | var color = dojo.style("someNode", "backgroundColor");
		//	 | var n = new Color(color);
		//	 | // adjust the color some
		//	 | n.r *= .5;
		//	 | console.log(n.toString()); // rgb(128, 255, 255);
		if(color){ this.setColor(color); }
	};

	// FIXME:
	// there's got to be a more space-efficient way to encode or discover
	// these!! Use hex?
	Color.named = {
		// summary:
		//		Dictionary list of all CSS named colors, by name. Values are 3-item arrays with corresponding RG and B values.
		"black":  [0,0,0],
		"silver": [192,192,192],
		"gray":	  [128,128,128],
		"white":  [255,255,255],
		"maroon": [128,0,0],
		"red":	  [255,0,0],
		"purple": [128,0,128],
		"fuchsia":[255,0,255],
		"green":  [0,128,0],
		"lime":	  [0,255,0],
		"olive":  [128,128,0],
		"yellow": [255,255,0],
		"navy":	  [0,0,128],
		"blue":	  [0,0,255],
		"teal":	  [0,128,128],
		"aqua":	  [0,255,255],
		"transparent": config.transparentColor || [0,0,0,0]
	};

	lang.extend(Color, {
		r: 255, g: 255, b: 255, a: 1,
		_set: function(r, g, b, a){
			var t = this; t.r = r; t.g = g; t.b = b; t.a = a;
		},
		setColor: function(/*Array|String|Object*/ color){
			// summary:
			//		Takes a named string, hex string, array of rgb or rgba values,
			//		an object with r, g, b, and a properties, or another `Color` object
			//		and sets this color instance to that value.
			//
			// example:
			//	|	var c = new Color(); // no color
			//	|	c.setColor("#ededed"); // greyish
			if(lang.isString(color)){
				Color.fromString(color, this);
			}else if(lang.isArray(color)){
				Color.fromArray(color, this);
			}else{
				this._set(color.r, color.g, color.b, color.a);
				if(!(color instanceof Color)){ this.sanitize(); }
			}
			return this;	// Color
		},
		sanitize: function(){
			// summary:
			//		Ensures the object has correct attributes
			// description:
			//		the default implementation does nothing, include dojo.colors to
			//		augment it with real checks
			return this;	// Color
		},
		toRgb: function(){
			// summary:
			//		Returns 3 component array of rgb values
			// example:
			//	|	var c = new Color("#000000");
			//	|	console.log(c.toRgb()); // [0,0,0]
			var t = this;
			return [t.r, t.g, t.b]; // Array
		},
		toRgba: function(){
			// summary:
			//		Returns a 4 component array of rgba values from the color
			//		represented by this object.
			var t = this;
			return [t.r, t.g, t.b, t.a];	// Array
		},
		toHex: function(){
			// summary:
			//		Returns a CSS color string in hexadecimal representation
			// example:
			//	|	console.log(new Color([0,0,0]).toHex()); // #000000
			var arr = ArrayUtil.map(["r", "g", "b"], function(x){
				var s = this[x].toString(16);
				return s.length < 2 ? "0" + s : s;
			}, this);
			return "#" + arr.join("");	// String
		},
		toCss: function(/*Boolean?*/ includeAlpha){
			// summary:
			//		Returns a css color string in rgb(a) representation
			// example:
			//	|	var c = new Color("#FFF").toCss();
			//	|	console.log(c); // rgb('255','255','255')
			var t = this, rgb = t.r + ", " + t.g + ", " + t.b;
			return (includeAlpha ? "rgba(" + rgb + ", " + t.a : "rgb(" + rgb) + ")";	// String
		},
		toString: function(){
			// summary:
			//		Returns a visual representation of the color
			return this.toCss(true); // String
		}
	});

	Color.blendColors = dojo.blendColors = function(
		/*Color*/ start,
		/*Color*/ end,
		/*Number*/ weight,
		/*Color?*/ obj
	){
		// summary:
		//		Blend colors end and start with weight from 0 to 1, 0.5 being a 50/50 blend,
		//		can reuse a previously allocated Color object for the result
		var t = obj || new Color();
		ArrayUtil.forEach(["r", "g", "b", "a"], function(x){
			t[x] = start[x] + (end[x] - start[x]) * weight;
			if(x != "a"){ t[x] = Math.round(t[x]); }
		});
		return t.sanitize();	// Color
	};

	Color.fromRgb = dojo.colorFromRgb = function(/*String*/ color, /*Color?*/ obj){
		// summary:
		//		Returns a `Color` instance from a string of the form
		//		"rgb(...)" or "rgba(...)". Optionally accepts a `Color`
		//		object to update with the parsed value and return instead of
		//		creating a new object.
		// returns:
		//		A Color object. If obj is passed, it will be the return value.
		var m = color.toLowerCase().match(/^rgba?\(([\s\.,0-9]+)\)/);
		return m && Color.fromArray(m[1].split(/\s*,\s*/), obj);	// Color
	};

	Color.fromHex = dojo.colorFromHex = function(/*String*/ color, /*Color?*/ obj){
		// summary:
		//		Converts a hex string with a '#' prefix to a color object.
		//		Supports 12-bit #rgb shorthand. Optionally accepts a
		//		`Color` object to update with the parsed value.
		//
		// returns:
		//		A Color object. If obj is passed, it will be the return value.
		//
		// example:
		//	 | var thing = dojo.colorFromHex("#ededed"); // grey, longhand
		//
		// example:
		//	| var thing = dojo.colorFromHex("#000"); // black, shorthand
		var t = obj || new Color(),
			bits = (color.length == 4) ? 4 : 8,
			mask = (1 << bits) - 1;
		color = Number("0x" + color.substr(1));
		if(isNaN(color)){
			return null; // Color
		}
		ArrayUtil.forEach(["b", "g", "r"], function(x){
			var c = color & mask;
			color >>= bits;
			t[x] = bits == 4 ? 17 * c : c;
		});
		t.a = 1;
		return t;	// Color
	};

	Color.fromArray = dojo.colorFromArray = function(/*Array*/ a, /*Color?*/ obj){
		// summary:
		//		Builds a `Color` from a 3 or 4 element array, mapping each
		//		element in sequence to the rgb(a) values of the color.
		// example:
		//		| var myColor = dojo.colorFromArray([237,237,237,0.5]); // grey, 50% alpha
		// returns:
		//		A Color object. If obj is passed, it will be the return value.
		var t = obj || new Color();
		t._set(Number(a[0]), Number(a[1]), Number(a[2]), Number(a[3]));
		if(isNaN(t.a)){ t.a = 1; }
		return t.sanitize();	// Color
	};

	Color.fromString = dojo.colorFromString = function(/*String*/ str, /*Color?*/ obj){
		// summary:
		//		Parses `str` for a color value. Accepts hex, rgb, and rgba
		//		style color values.
		// description:
		//		Acceptable input values for str may include arrays of any form
		//		accepted by dojo.colorFromArray, hex strings such as "#aaaaaa", or
		//		rgb or rgba strings such as "rgb(133, 200, 16)" or "rgba(10, 10,
		//		10, 50)"
		// returns:
		//		A Color object. If obj is passed, it will be the return value.
		var a = Color.named[str];
		return a && Color.fromArray(a, obj) || Color.fromRgb(str, obj) || Color.fromHex(str, obj);	// Color
	};

	return Color;
});

},
'dojo/request':function(){
define([
	'./request/default!'/*=====,
	'./_base/declare',
	'./promise/Promise' =====*/
], function(request/*=====, declare, Promise =====*/){
	/*=====
	request = function(url, options){
		// summary:
		//		Send a request using the default transport for the current platform.
		// url: String
		//		The URL to request.
		// options: dojo/request.__Options?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	request.__Promise = declare(Promise, {
		// response: dojo/promise/Promise
		//		A promise resolving to an object representing
		//		the response from the server.
	});
	request.__BaseOptions = declare(null, {
		// query: String|Object?
		//		Query parameters to append to the URL.
		// data: String|Object?
		//		Data to transfer.  This is ignored for GET and DELETE
		//		requests.
		// preventCache: Boolean?
		//		Whether to append a cache-busting parameter to the URL.
		// timeout: Integer?
		//		Milliseconds to wait for the response.  If this time
		//		passes, the then the promise is rejected.
		// handleAs: String?
		//		How to handle the response from the server.  Default is
		//		'text'.  Other values are 'json', 'javascript', and 'xml'.
	});
	request.__MethodOptions = declare(null, {
		// method: String?
		//		The HTTP method to use to make the request.  Must be
		//		uppercase.
	});
	request.__Options = declare([request.__BaseOptions, request.__MethodOptions]);

	request.get = function(url, options){
		// summary:
		//		Send an HTTP GET request using the default transport for the current platform.
		// url: String
		//		URL to request
		// options: dojo/request.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	request.post = function(url, options){
		// summary:
		//		Send an HTTP POST request using the default transport for the current platform.
		// url: String
		//		URL to request
		// options: dojo/request.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	request.put = function(url, options){
		// summary:
		//		Send an HTTP POST request using the default transport for the current platform.
		// url: String
		//		URL to request
		// options: dojo/request.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	request.del = function(url, options){
		// summary:
		//		Send an HTTP DELETE request using the default transport for the current platform.
		// url: String
		//		URL to request
		// options: dojo/request.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	=====*/
	return request;
});

},
'dojo/promise/instrumentation':function(){
define([
	"./tracer",
	"../has",
	"../_base/lang",
	"../_base/array"
], function(tracer, has, lang, arrayUtil){
	function logError(error, rejection, deferred){
		var stack = "";
		if(error && error.stack){
			stack += error.stack;
		}
		if(rejection && rejection.stack){
			stack += "\n    ----------------------------------------\n    rejected" + rejection.stack.split("\n").slice(1).join("\n").replace(/^\s+/, " ");
		}
		if(deferred && deferred.stack){
			stack += "\n    ----------------------------------------\n" + deferred.stack;
		}
		console.error(error, stack);
	}

	function reportRejections(error, handled, rejection, deferred){
		if(!handled){
			logError(error, rejection, deferred);
		}
	}

	var errors = [];
	var activeTimeout = false;
	var unhandledWait = 1000;
	function trackUnhandledRejections(error, handled, rejection, deferred){
		if(handled){
			arrayUtil.some(errors, function(obj, ix){
				if(obj.error === error){
					errors.splice(ix, 1);
					return true;
				}
			});
		}else if(!arrayUtil.some(errors, function(obj){ return obj.error === error; })){
			errors.push({
				error: error,
				rejection: rejection,
				deferred: deferred,
				timestamp: new Date().getTime()
			});
		}

		if(!activeTimeout){
			activeTimeout = setTimeout(logRejected, unhandledWait);
		}
	}

	function logRejected(){
		var now = new Date().getTime();
		var reportBefore = now - unhandledWait;
		errors = arrayUtil.filter(errors, function(obj){
			if(obj.timestamp < reportBefore){
				logError(obj.error, obj.rejection, obj.deferred);
				return false;
			}
			return true;
		});

		if(errors.length){
			activeTimeout = setTimeout(logRejected, errors[0].timestamp + unhandledWait - now);
		}else{
			activeTimeout = false;
		}
	}

	return function(Deferred){
		// summary:
		//		Initialize instrumentation for the Deferred class.
		// description:
		//		Initialize instrumentation for the Deferred class.
		//		Done automatically by `dojo/Deferred` if the
		//		`deferredInstrumentation` and `useDeferredInstrumentation`
		//		config options are set.
		//
		//		Sets up `dojo/promise/tracer` to log to the console.
		//
		//		Sets up instrumentation of rejected deferreds so unhandled
		//		errors are logged to the console.

		var usage = has("config-useDeferredInstrumentation");
		if(usage){
			tracer.on("resolved", lang.hitch(console, "log", "resolved"));
			tracer.on("rejected", lang.hitch(console, "log", "rejected"));
			tracer.on("progress", lang.hitch(console, "log", "progress"));

			var args = [];
			if(typeof usage === "string"){
				args = usage.split(",");
				usage = args.shift();
			}
			if(usage === "report-rejections"){
				Deferred.instrumentRejected = reportRejections;
			}else if(usage === "report-unhandled-rejections" || usage === true || usage === 1){
				Deferred.instrumentRejected = trackUnhandledRejections;
				unhandledWait = parseInt(args[0], 10) || unhandledWait;
			}else{
				throw new Error("Unsupported instrumentation usage <" + usage + ">");
			}
		}
	};
});

},
'dojo/selector/_loader':function(){
define(["../has", "require"],
		function(has, require){

"use strict";
var testDiv = document.createElement("div");
has.add("dom-qsa2.1", !!testDiv.querySelectorAll);
has.add("dom-qsa3", function(){
			// test to see if we have a reasonable native selector engine available
			try{
				testDiv.innerHTML = "<p class='TEST'></p>"; // test kind of from sizzle
				// Safari can't handle uppercase or unicode characters when
				// in quirks mode, IE8 can't handle pseudos like :empty
				return testDiv.querySelectorAll(".TEST:empty").length == 1;
			}catch(e){}
		});
var fullEngine;
var acme = "./acme", lite = "./lite";
return {
	// summary:
	//		This module handles loading the appropriate selector engine for the given browser

	load: function(id, parentRequire, loaded, config){
		var req = require;
		// here we implement the default logic for choosing a selector engine
		id = id == "default" ? has("config-selectorEngine") || "css3" : id;
		id = id == "css2" || id == "lite" ? lite :
				id == "css2.1" ? has("dom-qsa2.1") ? lite : acme :
				id == "css3" ? has("dom-qsa3") ? lite : acme :
				id == "acme" ? acme : (req = parentRequire) && id;
		if(id.charAt(id.length-1) == '?'){
			id = id.substring(0,id.length - 1);
			var optionalLoad = true;
		}
		// the query engine is optional, only load it if a native one is not available or existing one has not been loaded
		if(optionalLoad && (has("dom-compliant-qsa") || fullEngine)){
			return loaded(fullEngine);
		}
		// load the referenced selector engine
		req([id], function(engine){
			if(id != "./lite"){
				fullEngine = engine;
			}
			loaded(engine);
		});
	}
};
});

},
'dojo/promise/Promise':function(){
define([
	"../_base/lang"
], function(lang){
	"use strict";

	// module:
	//		dojo/promise/Promise

	function throwAbstract(){
		throw new TypeError("abstract");
	}

	return lang.extend(function Promise(){
		// summary:
		//		The public interface to a deferred.
		// description:
		//		The public interface to a deferred. All promises in Dojo are
		//		instances of this class.
	}, {
		then: function(callback, errback, progback){
			// summary:
			//		Add new callbacks to the promise.
			// description:
			//		Add new callbacks to the deferred. Callbacks can be added
			//		before or after the deferred is fulfilled.
			// callback: Function?
			//		Callback to be invoked when the promise is resolved.
			//		Receives the resolution value.
			// errback: Function?
			//		Callback to be invoked when the promise is rejected.
			//		Receives the rejection error.
			// progback: Function?
			//		Callback to be invoked when the promise emits a progress
			//		update. Receives the progress update.
			// returns: dojo/promise/Promise
			//		Returns a new promise for the result of the callback(s).
			//		This can be used for chaining many asynchronous operations.

			throwAbstract();
		},

		cancel: function(reason, strict){
			// summary:
			//		Inform the deferred it may cancel its asynchronous operation.
			// description:
			//		Inform the deferred it may cancel its asynchronous operation.
			//		The deferred's (optional) canceler is invoked and the
			//		deferred will be left in a rejected state. Can affect other
			//		promises that originate with the same deferred.
			// reason: any
			//		A message that may be sent to the deferred's canceler,
			//		explaining why it's being canceled.
			// strict: Boolean?
			//		If strict, will throw an error if the deferred has already
			//		been fulfilled and consequently cannot be canceled.
			// returns: any
			//		Returns the rejection reason if the deferred was canceled
			//		normally.

			throwAbstract();
		},

		isResolved: function(){
			// summary:
			//		Checks whether the promise has been resolved.
			// returns: Boolean

			throwAbstract();
		},

		isRejected: function(){
			// summary:
			//		Checks whether the promise has been rejected.
			// returns: Boolean

			throwAbstract();
		},

		isFulfilled: function(){
			// summary:
			//		Checks whether the promise has been resolved or rejected.
			// returns: Boolean

			throwAbstract();
		},

		isCanceled: function(){
			// summary:
			//		Checks whether the promise has been canceled.
			// returns: Boolean

			throwAbstract();
		},

		always: function(callbackOrErrback){
			// summary:
			//		Add a callback to be invoked when the promise is resolved
			//		or rejected.
			// callbackOrErrback: Function?
			//		A function that is used both as a callback and errback.
			// returns: dojo/promise/Promise
			//		Returns a new promise for the result of the callback/errback.

			return this.then(callbackOrErrback, callbackOrErrback);
		},

		otherwise: function(errback){
			// summary:
			//		Add new errbacks to the promise.
			// errback: Function?
			//		Callback to be invoked when the promise is rejected.
			// returns: dojo/promise/Promise
			//		Returns a new promise for the result of the errback.

			return this.then(null, errback);
		},

		trace: function(){
			return this;
		},

		traceRejected: function(){
			return this;
		},

		toString: function(){
			// returns: string
			//		Returns `[object Promise]`.

			return "[object Promise]";
		}
	});
});

},
'dojo/request/watch':function(){
define([
	'./util',
	'../errors/RequestTimeoutError',
	'../errors/CancelError',
	'../_base/array',
	'../_base/window',
	'../has!host-browser?dom-addeventlistener?:../on:'
], function(util, RequestTimeoutError, CancelError, array, win, on){
	// avoid setting a timer per request. It degrades performance on IE
	// something fierece if we don't use unified loops.
	var _inFlightIntvl = null,
		_inFlight = [];

	function watchInFlight(){
		// summary:
		//		internal method that checks each inflight XMLHttpRequest to see
		//		if it has completed or if the timeout situation applies.

		var now = +(new Date);

		// we need manual loop because we often modify _inFlight (and therefore 'i') while iterating
		for(var i = 0, dfd; i < _inFlight.length && (dfd = _inFlight[i]); i++){
			var response = dfd.response,
				options = response.options;
			if((dfd.isCanceled && dfd.isCanceled()) || (dfd.isValid && !dfd.isValid(response))){
				_inFlight.splice(i--, 1);
				watch._onAction && watch._onAction();
			}else if(dfd.isReady && dfd.isReady(response)){
				_inFlight.splice(i--, 1);
				dfd.handleResponse(response);
				watch._onAction && watch._onAction();
			}else if(dfd.startTime){
				// did we timeout?
				if(dfd.startTime + (options.timeout || 0) < now){
					_inFlight.splice(i--, 1);
					// Cancel the request so the io module can do appropriate cleanup.
					dfd.cancel(new RequestTimeoutError('Timeout exceeded', response));
					watch._onAction && watch._onAction();
				}
			}
		}

		watch._onInFlight && watch._onInFlight(dfd);

		if(!_inFlight.length){
			clearInterval(_inFlightIntvl);
			_inFlightIntvl = null;
		}
	}

	function watch(dfd){
		// summary:
		//		Watches the io request represented by dfd to see if it completes.
		// dfd: Deferred
		//		The Deferred object to watch.
		// response: Object
		//		The object used as the value of the request promise.
		// validCheck: Function
		//		Function used to check if the IO request is still valid. Gets the dfd
		//		object as its only argument.
		// ioCheck: Function
		//		Function used to check if basic IO call worked. Gets the dfd
		//		object as its only argument.
		// resHandle: Function
		//		Function used to process response. Gets the dfd
		//		object as its only argument.
		if(dfd.response.options.timeout){
			dfd.startTime = +(new Date);
		}

		if(dfd.isFulfilled()){
			// bail out if the deferred is already fulfilled
			return;
		}

		_inFlight.push(dfd);
		if(!_inFlightIntvl){
			_inFlightIntvl = setInterval(watchInFlight, 50);
		}

		// handle sync requests separately from async:
		// http://bugs.dojotoolkit.org/ticket/8467
		if(dfd.response.options.sync){
			watchInFlight();
		}
	}

	watch.cancelAll = function cancelAll(){
		// summary:
		//		Cancels all pending IO requests, regardless of IO type
		try{
			array.forEach(_inFlight, function(dfd){
				try{
					dfd.cancel(new CancelError('All requests canceled.'));
				}catch(e){}
			});
		}catch(e){}
	};

	if(win && on && win.doc.attachEvent){
		// Automatically call cancel all io calls on unload in IE
		// http://bugs.dojotoolkit.org/ticket/2357
		on(win.global, 'unload', function(){
			watch.cancelAll();
		});
	}

	return watch;
});

},
'dojo/selector/lite':function(){
define(["../has", "../_base/kernel"], function(has, dojo){
"use strict";

var testDiv = document.createElement("div");
var matchesSelector = testDiv.matchesSelector || testDiv.webkitMatchesSelector || testDiv.mozMatchesSelector || testDiv.msMatchesSelector || testDiv.oMatchesSelector; // IE9, WebKit, Firefox have this, but not Opera yet
var querySelectorAll = testDiv.querySelectorAll;
var unionSplit = /([^\s,](?:"(?:\\.|[^"])+"|'(?:\\.|[^'])+'|[^,])*)/g;
has.add("dom-matches-selector", !!matchesSelector);
has.add("dom-qsa", !!querySelectorAll); 

// this is a simple query engine. It has handles basic selectors, and for simple
// common selectors is extremely fast
var liteEngine = function(selector, root){
	// summary:
	//		A small lightweight query selector engine that implements CSS2.1 selectors
	//		minus pseudo-classes and the sibling combinator, plus CSS3 attribute selectors

	if(combine && selector.indexOf(',') > -1){
		return combine(selector, root);
	}
	// use the root's ownerDocument if provided, otherwise try to use dojo.doc. Note 
	// that we don't use dojo/_base/window's doc to reduce dependencies, and 
	// fallback to plain document if dojo.doc hasn't been defined (by dojo/_base/window).
	// presumably we will have a better way to do this in 2.0 
	var doc = root ? root.ownerDocument || root : dojo.doc || document, 
		match = (querySelectorAll ? 
			/^([\w]*)#([\w\-]+$)|^(\.)([\w\-\*]+$)|^(\w+$)/ : // this one only matches on simple queries where we can beat qSA with specific methods
			/^([\w]*)#([\w\-]+)(?:\s+(.*))?$|(?:^|(>|.+\s+))([\w\-\*]+)(\S*$)/) // this one matches parts of the query that we can use to speed up manual filtering
			.exec(selector);
	root = root || doc;
	if(match){
		// fast path regardless of whether or not querySelectorAll exists
		if(match[2]){
			// an #id
			// use dojo.byId if available as it fixes the id retrieval in IE, note that we can't use the dojo namespace in 2.0, but if there is a conditional module use, we will use that
			var found = dojo.byId ? dojo.byId(match[2]) : doc.getElementById(match[2]);
			if(!found || (match[1] && match[1] != found.tagName.toLowerCase())){
				// if there is a tag qualifer and it doesn't match, no matches
				return [];
			}
			if(root != doc){
				// there is a root element, make sure we are a child of it
				var parent = found;
				while(parent != root){
					parent = parent.parentNode;
					if(!parent){
						return [];
					}
				}
			}
			return match[3] ?
					liteEngine(match[3], found) 
					: [found];
		}
		if(match[3] && root.getElementsByClassName){
			// a .class
			return root.getElementsByClassName(match[4]);
		}
		var found;
		if(match[5]){
			// a tag
			found = root.getElementsByTagName(match[5]);
			if(match[4] || match[6]){
				selector = (match[4] || "") + match[6];
			}else{
				// that was the entirety of the query, return results
				return found;
			}
		}
	}
	if(querySelectorAll){
		// qSA works strangely on Element-rooted queries
		// We can work around this by specifying an extra ID on the root
		// and working up from there (Thanks to Andrew Dupont for the technique)
		// IE 8 doesn't work on object elements
		if (root.nodeType === 1 && root.nodeName.toLowerCase() !== "object"){				
			return useRoot(root, selector, root.querySelectorAll);
		}else{
			// we can use the native qSA
			return root.querySelectorAll(selector);
		}
	}else if(!found){
		// search all children and then filter
		found = root.getElementsByTagName("*");
	}
	// now we filter the nodes that were found using the matchesSelector
	var results = [];
	for(var i = 0, l = found.length; i < l; i++){
		var node = found[i];
		if(node.nodeType == 1 && jsMatchesSelector(node, selector, root)){
			// keep the nodes that match the selector
			results.push(node);
		}
	}
	return results;
};
var useRoot = function(context, query, method){
	// this function creates a temporary id so we can do rooted qSA queries, this is taken from sizzle
	var oldContext = context,
		old = context.getAttribute("id"),
		nid = old || "__dojo__",
		hasParent = context.parentNode,
		relativeHierarchySelector = /^\s*[+~]/.test(query);

	if(relativeHierarchySelector && !hasParent){
		return [];
	}
	if(!old){
		context.setAttribute("id", nid);
	}else{
		nid = nid.replace(/'/g, "\\$&");
	}
	if(relativeHierarchySelector && hasParent){
		context = context.parentNode;
	}
	var selectors = query.match(unionSplit);
	for(var i = 0; i < selectors.length; i++){
		selectors[i] = "[id='" + nid + "'] " + selectors[i];
	}
	query = selectors.join(",");

	try{
		return method.call(context, query);
	}finally{
		if(!old){
			oldContext.removeAttribute("id");
		}
	}
};

if(!has("dom-matches-selector")){
	var jsMatchesSelector = (function(){
		// a JS implementation of CSS selector matching, first we start with the various handlers
		var caseFix = testDiv.tagName == "div" ? "toLowerCase" : "toUpperCase";
		var selectorTypes = {
			"": function(tagName){
				tagName = tagName[caseFix]();
				return function(node){
					return node.tagName == tagName;
				};
			},
			".": function(className){
				var classNameSpaced = ' ' + className + ' ';
				return function(node){
					return node.className.indexOf(className) > -1 && (' ' + node.className + ' ').indexOf(classNameSpaced) > -1;
				};
			},
			"#": function(id){
				return function(node){
					return node.id == id;
				};
			}
		};
		var attrComparators = {
			"^=": function(attrValue, value){
				return attrValue.indexOf(value) == 0;
			},
			"*=": function(attrValue, value){
				return attrValue.indexOf(value) > -1;
			},
			"$=": function(attrValue, value){
				return attrValue.substring(attrValue.length - value.length, attrValue.length) == value;
			},
			"~=": function(attrValue, value){
				return (' ' + attrValue + ' ').indexOf(' ' + value + ' ') > -1;
			},
			"|=": function(attrValue, value){
				return (attrValue + '-').indexOf(value + '-') == 0;
			},
			"=": function(attrValue, value){
				return attrValue == value;
			},
			"": function(attrValue, value){
				return true;
			}
		};
		function attr(name, value, type){
			var firstChar = value.charAt(0);
			if(firstChar == '"' || firstChar == "'"){
				// it is quoted, remove the quotes
				value = value.slice(1, -1);
			}
			value = value.replace(/\\/g,'');
			var comparator = attrComparators[type || ""];
			return function(node){
				var attrValue = node.getAttribute(name);
				return attrValue && comparator(attrValue, value);
			};
		}
		function ancestor(matcher){
			return function(node, root){
				while((node = node.parentNode) != root){
					if(matcher(node, root)){
						return true;
					}
				}
			};
		}
		function parent(matcher){
			return function(node, root){
				node = node.parentNode;
				return matcher ? 
					node != root && matcher(node, root)
					: node == root;
			};
		}
		var cache = {};
		function and(matcher, next){
			return matcher ?
				function(node, root){
					return next(node) && matcher(node, root);
				}
				: next;
		}
		return function(node, selector, root){
			// this returns true or false based on if the node matches the selector (optionally within the given root)
			var matcher = cache[selector]; // check to see if we have created a matcher function for the given selector
			if(!matcher){
				// create a matcher function for the given selector
				// parse the selectors
				if(selector.replace(/(?:\s*([> ])\s*)|(#|\.)?((?:\\.|[\w-])+)|\[\s*([\w-]+)\s*(.?=)?\s*("(?:\\.|[^"])+"|'(?:\\.|[^'])+'|(?:\\.|[^\]])*)\s*\]/g, function(t, combinator, type, value, attrName, attrType, attrValue){
					if(value){
						matcher = and(matcher, selectorTypes[type || ""](value.replace(/\\/g, '')));
					}
					else if(combinator){
						matcher = (combinator == " " ? ancestor : parent)(matcher);
					}
					else if(attrName){
						matcher = and(matcher, attr(attrName, attrValue, attrType));
					}
					return "";
				})){
					throw new Error("Syntax error in query");
				}
				if(!matcher){
					return true;
				}
				cache[selector] = matcher;
			}
			// now run the matcher function on the node
			return matcher(node, root);
		};
	})();
}
if(!has("dom-qsa")){
	var combine = function(selector, root){
		// combined queries
		var selectors = selector.match(unionSplit);
		var indexed = [];
		// add all results and keep unique ones, this only runs in IE, so we take advantage 
		// of known IE features, particularly sourceIndex which is unique and allows us to 
		// order the results 
		for(var i = 0; i < selectors.length; i++){
			selector = new String(selectors[i].replace(/\s*$/,''));
			selector.indexOf = escape; // keep it from recursively entering combine
			var results = liteEngine(selector, root);
			for(var j = 0, l = results.length; j < l; j++){
				var node = results[j];
				indexed[node.sourceIndex] = node;
			}
		}
		// now convert from a sparse array to a dense array
		var totalResults = [];
		for(i in indexed){
			totalResults.push(indexed[i]);
		}
		return totalResults;
	};
}

liteEngine.match = matchesSelector ? function(node, selector, root){
	if(root && root.nodeType != 9){
		// doesn't support three args, use rooted id trick
		return useRoot(root, selector, function(query){
			return matchesSelector.call(node, query);
		});
	}
	// we have a native matchesSelector, use that
	return matchesSelector.call(node, selector);
} : jsMatchesSelector; // otherwise use the JS matches impl

return liteEngine;
});

},
'dojo/on':function(){
define(["./has!dom-addeventlistener?:./aspect", "./_base/kernel", "./has"], function(aspect, dojo, has){

	"use strict";
	if( 1 ){ // check to make sure we are in a browser, this module should work anywhere
		var major = window.ScriptEngineMajorVersion;
		has.add("jscript", major && (major() + ScriptEngineMinorVersion() / 10));
		has.add("event-orientationchange", has("touch") && !has("android")); // TODO: how do we detect this?
		has.add("event-stopimmediatepropagation", window.Event && !!window.Event.prototype && !!window.Event.prototype.stopImmediatePropagation);
	}
	var on = function(target, type, listener, dontFix){
		// summary:
		//		A function that provides core event listening functionality. With this function
		//		you can provide a target, event type, and listener to be notified of
		//		future matching events that are fired.
		// target: Element|Object
		//		This is the target object or DOM element that to receive events from
		// type: String|Function
		//		This is the name of the event to listen for or an extension event type.
		// listener: Function
		//		This is the function that should be called when the event fires.
		// returns: Object
		//		An object with a remove() method that can be used to stop listening for this
		//		event.
		// description:
		//		To listen for "click" events on a button node, we can do:
		//		|	define(["dojo/on"], function(listen){
		//		|		on(button, "click", clickHandler);
		//		|		...
		//		Evented JavaScript objects can also have their own events.
		//		|	var obj = new Evented;
		//		|	on(obj, "foo", fooHandler);
		//		And then we could publish a "foo" event:
		//		|	on.emit(obj, "foo", {key: "value"});
		//		We can use extension events as well. For example, you could listen for a tap gesture:
		//		|	define(["dojo/on", "dojo/gesture/tap", function(listen, tap){
		//		|		on(button, tap, tapHandler);
		//		|		...
		//		which would trigger fooHandler. Note that for a simple object this is equivalent to calling:
		//		|	obj.onfoo({key:"value"});
		//		If you use on.emit on a DOM node, it will use native event dispatching when possible.

		if(typeof target.on == "function" && typeof type != "function"){
			// delegate to the target's on() method, so it can handle it's own listening if it wants
			return target.on(type, listener);
		}
		// delegate to main listener code
		return on.parse(target, type, listener, addListener, dontFix, this);
	};
	on.pausable =  function(target, type, listener, dontFix){
		// summary:
		//		This function acts the same as on(), but with pausable functionality. The
		//		returned signal object has pause() and resume() functions. Calling the
		//		pause() method will cause the listener to not be called for future events. Calling the
		//		resume() method will cause the listener to again be called for future events.
		var paused;
		var signal = on(target, type, function(){
			if(!paused){
				return listener.apply(this, arguments);
			}
		}, dontFix);
		signal.pause = function(){
			paused = true;
		};
		signal.resume = function(){
			paused = false;
		};
		return signal;
	};
	on.once = function(target, type, listener, dontFix){
		// summary:
		//		This function acts the same as on(), but will only call the listener once. The 
		//		listener will be called for the first
		//		event that takes place and then listener will automatically be removed.
		var signal = on(target, type, function(){
			// remove this listener
			signal.remove();
			// proceed to call the listener
			return listener.apply(this, arguments);
		});
		return signal;
	};
	on.parse = function(target, type, listener, addListener, dontFix, matchesTarget){
		if(type.call){
			// event handler function
			// on(node, touch.press, touchListener);
			return type.call(matchesTarget, target, listener);
		}

		if(type.indexOf(",") > -1){
			// we allow comma delimited event names, so you can register for multiple events at once
			var events = type.split(/\s*,\s*/);
			var handles = [];
			var i = 0;
			var eventName;
			while(eventName = events[i++]){
				handles.push(addListener(target, eventName, listener, dontFix, matchesTarget));
			}
			handles.remove = function(){
				for(var i = 0; i < handles.length; i++){
					handles[i].remove();
				}
			};
			return handles;
		}
		return addListener(target, type, listener, dontFix, matchesTarget);
	};
	var touchEvents = /^touch/;
	function addListener(target, type, listener, dontFix, matchesTarget){
		// event delegation:
		var selector = type.match(/(.*):(.*)/);
		// if we have a selector:event, the last one is interpreted as an event, and we use event delegation
		if(selector){
			type = selector[2];
			selector = selector[1];
			// create the extension event for selectors and directly call it
			return on.selector(selector, type).call(matchesTarget, target, listener);
		}
		// test to see if it a touch event right now, so we don't have to do it every time it fires
		if(has("touch")){
			if(touchEvents.test(type)){
				// touch event, fix it
				listener = fixTouchListener(listener);
			}
			if(!has("event-orientationchange") && (type == "orientationchange")){
				//"orientationchange" not supported <= Android 2.1, 
				//but works through "resize" on window
				type = "resize"; 
				target = window;
				listener = fixTouchListener(listener);
			} 
		}
		if(addStopImmediate){
			// add stopImmediatePropagation if it doesn't exist
			listener = addStopImmediate(listener);
		}
		// normal path, the target is |this|
		if(target.addEventListener){
			// the target has addEventListener, which should be used if available (might or might not be a node, non-nodes can implement this method as well)
			// check for capture conversions
			var capture = type in captures,
				adjustedType = capture ? captures[type] : type;
			target.addEventListener(adjustedType, listener, capture);
			// create and return the signal
			return {
				remove: function(){
					target.removeEventListener(adjustedType, listener, capture);
				}
			};
		}
		type = "on" + type;
		if(fixAttach && target.attachEvent){
			return fixAttach(target, type, listener);
		}
		throw new Error("Target must be an event emitter");
	}

	on.selector = function(selector, eventType, children){
		// summary:
		//		Creates a new extension event with event delegation. This is based on
		//		the provided event type (can be extension event) that
		//		only calls the listener when the CSS selector matches the target of the event.
		//
		//		The application must require() an appropriate level of dojo/query to handle the selector.
		// selector:
		//		The CSS selector to use for filter events and determine the |this| of the event listener.
		// eventType:
		//		The event to listen for
		// children:
		//		Indicates if children elements of the selector should be allowed. This defaults to 
		//		true
		// example:
		// |	require(["dojo/on", "dojo/mouse", "dojo/query!css2"], function(listen, mouse){
		// |		on(node, on.selector(".my-class", mouse.enter), handlerForMyHover);
		return function(target, listener){
			// if the selector is function, use it to select the node, otherwise use the matches method
			var matchesTarget = typeof selector == "function" ? {matches: selector} : this,
				bubble = eventType.bubble;
			function select(eventTarget){
				// see if we have a valid matchesTarget or default to dojo.query
				matchesTarget = matchesTarget && matchesTarget.matches ? matchesTarget : dojo.query;
				// there is a selector, so make sure it matches
				while(!matchesTarget.matches(eventTarget, selector, target)){
					if(eventTarget == target || children === false || !(eventTarget = eventTarget.parentNode) || eventTarget.nodeType != 1){ // intentional assignment
						return;
					}
				}
				return eventTarget;
			}
			if(bubble){
				// the event type doesn't naturally bubble, but has a bubbling form, use that, and give it the selector so it can perform the select itself
				return on(target, bubble(select), listener);
			}
			// standard event delegation
			return on(target, eventType, function(event){
				// call select to see if we match
				var eventTarget = select(event.target);
				// if it matches we call the listener
				return eventTarget && listener.call(eventTarget, event);
			});
		};
	};

	function syntheticPreventDefault(){
		this.cancelable = false;
	}
	function syntheticStopPropagation(){
		this.bubbles = false;
	}
	var slice = [].slice,
		syntheticDispatch = on.emit = function(target, type, event){
		// summary:
		//		Fires an event on the target object.
		// target:
		//		The target object to fire the event on. This can be a DOM element or a plain 
		//		JS object. If the target is a DOM element, native event emiting mechanisms
		//		are used when possible.
		// type:
		//		The event type name. You can emulate standard native events like "click" and 
		//		"mouseover" or create custom events like "open" or "finish".
		// event:
		//		An object that provides the properties for the event. See https://developer.mozilla.org/en/DOM/event.initEvent 
		//		for some of the properties. These properties are copied to the event object.
		//		Of particular importance are the cancelable and bubbles properties. The
		//		cancelable property indicates whether or not the event has a default action
		//		that can be cancelled. The event is cancelled by calling preventDefault() on
		//		the event object. The bubbles property indicates whether or not the
		//		event will bubble up the DOM tree. If bubbles is true, the event will be called
		//		on the target and then each parent successively until the top of the tree
		//		is reached or stopPropagation() is called. Both bubbles and cancelable 
		//		default to false.
		// returns:
		//		If the event is cancelable and the event is not cancelled,
		//		emit will return true. If the event is cancelable and the event is cancelled,
		//		emit will return false.
		// details:
		//		Note that this is designed to emit events for listeners registered through
		//		dojo/on. It should actually work with any event listener except those
		//		added through IE's attachEvent (IE8 and below's non-W3C event emiting
		//		doesn't support custom event types). It should work with all events registered
		//		through dojo/on. Also note that the emit method does do any default
		//		action, it only returns a value to indicate if the default action should take
		//		place. For example, emiting a keypress event would not cause a character
		//		to appear in a textbox.
		// example:
		//		To fire our own click event
		//	|	on.emit(dojo.byId("button"), "click", {
		//	|		cancelable: true,
		//	|		bubbles: true,
		//	|		screenX: 33,
		//	|		screenY: 44
		//	|	});
		//		We can also fire our own custom events:
		//	|	on.emit(dojo.byId("slider"), "slide", {
		//	|		cancelable: true,
		//	|		bubbles: true,
		//	|		direction: "left-to-right"
		//	|	});
		var args = slice.call(arguments, 2);
		var method = "on" + type;
		if("parentNode" in target){
			// node (or node-like), create event controller methods
			var newEvent = args[0] = {};
			for(var i in event){
				newEvent[i] = event[i];
			}
			newEvent.preventDefault = syntheticPreventDefault;
			newEvent.stopPropagation = syntheticStopPropagation;
			newEvent.target = target;
			newEvent.type = type;
			event = newEvent;
		}
		do{
			// call any node which has a handler (note that ideally we would try/catch to simulate normal event propagation but that causes too much pain for debugging)
			target[method] && target[method].apply(target, args);
			// and then continue up the parent node chain if it is still bubbling (if started as bubbles and stopPropagation hasn't been called)
		}while(event && event.bubbles && (target = target.parentNode));
		return event && event.cancelable && event; // if it is still true (was cancelable and was cancelled), return the event to indicate default action should happen
	};
	var captures = {};
	if(!has("event-stopimmediatepropagation")){
		var stopImmediatePropagation =function(){
			this.immediatelyStopped = true;
			this.modified = true; // mark it as modified so the event will be cached in IE
		};
		var addStopImmediate = function(listener){
			return function(event){
				if(!event.immediatelyStopped){// check to make sure it hasn't been stopped immediately
					event.stopImmediatePropagation = stopImmediatePropagation;
					return listener.apply(this, arguments);
				}
			};
		}
	} 
	if(has("dom-addeventlistener")){
		// normalize focusin and focusout
		captures = {
			focusin: "focus",
			focusout: "blur"
		};

		// emiter that works with native event handling
		on.emit = function(target, type, event){
			if(target.dispatchEvent && document.createEvent){
				// use the native event emiting mechanism if it is available on the target object
				// create a generic event				
				// we could create branch into the different types of event constructors, but 
				// that would be a lot of extra code, with little benefit that I can see, seems 
				// best to use the generic constructor and copy properties over, making it 
				// easy to have events look like the ones created with specific initializers
				var nativeEvent = target.ownerDocument.createEvent("HTMLEvents");
				nativeEvent.initEvent(type, !!event.bubbles, !!event.cancelable);
				// and copy all our properties over
				for(var i in event){
					var value = event[i];
					if(!(i in nativeEvent)){
						nativeEvent[i] = event[i];
					}
				}
				return target.dispatchEvent(nativeEvent) && nativeEvent;
			}
			return syntheticDispatch.apply(on, arguments); // emit for a non-node
		};
	}else{
		// no addEventListener, basically old IE event normalization
		on._fixEvent = function(evt, sender){
			// summary:
			//		normalizes properties on the event object including event
			//		bubbling methods, keystroke normalization, and x/y positions
			// evt:
			//		native event object
			// sender:
			//		node to treat as "currentTarget"
			if(!evt){
				var w = sender && (sender.ownerDocument || sender.document || sender).parentWindow || window;
				evt = w.event;
			}
			if(!evt){return evt;}
			if(lastEvent && evt.type == lastEvent.type){
				// should be same event, reuse event object (so it can be augmented)
				evt = lastEvent;
			}
			if(!evt.target){ // check to see if it has been fixed yet
				evt.target = evt.srcElement;
				evt.currentTarget = (sender || evt.srcElement);
				if(evt.type == "mouseover"){
					evt.relatedTarget = evt.fromElement;
				}
				if(evt.type == "mouseout"){
					evt.relatedTarget = evt.toElement;
				}
				if(!evt.stopPropagation){
					evt.stopPropagation = stopPropagation;
					evt.preventDefault = preventDefault;
				}
				switch(evt.type){
					case "keypress":
						var c = ("charCode" in evt ? evt.charCode : evt.keyCode);
						if (c==10){
							// CTRL-ENTER is CTRL-ASCII(10) on IE, but CTRL-ENTER on Mozilla
							c=0;
							evt.keyCode = 13;
						}else if(c==13||c==27){
							c=0; // Mozilla considers ENTER and ESC non-printable
						}else if(c==3){
							c=99; // Mozilla maps CTRL-BREAK to CTRL-c
						}
						// Mozilla sets keyCode to 0 when there is a charCode
						// but that stops the event on IE.
						evt.charCode = c;
						_setKeyChar(evt);
						break;
				}
			}
			return evt;
		};
		var lastEvent, IESignal = function(handle){
			this.handle = handle;
		};
		IESignal.prototype.remove = function(){
			delete _dojoIEListeners_[this.handle];
		};
		var fixListener = function(listener){
			// this is a minimal function for closing on the previous listener with as few as variables as possible
			return function(evt){
				evt = on._fixEvent(evt, this);
				var result = listener.call(this, evt);
				if(evt.modified){
					// cache the last event and reuse it if we can
					if(!lastEvent){
						setTimeout(function(){
							lastEvent = null;
						});
					}
					lastEvent = evt;
				}
				return result;
			};
		};
		var fixAttach = function(target, type, listener){
			listener = fixListener(listener);
			if(((target.ownerDocument ? target.ownerDocument.parentWindow : target.parentWindow || target.window || window) != top || 
						has("jscript") < 5.8) && 
					!has("config-_allow_leaks")){
				// IE will leak memory on certain handlers in frames (IE8 and earlier) and in unattached DOM nodes for JScript 5.7 and below.
				// Here we use global redirection to solve the memory leaks
				if(typeof _dojoIEListeners_ == "undefined"){
					_dojoIEListeners_ = [];
				}
				var emiter = target[type];
				if(!emiter || !emiter.listeners){
					var oldListener = emiter;
					emiter = Function('event', 'var callee = arguments.callee; for(var i = 0; i<callee.listeners.length; i++){var listener = _dojoIEListeners_[callee.listeners[i]]; if(listener){listener.call(this,event);}}');
					emiter.listeners = [];
					target[type] = emiter;
					emiter.global = this;
					if(oldListener){
						emiter.listeners.push(_dojoIEListeners_.push(oldListener) - 1);
					}
				}
				var handle;
				emiter.listeners.push(handle = (emiter.global._dojoIEListeners_.push(listener) - 1));
				return new IESignal(handle);
			}
			return aspect.after(target, type, listener, true);
		};

		var _setKeyChar = function(evt){
			evt.keyChar = evt.charCode ? String.fromCharCode(evt.charCode) : '';
			evt.charOrCode = evt.keyChar || evt.keyCode;
		};
		// Called in Event scope
		var stopPropagation = function(){
			this.cancelBubble = true;
		};
		var preventDefault = on._preventDefault = function(){
			// Setting keyCode to 0 is the only way to prevent certain keypresses (namely
			// ctrl-combinations that correspond to menu accelerator keys).
			// Otoh, it prevents upstream listeners from getting this information
			// Try to split the difference here by clobbering keyCode only for ctrl
			// combinations. If you still need to access the key upstream, bubbledKeyCode is
			// provided as a workaround.
			this.bubbledKeyCode = this.keyCode;
			if(this.ctrlKey){
				try{
					// squelch errors when keyCode is read-only
					// (e.g. if keyCode is ctrl or shift)
					this.keyCode = 0;
				}catch(e){
				}
			}
			this.defaultPrevented = true;
			this.returnValue = false;
		};
	}
	if(has("touch")){ 
		var Event = function(){};
		var windowOrientation = window.orientation; 
		var fixTouchListener = function(listener){ 
			return function(originalEvent){ 
				//Event normalization(for ontouchxxx and resize): 
				//1.incorrect e.pageX|pageY in iOS 
				//2.there are no "e.rotation", "e.scale" and "onorientationchange" in Andriod
				//3.More TBD e.g. force | screenX | screenX | clientX | clientY | radiusX | radiusY

				// see if it has already been corrected
				var event = originalEvent.corrected;
				if(!event){
					var type = originalEvent.type;
					try{
						delete originalEvent.type; // on some JS engines (android), deleting properties make them mutable
					}catch(e){} 
					if(originalEvent.type){
						// deleting properties doesn't work (older iOS), have to use delegation
						Event.prototype = originalEvent;
						var event = new Event;
						// have to delegate methods to make them work
						event.preventDefault = function(){
							originalEvent.preventDefault();
						};
						event.stopPropagation = function(){
							originalEvent.stopPropagation();
						};
					}else{
						// deletion worked, use property as is
						event = originalEvent;
						event.type = type;
					}
					originalEvent.corrected = event;
					if(type == 'resize'){
						if(windowOrientation == window.orientation){ 
							return null;//double tap causes an unexpected 'resize' in Andriod 
						} 
						windowOrientation = window.orientation;
						event.type = "orientationchange"; 
						return listener.call(this, event);
					}
					// We use the original event and augment, rather than doing an expensive mixin operation
					if(!("rotation" in event)){ // test to see if it has rotation
						event.rotation = 0; 
						event.scale = 1;
					}
					//use event.changedTouches[0].pageX|pageY|screenX|screenY|clientX|clientY|target
					var firstChangeTouch = event.changedTouches[0];
					for(var i in firstChangeTouch){ // use for-in, we don't need to have dependency on dojo/_base/lang here
						delete event[i]; // delete it first to make it mutable
						event[i] = firstChangeTouch[i];
					}
				}
				return listener.call(this, event); 
			}; 
		}; 
	}
	return on;
});

},
'dojo/_base/sniff':function(){
define(["./kernel", "./lang", "../sniff"], function(dojo, lang, has){
	// module:
	//		dojo/_base/sniff

	/*=====
	return {
		// summary:
		//		Deprecated.   New code should use dojo/sniff.
		//		This module populates the dojo browser version sniffing properties like dojo.isIE.
	};
	=====*/

	if(! 1 ){
		return has;
	}

	// no idea what this is for, or if it's used
	dojo._name = "browser";

	lang.mixin(dojo, {
		// isBrowser: Boolean
		//		True if the client is a web-browser
		isBrowser: true,

		// isFF: Number|undefined
		//		Version as a Number if client is FireFox. undefined otherwise. Corresponds to
		//		major detected FireFox version (1.5, 2, 3, etc.)
		isFF: has("ff"),

		// isIE: Number|undefined
		//		Version as a Number if client is MSIE(PC). undefined otherwise. Corresponds to
		//		major detected IE version (6, 7, 8, etc.)
		isIE: has("ie"),

		// isKhtml: Number|undefined
		//		Version as a Number if client is a KHTML browser. undefined otherwise. Corresponds to major
		//		detected version.
		isKhtml: has("khtml"),

		// isWebKit: Number|undefined
		//		Version as a Number if client is a WebKit-derived browser (Konqueror,
		//		Safari, Chrome, etc.). undefined otherwise.
		isWebKit: has("webkit"),

		// isMozilla: Number|undefined
		//		Version as a Number if client is a Mozilla-based browser (Firefox,
		//		SeaMonkey). undefined otherwise. Corresponds to major detected version.
		isMozilla: has("mozilla"),
		// isMoz: Number|undefined
		//		Version as a Number if client is a Mozilla-based browser (Firefox,
		//		SeaMonkey). undefined otherwise. Corresponds to major detected version.
		isMoz: has("mozilla"),

		// isOpera: Number|undefined
		//		Version as a Number if client is Opera. undefined otherwise. Corresponds to
		//		major detected version.
		isOpera: has("opera"),

		// isSafari: Number|undefined
		//		Version as a Number if client is Safari or iPhone. undefined otherwise.
		isSafari: has("safari"),

		// isChrome: Number|undefined
		//		Version as a Number if client is Chrome browser. undefined otherwise.
		isChrome: has("chrome"),

		// isMac: Boolean
		//		True if the client runs on Mac
		isMac: has("mac"),

		// isIos: Boolean
		//		True if client is iPhone, iPod, or iPad
		isIos: has("ios"),

		// isAndroid: Number|undefined
		//		Version as a Number if client is android browser. undefined otherwise.
		isAndroid: has("android"),

		// isWii: Boolean
		//		True if client is Wii
		isWii: has("wii"),

		// isQuirks: Boolean
		//		Page is in quirks mode.
		isQuirks: has("quirks"),

		// isAir: Boolean
		//		True if client is Adobe Air
		isAir: has("air")
	});


	dojo.locale = dojo.locale || (has("ie") ? navigator.userLanguage : navigator.language).toLowerCase();

	return has;
});

},
'dojo/errors/create':function(){
define(["../_base/lang"], function(lang){
	return function(name, ctor, base, props){
		base = base || Error;

		var ErrorCtor = function(message){
			if(base === Error){
				if(Error.captureStackTrace){
					Error.captureStackTrace(this, ErrorCtor);
				}

				// Error.call() operates on the returned error
				// object rather than operating on |this|
				var err = Error.call(this, message),
					prop;

				// Copy own properties from err to |this|
				for(prop in err){
					if(err.hasOwnProperty(prop)){
						this[prop] = err[prop];
					}
				}

				// messsage is non-enumerable in ES5
				this.message = message;
				// stack is non-enumerable in at least Firefox
				this.stack = err.stack;
			}else{
				base.apply(this, arguments);
			}
			if(ctor){
				ctor.apply(this, arguments);
			}
		};

		ErrorCtor.prototype = lang.delegate(base.prototype, props);
		ErrorCtor.prototype.name = name;
		ErrorCtor.prototype.constructor = ErrorCtor;

		return ErrorCtor;
	};
});

},
'dojo/_base/array':function(){
define(["./kernel", "../has", "./lang"], function(dojo, has, lang){
	// module:
	//		dojo/_base/array

	// our old simple function builder stuff
	var cache = {}, u;

	function buildFn(fn){
		return cache[fn] = new Function("item", "index", "array", fn); // Function
	}
	// magic snippet: if(typeof fn == "string") fn = cache[fn] || buildFn(fn);

	// every & some

	function everyOrSome(some){
		var every = !some;
		return function(a, fn, o){
			var i = 0, l = a && a.length || 0, result;
			if(l && typeof a == "string") a = a.split("");
			if(typeof fn == "string") fn = cache[fn] || buildFn(fn);
			if(o){
				for(; i < l; ++i){
					result = !fn.call(o, a[i], i, a);
					if(some ^ result){
						return !result;
					}
				}
			}else{
				for(; i < l; ++i){
					result = !fn(a[i], i, a);
					if(some ^ result){
						return !result;
					}
				}
			}
			return every; // Boolean
		};
	}

	// indexOf, lastIndexOf

	function index(up){
		var delta = 1, lOver = 0, uOver = 0;
		if(!up){
			delta = lOver = uOver = -1;
		}
		return function(a, x, from, last){
			if(last && delta > 0){
				// TODO: why do we use a non-standard signature? why do we need "last"?
				return array.lastIndexOf(a, x, from);
			}
			var l = a && a.length || 0, end = up ? l + uOver : lOver, i;
			if(from === u){
				i = up ? lOver : l + uOver;
			}else{
				if(from < 0){
					i = l + from;
					if(i < 0){
						i = lOver;
					}
				}else{
					i = from >= l ? l + uOver : from;
				}
			}
			if(l && typeof a == "string") a = a.split("");
			for(; i != end; i += delta){
				if(a[i] == x){
					return i; // Number
				}
			}
			return -1; // Number
		};
	}

	var array = {
		// summary:
		//		The Javascript v1.6 array extensions.

		every: everyOrSome(false),
		/*=====
		 every: function(arr, callback, thisObject){
			 // summary:
			 //		Determines whether or not every item in arr satisfies the
			 //		condition implemented by callback.
			 // arr: Array|String
			 //		the array to iterate on. If a string, operates on individual characters.
			 // callback: Function|String
			 //		a function is invoked with three arguments: item, index,
			 //		and array and returns true if the condition is met.
			 // thisObject: Object?
			 //		may be used to scope the call to callback
			 // returns: Boolean
			 // description:
			 //		This function corresponds to the JavaScript 1.6 Array.every() method, with one difference: when
			 //		run over sparse arrays, this implementation passes the "holes" in the sparse array to
			 //		the callback function with a value of undefined. JavaScript 1.6's every skips the holes in the sparse array.
			 //		For more details, see:
			 //		https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/every
			 // example:
			 //	|	// returns false
			 //	|	array.every([1, 2, 3, 4], function(item){ return item>1; });
			 // example:
			 //	|	// returns true
			 //	|	array.every([1, 2, 3, 4], function(item){ return item>0; });
		 },
		 =====*/

		some: everyOrSome(true),
		/*=====
		some: function(arr, callback, thisObject){
			// summary:
			//		Determines whether or not any item in arr satisfies the
			//		condition implemented by callback.
			// arr: Array|String
			//		the array to iterate over. If a string, operates on individual characters.
			// callback: Function|String
			//		a function is invoked with three arguments: item, index,
			//		and array and returns true if the condition is met.
			// thisObject: Object?
			//		may be used to scope the call to callback
			// returns: Boolean
			// description:
			//		This function corresponds to the JavaScript 1.6 Array.some() method, with one difference: when
			//		run over sparse arrays, this implementation passes the "holes" in the sparse array to
			//		the callback function with a value of undefined. JavaScript 1.6's some skips the holes in the sparse array.
			//		For more details, see:
			//		https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/some
			// example:
			//	| // is true
			//	| array.some([1, 2, 3, 4], function(item){ return item>1; });
			// example:
			//	| // is false
			//	| array.some([1, 2, 3, 4], function(item){ return item<1; });
		},
		=====*/

		indexOf: index(true),
		/*=====
		indexOf: function(arr, value, fromIndex, findLast){
			// summary:
			//		locates the first index of the provided value in the
			//		passed array. If the value is not found, -1 is returned.
			// description:
			//		This method corresponds to the JavaScript 1.6 Array.indexOf method, with one difference: when
			//		run over sparse arrays, the Dojo function invokes the callback for every index whereas JavaScript
			//		1.6's indexOf skips the holes in the sparse array.
			//		For details on this method, see:
			//		https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/indexOf
			// arr: Array
			// value: Object
			// fromIndex: Integer?
			// findLast: Boolean?
			// returns: Number
		},
		=====*/

		lastIndexOf: index(false),
		/*=====
		lastIndexOf: function(arr, value, fromIndex){
			// summary:
			//		locates the last index of the provided value in the passed
			//		array. If the value is not found, -1 is returned.
			// description:
			//		This method corresponds to the JavaScript 1.6 Array.lastIndexOf method, with one difference: when
			//		run over sparse arrays, the Dojo function invokes the callback for every index whereas JavaScript
			//		1.6's lastIndexOf skips the holes in the sparse array.
			//		For details on this method, see:
			//		https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/lastIndexOf
			// arr: Array,
			// value: Object,
			// fromIndex: Integer?
			// returns: Number
		},
		=====*/

		forEach: function(arr, callback, thisObject){
			// summary:
			//		for every item in arr, callback is invoked. Return values are ignored.
			//		If you want to break out of the loop, consider using array.every() or array.some().
			//		forEach does not allow breaking out of the loop over the items in arr.
			// arr:
			//		the array to iterate over. If a string, operates on individual characters.
			// callback:
			//		a function is invoked with three arguments: item, index, and array
			// thisObject:
			//		may be used to scope the call to callback
			// description:
			//		This function corresponds to the JavaScript 1.6 Array.forEach() method, with one difference: when
			//		run over sparse arrays, this implementation passes the "holes" in the sparse array to
			//		the callback function with a value of undefined. JavaScript 1.6's forEach skips the holes in the sparse array.
			//		For more details, see:
			//		https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/forEach
			// example:
			//	| // log out all members of the array:
			//	| array.forEach(
			//	|		[ "thinger", "blah", "howdy", 10 ],
			//	|		function(item){
			//	|			console.log(item);
			//	|		}
			//	| );
			// example:
			//	| // log out the members and their indexes
			//	| array.forEach(
			//	|		[ "thinger", "blah", "howdy", 10 ],
			//	|		function(item, idx, arr){
			//	|			console.log(item, "at index:", idx);
			//	|		}
			//	| );
			// example:
			//	| // use a scoped object member as the callback
			//	|
			//	| var obj = {
			//	|		prefix: "logged via obj.callback:",
			//	|		callback: function(item){
			//	|			console.log(this.prefix, item);
			//	|		}
			//	| };
			//	|
			//	| // specifying the scope function executes the callback in that scope
			//	| array.forEach(
			//	|		[ "thinger", "blah", "howdy", 10 ],
			//	|		obj.callback,
			//	|		obj
			//	| );
			//	|
			//	| // alternately, we can accomplish the same thing with lang.hitch()
			//	| array.forEach(
			//	|		[ "thinger", "blah", "howdy", 10 ],
			//	|		lang.hitch(obj, "callback")
			//	| );
			// arr: Array|String
			// callback: Function|String
			// thisObject: Object?

			var i = 0, l = arr && arr.length || 0;
			if(l && typeof arr == "string") arr = arr.split("");
			if(typeof callback == "string") callback = cache[callback] || buildFn(callback);
			if(thisObject){
				for(; i < l; ++i){
					callback.call(thisObject, arr[i], i, arr);
				}
			}else{
				for(; i < l; ++i){
					callback(arr[i], i, arr);
				}
			}
		},

		map: function(arr, callback, thisObject, Ctr){
			// summary:
			//		applies callback to each element of arr and returns
			//		an Array with the results
			// arr: Array|String
			//		the array to iterate on. If a string, operates on
			//		individual characters.
			// callback: Function|String
			//		a function is invoked with three arguments, (item, index,
			//		array),	 and returns a value
			// thisObject: Object?
			//		may be used to scope the call to callback
			// returns: Array
			// description:
			//		This function corresponds to the JavaScript 1.6 Array.map() method, with one difference: when
			//		run over sparse arrays, this implementation passes the "holes" in the sparse array to
			//		the callback function with a value of undefined. JavaScript 1.6's map skips the holes in the sparse array.
			//		For more details, see:
			//		https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
			// example:
			//	| // returns [2, 3, 4, 5]
			//	| array.map([1, 2, 3, 4], function(item){ return item+1 });

			// TODO: why do we have a non-standard signature here? do we need "Ctr"?
			var i = 0, l = arr && arr.length || 0, out = new (Ctr || Array)(l);
			if(l && typeof arr == "string") arr = arr.split("");
			if(typeof callback == "string") callback = cache[callback] || buildFn(callback);
			if(thisObject){
				for(; i < l; ++i){
					out[i] = callback.call(thisObject, arr[i], i, arr);
				}
			}else{
				for(; i < l; ++i){
					out[i] = callback(arr[i], i, arr);
				}
			}
			return out; // Array
		},

		filter: function(arr, callback, thisObject){
			// summary:
			//		Returns a new Array with those items from arr that match the
			//		condition implemented by callback.
			// arr: Array
			//		the array to iterate over.
			// callback: Function|String
			//		a function that is invoked with three arguments (item,
			//		index, array). The return of this function is expected to
			//		be a boolean which determines whether the passed-in item
			//		will be included in the returned array.
			// thisObject: Object?
			//		may be used to scope the call to callback
			// returns: Array
			// description:
			//		This function corresponds to the JavaScript 1.6 Array.filter() method, with one difference: when
			//		run over sparse arrays, this implementation passes the "holes" in the sparse array to
			//		the callback function with a value of undefined. JavaScript 1.6's filter skips the holes in the sparse array.
			//		For more details, see:
			//		https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
			// example:
			//	| // returns [2, 3, 4]
			//	| array.filter([1, 2, 3, 4], function(item){ return item>1; });

			// TODO: do we need "Ctr" here like in map()?
			var i = 0, l = arr && arr.length || 0, out = [], value;
			if(l && typeof arr == "string") arr = arr.split("");
			if(typeof callback == "string") callback = cache[callback] || buildFn(callback);
			if(thisObject){
				for(; i < l; ++i){
					value = arr[i];
					if(callback.call(thisObject, value, i, arr)){
						out.push(value);
					}
				}
			}else{
				for(; i < l; ++i){
					value = arr[i];
					if(callback(value, i, arr)){
						out.push(value);
					}
				}
			}
			return out; // Array
		},

		clearCache: function(){
			cache = {};
		}
	};


	 1  && lang.mixin(dojo, array);

	return array;
});

},
'dojo/_base/window':function(){
define("dojo/_base/window", ["./kernel", "./lang", "../sniff"], function(dojo, lang, has){
// module:
//		dojo/_base/window

var ret = {
	// summary:
	//		API to save/set/restore the global/document scope.

	global: dojo.global,
	/*=====
	 global: {
		 // summary:
		 //		Alias for the current window. 'global' can be modified
		 //		for temporary context shifting. See also withGlobal().
		 // description:
		 //		Use this rather than referring to 'window' to ensure your code runs
		 //		correctly in managed contexts.
	 },
	 =====*/

	doc: this["document"] || null,
	/*=====
	doc: {
		// summary:
		//		Alias for the current document. 'doc' can be modified
		//		for temporary context shifting. See also withDoc().
		// description:
		//		Use this rather than referring to 'window.document' to ensure your code runs
		//		correctly in managed contexts.
		// example:
		//	|	n.appendChild(dojo.doc.createElement('div'));
	},
	=====*/

	body: function(/*Document?*/ doc){
		// summary:
		//		Return the body element of the specified document or of dojo/_base/window::doc.
		// example:
		//	|	win.body().appendChild(dojo.doc.createElement('div'));

		// Note: document.body is not defined for a strict xhtml document
		// Would like to memoize this, but dojo.doc can change vi dojo.withDoc().
		doc = doc || dojo.doc;
		return doc.body || doc.getElementsByTagName("body")[0]; // Node
	},

	setContext: function(/*Object*/ globalObject, /*DocumentElement*/ globalDocument){
		// summary:
		//		changes the behavior of many core Dojo functions that deal with
		//		namespace and DOM lookup, changing them to work in a new global
		//		context (e.g., an iframe). The varibles dojo.global and dojo.doc
		//		are modified as a result of calling this function and the result of
		//		`dojo.body()` likewise differs.
		dojo.global = ret.global = globalObject;
		dojo.doc = ret.doc = globalDocument;
	},

	withGlobal: function(	/*Object*/ globalObject,
							/*Function*/ callback,
							/*Object?*/ thisObject,
							/*Array?*/ cbArguments){
		// summary:
		//		Invoke callback with globalObject as dojo.global and
		//		globalObject.document as dojo.doc.
		// description:
		//		Invoke callback with globalObject as dojo.global and
		//		globalObject.document as dojo.doc. If provided, globalObject
		//		will be executed in the context of object thisObject
		//		When callback() returns or throws an error, the dojo.global
		//		and dojo.doc will be restored to its previous state.

		var oldGlob = dojo.global;
		try{
			dojo.global = ret.global = globalObject;
			return ret.withDoc.call(null, globalObject.document, callback, thisObject, cbArguments);
		}finally{
			dojo.global = ret.global = oldGlob;
		}
	},

	withDoc: function(	/*DocumentElement*/ documentObject,
						/*Function*/ callback,
						/*Object?*/ thisObject,
						/*Array?*/ cbArguments){
		// summary:
		//		Invoke callback with documentObject as dojo/_base/window::doc.
		// description:
		//		Invoke callback with documentObject as dojo/_base/window::doc. If provided,
		//		callback will be executed in the context of object thisObject
		//		When callback() returns or throws an error, the dojo/_base/window::doc will
		//		be restored to its previous state.

		var oldDoc = ret.doc,
			oldQ = has("quirks"),
			oldIE = has("ie"), isIE, mode, pwin;

		try{
			dojo.doc = ret.doc = documentObject;
			// update dojo.isQuirks and the value of the has feature "quirks".
			// remove setting dojo.isQuirks and dojo.isIE for 2.0
			dojo.isQuirks = has.add("quirks", dojo.doc.compatMode == "BackCompat", true, true); // no need to check for QuirksMode which was Opera 7 only

			if(has("ie")){
				if((pwin = documentObject.parentWindow) && pwin.navigator){
					// re-run IE detection logic and update dojo.isIE / has("ie")
					// (the only time parentWindow/navigator wouldn't exist is if we were not
					// passed an actual legitimate document object)
					isIE = parseFloat(pwin.navigator.appVersion.split("MSIE ")[1]) || undefined;
					mode = documentObject.documentMode;
					if(mode && mode != 5 && Math.floor(isIE) != mode){
						isIE = mode;
					}
					dojo.isIE = has.add("ie", isIE, true, true);
				}
			}

			if(thisObject && typeof callback == "string"){
				callback = thisObject[callback];
			}

			return callback.apply(thisObject, cbArguments || []);
		}finally{
			dojo.doc = ret.doc = oldDoc;
			dojo.isQuirks = has.add("quirks", oldQ, true, true);
			dojo.isIE = has.add("ie", oldIE, true, true);
		}
	}
};

 1  && lang.mixin(dojo, ret);

return ret;

});

},
'dojo/_base/config':function(){
define(["../has", "require"], function(has, require){
	// module:
	//		dojo/_base/config

/*=====
return {
	// summary:
	//		This module defines the user configuration during bootstrap.
	// description:
	//		By defining user configuration as a module value, an entire configuration can be specified in a build,
	//		thereby eliminating the need for sniffing and or explicitly setting in the global variable dojoConfig.
	//		Also, when multiple instances of dojo exist in a single application, each will necessarily be located
	//		at an unique absolute module identifier as given by the package configuration. Implementing configuration
	//		as a module allows for specifying unique, per-instance configurations.
	// example:
	//		Create a second instance of dojo with a different, instance-unique configuration (assume the loader and
	//		dojo.js are already loaded).
	//		|	// specify a configuration that creates a new instance of dojo at the absolute module identifier "myDojo"
	//		|	require({
	//		|		packages:[{
	//		|			name:"myDojo",
	//		|			location:".", //assume baseUrl points to dojo.js
	//		|		}]
	//		|	});
	//		|
	//		|	// specify a configuration for the myDojo instance
	//		|	define("myDojo/config", {
	//		|		// normal configuration variables go here, e.g.,
	//		|		locale:"fr-ca"
	//		|	});
	//		|
	//		|	// load and use the new instance of dojo
	//		|	require(["myDojo"], function(dojo){
	//		|		// dojo is the new instance of dojo
	//		|		// use as required
	//		|	});

	// isDebug: Boolean
	//		Defaults to `false`. If set to `true`, ensures that Dojo provides
	//		extended debugging feedback via Firebug. If Firebug is not available
	//		on your platform, setting `isDebug` to `true` will force Dojo to
	//		pull in (and display) the version of Firebug Lite which is
	//		integrated into the Dojo distribution, thereby always providing a
	//		debugging/logging console when `isDebug` is enabled. Note that
	//		Firebug's `console.*` methods are ALWAYS defined by Dojo. If
	//		`isDebug` is false and you are on a platform without Firebug, these
	//		methods will be defined as no-ops.
	isDebug: false,

	// locale: String
	//		The locale to assume for loading localized resources in this page,
	//		specified according to [RFC 3066](http://www.ietf.org/rfc/rfc3066.txt).
	//		Must be specified entirely in lowercase, e.g. `en-us` and `zh-cn`.
	//		See the documentation for `dojo.i18n` and `dojo.requireLocalization`
	//		for details on loading localized resources. If no locale is specified,
	//		Dojo assumes the locale of the user agent, according to `navigator.userLanguage`
	//		or `navigator.language` properties.
	locale: undefined,

	// extraLocale: Array
	//		No default value. Specifies additional locales whose
	//		resources should also be loaded alongside the default locale when
	//		calls to `dojo.requireLocalization()` are processed.
	extraLocale: undefined,

	// baseUrl: String
	//		The directory in which `dojo.js` is located. Under normal
	//		conditions, Dojo auto-detects the correct location from which it
	//		was loaded. You may need to manually configure `baseUrl` in cases
	//		where you have renamed `dojo.js` or in which `<base>` tags confuse
	//		some browsers (e.g. IE 6). The variable `dojo.baseUrl` is assigned
	//		either the value of `djConfig.baseUrl` if one is provided or the
	//		auto-detected root if not. Other modules are located relative to
	//		this path. The path should end in a slash.
	baseUrl: undefined,

	// modulePaths: [deprecated] Object
	//		A map of module names to paths relative to `dojo.baseUrl`. The
	//		key/value pairs correspond directly to the arguments which
	//		`dojo.registerModulePath` accepts. Specifying
	//		`djConfig.modulePaths = { "foo": "../../bar" }` is the equivalent
	//		of calling `dojo.registerModulePath("foo", "../../bar");`. Multiple
	//		modules may be configured via `djConfig.modulePaths`.
	modulePaths: {},

	// addOnLoad: Function|Array
	//		Adds a callback via dojo/ready. Useful when Dojo is added after
	//		the page loads and djConfig.afterOnLoad is true. Supports the same
	//		arguments as dojo/ready. When using a function reference, use
	//		`djConfig.addOnLoad = function(){};`. For object with function name use
	//		`djConfig.addOnLoad = [myObject, "functionName"];` and for object with
	//		function reference use
	//		`djConfig.addOnLoad = [myObject, function(){}];`
	addOnLoad: null,

	// parseOnLoad: Boolean
	//		Run the parser after the page is loaded
	parseOnLoad: false,

	// require: String[]
	//		An array of module names to be loaded immediately after dojo.js has been included
	//		in a page.
	require: [],

	// defaultDuration: Number
	//		Default duration, in milliseconds, for wipe and fade animations within dijits.
	//		Assigned to dijit.defaultDuration.
	defaultDuration: 200,

	// dojoBlankHtmlUrl: String
	//		Used by some modules to configure an empty iframe. Used by dojo/io/iframe and
	//		dojo/back, and dijit/popup support in IE where an iframe is needed to make sure native
	//		controls do not bleed through the popups. Normally this configuration variable
	//		does not need to be set, except when using cross-domain/CDN Dojo builds.
	//		Save dojo/resources/blank.html to your domain and set `djConfig.dojoBlankHtmlUrl`
	//		to the path on your domain your copy of blank.html.
	dojoBlankHtmlUrl: undefined,

	// ioPublish: Boolean?
	//		Set this to true to enable publishing of topics for the different phases of
	//		IO operations. Publishing is done via dojo/topic.publish(). See dojo/main.__IoPublish for a list
	//		of topics that are published.
	ioPublish: false,

	// useCustomLogger: Anything?
	//		If set to a value that evaluates to true such as a string or array and
	//		isDebug is true and Firebug is not available or running, then it bypasses
	//		the creation of Firebug Lite allowing you to define your own console object.
	useCustomLogger: undefined,

	// transparentColor: Array
	//		Array containing the r, g, b components used as transparent color in dojo.Color;
	//		if undefined, [255,255,255] (white) will be used.
	transparentColor: undefined,
	
	// deps: Function|Array
	//		Defines dependencies to be used before the loader has been loaded.
	//		When provided, they cause the loader to execute require(deps, callback) 
	//		once it has finished loading. Should be used with callback.
	deps: undefined,
	
	// callback: Function|Array
	//		Defines a callback to be used when dependencies are defined before 
	//		the loader has been loaded. When provided, they cause the loader to 
	//		execute require(deps, callback) once it has finished loading. 
	//		Should be used with deps.
	callback: undefined,
	
	// deferredInstrumentation: Boolean
	//		Whether deferred instrumentation should be loaded or included
	//		in builds.
	deferredInstrumentation: true,

	// useDeferredInstrumentation: Boolean|String
	//		Whether the deferred instrumentation should be used.
	//
	//		* `"report-rejections"`: report each rejection as it occurs.
	//		* `true` or `1` or `"report-unhandled-rejections"`: wait 1 second
	//			in an attempt to detect unhandled rejections.
	useDeferredInstrumentation: "report-unhandled-rejections"
};
=====*/

	var result = {};
	if( 1 ){
		// must be the dojo loader; take a shallow copy of require.rawConfig
		var src = require.rawConfig, p;
		for(p in src){
			result[p] = src[p];
		}
	}else{
		var adviseHas = function(featureSet, prefix, booting){
			for(p in featureSet){
				p!="has" && has.add(prefix + p, featureSet[p], 0, booting);
			}
		};
		result =  1  ?
			// must be a built version of the dojo loader; all config stuffed in require.rawConfig
			require.rawConfig :
			// a foreign loader
			this.dojoConfig || this.djConfig || {};
		adviseHas(result, "config", 1);
		adviseHas(result.has, "", 1);
	}
	return result;
});


},
'dojo/fx':function(){
define([
	"./_base/lang",
	"./Evented",
	"./_base/kernel",
	"./_base/array",
	"./_base/connect",
	"./_base/fx",
	"./dom",
	"./dom-style",
	"./dom-geometry",
	"./ready",
	"require" // for context sensitive loading of Toggler
], function(lang, Evented, dojo, arrayUtil, connect, baseFx, dom, domStyle, geom, ready, require){

	// module:
	//		dojo/fx
	
	// For back-compat, remove in 2.0.
	if(!dojo.isAsync){
		ready(0, function(){
			var requires = ["./fx/Toggler"];
			require(requires);	// use indirection so modules not rolled into a build
		});
	}

	var coreFx = dojo.fx = {
		// summary:
		//		Effects library on top of Base animations
	};

	var _baseObj = {
			_fire: function(evt, args){
				if(this[evt]){
					this[evt].apply(this, args||[]);
				}
				return this;
			}
		};

	var _chain = function(animations){
		this._index = -1;
		this._animations = animations||[];
		this._current = this._onAnimateCtx = this._onEndCtx = null;

		this.duration = 0;
		arrayUtil.forEach(this._animations, function(a){
			this.duration += a.duration;
			if(a.delay){ this.duration += a.delay; }
		}, this);
	};
	_chain.prototype = new Evented();
	lang.extend(_chain, {
		_onAnimate: function(){
			this._fire("onAnimate", arguments);
		},
		_onEnd: function(){
			connect.disconnect(this._onAnimateCtx);
			connect.disconnect(this._onEndCtx);
			this._onAnimateCtx = this._onEndCtx = null;
			if(this._index + 1 == this._animations.length){
				this._fire("onEnd");
			}else{
				// switch animations
				this._current = this._animations[++this._index];
				this._onAnimateCtx = connect.connect(this._current, "onAnimate", this, "_onAnimate");
				this._onEndCtx = connect.connect(this._current, "onEnd", this, "_onEnd");
				this._current.play(0, true);
			}
		},
		play: function(/*int?*/ delay, /*Boolean?*/ gotoStart){
			if(!this._current){ this._current = this._animations[this._index = 0]; }
			if(!gotoStart && this._current.status() == "playing"){ return this; }
			var beforeBegin = connect.connect(this._current, "beforeBegin", this, function(){
					this._fire("beforeBegin");
				}),
				onBegin = connect.connect(this._current, "onBegin", this, function(arg){
					this._fire("onBegin", arguments);
				}),
				onPlay = connect.connect(this._current, "onPlay", this, function(arg){
					this._fire("onPlay", arguments);
					connect.disconnect(beforeBegin);
					connect.disconnect(onBegin);
					connect.disconnect(onPlay);
				});
			if(this._onAnimateCtx){
				connect.disconnect(this._onAnimateCtx);
			}
			this._onAnimateCtx = connect.connect(this._current, "onAnimate", this, "_onAnimate");
			if(this._onEndCtx){
				connect.disconnect(this._onEndCtx);
			}
			this._onEndCtx = connect.connect(this._current, "onEnd", this, "_onEnd");
			this._current.play.apply(this._current, arguments);
			return this;
		},
		pause: function(){
			if(this._current){
				var e = connect.connect(this._current, "onPause", this, function(arg){
						this._fire("onPause", arguments);
						connect.disconnect(e);
					});
				this._current.pause();
			}
			return this;
		},
		gotoPercent: function(/*Decimal*/percent, /*Boolean?*/ andPlay){
			this.pause();
			var offset = this.duration * percent;
			this._current = null;
			arrayUtil.some(this._animations, function(a){
				if(a.duration <= offset){
					this._current = a;
					return true;
				}
				offset -= a.duration;
				return false;
			});
			if(this._current){
				this._current.gotoPercent(offset / this._current.duration, andPlay);
			}
			return this;
		},
		stop: function(/*boolean?*/ gotoEnd){
			if(this._current){
				if(gotoEnd){
					for(; this._index + 1 < this._animations.length; ++this._index){
						this._animations[this._index].stop(true);
					}
					this._current = this._animations[this._index];
				}
				var e = connect.connect(this._current, "onStop", this, function(arg){
						this._fire("onStop", arguments);
						connect.disconnect(e);
					});
				this._current.stop();
			}
			return this;
		},
		status: function(){
			return this._current ? this._current.status() : "stopped";
		},
		destroy: function(){
			if(this._onAnimateCtx){ connect.disconnect(this._onAnimateCtx); }
			if(this._onEndCtx){ connect.disconnect(this._onEndCtx); }
		}
	});
	lang.extend(_chain, _baseObj);

	coreFx.chain = function(/*dojo/_base/fx.Animation[]*/ animations){
		// summary:
		//		Chain a list of `dojo.Animation`s to run in sequence
		//
		// description:
		//		Return a `dojo.Animation` which will play all passed
		//		`dojo.Animation` instances in sequence, firing its own
		//		synthesized events simulating a single animation. (eg:
		//		onEnd of this animation means the end of the chain,
		//		not the individual animations within)
		//
		// example:
		//	Once `node` is faded out, fade in `otherNode`
		//	|	fx.chain([
		//	|		dojo.fadeIn({ node:node }),
		//	|		dojo.fadeOut({ node:otherNode })
		//	|	]).play();
		//
		return new _chain(animations); // dojo/_base/fx.Animation
	};

	var _combine = function(animations){
		this._animations = animations||[];
		this._connects = [];
		this._finished = 0;

		this.duration = 0;
		arrayUtil.forEach(animations, function(a){
			var duration = a.duration;
			if(a.delay){ duration += a.delay; }
			if(this.duration < duration){ this.duration = duration; }
			this._connects.push(connect.connect(a, "onEnd", this, "_onEnd"));
		}, this);

		this._pseudoAnimation = new baseFx.Animation({curve: [0, 1], duration: this.duration});
		var self = this;
		arrayUtil.forEach(["beforeBegin", "onBegin", "onPlay", "onAnimate", "onPause", "onStop", "onEnd"],
			function(evt){
				self._connects.push(connect.connect(self._pseudoAnimation, evt,
					function(){ self._fire(evt, arguments); }
				));
			}
		);
	};
	lang.extend(_combine, {
		_doAction: function(action, args){
			arrayUtil.forEach(this._animations, function(a){
				a[action].apply(a, args);
			});
			return this;
		},
		_onEnd: function(){
			if(++this._finished > this._animations.length){
				this._fire("onEnd");
			}
		},
		_call: function(action, args){
			var t = this._pseudoAnimation;
			t[action].apply(t, args);
		},
		play: function(/*int?*/ delay, /*Boolean?*/ gotoStart){
			this._finished = 0;
			this._doAction("play", arguments);
			this._call("play", arguments);
			return this;
		},
		pause: function(){
			this._doAction("pause", arguments);
			this._call("pause", arguments);
			return this;
		},
		gotoPercent: function(/*Decimal*/percent, /*Boolean?*/ andPlay){
			var ms = this.duration * percent;
			arrayUtil.forEach(this._animations, function(a){
				a.gotoPercent(a.duration < ms ? 1 : (ms / a.duration), andPlay);
			});
			this._call("gotoPercent", arguments);
			return this;
		},
		stop: function(/*boolean?*/ gotoEnd){
			this._doAction("stop", arguments);
			this._call("stop", arguments);
			return this;
		},
		status: function(){
			return this._pseudoAnimation.status();
		},
		destroy: function(){
			arrayUtil.forEach(this._connects, connect.disconnect);
		}
	});
	lang.extend(_combine, _baseObj);

	coreFx.combine = function(/*dojo/_base/fx.Animation[]*/ animations){
		// summary:
		//		Combine a list of `dojo.Animation`s to run in parallel
		//
		// description:
		//		Combine an array of `dojo.Animation`s to run in parallel,
		//		providing a new `dojo.Animation` instance encompasing each
		//		animation, firing standard animation events.
		//
		// example:
		//	Fade out `node` while fading in `otherNode` simultaneously
		//	|	fx.combine([
		//	|		dojo.fadeIn({ node:node }),
		//	|		dojo.fadeOut({ node:otherNode })
		//	|	]).play();
		//
		// example:
		//	When the longest animation ends, execute a function:
		//	|	var anim = fx.combine([
		//	|		dojo.fadeIn({ node: n, duration:700 }),
		//	|		dojo.fadeOut({ node: otherNode, duration: 300 })
		//	|	]);
		//	|	dojo.connect(anim, "onEnd", function(){
		//	|		// overall animation is done.
		//	|	});
		//	|	anim.play(); // play the animation
		//
		return new _combine(animations); // dojo/_base/fx.Animation
	};

	coreFx.wipeIn = function(/*Object*/ args){
		// summary:
		//		Expand a node to it's natural height.
		//
		// description:
		//		Returns an animation that will expand the
		//		node defined in 'args' object from it's current height to
		//		it's natural height (with no scrollbar).
		//		Node must have no margin/border/padding.
		//
		// args: Object
		//		A hash-map of standard `dojo.Animation` constructor properties
		//		(such as easing: node: duration: and so on)
		//
		// example:
		//	|	fx.wipeIn({
		//	|		node:"someId"
		//	|	}).play()
		var node = args.node = dom.byId(args.node), s = node.style, o;

		var anim = baseFx.animateProperty(lang.mixin({
			properties: {
				height: {
					// wrapped in functions so we wait till the last second to query (in case value has changed)
					start: function(){
						// start at current [computed] height, but use 1px rather than 0
						// because 0 causes IE to display the whole panel
						o = s.overflow;
						s.overflow = "hidden";
						if(s.visibility == "hidden" || s.display == "none"){
							s.height = "1px";
							s.display = "";
							s.visibility = "";
							return 1;
						}else{
							var height = domStyle.get(node, "height");
							return Math.max(height, 1);
						}
					},
					end: function(){
						return node.scrollHeight;
					}
				}
			}
		}, args));

		var fini = function(){
			s.height = "auto";
			s.overflow = o;
		};
		connect.connect(anim, "onStop", fini);
		connect.connect(anim, "onEnd", fini);

		return anim; // dojo/_base/fx.Animation
	};

	coreFx.wipeOut = function(/*Object*/ args){
		// summary:
		//		Shrink a node to nothing and hide it.
		//
		// description:
		//		Returns an animation that will shrink node defined in "args"
		//		from it's current height to 1px, and then hide it.
		//
		// args: Object
		//		A hash-map of standard `dojo.Animation` constructor properties
		//		(such as easing: node: duration: and so on)
		//
		// example:
		//	|	fx.wipeOut({ node:"someId" }).play()

		var node = args.node = dom.byId(args.node), s = node.style, o;

		var anim = baseFx.animateProperty(lang.mixin({
			properties: {
				height: {
					end: 1 // 0 causes IE to display the whole panel
				}
			}
		}, args));

		connect.connect(anim, "beforeBegin", function(){
			o = s.overflow;
			s.overflow = "hidden";
			s.display = "";
		});
		var fini = function(){
			s.overflow = o;
			s.height = "auto";
			s.display = "none";
		};
		connect.connect(anim, "onStop", fini);
		connect.connect(anim, "onEnd", fini);

		return anim; // dojo/_base/fx.Animation
	};

	coreFx.slideTo = function(/*Object*/ args){
		// summary:
		//		Slide a node to a new top/left position
		//
		// description:
		//		Returns an animation that will slide "node"
		//		defined in args Object from its current position to
		//		the position defined by (args.left, args.top).
		//
		// args: Object
		//		A hash-map of standard `dojo.Animation` constructor properties
		//		(such as easing: node: duration: and so on). Special args members
		//		are `top` and `left`, which indicate the new position to slide to.
		//
		// example:
		//	|	.slideTo({ node: node, left:"40", top:"50", units:"px" }).play()

		var node = args.node = dom.byId(args.node),
			top = null, left = null;

		var init = (function(n){
			return function(){
				var cs = domStyle.getComputedStyle(n);
				var pos = cs.position;
				top = (pos == 'absolute' ? n.offsetTop : parseInt(cs.top) || 0);
				left = (pos == 'absolute' ? n.offsetLeft : parseInt(cs.left) || 0);
				if(pos != 'absolute' && pos != 'relative'){
					var ret = geom.position(n, true);
					top = ret.y;
					left = ret.x;
					n.style.position="absolute";
					n.style.top=top+"px";
					n.style.left=left+"px";
				}
			};
		})(node);
		init();

		var anim = baseFx.animateProperty(lang.mixin({
			properties: {
				top: args.top || 0,
				left: args.left || 0
			}
		}, args));
		connect.connect(anim, "beforeBegin", anim, init);

		return anim; // dojo/_base/fx.Animation
	};

	return coreFx;
});

},
'dojo/_base/event':function(){
define("dojo/_base/event", ["./kernel", "../on", "../has", "../dom-geometry"], function(dojo, on, has, dom){
	// module:
	//		dojo/_base/event

	if(on._fixEvent){
		var fixEvent = on._fixEvent;
		on._fixEvent = function(evt, se){
			// add some additional normalization for back-compat, this isn't in on.js because it is somewhat more expensive
			evt = fixEvent(evt, se);
			if(evt){
				dom.normalizeEvent(evt);
			}
			return evt;
		};		
	}
	
	var ret = {
		// summary:
		//		This module defines dojo DOM event API.   Usually you should use dojo/on, and evt.stopPropagation() +
		//		evt.preventDefault(), rather than this module.

		fix: function(/*Event*/ evt, /*DOMNode*/ sender){
			// summary:
			//		normalizes properties on the event object including event
			//		bubbling methods, keystroke normalization, and x/y positions
			// evt: Event
			//		native event object
			// sender: DOMNode
			//		node to treat as "currentTarget"
			if(on._fixEvent){
				return on._fixEvent(evt, sender);
			}
			return evt;	// Event
		},
	
		stop: function(/*Event*/ evt){
			// summary:
			//		prevents propagation and clobbers the default action of the
			//		passed event
			// evt: Event
			//		The event object. If omitted, window.event is used on IE.
			if(has("dom-addeventlistener") || (evt && evt.preventDefault)){
				evt.preventDefault();
				evt.stopPropagation();
			}else{
				evt = evt || window.event;
				evt.cancelBubble = true;
				on._preventDefault.call(evt);
			}
		}
	};

	if( 1 ){
		dojo.fixEvent = ret.fix;
		dojo.stopEvent = ret.stop;
	}

	return ret;
});

},
'dojo/sniff':function(){
define(["./has"], function(has){
	// module:
	//		dojo/sniff

	/*=====
	return function(){
		// summary:
		//		This module sets has() flags based on the current browser.
		//		It returns the has() function.
	};
	=====*/

	if( 1 ){
		var n = navigator,
			dua = n.userAgent,
			dav = n.appVersion,
			tv = parseFloat(dav);

		has.add("air", dua.indexOf("AdobeAIR") >= 0),
		has.add("khtml", dav.indexOf("Konqueror") >= 0 ? tv : undefined);
		has.add("webkit", parseFloat(dua.split("WebKit/")[1]) || undefined);
		has.add("chrome", parseFloat(dua.split("Chrome/")[1]) || undefined);
		has.add("safari", dav.indexOf("Safari")>=0 && !has("chrome") ? parseFloat(dav.split("Version/")[1]) : undefined);
		has.add("mac", dav.indexOf("Macintosh") >= 0);
		has.add("quirks", document.compatMode == "BackCompat");
		has.add("ios", /iPhone|iPod|iPad/.test(dua));
		has.add("android", parseFloat(dua.split("Android ")[1]) || undefined);

		if(!has("webkit")){
			// Opera
			if(dua.indexOf("Opera") >= 0){
				// see http://dev.opera.com/articles/view/opera-ua-string-changes and http://www.useragentstring.com/pages/Opera/
				// 9.8 has both styles; <9.8, 9.9 only old style
				has.add("opera", tv >= 9.8 ? parseFloat(dua.split("Version/")[1]) || tv : tv);
			}

			// Mozilla and firefox
			if(dua.indexOf("Gecko") >= 0 && !has("khtml") && !has("webkit")){
				has.add("mozilla", tv);
			}
			if(has("mozilla")){
				//We really need to get away from this. Consider a sane isGecko approach for the future.
				has.add("ff", parseFloat(dua.split("Firefox/")[1] || dua.split("Minefield/")[1]) || undefined);
			}

			// IE
			if(document.all && !has("opera")){
				var isIE = parseFloat(dav.split("MSIE ")[1]) || undefined;

				//In cases where the page has an HTTP header or META tag with
				//X-UA-Compatible, then it is in emulation mode.
				//Make sure isIE reflects the desired version.
				//document.documentMode of 5 means quirks mode.
				//Only switch the value if documentMode's major version
				//is different from isIE's major version.
				var mode = document.documentMode;
				if(mode && mode != 5 && Math.floor(isIE) != mode){
					isIE = mode;
				}

				has.add("ie", isIE);
			}

			// Wii
			has.add("wii", typeof opera != "undefined" && opera.wiiremote);
		}
	}

	return has;
});

},
'dojo/request/handlers':function(){
define([
	'../json',
	'../_base/kernel',
	'../_base/array',
	'../has'
], function(JSON, kernel, array, has){
	has.add('activex', typeof ActiveXObject !== 'undefined');

	var handleXML;
	if(has('activex')){
		// GUIDs obtained from http://msdn.microsoft.com/en-us/library/ms757837(VS.85).aspx
		var dp = [
			'Msxml2.DOMDocument.6.0',
			'Msxml2.DOMDocument.4.0',
			'MSXML2.DOMDocument.3.0',
			'MSXML.DOMDocument' // 2.0
		];

		handleXML = function(response){
			var result = response.data;

			if(!result || !result.documentElement){
				var text = response.text;
				array.some(dp, function(p){
					try{
						var dom = new ActiveXObject(p);
						dom.async = false;
						dom.loadXML(text);
						result = dom;
					}catch(e){ return false; }
					return true;
				});
			}

			return result;
		};
	}

	var handlers = {
		'javascript': function(response){
			return kernel.eval(response.text || '');
		},
		'json': function(response){
			return JSON.parse(response.text || null);
		},
		'xml': handleXML
	};

	function handle(response){
		var handler = handlers[response.options.handleAs];

		response.data = handler ? handler(response) : (response.data || response.text);

		return response;
	}

	handle.register = function(name, handler){
		handlers[name] = handler;
	};

	return handle;
});

},
'dojo/aspect':function(){
define("dojo/aspect", [], function(){

	// module:
	//		dojo/aspect

	"use strict";
	var undefined, nextId = 0;
	function advise(dispatcher, type, advice, receiveArguments){
		var previous = dispatcher[type];
		var around = type == "around";
		var signal;
		if(around){
			var advised = advice(function(){
				return previous.advice(this, arguments);
			});
			signal = {
				remove: function(){
					signal.cancelled = true;
				},
				advice: function(target, args){
					return signal.cancelled ?
						previous.advice(target, args) : // cancelled, skip to next one
						advised.apply(target, args);	// called the advised function
				}
			};
		}else{
			// create the remove handler
			signal = {
				remove: function(){
					var previous = signal.previous;
					var next = signal.next;
					if(!next && !previous){
						delete dispatcher[type];
					}else{
						if(previous){
							previous.next = next;
						}else{
							dispatcher[type] = next;
						}
						if(next){
							next.previous = previous;
						}
					}
				},
				id: nextId++,
				advice: advice,
				receiveArguments: receiveArguments
			};
		}
		if(previous && !around){
			if(type == "after"){
				// add the listener to the end of the list
				// note that we had to change this loop a little bit to workaround a bizarre IE10 JIT bug 
				while(previous.next && (previous = previous.next)){}
				previous.next = signal;
				signal.previous = previous;
			}else if(type == "before"){
				// add to beginning
				dispatcher[type] = signal;
				signal.next = previous;
				previous.previous = signal;
			}
		}else{
			// around or first one just replaces
			dispatcher[type] = signal;
		}
		return signal;
	}
	function aspect(type){
		return function(target, methodName, advice, receiveArguments){
			var existing = target[methodName], dispatcher;
			if(!existing || existing.target != target){
				// no dispatcher in place
				target[methodName] = dispatcher = function(){
					var executionId = nextId;
					// before advice
					var args = arguments;
					var before = dispatcher.before;
					while(before){
						args = before.advice.apply(this, args) || args;
						before = before.next;
					}
					// around advice
					if(dispatcher.around){
						var results = dispatcher.around.advice(this, args);
					}
					// after advice
					var after = dispatcher.after;
					while(after && after.id < executionId){
						if(after.receiveArguments){
							var newResults = after.advice.apply(this, args);
							// change the return value only if a new value was returned
							results = newResults === undefined ? results : newResults;
						}else{
							results = after.advice.call(this, results, args);
						}
						after = after.next;
					}
					return results;
				};
				if(existing){
					dispatcher.around = {advice: function(target, args){
						return existing.apply(target, args);
					}};
				}
				dispatcher.target = target;
			}
			var results = advise((dispatcher || existing), type, advice, receiveArguments);
			advice = null;
			return results;
		};
	}

	// TODOC: after/before/around return object

	var after = aspect("after");
	/*=====
	after = function(target, methodName, advice, receiveArguments){
		// summary:
		//		The "after" export of the aspect module is a function that can be used to attach
		//		"after" advice to a method. This function will be executed after the original method
		//		is executed. By default the function will be called with a single argument, the return
		//		value of the original method, or the the return value of the last executed advice (if a previous one exists).
		//		The fourth (optional) argument can be set to true to so the function receives the original
		//		arguments (from when the original method was called) rather than the return value.
		//		If there are multiple "after" advisors, they are executed in the order they were registered.
		// target: Object
		//		This is the target object
		// methodName: String
		//		This is the name of the method to attach to.
		// advice: Function
		//		This is function to be called after the original method
		// receiveArguments: Boolean?
		//		If this is set to true, the advice function receives the original arguments (from when the original mehtod
		//		was called) rather than the return value of the original/previous method.
		// returns:
		//		A signal object that can be used to cancel the advice. If remove() is called on this signal object, it will
		//		stop the advice function from being executed.
	};
	=====*/

	var before = aspect("before");
	/*=====
	before = function(target, methodName, advice){
		// summary:
		//		The "before" export of the aspect module is a function that can be used to attach
		//		"before" advice to a method. This function will be executed before the original method
		//		is executed. This function will be called with the arguments used to call the method.
		//		This function may optionally return an array as the new arguments to use to call
		//		the original method (or the previous, next-to-execute before advice, if one exists).
		//		If the before method doesn't return anything (returns undefined) the original arguments
		//		will be preserved.
		//		If there are multiple "before" advisors, they are executed in the reverse order they were registered.
		// target: Object
		//		This is the target object
		// methodName: String
		//		This is the name of the method to attach to.
		// advice: Function
		//		This is function to be called before the original method
	};
	=====*/

	var around = aspect("around");
	/*=====
	 around = function(target, methodName, advice){
		// summary:
		//		The "around" export of the aspect module is a function that can be used to attach
		//		"around" advice to a method. The advisor function is immediately executed when
		//		the around() is called, is passed a single argument that is a function that can be
		//		called to continue execution of the original method (or the next around advisor).
		//		The advisor function should return a function, and this function will be called whenever
		//		the method is called. It will be called with the arguments used to call the method.
		//		Whatever this function returns will be returned as the result of the method call (unless after advise changes it).
		// example:
		//		If there are multiple "around" advisors, the most recent one is executed first,
		//		which can then delegate to the next one and so on. For example:
		//		|	around(obj, "foo", function(originalFoo){
		//		|		return function(){
		//		|			var start = new Date().getTime();
		//		|			var results = originalFoo.apply(this, arguments); // call the original
		//		|			var end = new Date().getTime();
		//		|			console.log("foo execution took " + (end - start) + " ms");
		//		|			return results;
		//		|		};
		//		|	});
		// target: Object
		//		This is the target object
		// methodName: String
		//		This is the name of the method to attach to.
		// advice: Function
		//		This is function to be called around the original method
	};
	=====*/

	return {
		// summary:
		//		provides aspect oriented programming functionality, allowing for
		//		one to add before, around, or after advice on existing methods.
		// example:
		//	|	define(["dojo/aspect"], function(aspect){
		//	|		var signal = aspect.after(targetObject, "methodName", function(someArgument){
		//	|			this will be called when targetObject.methodName() is called, after the original function is called
		//	|		});
		//
		// example:
		//	The returned signal object can be used to cancel the advice.
		//	|	signal.remove(); // this will stop the advice from being executed anymore
		//	|	aspect.before(targetObject, "methodName", function(someArgument){
		//	|		// this will be called when targetObject.methodName() is called, before the original function is called
		//	|	 });

		before: before,
		around: around,
		after: after
	};
});

},
'dojo/_base/connect':function(){
define(["./kernel", "../on", "../topic", "../aspect", "./event", "../mouse", "./sniff", "./lang", "../keys"], function(dojo, on, hub, aspect, eventModule, mouse, has, lang){
// module:
//		dojo/_base/connect

has.add("events-keypress-typed", function(){ // keypresses should only occur a printable character is hit
	var testKeyEvent = {charCode: 0};
	try{
		testKeyEvent = document.createEvent("KeyboardEvent");
		(testKeyEvent.initKeyboardEvent || testKeyEvent.initKeyEvent).call(testKeyEvent, "keypress", true, true, null, false, false, false, false, 9, 3);
	}catch(e){}
	return testKeyEvent.charCode == 0 && !has("opera");
});

function connect_(obj, event, context, method, dontFix){
	method = lang.hitch(context, method);
	if(!obj || !(obj.addEventListener || obj.attachEvent)){
		// it is a not a DOM node and we are using the dojo.connect style of treating a
		// method like an event, must go right to aspect
		return aspect.after(obj || dojo.global, event, method, true);
	}
	if(typeof event == "string" && event.substring(0, 2) == "on"){
		event = event.substring(2);
	}
	if(!obj){
		obj = dojo.global;
	}
	if(!dontFix){
		switch(event){
			// dojo.connect has special handling for these event types
			case "keypress":
				event = keypress;
				break;
			case "mouseenter":
				event = mouse.enter;
				break;
			case "mouseleave":
				event = mouse.leave;
				break;
		}
	}
	return on(obj, event, method, dontFix);
}

var _punctMap = {
	106:42,
	111:47,
	186:59,
	187:43,
	188:44,
	189:45,
	190:46,
	191:47,
	192:96,
	219:91,
	220:92,
	221:93,
	222:39,
	229:113
};
var evtCopyKey = has("mac") ? "metaKey" : "ctrlKey";


var _synthesizeEvent = function(evt, props){
	var faux = lang.mixin({}, evt, props);
	setKeyChar(faux);
	// FIXME: would prefer to use lang.hitch: lang.hitch(evt, evt.preventDefault);
	// but it throws an error when preventDefault is invoked on Safari
	// does Event.preventDefault not support "apply" on Safari?
	faux.preventDefault = function(){ evt.preventDefault(); };
	faux.stopPropagation = function(){ evt.stopPropagation(); };
	return faux;
};
function setKeyChar(evt){
	evt.keyChar = evt.charCode ? String.fromCharCode(evt.charCode) : '';
	evt.charOrCode = evt.keyChar || evt.keyCode;
}
var keypress;
if(has("events-keypress-typed")){
	// this emulates Firefox's keypress behavior where every keydown can correspond to a keypress
	var _trySetKeyCode = function(e, code){
		try{
			// squelch errors when keyCode is read-only
			// (e.g. if keyCode is ctrl or shift)
			return (e.keyCode = code);
		}catch(e){
			return 0;
		}
	};
	keypress = function(object, listener){
		var keydownSignal = on(object, "keydown", function(evt){
			// munge key/charCode
			var k=evt.keyCode;
			// These are Windows Virtual Key Codes
			// http://msdn.microsoft.com/library/default.asp?url=/library/en-us/winui/WinUI/WindowsUserInterface/UserInput/VirtualKeyCodes.asp
			var unprintable = (k!=13) && k!=32 && (k!=27||!has("ie")) && (k<48||k>90) && (k<96||k>111) && (k<186||k>192) && (k<219||k>222) && k!=229;
			// synthesize keypress for most unprintables and CTRL-keys
			if(unprintable||evt.ctrlKey){
				var c = unprintable ? 0 : k;
				if(evt.ctrlKey){
					if(k==3 || k==13){
						return listener.call(evt.currentTarget, evt); // IE will post CTRL-BREAK, CTRL-ENTER as keypress natively
					}else if(c>95 && c<106){
						c -= 48; // map CTRL-[numpad 0-9] to ASCII
					}else if((!evt.shiftKey)&&(c>=65&&c<=90)){
						c += 32; // map CTRL-[A-Z] to lowercase
					}else{
						c = _punctMap[c] || c; // map other problematic CTRL combinations to ASCII
					}
				}
				// simulate a keypress event
				var faux = _synthesizeEvent(evt, {type: 'keypress', faux: true, charCode: c});
				listener.call(evt.currentTarget, faux);
				if(has("ie")){
					_trySetKeyCode(evt, faux.keyCode);
				}
			}
		});
		var keypressSignal = on(object, "keypress", function(evt){
			var c = evt.charCode;
			c = c>=32 ? c : 0;
			evt = _synthesizeEvent(evt, {charCode: c, faux: true});
			return listener.call(this, evt);
		});
		return {
			remove: function(){
				keydownSignal.remove();
				keypressSignal.remove();
			}
		};
	};
}else{
	if(has("opera")){
		keypress = function(object, listener){
			return on(object, "keypress", function(evt){
				var c = evt.which;
				if(c==3){
					c=99; // Mozilla maps CTRL-BREAK to CTRL-c
				}
				// can't trap some keys at all, like INSERT and DELETE
				// there is no differentiating info between DELETE and ".", or INSERT and "-"
				c = c<32 && !evt.shiftKey ? 0 : c;
				if(evt.ctrlKey && !evt.shiftKey && c>=65 && c<=90){
					// lowercase CTRL-[A-Z] keys
					c += 32;
				}
				return listener.call(this, _synthesizeEvent(evt, { charCode: c }));
			});
		};
	}else{
		keypress = function(object, listener){
			return on(object, "keypress", function(evt){
				setKeyChar(evt);
				return listener.call(this, evt);
			});
		};
	}
}

var connect = {
	// summary:
	//		This module defines the dojo.connect API.
	//		This modules also provides keyboard event handling helpers.
	//		This module exports an extension event for emulating Firefox's keypress handling.
	//		However, this extension event exists primarily for backwards compatibility and
	//		is not recommended. WebKit and IE uses an alternate keypress handling (only
	//		firing for printable characters, to distinguish from keydown events), and most
	//		consider the WebKit/IE behavior more desirable.

	_keypress:keypress,

	connect:function(obj, event, context, method, dontFix){
		// summary:
		//		`dojo.connect` is a deprecated event handling and delegation method in
		//		Dojo. It allows one function to "listen in" on the execution of
		//		any other, triggering the second whenever the first is called. Many
		//		listeners may be attached to a function, and source functions may
		//		be either regular function calls or DOM events.
		//
		// description:
		//		Connects listeners to actions, so that after event fires, a
		//		listener is called with the same arguments passed to the original
		//		function.
		//
		//		Since `dojo.connect` allows the source of events to be either a
		//		"regular" JavaScript function or a DOM event, it provides a uniform
		//		interface for listening to all the types of events that an
		//		application is likely to deal with though a single, unified
		//		interface. DOM programmers may want to think of it as
		//		"addEventListener for everything and anything".
		//
		//		When setting up a connection, the `event` parameter must be a
		//		string that is the name of the method/event to be listened for. If
		//		`obj` is null, `kernel.global` is assumed, meaning that connections
		//		to global methods are supported but also that you may inadvertently
		//		connect to a global by passing an incorrect object name or invalid
		//		reference.
		//
		//		`dojo.connect` generally is forgiving. If you pass the name of a
		//		function or method that does not yet exist on `obj`, connect will
		//		not fail, but will instead set up a stub method. Similarly, null
		//		arguments may simply be omitted such that fewer than 4 arguments
		//		may be required to set up a connection See the examples for details.
		//
		//		The return value is a handle that is needed to
		//		remove this connection with `dojo.disconnect`.
		//
		// obj: Object?
		//		The source object for the event function.
		//		Defaults to `kernel.global` if null.
		//		If obj is a DOM node, the connection is delegated
		//		to the DOM event manager (unless dontFix is true).
		//
		// event: String
		//		String name of the event function in obj.
		//		I.e. identifies a property `obj[event]`.
		//
		// context: Object|null
		//		The object that method will receive as "this".
		//
		//		If context is null and method is a function, then method
		//		inherits the context of event.
		//
		//		If method is a string then context must be the source
		//		object object for method (context[method]). If context is null,
		//		kernel.global is used.
		//
		// method: String|Function
		//		A function reference, or name of a function in context.
		//		The function identified by method fires after event does.
		//		method receives the same arguments as the event.
		//		See context argument comments for information on method's scope.
		//
		// dontFix: Boolean?
		//		If obj is a DOM node, set dontFix to true to prevent delegation
		//		of this connection to the DOM event manager.
		//
		// example:
		//		When obj.onchange(), do ui.update():
		//	|	dojo.connect(obj, "onchange", ui, "update");
		//	|	dojo.connect(obj, "onchange", ui, ui.update); // same
		//
		// example:
		//		Using return value for disconnect:
		//	|	var link = dojo.connect(obj, "onchange", ui, "update");
		//	|	...
		//	|	dojo.disconnect(link);
		//
		// example:
		//		When onglobalevent executes, watcher.handler is invoked:
		//	|	dojo.connect(null, "onglobalevent", watcher, "handler");
		//
		// example:
		//		When ob.onCustomEvent executes, customEventHandler is invoked:
		//	|	dojo.connect(ob, "onCustomEvent", null, "customEventHandler");
		//	|	dojo.connect(ob, "onCustomEvent", "customEventHandler"); // same
		//
		// example:
		//		When ob.onCustomEvent executes, customEventHandler is invoked
		//		with the same scope (this):
		//	|	dojo.connect(ob, "onCustomEvent", null, customEventHandler);
		//	|	dojo.connect(ob, "onCustomEvent", customEventHandler); // same
		//
		// example:
		//		When globalEvent executes, globalHandler is invoked
		//		with the same scope (this):
		//	|	dojo.connect(null, "globalEvent", null, globalHandler);
		//	|	dojo.connect("globalEvent", globalHandler); // same

		// normalize arguments
		var a=arguments, args=[], i=0;
		// if a[0] is a String, obj was omitted
		args.push(typeof a[0] == "string" ? null : a[i++], a[i++]);
		// if the arg-after-next is a String or Function, context was NOT omitted
		var a1 = a[i+1];
		args.push(typeof a1 == "string" || typeof a1 == "function" ? a[i++] : null, a[i++]);
		// absorb any additional arguments
		for(var l=a.length; i<l; i++){	args.push(a[i]); }
		return connect_.apply(this, args);
	},

	disconnect:function(handle){
		// summary:
		//		Remove a link created by dojo.connect.
		// description:
		//		Removes the connection between event and the method referenced by handle.
		// handle: Handle
		//		the return value of the dojo.connect call that created the connection.

		if(handle){
			handle.remove();
		}
	},

	subscribe:function(topic, context, method){
		// summary:
		//		Attach a listener to a named topic. The listener function is invoked whenever the
		//		named topic is published (see: dojo.publish).
		//		Returns a handle which is needed to unsubscribe this listener.
		// topic: String
		//		The topic to which to subscribe.
		// context: Object?
		//		Scope in which method will be invoked, or null for default scope.
		// method: String|Function
		//		The name of a function in context, or a function reference. This is the function that
		//		is invoked when topic is published.
		// example:
		//	|	dojo.subscribe("alerts", null, function(caption, message){ alert(caption + "\n" + message); });
		//	|	dojo.publish("alerts", [ "read this", "hello world" ]);
		return hub.subscribe(topic, lang.hitch(context, method));
	},

	publish:function(topic, args){
		// summary:
		//		Invoke all listener method subscribed to topic.
		// topic: String
		//		The name of the topic to publish.
		// args: Array?
		//		An array of arguments. The arguments will be applied
		//		to each topic subscriber (as first class parameters, via apply).
		// example:
		//	|	dojo.subscribe("alerts", null, function(caption, message){ alert(caption + "\n" + message); };
		//	|	dojo.publish("alerts", [ "read this", "hello world" ]);
		return hub.publish.apply(hub, [topic].concat(args));
	},

	connectPublisher:function(topic, obj, event){
		// summary:
		//		Ensure that every time obj.event() is called, a message is published
		//		on the topic. Returns a handle which can be passed to
		//		dojo.disconnect() to disable subsequent automatic publication on
		//		the topic.
		// topic: String
		//		The name of the topic to publish.
		// obj: Object?
		//		The source object for the event function. Defaults to kernel.global
		//		if null.
		// event: String
		//		The name of the event function in obj.
		//		I.e. identifies a property obj[event].
		// example:
		//	|	dojo.connectPublisher("/ajax/start", dojo, "xhrGet");
		var pf = function(){ connect.publish(topic, arguments); };
		return event ? connect.connect(obj, event, pf) : connect.connect(obj, pf); //Handle
	},

	isCopyKey: function(e){
		// summary:
		//		Checks an event for the copy key (meta on Mac, and ctrl anywhere else)
		// e: Event
		//		Event object to examine
		return e[evtCopyKey];	// Boolean
	}
};

connect.unsubscribe = connect.disconnect;
/*=====
 connect.unsubscribe = function(handle){
	 // summary:
	 //		Remove a topic listener.
	 // handle: Handle
	 //		The handle returned from a call to subscribe.
	 // example:
	 //	|	var alerter = dojo.subscribe("alerts", null, function(caption, message){ alert(caption + "\n" + message); };
	 //	|	...
	 //	|	dojo.unsubscribe(alerter);
 };
 =====*/

 1  && lang.mixin(dojo, connect);
return connect;

});



},
'dojo/ready':function(){
define("dojo/ready", ["./_base/kernel", "./has", "require", "./domReady", "./_base/lang"], function(dojo, has, require, domReady, lang){
	// module:
	//		dojo/ready
	// note:
	//		This module should be unnecessary in dojo 2.0

	var
		// truthy if DOMContentLoaded or better (e.g., window.onload fired) has been achieved
		isDomReady = 0,

		// a function to call to cause onLoad to be called when all requested modules have been loaded
		requestCompleteSignal,

		// The queue of functions waiting to execute as soon as dojo.ready conditions satisfied
		loadQ = [],

		// prevent recursion in onLoad
		onLoadRecursiveGuard = 0,

		handleDomReady = function(){
			isDomReady = 1;
			dojo._postLoad = dojo.config.afterOnLoad = true;
			if(loadQ.length){
				requestCompleteSignal(onLoad);
			}
		},

		// run the next function queued with dojo.ready
		onLoad = function(){
			if(isDomReady && !onLoadRecursiveGuard && loadQ.length){
				//guard against recursions into this function
				onLoadRecursiveGuard = 1;
				var f = loadQ.shift();
					try{
						f();
					}
						// FIXME: signal the error via require.on
					finally{
						onLoadRecursiveGuard = 0;
					}
				onLoadRecursiveGuard = 0;
				if(loadQ.length){
					requestCompleteSignal(onLoad);
				}
			}
		};

	require.on("idle", onLoad);
	requestCompleteSignal = function(){
		if(require.idle()){
			onLoad();
		} // else do nothing, onLoad will be called with the next idle signal
	};

	var ready = dojo.ready = dojo.addOnLoad = function(priority, context, callback){
		// summary:
		//		Add a function to execute on DOM content loaded and all requested modules have arrived and been evaluated.
		//		In most cases, the `domReady` plug-in should suffice and this method should not be needed.
		// priority: Integer?
		//		The order in which to exec this callback relative to other callbacks, defaults to 1000
		// context: Object?|Function
		//		The context in which to run execute callback, or a callback if not using context
		// callback: Function?
		//		The function to execute.
		//
		// example:
		//	Simple DOM and Modules ready syntax
		//	|	require(["dojo/ready"], function(ready){
		//	|		ready(function(){ alert("Dom ready!"); });
		//	|	});
		//
		// example:
		//	Using a priority
		//	|	require(["dojo/ready"], function(ready){
		//	|		ready(2, function(){ alert("low priority ready!"); })
		//	|	});
		//
		// example:
		//	Using context
		//	|	require(["dojo/ready"], function(ready){
		//	|		ready(foo, function(){
		//	|			// in here, this == foo
		//	|		});
		//	|	});
		//
		// example:
		//	Using dojo/hitch style args:
		//	|	require(["dojo/ready"], function(ready){
		//	|		var foo = { dojoReady: function(){ console.warn(this, "dojo dom and modules ready."); } };
		//	|		ready(foo, "dojoReady");
		//	|	});

		var hitchArgs = lang._toArray(arguments);
		if(typeof priority != "number"){
			callback = context;
			context = priority;
			priority = 1000;
		}else{
			hitchArgs.shift();
		}
		callback = callback ?
			lang.hitch.apply(dojo, hitchArgs) :
			function(){
				context();
			};
		callback.priority = priority;
		for(var i = 0; i < loadQ.length && priority >= loadQ[i].priority; i++){}
		loadQ.splice(i, 0, callback);
		requestCompleteSignal();
	};

	 1 || has.add("dojo-config-addOnLoad", 1);
	if( 1 ){
		var dca = dojo.config.addOnLoad;
		if(dca){
			ready[(lang.isArray(dca) ? "apply" : "call")](dojo, dca);
		}
	}

	if( 0  && dojo.config.parseOnLoad && !dojo.isAsync){
		ready(99, function(){
			if(!dojo.parser){
				dojo.deprecated("Add explicit require(['dojo/parser']);", "", "2.0");
				require(["dojo/parser"]);
			}
		});
	}

	if( 1 ){
		domReady(handleDomReady);
	}else{
		handleDomReady();
	}

	return ready;
});

},
'dojo/errors/CancelError':function(){
define(["./create"], function(create){
	// module:
	//		dojo/errors/CancelError

	/*=====
	return function(){
		// summary:
		//		Default error if a promise is canceled without a reason.
	};
	=====*/

	return create("CancelError", null, null, { dojoType: "cancel" });
});

}}});
(function(){
	// must use this.require to make this work in node.js
	var require = this.require;
	// consume the cached dojo layer
	require({cache:{}});
	!require.async && require(["dojo"]);
	require.boot && require.apply(null, require.boot);
})();
