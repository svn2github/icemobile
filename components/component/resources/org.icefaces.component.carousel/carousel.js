/*
 * Copyright 2004-2011 ICEsoft Technologies Canada Corp. (c)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions an
 * limitations under the License.
 */

if (!window['mobi']) {
    window.mobi = {};
}
mobi.carousel = {
	  carousels: null,
	  loaded: function(clientId){
	            ice.log.debug(ice.log, 'clientId is '+clientId);
	            //carousel iscroll loading
	            ice.log.debug(ice.log, 'in the carouselLoaded method');
	            setTimeout(function () {
    	            ice.log.debug(ice.log, "in setTimeout function");
	                if (this.carousels) {
	                    ice.log.debug(ice.log, 'onload destroy carousel');
	                    this.carousels.destroy();
	                }
	                else {
	                    ice.log.debug(ice.log, 'onload create carousel');
	                    this.carousels = new iScroll(clientId, {
	                    snap: 'li',
	                    momentum: false,
	                    hScrollbar: false,
	                    onScrollEnd: function () {
	                        document.querySelector('.mobi-carousel-cursor-list > li.active').className = '';
	                        document.querySelector('.mobi-carousel-cursor-list > li:nth-child(' + (this.currPageX + 1) + ')').className = 'active';
                            ice.log.debug(ice.log, 'onScrollEnd and current page is='+this.currPageX);
    	                }
	                 });
	                }
	              }, 100);
	               ice.log.debug(ice.log,"after setTimeout function");
	   },
	   unloaded: function(clientId){
	       ice.log.debug(ice.log, 'unload handler carousel');
	       if (this.carousels!=null){
	           this.carousels.destroy();
	           this.carousels = null;
	       }
	   }   
}

