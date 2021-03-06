/*
 * Copyright 2004-2014 ICEsoft Technologies Canada Corp.
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

package org.icefaces.mobi.component.dataview;

import org.icemobile.model.DataViewColumnModel;

import javax.el.ValueExpression;
import javax.faces.component.ValueHolder;
import javax.faces.convert.Converter;
import javax.faces.convert.ConverterException;
import javax.faces.convert.DateTimeConverter;
import java.text.DateFormat;
import java.util.Locale;
import java.util.TimeZone;

public class DataViewColumn extends DataViewColumnBase implements ValueHolder {

    public DataViewColumnModel getModel() {
        Converter converter = getConverter();
        final DateTimeConverter dtc = (converter != null && converter instanceof DateTimeConverter)
            ? (DateTimeConverter) converter : null;

        return new DataViewColumnModel() {
            public String getHeaderText() {
                return DataViewColumn.this.getHeaderText();
            }

            public String getFooterText() {
                return DataViewColumn.this.getFooterText();
            }

            /* can't define arbitrary html in facelet attribute*/
            public String getMarkup() {
                return null;
            }

            public boolean isSortable() {
               return DataViewColumn.this.isSortable();
	        }

            public String getType() {
                return DataViewColumn.this.getType().toString();
            }

            public String getDateType() {
                if (dtc != null) return dtc.getType();
                return null;
            }

            public String getDatePattern() {
                if (dtc != null) return  dtc.getPattern();
                return null;
            }

            public ValueExpression getValueExpression() {
                return DataViewColumn.this.getValueExpression("value");
            }

            public Object getValue() {
                return DataViewColumn.this.getValue();
            }

            public Integer getTimeStyle() {
                if (dtc != null) return getStyle(dtc.getTimeStyle());
                return null;
            }

            public Integer getDateStyle() {
                if (dtc != null) return getStyle(dtc.getDateStyle());
                return null;
            }

            public TimeZone getTimeZone() {
                if (dtc != null) return  dtc.getTimeZone();
                return null;
            }

            public Locale getLocale() {
                if (dtc != null) return  dtc.getLocale();
                return null;
            }

            public boolean isRendered() {
                return DataViewColumn.this.isRendered();
            }

            public Integer getReactivePriority() {
                return DataViewColumn.this.getReactivePriority();
            }

            public String getStyleClass() {
                return DataViewColumn.this.getStyleClass();
            }
        };
    }

    private static int getStyle(String name) {
        if ("default".equals(name)) {
            return (DateFormat.DEFAULT);
        } else if ("short".equals(name)) {
            return (DateFormat.SHORT);
        } else if ("medium".equals(name)) {
            return (DateFormat.MEDIUM);
        } else if ("long".equals(name)) {
            return (DateFormat.LONG);
        } else if ("full".equals(name)) {
            return (DateFormat.FULL);
        } else {
            // PENDING(craigmcc) - i18n
            throw new ConverterException("Invalid style '" + name + '\'');
        }
    }

    public Object getLocalValue() {
        return getValue();
    }
}
