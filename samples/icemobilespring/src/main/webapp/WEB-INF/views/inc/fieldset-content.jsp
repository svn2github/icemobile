<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://www.springframework.org/tags" prefix="s"%>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form"%>
<%@ taglib uri="http://www.icemobile.org/tags" prefix="mobi"%>
<%@ taglib prefix="push"
	uri="http://www.icepush.org/icepush/jsp/icepush.tld"%>
<form id="fieldset">

	<h2>FieldSet Component</h2>

	<mobi:fieldsetGroup>
		<mobi:fieldsetRow group="true">
			Description
		</mobi:fieldsetRow>
		<mobi:fieldsetRow>
			<p>The fieldsetGroup component displays sets of application input
				such as for settings panels or input forms. The fieldsetComponent
				component can contain one or more child fieldsetRow components,
				which logically divides the fieldset into subsections. The component
				has an optional inset attribute which can be useful when
				distinguishing multiple fieldsetGroups on one page.</p>
		</mobi:fieldsetRow>
	</mobi:fieldsetGroup>
	<mobi:fieldsetGroup>
		<mobi:fieldsetRow group="true">
            Information
        </mobi:fieldsetRow>
		<mobi:fieldsetRow styleClass="mobi-grid">
			<label for="songs" class="mobi-col mobi-weight1" style="width: 100px">Songs</label>
			<mobi:inputText id="songs" value="2500"
				styleClass="mobi-col mobi-weight2" />
		</mobi:fieldsetRow>
		<mobi:fieldsetRow styleClass="mobi-grid">
			<label for="videos" class="mobi-col mobi-weight1"
				style="width: 100px">Videos</label>
			<mobi:inputText id="videos" value="5"
				styleClass="mobi-col mobi-weight2" />
		</mobi:fieldsetRow>
		<mobi:fieldsetRow styleClass="mobi-grid">
			<label for="photos" class="mobi-col mobi-weight1"
				style="width: 100px">Photos</label>
			<mobi:inputText id="photos" value="621"
				styleClass="mobi-col mobi-weight2" />
		</mobi:fieldsetRow>

	</mobi:fieldsetGroup>

	<mobi:fieldsetGroup>

		<mobi:fieldsetRow styleClass="mobi-grid">
			<label for="first" class="mobi-col mobi-weight1" style="width: 100px">First
				Name</label>
			<mobi:inputText id="first" value="John"
				styleClass="mobi-col mobi-weight2" />
		</mobi:fieldsetRow>
		<mobi:fieldsetRow styleClass="mobi-grid">
			<label for="last" class="mobi-col mobi-weight1" style="width: 100px">Last
				Name</label>
			<mobi:inputText id="last" value="Doe"
				styleClass="mobi-col mobi-weight2" />
		</mobi:fieldsetRow>
		<mobi:fieldsetRow styleClass="mobi-grid">
			<label for="address" class="mobi-col mobi-weight1"
				style="width: 100px">Address</label>
			<mobi:inputText id="address" value="123 Fake St."
				styleClass="mobi-col mobi-weight2" />
		</mobi:fieldsetRow>

	</mobi:fieldsetGroup>
</form>