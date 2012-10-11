<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="s" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form" %>
<%@ taglib uri="http://www.icemobile.org/tags" prefix="mobi" %>
<%@ taglib prefix="push" uri="http://www.icepush.org/icepush/jsp/icepush.tld"%>
<p>
    ICEmobile Camera Push Region Sample
</p>
<form:form id="campushrform" method="POST" enctype="multipart/form-data"
           modelAttribute="cameraBean">
    <mobi:fieldSetGroup>
        <mobi:fieldSetRow>
            <mobi:getEnhanced/>
        </mobi:fieldSetRow>
    </mobi:fieldSetGroup>
    <div class="header">
        <h4>Form</h4>
        <c:if test="${not empty message}">
            <div id="message" class="success">${message}<br/>
                <img style="height:60px;width:60px;" src="${imgPath}">
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
            Name <form:errors path="name" cssClass="error"/>
        </form:label>
        <form:input path="name"/>

    </fieldset>

    <fieldset>
        <mobi:camera id="cam"/>
        <mobi:thumb for="cam"/>
        <push:region group="camPush" page="/camregion"/>
    </fieldset>

    <fieldset class="checkbox">
        <legend>Request Additional Info</legend>
        <label><form:checkbox path="additionalInfo[mvc]" value="true"/>on
            Spring MVC</label>
        <label><form:checkbox path="additionalInfo[java]" value="true"/>on
            Java (4-eva)</label>
    </fieldset>

    <p>
        <button type="submit">Submit</button>
    </p>


    <br/>

    <h3>New tags </h3><br/>

    <mobi:fieldSetGroup id="parent">
        <mobi:fieldSetRow id="first">
            <h4> This element in first field set row</h4>
        </mobi:fieldSetRow>
        <mobi:fieldSetRow id="second">
            <h3> This element is in the second row </h3>
        </mobi:fieldSetRow>
    </mobi:fieldSetGroup>


</form:form>

<script type="text/javascript">
    MvcUtil.enhanceForm("#campushrform");
</script>
