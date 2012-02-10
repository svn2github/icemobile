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
package org.icefaces.mobi.component.button;

import org.icefaces.mobi.utils.HTML;
import org.icefaces.mobi.utils.Utils;
import org.icefaces.mobi.renderkit.CoreRenderer;

import javax.faces.component.UIComponent;
import javax.faces.component.behavior.ClientBehaviorHolder;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.faces.event.ActionEvent;
import javax.faces.render.Renderer;
import javax.faces.component.UIParameter;
import java.io.IOException;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.List;


public class CommandButtonRenderer extends CoreRenderer {
    private static Logger logger = Logger.getLogger(CommandButtonRenderer.class.getName());
    List <UIParameter> uiParamChildren;

    public void decode(FacesContext facesContext, UIComponent uiComponent) {
        Map requestParameterMap = facesContext.getExternalContext().getRequestParameterMap();
        CommandButton commandButton = (CommandButton) uiComponent;
        String source = String.valueOf(requestParameterMap.get("ice.event.captured"));
        String clientId = commandButton.getClientId();
        if (clientId.equals(source)) {
            try {
                if (!commandButton.isDisabled()) {
                    uiComponent.queueEvent(new ActionEvent(uiComponent));
                }
            } catch (Exception e) {
                logger.warning("Error queuing CommandButton event");
            }
        }
    }

    public void encodeBegin(FacesContext facesContext, UIComponent uiComponent)
            throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId = uiComponent.getClientId(facesContext);
        CommandButton commandButton = (CommandButton) uiComponent;
        uiParamChildren = Utils.captureParameters( commandButton );
        // root element
        writer.startElement(HTML.INPUT_ELEM, uiComponent);
        writer.writeAttribute(HTML.ID_ATTR, clientId, HTML.ID_ATTR);

        // apply button type style classes
        StringBuilder baseClass = new StringBuilder(CommandButton.BASE_STYLE_CLASS);
        String buttonType = commandButton.getButtonType();
        // assign button type
        if (CommandButton.BUTTON_TYPE_DEFAULT.equals(buttonType)) {
            baseClass.append(CommandButton.DEFAULT_STYLE_CLASS);
        } else if (CommandButton.BUTTON_TYPE_BACK.equals(buttonType)) {
            baseClass.append(CommandButton.BACK_STYLE_CLASS);
        } else if (CommandButton.BUTTON_TYPE_ATTENTION.equals(buttonType)) {
            baseClass.append(CommandButton.ATTENTION_STYLE_CLASS);
        } else if (CommandButton.BUTTON_TYPE_IMPORTANT.equals(buttonType)) {
            baseClass.append(CommandButton.IMPORTANT_STYLE_CLASS);
        } else if (logger.isLoggable(Level.FINER)) {
            baseClass.append(CommandButton.DEFAULT_STYLE_CLASS);
        }
        // apply selected state if any
        if (commandButton.isSelected()) {
            baseClass.append(CommandButton.SELECTED_STYLE_CLASS);
        }
        // apply disabled style state if specified.
        if (commandButton.isDisabled()) {
            baseClass.append(" ").append(CommandButton.DISABLED_STYLE_CLASS);
        }
        // append any user specific style attributes
        String styleClass = commandButton.getStyleClass();
        if (styleClass != null) {
            baseClass.append(" ").append(styleClass);
        }
        writer.writeAttribute(HTML.CLASS_ATTR, baseClass.toString(), null);

        // should be auto base though
        String style = commandButton.getStyle();
        if (style != null && style.trim().length() > 0) {
            writer.writeAttribute(HTML.STYLE_ATTR, style, HTML.STYLE_ATTR);
        }
        String type = commandButton.getType();
        // button type for styling purposes, otherwise use pass through value.
        if (type == null){
            type = "button";
        }
        writer.writeAttribute(HTML.TYPE_ATTR, type, null);
        writer.writeAttribute(HTML.NAME_ATTR, clientId, null);
        String value = type;
        Object oVal = commandButton.getValue();
        if (null != oVal) {
            value = oVal.toString();
        }
        writer.writeAttribute(HTML.VALUE_ATTR, value, HTML.VALUE_ATTR);
    }

    public void encodeEnd(FacesContext facesContext, UIComponent uiComponent)
            throws IOException {
        ResponseWriter writer = facesContext.getResponseWriter();
        String clientId = uiComponent.getClientId(facesContext);
        CommandButton commandButton = (CommandButton) uiComponent;
        boolean singleSubmit = commandButton.isSingleSubmit();
        String params = "'"+clientId+"'";
        if (uiParamChildren != null) {
             params += ","+ Utils.asParameterString(uiParamChildren);
        }
        ClientBehaviorHolder cbh = (ClientBehaviorHolder)uiComponent;
        boolean hasBehaviors = !cbh.getClientBehaviors().isEmpty();

        if (commandButton.isDisabled()) {
            writer.writeAttribute("disabled", "disabled", null);
        } else {
            StringBuilder builder = new StringBuilder(255);
            if (hasBehaviors){
                String cbhCall = this.buildAjaxRequest(facesContext, cbh, commandButton.getDefaultEventName());
                builder.append(cbhCall);
            } else if (singleSubmit) {
                builder.append("ice.se(event, ").append(params).append(");");
            } else {//default is standard submit
                builder.append("ice.s(event, ").append(params).append(");");
            }
            writer.writeAttribute(HTML.ONCLICK_ATTR, builder.toString(), null);
        }

        writer.endElement(HTML.INPUT_ELEM);
    }
}
