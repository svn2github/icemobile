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
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.icemobile.samples.mobileshowcase.view.examples.layout.panelconfirmation;


import org.icemobile.samples.mobileshowcase.view.metadata.annotation.*;
import org.icemobile.samples.mobileshowcase.view.metadata.context.ExampleImpl;

import javax.faces.bean.ManagedBean;
import javax.faces.bean.SessionScoped;
import javax.faces.event.ActionEvent;
import java.io.Serializable;

@Destination(
        title = "example.layout.panelconfirmation.destination.title.short",
        titleExt = "example.layout.panelconfirmation.destination.title.long",
        titleBack = "example.layout.panelconfirmation.destination.title.back",
        contentPath = "/WEB-INF/includes/examples/layout/panelconfirmation.xhtml"
)
@Example(
        descriptionPath = "/WEB-INF/includes/examples/layout/panelconfirmation-desc.xhtml",
        examplePath = "/WEB-INF/includes/examples/layout/panelconfirmation-example.xhtml",
        resourcesPath = "/WEB-INF/includes/examples/example-resources.xhtml"
)
@ExampleResources(
        resources = {
                // xhtml
                @ExampleResource(type = ResourceType.xhtml,
                        title = "panelconfirmation-example.xhtml",
                        resource = "/WEB-INF/includes/examples/layout/panelconfirmation-example.xhtml"),
                // Java Source
                @ExampleResource(type = ResourceType.java,
                        title = "PanelConfirmation.java",
                        resource = "/WEB-INF/classes/org/icemobile/samples/mobileshowcase" +
                                "/view/examples/layout/panelconfirmation/PanelConfirmation.java")
        }
)

@ManagedBean(name = PanelConfirmation.BEAN_NAME)
@SessionScoped
public class PanelConfirmation extends ExampleImpl<PanelConfirmation> implements
        Serializable {

    public static final String BEAN_NAME = "panelConfirmationBean";

    public boolean rendered;
    private int count;

    public PanelConfirmation() {
        super(PanelConfirmation.class);
    }

    public void toggleVisibility(ActionEvent event) {
        rendered = !rendered;
    }

    public boolean isRendered() {
        return rendered;
    }

    public void execute(ActionEvent event) {
        count++;
    }

    public int getCount() {
        return count;
    }
}
