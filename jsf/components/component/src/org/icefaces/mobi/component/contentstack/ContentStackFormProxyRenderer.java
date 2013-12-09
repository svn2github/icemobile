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
package org.icefaces.mobi.component.contentstack;

import java.io.IOException;
import java.util.logging.Logger;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.faces.render.Renderer;

public class ContentStackFormProxyRenderer extends Renderer {

    private static final Logger logger = Logger.getLogger(ContentStackFormProxyRenderer.class.getName());

    public void encodeBegin(FacesContext facesContext, UIComponent uiComponent)throws IOException {
        //find content stack parent
        
        ContentStack stack = findParentContentStack(uiComponent);
        if( stack == null ){
            logger.warning("could not locate parent ContentStack, exiting");
            return;
        }
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId = uiComponent.getClientId(facesContext);
        writer.startElement("span", null);
        writer.writeAttribute("id", clientId, null);
        writer.startElement("input", null);
        writer.writeAttribute("type", "hidden", null);
        writer.writeAttribute("class", "mobi-contentstack-proxy", null);
        writer.writeAttribute("name", stack.getClientId() + "_hidden", null);
        String currentId = stack.getCurrentId();
        if( currentId != null && currentId.length() > 0 ){
             writer.writeAttribute("value", currentId, null);
        }
        writer.endElement("input");
        writer.endElement("span");
    }
    
    private ContentStack findParentContentStack(UIComponent uic){
        ContentStack stack = null;
        UIComponent parent = uic.getParent();
        while( parent != null ){
            if( parent instanceof ContentStack ){
                stack = (ContentStack)parent;
                break;
            }
            parent = parent.getParent();
        }
        return stack;
    }
    

    public boolean getRendersChildren() {
        return true;
    }

    
}
