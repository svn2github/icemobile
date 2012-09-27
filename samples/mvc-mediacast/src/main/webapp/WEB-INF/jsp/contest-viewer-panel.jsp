<%@ include file="/WEB-INF/jsp/include.jsp"%>
<div id="viewerPanel">
    <c:if test="${not empty media}">
        <push:region group="votes-${media.id}"  page="/contest-vote-tally?id=${media.id}"/>
        <div class="lightbox">
            <img id="largePhoto" src='resources/uploads/${media.largePhoto.file.name}'
                class="imageViewer" />
        </div>
        <a class="viewer-back" href="#" onclick="updateViewerPanel('${media.id}','back');"></a>
        <a class="viewer-forward" href="#" onclick="updateViewerPanel('${media.id}','forward');"></a>
        <div class="message-desc">
            <h3><c:out value="${media.description}"/></h3>
        </div>
    </c:if>
</div>