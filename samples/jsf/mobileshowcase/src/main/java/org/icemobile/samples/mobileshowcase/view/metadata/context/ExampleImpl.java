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

package org.icemobile.samples.mobileshowcase.view.metadata.context;

import java.io.Serializable;
import java.util.ArrayList;

import javax.annotation.PostConstruct;
import javax.faces.context.FacesContext;
import javax.faces.event.ActionEvent;

import org.icefaces.util.EnvUtils;
import org.icemobile.samples.mobileshowcase.util.FacesUtils;
import org.icemobile.samples.mobileshowcase.view.metadata.annotation.Destination;
import org.icemobile.samples.mobileshowcase.view.metadata.annotation.ResourceType;

/**
 *
 */
public class ExampleImpl<T> implements Example, ExampleResources, ContextBase, Serializable {

    private Class<T> parentClass;

    // example info
    private String selectedExamplePath;
    private String descriptionPath;
    private String examplePath;
    private String resourcesPath;

    // destination information for navigation
    private org.icemobile.samples.mobileshowcase.view.navigation.Destination destination;

    // example resource information
    private ArrayList<ExampleResource> exampleResource;
    private ArrayList<ExampleResource> javaResources;
    private ArrayList<ExampleResource> xhtmlResources;
    private ArrayList<ExampleResource> tldResources;
    private ArrayList<ExampleResource> externalResources;

    // default selected tab
    protected String defaultId = "example";

    public ExampleImpl(Class<T> parentClass) {
        this.parentClass = parentClass;
        exampleResource = new ArrayList<ExampleResource>();
        javaResources = new ArrayList<ExampleResource>();
        xhtmlResources = new ArrayList<ExampleResource>();
        tldResources = new ArrayList<ExampleResource>();
        externalResources = new ArrayList<ExampleResource>();
    }
    
    public ExampleImpl(){
        //void ctr required for proper serialization
    }

    @PostConstruct
    public void initMetaData() {
        // copy data over for the example properties
        if (parentClass.isAnnotationPresent(
                org.icemobile.samples.mobileshowcase.view.metadata.annotation.Example.class)) {
            org.icemobile.samples.mobileshowcase.view.metadata.annotation.Example example =
                    parentClass.getAnnotation(org.icemobile.samples.mobileshowcase.view.metadata.annotation.Example.class);
            descriptionPath = example.descriptionPath();
            examplePath = example.examplePath();
            resourcesPath = example.resourcesPath();
            selectedExamplePath = examplePath;
        }
        // copy data over for destination information.
        if (parentClass.isAnnotationPresent(
                Destination.class)) {
            Destination destinationAnnotation =
                    parentClass.getAnnotation(Destination.class);
            destination = new org.icemobile.samples.mobileshowcase.view.navigation.Destination(
                    destinationAnnotation.title(),
                    destinationAnnotation.titleExt(),
                    destinationAnnotation.titleBack());
        }
        // build up the separate lists of ExampleResources assigned to this class.
        if (parentClass.isAnnotationPresent(
                org.icemobile.samples.mobileshowcase.view.metadata.annotation.ExampleResources.class)) {
            org.icemobile.samples.mobileshowcase.view.metadata.annotation.ExampleResources exampleResources =
                    parentClass.getAnnotation(org.icemobile.samples.mobileshowcase.view.metadata.annotation.ExampleResources.class);
            org.icemobile.samples.mobileshowcase.view.metadata.annotation.ExampleResource[] resources =
                    exampleResources.resources();
            ExampleResource tmpResource;
            for (org.icemobile.samples.mobileshowcase.view.metadata.annotation.ExampleResource resource :
                    resources) {
                tmpResource = new ExampleResource(resource.title(), resource.resource(), resource.type());
                exampleResource.add(tmpResource);
                if (resource.type().equals(ResourceType.href)) {
                    externalResources.add(tmpResource);
                } else if (resource.type().equals(ResourceType.java)) {
                    javaResources.add(tmpResource);
                } else if (resource.type().equals(ResourceType.tld)) {
                    tldResources.add(tmpResource);
                } else if (resource.type().equals(ResourceType.xhtml)) {
                    xhtmlResources.add(tmpResource);
                }
            }
        }

    }

    /**
     * Utility for loading example tab set content include.
     *
     * @return retunrs path example resource include
     */
    public String loadExampleResource() {
        String resource = FacesUtils.getRequestParameter("resourceName");
        if (resource != null) {
            selectedExamplePath = resource;
        }
        return null;
    }

    /**
     * Utility for loading example tab set content include.
     *
     * @param event jsf action event, even'ts component attribute is used to
     *              retreive the attribute "resourceName".
     */
    public void loadExampleResource(ActionEvent event) {
        String resource = (String) event.getComponent().getAttributes().get("resourceName");
        if (resource != null) {
            selectedExamplePath = resource;
        }
    }

    public String getDescriptionPath() {
        return descriptionPath;
    }

    public String getExamplePath() {
        return examplePath;
    }

    public String getResourcesPath() {
        return resourcesPath;
    }

    public ArrayList<ExampleResource> getJavaResources() {
        return javaResources;
    }

    public ArrayList<ExampleResource> getXhtmlResources() {
        return xhtmlResources;
    }

    public ArrayList<ExampleResource> getTldResources() {
        return tldResources;
    }

    public ArrayList<ExampleResource> getExternalResources() {
        return externalResources;
    }

    public ArrayList<ExampleResource> getExampleResource() {
        return exampleResource;
    }

    public org.icemobile.samples.mobileshowcase.view.navigation.Destination getDestination() {
        return destination;
    }

    public String getSelectedExamplePath() {
        return selectedExamplePath;
    }

    public void setSelectedExamplePath(String selectedExamplePath) {
        this.selectedExamplePath = selectedExamplePath;
    }

    public String getDefaultId() {
        return defaultId;
    }

    public void setDefaultId(String defaultId) {
        this.defaultId = defaultId;
    }
}