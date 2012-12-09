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

package org.icefaces.mobi.component.accordion;

import java.io.IOException;
import java.util.Map;
import java.util.logging.Logger;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.event.ValueChangeEvent;

import org.icefaces.mobi.renderkit.BaseLayoutRenderer;
import org.icefaces.mobi.renderkit.ResponseWriterWrapper;
import org.icefaces.mobi.utils.JSFUtils;
import org.icemobile.component.IAccordion;
import org.icemobile.renderkit.AccordionCoreRenderer;
import org.icemobile.renderkit.IResponseWriter;


public class AccordionRenderer extends BaseLayoutRenderer {
    private static Logger logger = Logger.getLogger(AccordionRenderer.class.getName());

    @Override
    public void decode(FacesContext context, UIComponent component) {
         Accordion accordion = (Accordion) component;
         String clientId = accordion.getClientId(context);
         Map<String, String> params = context.getExternalContext().getRequestParameterMap();
       // no ajax behaviors defined yet
         String indexStr = params.get(clientId + "_hidden");
         if (null != indexStr){
             String submittedStr = indexStr;
             int ind = indexStr.indexOf(",");
             if (ind > -1){
                 String [] split = indexStr.split(",");
                 submittedStr = split[0];
                 accordion.setHashVal(indexStr);
             } else {
                 accordion.setHashVal(null);
             }
             if( null != submittedStr) {
                 String oldId = accordion.getSelectedId();
                 String newId = JSFUtils.getIdOfChildByClientId(context, accordion, indexStr);
                 if (null!=newId  && !newId.equals(oldId)) {
                     accordion.setSelectedId(newId);
                     component.queueEvent(new ValueChangeEvent(component, oldId, newId));
                 }
             }
         }
    }

    public void encodeBegin(FacesContext facesContext, UIComponent uiComponent)throws IOException {
        IAccordion accordion = (IAccordion)uiComponent;
        IResponseWriter writer = new ResponseWriterWrapper(facesContext.getResponseWriter());
        AccordionCoreRenderer renderer = new AccordionCoreRenderer();
        renderer.encodeBegin(accordion, writer, false);
    }

    public boolean getRendersChildren() {
        return true;
    }

    public void encodeChildren(FacesContext facesContext, UIComponent uiComponent) throws IOException{
         JSFUtils.renderChildren(facesContext, uiComponent);
    }

     public void encodeEnd(FacesContext facesContext, UIComponent uiComponent)
         throws IOException {
         IAccordion accordion = (IAccordion)uiComponent;
         IResponseWriter writer = new ResponseWriterWrapper(facesContext.getResponseWriter());
         AccordionCoreRenderer renderer = new AccordionCoreRenderer();
         renderer.encodeEnd(accordion, writer, false);
     }

}
