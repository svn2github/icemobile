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

import java.io.Serializable;
import java.util.Arrays;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.annotation.PostConstruct;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.bean.SessionScoped;
import javax.faces.context.FacesContext;
import javax.faces.event.ActionEvent;

import org.apache.commons.lang3.StringUtils;
import org.icefaces.application.PortableRenderer;
import org.icefaces.application.PushMessage;
import org.icefaces.application.PushRenderer;
import org.icefaces.util.EnvUtils;
import org.icemobile.samples.mediacast.navigation.NavigationModel;
import org.icemobile.samples.util.FacesUtils;

import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.bean.ViewScoped;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import javax.imageio.ImageIO;

import org.icefaces.application.PortableRenderer;
import org.icefaces.application.PushMessage;
import org.icefaces.application.PushRenderer;
import org.icefaces.util.EnvUtils;
import org.icemobile.samples.mediacast.navigation.NavigationModel;

/**
 * Controller which handles the media file uploads
 * via the new ICEfaces mobi components.
 */
@ManagedBean(name = MediaController.BEAN_NAME)
@ViewScoped
public class MediaController implements Serializable {

	public static final String BEAN_NAME = "mediaController";

	public static final String RENDER_GROUP = "mobi";

	public static final String MEDIA_FILE_KEY = "file";

    private static Logger logger =
            Logger.getLogger(MediaController.class.toString());

	private transient PortableRenderer portableRenderer;
	
	@ManagedProperty(value = "#{uploadModel}")
	private UploadModel uploadModel;
    
    @ManagedProperty(value="#{mediaStore}")
    private MediaStore mediaStore;
    
    @ManagedProperty(value="#{navigationModel}")
    private NavigationModel navigationModel;
	
	@ManagedProperty(value="#{mediaHelper}")
	private MediaHelper mediaHelper;
	
	@ManagedProperty(value="#{mediaView}")
	private MediaView mediaView;

	@PostConstruct
	public void init() {
		portableRenderer = PushRenderer.getPortableRenderer();
		
	}

	/**
	 * Upload the current media type. This method can be called multiple times on the same 
	 * MediaMessage to add different media types.
	 * 
	 * @param ae JSF ActionEvent
	 * 
	 */
	public void upload(ActionEvent ae) {
		processUpload(uploadModel, mediaStore);
	}
	
	public void processUpload(UploadModel model, MediaStore store){
		if( logger.isLoggable(Level.FINER)){
			logger.finer("processUpload()");
		}
		
		String selectedMediaInput = model.getSelectedMediaInput();
		String contentType = (String) model.getMediaMap().get(
				"contentType");
		logger.finer(model.toString());
		logger.finer("selectedMediaInput=" + selectedMediaInput);
		logger.finer("content type: " + contentType);

		// check that we have a valid file type before processing.
		if (contentType != null
				&& ((contentType.startsWith("image")
				|| contentType.startsWith("video") 
				|| contentType.startsWith("audio")))) {

			if (MediaMessage.MEDIA_TYPE_PHOTO.equals(selectedMediaInput)
					&& contentType.startsWith("image")) {
				mediaHelper.processUploadedImage(model, store);
			} else if (MediaMessage.MEDIA_TYPE_VIDEO.equals(selectedMediaInput)
					&& contentType.startsWith("video")) {
				mediaHelper.processUploadedVideo(model, store);
			} else if (MediaMessage.MEDIA_TYPE_AUDIO.equals(selectedMediaInput)
					&& contentType.startsWith("audio")) {
				mediaHelper.processUploadedAudio(model, store);
			}
			model.setSelectedMediaInput(null);
			logger.finer(uploadModel.getCurrentMediaMessage().toString());

		} else {
			String errorMsg = "An error occurred while upload the "
					+ selectedMediaInput + " file, please try again.";
			uploadModel.setUploadErrorMessage(errorMsg);
			logger.warning(errorMsg);
		}
	}

