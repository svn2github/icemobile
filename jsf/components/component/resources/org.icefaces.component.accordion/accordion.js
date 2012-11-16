(function() {
    function updateHidden(clientId, value) {
        var hidden = document.getElementById(clientId + "_hidden");
        if (hidden) {
            hidden.value = value;
        }
    }
    function getHiddenVal(clientId){
        var hidden = document.getElementById(clientId+"_hidden");
        if (hidden && hidden.value){
            return hidden.value;
        } else {
            return null;
        }
    }
    function getHandleHeight(aRoot){
        var handleNode = aRoot.querySelector('.mobi-accordion .handle');
        var handleHeight = "33"; //default css handle height is 33px
        if (handleNode){
           var temp = handleNode.scrollHeight || handleNode.height || handleNode.offsetHeight || handleNode.maxHeight;
           if (temp > 0){
               handleHeight = temp;
           }
        }
        return handleHeight;
    }
    function calcMaxDivHeight(clientId, handleHt) {
        var accord = document.getElementById(clientId);
        var mxht = 0;
        //find all sections of the clientId and calc height.  set maxheight and height to max height of the divs
        var children = document.getElementById(clientId).getElementsByTagName('section');
        for (var i = 0; i < children.length; i++) {
            var anode = children[i];
            var max = Math.max(anode.scrollHeight, anode.offsetHeight, anode.clientHeight);
            if (max > 0 && max > mxht) {
                mxht = max;
            }
        }
        if (mxht <= handleHt ) {
            mxht = 0;
            console.log("COULD NOT CALC A mxht");
        }
        return mxht;
    }
    function updateFixedHeight(clientId, handleheight, oldHeight){
         var calcht = calcMaxDivHeight(clientId, handleheight) ;
         if (calcht > 0) {
             return  calcht+"px";
         }
         else {
             return oldHeight;
         }
    }
    function setHeight(opened, fht){
        if (opened && fht){
            opened.setAttribute("style", "height:"+fht+"; maxheight: "+fht+";");
        }
    }
    function openPane(elem, h){
        if (h){
            console.log(" setting open height to="+h);
            setHeight(elem, h);
        }
        elem.className="open";
    }
    function closePane(elem, closeHt){
        elem.setAttribute("style", "");
     /*   if (closeHt) {   leave here in case closed class is removed as well
            console.log("setting close height to="+closeHt);
         setHeight(elem, closeHt);
        }   */
        elem.className="closed";
    }
    function Accordion(clientId, cfgIn) {
        var containerId = clientId+"_acc" ;
        var paneId = cfgIn.opened || null;
        var accordRoot = document.getElementById(containerId);
        var paneOpId;
        if (paneId) {
            paneOpId = paneId + "_sect";
        }
        var lastServerId = paneId;
        var cntr = 0;
        if (!paneOpId && accordRoot.hasChildNodes()){
            var children = accordRoot.getElementsByTagName("section");
            paneOpId = children[0].id;
        }
        var autoheight = cfgIn.autoHeight || false;
        var fixedHeight = cfgIn.fixedHeight || null;
        var openElem = document.getElementById(paneOpId);
        if (openElem){
            openElem.className = "open";
            if (autoheight || (!autoheight && !fixedHeight)){
                openElem.setAttribute("style", "");
            }
        }
        var handleheight = getHandleHeight(accordRoot);
        var handleht = handleheight + "px";
        if (!autoheight && !fixedHeight){
            handleht = null;
        }
        var maxHeight = calcMaxDivHeight(containerId, handleheight);
        if (autoheight && (maxHeight > 0)){
          //  console.log("\t setting autoheight of maxHeight="+maxHeight+" for storage");
            ice.mobi.accordionController.maxHt[clientId]=maxHeight;
            fixedHeight = maxHeight+"px";
            openPane(openElem, fixedHeight);
         //   console.log("\t opened panel to fixedHeight= "+fixedHeight);
        }
        if (autoheight && (maxHeight==0)){
          //  console.log("\t had to listen for a height none calc");
            ice.onAfterUpdate(function() {
                ice.mobi.accordionController.updateHeight(clientId, handleheight);
            });
        }
        return {
            toggle: function(clientId, el, cached) {
           //     alert('triggered event to open '+el.parentElement.id);
                var singleSubmit  = ice.mobi.accordionController.singleSubmit[clientId];
                if (autoheight){
                    var tmp = ice.mobi.accordionController.maxHt[clientId];
                    if (tmp && maxHeight==0){
                        maxHeight = tmp;
                    }
                    else if (tmp && maxHeight > 0){
                        maxHeight = Math.max(tmp, maxHeight);
                    }
                    else {
                        maxHeight = calcMaxDivHeight(clientId, handleheight);
                    }
                }
                var theParent = el.parentElement;
                if (!theParent) {
                    theParent = el.parentNode; //mozilla
                }
                var pString = theParent.getAttribute("id");
                var subString = pString.replace("_sect","");
                updateHidden(clientId, subString);
              //  console.log("\t paneOpId="+paneOpId+" parentId ="+theParent.id);
                openElem = document.getElementById(paneOpId);
                if (autoheight && openElem && (maxHeight > 0)){
                    fixedHeight = maxHeight+"px";
                   // console.log("\t updated fixedHeight="+fixedHeight);
                }
                if (paneOpId && paneOpId == theParent.id){
                    if (openElem.className=="open"){
                        closePane(openElem, handleht);
                    } else {
                        openPane( openElem, fixedHeight);
                    }
                }
                else {//panel has changed
                    closePane(openElem, handleht);
                    if (cached){
                       // console.log(" client true opening pane ="+paneOpId +" to height="+fixedHeight);
                        openPane(theParent,fixedHeight);
                        paneOpId = theParent.id;
                        openElem = theParent;
                      //  openPane(openElem, fixedHeight);
                    }
                    if (!cached && singleSubmit) {
                      //  console.log(" lasterServerId="+lastServerId+" parentId = "+theParent.id);
                        if (lastServerId == theParent.id){
                            cntr= cntr + 1;
                            //try to keep correct pane open despite caching
                            var submitted = subString +","+cntr;
                            updateHidden(clientId,submitted);
                        }  else {
                            cntr = 0;
                            lastServerId = theParent.id;
                        }
                        ice.se(null, clientId);
                    }
                }
            },
            updateHeight: function(clientId, handleheight){
                //console.log(" updateHeight major called");
                    var node = document.getElementById(clientId);
                    if (node){
                        maxHeight = calcMaxDivHeight(clientId,  handleheight);
                       // console.log("returning maxHeight="+maxHeight);
                        return maxHeight;
                    }
            } ,
            updateProperties: function (clientId, cfgUpd) {
                var fixedHeight=cfgUpd.fixedHeight ||null;
                autoheight = cfgUpd.autoHeight;
                if (autoheight) {
                    //calc new maxHeight
                    var tmp1 = calcMaxDivHeight(clientId, handleheight);
                    var storedHt = ice.mobi.accordionController.maxHt[clientId];
                  //  console.log(" \t tmp1 = "+tmp1+" maxHeight="+maxHeight);
                    maxHeight = Math.max(tmp1, maxHeight);
                    if (maxHeight == 0 && !storedHt){
                      //  console.log(" \t !!!set ONAFTER UPDATE value so have to listen for update");
                           ice.onAfterUpdate(function() {
                               ice.mobi.accordionController.updateHeight(clientId, handleheight);
                            }) ;
                    }
                    else {
                       // console.log(" taking max of maxHeight and stored value = "+storedHt);
                        maxHeight = Math.max(storedHt, maxHeight);
                    }
                    if (maxHeight && maxHeight > 0){
                        ice.mobi.accordionController.maxHt[clientId]=maxHeight;
                        fixedHeight = maxHeight+"px";
                     //   console.log(" have maxHeight and stored fixedHeight="+fixedHeight);
                    }
                }
                if (openElem){
                    closePane(openElem, handleheight+"px");
                } else {  //may have been deleted or removed
                     var root = document.getElementById(clientId+"_acc");
                     openElem = root.firstChild;
                     paneOpId = root.firstChild.id;
                }
                var pushedId = getHiddenVal(clientId)+"_sect";
                console.log("\t  pushed new id="+pushedId);
                if(paneOpId != pushedId){
                    paneOpId = pushedId || null;
                    openElem = document.getElementById(paneOpId);
                    openPane(openElem, fixedHeight) ;
                } else {
                    openPane(openElem, fixedHeight);
                }
            }
        }
    }
    ice.mobi.accordionController = {
        panels: {},
        autoheight: {},
        maxHt: {},
        singleSubmit: {},
        initClient: function(clientId, cfg) {
            if (!this.panels[clientId]) {
                this.autoheight[clientId]= cfg.autoHeight;
                this.singleSubmit[clientId] = cfg.singleSubmit;
                this.panels[clientId] = Accordion(clientId, cfg);
                ice.onElementUpdate(clientId, function(){
                    ice.mobi.accordionController.unload(clientId);
                });
            } else {
                this.panels[clientId].updateProperties(clientId, cfg);
            }
        },
        toggleClient: function(clientId, el, cachetyp) {
            if (this.panels[clientId]) {
                this.panels[clientId].toggle(clientId, el, cachetyp);
            } else {
                this.initClient(clientId, {});
                this.panels[clientId].toggle(clientId, el, cachetyp);
            }
        },
        toggleMenu: function(clientId, el){
            if (this.panels[clientId]) {
                this.panels[clientId].toggle(clientId, el, true);
            } else{
                this.initClient(clientId, {autoheight:true});
            }
        } ,
        updateHeight: function(clientId, handleHt){
            if (this.panels[clientId]){
              //  console.log("updateHeight");
                var tmp = this.panels[clientId].updateHeight(clientId, handleHt);
                if (!this.maxHt[clientId] && tmp > 0){
                    this.maxHt[clientId] = tmp;
                }else {
                    this.maxHt[clientId] = Math.max(tmp, this.maxHt[clientId]);
                }
              //  console.log("updateProps ->maxHt clientId = "+this.maxHt[clientId]);
            }
        },
        unload: function(clientId){
            var anode = document.getElementById(clientId);
            if (!anode){
             //   console.log("REMOVE ACCORDION WITH  id="+clientId);
                this.panels[clientId] = null;
                this.autoheight[clientId]=null;
                this.panels[clientId]=null;
            }
        }
    }
})();