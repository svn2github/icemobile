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

package org.icemobile.jsp.tags.layout;

import org.icemobile.component.IFragment;
import org.icemobile.jsp.tags.BaseBodyTag;
import org.icemobile.jsp.tags.TagWriter;
import org.icemobile.renderkit.SplitPaneCoreRenderer;

import javax.servlet.jsp.JspTagException;
import javax.servlet.jsp.tagext.Tag;
import java.io.IOException;
import java.lang.String;
import java.util.logging.Logger;

public class FragmentTag extends BaseBodyTag implements IFragment{

    private static Logger LOG = Logger.getLogger(FragmentTag.class.getName());
    private static final String LOC_LEFT = "left";
    private static final String LOC_RIGHT = "right";

    private SplitPaneCoreRenderer renderer;
    private String name;
    private String clientId;
    private String styleClass;
    private String style;
    private boolean firstChild;
    private TagWriter writer;
    private SplitPaneTag myParent;

    /* parent stores state for the inner divs */
    public void setParent(Tag parent) {
        if ((parent instanceof SplitPaneTag)) {
            myParent = (SplitPaneTag) parent;
      //      setAttributesSplitPaneFragment (myParent);
        }else {
            throw new IllegalArgumentException("FragmentTag currently only supports SplitPaneTag as parent");
        }

    }
    private void setAttributesSplitPaneFragment(SplitPaneTag parent){
        String parentId = parent.getClientId();
        /* no check done at this time for both facets present */
        this.renderer=parent.getRenderer();
        if (name==null ){
           LOG.info(" name of facet must be left or right");
        } else {
           if (name.equals(LOC_LEFT)){
            this.setClientId(parentId+"_left");
            this.style = parent.getLeftStyle();
            firstChild = true;
        }
        else if (name.equals(LOC_RIGHT)){
            this.setClientId(parentId+"_right");
            this.style = parent.getRightStyle();
            firstChild = false;
        } //error checking??
        writer = new TagWriter(pageContext);
        this.styleClass = parent.getPaneClass();
        }
    }
    public int doStartTag() throws JspTagException {
    //    LOG.info("doStartTag Fragment");
        setAttributesSplitPaneFragment(myParent);
        try{
            renderer.encodePane(this, writer, style);
            writer.closeOffTag();
        } catch (IOException ioe){
            ioe.printStackTrace();
        }
        return EVAL_BODY_INCLUDE;
    }

    /**
     * Common end tag structure
     *
     * @return
     * @throws javax.servlet.jsp.JspTagException
     */
    public int doEndTag() throws JspTagException {
      //  LOG.info("doEndTag Fragment");
       try {
           renderer.encodePaneEnd( writer);
           if (firstChild){
               renderer.encodeColumnDivider(myParent, writer);
           }
       } catch (IOException ioe){
               ioe.printStackTrace();
       }
       return EVAL_PAGE;
    }


    public String getClientId() {
        return this.clientId;
    }
    public void setClientId(String id){
        this.clientId = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void release(){
        //this.name=null;
        LOG.info("release Fragment");
        this.clientId=null;
        this.styleClass= null;
        this.style = null;
        this.writer= null;
        this.renderer=null;
    }
}
