/*
 * Copyright 2004-2012 ICEsoft Technologies Canada Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS
 * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */


if (!window['ice']) {
    window.ice = {};
}

ice.registerAuxUpload = function (sessionid, uploadURL) {
    var auxiframe = document.getElementById('auxiframe');
    if (null == auxiframe) {
        auxiframe = document.createElement('iframe');
        auxiframe.setAttribute("id", "auxiframe");
        auxiframe.setAttribute("style", "width:0px; height:0px; border: 0px");
        auxiframe.setAttribute("src",
                "icemobile://c=register&r=" +
                        escape(window.location) + "&JSESSIONID=" + sessionid +
                        "&u=" + escape(uploadURL)
        );
        document.body.appendChild(auxiframe);
    }
};

ice.mobiserial = function(formId, typed) {
    var form = document.getElementById(formId);
    var els = form.elements;
    var len = els.length;
    var qString = [];
    var addField = function(name, value) {
        var tmpStr = "";
        if (qString.length > 0) {
            tmpStr = "&";
        }
        tmpStr += encodeURIComponent(name) + "=" + encodeURIComponent(value);
        qString.push(tmpStr);
    };
    for (var i = 0; i < len; i++) {
        var el = els[i];
        if (!el.disabled) {
            var prefix = "";
            if (typed) {
                var vtype = el.getAttribute("data-type");
                if (vtype) {
                    prefix = vtype + "-";
                } else {
                    prefix = el.type + "-";
                }
            }
            switch (el.type) {
                case 'submit':
                case 'button':
                    break;
                case 'text':
                case 'password':
                case 'hidden':
                case 'textarea':
                    addField(prefix + el.name, el.value);
                    break;
                case 'select-one':
                    if (el.selectedIndex >= 0) {
                        addField(prefix + el.name, el.options[el.selectedIndex].value);
                    }
                    break;
                case 'select-multiple':
                    for (var j = 0; j < el.options.length; j++) {
                        if (el.options[j].selected) {
                            addField(prefix + el.name, el.options[j].value);
                        }
                    }
                    break;
                case 'checkbox':
                case 'radio':
                    if (el.checked) {
                        addField(prefix + el.name, el.value);
                    }
                    break;
                default:
                    addField(prefix + el.name, el.value);
            }
        }
    }
    // concatenate the array
    return qString.join("");
}

ice.mobilesx = function (element) {
    var ampchar = String.fromCharCode(38);
    var form = ice.formOf(element);
    var formID = form.getAttribute('id');
    var formAction = form.getAttribute("action");
    var command = element.getAttribute("data-command");
    var id = element.getAttribute("data-id");
    var params = element.getAttribute("data-params");
    var windowLocation = window.location;
    var barURL = windowLocation.toString();
    var baseURL = barURL.substring(0,
            barURL.lastIndexOf("/")) + "/";

    var uploadURL;
    if (0 === formAction.indexOf("/")) {
        uploadURL = window.location.origin + formAction;
    } else if ((0 === formAction.indexOf("http://")) ||
            (0 === formAction.indexOf("https://"))) {
        uploadURL = formAction;
    } else {
        uploadURL = baseURL + formAction;
    }

    var returnURL = window.location;
    if ("" == returnURL.hash) {
        returnURL += "#icemobilesx";
    }

    if ("" != params) {
        params = "ub=" + escape(baseURL) + ampchar + params;
    }

    var sxURL = "icemobile://c=" + escape(command +
            "?id=" + id + ampchar + params) +
            "&u=" + escape(uploadURL) + "&r=" + escape(returnURL) +
            "&p=" + escape(ice.mobiserial(formID, false));

    window.location = sxURL;
}

ice.formOf = function(element) {
    var parent = element;
    while (null != parent) {
        if ("form" == parent.nodeName.toLowerCase()) {
            return parent;
        }
        parent = parent.parentNode;
    }
}
if (!window['ice.mobi']) {
    window.ice.mobi = {};
}

ice.mobi.flipvalue = function(id, vars) {

    try {
        this.id = id;
        this.flipperEl = vars.elVal;

        this.event = vars.event;
        var hasBehaviors = false;

        if (this.flipperEl) {
            var oldClass = this.flipperEl.className;
            var value = "off";
            if (oldClass.indexOf('-off ') > 0) {
                this.flipperEl.className = 'mobi-flip-switch mobi-flip-switch-on ';
                value = true;
            } else {
                this.flipperEl.className = 'mobi-flip-switch mobi-flip-switch-off ';
                value = false;
            }
            var hidden = this.id + "_hidden";
            var thisEl = document.getElementById(hidden);
            if (thisEl) {
                thisEl.value = value.toString();
            }
        }

    } catch (e) {
        alert('Exception finding switcher: ' + e);
    }
}


