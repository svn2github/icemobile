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


if (!window['mobi']) {
    window.mobi = {};
}
mobi.BEHAVIOR_EVENT_PARAM = "javax.faces.behavior.event";
mobi.PARTIAL_EVENT_PARAM = "javax.faces.partial.event";
mobi.findForm = function (sourceId) {
    var node = document.getElementById(sourceId);
    while (node.nodeName.toLowerCase() != "form" && node.parentNode) {
        node = node.parentNode;
    }
    ice.log.debug(ice.log, 'parent form node =' + node.name);
    return node;
};
mobi.AjaxRequest = function (cfg) {

    if (cfg.onstart && !cfg.onstart.call(this)) {
        return;//cancel request
    }
    ice.log.debug(ice.log, 'creating ajax request');
    var form = mobi.findForm(cfg.source);
     if (form) {
        ice.log.debug(ice.log, 'found form with name=' + form.name);
        ice.log.debug(ice.log, ' length of forms =' + form.length);
    }
    var source = (typeof cfg.source == 'string') ? document.getElementById(cfg.source) : cfg.source;
	if (!document.getElementById(cfg.source)) {
		if (cfg.node) {
			source = cfg.node;
			source.id = cfg.source;
		}
	}
    if (form.length == 0){
        form = source.form;
         ice.log.debug(ice.log, "had to find form via element form length = "+form.length);
    }
    if (form.length == 0){
       form = document.forms[0]; //just return first form in the page
       ice.log.debug(ice.log, 'had to find first form on page');
    }
    var jsfExecute = cfg.execute || '@all';
    var jsfRender = cfg.render || '@all';

    ice.fullSubmit(jsfExecute, jsfRender, null, source || form[0], function (parameter) {
        if (cfg.event) {
            parameter(mobi.BEHAVIOR_EVENT_PARAM, cfg.event);

            var domEvent = cfg.event;
            if (cfg.event == 'valueChange') {
                domEvent = 'change';
            } else if (cfg.event == 'action') {
                domEvent = 'click';
            }

            parameter(mobi.PARTIAL_EVENT_PARAM, domEvent);
        } else {
            parameter(cfg.source, cfg.source);
        }

        if (cfg.params) {
            var cfgParams = cfg.params;
            for (var p in cfgParams) {
                parameter(p, cfgParams[p]);
            }
        }
    }, function (onBeforeSubmit, onBeforeUpdate, onAfterUpdate, onNetworkError, onServerError) {
        var context = {};
        onAfterUpdate(function (responseXML) {
            if (cfg.onsuccess && !cfg.onsuccess.call(context, responseXML, null /*status*/, null /*xhr*/)) {
                return;
            }
        });
        if (cfg.oncomplete) {
            onAfterUpdate(function (responseXML) {
                cfg.oncomplete.call(context, null /*xhr*/, null /*status*/, context.args);
            });
        }
        if (cfg.onerror) {
            onNetworkError(function (responseCode, errorDescription) {
                cfg.onerror.call(context, null /*xhr*/, responseCode /*status*/, errorDescription /*error description*/)
            });
            onServerError(function (responseCode, responseText) {
                cfg.onerror.call(context, null /*xhr*/, responseCode /*status*/, responseText /*error description*/)
            });
        }
    });
};


mobi.registerAuxUpload = function (sessionid, uploadURL) {
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

mobi.panelAutoCenter = function (clientId) {
    var windowWidth = mobi._windowWidth();
    var windowHeight = mobi._windowHeight();
    var scrollTop = document.body.scrollTop;
    if (scrollTop == 0) {
        scrollTop = document.documentElement.scrollTop;
    }
    if (windowHeight > 0) {
        var contentElement = document.getElementById(clientId);
        var contentHeight = contentElement.offsetHeight;
        var contentWidth = contentElement.offsetWidth;
        if (windowHeight - contentHeight > 0) {
            contentElement.style.position = 'absolute';
            contentElement.style.top = scrollTop + ((windowHeight / 2) - (contentHeight / 2)) + 'px';
            contentElement.style.left = ((windowWidth / 2) - (contentWidth / 2)) + 'px';
        } else {
            contentElement.style.position = 'absolute';
            contentElement.style.top = 0;
            contentElement.style.left = ((windowWidth / 2) - (contentWidth / 2)) + 'px';
        }
    }
};
mobi._windowHeight = function () {
    var windowHeight = 0;
    if (typeof(window.innerHeight) == 'number') {
        windowHeight = window.innerHeight;
    } else {
        if (document.documentElement && document.documentElement.clientHeight) {
            windowHeight = document.documentElement.clientHeight;
        } else {
            if (document.body && document.body.clientHeight) {
                windowHeight = document.body.clientHeight;
            }
        }
    }
    return windowHeight;
};
mobi._windowWidth = function () {
    var windowWidth = 0;
    if (typeof(window.innerWidth) == 'number') {
        windowWidth = window.innerWidth;
    } else {
        if (document.documentElement && document.documentElement.clientWidth) {
            windowWidth = document.documentElement.clientWidth;
        } else {
            if (document.body && document.body.clientWidth) {
                windowWidth = document.body.clientWidth;
            }
        }
    }
    return windowWidth;
};

function html5getViewState(form) {
    if (!form) {
        throw new Error("jsf.getViewState:  form must be set");
    }
    var els = form.elements;
    var len = els.length;
    var qString = [];
    var addField = function (name, value) {
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
            switch (el.type) {
                case 'submit':
                case 'button':
                    break;
                case 'text':
                case 'password':
                case 'hidden':
                case 'textarea':
                    addField(el.name, el.value);
                    break;
                case 'select-one':
                    if (el.selectedIndex >= 0) {
                        addField(el.name, el.options[el.selectedIndex].value);
                    }
                    break;
                case 'select-multiple':
                    for (var j = 0; j < el.options.length; j++) {
                        if (el.options[j].selected) {
                            addField(el.name, el.options[j].value);
                        }
                    }
                    break;
                case 'checkbox':
                case 'radio':
                    if (el.checked) {
                        addField(el.name, el.value);
                    }
                    break;
                default:
                    addField(el.name, el.value);
            }
        }
    }
    // concatenate the array
    return qString.join("");
}

