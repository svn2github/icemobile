<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="s" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form" %>
<%@ taglib uri="http://www.icemobile.org/tags" prefix="mobi" %>
<%@ taglib prefix="push" uri="http://www.icepush.org/icepush/jsp/icepush.tld"%>

<form:form id="mediaspotform" method="POST" enctype="multipart/form-data"
           modelAttribute="mediaspotBean" cssClass="form">
           
    <mobi:getEnhanced/>
    
    <mobi:fieldsetGroup styleClass="intro">
        <mobi:fieldsetRow>
            Use your camera to add location pictures to the
            augmented reality overlay. Touch an icon in the augmented
            reality view to select and view that image.
        </mobi:fieldsetRow>
    </mobi:fieldsetGroup>

    <h3>Add Marker Photo</h3>
    
    <mobi:fieldsetGroup>
        <mobi:fieldsetRow>
            <label>Title: </label>
            <form:input path="title" placeholder="Title"/>
        </mobi:fieldsetRow>
        <mobi:fieldsetRow>
            <mobi:geolocation id="location"/>
            <mobi:camera id="spotcam"/>
            <mobi:thumbnail for="spotcam"/>
        </mobi:fieldsetRow>
    </mobi:fieldsetGroup>
    
    <mobi:commandButton buttonType='important'
                        value="Submit"
                        type="submit"
                        styleClass="submit"/>
                        
    <h3>Augmented Reality</h3>

    <mobi:fieldsetGroup>
        <mobi:fieldsetRow>
            <mobi:augmentedReality id="selection" buttonLabel="Enter Augmented Reality">
                <c:forEach items="${locations}" var="location" >
                    <mobi:augmentedRealityLocation
                        locationLabel="${location.title}"
                        locationLat="${location.latitude}"
                        locationLon="${location.longitude}"
                        locationAlt="${location.altitude}"
                        locationDir="${location.direction}"
                        locationIcon="${location.fileName}"
                         />
                </c:forEach>
            </mobi:augmentedReality>
        </mobi:fieldsetRow>
    </mobi:fieldsetGroup>

     <s:bind path="*">
        <c:if test="${status.error}">
            <div id="message" class="error">Form has errors</div>
        </c:if>
    </s:bind>
    <c:if test="${null != selection}">
        <mobi:fieldsetGroup>
            <mobi:fieldsetRow>
                Selected location:<br />
                <img src="${imgPath}"/>

                <div style="font-style:italic">${selection}</div>
            </mobi:fieldsetRow>
        </mobi:fieldsetGroup>
    </c:if>
    

</form:form>

<script type="text/javascript">
    MvcUtil.enhanceForm("#mediaspotform");
</script>