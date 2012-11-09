package org.icemobile.renderkit;

import java.io.IOException;

import org.icemobile.component.IMobiComponent;
import org.icemobile.util.ClientDescriptor;

import java.lang.StringBuilder;
import java.util.logging.Logger;
import static org.icemobile.util.HTML.*;
import static org.icemobile.util.Constants.*;

public abstract class BaseCoreRenderer{
    private static final Logger logger =
            Logger.getLogger(BaseCoreRenderer.class.toString());

    public void writeStandardAttributes(IResponseWriter writer,
                    IMobiComponent component, String baseClass,
                    String disabledClass) throws IOException  {
        StringBuilder inputStyle = new StringBuilder(baseClass);
        if (component.isDisabled()){
            inputStyle.append(" ").append(disabledClass);
        }
        if (null != component.getStyleClass())  {
            inputStyle.append(" ").append(component.getStyleClass());
        }
        if( inputStyle.length() > 0 ){
            writer.writeAttribute(CLASS_ATTR, inputStyle);
        }
        if (null != component.getStyle())  {
            writer.writeAttribute(STYLE_ATTR, component.getStyle());
        }
        if (component.isDisabled())  {
            writer.writeAttribute(DISABLED_ATTR, DISABLED_ATTR);
        }
    }

    public void writeStandardLayoutAttributes(IResponseWriter writer,
                    IMobiComponent component, String baseClass) throws IOException  {
        StringBuilder inputStyle = new StringBuilder(baseClass);
        if (null != component.getStyleClass())  {
            inputStyle.append(SPACE).append(component.getStyleClass());
        }
        if( inputStyle.length() > 0 ){
            writer.writeAttribute(CLASS_ATTR, inputStyle);
        }
        if (null != component.getStyle())  {
            writer.writeAttribute(STYLE_ATTR, component.getStyle());
        }
    }
    
    public void writeHiddenInput(IResponseWriter writer, IMobiComponent comp) throws IOException{
        writer.startElement(SPAN_ELEM, comp);
        writer.startElement(INPUT_ELEM, comp);
        writer.writeAttribute(TYPE_ATTR, INPUT_TYPE_HIDDEN);
        writer.writeAttribute(ID_ATTR, comp.getClientId()+SUFFIX_HIDDEN);
        writer.writeAttribute(NAME_ATTR, comp.getClientId()+SUFFIX_HIDDEN);
        writer.endElement(INPUT_ELEM);
        writer.endElement(SPAN_ELEM);
    }
    public void writeHiddenInput(IResponseWriter writer, IMobiComponent comp, String value) throws IOException{
        writer.startElement(SPAN_ELEM, comp);
        writer.startElement(INPUT_ELEM, comp);
        writer.writeAttribute(TYPE_ATTR, INPUT_TYPE_HIDDEN);
        writer.writeAttribute(ID_ATTR, comp.getClientId()+SUFFIX_HIDDEN);
        writer.writeAttribute(NAME_ATTR, comp.getClientId()+SUFFIX_HIDDEN);
        writer.writeAttribute(VALUE_ATTR, value);
        writer.endElement(INPUT_ELEM);
        writer.endElement(SPAN_ELEM);
    }
    protected boolean isTouchEventEnabled(ClientDescriptor client) {
        // commenting out Blackberry at this time as support of touch events is
        // problematic
        // if (uai.sniffIphone() || uai.sniffAndroid() || uai.sniffBlackberry()
        if (client.isAndroidOS() && client.isTabletBrowser())
            return false;
        if (client.isIOS() || client.isAndroidOS() ) { //assuming android phone
            return true;
        }
        return false;
    }
}
