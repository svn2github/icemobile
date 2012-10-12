<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="s" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form" %>
<%@ taglib uri="http://www.icemobile.org/tags" prefix="mobi" %>
<%@ taglib prefix="push" uri="http://www.icepush.org/icepush/jsp/icepush.tld"%>
<form:form id="conform" method="POST" enctype="multipart/form-data"
           modelAttribute="contactBean">
     <mobi:fetchContact id="contactOne" label="fetch Contacts"  
        multipleSelect="true"   pattern="a"
        fields="contact, phone" />


        <mobi:commandButton buttonType='important'
                            style="float:right;margin-right: 25px;"
                            value="Submit"
                            type="submit"/><br>

        <h4>Selected Contact List Echo Display</h4>
        <mobi:fieldSetGroup inset="true">
            <mobi:fieldSetRow>
                <label>Selected Contact(s):</label>
                <label style="float:right">${contactBean.contactOne}</label>
            </mobi:fieldSetRow>
        </mobi:fieldSetGroup>


    <s:bind path="*">
        <c:if test="${status.error}">
            <div id="message" class="error">Form has errors</div>
        </c:if>
    </s:bind>
</form:form>

<script type="text/javascript">
    MvcUtil.enhanceForm("#conform");
</script>