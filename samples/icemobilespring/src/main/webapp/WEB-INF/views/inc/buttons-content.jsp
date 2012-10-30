<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="s" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form" %>
<%@ taglib uri="http://www.icemobile.org/tags" prefix="mobi" %>
<%@ taglib prefix="push" uri="http://www.icepush.org/icepush/jsp/icepush.tld"%>
<form:form id="buttonsform" method="POST" modelAttribute="buttonsBean">

    <h4>Button Types</h4>
    <mobi:fieldsetGroup>
        <mobi:fieldsetRow styleClass="mobi-grid mobi-center">
            <mobi:commandButton name="submitB"
                                value="Default"
                                styleClass="mobi-col mobi-weight1"/>
            <mobi:commandButton name="submitB"
                                value="Important" buttonType="important"
                                styleClass="mobi-col mobi-weight1"/>
        </mobi:fieldsetRow>
        <mobi:fieldsetRow styleClass="mobi-grid mobi-center">
            <mobi:commandButton name="submitB"
                                value="Attention" buttonType="attention"
                                styleClass="mobi-col mobi-weight1"/>
            <mobi:commandButton name="submitB"
                                value="Unimportant" 
                                styleClass="mobi-col mobi-weight1"/>
        </mobi:fieldsetRow>
        <mobi:fieldsetRow styleClass="mobi-grid mobi-center">
            <mobi:commandButton name="submitB"
                                buttonType="back" value="Back"
                                styleClass="mobi-col mobi-weight1"/>
        </mobi:fieldsetRow>
        <mobi:fieldsetRow styleClass="mobi-grid mobi-center">
            <mobi:commandButton id="disabledDefault" value="Disabled" 
                disabled="true" styleClass="mobi-col mobi-weight1"/>
        </mobi:fieldsetRow>
        <mobi:fieldsetRow>
            <label>Selected Value: </label>
            <c:if test="${pressed != null}">
                ${pressed}
            </c:if>
        </mobi:fieldsetRow>
    </mobi:fieldsetGroup>

</form:form>


<script type="text/javascript">

    $(document).ready(function () {
        $("#buttonsform").click(function (e) {
            window.iceButtonTracker = e.target;
        });
        $("#buttonsform").submit(function () {
            var updateRegion = $(this).closest("div.ajaxzone");
            if (window.ice && ice.upload) {
                window.ice.handleResponse = function (data) {
                    var tracker = document
                            .getElementById("iceButtonTrackerHidden");
                    if (tracker) {
                        tracker.parentNode.removeChild(tracker);
                    }
                    updateRegion.html(unescape(data));
                    var msgElem = $("#message");
                    if( msgElem.length > 0 ){
                        $('html, body').animate({ scrollTop:msgElem.offset().top }, 500);
                    }
                }
                //ice.upload should accept a submitting element
                //so the hidden field is not necessary here
                if (window.iceButtonTracker) {
                    $('<input>').attr({
                        type:'hidden',
                        id:'iceButtonTrackerHidden',
                        name:window.iceButtonTracker.name,
                        value:window.iceButtonTracker.value
                    }).appendTo($(this));
                    window.iceButtonTracker = null;
                }
                ice.upload($(this).attr("id"));
                return false;
            }

            var formData = new FormData(this);
            if (window.iceButtonTracker) {
                if (-1 == navigator.userAgent.indexOf("WebKit")) {
                    formData.append(window.iceButtonTracker.name,
                            window.iceButtonTracker.value);
                    window.iceButtonTracker = null;
                }
            }

            $.ajax({
                url:$(this).attr("action"),
                data:formData,
                cache:false,
                contentType:false,
                processData:false,
                type:'POST',
                success:function (html) {
                    updateRegion.html(html);
                    var msgElem = $("#message");
                    if( msgElem.length > 0 ){
                        $('html, body').animate({ scrollTop:msgElem.offset().top }, 500);
                    }
                }
            });

            return false;
        });
    });

</script>