package org.icemobile.component.baseMeta;

import org.icefaces.ace.meta.annotation.*;
import org.icefaces.ace.meta.baseMeta.UIComponentBaseMeta;
import org.icemobile.util.TLDConstants;

@JSPBaseMeta(tagClass = "javax.servlet.jsp.tagext.SimpleTagSupport")
public class SimpleBaseMeta extends UIComponentBaseMeta {
    @Property(tlddoc=TLDConstants.DISABLED,
        implementation=Implementation.GENERATE)
    private boolean disabled;

    @Only(OnlyType.JSP)
    @Property(tlddoc=TLDConstants.ID,
        implementation=Implementation.GENERATE)
    private String id;

    @Property(tlddoc=TLDConstants.STYLE,
        implementation=Implementation.GENERATE)
    private String style;

    @Property(tlddoc=TLDConstants.STYLECLASS,
        implementation=Implementation.GENERATE)
    private String styleClass;
}
