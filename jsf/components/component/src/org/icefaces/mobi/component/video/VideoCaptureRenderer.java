/*
 * Copyright 2004-2013 ICEsoft Technologies Canada Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS
 * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

package org.icefaces.mobi.component.video;


import static org.icefaces.mobi.utils.HTML.BUTTON_ELEM;
import static org.icefaces.mobi.utils.HTML.ONCLICK_ATTR;
import static org.icefaces.mobi.utils.HTML.SPAN_ELEM;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.faces.event.ValueChangeEvent;

import org.icefaces.impl.application.AuxUploadSetup;
import org.icefaces.mobi.renderkit.BaseInputResourceRenderer;
import org.icefaces.mobi.renderkit.RenderUtils;
import org.icefaces.mobi.utils.MobiJSFUtils;
import org.icemobile.util.CSSUtils;



public class VideoCaptureRenderer extends BaseInputResourceRenderer {
    //private static final Logger logger = Logger.getLogger(VideoCaptureRenderer.class.getName());

    @Override
    public void decode(FacesContext facesContext, UIComponent uiComponent) {
        VideoCapture camcorder = (VideoCapture) uiComponent;
        String clientId = camcorder.getClientId();
        if (!camcorder.isDisabled()) {
           try {
              Map<String, Object> map = new HashMap<String, Object>();
              boolean isValid = extractVideo(facesContext, map, clientId);
              if (isValid){
                 if (map !=null){
                    camcorder.setValue(map);
             //     trigger valueChange and add map as newEvent value old event is NA
                    uiComponent.queueEvent(new ValueChangeEvent(uiComponent,
                            null, map));
                }
              }

           } catch (Exception e) {
              e.printStackTrace();
           }
        }
    }

    public boolean extractVideo(FacesContext facesContext, Map map, String clientId) throws IOException {
        return MobiJSFUtils.decodeComponentFile(facesContext, clientId, map);
    }

    public void encodeEnd(FacesContext facesContext, UIComponent uiComponent)
            throws IOException {
        VideoCapture camcorder = (VideoCapture) uiComponent;
        String oldLabel = camcorder.getButtonLabel();
        if (MobiJSFUtils.uploadInProgress(camcorder))  {
            camcorder.setButtonLabel(camcorder.getCaptureMessageLabel()) ;
        } 
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId = camcorder.getClientId();
        
        RenderUtils.startButtonElem(uiComponent, writer);
        
        String script = "bridgeit.camcorder('" + clientId + "', '', "
                + "{postURL:'" + AuxUploadSetup.getInstance().getUploadURL() + "', ";
        script += "cookies:{'JSESSIONID':'" + 
            MobiJSFUtils.getSessionIdCookie(facesContext) +  "'}";
        int maxwidth = camcorder.getMaxwidth();
        if (maxwidth > 0){
            script += ", maxwidth: " + maxwidth;
        }
        int maxheight = camcorder.getMaxheight();
        if (maxheight > 0){
            script += ", maxheight:" + maxheight;
        }
        script += "});";
        writer.writeAttribute(ONCLICK_ATTR, script, null);
        
        RenderUtils.writeDisabled(uiComponent, writer);
        RenderUtils.writeStyle(uiComponent, writer);
        RenderUtils.writeStyleClassAndBase(uiComponent, writer, CSSUtils.STYLECLASS_BUTTON);
        RenderUtils.writeTabIndex(uiComponent, writer);
        
        writer.startElement(SPAN_ELEM, camcorder);
        writer.writeText(camcorder.getButtonLabel(), null);
        writer.endElement(SPAN_ELEM);
        
        writer.endElement(BUTTON_ELEM);
        camcorder.setButtonLabel(oldLabel);
    }
}
