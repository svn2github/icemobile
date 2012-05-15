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

package org.icemobile.client.android;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.util.Map;

import android.app.Activity;
import android.webkit.WebView;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.MediaStore.Images.Media;
import android.graphics.Bitmap;
import android.os.Handler;
import android.util.Log;
import android.os.Bundle;

import android.media.ExifInterface;
import android.graphics.Matrix;

public class ARViewHandler {
    private Activity container;
    private WebView view;
    private UtilInterface util;
    private int code;
    private String url;
    private Handler handler;
    private File photoFile;
    private ARViewInterface arViewInterface;
    int height, width;
    int thumbHeight, thumbWidth;
    boolean thumbnail;
    String thumbId;
    boolean useGallery = false;

    public ARViewHandler(Activity container, WebView view, 
			 UtilInterface util, int arview_code) {
        this.container = container;
        this.view = view;
        this.code = arview_code;
        this.util = util;
        handler = new Handler();
    }

    public void setARViewInterface(ARViewInterface arViewInterface) {
        this.arViewInterface = arViewInterface;
    }

    public void setUrl(String URL) {
        url = URL;
    }

    public String arView(String id, Map<String,String>places ) {
        for (String label : places.keySet())  {
            Log.d("ARView", "Display " + label + " at " + places.get(label));
        }
        return "selectedlabel";
    }
}
