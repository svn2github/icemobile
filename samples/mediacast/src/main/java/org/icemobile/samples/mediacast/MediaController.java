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

package org.icemobile.samples.mediacast;

import org.icefaces.application.PushMessage;
import org.icefaces.application.PushRenderer;
import org.icefaces.util.EnvUtils;
import org.icefaces.component.utils.Utils;
import org.icemobile.samples.mediacast.navigation.NavigationModel;
import org.icemobile.samples.util.FacesUtils;

import javax.faces.bean.ApplicationScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import javax.imageio.ImageIO;
import java.awt.geom.AffineTransform;
import java.awt.image.AffineTransformOp;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.Formatter;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Stateless controller which handles the camera file uploads
 * via the new ICEfaces mobi components.
 */
@ManagedBean(name = MediaController.BEAN_NAME)
@ApplicationScoped
public class MediaController implements Serializable {

    public static final String BEAN_NAME = "mediaController";

    public static final String RENDER_GROUP = "mobi";

    public static final String MEDIA_FILE_KEY = "file";

    private static final Logger logger =
            Logger.getLogger(MediaController.class.toString());

    private Media soundIcon;
    private Media movieIcon;
    private Media soundIconSmall;
    private Media movieIconSmall;
    private String videoConvertCommand;
    private String audioConvertCommand;
    private String thumbConvertCommand;

    public MediaController() {
        BufferedImage image;
        InputStream imageStream;
        ExternalContext externalContext =
                FacesContext.getCurrentInstance().getExternalContext();

        videoConvertCommand = FacesContext.getCurrentInstance()
                .getExternalContext().getInitParameter(
                        "org.icemobile.videoConvertCommand");

        audioConvertCommand = FacesContext.getCurrentInstance()
                .getExternalContext().getInitParameter(
                        "org.icemobile.audioConvertCommand");

        thumbConvertCommand = FacesContext.getCurrentInstance()
                .getExternalContext().getInitParameter(
                        "org.icemobile.thumbnailCommand");
        /**
         * Video and Audio files don't have default thumbnail icons for preview
         * so we load the following thumbnails.
         */
        try {
            imageStream = externalContext.getResourceAsStream(
                    "/resources/images/soundIcon.png");
            image = ImageIO.read(imageStream);
            soundIcon = createPhoto(image,
                    image.getWidth(), image.getHeight());

            imageStream = externalContext.getResourceAsStream(
                    "/resources/images/movieIcon.png");
            image = ImageIO.read(imageStream);
            movieIcon = createPhoto(image,
                    image.getWidth(), image.getHeight());

            imageStream = externalContext.getResourceAsStream(
                    "/resources/images/soundIconSmall.png");
            image = ImageIO.read(imageStream);
            soundIconSmall = createPhoto(image,
                    image.getWidth(), image.getHeight());

            imageStream = externalContext.getResourceAsStream(
                    "/resources/images/movieIconSmall.png");
            image = ImageIO.read(imageStream);
            movieIconSmall = createPhoto(image,
                    image.getWidth(), image.getHeight());

        } catch (IOException e) {
            logger.log(Level.WARNING, "Error loading audio and video thumbnails.", e);
        }
    }

