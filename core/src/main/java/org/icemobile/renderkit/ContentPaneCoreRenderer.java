package org.icemobile.renderkit;

import org.icemobile.component.IAccordion;
import org.icemobile.component.IContentPane;


import javax.swing.text.html.HTML;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

import static org.icemobile.util.HTML.*;

public class ContentPaneCoreRenderer extends BaseCoreRenderer {
    /*so far takes care of accordion, will add tabSet and contentPane as they are
      brought into core rendering strategy */
    private static final Logger logger =
            Logger.getLogger(ContentPaneCoreRenderer.class.toString());
    
    public void encodeBegin(IContentPane pane, IResponseWriter writer,
                            boolean isJsp, boolean selected)
            throws IOException{
        if (pane.isAccordionPane()){
            IAccordion accordion = pane.getAccordionParent();
            encodeAccordionHandle(accordion, pane, writer, isJsp, selected);
        }
    }

    public void encodeEnd(IContentPane component, IResponseWriter writer, boolean isJsp)
             throws IOException {
    //    if (component.isAccordionPane()){  uncomment when tabSet and contentStack use core rendering
            writer.endElement(DIV_ELEM);
            writer.endElement(DIV_ELEM);

            writer.endElement(SECTION_ELEM);
   /*     } else {
            writer.endElement(DIV_ELEM);
            writer.endElement(DIV_ELEM);
        } */
    }
    public void encodeAccordionHandle(IAccordion accordion, IContentPane pane,
                  IResponseWriter writer, boolean isJsp, boolean selected )
         throws IOException{
          String accordionId = accordion.getClientId();
          String clientId = pane.getClientId();
          boolean client = pane.isClient();
          boolean autoheight = accordion.isAutoHeight();
          String myId = pane.getId();
          String handleClass = "handle";
          String pointerClass = "pointer";
          writer.startElement(SECTION_ELEM, pane);
          writer.writeAttribute(ID_ATTR, clientId+"_sect");
             // apply default style class for panel-stack
          StringBuilder styleClass = new StringBuilder("closed");
          if (!isJsp && selected){
              styleClass = new StringBuilder("open") ;
          }
          String userDefinedClass = pane.getStyleClass();
          if (userDefinedClass != null && userDefinedClass.length() > 0){
               handleClass+= " " + userDefinedClass;
               pointerClass+=" " + userDefinedClass;
          }
          writer.writeAttribute(CLASS_ATTR, styleClass);
          writer.writeAttribute(STYLE_ATTR, pane.getStyle());
          writer.startElement(DIV_ELEM, pane);
          writer.writeAttribute(ID_ATTR, clientId+"_hndl");
          writer.writeAttribute(CLASS_ATTR, handleClass);
          writer.writeAttribute("onclick", "ice.mobi.accordionController.toggleClient('"+accordionId+"',this,"+client+");");
          writer.startElement(SPAN_ELEM, pane);
          writer.writeAttribute("class", pointerClass);
       /*   if (!isJsp){
              writer.write(IAccordion.ACCORDION_RIGHT_POINTING_POINTER);
          } else {
              writer.writeText(IAccordion.ACCORDION_RIGHT_POINTING_POINTER);
          }*/
          writer.endElement(SPAN_ELEM);
          String title = pane.getTitle();
          writer.writeText(title);
          writer.endElement(DIV_ELEM);
          writer.startElement(DIV_ELEM, pane);
          String htString = accordion.getFixedHeight();
          if (!autoheight && (null != htString) && !htString.isEmpty() && !htString.equals(" ")) {
            //  writer.writeAttribute(STYLE_ATTR, "height: "+accordion.getFixedHeight()+";"); // overflow-y: scroll;") ;
               writer.writeAttribute(STYLE_ATTR, "height: "+htString+"; max-height: "+htString+"; overflow-y: auto;") ;
          }
          writer.startElement(DIV_ELEM, pane);
          writer.writeAttribute(ID_ATTR, clientId);
          if (pane.getStyle() !=null){
              writer.writeAttribute(STYLE_ATTR, pane.getStyle());
          }
          if (userDefinedClass!=null){
              writer.writeAttribute(CLASS_ATTR, userDefinedClass);
          }
     }


}