ice.mobi.carousel = {
    acarousel: null,
    loaded: function(clientId) {
        var carouselId = clientId + '_carousel';
        //carousel iscroll loading
        //    ice.log.debug(ice.log, 'in the carouselLoaded method clientId is '+clientId);
        setTimeout(function () {
            if (this.acarousel) {
                //   ice.log.debug(ice.log, 'REFRESH existing carousel='+this.acarousel);
                mobi.carousel.refresh(clientId);
            }
            else {
                this.acarousels = new iScroll(carouselId, {
                    snap: 'li',
                    momentum: false,
                    hScrollbar: false,
                    onScrollEnd: function () {
                        ice.mobi.carousel.scrollUpdate(clientId, this.currPageX);
                    }
                });
            }
        }, 100);
//	               ice.log.debug(ice.log,"after setTimeout function");
    },
    unloaded: function(clientId) {
        if (this.acarousel != null) {
            //        ice.log.debug(ice.log, 'DESTROY carousel with id='+clientId);
            this.acarousel.destroy();
            this.acarousel = null;
        }
    },

    scrollUpdate: function(clientId, pageVal) {
        //only update if different than last one.
        //         ice.log.debug(ice.log, 'scrollUpdate and current page is='+pageVal);
        var hidden = document.getElementById(clientId + '_hidden');
        var changedVal = false;
        if (hidden) {

            var temp = hidden.value;
            if (temp != pageVal) {
                changedVal = true;
                hidden.value = pageVal;
//                     'old hidden='+temp+ ' updated to hidden.value = '+hidden.value);
                document.querySelector('.mobi-carousel-cursor-list > li.active').className = '';
                document.querySelector('.mobi-carousel-cursor-list > li:nth-child(' + (pageVal + 1) + ')').className = 'active';
            }
        }
    },

    refresh: function(clientId) {
        if (this.acarousel) {
//               ice.log.debug(ice.log, "  have a carousel to refresh from hidden value");
            var currPageX = 0;
            var hidden = document.getElementById(clientId + "_hidden");
            if (hidden) {
                currPageX = hidden.value;
//				   ice.log.debug(ice.log, 'in refresh and currPageX ='+this.currPageX+' hiddenVal is ='+hidden.value);
            }
            //if this.current is different from hidden, then scroll to hidden value.
            this.acarousel.scrollToPage(currPageX);
            document.querySelector('.mobi-carousel-cursor-list > li.active').className = '';
            document.querySelector('.mobi-carousel-cursor-list > li:nth-child(' + (this.currPageX + 1) + ')').className = 'active';
            setTimeout(function() {
                this.acarousel.refresh();

            }, 0);

        }

        if (!this.acarousel) {
            //    ice.log.debug(ice.log, "REFRESH HAS NO OBJECT FOR CAROUSEL clientId="+clientId+' ss -'+singleSubmit);
            this.acarousel = null;
            this.loaded(clientId);
        }
    }
}