    /**
     * Process the file uploaded by the camera component.  If the file processing
     * is correct a push notification goes out to all active sessions.
     *
     * @return null no jsf navigation takes place.
     */
    public String upload() {
        // session scope model bean
        UploadModel uploadModel = (UploadModel)
                FacesUtils.getManagedBean(UploadModel.BEAN_NAME);
        // application scoped image cache bean
        MediaStore mediaStore = (MediaStore)
                FacesUtils.getManagedBean(MediaStore.BEAN_NAME);

        String selectedMediaInput = uploadModel.getSelectedMediaInput();
        String contentType = (String) uploadModel.getMediaMap().get("contentType");

        // check that we have a valid file type before processing.
        if (contentType != null &&
                (contentType.startsWith("image") ||
                        contentType.startsWith("video") ||
                        contentType.startsWith("audio"))) {

            File mediaFile = null;
            MediaMessage photoMessage = new MediaMessage();
            String subject = "";

            if (MediaMessage.MEDIA_TYPE_PHOTO.equals(selectedMediaInput) &&
                    contentType.startsWith("image")) {
                mediaFile = uploadModel.getCameraFile();
                processUploadedImage(photoMessage, mediaFile);
                subject = "New Photo";
                photoMessage.setComment(processComment(uploadModel.getComment(),
                        MediaMessage.MEDIA_TYPE_PHOTO));
                uploadModel.setCameraFile(null);
            } else if (MediaMessage.MEDIA_TYPE_VIDEO.equals(selectedMediaInput) &&
                    contentType.startsWith("video")) {
                mediaFile = uploadModel.getVideoFile();
                processUploadedVideo(photoMessage, mediaFile);
                subject = "New Video";
                photoMessage.setComment(processComment(uploadModel.getComment(),
                        MediaMessage.MEDIA_TYPE_VIDEO));
                uploadModel.setVideoFile(null);
            } else if (MediaMessage.MEDIA_TYPE_AUDIO.equals(selectedMediaInput) &&
                    contentType.startsWith("audio")) {
                mediaFile = uploadModel.getAudioFile();
                processUploadedAudio(photoMessage, mediaFile);
                photoMessage.setComment(processComment(uploadModel.getComment(),
                        MediaMessage.MEDIA_TYPE_AUDIO));
                subject = "New Audio";
                uploadModel.setAudioFile(null);
            }

            // only add the message if the file successfully uploaded.
            if (mediaFile != null) {
                mediaStore.addMedia(photoMessage);
                try {
                    String body = photoMessage.getComment();
                    PushRenderer.render(RENDER_GROUP,
                            new PushMessage(subject, body));
                } catch (Exception e) {
                    logger.log(Level.WARNING, "Media message was not sent to recipients.");
                }
                uploadModel.setUploadErrorMessage("The " + selectedMediaInput + " Message sent successfully.");
            } else {
                uploadModel.setUploadErrorMessage("An error occurred while upload the " + selectedMediaInput +
                        " file, please try again.");
            }
        } else {
            uploadModel.setUploadErrorMessage("An error occurred while upload the " + selectedMediaInput +
                    " file, please try again.");
        }

        // reset the selected input string, so the input selection buttons show up again.
        uploadModel.setSelectedMediaInput("");
        uploadModel.setComment("");

        return null;
    }

    /**
     * Cancel the upload and reset the controls back to input selection.
     *
     * @return null, no jsf navigation.
     */
    public String cancelUpload() {

        // session scope model bean
        UploadModel uploadModel = (UploadModel)
                FacesUtils.getManagedBean(UploadModel.BEAN_NAME);

        // reset the selected input string, so the input selection buttons show up again.
        uploadModel.setSelectedMediaInput("");
        uploadModel.setComment("");

        return null;
    }


    public String viewMediaDetail() {
        UploadModel uploadModel = (UploadModel)
                FacesUtils.getManagedBean(UploadModel.BEAN_NAME);
        if (uploadModel.getSelectedPhoto() != null) {
            // navigate to details page.
            NavigationModel navigationModel = (NavigationModel)
                    FacesUtils.getManagedBean(NavigationModel.BEAN_NAME);
            navigationModel.goForward(NavigationModel.DESTINATION_VIEWER.getKey());
        }
        return null;
    }

    /**
     * Deletes the currently selected media object from the media store.
     *
     * @return null no jsf navigation takes place.
     */
    public String deleteCurrentMedia() {
        UploadModel uploadModel = (UploadModel)
                FacesUtils.getManagedBean(UploadModel.BEAN_NAME);
        MediaStore mediaStore = (MediaStore)
                FacesUtils.getManagedBean(MediaStore.BEAN_NAME);

        if (uploadModel.getSelectedPhoto() != null) {

            // clear the resource
            mediaStore.removeMedia(uploadModel.getSelectedPhoto());

            // navigate to previous location.
            NavigationModel navigationModel = (NavigationModel)
                    FacesUtils.getManagedBean(NavigationModel.BEAN_NAME);
            navigationModel.goBack();
        }
        return null;

    }

    private File processFile(File inputFile, String commandTemplate,
                             String outputExtension) {
        StringBuilder command = new StringBuilder();
        try {
            File converted = File.createTempFile("out", outputExtension);
            Formatter formatter = new Formatter(command);
            formatter.format(commandTemplate,
                    inputFile.getAbsolutePath(),
                    converted.getAbsolutePath());
            Runtime runtime = Runtime.getRuntime();
            Process process = runtime.exec(command.toString());
            int exitValue = process.waitFor();
            if (0 != exitValue) {
                logger.log(Level.WARNING, "Transcoding failure: " + command);
                StringBuilder errorString = new StringBuilder();
                InputStream errorStream = process.getErrorStream();
                byte[] buf = new byte[1000];
                int len = -1;
                while ((len = errorStream.read(buf)) > 0) {
                    errorString.append(new String(buf, 0, len));
                }
                logger.log(Level.WARNING, errorString.toString());
            }
            return converted;
        } catch (Exception e) {
            //conversion fails, but we may proceed with original file
            logger.log(Level.WARNING, command + " Error processing file.", e);
        }
        return null;
    }

