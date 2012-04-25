package org.icemobile.jsp.tags;

import org.icefaces.mobi.component.fieldset.FieldSetRow;

import javax.servlet.jsp.JspTagException;
import javax.servlet.jsp.PageContext;
import javax.servlet.jsp.tagext.BodyTagSupport;
import javax.servlet.jsp.tagext.SimpleTagSupport;
import javax.servlet.jsp.tagext.TagSupport;
import java.io.IOException;
import java.io.Writer;

/**
 *
 */
public class FieldSetRowTag extends TagSupport {

    private String id;
    private String styleClass;
    private String style;
    private boolean group;

    public int doStartTag() throws JspTagException {

        FieldSetGroupTag parent =
                (FieldSetGroupTag) findAncestorWithClass(this, FieldSetGroupTag.class);
        if (parent == null) {
            throw new JspTagException("FieldSetRow must be child of FieldSetGroup");
        } else {
            // Do something here?     parent.setSomeValue(...);
        }

        Writer out = pageContext.getOut();

        try {
            out.write("<div");
            if (id != null && !"".equals(id)) {
                out.write(" id=\'" + getId() + "\'");
            }

            // Apply default Field Row Class.
            StringBuilder classBuilder = new StringBuilder(FieldSetRow.FIELDSETROW_CLASS);

            // apply user defined class
            String styleClass = getStyleClass();
            if (styleClass != null && !"".equals(styleClass)) {
                classBuilder.append(" ").append(styleClass);
            }

            // todo: ??
            if (isGroup()) {
                classBuilder.append(" ").append(FieldSetRow.FIELDSETGROUP_CLASS);
            }

            out.write(" class=\'" + classBuilder.toString() + "\'");

            String inlineStyle = getStyle();

            if (inlineStyle != null && !"".equals(inlineStyle)) {
                if (inlineStyle.endsWith(";")) {
                    inlineStyle = inlineStyle.substring(0, inlineStyle.length() - 1);
                }
                out.write(" style=\'" + inlineStyle + ";\'");


            }
            out.write(">");

        } catch (IOException ieo) {
        }
        return (EVAL_BODY_INCLUDE);
//        return (SKIP_BODY);

    }

    /**
     * implement after body tags here.
     *
     * @return
     */
    public int doAfterBody() {

        Writer out = pageContext.getOut();
        try {
            out.write("</div>");
        } catch (IOException ieo) {
        }

        return SKIP_BODY;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStyleClass() {
        return styleClass;
    }

    public void setStyleClass(String styleClass) {
        this.styleClass = styleClass;
    }

    public String getStyle() {
        return style;
    }

    public void setStyle(String style) {
        this.style = style;
    }

    public boolean isGroup() {
        return group;
    }

    public void setGroup(String group) {
        this.group = Boolean.getBoolean(group);
    }
}
