/*
 * Copyright 2004-2011 ICEsoft Technologies Canada Corp. (c)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.icefaces.component.datespinner;


import org.icefaces.component.utils.Attribute;

import javax.faces.context.FacesContext;
import java.util.*;
import java.util.logging.Logger;

public class DateSpinner extends DateSpinnerBase {

    private static Logger logger = Logger.getLogger(DateSpinner.class.getName());
    public static final String BLACKOUT_PNL_CLASS = "mobi-date-bg";
    public static final String CONTAINER_CLASS = "mobi-date-container";
    public static final String INPUT_CLASS = "mobi-input-text";
    public static final String POP_UP_CLASS = "mobi-popup-btn";
    public static final String TITLE_CLASS = "mobi-date-title-container";
    public static final String SELECT_CONT_CLASS = "mobi-date-select-container";
    public static final String VALUE_CONT_CLASS = "mobi-date-select-value-cont";
    public static final String BUTTON_INC_CONT_CLASS = "mobi-date-btn-cont-incr";
    public static final String BUTTON_INC_CLASS = "mobi-date-btn mobi-date-btn-incr";
    public static final String SEL_VALUE_CLASS = "mobi-date-select-value";
    public static final String BUTTON_DEC_CONT_CLASS = "mobi-date-btn-cont-decr";
    public static final String BUTTON_DEC_CLASS = "mobi-date-btn mobi-date-btn-decr";

    private Attribute[] commonAttributeNames = {
            new Attribute("style", null)
    };

    private int monthInt;
    private int yearInt;
    private int dayInt;

    public DateSpinner() {
        super();
    }


    private Locale appropriateLocale;
    private TimeZone appropriateTimeZone;

    public Locale calculateLocale(FacesContext facesContext) {
        if (appropriateLocale == null) {
            Object userLocale = getLocale();
            if (userLocale != null) {
                if (userLocale instanceof String) {
                    String[] tokens = ((String) userLocale).split("_");
                    if (tokens.length == 1)
                        appropriateLocale = new Locale(tokens[0], "");
                    else
                        appropriateLocale = new Locale(tokens[0], tokens[1]);
                } else if (userLocale instanceof Locale)
                    appropriateLocale = (Locale) userLocale;
                else
                    throw new IllegalArgumentException("Type:" + userLocale.getClass() + " is not a valid locale type for calendar:" + this.getClientId(facesContext));
            } else {
                appropriateLocale = facesContext.getViewRoot().getLocale();
            }
        }

        return appropriateLocale;
    }

    public TimeZone calculateTimeZone() {
        if (appropriateTimeZone == null) {
           //default to GMT
            Object usertimeZone =   TimeZone.getDefault(); //TimeZone.getTimeZone("GMT");
            if (usertimeZone != null) {
                if (usertimeZone instanceof String)
                    appropriateTimeZone = TimeZone.getTimeZone((String) usertimeZone);
                else if (usertimeZone instanceof TimeZone)
                    appropriateTimeZone = (TimeZone) usertimeZone;
                else
                    throw new IllegalArgumentException("TimeZone could be either String or java.util.TimeZone");
            } else {
                appropriateTimeZone = TimeZone.getDefault();
            }
        }

        return appropriateTimeZone;
    }


 /*   public boolean hasTime() {
        String pattern = getPattern();

        return (pattern != null && pattern.indexOf(":") != -1);
    }   */

    public int getMonthInt() {
        return monthInt;
    }

    public void setMonthInt(int monthInt) {
        this.monthInt = monthInt;
    }

    public int getYearInt() {
        return yearInt;
    }

    public void setYearInt(int yearInt) {
        this.yearInt = yearInt;
    }

    public int getDayInt() {
        return dayInt;
    }

    public void setDayInt(int dateInt) {
        this.dayInt = dateInt;
    }

    public Attribute[] getCommonAttributeNames() {
        return commonAttributeNames;
    }

    protected FacesContext getFacesContext() {
        return FacesContext.getCurrentInstance();
    }
}