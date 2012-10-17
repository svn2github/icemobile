/*
 * Copyright 2004-2012 ICEsoft Technologies Canada Corp.
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

package org.icefaces.mobi.component.scan;


import java.io.IOException;
import java.util.Map;
import java.util.logging.Logger;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;

import org.icefaces.impl.application.AuxUploadResourceHandler;
import org.icefaces.mobi.renderkit.BaseInputRenderer;
import org.icefaces.mobi.renderkit.ResponseWriterWrapper;
import org.icefaces.mobi.utils.HTML;
import org.icefaces.mobi.utils.JSFUtils;
import org.icefaces.mobi.utils.MobiJSFUtils;
import org.icefaces.util.EnvUtils;
import org.icemobile.renderkit.DeviceCoreRenderer;


public class ScanRenderer extends BaseInputRenderer {
    private static Logger logger = Logger.getLogger(ScanRenderer.class.getName());

    @Override
    public void decode(FacesContext facesContext, UIComponent uiComponent) {
        Scan scan = (Scan) uiComponent;
        String clientId = scan.getClientId();
        if (scan.isDisabled()) {
            return;
        }
        Map requestParameterMap = facesContext.getExternalContext()
                .getRequestParameterMap();
        String valueId = clientId;
        Object submitted = requestParameterMap.get(valueId);
        if (null == submitted)  {
            Map auxMap = AuxUploadResourceHandler.getAuxRequestMap();
            submitted = auxMap.get(valueId);
        }
        if (null != submitted) {
            String submittedString = String.valueOf(submitted);
            if (submittedString != null){
                Object convertedValue = this.getConvertedValue(facesContext, uiComponent, submittedString);
                this.setSubmittedValue(scan, convertedValue);
            }

        }
    }

    public void encodeEnd(FacesContext facesContext, UIComponent uiComponent)
            throws IOException {
        Scan scan = (Scan) uiComponent;
       if (MobiJSFUtils.uploadInProgress(scan))  {
           scan.setButtonLabel(scan.getCaptureMessageLabel()) ;
        }
        DeviceCoreRenderer renderer = new DeviceCoreRenderer();
        ResponseWriterWrapper writer = new ResponseWriterWrapper(facesContext.getResponseWriter());
        renderer.encode(scan, writer);
    }
    /*    boolean disabled = scan.isDisabled();
        // span as per MobI-18
        boolean isEnhanced = EnvUtils.isEnhancedBrowser(facesContext);
        boolean isAuxUpload = EnvUtils.isAuxUploadBrowser(facesContext);
        if (!isEnhanced && !isAuxUpload) {
            writer.startElement(HTML.SPAN_ELEM, uiComponent);
            writer.startElement(HTML.INPUT_ELEM, uiComponent);
            writer.writeAttribute(HTML.TYPE_ATTR, HTML.INPUT_TYPE_TEXT, null);
            writer.writeAttribute(HTML.ID_ATTR, clientId, null);
            writer.writeAttribute(HTML.NAME_ATTR, clientId, null);
            writer.endElement(HTML.INPUT_ELEM);
            return;
        }
        writer.startElement(HTML.SPAN_ELEM, uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, clientId, null);
        writer.startElement(HTML.INPUT_ELEM, uiComponent);
        writer.writeAttribute(HTML.TYPE_ATTR, "button", null);
        writer.writeAttribute(HTML.ID_ATTR, clientId + "-button", null);
        writer.writeAttribute(HTML.VALUE_ATTR, "Scan QR Code", null);
        JSFUtils.writeConcatenatedStyleClasses(writer,
                "mobi-button mobi-button-default",
                scan.getStyleClass());
        writer.writeAttribute(HTML.STYLE_ATTR, scan.getStyle(), HTML.STYLE_ATTR);
        if (disabled) {
            writer.writeAttribute("disabled", "disabled", null);
        }
        String script;
        if (isAuxUpload)  {
            script = MobiJSFUtils.getICEmobileSXScript("scan", uiComponent);
        } else {
            script = "ice.scan('" + clientId + "');";
        }
        writer.writeAttribute("onclick", script, null);
        writer.endElement(HTML.INPUT_ELEM);
    }

  /*  public void encodeEnd(FacesContext facesContext, UIComponent uiComponent)
            throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
        writer.endElement(HTML.SPAN_ELEM);
    } */

}
