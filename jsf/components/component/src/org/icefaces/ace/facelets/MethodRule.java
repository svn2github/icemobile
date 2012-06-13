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

package org.icefaces.ace.facelets;

import java.io.Serializable;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import javax.el.ELException;
import javax.el.MethodExpression;

import javax.faces.context.FacesContext;
import javax.faces.el.EvaluationException;
import javax.faces.el.MethodBinding;

import javax.faces.el.MethodNotFoundException;
import javax.faces.view.facelets.FaceletContext;
import javax.faces.view.facelets.MetaRule;
import javax.faces.view.facelets.Metadata;
import javax.faces.view.facelets.MetadataTarget;
import javax.faces.view.facelets.TagAttribute;
import javax.faces.view.facelets.TagAttributeException;

/**
 * Optional Rule for binding Method[Binding|Expression] properties
 *
 * @author Mike Kienenberger
 * @author Jacob Hookom
 * 
 * Implementation copied from Facelets 1.1.14, as it got hidden by JSF 2.0
 * copied over from ace project as it used to be in the generator.
 */
public class MethodRule extends MetaRule {
    /**
     * The name of the MethodExpression property in the UIComponent / ClientBehavior
     */
    private final String methodName;

    /**
     * The bean method return type
     */
    private final Class returnTypeClass;

    /**
     * The bean method parameters
     */
    private final Class[] params;

    /**
     * The name of the MethodExpression property in the UIComponent / ClientBehavior
     */
    private final String noArgMethodName;

    /**
     * The name of the MethodExpression property in the UIComponent / ClientBehavior
     */
    private final String superArgMethodName;

    /**
     * The bean superArgMethodName method parameters
     */
    private final Class[] superParams;

    public MethodRule(String methodName, Class returnTypeClass,
                      Class[] params, String noArgMethodName,
                      String superArgMethodName, Class[] superParams) {
        this.methodName = methodName;
        this.returnTypeClass = returnTypeClass;
        this.params = params;
        this.noArgMethodName = noArgMethodName;
        this.superArgMethodName = superArgMethodName;
        this.superParams = superParams;
    }

    public MethodRule(String methodName, Class returnTypeClass,
                      Class[] params) {
        this(methodName, returnTypeClass, params, null, null, null);
    }

    public Metadata applyRule(String name, TagAttribute attribute,
                              MetadataTarget meta) {
        if (false == name.equals(this.methodName))
            return null;

        if (MethodBinding.class.equals(meta.getPropertyType(name))) {
            Method method = meta.getWriteMethod(name);
            if (method != null) {
                Method noArgMethod = (noArgMethodName == null ? null :
                    meta.getWriteMethod(noArgMethodName));
                Method superArgMethod = ( (superArgMethodName == null ||
                    superParams == null) ? null : meta.getWriteMethod(superArgMethodName));
                return new MethodBindingMetadata(method, attribute,
                                                 this.returnTypeClass,
                                                 this.params, noArgMethod,
                                                 superArgMethod, superParams);
            }
        } else if (MethodExpression.class.equals(meta.getPropertyType(name))) {
            Method method = meta.getWriteMethod(name);
            if (method != null) {
                Method noArgMethod = (noArgMethodName == null ? null :
                    meta.getWriteMethod(noArgMethodName));
                Method superArgMethod = ( (superArgMethodName == null ||
                    superParams == null) ? null : meta.getWriteMethod(superArgMethodName));
                return new MethodExpressionMetadata(method, attribute,
                                                    this.returnTypeClass,
                                                    this.params, noArgMethod,
                                                    superArgMethod, superParams);
            }
        }

        return null;
    }

    private static class MethodBindingMetadata extends Metadata {
        private final Method _method;

        private final TagAttribute _attribute;

        private Class[] _paramList;

        private Class _returnType;

        private final Method _noArgMethod;

        private final Method _superArgMethod;

        private Class[] _superParamList;

        public MethodBindingMetadata(Method method, TagAttribute attribute,
                                     Class returnType, Class[] paramList,
                                     Method noArgMethod,
                                     Method superArgMethod, Class[] superParamList) {
            _method = method;
            _attribute = attribute;
            _paramList = paramList;
            _returnType = returnType;
            _noArgMethod = noArgMethod;
            _superArgMethod = superArgMethod;
            _superParamList = superParamList;
        }

