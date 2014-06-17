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

package org.icefaces.mobile;



import java.awt.geom.AffineTransform;
import java.awt.image.AffineTransformOp;
import java.awt.image.BufferedImage;
import java.awt.image.RescaleOp;
import java.io.File;
import java.lang.String;
import java.util.UUID;
import java.io.IOException;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.faces.application.FacesMessage;
import javax.faces.application.Resource;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ApplicationScoped;
import javax.faces.context.FacesContext;
import javax.faces.event.ActionEvent;
import javax.faces.event.ValueChangeEvent;
import javax.imageio.ImageIO;
import org.icefaces.mobi.utils.IceOutputResource;
import java.io.*;
import java.util.Formatter;
import org.icefaces.application.PushRenderer;
import org.icefaces.application.PushMessage;
import org.icefaces.impl.util.CoreUtils;
import org.icefaces.util.EnvUtils;
import javax.annotation.PreDestroy;

/**
 * <p>The CameraBean is used to test camera component.</p>
 */
@ManagedBean(name="cameraBean")
@ApplicationScoped
public class CameraBean implements Serializable {
	private static final Logger logger =
        Logger.getLogger(CameraBean.class.toString());
    private int idCounter = 0;
    private Map cameraImage = new HashMap<String, Object>();
    public static final String CAMERA_KEY_FILE = "file";
    private String pathToFile = "/images/icefaces.png";
    // files associated with the current user
    private final List fileList =
            Collections.synchronizedList(new ArrayList());
    private int width=200;
    private int height=200;
    private byte[] bytes;
    private boolean bytesAvailable = false;
    private String messageFromAL = " ValueChangenListener fired for camera";
    private String contentType;
    private String MESSAGE = "New Photo";
    private static int sampleUploadCount = 1;
    int fileId = -1;
	private int numberImages=0;
    private Resource imageResource = null;
    private File cameraFile;
    private String uploadMessage;
    /**
     * <p>Used with f:setPropertyActionListener to set current fileId.</p>
     *
     * @param fileId
     */
    public void setIdToDelete(int fileId)  {
        this.fileId = fileId;
    }

    public void setImagePush(Map image)  {
        setCameraImage(image);
        PushRenderer.render("camera", new PushMessage(MESSAGE));
    }
    public void processUploadedImage(ActionEvent event) {
         if (cameraImage != null &&
                 cameraImage.get("contentType") != null &&
                 ((String)cameraImage.get("contentType")).startsWith("image")) {
             contentType = ((String)cameraImage.get("contentType"));
             // clean up previously upload file
             if (cameraFile != null){
                 disposeResources();
             }
             cameraFile = (File)cameraImage.get("file");
             if (cameraFile != null) {
                 this.pathToFile = cameraFile.getAbsolutePath();
                 // copy the bytes into the resource object.
                 try {
                     imageResource = createResourceObject(
                         cameraFile, UUID.randomUUID().toString(),
                         contentType);
                 } catch (IOException ex) {
                     logger.warning("Error setting up video resource object");
                 }
                 uploadMessage = "Upload was successful";
                 return;
             }
         }else{
             // create error message for users.
             uploadMessage = "The uploaded image file could not be correctly processed.";
         }
         // a null/empty object is used in the page to hide the audio
         // component.
         imageResource = null;
     }

    public void setCameraImage(Map cameraImage) {
        this.cameraImage = cameraImage;
    /*    File imageFile;
        if (null==cameraImage){
            imageFile = new File("temp");
        }
        else {
          imageFile = (File) cameraImage.get(CAMERA_KEY_FILE);
          contentType = (String) cameraImage.get("contentType");
        }
  
        FacesContext facesContext = FacesContext.getCurrentInstance();

        BufferedImage image = null;
        try {
            if (imageFile != null) {            	
                 //actually have ability to call file anything
                this.numberImages++;
                this.pathToFile = imageFile.getAbsolutePath();
                String relativePath =  cameraImage.get("relativePath").toString();
                this.setPathToFile(relativePath);
                logger.info("Real PATH TO FILE+"+this.getPathToFile());
             //   logger.info("Retrieved Camera Image adding to ImageStore");
                FileInputStream fis = new FileInputStream(imageFile);
                imageResource = createResourceObject(
                        , UUID.randomUUID().toString(),
                        (String) cameraImage.get("file"));
                // try for a little clean up after
                imageFile.deleteOnExit();
              
            } else {
                logger.info("Camera Image Retrieval failed, loading test file from jar");
				//     FacesContext facesContext = FacesContext.getCurrentInstance();
                String sampleImagePath = facesContext.getExternalContext()
                        .getRealPath("/images/")
                        .concat(File.separator)
                        .concat("DSC_"+sampleUploadCount+".jpg");
                sampleUploadCount = (sampleUploadCount++ > 11)?0:sampleUploadCount;
                image = ImageIO.read(new File(sampleImagePath));
            }
        } catch (IOException e) {
            logger.log(Level.WARNING,
                    "Error reading sample upload file: ", e);
            e.printStackTrace();
        }
        // process the image and add the image store.
        if (image != null) {
            // scale the original file into a small thumbNail and the other
            // into a 1 megapixelish sized image.
            this.width = image.getWidth();
            this.height = image.getHeight();
            image.flush();
        }
        else{
            System.out.println("image is null!!!!");
        }  */
    }

