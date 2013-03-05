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
package org.icemobile.component;

/**
 * Interface for the Mobile DataTable column
 *
 */
public interface IColumn {
    
    /**
     * @return The text to render for the column header
     */
    public String getHeaderText();
    
    /**
     * Set the text to render for the column header
     * @param text The unstyled header text
     */
    public void setHeaderText(String text);
    
    /**
     * @return The current value to render for the column
     */
    public String getValue();
    
    /**
     * Return the value from a cached method expression, for 
     * highly optimized large data sets with simple value expressions
     * @return The current value to render for the column
     */
    public String getValueFromCachedExpression();
    
    /**
     * Set the current value to render for the column
     * @param value The current value for the column
     */
    public void setValue(String value);
    
    /**
     * Set the minimum device width that the column will display for. 
     * This allows the column to be hidden for smaller views, while
     * still allowing the column information to be available in the
     * Detail Section.
     * @param deviceWidth the minimum client width for the column to display, eg '480px'
     */
    public void setMinDeviceWidth(String deviceWidth);
    
    /**
     * Get the minimum device resolution width that the column will display for. 
     * This allows the column to be hidden for smaller views, while
     * still allowing the column information to be available in the
     * Detail Section.
     * @return the minimum device width for the column to display, eg '480px'
     */
    public String getMinDeviceWidth();
    
    /**
     * Get the setting for optimizeExpression, which, when true, will cause
     * the DataTable to cache the ValueExpression Method bindings for for
     * higher performance.
     */
    public boolean isOptimizeExpression();
    
    /**
     * Set the setting for optimizeExpression, which, when true, will cause
     * the DataTable to cache the ValueExpression Method bindings for
     * higher performance.
     */
    public void setOptimizeExpression(boolean optimize);
    
    /**
     * Get the property name for the column, to be used with the detail
     * template for clientSide mode. The property can be used inside the 
     * detail section with clientSide expressions, eg {{myPropertyName}}
     * @return The property name string. 
     */
    public String getProperty();
    
    /**
     * Set the property name for the column, to be used with the detail
     * template for clientSide mode. The property can be used inside the 
     * detail section with clientSide expressions, eg {{myPropertyName}}
     * @param property The property name string. 
     */
    public void setProperty(String property);
     

}