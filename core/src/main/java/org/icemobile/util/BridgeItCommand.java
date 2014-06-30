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
package org.icemobile.util;

public enum BridgeItCommand {
    
    CAMERA("camera"),
    CAMCORDER("camcorder"),
    MICROPHONE("microphone"),
    FETCHCONTACTS("fetchContacts"),
    AUGMENTEDREALITY("aug"),
    CLOUDPUSH("push"),
    SCAN("scan"),
    GEOSPY("geospy"),
    SMS("sms"),
    BEACONS("beacons"), 
    SPEECH("speech"),
    REGISTER("register");
    
    public String code;
    
    BridgeItCommand(String code){
        this.code = code;
    }

}
