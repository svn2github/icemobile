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
import java.util.Set;

import javax.el.ELContext;
import javax.el.MethodExpression;
import javax.el.MethodNotFoundException;
import javax.el.ValueExpression;
import javax.faces.component.behavior.ClientBehaviorBase;
import javax.faces.component.behavior.ClientBehaviorHint;
import javax.faces.component.behavior.FacesBehavior;
import javax.faces.context.FacesContext;
import javax.faces.event.AbortProcessingException;
import javax.faces.event.BehaviorEvent;

@FacesBehavior("org.icefaces.mobi.component.AjaxBehavior")
public class AjaxBehavior extends ClientBehaviorBase {

    private String render;
    private String execute;
    private String onComplete;
    private String onError;
    private String onSuccess;
    private String onStart;
    private MethodExpression listener;
    private MethodExpression listenerNoArg;
    private MethodExpression listenerSuperArg;
    private boolean immediate = false;
    private boolean disabled = false;
    private boolean immediateSet = false;

    private static final Set<ClientBehaviorHint> HINTS = Collections.unmodifiableSet(EnumSet.of(ClientBehaviorHint.SUBMITTING));

    private Map<String, ValueExpression> bindings;

    @Override
    public String getRendererType() {
        return "org.icefaces.mobi.component.AjaxBehaviorRenderer";
    }
    
    @Override
    public Set<ClientBehaviorHint> getHints() {
        return HINTS;
    }

    public String getOnComplete() {
        return onComplete;
    }

    public void setOnComplete(String onComplete) {
        this.onComplete = onComplete;
    }

    public String getOnStart() {
        return onStart;
    }

    public void setOnStart(String onStart) {
        this.onStart = onStart;
    }

    public String getOnSuccess() {
        return onSuccess;
    }

    public void setOnSuccess(String onSuccess) {
        this.onSuccess = onSuccess;
    }

    public String getOnError() {
        return onError;
    }

    public void setOnError(String onError) {
        this.onError = onError;
    }

    public String getExecute() {
        return execute;
    }

    public void setExecute(String execute) {
        this.execute = execute;
    }

    public String getRender() {
        return render;
    }

    public void setRender(String render) {
        this.render = render;
        clearInitialState();
    }

    public MethodExpression getListener() {
        return listener;
    }

    public void setListener(MethodExpression listener) {
        this.listener = listener;
        clearInitialState();
    }
    
    public MethodExpression getListenerNoArg() {
        return listenerNoArg;
    }

    public void setListenerNoArg(MethodExpression listenerNoArg) {
        this.listenerNoArg = listenerNoArg;
    }

    public MethodExpression getListenerSuperArg() {
        return listenerSuperArg;
    }

    public void setListenerSuperArg(MethodExpression listenerSuperArg) {
        this.listenerSuperArg = listenerSuperArg;
    }

    public boolean isDisabled() {
        return disabled;
    }

    public void setDisabled(boolean disabled) {
        this.disabled = disabled;
    }

    public boolean isImmediate() {
        return immediate;
    }

    public void setImmediate(boolean immediate) {
        this.immediate = immediate;

        this.immediateSet = true;
    }

    public boolean isImmediateSet() {
        return immediateSet;
    }

    public void broadcast(BehaviorEvent event) throws AbortProcessingException {
        FacesContext context = FacesContext.getCurrentInstance();
        ELContext eLContext = context.getELContext();

        MethodNotFoundException last = null;
        if (listener != null) {
            try {
                listener.invoke(eLContext, new Object[] {event});
                return;
            } catch (MethodNotFoundException e) {
                last = e;
            }
        }
        if (listenerNoArg != null) {
            try {
                listenerNoArg.invoke(eLContext, new Object[0]);
                return;
            } catch (MethodNotFoundException e) {
                last = e;
            }
        }
        if (listenerSuperArg != null) {
            try {
                listenerSuperArg.invoke(eLContext, new Object[] {event});
                return;
            } catch (MethodNotFoundException e) {
                last = e;
            }
        }
        if (last != null) {
            throw last;
        }
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
            values = new Object[12];

            values[0] = superState;
            values[1] = listener;
            values[2] = render;
			values[3] = execute;
			values[4] = onComplete;
			values[5] = onError;
			values[6] = onSuccess;
			values[7] = onStart;
			values[8] = Boolean.valueOf(immediate);
			values[9] = Boolean.valueOf(immediateSet);
			values[10] = Boolean.valueOf(disabled);
            values[11] = listenerNoArg;
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
                listener = (MethodExpression)values[1];
                render = (String)values[2];
                execute = (String)values[3];
                onComplete = (String)values[4];
                onError = (String)values[5];
                onSuccess = (String)values[6];
                onStart = (String)values[7];
                immediate = ((Boolean)values[8]).booleanValue();
                immediateSet = ((Boolean)values[9]).booleanValue();
                disabled = ((Boolean)values[10]).booleanValue();
                listenerNoArg = (MethodExpression)values[11];

                // If we saved state last time, save state again next time.
                clearInitialState();
            }
        }
    }

}
