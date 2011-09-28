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
 * See the License for the specific language governing permissions an
 * limitations under the License.
 */

package org.icefaces.component.inputText;

import org.icefaces.component.utils.Attribute;

public class InputText extends InputTextBase {

    //passthrough attributes for textArea
    private Attribute[] textAreaAttributeNames = {
            new Attribute("cols", null),
            new Attribute("dirname", null),
            new Attribute("wrap", null),
            new Attribute("rows", null),
    };
    
    private Attribute[] numberAttributeNames = {
            new Attribute("type", null),
            new Attribute("min", null),
            new Attribute("max", null),
            new Attribute("step", null),
            new Attribute("rows", null),
    };

    //passthrough attributes for input text
    private Attribute[] inputtextAttributeNames = {
            new Attribute("type", null),
            new Attribute("autocomplete", null),
            new Attribute("autocapitalize", null),
            new Attribute("autocorrect", null),
            new Attribute("pattern", null),
            new Attribute("size", null)
    };

    private Attribute[] commonInputAttributeNames = {
            new Attribute("title", null),
            new Attribute("placeholder", null),
            new Attribute("maxlength", null),
            new Attribute("name", null),
            new Attribute("required", null),
            new Attribute("tabindex", null),
            new Attribute("style", null)
    };

    private Attribute[] booleanAttNames = {new Attribute("required", null),
            new Attribute("immediate", null),
            new Attribute("singleSubmit", null)};


    public Attribute[] getBooleanAttNames() {
        return booleanAttNames;
    }

    public void setBooleanAttNames(Attribute[] booleanAttNames) {
        this.booleanAttNames = booleanAttNames;
    }

    public Attribute[] getTextAreaAttributeNames() {
        return textAreaAttributeNames;
    }

    public void setTextAreaAttributeNames(Attribute[] textAreaAttributeNames) {
        this.textAreaAttributeNames = textAreaAttributeNames;
    }

    public Attribute[] getInputtextAttributeNames() {
        return inputtextAttributeNames;
    }

    public void setInputTextAttributeNames(Attribute[] inputtextAttributeNames) {
        this.inputtextAttributeNames = inputtextAttributeNames;
    }

    public Attribute[] getCommonInputAttributeNames() {
        return commonInputAttributeNames;
    }

    public void setCommonInputAttributeNames(Attribute[] commonInputAttributeNames) {
        this.commonInputAttributeNames = commonInputAttributeNames;
    }

	public String validateType(String attributeType) {
	    if (attributeType.equals("text")||attributeType.equals("number")||attributeType.equals("url")||
	    		attributeType.equals("textarea")||attributeType.equals("phone")||attributeType.equals("email")|| 
	    		attributeType.equals("password")){
	    	return attributeType;
	    }
	    else return "text";
	}

	public Attribute[] getNumberAttributeNames() {
		return numberAttributeNames;
	}


}
