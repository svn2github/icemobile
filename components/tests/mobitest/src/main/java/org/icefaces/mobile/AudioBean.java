/* * Copyright 2004-2012 ICEsoft Technologies Canada Corp. * * Licensed under the Apache License, Version 2.0 (the "License"); * you may not use this file except in compliance with the * License. You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless required by applicable law or agreed to in writing, * software distributed under the License is distributed on an "AS * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either * express or implied. See the License for the specific language * governing permissions and limitations under the License. */package org.icefaces.mobile;import java.io.ByteArrayOutputStream;import java.io.File;import java.io.FileInputStream;import java.io.FileNotFoundException;import java.io.IOException;import java.io.Serializable;import java.net.URL;import java.net.URLConnection;import java.net.FileNameMap;import java.util.logging.Logger;import javax.faces.bean.ManagedBean;import javax.faces.bean.ViewScoped;import javax.faces.bean.SessionScoped;import javax.faces.context.FacesContext;@ManagedBean(name="audio")public class AudioBean implements Serializable{	private static final Logger logger =        Logger.getLogger(AudioBean.class.toString());	    private int id=0;	private boolean selected = false;    private String audioURL = "sample.mp4";    private String sampleAndroid="sampleAndroid.mp4";    private String clipName="sound.mp4";	private byte[] fileInBytes;	private byte[] clipInBytes;	private String contentType="audio/mp4";	private String contentType2;	public AudioBean(){		//no arg constructor is required		logger.info("audioBean version="+this);		if (null==fileInBytes)			try {				this.prepFile();				this.prepIPadClip();			} catch (FileNotFoundException e) {				// TODO Auto-generated catch block				e.printStackTrace();			}	}	public AudioBean(int Id, String title, String URI){		this.id=Id;		this.audioURL = URI;		this.clipName=title;		}	public void prepFile() throws FileNotFoundException{		File audioFile;	    FacesContext facesContext = FacesContext.getCurrentInstance(); 	    String sampleFilePath = facesContext.getExternalContext() 	    .getRealPath("/audio/") 	    .concat(File.separator) 	    .concat("japanese" + ".mp3"); 	    logger.info("trying to read file from path="+sampleFilePath);	    audioFile = new File(sampleFilePath); 	    logger.info("\t\t  size of file="+audioFile.getTotalSpace());	//Buffer some bytes. 	   FileInputStream fis = new FileInputStream(audioFile); 	   ByteArrayOutputStream bos = new ByteArrayOutputStream(); 	   byte[] buf = new byte[1024]; 	   try { 	      for (int readNum; (readNum = fis.read(buf)) != -1;) { 	        bos.write(buf, 0, readNum); //no doubt here is 0 	     } 	   } catch (IOException ex) { 	       logger.warning("Error writing out stream"); 	   } 	    this.fileInBytes= bos.toByteArray(); 	 }	private void prepIPadClip() throws FileNotFoundException {	   File clipFile;	   FacesContext facesContext = FacesContext.getCurrentInstance(); 	    String sampleFilePath = facesContext.getExternalContext() 	    .getRealPath("/audio/") 	    .concat(File.separator) 	    .concat("sampleIPad" + ".mp4"); 	    logger.info("trying to read file from path="+sampleFilePath);	    clipFile = new File(sampleFilePath); 	   	//Buffer some bytes. 	   FileInputStream fis = new FileInputStream(clipFile); 	   ByteArrayOutputStream bos = new ByteArrayOutputStream(); 	   byte[] buf = new byte[1024]; 	   try { 	      for (int readNum; (readNum = fis.read(buf)) != -1;) { 	        bos.write(buf, 0, readNum); //no doubt here is 0 	     } 	   } catch (IOException ex) { 	       logger.warning("Error writing out stream"); 	   } 		this.clipInBytes = bos.toByteArray();			}	   public byte[] getFileInBytes() {		return fileInBytes;	}	public void setFileInBytes(byte[] fileInBytes) {		this.fileInBytes = fileInBytes;	}   public AudioBean(int lId){      this.id=lId;   }   	public boolean isSelected() {	return selected;}public void setSelected(boolean selected) {	this.selected = selected;}public String getAudioURL() {	return audioURL;}public void setAudioURL(String audioURL) {	this.audioURL = audioURL;}	public void setId(int newId){		this.id = newId;	}	public int getId(){		return this.id;	}	public String getClipName() {		return clipName;	}	public void setClipName(String clipName) {		this.clipName = clipName;	}	public String getContentType() throws Exception{		return contentType;			}   public void setContentType(String incontent){	   this.contentType = incontent;   }   	String androidURL = "sampleAndroid.mp4";    public String getAndroidURL()  {        return androidURL;    }        String iPadURL= "sampleIPad.mp4";    public String getIPadURL(){    	return iPadURL;    }	public byte[] getClipInBytes() {		return clipInBytes;	}	public void setClipInBytes(byte[] clipInBytes) {		this.clipInBytes = clipInBytes;	}    }