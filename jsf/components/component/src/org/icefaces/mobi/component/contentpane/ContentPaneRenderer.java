
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

import java.io.IOException;
import java.util.logging.Logger;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;

import org.icefaces.mobi.api.ContentPaneController;
import org.icefaces.mobi.component.accordion.Accordion;
import org.icefaces.mobi.component.contentstack.ContentStack;
import org.icefaces.mobi.component.tabset.TabSet;
import org.icefaces.mobi.renderkit.BaseLayoutRenderer;
import org.icefaces.mobi.renderkit.ResponseWriterWrapper;
import org.icefaces.mobi.utils.HTML;
import org.icefaces.mobi.utils.JSFUtils;

import org.icemobile.component.IContentPane;
import org.icemobile.renderkit.ContentPaneCoreRenderer;
import org.icemobile.renderkit.IResponseWriter;


public class ContentPaneRenderer extends BaseLayoutRenderer {

    private static Logger logger = Logger.getLogger(ContentPaneRenderer.class.getName());

    public void encodeBegin(FacesContext facesContext, UIComponent uiComponent)throws IOException {
        Object parent = uiComponent.getParent();
        IContentPane pane = (IContentPane) uiComponent;
        if (parent instanceof Accordion){
            //use core renderer for accordion
            IResponseWriter writer = new ResponseWriterWrapper(facesContext.getResponseWriter());
            ContentPaneCoreRenderer renderer = new ContentPaneCoreRenderer();
            boolean amSelected = iAmSelected(facesContext, uiComponent);
            renderer.encodeBegin(pane, writer, false, amSelected);
        } else if (parent instanceof TabSet){
            encodeTabSetPage(facesContext, uiComponent);
        }  else {
            ContentStack stack = (ContentStack)parent;
            ResponseWriter writer = facesContext.getResponseWriter();
            String clientId = uiComponent.getClientId(facesContext);
            String contentClass = ContentPane.CONTENT_BASE_CLASS;
            writer.startElement(HTML.DIV_ELEM, uiComponent);
            writer.writeAttribute(HTML.ID_ATTR, clientId+"_wrp", HTML.ID_ATTR);
            String contentDeadClass = ContentPane.CONTENT_HIDDEN_CLASS.toString();
            String classToWrite = contentDeadClass;
            boolean amSelected = iAmSelected(facesContext, uiComponent);
            if (amSelected){
                classToWrite =  contentClass ;
                if (pane.getStyle() !=null){
                    writer.writeAttribute("style", pane.getStyle(), "style");
                }
            }
            /* write out root tag.  For current incarnation html5 semantic markup is ignored */
            writer.startElement(HTML.DIV_ELEM, uiComponent);
            writer.writeAttribute(HTML.ID_ATTR, clientId, HTML.ID_ATTR);
            if (stack.getStyle()!=null){
                writer.writeAttribute(HTML.STYLE_ATTR, stack.getStyle(), HTML.STYLE_ATTR);
            }
            // apply default style class for panel-stack for singleView & menu the js will do so.
            if (stack.getContentMenuId()==null || stack.getContentMenuId().equals("")) {
                writer.writeAttribute("class", classToWrite, "class");
            }else if (stack.getStyleClass()!=null){
                writer.writeAttribute(HTML.CLASS_ATTR, stack.getStyleClass(), HTML.CLASS_ATTR);

            }
        }
    }

    public boolean getRendersChildren() {
        return true;
    }

    public void encodeChildren(FacesContext facesContext, UIComponent uiComponent) throws IOException{
        ContentPane pane = (ContentPane)uiComponent;
        //if I am clientSide, I will always be present and always render
        if (pane.isClient()){
            JSFUtils.renderChildren(facesContext, uiComponent);
        }
        //am I the selected pane?  Can I count on the taghandler to already have
        //things constructed?? assume so for now.
         else if (iAmSelected(facesContext, uiComponent)){
             JSFUtils.renderChildren(facesContext, uiComponent);
        }

    }


    private boolean iAmSelected(FacesContext facesContext, UIComponent uiComponent){
        Object parent = uiComponent.getParent();
        String selectedId= null;
        //might change this to just test if it implements the interface....
        if (parent instanceof ContentPaneController){
            ContentPaneController paneController = (ContentPaneController)parent;
            selectedId = paneController.getSelectedId();
          //  logger.info("iAmSelected()  id: " + uiComponent.getId() + "  selectedId: " + selectedId);
            if (null == selectedId){
                return false;
            }
        }
        else {
            logger.info("Parent must implement ContentPaneController-> has instead="+parent.getClass().getName());
            return false;
        }
        String id = uiComponent.getId();
        return (id.equals(selectedId));
    }


