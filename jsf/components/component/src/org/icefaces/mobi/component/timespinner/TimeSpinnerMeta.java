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

package org.icefaces.mobi.component.timespinner;

import org.icefaces.ace.meta.annotation.Component;
import org.icefaces.ace.meta.annotation.Property;
import org.icefaces.ace.meta.baseMeta.UIInputMeta;
import org.icefaces.ace.meta.annotation.ClientBehaviorHolder;
import org.icefaces.ace.meta.annotation.ClientEvent;
import javax.faces.application.ResourceDependencies;
import javax.faces.application.ResourceDependency;


@Component(
        tagName = "timeSpinner",
        componentClass = "org.icefaces.mobi.component.timespinner.TimeSpinner",
        generatedClass = "org.icefaces.mobi.component.timespinner.TimeSpinnerBase",
        extendsClass = "javax.faces.component.UIInput",
        rendererClass = "org.icefaces.mobi.component.timespinner.TimeSpinnerRenderer",
        componentFamily = "org.icefaces.component.TimeSpinner",
        componentType = "org.icefaces.component.TimeSpinner",
        rendererType = "org.icefaces.component.TimeSpinnerRenderer",
        tlddoc = "TimeSpinner is an input component that provides a time input.")


@ResourceDependencies({
        @ResourceDependency(library = "org.icefaces.component.util", name = "component.js")
})
@ClientBehaviorHolder(events = {
	@ClientEvent(name="change", javadoc="...", tlddoc="...", defaultRender="@this", defaultExecute="@all")
}, defaultEvent="change")
public class TimeSpinnerMeta extends UIInputMeta {

    @Property(defaultValue = "hh:mm a", tlddoc = "The TimeFormat pattern used for localization.")
    private String pattern;

    @Property(defaultValue = "15", tlddoc="The width, in characters, of the input text field where the value of the date resides.")
    private String size;

    @Property(tlddoc = " The locale to be used for labels and conversion.")
    private Object locale;

    @Property(tlddoc = "A String or a java.util.TimeZone instance that specify the timezone used for date " +
            "conversion. Defaults to TimeZone.getDefault().")
    private Object timeZone;

     @Property(tlddoc = org.icefaces.mobi.utils.TLDConstants.STYLE)
     private String style;

     @Property(tlddoc = org.icefaces.mobi.utils.TLDConstants.STYLECLASS)
     private String styleClass;

    @Property(defaultValue = "false",
            tlddoc = org.icefaces.mobi.utils.TLDConstants.DISABLED)
    private boolean disabled;

     @Property(tlddoc = org.icefaces.mobi.utils.TLDConstants.READONLY)
     private boolean readonly;

     @Property(tlddoc = org.icefaces.mobi.utils.TLDConstants.SINGLESUBMIT)
     private boolean singleSubmit;

    @Property(defaultValue = "false", tlddoc = "Deterines if native time picker should be used when available.  Currently, native support is available for iOS5, iOS6, and BlackBerry devices.")
    private boolean useNative;

}
