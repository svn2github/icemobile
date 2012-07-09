package org.icemobile.jsp.tags;

import javax.servlet.jsp.JspTagException;
import javax.servlet.jsp.tagext.Tag;
import javax.servlet.jsp.tagext.TagSupport;
import java.io.IOException;
import java.io.Writer;
import java.util.logging.Logger;

/**
 *
 */
public class PagePanelBodyTag extends TagSupport {

    public static final String BODY_CLASS = "mobi-pagePanel-body";
    public static final String BODY_NO_HEADER_CLASS = "mobi-pagePanel-body-noheader";
    public static final String BODY_NO_FOOTER_CLASS = "mobi-pagePanel-body-nofooter";

    private static Logger LOG = Logger.getLogger(PagePanelBodyTag.class.getName());


    public int doStartTag() throws JspTagException {

        Writer out = pageContext.getOut();

        StringBuilder tag = new StringBuilder(TagUtil.DIV_TAG);
        tag.append(" id=\"").append(getId()).append("_pgPnlBdy\"");

        StringBuilder styling = new StringBuilder(BODY_CLASS);
        if (noHeader) {
            styling.append(" ").append(BODY_NO_HEADER_CLASS);
        }
        if (noFooter) {
            styling.append(" ").append(BODY_NO_FOOTER_CLASS);
        }
        tag.append(" class=\"").append(styling.toString()).append("\"");
        tag.append(">");

        try {
            out.write(tag.toString());
        } catch (IOException ioe) {
            LOG.severe("IOException writing PagePanelHeader: " + ioe);
        }
        return EVAL_BODY_INCLUDE;
    }


    public int doEndTag() throws JspTagException {

        Writer out = pageContext.getOut();
        try {
            out.write(TagUtil.DIV_TAG_END);
        } catch (IOException ioe) {
            LOG.severe("IOException closing PagePanelHeader: " + ioe);
        }
        return EVAL_PAGE;
    }

    private String id;
    private boolean noHeader;
    private boolean noFooter;


    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public boolean isNoHeader() {
        return noHeader;
    }

    public void setNoHeader(boolean noHeader) {
        this.noHeader = noHeader;
    }

    public boolean isNoFooter() {
        return noFooter;
    }

    public void setNoFooter(boolean noFooter) {
        this.noFooter = noFooter;
    }
}
