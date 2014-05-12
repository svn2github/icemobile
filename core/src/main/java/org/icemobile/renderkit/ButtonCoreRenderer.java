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

package org.icemobile.renderkit;

import static org.icemobile.util.HTML.CLASS_ATTR;
import static org.icemobile.util.HTML.DISABLED_ATTR;
import static org.icemobile.util.HTML.DIV_ELEM;
import static org.icemobile.util.HTML.ID_ATTR;
import static org.icemobile.util.HTML.INPUT_ELEM;
import static org.icemobile.util.HTML.NAME_ATTR;
import static org.icemobile.util.HTML.ONCLICK_ATTR;
import static org.icemobile.util.HTML.SPAN_ELEM;
import static org.icemobile.util.HTML.STYLE_ATTR;
import static org.icemobile.util.HTML.TYPE_ATTR;
import static org.icemobile.util.HTML.VALUE_ATTR;

import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.icemobile.component.IButton;
import org.icemobile.util.CSSUtils;
import org.icemobile.util.ClientDescriptor;

public class ButtonCoreRenderer extends BaseCoreRenderer {
    private static final Logger logger =
            Logger.getLogger(ButtonCoreRenderer.class.toString());

    public void encodeEnd(IButton component, IResponseWriter writer, boolean disableOffline)
            throws IOException {
        IButton  button = (IButton) component;
        ClientDescriptor client = button.getClient();
        String clientId = button.getClientId();
        // apply button type style classes
        StringBuilder baseClass = new StringBuilder(CSSUtils.STYLECLASS_BUTTON);
        String buttonType = button.getButtonType();
        /* apply selected state if any
         * if openContentPane is used, then this may not work correctly as
         * the commandButtonGroup requires a submit and openContentPane does
         * not guarantee one.
         */
        if (button.isSelectedButton() || button.isSelected()) {
            baseClass.append(IButton.SELECTED_STYLE_CLASS);
        }
        // apply disabled style state if specified.
        if (button.isDisabled()) {
            baseClass.append(" ").append(IButton.DISABLED_STYLE_CLASS);
        }
        String style = button.getStyle();
        if( style != null ){
            style = style.trim();
            if( style.length() == 0){
                style = null;
            }
        }
        // assign button type
        if( buttonType != null && !"".equals(buttonType)){
            if (IButton.BUTTON_TYPE_UNIMPORTANT.equals(buttonType)) {
                baseClass.append(IButton.UNIMPORTANT_STYLE_CLASS);
            } else if (IButton.BUTTON_TYPE_BACK.equals(buttonType)) {
                baseClass.append(IButton.BACK_STYLE_CLASS);
            } else if (IButton.BUTTON_TYPE_ATTENTION.equals(buttonType)) {
                baseClass.append(IButton.ATTENTION_STYLE_CLASS);
            } else if (IButton.BUTTON_TYPE_IMPORTANT.equals(buttonType)) {
                baseClass.append(IButton.IMPORTANT_STYLE_CLASS);
            } else if( !"default".equalsIgnoreCase(buttonType) && logger.isLoggable(Level.WARNING)) {
                logger.warning("unsupported button type: '" + buttonType + "' for "+ clientId);
            }
        }

        String styleClass = button.getStyleClass();
        if (styleClass != null) {
            baseClass.append(" ").append(styleClass);
        }

        String type = button.getType();
        // button type for styling purposes, otherwise use pass through value.
        if (type == null){
            type = IButton.BUTTON_DEFAULT;
        }

        if (IButton.BUTTON_TYPE_BACK.equals(buttonType) && client.isIOS6()){
            writer.startElement(DIV_ELEM, button);
            writer.writeAttribute(ID_ATTR, clientId+"_ctr");
            writer.writeAttribute(CLASS_ATTR, baseClass.toString());
            // should be auto base though
            if (style != null ) {
                writer.writeAttribute(STYLE_ATTR, style);
            }
            writer.startElement(SPAN_ELEM, button);
            writer.endElement(SPAN_ELEM);
        }
        writer.startElement(INPUT_ELEM, component);
        writer.writeAttribute(ID_ATTR, clientId);
        writer.writeAttribute(VALUE_ATTR, button.getValue());
        //style and class written to ctr div when back button
        if (!IButton.BUTTON_TYPE_BACK.equals(buttonType) || !client.isIOS6()){
            writer.writeAttribute(CLASS_ATTR, baseClass.toString());
            // should be auto base though
            if (style != null ) {
                writer.writeAttribute(STYLE_ATTR, style);
            }
        }
        /*
        check on type?
         */
        writer.writeAttribute(TYPE_ATTR, type);
        String name = clientId;
        if (button.getName()!=null){
            name=button.getName();
        }
        writer.writeAttribute(NAME_ATTR, name);

        if (button.isDisabled()) {
            writer.writeAttribute(DISABLED_ATTR, "disabled");
            writer.endElement(INPUT_ELEM);
            //end ctr div for back button
            if (IButton.BUTTON_TYPE_BACK.equals(button.getButtonType()) && client.isIOS6()){
                writer.endElement(DIV_ELEM);
            }
            return;
        }
        /*
         *  if button manipulates contentStack all other attributes except those for
         *  styling apply --don't bother putting this in the core renderer.
         */
        if (button.getOpenContentPane()!=null){
            if( button.getJsCall() != null ){
                writer.writeAttribute(ONCLICK_ATTR, button.getJsCall().toString());
            }
            else{
                logger.warning("commandButton specified openContentPane: '" + button.getOpenContentPane() 
                        + "', but client side JavaScript handler not set");
            }
        }else if ( !button.getType().trim().toLowerCase().equals(IButton.BUTTON_SUBMIT)){
            StringBuilder sb = new StringBuilder((disableOffline? "if(navigator.offline)return;": "")+
                    "ice.mobi.button.select('");
            sb.append(clientId).append("', event, {");
            sb.append("singleSubmit: ").append(button.isSingleSubmit());
            if (null !=button.getParams() && button.getParams().trim()!="") {
                sb.append(", params: ").append(button.getParams());
            }
            if (null != button.getGroupId()){
                sb.append(", groupId: '").append(button.getGroupId()).append("'");
            }
            if (null != button.getPanelConfirmation()){
                sb.append(", pcId: '").append(button.getPanelConfirmationId()).append("'");
            }
            if (null != button.getSubmitNotification()){
                sb.append(", snId: '").append(button.getSubmitNotificationId()).append("'");
            }
            if (button.isParentDisabled()){
                sb.append(", pDisabled: ").append(button.isParentDisabled());
            }
            if (null != button.getBehaviors()){
                sb.append(button.getBehaviors());
            }
            sb.append("});");
            writer.writeAttribute(ONCLICK_ATTR, sb.toString());
        }/* else {
            logger.info(" NO ON CLICK HANDLER ");
        } */
        writer.endElement(INPUT_ELEM);
        /*
        last thing to do is to check if back button and then end the ctr div with b elem.
         */
        if (IButton.BUTTON_TYPE_BACK.equals(button.getButtonType()) && client.isIOS6()){
            writer.startElement("b", button);
            writer.writeAttribute(CLASS_ATTR, "mobi-button-placeholder");
            Object oVal2 = button.getValue();
            if (null != oVal2) {
                String value = oVal2.toString();
                writer.writeText(value);
            }
            writer.endElement("b");
            writer.endElement(DIV_ELEM);
        }

    }


}
