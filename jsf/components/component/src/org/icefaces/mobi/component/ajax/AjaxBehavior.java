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
package org.icefaces.mobi.component.ajax;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;

import javax.el.ELContext;
import javax.el.MethodExpression;
import javax.el.MethodNotFoundException;
import javax.el.ValueExpression;
import javax.faces.component.UIComponentBase;
import javax.faces.component.behavior.ClientBehaviorBase;
import javax.faces.component.behavior.ClientBehaviorHint;
import javax.faces.component.behavior.FacesBehavior;
import javax.faces.context.FacesContext;
import javax.faces.event.BehaviorListener;

@FacesBehavior("org.icefaces.mobi.component.AjaxBehavior")
public class AjaxBehavior extends ClientBehaviorBase {
    static enum Property {
        onStart(String.class),
        onComplete(String.class),
        onSuccess(String.class),
        onError(String.class),
        disabled(Boolean.TYPE),
        immediate(Boolean.TYPE),
        execute(String.class),
        render(String.class);

        final Class expectedType;

        Property(Class expectedType) {
            this.expectedType = expectedType;
        }
    }

    private static final Set<ClientBehaviorHint> HINTS = Collections.unmodifiableSet(EnumSet.of(ClientBehaviorHint.SUBMITTING));

    private Map<Property, Object> literals;
    private Map<Property, ValueExpression> bindings;

    public AjaxBehavior() {
        super();
        final int maxProperties = Property.values().length;
        literals = new HashMap<Property, Object>(maxProperties);
        bindings = new HashMap<Property, ValueExpression>(maxProperties);
    }
    
    @Override
    public String getRendererType() {
        return "org.icefaces.mobi.component.AjaxBehaviorRenderer";
    }
    
    @Override
    public Set<ClientBehaviorHint> getHints() {
        return HINTS;
    }

    @Override
    public void addBehaviorListener(BehaviorListener listener) {
        super.addBehaviorListener(listener);
    }

    public String getOnComplete() {
        return (String) eval(Property.onComplete, null);
    }

    public void setOnComplete(String onComplete) {
        setLiteral(Property.onComplete, onComplete);
    }

    public String getOnStart() {
        return (String) eval(Property.onStart, null);
    }

    public void setOnStart(String onStart) {
        setLiteral(Property.onStart, onStart);
    }

    public String getOnSuccess() {
        return (String) eval(Property.onSuccess, null);
    }

    public void setOnSuccess(String onSuccess) {
        setLiteral(Property.onSuccess, onSuccess);
    }

    public String getOnError() {
        return (String) eval(Property.onError, null);
    }

    public void setOnError(String onError) {
        setLiteral(Property.onError, onError);
    }

    public String getExecute() {
        return (String) eval(Property.execute, null);
    }

    public void setExecute(String execute) {
        setLiteral(Property.execute, execute);
    }

    public String getRender() {
        return (String) eval(Property.render, null);
    }

    public void setRender(String render) {
        setLiteral(Property.render, render);
        clearInitialState();
    }

    public boolean isDisabled() {
        Boolean ret = (Boolean) eval(Property.disabled, Boolean.FALSE);
        return ret.booleanValue();
    }

    public void setDisabled(boolean disabled) {
        setLiteral(Property.disabled, disabled);
    }

    public boolean isImmediate() {
        Boolean ret = (Boolean) eval(Property.immediate, Boolean.FALSE);
        return ret.booleanValue();
    }

    public void setImmediate(boolean immediate) {
        setLiteral(Property.immediate, immediate);
    }

    public boolean isImmediateSet() {
        return literals.containsKey(Property.immediate) ||
            bindings.containsKey(Property.immediate);
    }

    void setLiteral(Property prop, Object val) {
        literals.put(prop, val);
    }

    void setValueExpression(Property prop, ValueExpression ve) {
        bindings.put(prop, ve);
    }

    protected Object eval(Property prop, Object unspecifiedValue) {
        if (literals.containsKey(prop)) {
            Object val = literals.get(prop);
            if(val == null){
                return unspecifiedValue;
            } else {
                return val;
            }
        }
        ValueExpression ve = bindings.get(prop);
        if (ve != null) {
            FacesContext facesContext = FacesContext.getCurrentInstance();
            ELContext elContext = facesContext.getELContext();
            return ve.getValue(elContext);
        }
        return unspecifiedValue;
    }

    public Object saveState(FacesContext context) {
        if (context == null) {
            throw new NullPointerException();
        }
        Object[] values;

        Object superState = super.saveState(context);

        if (initialStateMarked()) {
            if (superState == null) {
                values = null;
            } else {
                values = new Object[] { superState };
            }
        } else {
            values = new Object[3];

            values[0] = superState;
            values[1] = savePropertyMap(context, literals, false);
			values[2] = savePropertyMap(context, bindings, true);
        }

        return values;
    }

    public void restoreState(FacesContext context, Object state) {
        if (context == null) {
            throw new NullPointerException();
        }
        if (state != null) {

            Object[] values = (Object[]) state;
            super.restoreState(context, values[0]);

            if (values.length != 1) {
                literals = restorePropertyMap(context, (Object[]) values[1], false);
                bindings = restorePropertyMap(context, (Object[]) values[2], true);

                // If we saved state last time, save state again next time.
                clearInitialState();
            }
        }
    }

    protected Object[] savePropertyMap(FacesContext context, Map map,
            boolean saveValuesAsAttachedState) {
        if (map == null) {
            return null;
        }
        Property[] propKeys = Property.values();
        Object[] values = new Object[propKeys.length];
        for (int i = 0; i < propKeys.length; i++) {
            values[i] = map.get(propKeys[i]);
            if (saveValuesAsAttachedState) {
                values[i] = UIComponentBase.saveAttachedState(context, values[i]);
            }
        }
        return values;
    }

    protected Map restorePropertyMap(FacesContext context, Object[] values,
            boolean restoreValuesFromAttachedState) {
        if (values == null) {
            return null;
        }
        Property[] propKeys = Property.values();
        Map<Property, Object> map = new HashMap<Property, Object>(propKeys.length);
        for (int i = 0; i < propKeys.length; i++) {
            Object val = values[i];
            if (restoreValuesFromAttachedState) {
                val = UIComponentBase.restoreAttachedState(context, val);
            }
            map.put(propKeys[i], val);
        }
        return map;
    }
}
