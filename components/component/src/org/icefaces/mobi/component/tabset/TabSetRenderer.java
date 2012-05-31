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
package org.icefaces.mobi.component.tabset;

import org.icefaces.mobi.component.contentpane.ContentPane;
import org.icefaces.mobi.renderkit.BaseLayoutRenderer;
import org.icefaces.mobi.utils.HTML;
import org.icefaces.mobi.utils.Utils;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.faces.event.ValueChangeEvent;
import java.io.IOException;
import java.util.Map;
import java.util.logging.Logger;
import java.util.logging.Level;

public class TabSetRenderer extends BaseLayoutRenderer {
    private static Logger logger = Logger.getLogger(TabSetRenderer.class.getName());
    private static final String JS_NAME = "tabset.js";
    private static final String JS_MIN_NAME = "tabset-min.js";
    private static final String JS_LIBRARY = "org.icefaces.component.tabset";

    @Override
    public void decode(FacesContext context, UIComponent component) {
         TabSet tabset = (TabSet) component;
         String clientId = tabset.getClientId(context);
         Map<String, String> params = context.getExternalContext().getRequestParameterMap();
       // no ajax behavior defined yet
         String indexStr = params.get(clientId + "_hidden");
         logger.info("indexStr = "+indexStr);
         //with some panes having client cacheType, the oldIndex on server
         // may not match that of the client, so decode the last
         if( null != indexStr) {
             try {
                 String delims= "[,]";
                 String[] indices = indexStr.split(delims);
                 if (indices.length >1 ){
                   //  logger.info(" first index submitted="+indices[0]+" second="+indices[1]);
                     int oldClientInd = Integer.parseInt(indices[0]);
                     int index = Integer.parseInt(indices[1]);
                     if (oldClientInd!=index){
                         String oldId = component.getChildren().get(oldClientInd).getId();
                         String newId = component.getChildren().get(index).getId();
                         tabset.setCurrentId(newId);
                         component.queueEvent(new ValueChangeEvent(component, oldId, newId)) ;
                         tabset.setUpdatePropScriptTag(true);
                         //TO Do decode behaviors for mobi ajax support
                     }
                 }
             } catch (NumberFormatException nfe){
                  if (logger.isLoggable(Level.FINER)){
                   logger.finer("problem decoding tabIndex from client");
                  }
             }
         }
         else {
             tabset.setUpdatePropScriptTag(false);
         }

     }

