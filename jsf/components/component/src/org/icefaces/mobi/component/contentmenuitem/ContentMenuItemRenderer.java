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
package org.icefaces.mobi.component.contentmenuitem;


import java.io.IOException;
import java.util.Arrays;
import java.util.Map;
import java.util.logging.Logger;

import javax.faces.application.FacesMessage;
import javax.faces.component.UIComponent;
import javax.faces.component.visit.VisitCallback;
import javax.faces.component.visit.VisitContext;
import javax.faces.component.visit.VisitResult;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.faces.event.ActionEvent;

import org.icefaces.mobi.component.contentnavbar.ContentNavBar;
import org.icefaces.mobi.component.contentpane.ContentPane;
import org.icefaces.mobi.component.contentstack.ContentStack;
import org.icefaces.mobi.component.contentstackmenu.ContentStackMenu;
import org.icefaces.mobi.renderkit.BaseLayoutRenderer;
import org.icefaces.mobi.utils.HTML;
import org.icefaces.mobi.utils.JSFUtils;


public class  ContentMenuItemRenderer extends BaseLayoutRenderer {
    private static final Logger logger = Logger.getLogger(ContentMenuItemRenderer.class.getName());
    
    private static final String CLOSED = "closed";
    private static final String HANDLE = "handle ui-bar-b";
    private static final String POINTER = "pointer";

    public void decode(FacesContext facesContext, UIComponent uiComponent) {
        Map<String,String> requestParameterMap = facesContext.getExternalContext().getRequestParameterMap();
        ContentMenuItem item = (ContentMenuItem) uiComponent;
        String source = String.valueOf(requestParameterMap.get("ice.event.captured"));
        String clientId = item.getClientId();
        if (clientId.equals(source) ) {
            //try {
                if (!item.isDisabled()) {
                    uiComponent.queueEvent(new ActionEvent(uiComponent));
                    UIComponent parent = item.getParent();
                    ContentStack stack = null;
                    if (parent instanceof ContentStackMenu) {
                        ContentStackMenu menu = (ContentStackMenu)parent;
                        stack = menu.getContentStack();                        
                    } else if (parent instanceof ContentNavBar){
                        stack = (ContentStack)findParentContentStack(uiComponent);
                    }
                    if (null != stack){
                        String newVal = String.valueOf(item.getValue());
                        stack.setCurrentId(newVal);
                    }
                }
                /*
            } catch (Exception e) {
               
                logger.warning("Error queuing CommandButton event" + e);
            }*/
        }
    }

    public void encodeEnd(FacesContext facesContext, UIComponent uiComponent)
             throws IOException {
         UIComponent parent = uiComponent.getParent();
         if (!(parent instanceof ContentStackMenu) && !(parent instanceof ContentNavBar)){
             logger.warning("ContentMenuItem must have parent of ContentStackMenu or ContentNavBa");
             return;
         }
         if (parent instanceof ContentStackMenu){
             renderItemAsList((ContentStackMenu)parent, facesContext, uiComponent);
         }
         if (parent instanceof ContentNavBar){
             renderItemAsButton((ContentNavBar)parent, facesContext, uiComponent);
         }
    }

