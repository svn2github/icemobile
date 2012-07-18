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
package org.icefaces.mobi.component.contentstack;


import org.icefaces.mobi.api.ContentPaneController;

import javax.el.ValueExpression;
import javax.faces.component.StateHelper;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import java.util.HashMap;
import java.util.Map;

public class ContentStack extends ContentStackBase implements ContentPaneController {
    public static final String CONTAINER_SINGLEVIEW_CLASS = "mobi-contentStack-container";
    public static final String PANES_SINGLEVIEW_CLASS ="mobi-contentStack-panes";

    private Boolean singleView;

    public ContentStack() {
        super();
    }
     /**
     * method is required by ContentPaneController interface no error checking as
     * component is not in the tree
     */
     public String getSelectedId(){
         return getCurrentId();
     }
    public void setSingleView(Boolean singleView) {
        //set it once per session as it's only singleView if the stack has a child
        //contentPane which contains a contentStackMenu.  So won't change
        //dynamically Renderer will default the value to false.
        StateHelper sh = getStateHelper();
        String clientId = getClientId();
        String valuesKey = "singleView" + "_rowValues";
        Map clientValues = (Map) sh.get(valuesKey);
        if (clientValues == null) {
            clientValues = new HashMap();
        }
        if (singleView==null){
            clientValues.remove(clientId);
        } else {
            clientValues.put(clientId, singleView);
        }
        sh.put(valuesKey, clientValues);
    }

    /**
    * the renderer will determine if a contentStackMenu is a child of the contentStack
    * and the statehelper will maintain the value set.
    */
    public Boolean getSingleView() {
        java.lang.Boolean retVal = null;
        StateHelper sh = getStateHelper();
        String valuesKey = "singleView" + "_rowValues";
        Map clientValues = (Map) sh.get(valuesKey);
        Boolean mapNoValue = false;
        if (clientValues != null) {
            String clientId = getClientId();
            if (clientValues.containsKey( clientId ) ) {
                retVal = (java.lang.Boolean) clientValues.get(clientId);
            } else {
                mapNoValue=true;
            }
        }
        if (mapNoValue || clientValues == null ) {
            String defaultKey = "singleView" + "_defaultValues";
            Map defaultValues = (Map) sh.get(defaultKey);
            if (defaultValues != null) {
               if (defaultValues.containsKey("defValue" )) {
                  retVal = (java.lang.Boolean) defaultValues.get("defValue");
               }
            }
        }
        return retVal;
    }

}