    public void encodeBegin(FacesContext facesContext, UIComponent uiComponent)throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId = uiComponent.getClientId(facesContext);
        TabSet tabset = (TabSet) uiComponent;
        writeJavascriptFile(facesContext, uiComponent, JS_NAME, JS_MIN_NAME, JS_LIBRARY);
        /* write out root tag.  For current incarnation html5 semantic markup is ignored */
        writer.startElement(HTML.DIV_ELEM, uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, clientId, HTML.ID_ATTR);
        // apply default style class
        StringBuilder styleClass = new StringBuilder(TabSet.TABSET_CONTAINER_CLASS);
        // user specified style class
        String userDefinedClass = tabset.getStyleClass();
        if (userDefinedClass != null && userDefinedClass.length() > 0){
                styleClass.append(" ").append(userDefinedClass);
        }
        writer.writeAttribute("class", styleClass.toString(), "styleClass");
        // write out any users specified style attributes.
        writer.writeAttribute(HTML.STYLE_ATTR, tabset.getStyle(), "style");
        encodeTabs(facesContext, uiComponent);
        writer.startElement(HTML.DIV_ELEM, uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, clientId+"_tabContent", HTML.ID_ATTR);
        writer.writeAttribute("class", TabSet.TABSET_CONTENT_CLASS.toString(), null);
    }

    public boolean getRendersChildren() {
        return true;
    }
    public void encodeChildren(FacesContext facesContext, UIComponent uiComponent) throws IOException{
        Utils.renderChildren(facesContext, uiComponent);
    }
    public void encodeTabs(FacesContext facesContext, UIComponent uiComponent ) throws IOException {
        TabSet controller = (TabSet) uiComponent;
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId= controller.getClientId(facesContext);
        writer.startElement(HTML.DIV_ELEM, uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, clientId+"_tabs", HTML.ID_ATTR);
        writer.writeAttribute("class", TabSet.TABSET_TABS_CLASS.toString(), "class");

        int tabsNum = uiComponent.getChildCount();
        if (tabsNum <=0 ){
                if (logger.isLoggable(Level.FINER)){
                   logger.finer(" no contentPane children for this component. Please read DOCS");
                }
            writer.endElement(HTML.DIV_ELEM);
            return;
        }

        TabSet.IdIndex idIndex = controller.resolveCurrentIdAndIndex();

        writer.startElement(HTML.UL_ELEM, uiComponent);
        writer.writeAttribute("data-current", idIndex.getIndex(), null);
        for (int i=0; i< tabsNum; i++){
            //check to see that children are of type contentPane
            UIComponent child = (UIComponent)controller.getChildren().get(i);
            if (child instanceof ContentPane) {
                ContentPane cp = (ContentPane)child;
                boolean client = false;
                if (cp.getCacheType().equals(ContentPane.CacheType.client.name())) {
                    client = true;
                }
                String height = controller.getFixedHeight();
                writer.startElement(HTML.LI_ELEM, uiComponent);
                writer.writeAttribute(HTML.ID_ATTR, clientId+"tab_"+i, HTML.ID_ATTR);
                StringBuilder sb = new StringBuilder("mobi.tabsetController.showContent('").append(clientId);
                sb.append("', this, ").append("{");
                sb.append("singleSubmit: true, tIndex: ").append(i);
                if (null!=height){
                    sb.append(",height: ").append(height);
                }
                sb.append(",client: ").append(client);
                sb.append("});");
                writer.writeAttribute("onclick", sb.toString(), "onclick");
                if (cp.getId().equals(idIndex.getId())){
                    writer.writeAttribute("class", TabSet.TABSET_ACTIVETAB_CLASS, "class");
                }
                String title = cp.getTitle();
                writer.write(title);
                writer.endElement(HTML.LI_ELEM);
            }//else log an error statement ?
        }
        writer.endElement(HTML.UL_ELEM);
        writer.endElement(HTML.DIV_ELEM);
    }

     public void encodeEnd(FacesContext facesContext, UIComponent uiComponent)
        throws IOException {
         ResponseWriter writer = facesContext.getResponseWriter();
         encodeHidden(facesContext, uiComponent);
         writer.endElement(HTML.DIV_ELEM);  //end of content div
         writer.endElement(HTML.DIV_ELEM);  //end of tabset container
         encodeScript(facesContext, uiComponent);
     }

     public void encodeScript(FacesContext context, UIComponent uiComponent) throws IOException {
        //need to initialize the component on the page and can also
        ResponseWriter writer = context.getResponseWriter();
        TabSet tabset = (TabSet) uiComponent;
        TabSet.IdIndex idIndex = tabset.resolveCurrentIdAndIndex();
        String clientId = tabset.getClientId(context);
        writer.startElement("span", uiComponent);
        writer.writeAttribute("id", clientId + "_script", "id");
        writer.startElement("script", null);
        writer.writeAttribute("text", "text/javascript", null);
        StringBuilder cfg = new StringBuilder("{singleSubmit: ");
        cfg.append(tabset.isSingleSubmit());
   /*     boolean autoheight = tabset.isAutoHeight();  */
        cfg.append(", tIndex: ").append(idIndex.getIndex());
        if (tabset.isUpdatePropScriptTag()){
             cfg.append(", stmp: ").append(System.currentTimeMillis());
        }
        cfg.append("}");
         //just have to add behaviors if we are going to use them.
        writer.write("mobi.tabsetController.initClient('" + clientId + "'," +cfg.toString()+");");
        writer.endElement("script");
        writer.endElement("span");
    }
}
