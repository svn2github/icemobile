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

package org.icefaces.mobi.component.gmap;

import java.io.IOException;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;

import org.icefaces.mobi.renderkit.CoreRenderer;

public class GMapServicesRenderer extends CoreRenderer {


    /**
     * If our rendered property is true, render the beginning of the current
     * state of this UIComponent to the response contained in the specified
     * FacesContext.
     *
     * @param context The JSF Context
     * @param component The JSF Component reference
     *
     * @throws IOException - if an input/output error occurs while rendering
     */
    public void encodeBegin(FacesContext context, UIComponent component) throws IOException {

		ResponseWriter writer = context.getResponseWriter();
        GMapServices service = (GMapServices) component;
        writer.startElement("script", null);
        writer.writeAttribute("type", "text/javascript", null);
        if (service.getPoints() != null && service.getName() != null) {
            writer.write(
              String.format("mobi.gmap.getWrapper('%s').gService('%s','%s',%s);",
            	service.getParent().getClientId(context), service.getName(), 
            	service.getPoints(), service.getOptions()));
        }
        writer.endElement("script");
    }
}