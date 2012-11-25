package org.icefaces.mobi.component.contactlist;

import java.io.IOException;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.render.Renderer;

import org.icefaces.mobi.renderkit.ResponseWriterWrapper;
import org.icemobile.component.ContactDecoder;
import org.icemobile.component.IContactList;
import org.icemobile.renderkit.ContactListCoreRenderer;
import org.icefaces.impl.application.AuxUploadResourceHandler;

public class ContactListRenderer extends Renderer {
    
    private static Logger log = Logger.getLogger(ContactListRenderer.class.getName());
    
    @Override
    public void decode(FacesContext facesContext, UIComponent uiComponent) {
        ContactList contactList = (ContactList) uiComponent;
        String clientId = contactList.getClientId();
        try {
            Map requestParameterMap = facesContext.getExternalContext()
                .getRequestParameterMap();
            String contactListResult = (String) requestParameterMap.get(clientId);
            if (null == contactListResult)  {
                Map auxMap = AuxUploadResourceHandler.getAuxRequestMap();
                contactListResult = (String) auxMap.get(clientId);
            }
            if (null != contactListResult)  {
                contactList.setValue(contactListResult);
                ContactDecoder modelHelper = new ContactDecoder(contactListResult);
                contactList.setName(modelHelper.getName());
                contactList.setEmail(modelHelper.getEmail());
                contactList.setPhone(modelHelper.getPhone());
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "Error decoding fetchContacts request paramaters.", e);
        }
    }


    public void encodeEnd(FacesContext facesContext, UIComponent uiComponent)
            throws IOException {
        ResponseWriterWrapper writer = new ResponseWriterWrapper(facesContext.getResponseWriter());
        ContactListCoreRenderer renderer = new ContactListCoreRenderer();
        renderer.encode((IContactList)uiComponent, writer);
    }

}

