package org.icefaces.mobi.component.accordion;

import org.icefaces.ace.meta.annotation.Component;
import org.icefaces.ace.meta.annotation.Property;
import org.icefaces.ace.meta.annotation.Expression;
import org.icefaces.ace.meta.baseMeta.UIPanelMeta;
import org.icefaces.ace.meta.annotation.ClientBehaviorHolder;
import org.icefaces.ace.meta.annotation.ClientEvent;
import org.icefaces.ace.meta.annotation.Required;
import javax.el.MethodExpression;


@Component(
        tagName = "accordion",
        componentClass = "org.icefaces.mobi.component.accordion.Accordion",
        rendererClass = "org.icefaces.mobi.component.accordion.AccordionRenderer",
        generatedClass = "org.icefaces.mobi.component.accordion.AccordionBase",
        componentType = "org.icefaces.Accordion",
        rendererType = "org.icefaces.AccordionRenderer",
        extendsClass = "javax.faces.component.UIPanel",
        componentFamily = "org.icefaces.Accordion",
        tlddoc = "This mobility component allows panels to be placed within accordion controls in  " +
                "a stacked manner.  Only a single pane may be active at a time."
)
public class AccordionMeta extends UIPanelMeta {

    @Property(tlddoc="Int of the active pane.", defaultValue="0")
	private int activeIndex;

	@Property(tlddoc="Inline style of the container element.")
	private String style;

	@Property(tlddoc="Style class of the container element.")
	private String styleClass;

	@Property(tlddoc="Disables or enables the accordion.", defaultValue="false")
	private boolean disabled;

	@Property(tlddoc="Effect to use when toggling the panes.", defaultValue="slide")
	private String effect;

	@Property(tlddoc="When enabled, pane with highest content is used to calculate the height.", defaultValue="true")
	private boolean autoHeight;

    @Property(defaultValue="200px",
            tlddoc="fixeHeight can be used when autoHeight is false. Must be valid height for element.style.height")
    private String fixedHeight;

 	@Property(tlddoc="Server side listener to invoke when active pane changes", expression= Expression.METHOD_EXPRESSION, methodExpressionArgument="org.icefaces.mobi.event.AccordionPaneChangeEvent")
	private MethodExpression paneChangeListener;


}
