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

package org.icefaces.mobile;

import java.io.Serializable;

import javax.faces.bean.ManagedBean;
import javax.faces.bean.SessionScoped;
import javax.faces.event.ActionEvent;


/**
 * <p>The CameraBean is used to test camera component.</p>
 */
@ManagedBean(name="positionBean")
@SessionScoped
public class PositionBean implements Serializable {

    private Double latitude = 0.00;
    private Double longitude=0.00;
    private Double altitude = 0.00;
    private boolean singleSubmit=false;
    private int errorCode = -1;

 
    public void submitForm(ActionEvent event){
    	//System.out.println("submitting form");
    }

	public Double getLatitude() {
		return latitude;
	}

	public void setLatitude(Double latitude) {
		this.latitude = latitude;
	}

	public Double getLongitude() {
		return longitude;
	}

	public void setLongitude(Double longitude) {
		this.longitude = longitude;
	}

    public boolean isSingleSubmit() {
        return singleSubmit;
    }

    public Double getAltitude() {
        return altitude;
    }

    public void setAltitude(Double altitude) {
        this.altitude = altitude;
    }

    public int getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(int errorCode) {
        this.errorCode = errorCode;
    }

    public void setSingleSubmit(boolean singleSubmit) {
        this.singleSubmit = singleSubmit;
    }
    public void clear(ActionEvent ae){
        this.latitude=0.00;
        this.longitude=0.00;
        this.errorCode = -1;
        this.altitude = 0.00;
    }
}
