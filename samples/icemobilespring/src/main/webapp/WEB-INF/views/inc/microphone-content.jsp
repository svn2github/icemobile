<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="s" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form" %>
<%@ taglib uri="http://www.icemobile.org/tags" prefix="mobi" %>
<%@ taglib prefix="push" uri="http://www.icepush.org/icepush/jsp/icepush.tld"%>
<form:form id="micform" method="POST" enctype="multipart/form-data"
           modelAttribute="microphoneBean" >
    <mobi:fieldSetGroup inset="true">
        <mobi:fieldSetRow>
            <mobi:getEnhanced/>
        </mobi:fieldSetRow>
        <mobi:fieldSetRow>
            <form:label path="name">
                Author: <form:errors path="name" cssClass="error"/>
            </form:label>
            <form:input path="name"/>
        </mobi:fieldSetRow>
        <mobi:fieldSetRow>
            <mobi:microphone id="mic"/>
        </mobi:fieldSetRow>
    </mobi:fieldSetGroup>

    <%-- button types: default|important|attention| back--%>
    <mobi:commandButton buttonType='important'
                        style="float:right;margin-right: 25px;"
                        value="Submit"
                        type="submit"/>
    <div style="clear:both"/>
    <c:if test="${not empty message}">
        <div id="message" class="success">${message}</div>
    </c:if>
    <c:if test="${mediaReady}">
        <mobi:fieldSetGroup inset="true">
            <mobi:fieldSetRow>
                <audio src="${clipName}" controls="controls"/>
                <br><a href="${clipName}">Play</a>
            </mobi:fieldSetRow>
        </mobi:fieldSetGroup>
    </c:if>
    <s:bind path="*">
        <c:if test="${status.error}">
            <div id="message" class="error">Form has errors</div>
        </c:if>
    </s:bind>
</form:form>


<script type="text/javascript">
    MvcUtil.enhanceForm("#micform");
</script>