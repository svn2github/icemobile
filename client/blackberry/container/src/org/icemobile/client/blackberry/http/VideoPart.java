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
package org.icemobile.client.blackberry.http;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;

/**
 * Class containing custom fields encapsulating a multipart video posting  
 *
 */
public class VideoPart extends Part {

    private String videoData;
    
    public VideoPart() { 
    }

    /**
     * 
     * @param fieldName Name of the field containing the image data
     * @param imageData The image data encoded in bsae64
     * @param filename
     */
    public VideoPart(String fieldName, String filename, String videoData ) { 
        super();
        super.setDisposition( "Content-Disposition: form-data; name=\"" + fieldName + "\"; filename=\"" + filename + "\"\r\n");
        super.setContentType( "Content-Type: video/3gpp\r\n");
        super.setTransferEncoding("Content-Transfer-Encoding: binary\r\n\r\n");
        this.videoData = videoData;
    }


    public void write( OutputStream os ) throws Exception { 

        super.write(os);
        ByteArrayOutputStream bos = new ByteArrayOutputStream(); 

        if (videoData != null) { 
            bos.write (videoData.getBytes());
        }
        os.write( bos.toByteArray() );
    }
}
