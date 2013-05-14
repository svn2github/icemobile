<%--
  ~ Copyright 2004-2013 ICEsoft Technologies Canada Corp.
  ~
  ~ Licensed under the Apache License, Version 2.0 (the "License");
  ~ you may not use this file except in compliance with the
  ~ License. You may obtain a copy of the License at
  ~
  ~ http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing,
  ~ software distributed under the License is distributed on an "AS
  ~ IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
  ~ express or implied. See the License for the specific language
  ~ governing permissions and limitations under the License.
  --%>

<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://www.springframework.org/tags" prefix="s"%>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form"%>
<%@ taglib uri="http://www.icemobile.org/tags" prefix="mobi"%>
<%@ taglib prefix="push"
    uri="http://www.icepush.org/icepush/jsp/icepush.tld"
%>
<form:form id="videoPlayerForm" method="POST">

    <mobi:fieldsetGroup>
       <mobi:fieldsetRow>
           <label class="ui-input-text">Preload video</label>
           <select name="preLoad" style="float:right">
              <option value="none" ${videoBean.preload=='none' ? 'selected' : ''}>none</option>
              <option value="auto" ${videoBean.preload=='auto' ? 'selected' : ''}>auto</option>
              <option value="metadata" ${videoBean.preload=='metadata' ? 'selected' : ''}>metadata</option>
          </select>&#160;
       </mobi:fieldsetRow>
       <mobi:fieldsetRow>
           <label class="ui-input-text">Video Controls: </label>
           <mobi:flipswitch id="fs2" labelOn="true" labelOff="false" style="float:right"
                            name="controls" value="${videoBean.controls}"/>&#160;
       </mobi:fieldsetRow>
       <mobi:fieldsetRow>
           <label class="ui-input-text">Loop video: </label>
           <mobi:flipswitch id="fs3" labelOn="true" labelOff="false" style="float:right"
                            name="loop" value="${videoBean.loop}"/>&#160;
       </mobi:fieldsetRow>
       <mobi:fieldsetRow>
           <label class="ui-input-text">Auto play video:</label>
           <mobi:flipswitch id="fs4" labelOn="true" labelOff="false" style="float:right"
                            name="autoPlay" value="${videoBean.autoPlay}"/>&#160;
       </mobi:fieldsetRow>
       <mobi:fieldsetRow>
           <label class="ui-input-text">Mute audio:</label>
           <mobi:flipswitch id="mutfs" labelOn="true" labelOff="false" style="float:right"
                            name="muted" value="${videoBean.muted}"/>&#160;
       </mobi:fieldsetRow>
        <mobi:fieldsetRow>
            <label class="ui-input-text">Link label:</label>
            <mobi:inputText name="linkLabel" type="text" autoCorrect="off" style="width:50%;float:right"
                placeholder="Link label" value="${videoBean.linkLabel}" />
        </mobi:fieldsetRow>
    </mobi:fieldsetGroup>
    
    <mobi:commandButton buttonType="important" styleClass="submit"
            value="Submit" type="submit" />
            
    <h3>Video Player</h3>

    <mobi:fieldsetGroup>
        <mobi:fieldsetRow style="text-align:center">
            <mobi:videoPlayer id="videoOne"
                            url="${videoBean.src}"
                            style="width:50%"
                            type="${videoBean.type}"
                            loop = "${videoBean.loop}"
                            preload="${videoBean.preload}"
                            muted="${videoBean.muted}"
                            linkLabel="${videoBean.linkLabel}"
                            controls="${videoBean.controls}"/>
        </mobi:fieldsetRow>
    </mobi:fieldsetGroup>
    
</form:form>


<script type="text/javascript">
    MvcUtil.enhanceForm("#videoPlayerForm");
    mobi.AjaxRequest = function( options){
        if (options.jspForm){
            $(options.jspForm).submit();
        }
    };
</script>