	/**
	 * An action listener method called from the "Done" button clicked when the user
	 * has completed all uploads
	 * 
	 * @param ae JSF ActionEvent 
	 */
	public void uploadsCompleted(ActionEvent ae) {
		logger.finer("uploadsCompleted()");
		MediaMessage msg = uploadModel.getCurrentMediaMessage();
		if (msg.isHasMedia()) {
			if( StringUtils.isNotEmpty(uploadModel.getTags())){
				msg.setTags(Arrays.asList(StringUtils.split(uploadModel.getTags())));
			}
			
			//set stock icons for small and medium if no photo is included
			if( uploadModel.getCameraFile() == null ){
				//they've uploaded video, so we'll use a stock movie icon
				if( uploadModel.getVideoFile() != null ){
					msg.addMediumPhoto(mediaHelper.getMovieIcon());
					msg.addSmallPhoto(mediaHelper.getMovieIconSmall());
				}
				//they haven't uploaded video, just audio
				else if( uploadModel.getAudioFile() != null ){
					msg.addMediumPhoto(mediaHelper.getSoundIcon());
					msg.addSmallPhoto(mediaHelper.getSoundIconSmall());
				}
			}
			
			mediaStore.addMedia(msg);
			logger.finer("added new media message to store: " + msg);
			try {
				String body = msg.getTitle();
				portableRenderer.render(RENDER_GROUP, new PushMessage(
						"New Media Message", body));
				uploadModel.clearCurrentMediaMessage();
			} catch (Exception e) {
				logger.log(Level.WARNING,
						"Media message was not sent to recipients.");
			}
			uploadModel
					.setUploadErrorMessage("The Media Message sent successfully.");
		}

	}

	/**
	 * Cancel the upload and reset the controls back to input selection.
	 * 
	 */
	public void cancelUpload(ActionEvent ae) {
		uploadModel.clearCurrentMediaMessage();
	}

	public String viewMediaDetail() {
		if (uploadModel.getCurrentMediaMessage() != null) {
			navigationModel.goForward("media");
		}
		return null;
	}

	/**
	 * Deletes the currently selected media object from the media store.
	 * 
	 * @return null no jsf navigation takes place.
	 */
	public String deleteCurrentMedia() {
		if (mediaView.getMedia() != null) {

			// clear the resource
			mediaStore.removeMedia(mediaView.getMedia());

			navigationModel.goBack();
		}
		return null;

	}

	

	/**
	 * Test to see if the calling browser has the ICEmobile
	 * enhancements/extensions.
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
	 * ActionListener called from the 'Photo' button in home.xhtml
	 * 
	 * @param ae ActionEvent
	 */
	public void chooseCamera(ActionEvent ae) {
		logger.finer("chooseCamera()");
		uploadModel.setSelectedMediaInput(MediaMessage.MEDIA_TYPE_PHOTO);
		uploadModel.setUploadErrorMessage("");
	}

	/**
	 * ActionListener called from the 'Video' button in home.xhtml
	 * 
	 * @param ae ActionEvent
	 */
	public void chooseCamcorder(ActionEvent ae) {
		logger.finer("chooseCamcorder()");
		uploadModel.setSelectedMediaInput(MediaMessage.MEDIA_TYPE_VIDEO);
		uploadModel.setUploadErrorMessage("");
	}

	/**
	 * ActionListener called from the 'Audio' button in home.xhtml
	 * 
	 * @param ae ActionEvent
	 */
	public void chooseMicrophone(ActionEvent ae) {
		logger.finer("chooseMicrophone()");
		uploadModel.setSelectedMediaInput(MediaMessage.MEDIA_TYPE_AUDIO);
		uploadModel.setUploadErrorMessage("");
	}

    public void setUploadModel(UploadModel uploadModel){
    	this.uploadModel = uploadModel;
    }
    
    public void setMediaStore(MediaStore mediaStore){
    	this.mediaStore = mediaStore;
    }
    
    public void setNavigationModel(NavigationModel navigationModel){
    	this.navigationModel = navigationModel;
    }
    
    public void setMediaHelper(MediaHelper mediaHelper) {
		this.mediaHelper = mediaHelper;
	}

	public void setMediaView(MediaView mediaView) {
		this.mediaView = mediaView;
	}

	

}
