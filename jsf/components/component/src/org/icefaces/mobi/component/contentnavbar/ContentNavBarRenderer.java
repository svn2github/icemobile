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

package org.icefaces.mobi.component.contentnavbar;


import org.icefaces.mobi.component.contentpane.ContentPane;
import org.icefaces.mobi.component.contentstack.ContentStack;
import org.icefaces.mobi.component.contentstackmenu.ContentStackMenu;
import org.icefaces.mobi.renderkit.BaseLayoutRenderer;
import org.icefaces.mobi.utils.HTML;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

public class ContentNavBarRenderer extends BaseLayoutRenderer {
    private static Logger logger = Logger.getLogger(ContentNavBarRenderer.class.getName());

    public void encodeBegin(FacesContext facesContext, UIComponent uiComponent)throws IOException {
        UIComponent parent = findParentContentPane(uiComponent);
        if (!(parent instanceof ContentPane) &&
            logger.isLoggable(Level.FINER)){
                 logger.finer("all children must be of type ContentPane");
                 return;
        }
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId = uiComponent.getClientId(facesContext);
        ContentNavBar navbar = (ContentNavBar) uiComponent;
        ContentPane cp = (ContentPane)parent;
        boolean client = cp.isClient();
        writer.startElement(HTML.DIV_ELEM, uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, clientId, HTML.ID_ATTR);
        StringBuilder styleClass = new StringBuilder(ContentNavBar.CONTENTNAVBAR_BASE_CLASS);
        StringBuilder menubuttonClass = new StringBuilder(ContentNavBar.CONTENTNAVBAR_BUTTON_MENU_CLASS);
        StringBuilder buttonClass = new StringBuilder (ContentNavBar.CONTENTNAVBAR_BUTTON_CLASS);
        // user specified style class
        String userDefinedClass = navbar.getStyleClass();
        if (userDefinedClass != null && userDefinedClass.length() > 0){
            styleClass.append(" ").append(userDefinedClass);
            buttonClass.append(" ").append(userDefinedClass);
            menubuttonClass.append(" ").append(userDefinedClass);
        }
        writer.writeAttribute("class", styleClass.toString(), "styleClass");
        // write out any users specified style attributes.
        if (navbar.getStyle() != null) {
            writer.writeAttribute(HTML.STYLE_ATTR, navbar.getStyle(), "style");
        }
        if (navbar.getMenuButtonLabel() !=null){
            //need to get info for onclick ..returns null if no layoutMenu though
            //also need to get menuTargetId
            if (navbar.getMenuButtonTargetId() !=null){
                String targetId = navbar.getMenuButtonTargetId();
                StringBuilder sb = getOnClickString(uiComponent, facesContext, targetId, client);
                writer.startElement(HTML.ANCHOR_ELEM, uiComponent);
                writer.writeAttribute("class",menubuttonClass , "class");
                if (sb !=null){
                   writer.writeAttribute("onclick", sb.toString(), null);
                }
                writer.write(navbar.getMenuButtonLabel());
                writer.endElement(HTML.ANCHOR_ELEM);
            }
        }
    }

    public void encodeEnd(FacesContext facesContext, UIComponent uiComponent) throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
        writer.endElement(HTML.DIV_ELEM);
    }

    public boolean getRendersChildren() {
        return true;
    }

    public void encodeChildren(FacesContext facesContext, UIComponent uiComponent) throws IOException{
        super.renderChildren(facesContext, uiComponent);
    }

    private StringBuilder getOnClickString(UIComponent comp, FacesContext facesContext,
                                          String targetId, boolean client){
        UIComponent contentStack = findParentContentStack(comp);
        if (null==contentStack){
            return null;
        }
        ContentStack stack = (ContentStack)contentStack;
        if (null == stack.getContentMenuId()) {
            return null;
        }
        String clientId = stack.getClientId(facesContext);
        //probably just need the clientId, but if wanting server side, may need ice.se
        StringBuilder sb = new StringBuilder("mobi.layoutMenu.showMenu('").append(clientId);
        sb.append("', {selectedId: '").append(targetId).append("'");
        sb.append(", singleSubmit: true");
        sb.append(", client: ").append(client);
        sb.append(", single: ").append(true); //assume single for now
        sb.append("});") ;
        return sb;
    }

}