    private void renderItemAsButton(UIComponent parent, FacesContext facesContext, UIComponent uiComponent)
        throws IOException {
        ContentMenuItem item = (ContentMenuItem)uiComponent;
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId=item.getClientId(facesContext);
        String stackClientId = null;
        StringBuilder menubuttonClass = new StringBuilder(ContentNavBar.CONTENTNAVBAR_BUTTON_MENU_CLASS);
        StringBuilder buttonClass = new StringBuilder (ContentNavBar.CONTENTNAVBAR_BUTTON_CLASS);
        UIComponent stack = findParentContentStack(uiComponent);
        // user specified style class
        String userDefinedClass = item.getStyleClass();
        if (userDefinedClass != null && userDefinedClass.length() > 0){
            buttonClass.append(" ").append(userDefinedClass);
            menubuttonClass.append(" ").append(userDefinedClass);
        }
        if (item.isDisabled()){
            writer.writeAttribute("disabled", "disabled", null);
        }
        if (item.getUrl() != null && !item.isDisabled()){
            writer.writeAttribute("href", getResourceURL(facesContext,item.getUrl()), null);
        } else {
            if (stack!=null){
                if (item.getValue() !=null){
                    stackClientId = stack.getClientId(facesContext);
                    String valId = String.valueOf(item.getValue());
                    UIComponent pane = null;
                    if( valId != null && valId.length() > 0){
                        pane = stack.findComponent(valId);
                    }
                    writer.startElement(HTML.DIV_ELEM, uiComponent);
                    writer.writeAttribute(HTML.ID_ATTR, clientId, HTML.ID_ATTR);
                    writer.startElement(HTML.ANCHOR_ELEM, uiComponent);
                    writer.writeAttribute("class",menubuttonClass , "class");
                    if (item.getStyle() !=null){
                     writer.writeAttribute(HTML.STYLE_ATTR, item.getStyle(), HTML.STYLE_ATTR);
                    }
                    StringBuilder sb = new StringBuilder("mobi.layoutMenu.showContent('").append(stackClientId);
                    sb.append("', event");
                    sb.append(",{ currentId: '").append(item.getValue()).append("'");
                    sb.append(",singleSubmit: ").append(item.isSingleSubmit());
                    sb.append(", source: '").append(item.getClientId(facesContext)).append("'");
                    if (pane!=null){
                        ContentPane cp = (ContentPane)pane;
                        sb.append(",client: ").append(cp.isClient());
                    }
                    sb.append("});");
                    if ( !item.isDisabled()){
                          writer.writeAttribute("onclick", sb.toString(), null);
                    }
                    String icon = item.getIcon();
                    String iconPlacement = item.getIconPlacement();
                    if( icon != null && "left".equals(iconPlacement) ){
                        writeIcon(writer, icon, iconPlacement);
                    }
                    String label = item.getLabel();
                    if( icon != null && "right".equals(iconPlacement) ){
                        writeIcon(writer, icon, iconPlacement);
                    }
                    if (isLabelEmpty(label)){
                        label= valId;  //make it the value if label is null
                    }
                    writer.write(label);
                    writer.endElement(HTML.ANCHOR_ELEM);
                    writer.endElement(HTML.DIV_ELEM);
                }
            }
        }
    }
 
    private void writeIcon(ResponseWriter writer, String icon, String placement)
        throws IOException{
        writer.startElement("i", null);
        writer.writeAttribute(HTML.CLASS_ATTR, "icon-" + icon, null);
        writer.endElement("i");
    }


