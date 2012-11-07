<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="s" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form" %>
<%@ taglib uri="http://www.icemobile.org/tags" prefix="mobi" %>
<%@ taglib prefix="push" uri="http://www.icepush.org/icepush/jsp/icepush.tld"%>
<form:form id="inputtextform" method="POST" modelAttribute="inputTextBean" cssClass="form">

    <mobi:fieldsetGroup>
        <mobi:fieldsetRow>
            <label>Text:</label>
            <mobi:inputText name="text" type="text"
                            autoCorrect="off"
                            placeholder="Text input"
                            value="${inputTextBean.text}"/>
        </mobi:fieldsetRow>
        <mobi:fieldsetRow>
            <label>Number:</label>
            <mobi:inputText name="number" type="number"
                            autoCorrect="off"
                            placeholder="Number"
                            value="${inputTextBean.number}"/>
        </mobi:fieldsetRow>
        <mobi:fieldsetRow>
            <label>Text area:</label>
            <mobi:inputText name="textarea" type="textarea"
                            style="width:99%;float:none;"
                            autoCorrect="off"
                            placeholder="Text area"
                            value="${inputTextBean.textarea}"/>
        </mobi:fieldsetRow>
        <mobi:fieldsetRow>
            <label>Password:</label>
            <mobi:inputText name="password" type="password"
                            autoCorrect="off"
                            placeholder="Password input"
                            value="${inputTextBean.password}"/>
        </mobi:fieldsetRow>
        <mobi:fieldsetRow>
            <label>Date</label>
            <mobi:inputText name="date" type="date"
                            autoCorrect="off"
                            placeholder="yyyy-mm-dd"
                            value="${inputTextBean.date}"/>
        </mobi:fieldsetRow>
    </mobi:fieldsetGroup>
    
    <mobi:commandButton buttonType='important'
                        styleClass="submit"
                        value="Submit"
                        type="submit"/>

    <h4>Input Values</h4>
    <mobi:fieldsetGroup>
        <mobi:fieldsetRow>
            <label>Text:</label>
            <span>${inputTextBean.text}</span>
        </mobi:fieldsetRow>
        <mobi:fieldsetRow>
            <label>Number:</label>
            <span>${inputTextBean.number}</span>
        </mobi:fieldsetRow>
        <mobi:fieldsetRow>
            <label>Text area:</label>
            <span>${inputTextBean.textarea}</span>
        </mobi:fieldsetRow>
        <mobi:fieldsetRow>
            <label>Password:</label>
            <span>${inputTextBean.password}</span>
        </mobi:fieldsetRow>
        <mobi:fieldsetRow>
            <label>Date</label>
            <span>${inputTextBean.date}</span>
        </mobi:fieldsetRow>
    </mobi:fieldsetGroup>

</form:form>

<script type="text/javascript">
    MvcUtil.enhanceForm("#inputtextform");
</script>
