package org.icemobile.samples.springbasic;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.SessionAttributes;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MultipartFile;

import org.icepush.PushContext;

import java.io.File;
import java.io.IOException;
import java.util.UUID;
import javax.servlet.http.HttpServletRequest;

@Controller
public class ICEmobileController {

	@ModelAttribute
	public void ajaxAttribute(WebRequest request, Model model) {
		model.addAttribute("ajaxRequest", AjaxUtils.isAjaxRequest(request));
	}

	@RequestMapping(value="/icemobile", method=RequestMethod.GET)
	public void fileUploadForm() {
	}

	@RequestMapping(value="/camregion", method=RequestMethod.GET)
	public void camRegion(HttpServletRequest request, Model model) {
		model.addAttribute("isGET", Boolean.TRUE);
		model.addAttribute("imgPath", getCurrentFileName(request));
	}

	@RequestMapping(value="/campush", method=RequestMethod.GET)
	public void camPush(HttpServletRequest request, Model model) {
		model.addAttribute("isGET", Boolean.TRUE);
		model.addAttribute("imgPath", getCurrentFileName(request));
	}

	@RequestMapping(value="/campushr", method=RequestMethod.GET)
	public void camPushr(HttpServletRequest request, Model model) {
		model.addAttribute("isGET", Boolean.TRUE);
		model.addAttribute("imgPath", getCurrentFileName(request));
	}

	@ModelAttribute("icemobileBean")
	public ModelBean createBean() {
		return new ModelBean();
	}

	@RequestMapping(value="/icemobile", method=RequestMethod.POST)
	public void processUpload(HttpServletRequest request, ModelBean modelBean, @RequestParam(value = "camera-file", required = false) MultipartFile file, @RequestParam(value = "camera", required = false) MultipartFile inputFile, Model model) throws IOException {
        String newFileName = saveImage(request, file, inputFile);
        if (((null != file) && !file.isEmpty()) || ((null != inputFile) && !inputFile.isEmpty()))  {
            model.addAttribute("message", "Hello " + modelBean.getName() + ", your file '" + newFileName + "' was uploaded successfully.");
        }
        if (null != newFileName)  {
            model.addAttribute("imgPath", newFileName);
        } else {
            model.addAttribute("imgPath", "resources/uploaded.jpg");
        }
	}

	@RequestMapping(value = "/campushr", method=RequestMethod.POST)
	public void pushCamerar(HttpServletRequest request, ModelBean modelBean, @RequestParam(value = "camera-file", required = false) MultipartFile file, @RequestParam(value = "camera", required = false) MultipartFile inputFile, Model model) throws IOException {
        
        this.pushCamera(request, modelBean, file, inputFile, model);
    }

	@RequestMapping(value = "/campush", method=RequestMethod.POST)
	public void pushCamera(HttpServletRequest request, ModelBean modelBean, @RequestParam(value = "camera-file", required = false) MultipartFile file, @RequestParam(value = "camera", required = false) MultipartFile inputFile, Model model) throws IOException {

        String newFileName = saveImage(request, file, inputFile);
        if (((null != file) && !file.isEmpty()) || ((null != inputFile) && !inputFile.isEmpty()))  {
            model.addAttribute("message", "Hello " + modelBean.getName() + ", your file '" + newFileName + "' was uploaded successfully.");
            PushContext.getInstance(request.getServletContext())
                    .push("camPush");
        }
        if (null != newFileName)  {
            model.addAttribute("imgPath", newFileName);
        } else {
            model.addAttribute("imgPath", "resources/uploaded.jpg");
        }
    }

	@RequestMapping(value = "/jsoncam", method=RequestMethod.POST)
	public @ResponseBody CamUpdate jsonCamera(HttpServletRequest request, ModelBean modelBean, @RequestParam(value = "camera-file", required = false) MultipartFile file, @RequestParam(value = "camera", required = false) MultipartFile inputFile, Model model) throws IOException {

        String newFileName = saveImage(request, file, inputFile);

        return new CamUpdate("Thanks for the photo, " + modelBean.getName(), 
                request.getContextPath() + "/" + newFileName);
    }

    private String saveImage(HttpServletRequest request, 
            MultipartFile file, MultipartFile inputFile) throws IOException {

        String fileName = null;
        String uuid = Long.toString(
                Math.abs(UUID.randomUUID().getMostSignificantBits()), 32 );
        String newFileName = "resources/img-" + uuid + ".jpg";
        if ((null != file) && !file.isEmpty())  {
            fileName = file.getOriginalFilename();
            file.transferTo(new File(request.getRealPath("/" + newFileName)));
            request.getServletContext().setAttribute(
                    this.getClass().getName(), newFileName );
        }
        if ((null != inputFile) && !inputFile.isEmpty())  {
            fileName = inputFile.getOriginalFilename();
            inputFile.transferTo(
                    new File(request.getRealPath("/" + newFileName)) );
            request.getServletContext().setAttribute(
                    this.getClass().getName(), newFileName );
        }

        if (null == fileName)  {
            //use previously uploaded file, such as from ICEmobile-SX
            newFileName = getCurrentFileName(request);

        }
        
        return newFileName;
    }

    private String getCurrentFileName(HttpServletRequest request)  {
        String currentName = (String) request.getServletContext().getAttribute(
                    this.getClass().getName() );
        if (null == currentName)  {
            return "resources/uploaded.jpg";
        }
        return currentName;
    }
}

class CamUpdate  {
    private String path;
    private String message;

    public CamUpdate(String message, String path)  {
        this.path = path;
        this.message = message;
    }

    public String getPath()  {
        return path;
    }

    public String getMessage()  {
        return message;
    }
}
