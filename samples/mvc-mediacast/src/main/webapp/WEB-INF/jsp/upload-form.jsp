<%@ include file="/WEB-INF/jsp/include.jsp"%>
<div id="uploadFormContainer">
     
    <form:form id="cameraUploadForm" method="POST" enctype="multipart/form-data" htmlEscape="true" style="text-align:center;">
        <input type="hidden" name="layout" value="${layout}"/>
        <input type="hidden" name="fullPost" id="fullPost" value="false"/>
        <input type="hidden" name="operation" id="operation"/>
        <form:errors path="*" cssClass="errorblock" element="div" />
        
        <mobi:getEnhanced/>
        
        <mobi:fieldsetGroup inset="true" style="margin-top: 10px;">
           <mobi:fieldsetRow style="font-weight: bold;text-align: center;color: #326ADB;">
                <c:choose>
                    <c:when test="${desktop}">
                        Share a photo, video clip, or audio recording with your mobile device.
                    </c:when>
                    <c:otherwise>
                        Upload a photo, video clip, or audio recording.
                    </c:otherwise>
                </c:choose>
           </mobi:fieldsetRow>
        </mobi:fieldsetGroup>
        <c:if test="${sessionScope['sxRegistered'] or enhanced}">
            <mobi:fieldsetGroup inset="true" style="margin-top: 10px;">
                 <mobi:fieldsetRow style="text-align:center;">
                    <c:if test="${!desktop and empty sessionScope['sxUpload']}">
                        <mobi:camera id="upload" style="width:70%;vertical-align:top;max-width:200px;"/>
                    </c:if>
                    <c:if test="${!sessionScope['sxRegistered']}">
                        <mobi:thumbnail for="upload" style="margin: 0 2px"/>
                    </c:if>
                    <c:if test="${not empty sxThumbnail and not empty sessionScope['sxUpload']}">
                        <img src='resources/uploads/${sxThumbnail.name}'/>
                    </c:if>
                 </mobi:fieldsetRow>
                 <mobi:fieldsetRow style="min-height:0;">
                     <mobi:inputText name="email" 
                        styleClass="input"
                        type="email"
                        autoCorrect="off"
                        placeholder="Email"
                        value="${email}"/>
                 </mobi:fieldsetRow>
                 <mobi:fieldsetRow style="min-height:0;">
                     <mobi:inputText name="description" 
                        styleClass="input"
                        type="textarea"
                        autoCorrect="off"
                        placeholder="Description"/>
                 </mobi:fieldsetRow>
                 <mobi:fieldsetRow style="text-align:center;">
                    <div id="msg" style="margin: 0 0 8px 0;font-size:12px;color:#326ADB;font-weight:bold;">${msg}</div>
                    <input type="submit" class="mobi-button mobi-button-default"
                           value="Cancel" style="width:100px;margin-top:0;margin-bottom:0;"
                           onclick="$('#operation').val('cancel')"/>
                    <input type="submit" class="mobi-button mobi-button-important"
                           value="Share" style="float:none;width:100px;margin-top:0;margin-bottom:0;"
                           onclick="$('#fullPost').val(true)" ${desktop ? "disabled='disabled'" : ""}/>
                </mobi:fieldsetRow>
            </mobi:fieldsetGroup>
        </c:if>
        <mobi:fieldsetGroup inset="true" style="padding:10px;">
            <mobi:fieldsetRow style="text-align:center;padding:0;">
            Learn more about ICEmobile video, audio, QR code, augmented reality
            and rich UI features at <a href="http://www.icesoft.org/projects/ICEmobile/overview.jsf">www.icesoft.org/projects/ICEmobile/</a>.
            </mobi:fieldsetRow>
        </mobi:fieldsetGroup>
    </form:form>
    <script type="text/javascript">
        enhanceForm("#cameraUploadForm","#uploadFormContainer");
        window.onhashchange = function()  {
            if ("#icemobilesx" === window.location.hash)  {
                window.location.hash = "";
                window.location.reload();
            }
        }
        window.scrollTo(0, 0);
    </script>
</div>