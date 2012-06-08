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

package org.icefaces.mobi.component.camera;


import org.icefaces.ace.meta.annotation.Component;
import org.icefaces.ace.meta.annotation.Property;
import org.icefaces.ace.meta.annotation.Expression;
import org.icefaces.ace.meta.baseMeta.UIComponentBaseMeta;
import javax.el.MethodExpression;
import org.icefaces.ace.meta.annotation.ClientBehaviorHolder;
import org.icefaces.ace.meta.annotation.ClientEvent;
import javax.faces.application.ResourceDependencies;
import javax.faces.application.ResourceDependency;

import java.util.Map;

@Component(
        tagName = "camera",
        componentClass = "org.icefaces.mobi.component.camera.Camera",
        rendererClass = "org.icefaces.mobi.component.camera.CameraRenderer",
        generatedClass = "org.icefaces.mobi.component.camera.CameraBase",
        componentType = "org.icefaces.Camera",
        rendererType = "org.icefaces.CameraRenderer",
        extendsClass = "javax.faces.component.UIComponentBase",
        componentFamily = "org.icefaces.Camera",
        tlddoc = "This mobility component captures an image via a mobile device camera" +
                " and stores it on the mobile device. Available is "+
                " valueChangeListener support"
)

@ResourceDependencies({
        @ResourceDependency(library = "org.icefaces.component.util", name = "component.js")
})
public class CameraMeta extends UIComponentBaseMeta {

    @Property(defaultValue = "Integer.MIN_VALUE", tlddoc = "maxium allowed width of image")
    private int maxwidth;

    @Property(defaultValue = "Integer.MIN_VALUE", tlddoc = "maximum allowed height of image")
    private int maxheight;

    @Property(defaultValue = "false",
            tlddoc = "When disabled, files are not selectable for upload.")
    private boolean disabled;

    @Property(defaultValue = "0", tlddoc = "tabindex of the component")
    private int tabindex;

    @Property(tlddoc = "style will be rendered on the root element of this " +
            "component.")
    private String style;

    @Property(tlddoc = "style class will be rendered on the root element of " +
            "this component.")
    private String styleClass;

    @Property(tlddoc = "as per specs the image information is stored in a Map")
    private Map<String, Object> value;

    @Property(expression= Expression.METHOD_EXPRESSION, methodExpressionArgument="javax.faces.event.ValueChangeEvent",
    	    tlddoc = "MethodExpression representing a value change listener method that will be notified when a file has " +
    	            "been uploaded with a valid file size > 0. The expression must evaluate to a public method that takes a " +
    	            "ValueChangeEvent  parameter, with a return type of void, or to a public method that takes no arguments " +
    	            "with a return type of void. ")
    private MethodExpression valueChangeListener;

    @Property(defaultValue="false", tlddoc="The default value of this attribute is false. If true then value change event will happen in APPLY_REQUEST_VALUES phase and if the value of this attribute is false then event change will happen in INVOKE_APPLICATION phase")
    private boolean immediate;
}