    /**
     * Test to see if the calling browser has the ICEmobile enhancements/extensions.
     *
     * @return true if an ICEmobile enhancements are detected, otherwise false.
     */
    public boolean isEnhancedBrowser() {
        FacesContext facesContext = FacesContext.getCurrentInstance();
        boolean isEnhanced = EnvUtils.isEnhancedBrowser(facesContext);
        boolean isAuxUpload = EnvUtils.isAuxUploadBrowser(facesContext);
        return isEnhanced || isAuxUpload;
    }

    /**
     * Test to see if we should show activation for ICEmobile-SX.
     *
     * @return true if ICEmobile-SX activation should be displayed.
     */
    public boolean isShowSX() {
        FacesContext facesContext = FacesContext.getCurrentInstance();
        boolean isEnhanced = EnvUtils.isEnhancedBrowser(facesContext);
        boolean isAuxUpload = EnvUtils.isAuxUploadBrowser(facesContext);
        boolean isIOS = Utils.isIOS();
        return (isIOS && !isEnhanced & !isAuxUpload);
    }

    private void processUploadedAudio(MediaMessage audioMessage, File audioFile) {
        if (audioFile == null) {
            return;
        }
        try {
            if (null != audioConvertCommand) {
                File converted =
                        processFile(audioFile, audioConvertCommand, ".m4a");
                File audioDir = audioFile.getParentFile();
                File newAudio = new File(audioDir, converted.getName());
                audioFile.delete();
                converted.renameTo(newAudio);
                audioFile = newAudio;
            }
        } catch (Exception e) {
            //conversion fails, but we may proceed with original file
            logger.log(Level.WARNING, "Error processing audio.", e);
        }
        audioMessage.addAudio(audioFile);
        audioMessage.addMediumPhoto(soundIcon);
        audioMessage.addSmallPhoto(soundIconSmall);
    }

    private void processUploadedVideo(MediaMessage videoMessage, File videoFile) {

        if (videoFile == null) {
            return;
        }

        Media customMovieIcon = movieIcon;

        try {
            // check to see if we can process the video file into an mp4 format
            // this is runtime config controlled in the web.xml
            if (null != videoConvertCommand) {
                File converted =
                        processFile(videoFile, videoConvertCommand, ".mp4");
                File videoDir = videoFile.getParentFile();
                File newVideo = new File(videoDir, converted.getName());
                videoFile.delete();
                converted.renameTo(newVideo);
                videoFile = newVideo;
            }

            // check if a thumb nail can be generated for the uploaded video
            // if so show it.
            if (null != thumbConvertCommand) {
                File thumbImage =
                        processFile(videoFile, thumbConvertCommand, ".jpg");
                customMovieIcon = createPhoto(thumbImage);
                thumbImage.delete();
            }

        } catch (Exception e) {
            //conversion fails, but we may proceed with original file
            logger.log(Level.WARNING, "Error processing video.", e);
        }
        videoMessage.addVideo(videoFile);
        videoMessage.addMediumPhoto(customMovieIcon);
        videoMessage.addSmallPhoto(movieIconSmall);
    }