    private void encodeTabSetPage(FacesContext facesContext, UIComponent uiComponent)
            throws IOException{
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId = uiComponent.getClientId(facesContext);
        ContentPane pane= (ContentPane)uiComponent;
        writer.startElement(HTML.DIV_ELEM, uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, clientId+"_wrapper", HTML.ID_ATTR);
        String pageClass = TabSet.TABSET_HIDDEN_PAGECLASS.toString();
        if (iAmSelected(facesContext, uiComponent)){
            pageClass = TabSet.TABSET_ACTIVE_CONTENT_CLASS;
        }
        writer.writeAttribute("class", pageClass, "class");
         /* write out root tag.  For current incarnation html5 semantic markup is ignored */
        writer.startElement(HTML.DIV_ELEM, uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, clientId, HTML.ID_ATTR);
        if (pane.getStyle()!=null){
            writer.writeAttribute(HTML.STYLE_ATTR, pane.getStyle(), HTML.STYLE_ATTR);
        }
        if (pane.getStyleClass() !=null){
            writer.writeAttribute(HTML.CLASS_ATTR, pane.getStyleClass(), HTML.STYLE_CLASS_ATTR);
        }
    }

    public void encodeEnd(FacesContext facesContext, UIComponent uiComponent)
          throws IOException {
        IContentPane pane = (IContentPane)uiComponent;
        if (pane.isAccordionPane()){
            IResponseWriter writer = new ResponseWriterWrapper(facesContext.getResponseWriter());
            ContentPaneCoreRenderer renderer = new ContentPaneCoreRenderer();
            renderer.encodeEnd(pane, writer, false);
            return;
        }
        ResponseWriter writer = facesContext.getResponseWriter();
        writer.endElement(HTML.DIV_ELEM);
        writer.endElement(HTML.DIV_ELEM);

    }

 /*  accordion now uses ContentPaneCoreRenderer
  public void encodePaneAccordionHandle(FacesContext facesContext, UIComponent uiComponent, Accordion accordion)
   */
        /*throws IOException{
        // only selected pane is open/active
         String imOpened = accordion.getCurrentId();
         String accordionId = accordion.getClientId(facesContext);
         ResponseWriter writer = facesContext.getResponseWriter();
         String clientId = uiComponent.getClientId(facesContext);
         ContentPane pane = (ContentPane) uiComponent;
         boolean client = pane.isClient();
         String myId = pane.getId();
         String handleClass = "handle";
         String pointerClass = "pointer";
         writer.startElement(HTML.SECTION_ELEM, uiComponent);
         writer.writeAttribute(HTML.ID_ATTR, clientId+"_sect", HTML.ID_ATTR);
            // apply default style class for panel-stack
         StringBuilder styleClass = new StringBuilder("closed");
       /*  if (myId.equals(imOpened)){
             styleClass = new StringBuilder("open");
         } */
               // user specified style class
      /*   String userDefinedClass = pane.getStyleClass();
         if (userDefinedClass != null && userDefinedClass.length() > 0){
              handleClass+= " " + userDefinedClass;
              pointerClass+=" " + userDefinedClass;
         }
    //   writer.writeAttribute("class", styleClass.toString(), "class");
         writer.writeAttribute(HTML.STYLE_ATTR, pane.getStyle(), "style");
         writer.startElement(HTML.DIV_ELEM, uiComponent);
         writer.writeAttribute(HTML.ID_ATTR, clientId+"_hndl", HTML.ID_ATTR);
         writer.writeAttribute("class", handleClass, "class");
         writer.writeAttribute("onclick", "ice.mobi.accordionController.toggleClient('"+accordionId+"',this,"+client+");","onclick");
        //may want to do touch support??
         writer.startElement(HTML.DIV_ELEM, uiComponent);
         writer.writeAttribute("class", pointerClass, "class");
         writer.write(Accordion.ACCORDION_RIGHT_POINTING_POINTER);
         writer.endElement(HTML.DIV_ELEM);
         String title = pane.getTitle();
         writer.write(title);
         writer.endElement(HTML.DIV_ELEM);
         writer.startElement(HTML.DIV_ELEM, uiComponent);
         writer.writeAttribute(HTML.ID_ATTR, clientId+"wrp", HTML.ID_ATTR);
         if (!accordion.isAutoHeight() && null != accordion.getFixedHeight()) {
            writer.writeAttribute(HTML.STYLE_ATTR, "height: "+accordion.getFixedHeight()+"; overflow-y: scroll;", HTML.STYLE_ATTR) ;
         }
         writer.startElement(HTML.DIV_ELEM, uiComponent);
         writer.writeAttribute(HTML.ID_ATTR, clientId, HTML.ID_ATTR);
    }  */

}
