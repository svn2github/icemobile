/*
 * Copyright 2004-2013 ICEsoft Technologies Canada Corp.
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
package org.icefaces.mobi.component.menubutton;

import org.icefaces.mobi.renderkit.BaseLayoutRenderer;
import org.icefaces.mobi.renderkit.ResponseWriterWrapper;
import org.icemobile.component.IMenuButton;
import org.icemobile.component.IMenuButtonGroup;
import org.icemobile.renderkit.IResponseWriter;
import org.icemobile.renderkit.MenuButtonGroupCoreRenderer;


import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import java.io.IOException;
import java.util.logging.Logger;


public class MenuButtonGroupRenderer extends BaseLayoutRenderer{
       private static Logger logger = Logger.getLogger(MenuButtonGroupRenderer.class.getName());

    public void encodeBegin(FacesContext facesContext, UIComponent uiComponent)
             throws IOException {
        IResponseWriter writer = new ResponseWriterWrapper(facesContext.getResponseWriter());
        MenuButtonGroupCoreRenderer renderer = new MenuButtonGroupCoreRenderer();
        IMenuButtonGroup item = (IMenuButtonGroup)uiComponent;
        renderer.encodeBegin(item, writer);
    }

    public void encodeEnd(FacesContext facesContext, UIComponent uiComponent)
             throws IOException {
        UIComponent parent = uiComponent.getParent();
        if (!(parent instanceof IMenuButton) ){
            logger.warning("MenuButtonGroup must have parent of MenuButton");
            return;
        }
        IResponseWriter writer = new ResponseWriterWrapper(facesContext.getResponseWriter());
        MenuButtonGroupCoreRenderer renderer = new MenuButtonGroupCoreRenderer();
        IMenuButtonGroup item = (IMenuButtonGroup)uiComponent;
        renderer.encodeEnd(item, writer);

    }

}
