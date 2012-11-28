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

package org.icemobile.jsp.tags;

import javax.servlet.ServletContext;
import javax.servlet.jsp.PageContext;
import java.io.*;
import java.util.logging.Logger;




public class QRCodeTag extends BaseSimpleTag {

    private String value;
    private static Logger LOG = Logger.getLogger(QRCodeTag.class.getName());

    // Code for the controller to map the request
    private final String QR_CODE_IMG = "qrscan/theImage";



    public void doTag() throws IOException {

        PageContext pageContext = (PageContext) getJspContext();
        ServletContext sc = pageContext.getServletContext();

        Writer out = pageContext.getOut();
        StringBuilder tag = new StringBuilder();
        tag.append("<img ");
        tag.append("src=\"").append( QR_CODE_IMG ).append("\" ");

        if (styleClass != null && !"".equals(styleClass)) {
            tag.append("class=\"").append(getStyleClass()).append("\"");
        }

        if (style != null && !"".equals(style))  {
            tag.append(" style=\"").append(getStyle()).append("\"");
        }
        tag.append(">");
        tag.append("</img>");
        out.write(tag.toString());

    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public void release(){
        super.release();
        value = null;
    }
}