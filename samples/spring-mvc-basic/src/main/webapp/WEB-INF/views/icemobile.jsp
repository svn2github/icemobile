<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="s" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form" %>
<%@ taglib uri="http://www.icemobile.org/tags" prefix="mobi" %>
<%@ page session="false" %>
<c:if test="${!ajaxRequest}">
<html>
<head>
	<title>ICEmobile | mvc-showcase</title>
	<link href="<c:url value="/resources/form.css" />" rel="stylesheet"  type="text/css" />		
	<script type="text/javascript" src="<c:url value="/resources/jquery/1.6/jquery.js" />"></script>
</head>
<body>
</c:if>
	<div id="camContent">
		<h2>Camera</h2>
		<p>
			ICEmobile Camera Sample	
		</p>
		<form:form id="camform" method="POST" enctype="multipart/form-data" modelAttribute="icemobileBean" cssClass="cleanform">
			<div class="header">
		  		<h2>Form</h2>
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
			</div>
		  	<fieldset>
		  		<legend>Personal Info</legend>
		  		<form:label path="name">
		  			Name <form:errors path="name" cssClass="error" />
		 		</form:label>
		  		<form:input path="name" />
		
		  	</fieldset>

		  	<fieldset>
               <mobi:camera id="camera" />
               <img style="height:60px;width:65px;vertical-align:middle;" id="camera-thumb" >
               <img style="float:right;height:120px;width:120px;" src="${imgPath}" >
		  	</fieldset>

			<fieldset class="checkbox">
				<legend>Request Additional Info</legend>
				<label><form:checkbox path="additionalInfo[mvc]" value="true" />on Spring MVC</label>
				<label><form:checkbox path="additionalInfo[java]" value="true" />on Java (4-ever)</label>				
			</fieldset>
		  		  		
			<p><button type="submit">Submit</button></p>




            <br/><h3>New tags </h3><br/>

            <mobi:fieldSetGroup id="parent" >
	            <mobi:fieldSetRow id="first" >
	                <h2> This element in first field set row</h2>
                </mobi:fieldSetRow>
                <mobi:fieldSetRow id="second">
                    <h3> This element is in the second row </h3>
                </mobi:fieldSetRow>
	        </mobi:fieldSetGroup>


		</form:form>


		<script type="text/javascript">

			$(document).ready(function() {
				$("#camform").submit(function() {
                    if (window.ice && ice.upload)  {
                        window.ice.handleResponse = function(data)  {
						    $("#camContent").replaceWith(unescape(data));
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
						    $("#camContent").replaceWith(html);
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