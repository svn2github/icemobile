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
 
package org.icemobile.jsp.tags;

import static org.icemobile.util.HTML.*;

import java.io.IOException;

import javax.servlet.http.HttpSession;
import javax.servlet.jsp.JspException;

import org.icemobile.component.IDevice;
import org.icemobile.renderkit.DeviceCoreRenderer;
import org.icemobile.util.ClientDescriptor;

public class DeviceTag extends BaseBodyTag implements IDevice{
    private static final String CONTAINER_ONCLICK = "ice.%s('%s');";
    private static final String CONTAINER_ONCLICK_PARAMS = "ice.%s('%s','%s');";
    private static final String CAMERA = "camera";
    private static final String CAMCORDER = "camcorder";

    String command = "undefined";
    String label = "unlabeled";
    String params = null;
    String fallbackType = "file";

    public int doEndTag() throws JspException {
        ClientDescriptor client = getClient();
        /* going to use DeviceCoreRenderer for camera and camcorder
           so need to put code specific to them first so can call it
           to do the work
          */
            DeviceCoreRenderer renderer = new DeviceCoreRenderer();
            try {
                renderer.encode(this, new TagWriter(pageContext));
            }catch (IOException e) {
                throw new JspException(e);
            }
            return EVAL_PAGE;
    }


    public void writeStandardAttributes(TagWriter writer) throws IOException  {
    	writeStandardAttributes(writer,true);      
    }
    
    public void writeStandardAttributes(TagWriter writer, boolean enhancedOrIOS) throws IOException  {
    	StringBuilder inputStyle = new StringBuilder(enhancedOrIOS ? CommandButtonTag.BASE_STYLE_CLASS : "");
        if (disabled){
            inputStyle.append(CommandButtonTag.DISABLED_STYLE_CLASS);
        }
        if (null != styleClass)  {
            inputStyle.append(" ").append(styleClass);
        }
        if( inputStyle.length() > 0 ){
            writer.writeAttribute(CLASS_ATTR, inputStyle);
        }
        if (null != style)  {
            writer.writeAttribute(STYLE_ATTR, style);
        }
        if (disabled)  {
            writer.writeAttribute(DISABLED_ATTR, "disabled");
        }
    }
    
    /* non-enhanced, non-ios clients only have a file upload rendered, so this does
     * not include the mobi-button style class, which can't be used on input[type='file']
     */
    public void writeStandardAttributesForNonEnhanced(TagWriter writer) throws IOException  {
    	writeStandardAttributes(writer,false);
    }


    public boolean isDisabled() {
        return disabled;
    }

    public void setDisabled(boolean disabled) {
        this.disabled = disabled;
    }
    private boolean isUseCookie = true;
    private String buttonLabel;
    private String captureMessageLabel;
    private int maxheight = Integer.MIN_VALUE;
    private int maxwidth = Integer.MIN_VALUE;
    private boolean isUseNative;

    public String getSessionId(){
         HttpSession session = getRequest().getSession();
         return session.getId();
    }
    public String getComponentType(){
          return command;
    }
    public boolean isUseCookie(){
        return true;
    }
    public String getButtonLabel() {
        if (buttonLabel != null) {
            return buttonLabel;
        }else {
            return label;
        }
    }

    public void setButtonLabel(String buttonLabel) {
        this.buttonLabel = buttonLabel;
    }

    public int getMaxheight() {
        return maxheight;
    }

    public void setMaxheight(int maxheight) {
        this.maxheight = maxheight;
    }

    public int getMaxwidth() {
        return maxwidth;
    }

    public void setMaxwidth(int maxwidth) {
        this.maxwidth = maxwidth;
    }

    public boolean isUseNative() {
        return isUseNative;
    }

    public void setUseNative(boolean useNative) {
        isUseNative = useNative;
    }

    public String getScript(String id, boolean isSx){
        if (null != params)  {
             return String.format(CONTAINER_ONCLICK_PARAMS, command, id, params);
        }
        else{
             return String.format(CONTAINER_ONCLICK, command, id);
        }
    }
    public String getClientId() {
        return id;
    }
    public String getParams() {
        return this.params;
    }

}