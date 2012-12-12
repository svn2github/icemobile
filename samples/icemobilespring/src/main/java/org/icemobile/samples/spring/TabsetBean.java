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

package org.icemobile.samples.spring;

import org.springframework.web.bind.annotation.SessionAttributes;

/**
 * This is a sample backing bean for the MVC supported Tabset
 */
@SessionAttributes("tabsetBean")
public class TabsetBean {


    private Integer tabsetOneIndex = Integer.valueOf(0);

    public Integer getTabsetOne() {
        return tabsetOneIndex;
    }

    public void setTabsetOne(Integer tabsetOneIndex) {
    	if( tabsetOneIndex != null ){
    		this.tabsetOneIndex = tabsetOneIndex;
    	}
    }
}
