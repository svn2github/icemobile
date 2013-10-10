/*
 * Copyright 2004-2013 ICEsoft Technologies Canada Corp.
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

package org.icefaces.mobi.component.timespinner;


import org.icefaces.mobi.utils.Attribute;
import org.icefaces.mobi.utils.Utils;

import javax.faces.context.FacesContext;
import java.util.Locale;
import java.util.TimeZone;
import java.util.logging.Logger;

public class TimeSpinner extends TimeSpinnerBase {

    private static Logger logger = Logger.getLogger(TimeSpinner.class.getName());
    public static final String BLACKOUT_PNL_CLASS = "mobi-time-bg";
    public static final String BLACKOUT_PNL_INVISIBLE_CLASS = "mobi-time-bg-inv";
    public static final String CONTAINER_CLASS = "mobi-time-container";
    public static final String CONTAINER_INVISIBLE_CLASS = "mobi-time-container-inv";
    public static final String INPUT_CLASS = "mobi-input-text";
    public static final String POP_UP_CLASS = "mobi-time-popup-btn";
    public static final String TITLE_CLASS = "mobi-time-title-container";
    public static final String SELECT_CONT_CLASS = "mobi-time-select-container";
    public static final String VALUE_CONT_CLASS = "mobi-time-select-value-cont";
    public static final String BUTTON_INC_CONT_CLASS = "mobi-time-btn-cont-incr";
    public static final String BUTTON_INC_CLASS = "mobi-time-btn mobi-time-btn-incr";
    public static final String SEL_VALUE_CLASS = "mobi-time-select-value";
    public static final String BUTTON_DEC_CONT_CLASS = "mobi-time-btn-cont-decr";
    public static final String BUTTON_DEC_CLASS = "mobi-time-btn mobi-time-btn-decr";

    private Attribute[] commonAttributeNames = {
            new Attribute("size", null)
    };

    private int hourInt;
    private int minuteInt;
    private int ampm;

    private Locale appropriateLocale;
    private TimeZone appropriateTimeZone;

    public TimeSpinner() {
        super();
    }

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
                    throw new IllegalArgumentException("Type:" +
                            userLocale.getClass() +
                            " is not a valid locale type for calendar:" +
                            this.getClientId(facesContext));
            } else {
                appropriateLocale = facesContext.getViewRoot().getLocale();
            }
        }

        return appropriateLocale;
    }

    public TimeZone calculateTimeZone() {
        if (appropriateTimeZone == null) {
            //default to GMT
            Object usertimeZone = TimeZone.getDefault(); //TimeZone.getTimeZone("GMT");
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

    public int getHourInt() {
        return hourInt;
    }

    public void setHourInt(int hourInt) {
        this.hourInt = hourInt;
    }

    public int getMinuteInt() {
        return minuteInt;
    }

    public void setMinuteInt(int minuteInt) {
        this.minuteInt = minuteInt;
    }

    public int getAmpm() {
        return ampm;
    }

    public void setAmpm(int ampm) {
        this.ampm = ampm;
    }

    protected FacesContext getFacesContext() {
        return FacesContext.getCurrentInstance();
    }

    public Attribute[] getCommonAttributeNames() {
        return commonAttributeNames;
    }
}