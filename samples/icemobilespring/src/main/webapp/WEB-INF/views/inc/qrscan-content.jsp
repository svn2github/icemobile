<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://www.springframework.org/tags" prefix="s"%>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form"%>
<%@ taglib uri="http://www.icemobile.org/tags" prefix="mobi"%>
<%@ taglib prefix="push"
	uri="http://www.icepush.org/icepush/jsp/icepush.tld"%>
<form:form id="qrscanform" method="POST" modelAttribute="QRScanBean"
	cssClass="form">

	<c:if test="${viewSize eq 'large'}">
		<h3>QR Codes</h3>
	</c:if>

	<mobi:getEnhanced />

	<mobi:fieldsetGroup styleClass="intro">
		<mobi:fieldsetRow>
			The qrscan and qrcode tags are used to read or create QR codes. 
		</mobi:fieldsetRow>
	</mobi:fieldsetGroup>

	<h3>QR Code Scanner</h3>
	<mobi:fieldsetGroup>
		<mobi:fieldsetRow>
			<label>Scan QR code:</label>
			<mobi:scan id="scanOne" />
		</mobi:fieldsetRow>
		<mobi:fieldsetRow styleClass="qr">
			<label>Scanned:</label>
			<div>${QRScanBean.scanOne}</div>
		</mobi:fieldsetRow>
	</mobi:fieldsetGroup>

	<mobi:commandButton buttonType="important" styleClass="submit"
		value="Submit" type="submit" />

	<br />
	<h3>QR Code Generator</h3>

	<mobi:fieldsetGroup>
		<mobi:fieldsetRow>
			<label>Enter plain text:</label>
			<mobi:inputText value="${QRScanBean.plaintextOne}"
				name="plaintextOne" />
		</mobi:fieldsetRow>
		<mobi:fieldsetRow styleClass="qr">
			<label>QR Code:</label>
			<div>
				<mobi:qrcode value="${QRScanBean.plaintextOne}" />
			</div>
		</mobi:fieldsetRow>
	</mobi:fieldsetGroup>

	<mobi:commandButton buttonType="important" styleClass="submit"
		value="Create QRCode" type="submit" />

	<br />
	<br />
	<mobi:fieldsetGroup styleClass="intro">
		<mobi:fieldsetRow group="true">
			Description
		</mobi:fieldsetRow>
		<mobi:fieldsetRow>
			The qrscan and qrcode tags are used to read or create QR
			codes. The ICEmobile Container is needed for reading QR codes.
			<br />
			The qrscan tag accesses the device's camera to read a QR code.
			If successful, the decoded QR Code will be assigned to the backing bean.
		</mobi:fieldsetRow>
	</mobi:fieldsetGroup>
</form:form>


<script type="text/javascript">
	MvcUtil.enhanceForm("#qrscanform");
</script>
