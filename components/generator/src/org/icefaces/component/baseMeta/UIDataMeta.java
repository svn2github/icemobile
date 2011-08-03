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

package org.icefaces.component.baseMeta;

import org.icefaces.component.annotation.DefaultValueType;
import org.icefaces.component.annotation.Implementation;
import org.icefaces.component.annotation.Property;

/**
 * These are the properties for javax.faces.component.UIData
 */
public class UIDataMeta extends UIComponentBaseMeta {
    @Property(defaultValue = "0",
            defaultValueType = DefaultValueType.EXPRESSION,
            implementation = Implementation.EXISTS_IN_SUPERCLASS,
            tlddoc = "Zero-relative row number of the first row in the underlying " +
                    "data model to be displayed, or zero to start at the beginning " +
                    "of the data model.")
    private int first;

    @Property(defaultValue = "0",
            defaultValueType = DefaultValueType.EXPRESSION,
            implementation = Implementation.EXISTS_IN_SUPERCLASS,
            tlddoc = "Zero-relative index of the row currently being accessed in " +
                    "the underlying DataModel, or -1 for no current row.")
    //TODO Test this with EL
    /*
        <tag-attribute>false</tag-attribute>
        <value-expression-enabled>true</value-expression-enabled>
     */
    private int rowIndex;

    @Property(defaultValue = "0",
            defaultValueType = DefaultValueType.EXPRESSION,
            implementation = Implementation.EXISTS_IN_SUPERCLASS,
            tlddoc = "The number of rows (starting with the one identified by the " +
                    "first property) to be displayed, or zero to display the entire " +
                    "set of available rows.")
    private int rows;

    @Property(implementation = Implementation.EXISTS_IN_SUPERCLASS,
            tlddoc = "The DataModel instance representing the data to which this " +
                    "component is bound, or a collection of data for which a DataModel " +
                    "instance is synthesized.")
    private Object value;

    @Property(implementation = Implementation.EXISTS_IN_SUPERCLASS,
            tlddoc = "The request-scope attribute (if any) under which the data " +
                    "object for the current row will be exposed when iterating.")
    private String var;
}
