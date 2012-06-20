<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="s" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form" %>
<%@ taglib uri="http://www.icemobile.org/tags" prefix="mobi" %>
<%@ taglib prefix="push" uri="http://www.icepush.org/icepush/jsp/icepush.tld"%>
<%@ page session="false" %>
<c:if test="${!ajaxRequest}">
<html>
<head>
	<title>ICEmobile | mvc-showcase</title>
	<link href="<c:url value="/resources/form.css" />" rel="stylesheet"  type="text/css" />		
	<script type="text/javascript" src="<c:url value="/resources/jquery/1.6/jquery.js" />"></script>
	<script type="text/javascript" src="code.icepush"></script>
</head>
<body>
</c:if>
	<div id="campushContent">
<c:if test="${isGET}">
    <push:register group="camPush" callback="function(){$('#campushform').submit();}"/>
</c:if>
		<h4>Camera Push</h4>
        <mobi:fieldSetGroup inset="true">
            <mobi:fieldSetRow>
			    ICEmobile Camera Push Sample
		    </mobi:fieldSetRow>
        </mobi:fieldSetGroup>

		<form:form id="campushform" method="POST" enctype="multipart/form-data" modelAttribute="icemobileBean" cssClass="cleanform">

            <h4>Snapshot Information</h4>
            <mobi:fieldSetGroup inset="true">
                <mobi:fieldSetRow>
		  		    <form:label path="name">
		  			    Author: <form:errors path="name" cssClass="error" />
                    </form:label>
		  		    <form:input path="name" />
                </mobi:fieldSetRow>
                <mobi:fieldSetRow>
                    <mobi:camera id="camera" />
	                <mobi:thumb for="camera"
                            style="height:60px;width:65px;vertical-align:middle;float:right;margin:10px;"/>
		  	    </mobi:fieldSetRow>
            </mobi:fieldSetGroup>

            <h4>Uploaded Snapshot</h4>
            <mobi:fieldSetGroup inset="true">
                <mobi:fieldSetRow>
                    <img style="height:60px;width:60px;margin:5px;" src="${imgPath}" />
                </mobi:fieldSetRow>
            </mobi:fieldSetGroup>

            <%-- button types: default|important|attention| back--%>
            <mobi:commandButton buttonType='important'
                                style="float:right;margin-right: 25px;"
                                value="Submit"
                                type="submit"/>
            <div style="clear:both;" />
            <c:if test="${not empty message}">
                <div id="message" class="success">${message}<br/>
                    <img style="height:60px;width:60px;" src="${imgPath}" >
                </div>
            </c:if>
            <s:bind path="*">
                <c:if test="${status.error}">
                    <div id="message" class="error">Form has errors</div>
                </c:if>
            </s:bind>
		</form:form>

		<script type="text/javascript">

			$(document).ready(function() {
				$("#campushform").submit(function() {
                    if (window.ice && ice.upload)  {
                        window.ice.handleResponse = function(data)  {
						    $("#campushContent").replaceWith(unescape(data));
						    $('html, body').animate({ scrollTop: $("#message").offset().top }, 500);
                        }
                        ice.upload($(this).attr("id"));
                        return false;  
                    }

                    var formData = new FormData(this);

                    $.ajax({
                        url: $(this).attr("action"),
                        data: formData,
                        cache: false,
                        contentType: false,
                        processData: false,
                        type: 'POST',
                        success: function(html) {
						    $("#campushContent").replaceWith(html);
						    $('html, body').animate({ scrollTop: $("#message").offset().top }, 500);
					    }
                    });

					return false;  
				});			
			});

		</script>
	</div>
<c:if test="${!ajaxRequest}">
</body>
</html>
</c:if>