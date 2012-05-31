
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
package org.icefaces.mobi.component.contentpane;

import org.icefaces.mobi.component.accordion.Accordion;
import org.icefaces.mobi.component.contentstack.ContentStack;
import org.icefaces.mobi.component.tabset.TabSet;
import org.icefaces.mobi.renderkit.BaseLayoutRenderer;
import org.icefaces.mobi.utils.HTML;
import org.icefaces.mobi.utils.Utils;
import org.icefaces.mobi.api.ContentPaneController;

import javax.faces.component.UIComponent;
import javax.faces.component.UIPanel;
import javax.faces.component.UIViewRoot;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.Map;


public class ContentPaneRenderer extends BaseLayoutRenderer {

    private static Logger logger = Logger.getLogger(ContentPaneRenderer.class.getName());

    public void encodeBegin(FacesContext facesContext, UIComponent uiComponent)throws IOException {
        Object parent = uiComponent.getParent();
        ContentPane pane = (ContentPane) uiComponent;
        String cacheType = checkCacheType(pane.getCacheType().toLowerCase().trim());
        if (parent instanceof Accordion){
             Accordion accordion = (Accordion)parent;
              //eventually this will be replaced by facet to allow developer to design their own?
             encodePaneAccordionHandle(facesContext, uiComponent, accordion);
        } else if (parent instanceof TabSet){
            encodeTabSetPage(facesContext, uiComponent);
        }  else {
            ResponseWriter writer = facesContext.getResponseWriter();
            String clientId = uiComponent.getClientId(facesContext);
            String contentClass = ContentPane.CONTENT_HIDDEN_CLASS.toString();
            /* write out root tag.  For current incarnation html5 semantic markup is ignored */
            writer.startElement(HTML.DIV_ELEM, uiComponent);
            writer.writeAttribute(HTML.ID_ATTR, clientId, HTML.ID_ATTR);
            // apply default style class for panel-stack  ??
            //if cacheType is client and not selected must use invisible rendering
            if (iAmSelected(facesContext, uiComponent)){
                 contentClass = ContentPane.CONTENT_BASE_CLASS.toString();
            }
            writer.writeAttribute("class", contentClass, "class");

                   // write out any users specified style attributes.
            writer.writeAttribute(HTML.STYLE_ATTR, pane.getStyle(), "style");
        }
    }

    public boolean getRendersChildren() {
        return true;
    }

    public void encodeChildren(FacesContext facesContext, UIComponent uiComponent) throws IOException{
        ContentPane pane = (ContentPane)uiComponent;
        String cacheType = checkCacheType(pane.getCacheType().toLowerCase().trim());

        //if I am clientSide, I will always be present and always render
        if (cacheType.equals("client")){
      //      logger.info("rendering the children of client cachetype="+uiComponent.getClientId(facesContext));
            Utils.renderChildren(facesContext, uiComponent);
        }
        //am I the selected pane?  Can I count on the taghandler to already have
        //things constructed?? assume so for now.
    //    logger.info("selectedId="+selectedId+" clientId="+clientId);
         else if (iAmSelected(facesContext, uiComponent)){
         //   logger.info("rendering the children of "+uiComponent.getClientId(facesContext));
            Utils.renderChildren(facesContext, uiComponent);
        }

    }


    private boolean iAmSelected(FacesContext facesContext, UIComponent uiComponent){
        Object parent = uiComponent.getParent();
        String selectedId= null;
        //might change this to just test if it implements the interface....
        if (parent instanceof ContentPaneController){
           // logger.info(" instance of ContentPaneController");
            ContentPaneController paneController = (ContentPaneController)parent;
            selectedId = paneController.getSelectedId();
            //System.out.println("iAmSelected()  id: " + uiComponent.getId() + "  selectedId: " + selectedId);
            if (null == selectedId){
                return false;
            }
        }
        else {
            logger.info("Parent must implement ContentPaneController-> has instead="+parent.getClass().getName());
            return false;
        }
        String id = uiComponent.getId();
        boolean test = id.equals(selectedId);
        return (id.equals(selectedId));
    }

