package org.icemobile.samples.spring.mediacast;

import java.awt.geom.AffineTransform;
import java.awt.image.AffineTransformOp;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.Serializable;
import java.util.Formatter;

import javax.annotation.PostConstruct;
import javax.imageio.ImageIO;
import javax.servlet.ServletContext;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.context.ServletContextAware;


/**
 * Helper class for processing and handling media files, mostly handler code best
 * kept out of the controller and model beans.
 *
 */
@Service
public class MediaHelper implements Serializable, ServletContextAware{
	
	private static final Log log = LogFactory
			.getLog(MediaHelper.class);
	
	private String videoConvertCommand;
	private String audioConvertCommand;
	private String thumbConvertCommand;
	
	private static final int SMALL_PHOTO_HEIGHT = 96;
	private static final int LARGE_PHOTO_HEIGHT = 320;
	
	private ServletContext servletContext;
	
	
	@PostConstruct
	public void init(){
		videoConvertCommand = servletContext
				.getInitParameter("org.icemobile.videoConvertCommand");

		audioConvertCommand = servletContext
				.getInitParameter("org.icemobile.audioConvertCommand");

		thumbConvertCommand = servletContext
				.getInitParameter("org.icemobile.thumbnailCommand");

		log.debug("video convert command: " + videoConvertCommand);
		log.debug("audio convert command: " + audioConvertCommand);
		log.debug("thumbnail convert command: " + thumbConvertCommand);
		
	}
	
	public void processImage(MediaMessage msg) {

		if (msg.getPhoto().getFile() == null) {
			log.warn("file is null");
			return;
		}
		try {
			log.info("incoming photo file to be processed: " + msg.getPhoto().getFile());
			BufferedImage image = ImageIO.read(msg.getPhoto().getFile());
			log.info("buffered image="+image);
			// scale the original file into a small thumbNail and the other
			// into a 1 megapixelish sized image.
			int width = image.getWidth();
			int height = image.getHeight();
			double xOffset = width > height ? (width - height) / 2 : 0; 			
			double yOffset = height > width ? (height - width) / 2 : 0; 

			// create the small photo
			AffineTransform tx = new AffineTransform();
			double imageScale = calculateImageScale(SMALL_PHOTO_HEIGHT, height);
			tx.scale(imageScale, imageScale);
			AffineTransformOp op = new AffineTransformOp(tx, AffineTransformOp.TYPE_BILINEAR);
			BufferedImage smallImage = op.filter(image, null);
			int scaledXOffset = new Long(Math.round(imageScale*xOffset)).intValue();
			int scaledYOffset = new Long(Math.round(imageScale*yOffset)).intValue();
			log.info("scaling small photo xoffset="+scaledXOffset+", yoffset="+scaledYOffset);
			BufferedImage croppedSmallImage = smallImage
					.getSubimage(scaledXOffset, scaledYOffset, SMALL_PHOTO_HEIGHT, SMALL_PHOTO_HEIGHT);
			log.info("medium buffered image: " + croppedSmallImage);

			// create the smaller image.
			imageScale = calculateImageScale(LARGE_PHOTO_HEIGHT, height);
			tx = new AffineTransform();
			tx.scale(imageScale, imageScale);
			op = new AffineTransformOp(tx, AffineTransformOp.TYPE_BILINEAR);
			BufferedImage largeImage = op.filter(image, null);
			scaledXOffset = new Long(Math.round(imageScale*xOffset)).intValue();
			scaledYOffset = new Long(Math.round(imageScale*yOffset)).intValue();
			log.info("scaling large photo xoffset="+scaledXOffset+", yoffset="+scaledYOffset);
			BufferedImage croppedLargeImage = largeImage
					.getSubimage(scaledXOffset, scaledYOffset, LARGE_PHOTO_HEIGHT, LARGE_PHOTO_HEIGHT);
			log.info("large buffered image: " + croppedLargeImage);
			
			// clean up images
			
			image.flush();

			msg.setLargePhoto(
					createPhoto(msg, croppedLargeImage, largeImage.getTileWidth(),
							largeImage.getHeight(), "-large"));
			log.info("large photo: " + msg.getLargePhoto());
			msg.setSmallPhoto(
					createPhoto(msg, croppedSmallImage,
							smallImage.getTileWidth(),
							smallImage.getHeight(), "-small"));
			log.info("small photo: " + msg.getSmallPhoto());
			
		} catch (Throwable e) {
			log.warn("Error processing camera image upload.",e);
		}
	}

	private Media createPhoto(MediaMessage msg, BufferedImage image, int width, int height, String suffix)
			throws IOException {
		File newFile = new File(msg.getPhoto().getFile().getParent()+File.separator+"img-"+msg.getId()+suffix+".png");
		ImageIO.write(image, "png", newFile);
		Media media = new Media();
		media.setFile(newFile);
		media.setHeight(height);
		media.setWidth(width);
		media.setType("image/png");
		return media;
	}

	private double calculateImageScale(int intendedSize, int height) {
		double scaleHeight = height / intendedSize;
		return 1 / scaleHeight;
	}
	
	public void setServletContext(ServletContext ctx) {
		this.servletContext = ctx;
	}


}