    /**
     * option to render an item with value of null as either a heading or accordion handle
     * @param parent
     * @param facesContext
     * @param uiComponent
     * @throws IOException
     */
    private void renderItemAsList(ContentStackMenu contentStackMenu, FacesContext facesContext, UIComponent uiComponent)
            throws IOException{
        ContentStack contentStack = contentStackMenu.getContentStack();
        ContentMenuItem menuItem = (ContentMenuItem)uiComponent;
        boolean client = false;
        boolean accordion = contentStackMenu.isAccordion();
        String contentPaneId = (String)menuItem.getValue();
        String contentPaneClientId = null;
        if( contentStack == null ){
            FacesMessage msg = new FacesMessage("Could not find the associated ContentStack");
            FacesContext.getCurrentInstance().addMessage(contentStackMenu.getClientId(), msg);
            logger.warning("Could not find the associated ContentStack for contentStackMenu: " + contentStack);
            return;
        }
        //find the clientId of the selected Pane
        if ( contentPaneId != null){
            ContentPane contentPane = (ContentPane)JSFUtils.findComponent(contentPaneId, null);
            if( contentPane != null ){
                contentPaneClientId = contentPane.getClientId();
                client = contentPane.isClient();
            }
            else {
                logger.warning("Unable to find contentPane with id="+contentPaneId);
            }
        }
        String label = menuItem.getLabel();
        if (isLabelEmpty(label)){
            label="";
        }
        String url = menuItem.getUrl();
 
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId = menuItem.getClientId(facesContext);
        StringBuilder baseClass = new StringBuilder(ContentMenuItem.OUTPUTLISTITEMDEFAULT_CLASS);
        StringBuilder disabledClass = new StringBuilder(ContentMenuItem.DISABLED_STYLE_CLASS);
        StringBuilder groupClass = new StringBuilder(ContentMenuItem.OUTPUTLISTITEMGROUP_CLASS);
        StringBuilder itemClass = new StringBuilder(ContentMenuItem.OUTPUTLISTITEM_CLASS);
        String userDefClass = menuItem.getStyleClass();
        if (null != userDefClass){
            baseClass.append(" ").append(userDefClass);
            groupClass.append(" ").append(userDefClass);
            disabledClass.append(" ").append(userDefClass);
            itemClass.append(" ").append(userDefClass);
        }
 
        String icon = menuItem.getIcon();
        String iconPlacement = menuItem.getIconPlacement();
 
        if (null==contentPaneId && url==null) {   // must be a heading or accordion label
            if (accordion){
                this.writeTitleAsAccordionHandle(facesContext, menuItem, contentStackMenu, label);
            } else {
                writeItemListStart(uiComponent, writer, clientId);
                writer.writeAttribute("class", groupClass, "class");
                if (menuItem.getStyle() !=null){
                    writer.writeAttribute(HTML.STYLE_ATTR, menuItem.getStyle(), HTML.STYLE_ATTR);
                }
                writer.startElement(HTML.DIV_ELEM, uiComponent);
                writer.writeAttribute("class", baseClass, "class");
                if( icon != null && "left".equals(iconPlacement) ){
                    writeIcon(writer, icon, iconPlacement);
                }
                writer.write(label);
                if( icon != null && "right".equals(iconPlacement) ){
                    writeIcon(writer, icon, iconPlacement);
                }
                writer.endElement(HTML.DIV_ELEM);
                writer.endElement(HTML.LI_ELEM);
            }
        }
        else {  //otherwise has url or value
            if( accordion && !contentStackMenu.isOpenAccordionHandle()){
                startAccordionSection(menuItem, label, contentStackMenu, writer);
            }
            writeItemListStart(uiComponent, writer, clientId);
            writer.writeAttribute("class", itemClass, "class");
            if (menuItem.getStyle() !=null){
                writer.writeAttribute(HTML.STYLE_ATTR, menuItem.getStyle(), HTML.STYLE_ATTR);
            }
            if (menuItem.isDisabled()){
                writer.writeAttribute("disabled", "true", null);
                baseClass.append(" ").append(disabledClass);
            }
            writer.startElement(HTML.DIV_ELEM, uiComponent);
            writer.writeAttribute("class", baseClass, "class");
            writer.startElement(HTML.ANCHOR_ELEM, uiComponent);
            writer.writeAttribute(HTML.CLASS_ATTR, "ui-link-inherit", null);
            //verify location of panel and get proper id of the contentPane for onclick
            // if url or target then put that in the onclick  otherwise use the value lmi.getValue()
            if (!menuItem.isDisabled() && url != null){
                writer.writeAttribute("href", getResourceURL(facesContext, url), null);
            }
            else {
                StringBuilder sb = new StringBuilder("mobi.layoutMenu.showContent('").append(contentStack.getClientId()).append("', event");
                sb.append(",{ currentId: '").append(menuItem.getValue()).append("'");
                sb.append(",singleSubmit: ").append(menuItem.isSingleSubmit());
                sb.append(",client: ").append(client);
                sb.append(", source: '").append(uiComponent.getClientId(facesContext)).append("'");
                sb.append("});");
                if (contentStack != null && !menuItem.isDisabled()){
                    writer.writeAttribute("onclick", sb.toString(), null);
                }
            }
            if( icon != null && "left".equals(iconPlacement) ){
                writeIcon(writer, icon, iconPlacement);
            }
            writer.write(label);
            if( icon != null && "right".equals(iconPlacement) ){
                writeIcon(writer, icon, iconPlacement);
            }
            writer.endElement(HTML.ANCHOR_ELEM);
            writer.endElement(HTML.DIV_ELEM);
            writer.endElement(HTML.LI_ELEM);
        }
    }

