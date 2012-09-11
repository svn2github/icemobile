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
package org.icefaces.mobi.component.contentstack;

import org.icefaces.mobi.component.contentnavbar.ContentNavBar;
import org.icefaces.mobi.component.contentpane.ContentPane;
import org.icefaces.mobi.component.contentstackmenu.ContentStackMenuRenderer;
import org.icefaces.mobi.renderkit.BaseLayoutRenderer;
import org.icefaces.mobi.utils.HTML;
import org.icefaces.mobi.utils.Utils;

import javax.faces.application.ProjectStage;
import javax.faces.component.UIComponent;
import javax.faces.component.UIViewRoot;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.faces.event.ValueChangeEvent;
import java.io.IOException;
import java.util.Iterator;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

public class ContentStackRenderer extends BaseLayoutRenderer {

    private static Logger logger = Logger.getLogger(ContentStackRenderer.class.getName());
    private static final String JS_NAME = "layoutmenu.js";
    private static final String JS_MIN_NAME = "layoutmenu-min.js";
    private static final String JS_LIBRARY = "org.icefaces.component.layoutmenu";

    @Override
    public void decode(FacesContext facesContext, UIComponent component) {
        ContentStack stack = (ContentStack) component;
        String clientId = stack.getClientId(facesContext);
        Map<String, String> params = facesContext.getExternalContext().getRequestParameterMap();
        // ajax behavior comes from ContentStackMenu which sends the currently selected value
        String indexStr = params.get(clientId + "_hidden");
        String oldIndex = stack.getCurrentId();
        if( null != indexStr) {
            //find the activeIndex and set it
            if (!oldIndex.equals(indexStr)){
                stack.setCurrentId(indexStr);
                /* do we want to queue an event for panel change in stack? */
               // component.queueEvent(new ValueChangeEvent(component, oldIndex, indexStr)) ;
            }
        }
    }


    public void encodeBegin(FacesContext facesContext, UIComponent uiComponent)throws IOException {
         ResponseWriter writer = facesContext.getResponseWriter();
         String clientId = uiComponent.getClientId(facesContext);
         ContentStack container = (ContentStack) uiComponent;
         /* can use stack with contentNavBar so may need to write out javascript for menu */
         if ((container.getContentMenuId() == null) && hasNavBarChild(container)!=null){
            container.setNavBar(true);
         }
         else {
             container.setNavBar(false);
         }
         if (container.hasNavBar()){
             writeJavascriptFile(facesContext, uiComponent, JS_NAME, JS_MIN_NAME, JS_LIBRARY);
         }
            /* write out root tag.  For current incarnation html5 semantic markup is ignored */
         writer.startElement(HTML.DIV_ELEM, uiComponent);
         writer.writeAttribute(HTML.ID_ATTR, clientId, HTML.ID_ATTR);
         //if layoutMenu is used then another div with panes Id is used
         if (container.getContentMenuId()!=null){
             if (null == container.getSingleView()){
                 UIComponent stackMenuComp =  Utils.findChildComponent(uiComponent, container.getContentMenuId());
                 if (stackMenuComp !=null){
                    container.setSingleView(true);
                 }else {
                     container.setSingleView(false);
                 }
             }
             boolean singleView = container.getSingleView();
             if (singleView){
                 writer.writeAttribute("class", ContentStack.CONTAINER_SINGLEVIEW_CLASS, null);
             }
             writer.startElement(HTML.DIV_ELEM, uiComponent);
             writer.writeAttribute(HTML.ID_ATTR, clientId+"_panes", HTML.ID_ATTR);
             if (singleView){
                writer.writeAttribute("class", ContentStack.PANES_SINGLEVIEW_CLASS, "class" );
             }
         }
        if (container.hasNavBar()){
            writer.startElement(HTML.DIV_ELEM, uiComponent);
            writer.writeAttribute(HTML.ID_ATTR, clientId+"_panes", HTML.ID_ATTR);
        }
    }

    public boolean getRendersChildren() {
        return true;
    }

    public void encodeChildren(FacesContext facesContext, UIComponent uiComponent) throws IOException{
        //all children must be of type contentPane which takes care of rendering it's children...or not
        for (UIComponent child : uiComponent.getChildren()) {
             if (!(child instanceof ContentPane) && logger.isLoggable(Level.FINER)){
                 logger.finer("all children must be of type ContentPane");
                 return;
             }
        }
        //if don't find the one asked for just show the first one. or just leave all hidden?? TODO
        super.renderChildren(facesContext, uiComponent);
    }

    public void encodeEnd(FacesContext facesContext, UIComponent uiComponent) throws IOException {
         ResponseWriter writer = facesContext.getResponseWriter();
         ContentStack stack = (ContentStack) uiComponent;
         this.encodeHidden(facesContext, uiComponent);
         writer.endElement(HTML.DIV_ELEM);
         if (stack.getContentMenuId() !=null || stack.hasNavBar()){
             encodeScript(facesContext, uiComponent);
             writer.endElement(HTML.DIV_ELEM);
         }
    }

    private void encodeScript(FacesContext facesContext, UIComponent uiComponent) throws IOException{
            //need to initialize the component on the page and can also
        ResponseWriter writer = facesContext.getResponseWriter();
        ContentStack stack = (ContentStack) uiComponent;
        String clientId = stack.getClientId(facesContext);
        writer.startElement("span", uiComponent);
        writer.writeAttribute("id", clientId+"_initScr", "id");
        writer.startElement("script", uiComponent);
        writer.writeAttribute("text", "text/javascript", null);
        String selectedPaneId = stack.getSelectedId();
        String selectedPaneClientId = null;
        String homeId = null;
        boolean client = false;
        int hashcode = Utils.generateHashCode(System.currentTimeMillis());
        UIComponent selPane = stack.findComponent(selectedPaneId);
        StringBuilder sb = new StringBuilder("mobi.layoutMenu.initClient('").append(clientId).append("'");
        sb.append(",{stackId: '").append(clientId).append("'");
        sb.append(",selectedId: '").append(selectedPaneId).append("'");
        sb.append(", single: ").append(stack.getSingleView());
        sb.append(",hash: ").append(hashcode);
        if (null != selPane){
            selectedPaneClientId =  selPane.getClientId(facesContext);
            sb.append(",selClientId: '").append(selectedPaneClientId).append("'");
            client = ((ContentPane)selPane).isClient();
        }
        if (stack.getContentMenuId() !=null){
            UIComponent menu = stack.findComponent(stack.getContentMenuId());
            if (null!=menu){
               homeId = menu.getClientId(facesContext);
            }
            sb.append(",home: '").append(homeId).append("'");
        }
        sb.append(",client: ").append(client);
        sb.append("});");
        writer.write(sb.toString());
        writer.endElement("script");
        writer.endElement("span");
    }
    private UIComponent hasNavBarChild( UIComponent comp)  {
       if (comp instanceof ContentNavBar){
            return comp;
        }
        UIComponent child = null;
        UIComponent retComp = null;
        Iterator children = comp.getFacetsAndChildren();
        while (children.hasNext() && (retComp==null)){
            child = (UIComponent)children.next();
            if (child instanceof ContentNavBar){
                retComp = child;
                break;
            }
            retComp = hasNavBarChild(child);
            if (retComp !=null){
                break;
            }
        }
        return retComp;
    }
}
