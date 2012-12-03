<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://www.springframework.org/tags" prefix="s"%>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form"%>
<%@ taglib uri="http://www.icemobile.org/tags" prefix="mobi"%>
<%@ taglib prefix="push"
	uri="http://www.icepush.org/icepush/jsp/icepush.tld"%>

<form:form id="mediaspotform" method="POST"
	enctype="multipart/form-data" modelAttribute="mediaspotBean"
	cssClass="form">

	<c:if test="${viewSize eq 'large'}">
		<h3>Augmented Reality</h3>
	</c:if>

	<mobi:getEnhanced />

	<mobi:geolocation id="location" name="location" />

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
			<mobi:inputText id="title" name="title" placeholder="Title"
				value="${mediaspotBean.title}" />
		</mobi:fieldsetRow>
		<mobi:fieldsetRow>
			<mobi:thumbnail for="spotcam" />
			<mobi:camera id="spotcam" style="margin-left:20px" />
		</mobi:fieldsetRow>
	</mobi:fieldsetGroup>

	<c:if test="${!ios}">
		<!-- SX on iOS auto-submits -->
		<mobi:commandButton buttonType='important' value="Submit"
			type="submit" styleClass="submit" />
	</c:if>

	<c:if test="${not empty augmentedRealityMessage}">
		<h3>Upload</h3>
		<div id="message" style="margin: 10px">${augmentedRealityMessage}</div>
		<mobi:fieldsetGroup>
			<mobi:fieldsetRow>
				<img src="${augmentedRealityUpload}" class="imageView">
			</mobi:fieldsetRow>
		</mobi:fieldsetGroup>
	</c:if>

	<h3>Augmented Reality</h3>

	<mobi:fieldsetGroup>
		<mobi:fieldsetRow styleClass="mobi-center">
			<mobi:augmentedReality id="selection"
				buttonLabel="Enter Augmented Reality">
				<c:forEach items="${locations}" var="location">
					<mobi:augmentedRealityLocation locationLabel="${location.title}"
						locationLat="${location.latitude}"
						locationLon="${location.longitude}"
						locationAlt="${location.altitude}"
						locationDir="${location.direction}"
						locationIcon="${location.fileName}" />
				</c:forEach>
			</mobi:augmentedReality>
		</mobi:fieldsetRow>
	</mobi:fieldsetGroup>

	<mobi:fieldsetGroup>
		<mobi:fieldsetRow style="text-align:left">
            Print, cut-out, then view the <a
				href="resources/images/markers.html"
				style="color: rgb(101, 149, 249); text-decoration: none">Augmented
				Reality Markers</a> 
            with 3D overlays. (This is an alpha level feature on iOS only.)
        </mobi:fieldsetRow>
		<mobi:fieldsetRow styleClass="mobi-center">
			<mobi:augmentedReality id="selection"
				buttonLabel="Augmented Reality Markers">
				<c:forEach items="${markers}" var="marker">
					<mobi:augmentedRealityMarker markerLabel="${marker.label}"
						markerModel="${marker.model}" />
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
				<img src="${augmentedRealityImage}" />

				<div style="font-style: italic">${selection}</div>
			</mobi:fieldsetRow>
		</mobi:fieldsetGroup>
	</c:if>

	<mobi:fieldsetGroup styleClass="intro">
		<mobi:fieldsetRow group="true">
			Description
		</mobi:fieldsetRow>
		<mobi:fieldsetRow>
           The augmented reality tag displays a set of labeled icons with latitude-longitude 
    	   locations via an overlay on the camera view. The selected icon label is set as the component value.
    	   The augmentedReality tag is only accessible for ICEmobile device containers. In non-container environments 
    	   the tag displays a text field input component.
        </mobi:fieldsetRow>
	</mobi:fieldsetGroup>
</form:form>

<script type="text/javascript">
	MvcUtil.enhanceForm("#mediaspotform");

	
</script>