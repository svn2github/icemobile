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
 * These are the properties for javax.faces.component.UIMessage
 */
public class UIMessageMeta extends UIComponentBaseMeta {
    @Property(//TODO ICE-6109
            implementation = Implementation.EXISTS_IN_SUPERCLASS,
            tlddoc = "Identifier of the component for which to render error " +
                    "messages. If this component is within the same NamingContainer " +
                    "as the target component, this must be the component " +
                    "identifier. Otherwise, it must be an absolute component " +
                    "identifier (starting with \":\").")
    private String forValue;

    @Property(defaultValue = "true",
            defaultValueType = DefaultValueType.EXPRESSION,
            implementation = Implementation.EXISTS_IN_SUPERCLASS,
            tlddoc = "Flag indicating whether the \"detail\" property of messages " +
                    "for the specified component should be rendered.")
    private boolean showDetail;

    @Property(defaultValue = "false",
            defaultValueType = DefaultValueType.EXPRESSION,
            implementation = Implementation.EXISTS_IN_SUPERCLASS,
            tlddoc = "Flag indicating whether the \"summary\" property of " +
                    "messages for the specified component should be rendered.")
    private boolean showSummary;

    //TODO Check Mojarra 2.0.3+ code to see if exists there
    @Property(defaultValue = "true",
            defaultValueType = DefaultValueType.EXPRESSION,
            implementation = Implementation.EXISTS_IN_SUPERCLASS,
            tlddoc = "A flag indicating this UIMessage instance should redisplay " +
                    "FacesMessages that have already been handled.")
    private boolean redisplay;
}
