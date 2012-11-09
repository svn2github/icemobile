package org.icemobile.renderkit;

import java.io.IOException;
import java.util.logging.Logger;

import org.icemobile.component.IAccordion;
import org.icemobile.component.IMobiComponent;
import static org.icemobile.util.HTML.*;
import org.icemobile.util.Utils;

public class AccordionCoreRenderer extends BaseCoreRenderer implements IRenderer{
    
    private static final Logger logger =
            Logger.getLogger(AccordionCoreRenderer.class.toString());
    
    public void encodeBegin(IMobiComponent component, IResponseWriter writer, boolean isJSP)
            throws IOException {
        
        IAccordion accordion = (IAccordion)component;
        String clientId = accordion.getClientId();
        /* JSF comp writes script into 1st span */
        if (!accordion.isScriptLoaded() && !isJSP)  {
            writer.startElement(DIV_ELEM);
            writer.writeAttribute(ID_ATTR, clientId +"_libJSDiv");
            writer.startElement(SPAN_ELEM, accordion);
            writer.writeAttribute(ID_ATTR, clientId +"_libJS");
            writer.startElement("script", accordion);
            writer.writeAttribute("text", "text/javascript");
            writer.writeAttribute("src", accordion.getJavascriptFileRequestPath());
            writer.endElement("script");
            accordion.setScriptLoaded();
            writer.endElement(SPAN_ELEM);
            writer.endElement(DIV_ELEM);
        } 
        
        /* write out root tag.  For current incarnation html5 semantic markup is ignored */
 //       logger.info("DIV_START root wrapper of accordion");
        writer.startElement(DIV_ELEM, accordion);
        writer.writeAttribute(ID_ATTR, clientId);
 //       logger.info("\t DIV_START acc");
        writer.startElement(DIV_ELEM, accordion);
        writer.writeAttribute(ID_ATTR, clientId+"_acc");
        StringBuilder styleClass = new StringBuilder(IAccordion.ACCORDION_CLASS);
        String userDefinedClass = accordion.getStyleClass();
        if (userDefinedClass != null && userDefinedClass.length() > 0){
                styleClass.append(" ").append(userDefinedClass);
        }
        writer.writeAttribute(CLASS_ATTR, styleClass.toString());
        writer.writeAttribute(STYLE_ATTR, accordion.getStyle());
    }
    
    public void encodeEnd(IMobiComponent component, IResponseWriter writer, boolean isJSP)
            throws IOException {
        IAccordion accordion = (IAccordion)component;
        String clientId=accordion.getClientId();
        String openedPaneId = accordion.getOpenedPaneClientId();
 //       logger.info("\t DIV_END acc");
        writer.endElement(DIV_ELEM);  //end of _acc div
 //       logger.info("\t DIV_START hidden and script");
        writer.startElement(DIV_ELEM, accordion); //start of div for hidden and script
        writer.writeAttribute(ID_ATTR, clientId+"_hid");
        if (null != openedPaneId){
            super.writeHiddenInput(writer, accordion, openedPaneId);
        }else{
             super.writeHiddenInput(writer,accordion);
        }
 //       logger.info("SPAN_START script");
        writer.startElement(SPAN_ELEM, accordion);
        writer.writeAttribute(ID_ATTR, clientId + "_script");
        writer.startElement(SCRIPT_ELEM, null);
        writer.writeAttribute(INPUT_TYPE_TEXT, "text/javascript");
        StringBuilder cfg = new StringBuilder("{singleSubmit: true");

        if (null!=openedPaneId){
            cfg.append(", opened: '").append(openedPaneId).append("'");
        }
        boolean autoheight = accordion.isAutoHeight();
        int hashcode = Utils.generateHashCode(openedPaneId);
        cfg.append(", hash: ").append(hashcode);
        cfg.append(", autoHeight: ").append(autoheight);
        if (accordion.getFixedHeight()!=null){
            cfg.append(", fixedHeight: '").append(accordion.getFixedHeight()).append("'");
        }
        cfg.append("}");
         //just have to add behaviors if we are going to use them.
        
        writer.writeText("ice.mobi.accordionController.initClient('" 
                + accordion.getClientId() + "'," +cfg.toString()+");");
        
        writer.endElement(SCRIPT_ELEM);
        writer.endElement(SPAN_ELEM);
//        logger.info("SPAN_END");
        writer.endElement(DIV_ELEM);
//        logger.info("\t DIV_END script and hidden");
        writer.endElement(DIV_ELEM);
 //       logger.info("DIV_END FINAL!");
    }

}
