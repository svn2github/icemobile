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
package org.icefaces.mobi.component.panelconfirmation;

import org.icefaces.ace.meta.annotation.Component;
import org.icefaces.ace.meta.annotation.Property;
import org.icefaces.ace.meta.baseMeta.UIPanelMeta;

@Component(
        tagName = "panelConfirmation",
        componentClass = "org.icefaces.mobi.component.panelconfirmation.PanelConfirmation",
        rendererClass = "org.icefaces.mobi.component.panelconfirmation.PanelConfirmationRenderer",
        generatedClass = "org.icefaces.mobi.component.panelconfirmation.PanelConfirmationBase",
        componentType = "org.icefaces.PanelConfirmation",
        rendererType = "org.icefaces.PanelConfirmationRenderer",
        extendsClass = "javax.faces.component.UIPanel",
        componentFamily = "org.icefaces.PanelConfirmation",
        tlddoc = "This mobility component " +
                "renders a confirmation panel to be used with any mobi commandButton or menuButton"
)

public class PanelConfirmationMeta extends UIPanelMeta {

    @Property(tlddoc = "style will be rendered on a root element of this component")
    private String style;

    @Property(tlddoc = "style class will be rendered on a root element of this component")
    private String styleClass;

    @Property(defaultValue = "Confirm", tlddoc = "title of confirmation panel in an attribute so el can be used to internationalize")
    private String title;

    @Property(tlddoc = " acceptOnly means only accept button, cancelOnly means only cancel button, both has both")
    private String type;

    @Property(defaultValue = "Cancel", tlddoc = "title of cancel button")
    private String cancelLabel;

    @Property(defaultValue = "Confirm", tlddoc = "title of confirm/accept button")
    private String acceptLabel;

    @Property(defaultValue = "Confirm?", tlddoc = "Message")
    private String message;


}