    public Resource getImageResource() {
        return imageResource;
    }

    public void setImageResource(Resource imageResource) {
        this.imageResource = imageResource;
    }

    public Map getCameraImage() {
        return cameraImage;
    }

    public List getFileList() {
        return fileList;
    }
    
    public String getPathToFile() {
		return pathToFile;
	}
	public void setPathToFile(String pathToFile) {
		this.pathToFile = pathToFile;
	}
	public int getNumberImages() {
		return numberImages;
	}
	public void setNumberImages(int numberImages) {
		this.numberImages = numberImages;
	}
	public boolean isEmptyFileList() {
        return fileList.isEmpty();
    }
	public int getWidth() {
		return width;
	}
	public void setWidth(int width) {
		this.width = width;
	}
	public int getHeight() {
		return height;
	}
	public void setHeight(int height) {
		this.height = height;
	}
	public byte[] getBytes() {
		return bytes;
	}
	public void setBytes(byte[] bytes) {
		this.bytes = bytes;
	}
	public boolean isBytesAvailable() {
		return bytesAvailable;
	}
	public void setBytesAvailable(boolean bytesAvailable) {
		this.bytesAvailable = bytesAvailable;
	}
	
    public boolean isEnhancedBrowser()  {
        return EnvUtils.isEnhancedBrowser(FacesContext.getCurrentInstance());
    }

    public void methodOne(ValueChangeEvent event){
        // use this method to check filetype and can possibly remove the file if not correct filetype
         if (event!=null){
            Map compMap = (HashMap)event.getNewValue();
            File fname = (File)compMap.get("file");
            String filePath = fname.getAbsolutePath();
            if (contentType==null){
                contentType = ((String)cameraImage.get("contentType"));
            }
            if (contentType.equals("image/jpeg") || contentType.equals("image/png")){
                 messageFromAL="valid image uploaded of jpg or png";
            } else {
               messageFromAL = "invalid upload so can delete without user being able to access";
            }
         }
        logger.info("ValueChangeListener  event is null");
    }

    public String getMessageFromAL() {
        return messageFromAL;
    }

    public void setMessageFromAL(String messageFromAL) {
        this.messageFromAL = messageFromAL;
    }

        // copy the bytes into the resource object.
    public Resource createResourceObject(InputStream fis,
                                                String resourceName,
                                                String contentType) throws IOException {
        Resource outputResource = null;
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        for (int readNum; (readNum = fis.read(buf)) != -1; ) {
            bos.write(buf, 0, readNum);
        }
        outputResource = new IceOutputResource(resourceName,
                bos.toByteArray(), contentType);
        bos.close();
        fis.close();

        return outputResource;
    }
    public Resource createResourceObject(File resourceFile,
                                                String resourceName,
                                                String contentType) throws IOException {
        FileInputStream fis = new FileInputStream(resourceFile);
        return createResourceObject(fis, resourceName, contentType);
    }
    @PreDestroy
    public void disposeResources(){
        boolean success = cameraFile.delete();
        if (!success && logger.isLoggable(Level.FINE)){
            logger.fine("Could not dispose of media file" + cameraFile.getAbsolutePath());
     }
    }

    public File getCameraFile() {
        return cameraFile;
    }

    public void setCameraFile(File cameraFile) {
        this.cameraFile = cameraFile;
    }

    public String getUploadMessage() {
        return uploadMessage;
    }

    public void setUploadMessage(String uploadMessage) {
        this.uploadMessage = uploadMessage;
    }

}