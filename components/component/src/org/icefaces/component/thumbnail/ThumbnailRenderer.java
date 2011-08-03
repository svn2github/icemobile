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

package org.icefaces.component.thumbnail;


import org.icefaces.component.utils.HTML;
import org.icefaces.component.utils.Utils;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.faces.render.Renderer;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;


public class ThumbnailRenderer extends Renderer {
    private static final Logger logger =
            Logger.getLogger(ThumbnailRenderer.class.toString());


    public void encodeBegin(FacesContext facesContext, UIComponent uiComponent)
            throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId = uiComponent.getClientId(facesContext);
        Thumbnail thumbnail = (Thumbnail) uiComponent;
        String cameraId = thumbnail.getFor();
        //if for is empty, then search for closest camera component:-
        UIComponent root = facesContext.getViewRoot();
        String parentId = cameraId;
        if (cameraId == null && logger.isLoggable(Level.WARNING)) {
            logger.warning("'for' attribute cannot be null");
        }
        UIComponent cameraComp = thumbnail.findComponent(cameraId);
        String thumbId = cameraId + "-thumb";
        if (null != cameraComp) {
            parentId = cameraComp.getClientId();
//       		logger.info("FOUND camera component = "+cameraComp.getClientId());
            thumbId = parentId + "-thumb";
        } else {
            logger.finer(" Cannot find camera component with id=" + cameraId);
        }

        // boolean disabled = thumbnail.isDisabled();
        writer.startElement("span", uiComponent);
        // write out style for input button, same as default device button.
        Utils.writeConcatenatedStyleClasses(writer, "mobi-thumb",
                thumbnail.getStyleClass());
        writer.writeAttribute(HTML.STYLE_ATTR, thumbnail.getStyle(), HTML.STYLE_ATTR);
        writer.writeAttribute(HTML.ID_ATTR, "span-thumb", null);
//        if (style != null && style.trim().length() > 0) {
//            writer.writeAttribute(HTML.STYLE_ATTR, style, HTML.STYLE_ATTR);
//        }
        writer.startElement("img", uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, thumbId, null);
        writer.writeAttribute(HTML.WIDTH_ATTR, "64", null);
        writer.writeAttribute(HTML.HEIGHT_ATTR, "64", null);

    }


    public void encodeEnd(FacesContext facesContext, UIComponent uiComponent)
            throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
//        String clientId = uiComponent.getClientId(facesContext);
//        Thumbnail thumbnail = (Thumbnail) uiComponent;

        //no javascript tag for this component

        writer.endElement("span");
        writer.endElement("img");
    }


}