    private void processUploadedImage(MediaMessage photoMessage, File cameraFile) {

        if (cameraFile == null) {
            return;
        }
        try {
            BufferedImage image = ImageIO.read(cameraFile);
            // scale the original file into a small thumbNail and the other
            // into a 1 megapixelish sized image.
            int width = image.getWidth();
            int height = image.getHeight();

            // create the thumbnail
            AffineTransform tx = new AffineTransform();
            double imageScale = calculateThumbNailSize(width, height);
            tx.scale(imageScale, imageScale);
            AffineTransformOp op = new AffineTransformOp(tx, AffineTransformOp.TYPE_BILINEAR);
            BufferedImage thumbNailImage = op.filter(image, null);

            //  create the small thumbnail.
            imageScale = calculateSmThumbNailSize(width, height);
            tx = new AffineTransform();
            tx.scale(imageScale, imageScale);
            op = new AffineTransformOp(tx, AffineTransformOp.TYPE_BILINEAR);
            BufferedImage smThumbNailImage = op.filter(image, null);

            // create the smaller image.
            imageScale = calculateSmallImageSize(width, height);
            tx = new AffineTransform();
            tx.scale(imageScale, imageScale);
            op = new AffineTransformOp(tx, AffineTransformOp.TYPE_BILINEAR);
            BufferedImage scaledImage = op.filter(image, null);

            // clean up the original image.
            image.flush();

            photoMessage.addLargePhoto(createPhoto(scaledImage,
                    scaledImage.getTileWidth(), scaledImage.getHeight()));
            photoMessage.addSmallPhoto(createPhoto(smThumbNailImage,
                    smThumbNailImage.getTileWidth(), smThumbNailImage.getHeight()));
            photoMessage.addMediumPhoto(createPhoto(thumbNailImage,
                    thumbNailImage.getTileWidth(), thumbNailImage.getHeight()));
            photoMessage.addPhoto(cameraFile);

        } catch (Throwable e) {
            logger.log(Level.WARNING, "Error processing camera image upload.", e);
        }
    }

    private Media createPhoto(File imageFile) throws IOException {
        BufferedImage image = ImageIO.read(imageFile);
        return createPhoto(image, image.getWidth(), image.getHeight());
    }

    private Media createPhoto(BufferedImage image, int width, int height)
            throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        byte[] fileContent = baos.toByteArray();
        baos.close();
        return new Media(fileContent, width, height);
    }


    public String chooseCamera() {
        UploadModel uploadModel = (UploadModel)
                FacesUtils.getManagedBean(UploadModel.BEAN_NAME);
        uploadModel.setSelectedMediaInput(MediaMessage.MEDIA_TYPE_PHOTO);
        uploadModel.setUploadErrorMessage("");
        return null;
    }

    public String chooseCamcorder() {
        UploadModel uploadModel = (UploadModel)
                FacesUtils.getManagedBean(UploadModel.BEAN_NAME);
        uploadModel.setSelectedMediaInput(MediaMessage.MEDIA_TYPE_VIDEO);
        uploadModel.setUploadErrorMessage("");
        return null;
    }

    public String chooseMicrophone() {
        UploadModel uploadModel = (UploadModel)
                FacesUtils.getManagedBean(UploadModel.BEAN_NAME);
        uploadModel.setSelectedMediaInput(MediaMessage.MEDIA_TYPE_AUDIO);
        uploadModel.setUploadErrorMessage("");
        return null;
    }

    /**
     * Utility to scale the image to a rough size of 96x96 pixels but still
     * maintaining the original aspect ratio.
     *
     * @param width  original width of image
     * @param height original height of image
     * @return scale factor to achieve "thumbnail" size.
     */
    private double calculateSmThumbNailSize(int width, int height) {
        double thumbSize = 16.0;
        return calculateImageSize(thumbSize, width, height);
    }

    /**
     * Utility to scale the image to a rough size of 96x96 pixels but still
     * maintaining the original aspect ratio.
     *
     * @param width  original width of image
     * @param height original height of image
     * @return scale factor to achieve "thumbnail" size.
     */
    private double calculateThumbNailSize(int width, int height) {
        double thumbSize = 96.0;
        return calculateImageSize(thumbSize, width, height);
    }

    /**
     * Utility to scale the image to a rough size of 96x96 pixels but still
     * maintaining the original aspect ratio.
     *
     * @param width  original width of image
     * @param height original height of image
     * @return scale factor to achieve "thumbnail" size.
     */
    private double calculateSmallImageSize(int width, int height) {
        double thumbSize = 320; //  320 x 480
        return calculateImageSize(thumbSize, width, height);
    }

    // utility to scale image to desired size.
    private double calculateImageSize(double intendedSize, int width, int height) {
        double scaleHeight = height / intendedSize;
        // change the algorithm, so height is always the same
        return 1 / scaleHeight;
    }

    /**
     * Utility to insure a comment is assigned to a new message.  If the specified
     * comment is empty or null then the default comment value is used.
     *
     * @param comment        comment value specified by user.
     * @param defaultComment default comment
     * @return comment value if not null or empty, otherwise default is returned.
     */
    private String processComment(String comment, String defaultComment) {
        if ((null != comment) && (!"".equals(comment))) {
            return comment;
        }
        return defaultComment;
    }

}
