/*
 * Copyright 2004-2011 ICEsoft Technologies Canada Corp. (c)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions an
 * limitations under the License.
 */

package org.icefaces.component.carousel;


import org.icefaces.component.utils.HTML;
import org.icefaces.render.MandatoryResourceComponent;

import javax.faces.application.ProjectStage;
import javax.faces.application.Resource;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.faces.event.ValueChangeEvent;
import javax.faces.render.Renderer;
import java.io.IOException;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

//@MandatoryResourceComponent("org.icefaces.component.carousel.Carousel")
public class CarouselRenderer extends Renderer {
    private static Logger logger = Logger.getLogger(CarouselRenderer.class.getName());
    private static final String JS_NAME = "carousel";
    private static final String JS_LIBRARY = "org.icefaces.component.carousel";
    private static final String JS_ISCROLL = "iscroll";
    private static final String LIB_ISCROLL = "org.icefaces.component.util";

    public void decode(FacesContext facesContext, UIComponent uiComponent) {
        Map<String, String> params = facesContext.getExternalContext().getRequestParameterMap();
        Carousel carousel = (Carousel) uiComponent;
        String clientId = carousel.getClientId(facesContext);
        String hiddenField = clientId + "_hidden";
        if (params.containsKey(hiddenField)) {
            try {
                Integer selected = Integer.parseInt(params.get(hiddenField));
                int old = carousel.getSelectedItem();
                if (old != selected) {
                    carousel.setSelectedItem(selected);
                    uiComponent.queueEvent(new ValueChangeEvent(uiComponent,
                            old, selected));
                }

            } catch (NumberFormatException e) {
                logger.log(Level.WARNING, "Error creating carousel value change event.",e);
            }
        }
    }

