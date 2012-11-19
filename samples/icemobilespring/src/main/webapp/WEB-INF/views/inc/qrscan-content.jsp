<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="s" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form" %>
<%@ taglib uri="http://www.icemobile.org/tags" prefix="mobi" %>
<%@ taglib prefix="push" uri="http://www.icepush.org/icepush/jsp/icepush.tld"%>
<form:form id="qrscanform" method="POST" modelAttribute="QRScanBean" cssClass="form">

    <mobi:getEnhanced/>
    
    <mobi:fieldsetGroup>
        <mobi:fieldsetRow>
            <label>Scan QR code:</label>
            <mobi:scan id="scanOne"/>
        </mobi:fieldsetRow>
        <mobi:fieldsetRow styleClass="qr">
            <label>Scanned:</label>
            <div>${QRScanBean.scanOne}</div>
        </mobi:fieldsetRow>
    </mobi:fieldsetGroup>
    
    <mobi:commandButton buttonType="important"
                       styleClass="submit"
                       value="Submit"
                       type="submit"/>

</form:form>


<script type="text/javascript">
    MvcUtil.enhanceForm("#qrscanform");
</script>
