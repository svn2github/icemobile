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

package org.icefaces.mobi.component.stylesheet;

import org.icefaces.ace.meta.annotation.Component;
import org.icefaces.ace.meta.annotation.Property;
import javax.faces.application.ResourceDependencies;
import javax.faces.application.ResourceDependency;


@Component(
        tagName = "deviceStylesheet",
        componentClass = "org.icefaces.mobi.component.stylesheet.DeviceStyleSheet",
        rendererClass = "org.icefaces.mobi.component.stylesheet.DeviceStyleSheetRenderer",
        generatedClass = "org.icefaces.mobi.component.stylesheet.DeviceStyleSheetBase",
        componentType = "org.icefaces.DeviceStyleSheet",
        rendererType = "org.icefaces.DeviceStyleSheetRenderer",
        extendsClass = "javax.faces.component.UIComponentBase",
        componentFamily = "org.icefaces.DeviceStyleSheet",
        tlddoc = "This mobility component loads an outputStyleSheet in the head of a jsf view page " +
                "while determining which device is to be supported and delivering the correct stylesheet " +
                "based on the device type"
)


@ResourceDependencies({
        @ResourceDependency(library = "org.icefaces.component.util", name = "component.js")
})
public class DeviceStyleSheetMeta {

    @Property(tlddoc = "href for css file to be loaded.  The default for iPhone will be default_iPhone")
    private String href;

    @Property(tlddoc = "name is one of the attributes used for the h component outputStyleSheet")
    private String name;

    @Property(tlddoc = "library is also used by h comp outputStyleSheet")
    private String library;

    @Property(tlddoc = "CSS media type, screen, print and others. ")
    private String media;

    @Property(tlddoc = "View size, small or large ")
    private String view;
}
