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

package org.icefaces.mobi.component.carousel;

import javax.el.ELException;
import javax.el.MethodExpression;
import javax.el.ValueExpression;
import javax.faces.event.AbortProcessingException;
import javax.faces.event.FacesEvent;
import javax.faces.event.PhaseId;
import javax.faces.event.ValueChangeEvent;
import java.util.logging.Level;
import java.util.logging.Logger;


public class Carousel extends CarouselBase {

    private static Logger logger = Logger.getLogger(Carousel.class.getName());

    public static final String CAROUSEL_CLASS = "mobi-carousel ";
    public static final String CAROUSEL_ITEM_CLASS = "mobi-carousel-list ";
    public static final String CAROUSEL_CURSOR_CLASS = "mobi-carousel-cursor ";
    public static final String CAROUSEL_CURSOR_LISTCLASS = "mobi-carousel-cursor-list ";
    public static final String CAROUSEL_CURSOR_CURSOR_CENTER_CLASS = "mobi-carousel-cursor-center";

    public void broadcast(FacesEvent event)
            throws AbortProcessingException {
        if (event instanceof ValueChangeEvent) {
            if (event != null) {
                ValueExpression ve = getValueExpression("selectedIten");
                if (ve != null) {
                    try {
                        ve.setValue(getFacesContext().getELContext(), ((ValueChangeEvent) event).getNewValue());
                    } catch (ELException e) {
                        logger.log(Level.WARNING, "Error creating selected value change event",e);
                    }
                } else {
                    int tempInt = (Integer) ((ValueChangeEvent) event).getNewValue();
                    this.setSelectedItem(tempInt);
                    if (logger.isLoggable(Level.FINEST)){
                        logger.finest("After setting the selectedItem to " + tempInt);
                    }
                }
                MethodExpression method = getValueChangeListener();
                if (method != null) {
                    method.invoke(getFacesContext().getELContext(), new Object[]{event});
                }
            }
        } else {
            super.broadcast(event);
        }
    }

    public void queueEvent(FacesEvent event) {
        if (event.getComponent() instanceof Carousel) {
            boolean isImmediate = isImmediate();
            if (logger.isLoggable(Level.FINEST)){
                logger.finest("invoked event for immediate " + isImmediate);
            }
            if (isImmediate) {
                event.setPhaseId(PhaseId.APPLY_REQUEST_VALUES);
            } else {
                event.setPhaseId(PhaseId.INVOKE_APPLICATION);
            }
        }
        super.queueEvent(event);
    }

}
