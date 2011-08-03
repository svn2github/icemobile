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
 * These are the properties for javax.faces.component.UIForm
 */
public class UIFormMeta extends UIComponentBaseMeta {
    @Property(defaultValue = "true",
            defaultValueType = DefaultValueType.EXPRESSION,
            implementation = Implementation.EXISTS_IN_SUPERCLASS,
            tlddoc = "Flag indicating whether or not this form should prepend its " +
                    "id to its descendent's id during the clientId generation process.")
    private boolean prependId;
}