ice.mobi.tabsetController = {
    panels: {},
    initClient: function(clientId, cfg) {
        if (true) {
            this.panels[clientId] = ice.mobi.tabsetController.TabSet(clientId, cfg);
        } else {
            this.panels[clientId].updateProperties(clientId, cfg);
        }
    },
    showContent: function(clientId, el, cfgIn) {
//        alert('showContent ' + clientId + ', tabIndex: ' + cfgIn.tIndex );
        if (this.panels[clientId]) {
            this.panels[clientId].showContent(el, cfgIn);
        }
    },

    updateHidden: function(clientId, value) {
        var hidden = document.getElementById(clientId + "_hidden");
        if (hidden) {
            hidden.value = value;
        }
    },
    /* taken from accordion with slight modifications */
    calcMaxChildHeight: function (containerEl) {
        var mxht = 0;
        //find all sections of the clientId and calc height.  set maxheight and height to max height of the divs
        var children = containerEl.getElementsByTagName('div');
        for (var i = 0; i < children.length; i++) {
            if (children[0].scrollHeight > mxht) {
                mxht = children[0].scrollHeight;
            }
        }
        return mxht;
    },
    hasClass: function (ele, cls) {
        return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
    },
    addClass: function (ele, cls) {
        if (ice.mobi.tabsetController.hasClass(ele, cls)) {
            ele.className = cls;
        }
    },
    removeClass: function (ele, cls) {
        if (ice.mobi.tabsetController.hasClass(ele, cls)) {
            // var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');  don't need if we don't allow to skin?
            ele.className = " ";
        }
    },

    findAndSet: function (pool, searchToken, newClass) {

        var page;
        for (idx = 0; idx < pool.length; idx ++) {
            page = pool[idx];
            if (page.id) {
                i = page.id.indexOf(searchToken);
                if (i > 0) {
                    page.className = newClass;
                }
            }
        }
    },

//declare functions who creates object with methods that have access to the local variables of the function
//so in effect the returned object can operate on the local state declared in the function ...
//think about them as object fields in Java, also gone is the chore of copying the constructor parameters into fields
//-------------------------------------
    TabSet: function (clientId, cfgIn) {
        // setup tabContainer
        var myTabId = clientId;
        var tabContainer = document.getElementById(clientId);
        var tabContent = document.getElementById(clientId + "_tabContent");
        var cfg = cfgIn;
        var tabIndex = cfgIn.tIndex;
        if (cfgIn.height) {
            tabContainer.style.height = height;
        } else {
            var ht = ice.mobi.tabsetController.calcMaxChildHeight(tabContent);
            tabContent.style.height = ht + "px";
        }
        var contents = tabContent.getElementsByClassName("mobi-tabpage-hidden");

        return {
            showContent: function(el, cfgIn) {
                if (cfgIn.tIndex == tabIndex) {
                    return;
                }
                var parent = el.parentNode;
                if (!parent) {
                    parent = el.parentElement;
                }
                var current = parent.getAttribute("data-current");
//                alert('current tab index: ' + current);
                var contents = tabContent.childNodes;

                searchToken = "tab" + current + "_wrapper";
                ice.mobi.tabsetController.findAndSet(contents, searchToken, "mobi-tabpage-hidden");

//                oldPage.className = "mobi-tabpage-hidden";
                var currCtrl = myTabId + "tab_" + current;
                var oldCtrl = document.getElementById(currCtrl);
                ice.mobi.tabsetController.removeClass(oldCtrl, "activeTab");
//                var isClient = cfgIn.client || false;
//                if (!isClient){
//                    var hiddenVal = tabIndex+"," +cfgIn.tIndex;
//                    updateHidden(myTabId, hiddenVal);
//                    contents[cfgIn.tIndex].className="mobi-tabpage-hidden";
//                    ice.se(null, myTabId);
//                } else {

                tabIndex = cfgIn.tIndex || 0;
                var newPage;
                for (idx = 0; idx < contents.length; idx ++) {
                    newPage = contents[idx];
                    searchToken = "tab" + tabIndex + "_wrapper";
                    if (newPage.id) {
                        i = newPage.id.indexOf(searchToken);
                        if (i > 0) {
                            newPage.className = "mobi-tabpage";
                        }
                    }
                }


//                var newPage = contents[tabIndex];
//                newPage.className="mobi-tabpage";
//

                parent.setAttribute("data-current", cfgIn.tIndex);
//                }
                //remove class of activetabheader and hide old contents
                el.setAttribute("class", "activeTab");
            },


            updateProperties: function (clientId, cfgUpd) {
                var oldIdx = tabIndex;
                if (cfgUpd.tIndex != tabIndex) {
                    tabIndex = cfgUpd.tIndex;
                    var tabsId = clientId + "_tabs";
                    var tabElem = document.getElementById(tabsId);
                    if (tabElem) {
                        var lis = tabElem.getElementsByTagName("li");
                        var contents = tabContent.childNodes;
                        contents[oldIdx].className = "mobi-tabpage-hidden"; //need in case change is from server
                        contents[tabIndex].className = "mobi-tabpage";
                        if (cfgUpd.height && cfgUpd.height != tabContainer.style.height) {
                            tabContainer.style.height = height;
                        }
                    }
                }
            }
        }
    }
}

