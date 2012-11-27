package org.icemobile.samples.springbasic;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.SessionAttributes;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.context.WebApplicationContext;

import org.icepush.PushContext;
import org.icepush.PushNotification;

import java.io.IOException;
import java.util.Timer;
import java.util.TimerTask;
import javax.servlet.http.HttpServletRequest;
import javax.inject.Inject;

@Controller
@SessionAttributes("notificationsBean")
public class NotificationsController {

    Timer pushTimer = new Timer(true);

    @Inject
    private WebApplicationContext context;

    @ModelAttribute
    public void ajaxAttribute(WebRequest request, Model model) {
        model.addAttribute("ajaxRequest", AjaxUtils.isAjaxRequest(request));
    }

    @RequestMapping(value = "/notifications", 
            headers="content-type=application/x-www-form-urlencoded")
    public void fileUploadFormPost(HttpServletRequest request, Model model) {
        fileUploadForm(request, model);
    }

    @RequestMapping(value = "/notifications", method = RequestMethod.GET)
    public void fileUploadForm(HttpServletRequest request, Model model) {
        model.addAttribute("isGET", Boolean.TRUE);
    }

    @RequestMapping(value = "/notificationsregion")
    public void notificationsRegion() {
    }

    @ModelAttribute("notificationsBean")
    public NotificationsBean createBean() {
        return new NotificationsBean();
    }

    @RequestMapping(value = "/notifications", method = RequestMethod.POST)
    public void process(
            @RequestParam(value = "pushType", required = false) String pushType,
            @ModelAttribute("notificationsBean") NotificationsBean model)
            throws IOException {
        
        System.out.println("process: subject=" + model.getTitle() + ", message=" + model.getMessage());

        final PushContext pushContext = PushContext.getInstance(
                context.getServletContext() );
        final String title = model.title;
        final String message = model.message;
        model.setTitle("");
        model.setMessage("");
        final NotificationsBean notificationsBean = model;
        final boolean isCloud = "Priority Push".equals(pushType);
        TimerTask pushTask = new TimerTask()  {
            public void run()  {
                notificationsBean.title = title;
                notificationsBean.message = message;
                if (isCloud)  {
                    pushContext.push("notifications",
                            new PushNotification(title, message));
                } else  {
                    pushContext.push("notifications");
                }
            }
        };
        pushTimer.schedule(pushTask, model.delay * 1000);
    }

}