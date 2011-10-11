/*
 * Copyright 2010 Prime Technology.
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
package org.icefaces.component.dateentry;

import java.text.SimpleDateFormat;
import java.util.Date;

import javax.faces.FacesException;
import javax.faces.context.FacesContext;

/**
 * Utility class for calendar component
 */
public class DateEntryUtils {

	public static String getValueAsString(FacesContext facesContext, DateEntry dateEntry) {
		Object submittedValue = dateEntry.getSubmittedValue();
		if(submittedValue != null) {
			return submittedValue.toString();
		}
		
		Object value = dateEntry.getValue();
		if(value == null) {
			return null;
		} else {
			//first ask the converter
			if(dateEntry.getConverter() != null) {
				return dateEntry.getConverter().getAsString(facesContext, dateEntry, value);
			}
			//Use built-in converter
			else {
				SimpleDateFormat dateFormat = new SimpleDateFormat(dateEntry.getPattern(), dateEntry.calculateLocale(facesContext));
				dateFormat.setTimeZone(dateEntry.calculateTimeZone());
				
				return dateFormat.format(value);
			}
		}
	}
	
	public static String getDateAsString(DateEntry dateEntry, Object date) {
		if(date == null) {
			return null;
		}
		
		if(date instanceof String){
			return (String) date;
		} else if(date instanceof Date) {
			SimpleDateFormat dateFormat = new SimpleDateFormat(dateEntry.getPattern(), dateEntry.calculateLocale(FacesContext.getCurrentInstance()));
			dateFormat.setTimeZone(dateEntry.calculateTimeZone());
			
			return dateFormat.format((Date) date);
		} else {
			throw new FacesException("Date could be either String or java.util.Date");
		}
	}
		
	/**
	 * Converts a java date pattern to a tigra date pattern
	 * 
	 * @param pattern Pattern to be converted
	 * @return converted pattern
	 */
	public static String convertPattern(String pattern) {
		if(pattern == null)
			return null;
		else {
			//year
			pattern = pattern.replaceAll("yy", "y");
			
			//month
			if(pattern.indexOf("MMM") != -1)
				pattern = pattern.replaceAll("MMM", "M");
			else
				pattern = pattern.replaceAll("M", "m");
			
			//day of week
			pattern = pattern.replaceAll("EEE", "D");

            //time
            if(pattern.indexOf("H") != -1 || pattern.indexOf("h") != -1) {
                pattern = pattern.replaceAll("H", "h").replaceAll("a", "TT");
            }
			
			return pattern;
		}
	}
}