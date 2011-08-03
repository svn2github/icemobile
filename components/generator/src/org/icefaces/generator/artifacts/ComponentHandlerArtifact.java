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

package org.icefaces.generator.artifacts;

import org.icefaces.component.annotation.Component;
import org.icefaces.component.annotation.Expression;
import org.icefaces.generator.context.ComponentContext;
import org.icefaces.generator.utils.FileWriter;
import org.icefaces.generator.utils.PropertyValues;
import org.icefaces.generator.utils.Utility;

import java.lang.reflect.Field;
import java.util.List;

public class ComponentHandlerArtifact extends Artifact {
    private StringBuilder generatedComponentHandlerClass;

    public ComponentHandlerArtifact(ComponentContext componentContext) {
        super(componentContext);
    }

    @Override
    public void build() {
        if (!getComponentContext().isHasMethodExpression()) return;
        Component component = (Component) getComponentContext().getActiveClass().getAnnotation(Component.class);
        startComponentClass(getComponentContext().getActiveClass(), component);
        addRules(getComponentContext().getPropertyFieldsForComponentClassAsList());
        endComponentClass();

    }

    private void startComponentClass(Class clazz, Component component) {
        //initialize
        generatedComponentHandlerClass = new StringBuilder();

        int classIndicator = Utility.getClassName(component).lastIndexOf(".");
        generatedComponentHandlerClass.append("package ");
        generatedComponentHandlerClass.append(Utility.getClassName(component).substring(0, classIndicator));
        generatedComponentHandlerClass.append(";\n\n");
        generatedComponentHandlerClass.append("import javax.faces.view.facelets.ComponentHandler;\n");
        generatedComponentHandlerClass.append("import javax.faces.view.facelets.ComponentConfig;\n");
        generatedComponentHandlerClass.append("import javax.faces.view.facelets.MetaRuleset;\n");
        generatedComponentHandlerClass.append("import com.sun.faces.facelets.tag.MethodRule;\n\n");
        generatedComponentHandlerClass.append("import java.util.EventObject;\n");
        generatedComponentHandlerClass.append("/*\n * ******* GENERATED CODE - DO NOT EDIT *******\n */\n");


        generatedComponentHandlerClass.append("public class ");
        generatedComponentHandlerClass.append(clazz.getSimpleName());
        generatedComponentHandlerClass.append("Handler extends ComponentHandler");
        generatedComponentHandlerClass.append("{\n\n");

        generatedComponentHandlerClass.append("\n\tpublic ");
        generatedComponentHandlerClass.append(clazz.getSimpleName());
        generatedComponentHandlerClass.append("Handler(ComponentConfig componentConfig) {\n");
        generatedComponentHandlerClass.append("\t\tsuper(componentConfig);\n");
        generatedComponentHandlerClass.append("\t}\n\n\n");
    }


    private void endComponentClass() {
        generatedComponentHandlerClass.append("\n}");
        createJavaFile();

    }

    private void createJavaFile() {
        Component component = (Component) getComponentContext().getActiveClass().getAnnotation(Component.class);
        String componentClass = Utility.getClassName(component);
        String fileName = getComponentContext().getActiveClass().getSimpleName() + "Handler.java";
        String pack = getComponentContext().getActiveClass().getPackage().getName();
        String path = pack.replace('.', '/') + '/'; //substring(0, pack.lastIndexOf('.'));
        System.out.println("_________________________________________________________________________");
        System.out.println("File name " + fileName);
        System.out.println("path  " + path);
        FileWriter.write("support", path, fileName, generatedComponentHandlerClass);
    }

    private void addRules(List<Field> fields) {
        generatedComponentHandlerClass.append("\tprotected MetaRuleset createMetaRuleset(Class type) {\n");
        generatedComponentHandlerClass.append("\t\tMetaRuleset metaRuleset = super.createMetaRuleset(type);\n");
        for (int i = 0; i < fields.size(); i++) {
            Field field = fields.get(i);
            PropertyValues prop = getComponentContext().getPropertyValuesMap().get(field);

            if (prop.expression == Expression.METHOD_EXPRESSION) {
                generatedComponentHandlerClass.append("\t\tmetaRuleset.addRule( new MethodRule(\"");
                generatedComponentHandlerClass.append(field.getName());
                generatedComponentHandlerClass.append("\", null, new Class[");
                if (prop.methodExpressionArgument.length() > 0) {
                    generatedComponentHandlerClass.append("] {");
                    generatedComponentHandlerClass.append(prop.methodExpressionArgument);
                    generatedComponentHandlerClass.append(".class}");
                } else {
                    generatedComponentHandlerClass.append("0]");
                }
                generatedComponentHandlerClass.append(") );\n");
            }

        }
        generatedComponentHandlerClass.append("\t\n\t\treturn metaRuleset;\n");
        generatedComponentHandlerClass.append("\t}");
    }
}
