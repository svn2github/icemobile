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

package org.icefaces.mobi.component.list;


import org.icefaces.mobi.utils.HTML;
import org.icemobile.util.CSSUtils;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.faces.render.Renderer;
import java.io.IOException;
import java.util.logging.Logger;


public class OutputListItemRenderer extends Renderer {
    private static Logger logger = Logger.getLogger(OutputListItemRenderer.class.getName());

    public void encodeBegin(FacesContext facesContext, UIComponent uiComponent)
            throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId = uiComponent.getClientId(facesContext);
        OutputListItem item = (OutputListItem) uiComponent;

        writer.startElement(HTML.LI_ELEM, uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, clientId, HTML.ID_ATTR);
        String userDefinedClass = item.getStyleClass();
        String styleClass = OutputListItem.OUTPUTLISTITEM_CLASS + " " + CSSUtils.STYLECLASS_BTN_UP_A ;
        if (item.isGroup()) {
            styleClass = OutputListItem.OUTPUTLISTITEMGROUP_CLASS + " " + CSSUtils.STYLECLASS_BAR_B;
            if (userDefinedClass != null) {
                styleClass += " " + userDefinedClass;
            }
        } else {
            if (userDefinedClass != null) {
                styleClass += " " + userDefinedClass;
            }
        }
        writer.writeAttribute("class", styleClass, "styleClass");
        if (item.getStyle() !=null){
             writer.writeAttribute(HTML.STYLE_ATTR, item.getStyle(), HTML.STYLE_ATTR);
        }
        writer.startElement(HTML.DIV_ELEM, uiComponent);
        writer.writeAttribute("class", OutputListItem.OUTPUTLISTITEMDEFAULT_CLASS, null);
    }

    public void encodeEnd(FacesContext facesContext, UIComponent uiComponent)
            throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
        writer.endElement(HTML.DIV_ELEM);
        writer.endElement(HTML.LI_ELEM);
    }

}
