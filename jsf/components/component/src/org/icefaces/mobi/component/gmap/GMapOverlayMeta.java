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

package org.icefaces.mobi.component.gmap;

import org.icefaces.ace.meta.annotation.Component;
import org.icefaces.ace.meta.annotation.Property;
import org.icefaces.ace.meta.baseMeta.UIPanelMeta;

import javax.faces.application.ResourceDependencies;
import javax.faces.application.ResourceDependency;

@Component(
        tagName         = "gMapOverlay",
        componentClass  = "org.icefaces.mobi.component.gmap.GMapOverlay",
        rendererClass   = "org.icefaces.mobi.component.gmap.GMapOverlayRenderer",
        generatedClass  = "org.icefaces.mobi.component.gmap.GMapOverlayBase",
        extendsClass    = "javax.faces.component.UIPanel",
        componentType   = "org.icefaces.mobi.component.GMapOverlay",
        rendererType    = "org.icefaces.mobi.component.GMapOverlayRenderer",
		componentFamily = "org.icefaces.mobi.component",
		tlddoc = "A version 3.0 API google map interface."
        )

@ResourceDependencies({
    @ResourceDependency(library = "org.icefaces.component.util", name = "component.js"),
    @ResourceDependency(library = "org.icefaces.component.gmap", name = "gmap.js")
})

public class GMapOverlayMeta extends UIPanelMeta {

	@Property(tlddoc="The name of the shape overlay you want to create. Valid entries are: Line, Polygon, Rectangle, Circle  (Case insensitive)")
	private String shape;
	
	@Property(tlddoc="The points that the service is applied to. Format is (lat,long) or, for Directions and Distance only, a standard address. Separate points with :")
	private String points;
	
	@Property(tlddoc="Additional options to be sent to the service. Check google maps API for more specifics. Form is attribute:'value'", defaultValue = "travelMode:'DRIVING'")
	private String options;

}
