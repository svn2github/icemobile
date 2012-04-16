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
 *
 */
 
package org.icemobile.jsp.tags;

import javax.servlet.jsp.tagext.SimpleTagSupport;
import javax.servlet.jsp.PageContext;

import java.io.Writer;
import java.io.IOException;

public class CameraTag extends SimpleTagSupport {

    public void doTag() throws IOException {
        PageContext pageContext = (PageContext) getJspContext();
        boolean isEnhanced = TagUtil.isEnhancedBrowser(pageContext);
        Writer out = pageContext.getOut();
        if (isEnhanced)  {
            out.write("<input type='button' id='camera' class='camera' onclick='ice.camera(\"camera\");' value='camera'>");
        } else {
            out.write("<input id='camera' type='file' name='camera' />");
            //or for iOS until we can store the ICEmobile-SX registration
            //without a session (likely a cookie)
            out.write("<input type='button' id='camerasx' class='camera' onclick='");
            out.write(TagUtil.getICEmobileSXScript(pageContext, "camera", "camera"));
            out.write("' value='camera (ICEmobile-SX)'>");
        }
    }

}