    public void encodeBegin(FacesContext facesContext, UIComponent uiComponent) throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId = uiComponent.getClientId(facesContext);
        Carousel carousel = (Carousel) uiComponent;
        //check to ensure children are all of type OutputListItem
        writer.startElement("span", uiComponent);
        writer.writeAttribute("id", clientId+"_jscript","id");
        Map contextMap = facesContext.getViewRoot().getViewMap();
        if (!contextMap.containsKey(JS_ISCROLL)) {
            writeJSResource(JS_ISCROLL, LIB_ISCROLL, facesContext, uiComponent, writer);
        }
        if (!contextMap.containsKey(JS_NAME)) {
            writeJSResource(JS_NAME, JS_LIBRARY, facesContext, uiComponent, writer);
        }
        writer.endElement("span");
        writer.startElement(HTML.DIV_ELEM, uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, clientId + "_carousel", HTML.ID_ATTR);
        String userDefinedClass = carousel.getStyleClass();
        String styleClass = Carousel.CAROUSEL_CLASS;
        if (userDefinedClass != null) {
            styleClass += userDefinedClass;
        }
        writer.writeAttribute("class", styleClass, "styleClass");
        if (carousel.getStyle() != null) {
            writer.writeAttribute("style", carousel.getStyle(), "style");
        }
        writer.startElement(HTML.DIV_ELEM, uiComponent);
        writer.writeAttribute("class", "mobi-carousel-scroller", null);
        writer.startElement(HTML.UL_ELEM, uiComponent);
        writer.writeAttribute("class", "mobi-carousel-list", null);

    }

    private void writeJSResource(String fname, String library, FacesContext facesContext,
              UIComponent uiComponent, ResponseWriter writer) throws IOException{
        Map contextMap = facesContext.getViewRoot().getViewMap();
             //check to see if Development or Project stage
        String jsFname = fname+".js";
        if ( facesContext.isProjectStage(ProjectStage.Production)){
            jsFname = fname+"-min.js";
        }
     //   logger.info("NEED TO LOAD fname = "+jsFname);
        Resource jsFile = facesContext.getApplication().getResourceHandler().createResource(jsFname, library);
        String src = jsFile.getRequestPath();
        writer.startElement("script", uiComponent);
        writer.writeAttribute("text", "text/javascript", null);
        writer.writeAttribute("src", src, null);
        writer.endElement("script");
        contextMap.put(fname, "true");

    }



    public void encodeChildren(FacesContext facesContext, UIComponent component) throws IOException {
        //Rendering happens on encodeEnd
    }

    private void encodeCarouselList(Carousel carousel, FacesContext facesContext)
            throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
        if (carousel.getVar() != null) {
            carousel.setRowIndex(-1);
            for (int i = 0; i < carousel.getRowCount(); i++) {
                carousel.setRowIndex(i);
                writeListWrapper(carousel, writer);
                renderChildren(facesContext, carousel);
                writer.endElement(HTML.LI_ELEM);
            }
        } else if (facesContext.isProjectStage(ProjectStage.Development) ||
                logger.isLoggable(Level.FINER)) {
            logger.finer("Carousel must define the var and value attributes");
        }
        //set count attribute
        if (carousel.getRowCount() > -1) {
            carousel.setCount(carousel.getRowCount());
        }
    }

    private void renderChildren(FacesContext facesContext, UIComponent uiComponent) throws IOException {
        for (UIComponent child : uiComponent.getChildren()) {
            renderChild(facesContext, child);
        }
    }

    private void renderChild(FacesContext facesContext, UIComponent child) throws IOException {
        if (!child.isRendered()) {
            return;
        }
        //do we have to worry about encodeAll method???
        child.encodeBegin(facesContext);
        if (child.getRendersChildren()) {
            child.encodeChildren(facesContext);
        } else {
            renderChildren(facesContext, child);
        }
        child.encodeEnd(facesContext);
    }

    private void writeListWrapper(Carousel carousel, ResponseWriter writer)
            throws IOException {
        writer.startElement(HTML.LI_ELEM, null);
    }

    public void encodeEnd(FacesContext facesContext, UIComponent uiComponent)
            throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId = uiComponent.getClientId(facesContext);
        Carousel carousel = (Carousel) uiComponent;
        int selected = carousel.getSelectedItem();

        encodeCarouselList(carousel, facesContext);
        //no javascript tag for this component
        //check to ensure children are all of type OutputListItem
        writer.endElement(HTML.UL_ELEM);
        writer.endElement(HTML.DIV_ELEM);
        writer.endElement(HTML.DIV_ELEM);
        //now do the paginator for the carousel
        writer.startElement(HTML.DIV_ELEM, uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, clientId, HTML.ID_ATTR);
        writer.writeAttribute(HTML.NAME_ATTR, clientId, HTML.NAME_ATTR);
        writer.startElement(HTML.DIV_ELEM, uiComponent);
        writer.writeAttribute("class", Carousel.CAROUSEL_CURSOR_CLASS, null);
        writer.startElement(HTML.DIV_ELEM, uiComponent);
        writer.writeAttribute("class", Carousel.CAROUSEL_CURSOR_CURSOR_CENTER_CLASS, null);
        writer.startElement(HTML.UL_ELEM, null);
        writer.writeAttribute("class", Carousel.CAROUSEL_CURSOR_LISTCLASS, null);
        int size = carousel.getRowCount();
        if (selected > size - 1 || selected < 0) {
            selected = 0;
        }
        for (int i = 0; i < size; i++) {
            writer.startElement(HTML.LI_ELEM, null);
            if (selected == i) {
                writer.writeAttribute("class", "active", null);
            }
            writer.write(String.valueOf(i + 1));
            writer.endElement(HTML.LI_ELEM);
        }
        //do the list of dots for pagination
        writer.endElement(HTML.UL_ELEM);
        writer.endElement(HTML.DIV_ELEM);
        writer.endElement(HTML.DIV_ELEM);
        this.encodeHiddenSelected(facesContext, clientId, selected);
        writer.endElement(HTML.DIV_ELEM);
        renderScript(carousel, facesContext, clientId);
    }

    private void renderScript(Carousel carousel, FacesContext facesContext, String clientId) throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
        boolean singleSubmit = carousel.isSingleSubmit();
        writer.startElement("script", null);
        writer.writeAttribute("text", "text/javascript", null);
        //define mobi namespace if necessary
        writer.write("if (!window['mobi']) {" +
                " window.mobi = {};}\n");
        writer.write("ice.onLoad(function() { " +
                "mobi.carousel.loaded('" + clientId + "'," + singleSubmit + ");" +
                "});\n");
        writer.write("ice.onAfterUpdate(function() { " +
                "mobi.carousel.refresh('" + clientId + "'," + singleSubmit + ");" +
                "});\n");
        writer.write("ice.onUnload(function(){" +
                "mobi.carousel.unloaded('" + clientId + "');" +
                "});\n");
        writer.write("supportsOrientationChange = 'onorientationchange' in window," +
                "orientationEvent = supportsOrientationChange ? 'orientationchange' : 'resize';");
        writer.write("window.addEventListener(orientationEvent, function() {" +
                "  setTimeout(function () { " +
                "       mobi.carousel.refresh('" + clientId + "'," + singleSubmit + ");" +
                "  }, 100); " +
                " }, false);");
        writer.write("mobi.carousel.loaded('" + clientId + "'," +
                singleSubmit + ");");
        //  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

        //     document.addEventListener('DOMContentLoaded', setTimeout(function () { loaded(); }, 200), false);
        writer.endElement("script");
    }

    /**
     * will render it's own children
     */
    public boolean getRendersChildren() {
        return true;
    }

    private void encodeHiddenSelected(FacesContext facesContext, String id, int selectedIndex) throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
        writer.startElement("input", null);
        writer.writeAttribute("id", id + "_hidden", null);
        writer.writeAttribute("name", id + "_hidden", null);
        writer.writeAttribute("type", "hidden", null);
        writer.writeAttribute("value", String.valueOf(selectedIndex), null);
        writer.endElement("input");
    }
}
