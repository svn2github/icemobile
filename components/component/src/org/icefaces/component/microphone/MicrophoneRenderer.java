/*
 * Copyright 2004-2011 ICEsoft Technologies Canada Corp. (c)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions an
 * limitations under the License.
 */

package org.icefaces.component.microphone;


import org.icefaces.mobi.utils.HTML;
import org.icefaces.mobi.utils.Utils;
import org.icefaces.impl.application.AuxUploadResourceHandler;
import org.icefaces.util.EnvUtils;


import javax.faces.component.UIComponent;
import javax.faces.render.Renderer;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.faces.event.ValueChangeEvent;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.Part;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;


public class MicrophoneRenderer extends Renderer {
    private static Logger logger = Logger.getLogger(MicrophoneRenderer.class.getName());

    @Override
    public void decode(FacesContext facesContext, UIComponent uiComponent) {
        Microphone microphone = (Microphone) uiComponent;
        String clientId = microphone.getClientId();
        if (microphone.isDisabled()) {
            return;
        }
        try {
            //MOBI-18 requirement is to decode the file from the map

            Map<String, Object> map = new HashMap<String, Object>();
            boolean valid = extractAudio(facesContext, map, clientId);
            if (valid){
               if (map !=null){
                  microphone.setValue(map);
             //   trigger valueChange and add map as newEvent value old event is NA
                  uiComponent.queueEvent(new ValueChangeEvent(uiComponent,
    		    		    null, map));
                }
            }
        } catch (Exception e) {
            logger.warning("Exception decoding audio stream: " + e);
        }
    }

    public boolean extractAudio(FacesContext facesContext, Map map, String clientId) throws IOException {
        HttpServletRequest request = (HttpServletRequest)
                facesContext.getExternalContext().getRequest();
        boolean isValid=false;

        String partUploadName = clientId;
        if (EnvUtils.isEnhancedBrowser(facesContext)){
           partUploadName+="_mic-file";
        }
        if (EnvUtils.isAuxUploadBrowser(facesContext)) {
           partUploadName+="_mic-file";
        }
        Part part = null;
        try {
            part = request.getPart(partUploadName);
        } catch (ServletException e)  {
            //ignore ServletException here since auxUpload is not multipart
        }
        if (null == part)  {
            Map auxMap = AuxUploadResourceHandler.getAuxRequestMap();
            part = (Part) auxMap.get(partUploadName);
        }
        if (part !=null){
            String contentType = part.getContentType();
            String fileName = java.util.UUID.randomUUID().toString();
            if (part.getSize()<=0){
               isValid=false;
            }else {
               isValid = true;
            }
            if ("audio/wav".equals(contentType) || "audio/x-wav".equals(contentType)) {
                fileName = fileName + ".wav";
            } else if (contentType.endsWith("mp4")) {
                fileName = fileName + ".mp4";
            } else if ("audio/x-m4a".equals(contentType)) {
                fileName = fileName + ".m4a";
            } else if ("audio/mpeg".equals(contentType)) {
                fileName = fileName + ".mp3";
            } else if ("audio/amr".equals(contentType)) {
                fileName = fileName + ".amr";
            } else {
                fileName+=".oth";
            }
            Utils.createMapOfFile(map, request, part, fileName, contentType, facesContext);

        }
        return isValid;
    }

    public void encodeBegin(FacesContext facesContext, UIComponent uiComponent)
            throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId = uiComponent.getClientId(facesContext);
        Microphone microphone = (Microphone) uiComponent;
        boolean disabled = microphone.isDisabled();
        // span as per MobI-18
        boolean isEnhanced = EnvUtils.isEnhancedBrowser(facesContext);
        boolean isAuxUpload = EnvUtils.isAuxUploadBrowser(facesContext);

        if (!isEnhanced && !isAuxUpload) {
            writer.startElement(HTML.SPAN_ELEM, uiComponent);
            writer.startElement(HTML.INPUT_ELEM, uiComponent);
            writer.writeAttribute(HTML.TYPE_ATTR, HTML.INPUT_TYPE_FILE, null);
            writer.writeAttribute(HTML.ID_ATTR, clientId, null);
            writer.writeAttribute(HTML.NAME_ATTR, clientId, null);
            writer.endElement(HTML.INPUT_ELEM);
            return;
        }
        writer.startElement(HTML.SPAN_ELEM, uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, clientId, null);
        int maxtime = microphone.getMaxtime();
        // button element
        writer.startElement("input", uiComponent);
        writer.writeAttribute(HTML.TYPE_ATTR, "button", null);
        writer.writeAttribute("id", clientId + "_mic", null);
        // write out style for input button, same as default device button.
        Utils.writeConcatenatedStyleClasses(writer,
                "mobi-button mobi-button-default",
                microphone.getStyleClass());
        writer.writeAttribute(HTML.STYLE_ATTR, microphone.getStyle(), HTML.STYLE_ATTR);
        if (disabled) {
            writer.writeAttribute("disabled", "disabled", null);
        }
        String script;
        if (isAuxUpload)  {
            script = Utils.getICEmobileSXScript("microphone",
                    clientId + "_mic");
        } else {
            script = writeJSCall(clientId, maxtime).toString();
        }
        writer.writeAttribute("onclick", script, null);

        writer.writeAttribute("value", "record", null);
        writer.endElement("input");
    }

    public void encodeEnd(FacesContext facesContext, UIComponent uiComponent)
            throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId = uiComponent.getClientId(facesContext);
        Microphone microphone = (Microphone) uiComponent;
        writer.endElement(HTML.SPAN_ELEM);
    }

    private StringBuilder writeJSCall(String clientId, int maxtime) {
        final StringBuilder script = new StringBuilder();
        script.append("if(this.value=='stop'){this.className='mobi-button mobi-button-default'; this.value='record';}");
        script.append("else{this.className='mobi-button mobi-button-default mobi-mic-stop'; this.value='stop';}");

        if (maxtime != Integer.MIN_VALUE) {
            script.append("ice.microphone( '").append(clientId).
                    append("_mic','maxtime=").append(maxtime).append("');");
        } else {
            script.append("ice.microphone( '").append(clientId).append("_mic');");
        }
        return script;
    }
}
