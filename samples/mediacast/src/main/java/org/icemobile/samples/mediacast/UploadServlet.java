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

package org.icemobile.samples.mediacast;

import javax.servlet.ServletException;
import javax.servlet.ServletContext;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.annotation.WebListener;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.util.Map;
import java.util.HashMap;

@WebServlet(urlPatterns = {"/upload/*"})
@MultipartConfig
public class UploadServlet extends HttpServlet {
    static String TEMP_DIR = "javax.servlet.context.tmpdir";

    public void service(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        ServletContext servletContext = request.getServletContext();
        try {
            for (Part part : request.getParts()) {
                String partType = part.getContentType();
                String fileName = getAppropriateFileName(partType);
                if (null != fileName) {
                    String dirPath = servletContext
                            .getRealPath("/images") + "/";
                    File dirFile = new File(dirPath);
                    if (!dirFile.exists()) {
                        dirFile.mkdir();
                    }
                    String fullPath = dirPath + fileName;
                    writePart(part, fullPath);
                    UploadModel uploadModel = new UploadModel();
                    Map uploadAttributes = new HashMap();
                    uploadAttributes.put("file", new File(fullPath));
                    uploadAttributes.put("contentType", partType);
                    uploadModel.setMediaMap(uploadAttributes);
                    uploadModel.setVideo(uploadAttributes);
                    uploadModel.setAudio(uploadAttributes);
                    uploadModel.setSelectedMediaInput(
                            getAppropriateMediaType(partType));
                    MediaController mediaController = (MediaController)
                        servletContext.getAttribute(MediaController.BEAN_NAME);
                    MediaStore mediaStore = (MediaStore)
                        servletContext.getAttribute(MediaStore.BEAN_NAME);
                    mediaController.processUpload(uploadModel, mediaStore);
                }
            }
        } catch (Exception e) {
            //ignoring part decoding Exceptions
        }

        response.sendRedirect(request.getContextPath() + "/mediacast.jsf");
    }

    static String getAppropriateMediaType(String contentType)  {
        if (contentType.startsWith("image")) {
            return MediaMessage.MEDIA_TYPE_PHOTO;
        }
        if (contentType.startsWith("video"))  {
            return MediaMessage.MEDIA_TYPE_VIDEO;
        }
        if (contentType.startsWith("audio")) {
            return MediaMessage.MEDIA_TYPE_AUDIO;
        }
        return null;
    }

    static String getAppropriateFileName(String contentType)  {
        String baseName = String.valueOf(System.currentTimeMillis());
        if (contentType.startsWith("image")) {
            return baseName + ".jpg";
        }
        if (contentType.startsWith("video"))  {
            return baseName + ".mp4";
        }
        if (contentType.startsWith("audio")) {
            return baseName + ".mp4";
        }
        return null;
    }

    void writePart(Part part, String path) throws IOException {
        File tempDir = (File) ( getServletContext().getAttribute(TEMP_DIR) );
        File tempFile = File.createTempFile("ice", ".tmp", tempDir);
        FileOutputStream tempStream = new FileOutputStream(tempFile);

        InputStream partStream = part.getInputStream();
        copyStream(partStream, tempStream);
        tempFile.renameTo(new File(path));
    }

    public static void copyStream(InputStream in, OutputStream out) throws IOException {
        byte[] buf = new byte[1000];
        int l = 1;
        while (l > 0) {
            l = in.read(buf);
            if (l > 0) {
                out.write(buf, 0, l);
            }
        }
    }

}
