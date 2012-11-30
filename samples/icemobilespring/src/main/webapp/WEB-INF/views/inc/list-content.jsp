<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://www.springframework.org/tags" prefix="s"%>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form"%>
<%@ taglib uri="http://www.icemobile.org/tags" prefix="mobi"%>
<%@ taglib prefix="push"
	uri="http://www.icepush.org/icepush/jsp/icepush.tld"%>
<form:form id="listform" method="POST" modelAttribute="listBean">

	<c:if test="${viewSize eq 'large'}"><h3>Lists</h3></c:if>

	<mobi:fieldsetGroup inset="true">
		<mobi:fieldsetRow>
            The outputList tag is used to display a list of data, and is commonly 
            used to generate navigation hierarchies.
        </mobi:fieldsetRow>
	</mobi:fieldsetGroup>

	<h3>List with inset and grouping</h3>

	<mobi:outputList inset="true" id="insetListWithGrouping">
		<mobi:outputListItem group="true">Winter Recreations</mobi:outputListItem>
		<mobi:outputListItem>
			<%@ include file="inc-icesailor.jsp"%>
		</mobi:outputListItem>
		<mobi:outputListItem>
			<%@ include file="inc-iceskate.jsp"%>
		</mobi:outputListItem>
		<mobi:outputListItem group="true">Winter Excursions</mobi:outputListItem>
		<mobi:outputListItem>
			<%@ include file="inc-icebreaker.jsp"%>
		</mobi:outputListItem>
		<mobi:outputListItem>
			<%@ include file="inc-icecar.jsp"%>
		</mobi:outputListItem>
	</mobi:outputList>

	<h3>List with no inset</h3>

	<mobi:outputList id="noinsetList">
		<mobi:outputListItem>
			<%@ include file="inc-icesailor.jsp"%>
		</mobi:outputListItem>
		<mobi:outputListItem>
			<%@ include file="inc-icebreaker.jsp"%>
		</mobi:outputListItem>
		<mobi:outputListItem>
			<%@ include file="inc-iceskate.jsp"%>
		</mobi:outputListItem>
		<mobi:outputListItem>
			<%@ include file="inc-icecar.jsp"%>
		</mobi:outputListItem>
	</mobi:outputList>

	<h3>Iterative list</h3>

	<mobi:outputList id="listIterator">
		<mobi:outputListItem group="true">List of cars</mobi:outputListItem>
		<c:forEach items="${listBean.carCollection}" var="currCar">
			<mobi:outputListItem>
				<div style="padding: 5px;">Car title "${currCar.title}"</div>
			</mobi:outputListItem>
		</c:forEach>
	</mobi:outputList>

</form:form>