<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="s" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form" %>
<%@ taglib uri="http://www.icemobile.org/tags" prefix="mobi" %>
<%@ taglib prefix="push" uri="http://www.icepush.org/icepush/jsp/icepush.tld"%>
<form:form id="camform" method="POST" enctype="multipart/form-data"
           modelAttribute="cameraBean" cssClass="form">
           
    <mobi:getEnhanced/>
    
    <mobi:fieldsetGroup>
        <mobi:fieldsetRow>
            <form:label path="name">
                Author: <form:errors path="name" cssClass="error"/>
            </form:label>
            <form:input path="name"/>
        </mobi:fieldsetRow>
        <mobi:fieldsetRow>
            <mobi:camera id="cam" />
            <mobi:thumbnail for="cam"/>
        </mobi:fieldsetRow>
    </mobi:fieldsetGroup>
    
    <c:if test="${!ios}"><!-- SX on iOS auto-submits -->
        <mobi:commandButton buttonType="important"
                            styleClass="submit"
                            value="Submit"
                            type="submit"/>
    </c:if>
                        
    <h3>Camera Upload</h3>
                        
    <c:if test="${not empty cameraMessage}">
        <div id="message" class="success">${cameraMessage}</div>
        <mobi:fieldsetGroup>
            <mobi:fieldsetRow>
                <img src="${cameraUpload}" class="imageView">
            </mobi:fieldsetRow>
        </mobi:fieldsetGroup>
    </c:if>
    <s:bind path="*">
        <c:if test="${status.error}">
            <div id="message" class="error">Form has errors</div>
        </c:if>
    </s:bind>
</form:form>
<script type="text/javascript">
    MvcUtil.enhanceForm("#camform");
</script>
