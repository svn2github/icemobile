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

package org.icefaces.mobi.component.dataview;

import org.icefaces.ace.meta.annotation.Component;
import org.icefaces.ace.meta.annotation.Property;

@Component(
        tagName = "dataViewColumns",
        componentClass = "org.icefaces.mobi.component.dataview.DataViewColumns",
        generatedClass = "org.icefaces.mobi.component.dataview.DataViewColumnsBase",
        componentType = "org.icefaces.DataViewColumns",
        extendsClass = "javax.faces.component.UIComponentBase",
        componentFamily = "org.icefaces.DataViewColumns",
        tlddoc = "The DataViewColumns component defines the table region of the DataView component " +
                "either by its DataViewColumn child components or by attaching an implementation" +
                "of DataViewColumnsModel to the 'value' attribute of this component."
)
public class DataViewColumnsMeta {
    @Property(tlddoc = "Define the table model of the DataView component programatically with an implementation of DataViewColumnsModel.")
    Object value;
}
