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

package org.icemobile.client.android;

import java.util.Map;
import java.util.HashMap;

public class ARViewInterface implements JavascriptInterface {

    private ARViewHandler handler;
    private String result;

    public ARViewInterface (ARViewHandler handler) {
        this.handler = handler;
    }

    public String arView(String id, String attr) {
        Map<String,String> attributes = 
                new AttributeExtractor(attr).getAttributes();
        HashMap<String,String> places = new HashMap();
        for (String name : attributes.keySet())  {
            if ("id" != name)  {
                places.put(name, attributes.get(name));
            }
        }
        return handler.arView(id, places);
    }
}