    private void writeItemListStart(UIComponent uiComponent, ResponseWriter writer, String clientId) throws IOException {
        writer.startElement(HTML.LI_ELEM, uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, clientId, HTML.ID_ATTR);
        writer.writeAttribute(HTML.NAME_ATTR, clientId, HTML.NAME_ATTR);
    }
    
    private void startAccordionSection(ContentMenuItem menuItem, String label, ContentStackMenu menu,
           ResponseWriter writer) throws IOException{
        writer.startElement(HTML.DIV_ELEM, menuItem);
        String chId = menuItem.getClientId();
        writer.writeAttribute(HTML.ID_ATTR, chId+"_sect", HTML.ID_ATTR);
        writer.writeAttribute("class", CLOSED, null);
        if( menuItem.getValue() == null ){
            writer.startElement(HTML.DIV_ELEM, null);
            writer.writeAttribute(HTML.ID_ATTR, chId+"_hndl", null );
            writer.writeAttribute("class", HANDLE, null);
            writer.writeAttribute("onclick", "ice.mobi.accordionController.toggleMenu('" + menu.getClientId() + "',this);", "onclick");
            writer.startElement(HTML.SPAN_ELEM, menuItem);
            writer.writeAttribute("class", POINTER, null);
            writer.endElement(HTML.SPAN_ELEM);
            writer.write(label);
            writer.endElement(HTML.DIV_ELEM);
        }
        writer.startElement(HTML.DIV_ELEM, menuItem);
        writer.writeAttribute("class", ContentStackMenu.LAYOUTMENU_CLASS, null);
        writer.startElement(HTML.UL_ELEM, menuItem);
        writer.writeAttribute("class", ContentStackMenu.LAYOUTMENU_LIST_CLASS, null);
        menu.setOpenAccordionHandle(true);
    }
    
    private void endAccordionSection(ContentStackMenu menu, ResponseWriter writer) throws IOException{
        writer.endElement(HTML.UL_ELEM);
        writer.endElement(HTML.DIV_ELEM);
        writer.endElement(HTML.DIV_ELEM);
        menu.setOpenAccordionHandle(false);
    }

    private void writeTitleAsAccordionHandle(FacesContext context, ContentMenuItem menuItem,
        ContentStackMenu menu, String label) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        if (menu.isOpenAccordionHandle()){
            endAccordionSection(menu, writer);
        }
        startAccordionSection(menuItem, label, menu, writer);
        
    }

    public String findCompIntree(FacesContext context, UIComponent compRoot, String id){
        String searchId =null;
        if( id != null && id.length() > 0 ){
            UIComponent searchComp = compRoot.findComponent(id);
            if (null!=searchComp){
                return searchComp.getClientId();
            }
            compRoot.visitTree(
                    VisitContext.createVisitContext(context, Arrays.asList(new String[] {id}), null),
                            new GetClientId(searchId));
        }
        return searchId;
     }

     private static class GetClientId implements VisitCallback {
         private String _clientId=null;
         String searchId;

         private GetClientId(String searchId){
             this.searchId = searchId;
         }
         public String getClientId(){
              return _clientId;
         }
         public VisitResult visit( VisitContext visitContext, UIComponent uiComponent){
             if (uiComponent instanceof ContentStack || uiComponent instanceof ContentPane){
                 _clientId  = uiComponent.getId();
                     return VisitResult.COMPLETE;
             }
             return VisitResult.ACCEPT;
         }
     }
     private boolean isLabelEmpty(String label){
         return (label==null || label.trim().equals("null") || label.length()<1);
     }
}