    private String checkCacheType(String type){
        if (type.equals(ContentPane.CacheType.client.name())) return ContentPane.CacheType.client.name();
        if (type.equals(ContentPane.CacheType.constructed.name())) return ContentPane.CacheType.constructed.name();
        if (type.equals(ContentPane.CacheType.tobeconstructed.name())) return ContentPane.CacheType.tobeconstructed.name();
        return ContentPane.CacheType.DEFAULT.name();
    }


    private void encodeTabSetPage(FacesContext facesContext, UIComponent uiComponent)
            throws IOException{
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId = uiComponent.getClientId(facesContext);
        writer.startElement(HTML.DIV_ELEM, uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, clientId+"_wrapper", HTML.ID_ATTR);
        TabSet tabSet = (TabSet)uiComponent.getParent();
        String pageClass = TabSet.TABSET_HIDDEN_PAGECLASS.toString();
        writer.writeAttribute("class", pageClass, "class");
         /* write out root tag.  For current incarnation html5 semantic markup is ignored */
        writer.startElement(HTML.DIV_ELEM, uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, clientId, HTML.ID_ATTR);
        //if cacheType is client and not selected must use invisible rendering
    }

    public void encodeEnd(FacesContext facesContext, UIComponent uiComponent)
          throws IOException {
         ResponseWriter writer = facesContext.getResponseWriter();
      //   logger.info(" PARENT FOR SECTION END IS ="+uiComponent.getParent().getClass().getName());
         if (uiComponent.getParent() instanceof Accordion){
             writer.endElement(HTML.SECTION_ELEM);
             return;
         }
         else if (uiComponent.getParent() instanceof TabSet){
             writer.endElement(HTML.DIV_ELEM);
             writer.endElement(HTML.DIV_ELEM);
             return;
         } else {
             writer.endElement(HTML.DIV_ELEM);
         }
    }

    public void encodePaneAccordionHandle(FacesContext facesContext, UIComponent uiComponent, Accordion accordion)
        throws IOException{
        // only selected pane is open/active
         String imOpened = accordion.getCurrentId();
         String accordionId = accordion.getClientId(facesContext);
         ResponseWriter writer = facesContext.getResponseWriter();
         String clientId = uiComponent.getClientId(facesContext);
         ContentPane pane = (ContentPane) uiComponent;
         String cacheType = checkCacheType(pane.getCacheType().toLowerCase().trim());
         boolean client = false;
         if (cacheType.equals("client")){
              client=true;
         }
         String myId = pane.getId();
         String handleClass = "handle";
         String pointerClass = "pointer";
         writer.startElement(HTML.SECTION_ELEM, uiComponent);
         writer.writeAttribute(HTML.ID_ATTR, clientId, HTML.ID_ATTR);
            // apply default style class for panel-stack
         StringBuilder styleClass = new StringBuilder("closed");
         if (myId.equals(imOpened)){
             styleClass = new StringBuilder("open");
         }
               // user specified style class
         String userDefinedClass = pane.getStyleClass();
         if (userDefinedClass != null && userDefinedClass.length() > 0){
              styleClass.append(" ").append(userDefinedClass);
              handleClass+= " " + userDefinedClass;
              pointerClass+=" " + userDefinedClass;
         }
         writer.writeAttribute("class", styleClass.toString(), "class");
         writer.writeAttribute(HTML.STYLE_ATTR, pane.getStyle(), "style");
         writer.startElement(HTML.DIV_ELEM, uiComponent);
         writer.writeAttribute("class", handleClass, "class");
         writer.writeAttribute("onclick", "mobi.accordionController.toggleClient('"+accordionId+"',this,"+client+");","onclick");
        //may want to do touch support??
         writer.startElement(HTML.DIV_ELEM, uiComponent);
         writer.writeAttribute("class", pointerClass, "class");
         writer.write(Accordion.ACCORDION_RIGHT_POINTING_POINTER);
         writer.endElement(HTML.DIV_ELEM);
         String title = pane.getTitle();
         writer.write(title);
         writer.endElement(HTML.DIV_ELEM);
    }

}