ice.mobi.accordionController = {

    // Panels wont ever have more than one panel in it, since it's a single accordian.
    panels: {},
    initClient: function(clientId, cfg) {
        if (true) {
            this.panels[clientId] = ice.mobi.accordionController.Accordion(clientId, cfg);
        } else {
            this.panels[clientId].updateProperties(clientId, cfg);
        }
    },
    toggleClient: function(clientId, el, cachetyp) {
        if (this.panels[clientId]) {
            this.panels[clientId].toggle(el, cachetyp);
        }
    },

    //functions that do not encapsulate any state, they just work with the provided parameters
    //and globally accessible variables
    //---------------------------------------
    updateHidden: function (clientId, value) {
        var hidden = document.getElementById(clientId + "_hidden");
        if (hidden) {
            hidden.value = value;
        }
    },

    getDivHeight: function (clientId) {
        return document.getElementById(clientId).innerHeight;
    },

    updateHeightInOpenClass: function (ruleName, height) {
        if (document.styleSheets) {
            for (var i = 0; i < document.styleSheets.length; i++) {
                var styleSh = document.styleSheets[i];
                var index = 0;
                var found = false;
                var cssRule;
                do {
                    if (styleSh.cssRules) {
                        cssRule = styleSh.cssRules[index];
                    }
                    else {
                        cssRule = styleSh.rules[index];
                    }
                    if (cssRule) {
                        if (cssRule.selectorText.toLowerCase() == ruleName) {
                            //update height and maxheight
                            cssRule.style.maxHeight = height;
                            cssRule.style.height = height;
                            break;
                        }
                    }
                    index ++;
                } while (cssRule);
            }
        }
    },
    calcMaxDivHeight: function (clientId) {
        var accord = document.getElementById(clientId);
        var mxht = 0;
        //find all sections of the clientId and calc height.  set maxheight and height to max height of the divs
        var children = document.getElementById(clientId).getElementsByTagName('section');
        for (var i = 0; i < children.length; i++) {
            if (children[0].scrollHeight > mxht) {
                mxht = children[0].scrollHeight;
            }
        }
        return mxht;
    },

    //declare functions who creates object with methods that have access to the local variables of the function
    //so in effect the returned object can operate on the local state declared in the function ...
    //think about them as object fields in Java, also gone is the chore of copying the constructor parameters into fields
    //-------------------------------------
    Accordion: function (clientId, cfgIn) {
        //local variables are not public but public open, close, visible and updateProperties functions can operate on them
        var theContainer = document.getElementById(clientId);
        var openClass = ".mobi-accordion .open";
        var myclient = clientId;
        var alreadyOpenId = theContainer.getAttribute('data-opened'); //do I care about this?
        var scrollEvent = 'ontouchstart' in window ? "touchmove" : "scroll";
        var cgfObj = cfgIn;
        var autoheight = cfgIn.autoheight || false;
        var maxheight = cfgIn.maxheight || "200px";
        if (autoheight == true) {
            maxheight = ice.mobi.accordionController.calcMaxDivHeight(clientId);
        }
        var heightString = maxheight + "px";
        ice.mobi.accordionController.updateHeightInOpenClass(openClass, heightString);
        //as you can see all the 'this' noise is gone
        //object properly encapsulates state
        return {
            toggle: function(el, cached) {
                var theParent = el.parentElement;
                if (!theParent) {
                    theParent = el.parentNode; //mozilla
                }
                //which child is the element?
                ice.mobi.accordionController.updateHidden(myclient, theParent.id);
//                if (!cached){
//                    ice.se(null, myclient);
//                }
                var alreadyOpen = theContainer.getAttribute('data-opened');
                if (alreadyOpen && alreadyOpen !== theParent.id) {
                    var openedEl = document.getElementById(alreadyOpen);
                    if (openedEl) {
                        document.getElementById(alreadyOpen).className = 'closed';
                    }
                }
                if ('open' === theParent.className) {
                    theParent.className = 'closed';
                } else {
                    theParent.className = 'open';
                    theContainer.setAttribute('data-opened', theParent.id);
                }

            },

            updateProperties: function (clientId, cfgUpd) {
                cfgObj = cfgIn; //not sure I need to keep this?
                //server may want to push new dynamic values for maxheight and autoheight
                var change = false;
                if (autoheight != cfgUpd.autoheight) {
                    autoheight = cfgUpd.autoheight || false;
                    change = true;
                }
                if (maxheight != cfgUpd.maxheight) {
                    maxheight = cfgUpd.maxheight || "200px";
                    change = true;
                }
                if (change == true) {
                    var newHeight = ice.mobi.accordionController.calcMaxDivHeight(clientId);
                }
            }
        }
    }
}