function html5handleResponse(context, data) {
    if (null == context.sourceid) {
        //was not a jsf upload
        return;
    }

    var jsfResponse = {};
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(data, "text/xml");

    jsfResponse.responseXML = xmlDoc;
    jsf.ajax.response(jsfResponse, context);

}


function html5submitFunction(element, event, options) {
    var source = event ? event.target : element;
    var form = element;
    while ((null != form) && ("form" != form.tagName.toLowerCase())) {
        form = form.parentNode;
    }
    var formData = new FormData(form);
    var formId = form.id;
    var sourceId = element ? element.id : event.target.id;

    if ("@this" === options.execute) {
        options.execute = sourceId;
    } else if ("@form" === options.execute) {
        options.execute = formId;
    }
    if ("@this" === options.render) {
        options.render = sourceId;
    } else if ("@form" === options.render) {
        options.render = formId;
    }
    if (!options.execute) {
        options.execute = "@all";
    }
    if (!options.render) {
        options.render = "@all";
    }

    formData.append("javax.faces.source", sourceId);
    formData.append(source.name, source.value);
    formData.append("javax.faces.partial.execute", options.execute);
    formData.append("javax.faces.partial.render", options.render);
    formData.append("javax.faces.partial.ajax", "true");

    if (event) {
        formData.append("javax.faces.partial.event", event.type);
    }

    if (options) {
        for (var p in options) {
            if ("function" != typeof(options[p])) {
                formData.append(p, options[p]);
            }
        }
    }

    var context = {
        sourceid: sourceId,
        formid: formId,
        //'begin' event is not triggered since we do not invoke jsf.ajax.request -- onBeforeSubmit relies on this event
        onevent: options.onevent,
        onerror: options.onerror || function (param) {
            alert("JSF error " + param.source + " " + param.description);
        }
    };

    var xhr = new XMLHttpRequest();
    xhr.open("POST", form.getAttribute("action"));
    xhr.setRequestHeader("Faces-Request", "partial/ajax");
    xhr.onreadystatechange = function () {
        if ((4 == xhr.readyState) && (200 == xhr.status)) {
            html5handleResponse(context, xhr.responseText);
        }
    };
    xhr.send(formData);
}

if (window.addEventListener) {
    window.addEventListener("load",
            function () {
                jsf.getViewState = html5getViewState;
                if ((undefined !== window.FormData) &&
                        (undefined === window.ice.mobile) &&
                        ((undefined === window.clientInformation) || ("BlackBerry" !== window.clientInformation.platform)) &&
                        (undefined !== window.Worker)) {
                    ice.submitFunction = html5submitFunction;
                }
            }, false);

    window.addEventListener("pagehide", function () {
        if (ice.push) {
            ice.push.connection.pauseConnection();
        }
    }, false);

    window.addEventListener("pageshow", function () {
        if (ice.push) {
            ice.push.connection.resumeConnection();
        }
    }, false);
}
/* javascript for mobi:commandButton component put into component.js as per MOBI-200 */
mobi.button = {
    cfg: {},
    select: function(clientId, cfg){
        //if panelConf, then we want this to display and set the submitNotifyId if present
        this.cfg[clientId] = cfg;
        if (cfg.snId){
            mobi.submitnotify.open(cfg.snId);
            //if here, then no panelConfirmation as this action is responsible for submit
        }
        //otherwise, just check for behaviors, singleSubmit and go
        var singleSubmit = false;
        if (cfg.singleSubmit){
            singleSubmit=true;
        }
        var hasBehaviors = cfg.behaviors;
        if (hasBehaviors){
            singleSubmit=false; //hasBehaviors takes precedence and singlessubmit is ignored
            //show the submitNotification panel
            if (cfg.behaviors.click){
                cfg.behaviors.click();
            }
            return;
        }
        var event = cfg.elVal.event;
        var params = cfg.params;
        if (singleSubmit){
            ice.se(event, clientId, params);
        } else {
            ice.s(event, clientId, params);
        }
    }
};