        protected void setMethodBindingIntoMethod(FaceletContext ctx, Object instance,
                                                     Method method, Class[] paramList) {
            MethodExpression expr =
                _attribute.getMethodExpression(ctx, _returnType, paramList);

            try {
                method.invoke(instance,
                               new Object[] { new LegacyMethodBinding(expr) });
            } catch (InvocationTargetException e) {
                throw new TagAttributeException(_attribute, e.getCause());
            } catch (Exception e) {
                throw new TagAttributeException(_attribute, e);
            }
        }

        public void applyMetadata(FaceletContext ctx, Object instance) {
            setMethodBindingIntoMethod(ctx, instance, _method, _paramList);
            if (_noArgMethod != null) {
                setMethodBindingIntoMethod(ctx, instance, _noArgMethod, new Class[0]);
            }
            if (_superArgMethod != null && _superParamList != null) {
                setMethodBindingIntoMethod(ctx, instance, _superArgMethod, _superParamList);
            }
        }
    }

    private static class MethodExpressionMetadata extends Metadata {
        private final Method _method;

        private final TagAttribute _attribute;

        private Class[] _paramList;

        private Class _returnType;

        private final Method _noArgMethod;

        private final Method _superArgMethod;

        private Class[] _superParamList;

        public MethodExpressionMetadata(Method method, TagAttribute attribute,
                                        Class returnType, Class[] paramList,
                                        Method noArgMethod,
                                        Method superArgMethod, Class[] superParamList) {
            _method = method;
            _attribute = attribute;
            _paramList = paramList;
            _returnType = returnType;
            _noArgMethod = noArgMethod;
            _superArgMethod = superArgMethod;
            _superParamList = superParamList;
        }

        protected void setMethodExpressionIntoMethod(FaceletContext ctx, Object instance,
                                                     Method method, Class[] paramList) {
            MethodExpression expr =
                _attribute.getMethodExpression(ctx, _returnType, paramList);

            try {
                method.invoke(instance, new Object[] { expr });
            } catch (InvocationTargetException e) {
                throw new TagAttributeException(_attribute, e.getCause());
            } catch (Exception e) {
                throw new TagAttributeException(_attribute, e);
            }
        }

        public void applyMetadata(FaceletContext ctx, Object instance) {
            setMethodExpressionIntoMethod(ctx, instance, _method, _paramList);
            if (_noArgMethod != null) {
                setMethodExpressionIntoMethod(ctx, instance, _noArgMethod, new Class[0]);
            }
            if (_superArgMethod != null && _superParamList != null) {
                setMethodExpressionIntoMethod(ctx, instance, _superArgMethod, _superParamList);
            }
        }
    }
    

    private static class LegacyMethodBinding extends MethodBinding implements Serializable {

        private static final long serialVersionUID = 1L;

        private final MethodExpression m;

        public LegacyMethodBinding(MethodExpression m) {
            this.m = m;
        }

        /*
       * (non-Javadoc)
       *
       * @see javax.faces.el.MethodBinding#getType(javax.faces.context.FacesContext)
       */

        public Class getType(FacesContext context) throws MethodNotFoundException {
            try {
                return m.getMethodInfo(context.getELContext()).getReturnType();
            } catch (javax.el.MethodNotFoundException e) {
                throw new MethodNotFoundException(e.getMessage(),
                                                  e.getCause());
            } catch (ELException e) {
                throw new EvaluationException(e.getMessage(), e.getCause());
            }
        }

        /*
       * (non-Javadoc)
       *
       * @see javax.faces.el.MethodBinding#invoke(javax.faces.context.FacesContext,
       *      java.lang.Object[])
       */

        public Object invoke(FacesContext context,
                             Object[] params) throws EvaluationException,
                                                     MethodNotFoundException {
            try {
                return m.invoke(context.getELContext(), params);
            } catch (javax.el.MethodNotFoundException e) {
                throw new MethodNotFoundException(e.getMessage(),
                                                  e.getCause());
            } catch (ELException e) {
                throw new EvaluationException(e.getMessage(), e.getCause());
            }
        }

        public String getExpressionString() {
            return m.getExpressionString();
        }
    }
}
