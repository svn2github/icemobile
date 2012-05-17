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

package org.icemobile.samples.mobileshowcase.view.navigation;

import org.icemobile.samples.mobileshowcase.view.examples.layout.carousel.CarouselBean;
import org.icemobile.samples.mobileshowcase.view.examples.layout.fieldset.FieldsetBean;
import org.icemobile.samples.mobileshowcase.view.examples.layout.list.ListBean;
import org.icemobile.samples.mobileshowcase.view.examples.layout.panelPopup.PanelPopupBean;
import org.icemobile.samples.mobileshowcase.view.examples.layout.panelconfirmation.PanelConfirmation;
import org.icemobile.samples.mobileshowcase.view.examples.layout.theme.SkinBean;
import org.icemobile.samples.mobileshowcase.view.metadata.annotation.MenuLink;

import javax.annotation.PostConstruct;
import javax.faces.bean.ApplicationScoped;
import javax.faces.bean.ManagedBean;
import java.io.Serializable;

/**
 * Menu items for native integration
 */
@org.icemobile.samples.mobileshowcase.view.metadata.annotation.Menu(
        title = "menu.layout.title",
        menuLinks = {
                @MenuLink(title = "menu.layout.carousel.title",
                        exampleBeanName = CarouselBean.BEAN_NAME,
                        examplePanelId = "carousel"),
                @MenuLink(title = "menu.layout.theming.title",
                        exampleBeanName = SkinBean.BEAN_NAME,
                        examplePanelId = "theme"),
                @MenuLink(title = "menu.layout.fieldset.title",
                        exampleBeanName = FieldsetBean.BEAN_NAME,
                        examplePanelId = "fieldset"),
                @MenuLink(title = "menu.layout.list.title",
                        exampleBeanName = ListBean.BEAN_NAME,
                        examplePanelId = "list"),
                @MenuLink(title = "menu.layout.panelConfirmation.title",
                        exampleBeanName = PanelConfirmation.BEAN_NAME,
                        examplePanelId = "panelconfirmation"),
                @MenuLink(title = "menu.layout.panelpopup.title",
                        exampleBeanName = PanelPopupBean.BEAN_NAME,
                        examplePanelId = "panelpopup")
        })
@ManagedBean(name = LayoutAndNavigationMenu.BEAN_NAME)
@ApplicationScoped
public class LayoutAndNavigationMenu extends org.icemobile.samples.mobileshowcase.view.metadata.context.Menu<LayoutAndNavigationMenu>
        implements Serializable {

    public static final String BEAN_NAME = "layoutAndNavigationMenu";

    public LayoutAndNavigationMenu() {
        super(LayoutAndNavigationMenu.class);
    }

    @PostConstruct
    public void initMetaData() {
        super.initMetaData();
    }

    public String getBeanName() {
        return BEAN_NAME;
    }
}