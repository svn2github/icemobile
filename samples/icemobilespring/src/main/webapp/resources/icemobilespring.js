function equalizeElementHeights(element1Id,element2Id) {
    var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    if( !is_firefox ){
        var element1 = document.getElementById(element1Id);
        var element2 = document.getElementById(element2Id);
        if( element1 && element2 ){
            var height = 0;
            var body = window.document.body;
            if (window.innerHeight) {
                height = window.innerHeight;
            } else if (body.parentElement.clientHeight) {
                height = body.parentElement.clientHeight;
            } else if (body) {
                if (body.clientHeight) {
                    height = body.clientHeight;
                }
            }
            element1.style.height = ((height - element1.offsetTop) + "px");  
            element2.style.height = ((height - element2.offsetTop) + "px"); 
        }
        
    }
}

function addEqualizeElementHeightsAfterResizeListener(element1Id,element2Id){

    // check caller to see if orientation changes are support and fall back
    // to window resize events otherwise
    var supportsOrientationChange = "onorientationchange" in window,
        orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
    
    var resizeHandler = function(updates) {
        equalizeElementHeights(element1Id,element2Id);
    }

    // resize height on first load
    equalizeElementHeights(element1Id,element2Id);

    // apply resize on either orientation or window size change.
    window.addEventListener(orientationEvent, resizeHandler);
    
}

MvcUtil = {};
MvcUtil.showSuccessResponse = function (text, element) {
    MvcUtil.showResponse("success", text, element);
};
MvcUtil.showErrorResponse = function showErrorResponse(text, element) {
    MvcUtil.showResponse("error", text, element);
};
MvcUtil.showResponse = function (type, text, element) {
    var responseElementId = element.attr("id") + "Response";
    var responseElement = $("#" + responseElementId);
    if (responseElement.length == 0) {
        responseElement = $('<span id="' + responseElementId + '" class="' + type + '" style="display:none">' + text + '</span>').insertAfter(element);
    } else {
        responseElement.replaceWith('<span id="' + responseElementId + '" class="' + type + '" style="display:none">' + text + '</span>');
        responseElement = $("#" + responseElementId);
    }
    responseElement.fadeIn("slow");
};
MvcUtil.xmlencode = function (xml) {
    //for IE
    var text;
    if (window.ActiveXObject) {
        text = xml.xml;
    }
    // for Mozilla, Firefox, Opera, etc.
    else {
        text = (new XMLSerializer()).serializeToString(xml);
    }
    return text.replace(/\&/g, '&' + 'amp;').replace(/</g, '&' + 'lt;')
            .replace(/>/g, '&' + 'gt;').replace(/\'/g, '&' + 'apos;').replace(/\"/g, '&' + 'quot;');
};
MvcUtil.enhanceForm = function(theForm)  {
    //submitting the form will update 
    //the containing div with class ajaxzone
    $(document).ready(function () {
        $(theForm).submit(function () {
            var updateRegion = $(this).closest("div.ajaxzone");
            if (window.ice && ice.upload) {
                window.ice.handleResponse = function (data) {
                    updateRegion.replaceWith(unescape(data));
                    var msgElem = $("#message");
                    if( msgElem.length > 0 ){
                        $('html, body').animate({ scrollTop:msgElem.offset().top }, 500);
                    }
                }
                ice.upload($(this).attr("id"));
                return false;
            }
            
            try{
                var formData;
                var mimeType = false;
                if ((undefined !== window.FormData) && 
                   (!window.clientInformation || 
                       ("BlackBerry" !== window.clientInformation.platform)) )  {
                    formData = new FormData(this);
                } else {
                    formData = $(theForm).serialize();
                    mimeType = "application/x-www-form-urlencoded";
                }

                $.ajax({
                    url:$(this).attr("action"),
                    data:formData,
                    cache:false,
                    contentType:mimeType,
                    processData:false,
                    type:'POST',
                    success:function (html) {
                        updateRegion.replaceWith(html);
                        var msgElem = $("#message");
                        if( msgElem.length > 0 ){
                            $('html, body').animate({ scrollTop:msgElem.offset().top }, 500);
                        }
                    }
                });
            }
            catch(err){
                if( window.console ){
                    console.error(err);
                }
                else{
                    alert(err);
                }
            }
            return false;
        });
    });
};
MvcUtil.enhanceLink = function(link, updateRegion)  {
    $(document).ready(function () {
        var l = $(link)
        l.click(function () {
            var href = l.attr('href');
            $(updateRegion).load(href);
            if( window.history && window.history.pushState ){
                history.pushState(null, null, href);
                return false;
            }
            else{
                return true;
            }
        });
    });
};
MvcUtil.enhanceAllLinks = function(parent, updateRegion)  {
    $(document).ready(function () {
        $(parent).find('a').each( function(){
            var href = $(this).attr('href');
            $(this).click(function () {
                //link coloring
                $('#menu').find('a').each( function(){
                    $(this).attr('style','');
                });
                $(this).css({backgroundColor:'#EFEFEF'});
                $(updateRegion).load(href);
                if( window.history && window.history.pushState ){
                    history.pushState(null, null, href);
                    return false;
                }
                else{
                    return true;
                }
            });
        });
        
    });
};
if( window.history && window.history.pushState ){
    window.addEventListener("popstate", function(e) {
        $('.ajaxzone').load(location.pathname);
        e.preventDefault();
    });
}