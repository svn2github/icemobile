package org.icemobile.renderkit;

import static org.icemobile.util.HTML.*;

import java.io.IOException;

import org.icemobile.component.IContactList;
import org.icemobile.util.CSSUtils;
import org.icemobile.util.ClientDescriptor;

public class ContactListCoreRenderer extends BaseCoreRenderer {
    
    public void encode(IContactList component, IResponseWriter writer)
            throws IOException {
        
        String clientId = component.getClientId();
        ClientDescriptor cd = component.getClient();

        writer.startElement(DIV_ELEM);
        writer.writeAttribute(ID_ATTR, clientId);

        writer.startElement(INPUT_ELEM);
        writer.writeAttribute(TYPE_ATTR, "button");
        //
        boolean targetAudience = cd.isICEmobileContainer() | cd.isSXRegistered();
        if (! targetAudience ) {
            component.setDisabled( true);
        }
	writeStandardAttributes(writer, component, CSSUtils.STYLECLASS_BUTTON, CSSUtils.STYLECLASS_BUTTON_DISABLED);
        StringBuilder args = new StringBuilder();

        String pattern = component.getPattern();
        if (pattern != null && !"".equals(pattern)) {
            args.append("pattern=").append(pattern);
        }

        String fields = component.getFields();
        if (fields != null && !"".equals(fields)) {
            if (args.length() > 0) {
                args.append("&");
            }
            args.append("fields=").append(fields);
        }

        writer.writeAttribute("data-command", "fetchContacts");
        writer.writeAttribute("data-id", clientId);
        if (args.length() > 0)  {
            writer.writeAttribute("data-params", args.toString());
        }
        String postURL = component.getPostURL();
        if (null != postURL)  {
            writer.writeAttribute("data-postURL", postURL);
        }
        String sessionId = component.getSessionId();
        if (null != sessionId)  {
            writer.writeAttribute("data-jsessionid", sessionId);
        }
        writer.writeAttribute(ONCLICK_ATTR, "ice.mobi.invoke(this)");

        writer.writeAttribute(VALUE_ATTR, component.getLabel());
        writer.endElement(INPUT_ELEM);
        writer.endElement(DIV_ELEM);
    }

}
