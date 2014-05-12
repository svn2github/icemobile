/*
 * Copyright 2004-2014 ICEsoft Technologies Canada Corp.
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
package org.icefaces.mobi.renderkit;

import javax.faces.application.ResourceHandler;
import javax.faces.context.FacesContext;
import javax.faces.render.Renderer;

public class MobileBaseRenderer extends Renderer  {
    public static final String COMPRESS_IDS = "org.icemobile.compressIDs";

    public String convertClientId(FacesContext context, String clientId) {
        boolean compressID = "true".equalsIgnoreCase(
            context.getExternalContext().getInitParameter(COMPRESS_IDS));
        if (!compressID)  {
            return clientId;
        }
        long extendedHash = clientId.hashCode();
        return Long.toString(extendedHash, 36);
    }
    protected String getResourceURL(FacesContext facesContext, String value) {
        if (value.contains(ResourceHandler.RESOURCE_IDENTIFIER)) {
            return value;
        } else {
            String url = facesContext.getApplication().getViewHandler().getResourceURL(facesContext, value);

            return facesContext.getExternalContext().encodeResourceURL(url);
        }
    }
}
