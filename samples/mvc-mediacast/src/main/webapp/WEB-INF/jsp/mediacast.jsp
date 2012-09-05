<%@ include file="/WEB-INF/jsp/include.jsp"%>
<!DOCTYPE html >
<html>
<%@ include file="/WEB-INF/jsp/header.jsp"%>
<body>
	<mobi:pagePanel>
		<mobi:pagePanelHeader>
			<fmt:message key="heading" />
		</mobi:pagePanelHeader>
		<mobi:pagePanelBody>
			<div>
				<h4>Recently Uploaded Messages</h4>
				<form:form id="carouselForm" method="POST" modelAttribute="mediaView">
				<div style="border-top: 1px solid #999999;">
					<mobi:carousel id="recentMessagesCarousel"
						collection="${mediaStore.mediaImageMarkup}"
						selectedIndex="${mediaView.selectedIndex}"
						style="border-top: 1px solid #999999;">
						<mobi:carouselItem ref="myitem" type="java.lang.String" />
					</mobi:carousel>
				</div>
				</form:form>
			</div>
			<div style="clear:both;">
			</div>
			
			<div style="margin-top:10px;">
				<h4>Send a Media Message</h4>
				<div id="msg">${uploadModel.uploadMsg}</div>
				<div class="mobi-button-group mobi-button-group-hor ajaxShow">
					<a class="mobi-button mobi-button-default" 
						onclick="showUpload(this,'camera');">Upload a Photo</a>
					<a class="mobi-button mobi-button-default"
						onclick="showUpload(this,'camcorder');">Upload Video</a>
					<a class="mobi-button mobi-button-default" 
						onclick="showUpload(this,'mic');">Upload Audio</a>
				</div>
				<script type="text/javascript">
				function showUpload(elem,type){
					$('.upload').hide();
					$('#'+type+'Upload').show();
					$('.mobi-button').removeClass('mobi-button-selected');
					$(elem).addClass('mobi-button-selected');
				}
				</script>
				<div class="ajaxHide upload" id="cameraUpload">
					<form:form id="cameraUploadForm" method="POST" enctype="multipart/form-data"
						 modelAttribute="uploadModel">
		                <input type="hidden" name="type" value="photo"/>
		                <mobi:fieldSetGroup id="cameraUploadGrp" inset="true" style="margin-top:10px;">
		                    <mobi:fieldSetRow style="min-height:30px;">
		                    	<div>
		                         <mobi:camera id="upload"/>
		                          <div style="display:inline-block;">
		                              <mobi:thumb for="upload"/>
		                          </div>
		                         </div>
		                     </mobi:fieldSetRow>
		                     <mobi:fieldSetRow style="text-align:center;">
		                          <mobi:commandButton name="uploadPhoto"
		                                style="float:none;"
		                                buttonType="default"
		                                value="Add my photo to the message"/>
		                                
		                    </mobi:fieldSetRow>
		                </mobi:fieldSetGroup>
		            </form:form>
	            </div>
	            <div class="ajaxHide upload" id="camcorderUpload">
		            <form:form id="camcorderUploadForm" method="POST" enctype="multipart/form-data">
		                <input type="hidden" name="type" value="video"/>
		                <mobi:fieldSetGroup id="camcorderUploadGrp" inset="true" style="margin-top:10px;">
		                    <mobi:fieldSetRow style="min-height:30px;">
		                         <div>
		                         <mobi:camcorder id="camcorder"/>
		                          <div style="display:inline-block;">
		                              <mobi:thumb for="camcorder"/>
		                          </div>
		                         </div>
		                     </mobi:fieldSetRow>
		                     <mobi:fieldSetRow style="text-align:center;">
		                          <mobi:commandButton name="uploadVideo"
		                                style="float:none;"
		                                buttonType="default"
		                                value="Add my video to the message"/>
		                                
		                    </mobi:fieldSetRow>
		                </mobi:fieldSetGroup>
		            </form:form>
		        </div>
		        <div class="ajaxHide upload" id="micUpload">
		            <form:form id="micUploadForm" method="POST" enctype="multipart/form-data">
		                <input type="hidden" name="type" value="audio"/>
		                <mobi:fieldSetGroup id="micUploadGrp" inset="true" style="margin-top:10px;">
		                    <mobi:fieldSetRow style="min-height:30px;">
		                    	<div>
		                    		<mobi:microphone id="mic"/>
		                    	</div>
		                     </mobi:fieldSetRow>
		                     <mobi:fieldSetRow style="text-align:center;">
		                          <mobi:commandButton name="uploadAudio"
		                                style="float:none;"
		                                buttonType="default"
		                                value="Add my audio to the message"/>
		                                
		                    </mobi:fieldSetRow>
		                </mobi:fieldSetGroup>
		            </form:form>
		        </div>
	            
	            <form:form id="uploadForm" method="POST" modelAttribute="uploadModel">
	                <mobi:fieldSetGroup id="uploadGrp" inset="true" style="margin-top:10px;">
	                    <mobi:fieldSetRow style="min-height:30px;">
	                    	 <label for="title">Title</label>
	                         <mobi:inputtext name="title" 
	                         	styleClass="input"
	                         	type="text"
                                autoCorrect="off"
                                placeholder="Add a title.."
                                value="${uploadModel.title}"/>
	                     </mobi:fieldSetRow>
	                     <mobi:fieldSetRow style="min-height:50px;">
	                         <label for="description">Description</label>
	                         <mobi:inputtext name="description" 
	                         	styleClass="input"
	                         	type="textarea"
                                autoCorrect="off"
                                placeholder="Add some descriptive text..."
                                value="${uploadModel.description}"/>
	                     </mobi:fieldSetRow>
	                     <mobi:fieldSetRow style="min-height:50px;">
	                         <label for="description">Tags</label>
	                         <mobi:inputtext name="tags" type="text"
	                         	styleClass="input"
                                autoCorrect="off"
                                placeholder="Add some tags.."
                                value="${uploadModel.tagString}"/>
	                     </mobi:fieldSetRow>
	                     <mobi:fieldSetRow style="text-align:center;">
	                          <mobi:commandButton name="submit"
	                                style="float:none;"
	                                buttonType="default"
	                                value="Submit my message"/>
	                                
	                    </mobi:fieldSetRow>
	                </mobi:fieldSetGroup>
	                <mobi:geolocation id="geolocation"/>
	            </form:form>
            </div>
		</mobi:pagePanelBody>
		<%@ include file="/WEB-INF/jsp/footer.jsp"%>
	</mobi:pagePanel>
</body>
</html>