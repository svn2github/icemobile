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

package org.icemobile.samples.spring.mediacast;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.Serializable;
import java.util.logging.Logger;


/**
 * Photo represents one image upload. Each message will normally have three
 * version, small, medium and large.
 */
public class Media implements Serializable {

	private static final Logger logger = Logger.getLogger(Media.class
			.toString());

	private String fileName;
	private File file;
	private final Object dataLock = new Object();
	private int width;
	private int height;
	private String type;

	public Media() {

	}

	public Media(byte[] data, int width, int height) {
		this(data, "image/png", width, height);
	}

	public Media(byte[] data, String type, int width, int height) {

		this.width = width;
		this.height = height;

		ByteArrayInputStream fis = new ByteArrayInputStream(data);
		ByteArrayOutputStream bos = new ByteArrayOutputStream();
		try {
			byte[] buf = new byte[4096];
			for (int readNum; (readNum = fis.read(buf)) != -1;) {
				bos.write(buf, 0, readNum);
			}
			synchronized (dataLock) {
				/*
				 * this.resource = new Resource( UUID.randomUUID().toString(),
				 * bos.toByteArray(), type);
				 */
			}
			bos.close();
			fis.close();
		} catch (Throwable e) {
			logger.warning("Error creating image resource");
		}
	}

	public String getFileName() {
		return fileName;
	}

	public void setFileName(String fileName) {
		this.fileName = fileName;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
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
	
	public void setFile(File file){
		this.file = file;
	}
	
	public void dispose(){
		file.delete();
		file = null;
		type = null;
		fileName = null;
	}
}
