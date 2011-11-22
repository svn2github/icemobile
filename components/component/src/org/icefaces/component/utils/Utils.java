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

package org.icefaces.component.utils;

import org.icefaces.impl.util.CoreUtils;
import org.icefaces.impl.util.DOMUtils;
import org.icemobile.component.impl.SessionContext;

import javax.el.ValueExpression;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.faces.component.UIComponent;
import javax.faces.component.UIParameter;
import javax.faces.component.UIForm;
import javax.faces.component.NamingContainer;
import javax.faces.component.StateHelper;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.Part;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.StringTokenizer;
import java.util.logging.Level;
import java.util.logging.Logger;

/*
 * base was copied over from ace and then added to by mobility
 * 
 */
public class Utils {

    public enum DeviceType {
        android,
        honeycomb,
        bberry,
        iphone,
        ipad;
        public static final DeviceType DEFAULT = DeviceType.ipad;

        public boolean equals(String deviceName) {
            return this.name().equals(deviceName);
        }
    }

    private static Logger logger = Logger.getLogger(Utils.class.getName());

    public static void renderChildren(FacesContext facesContext,
                                      UIComponent component)
            throws IOException {
        if (component.getChildCount() > 0) {
            for (UIComponent child : component.getChildren()) {
                renderChild(facesContext, child);
            }
        }
    }


    public static void renderChild(FacesContext facesContext, UIComponent child)
            throws IOException {
        if (!child.isRendered()) {
            return;
        }

        child.encodeBegin(facesContext);
        if (child.getRendersChildren()) {
            child.encodeChildren(facesContext);
        } else {
            renderChildren(facesContext, child);
        }
        child.encodeEnd(facesContext);
    }

    public static UIComponent findNamingContainer(UIComponent uiComponent) {
        UIComponent parent = uiComponent.getParent();
        while (parent != null) {
            if (parent instanceof NamingContainer) {
                break;
            }
            parent = parent.getParent();
        }
        return parent;
    }


    public static UIComponent findForm(UIComponent uiComponent) {
        UIComponent parent = uiComponent.getParent();
        while (parent != null && !(parent instanceof UIForm)) {
            parent = findNamingContainer(parent);
        }
        return parent;
    }


    public static UIForm findParentForm(UIComponent comp) {
        if (comp == null) {
            return null;
        }
        if (comp instanceof UIForm) {
            return (UIForm) comp;
        }
        return findParentForm(comp.getParent());
    }


    public static void writeConcatenatedStyleClasses(ResponseWriter writer,
                                                     String componentClass, String applicationClass)
            throws IOException {
        int componentLen = (componentClass == null) ? 0 :
                (componentClass = componentClass.trim()).length();
        int applicationLen = (applicationClass == null) ? 0 :
                (applicationClass = applicationClass.trim()).length();
        if (componentLen > 0 && applicationLen == 0) {
            writer.writeAttribute("class", componentClass, "styleClass");
        } else if (componentLen == 0 && applicationLen > 0) {
            writer.writeAttribute("class", applicationClass, "styleClass");
        } else if (componentLen > 0 || applicationLen > 0) {
            int totalLen = componentLen + applicationLen;
            if (componentLen > 0 && applicationLen > 0) {
                totalLen++;
            }

            StringBuilder sb = new StringBuilder(totalLen);
            if (componentLen > 0) {
                sb.append(componentClass);
            }
            if (applicationLen > 0) {
                if (sb.length() > 0) {
                    sb.append(' ');
                }
                sb.append(applicationClass);
            }
            writer.writeAttribute("class", sb.toString(), "styleClass");
        }
    }

    public static void writeConcatenatedStyleClasses(ResponseWriter writer,
                                                     String componentClass, String applicationClass, boolean disabled)
            throws IOException {
        final String disabledStr = "-disabled";
        int componentLen = (componentClass == null) ? 0 :
                (componentClass = componentClass.trim()).length();
        int applicationLen = (applicationClass == null) ? 0 :
                (applicationClass = applicationClass.trim()).length();
        if (componentLen > 0 && applicationLen == 0) {
            if (disabled) {
                String styleClass = (componentClass + disabledStr).intern();
                writer.writeAttribute("class", styleClass, "styleClass");
            } else {
                writer.writeAttribute("class", componentClass, "styleClass");
            }
        } else if (componentLen == 0 && applicationLen > 0 && !disabled) {
            writer.writeAttribute("class", applicationClass, "styleClass");
        } else if (componentLen > 0 || applicationLen > 0) {
            int totalLen = componentLen + applicationLen;
            if (disabled && componentLen > 0) {
                totalLen += disabledStr.length();
            }
            if (disabled && applicationLen > 0) {
                totalLen += disabledStr.length();
            }
            if (componentLen > 0 && applicationLen > 0) {
                totalLen++;
            }

            StringBuilder sb = new StringBuilder(totalLen);
            if (componentLen > 0) {
                sb.append(componentClass);
                if (disabled) {
                    sb.append(disabledStr);
                }
            }
            if (applicationLen > 0) {
                if (sb.length() > 0) {
                    sb.append(' ');
                }
                sb.append(applicationClass);
                if (disabled) {
                    sb.append(disabledStr);
                }
            }
            writer.writeAttribute("class", sb.toString(), "styleClass");
        }
    }

    public static void writeConcatenatedStyleClasses(ResponseWriter writer,
                                                     String[] componentClasses, String applicationClass, boolean disabled)
            throws IOException {
        final String disabledStr = "-disabled";
        int componentCount = (componentClasses == null ? 0 :
                componentClasses.length);
        StringTokenizer st = new StringTokenizer(applicationClass, " ");
        int applicationCount = st.countTokens();

        if (componentCount == 1 && applicationCount == 0) {
            if (disabled) {
                String styleClass =
                        (componentClasses[0].trim() + disabledStr).intern();
                writer.writeAttribute("class", styleClass, "styleClass");
            } else {
                writer.writeAttribute("class", componentClasses[0], "styleClass");
            }
        } else if (componentCount == 0 && applicationCount == 1 && !disabled) {
            writer.writeAttribute("class", applicationClass, "styleClass");
        } else if (componentCount > 0 || applicationCount > 0) {
            StringBuilder sb = new StringBuilder(
                    (componentCount + applicationCount) * 16);
            for (int i = 0; i < componentCount; i++) {
                concatenateStyleClass(sb, componentClasses[i], disabled,
                        disabledStr);
            }
            while (st.hasMoreTokens()) {
                concatenateStyleClass(sb, st.nextToken(), disabled,
                        disabledStr);
            }
            sb.trimToSize();
            writer.writeAttribute("class", sb.toString(), "styleClass");
        }
    }

    private static void concatenateStyleClass(StringBuilder sb,
                                              String styleClass, boolean disabled, String disabledStr) {
        if (sb.length() > 0) {
            sb.append(' ');
        }
        sb.append(styleClass);
        if (disabled) {
            sb.append(' ');
            sb.append(styleClass);
            sb.append(disabledStr);
        }
    }


    public static boolean superValueIfSet(UIComponent component, StateHelper sh, String attName, boolean superValue, boolean defaultValue) {
        ValueExpression ve = component.getValueExpression(attName);
        if (ve != null) {
            return superValue;
        }
        String valuesKey = attName + "_rowValues";
        Map clientValues = (Map) sh.get(valuesKey);
        if (clientValues != null) {
            String clientId = component.getClientId();
            if (clientValues.containsKey(clientId)) {
                return superValue;
            }
        }
        String defaultKey = attName + "_defaultValues";
        Map defaultValues = (Map) sh.get(defaultKey);
        if (defaultValues != null) {
            if (defaultValues.containsKey("defValue")) {
                return superValue;
            }
        }
        return defaultValue;
    }

    /**
     * requires the ability to find the user-agent string and accept string from requestHeaders to determine
     * which device is being used.  Blackberry is tricky.... (need to test with as many actual devices as we can).
     *
     * @param context
     * @return
     */
    public static DeviceType getDeviceType(FacesContext context) {
        String userAgent = SessionContext.getSessionContext().getUserAgent();
        DeviceType device = checkUserAgentInfo(new UserAgentInfo(userAgent));
        return device;
    }

    /**
     * used by DateSpinner to detect which type of events to use
     * mobile devices get touch events
     * @param context
     * @return   true if mobile device
     */
    public static boolean isTouchEventEnabled (FacesContext context)  {
        String userAgent = SessionContext.getSessionContext().getUserAgent();
        UserAgentInfo uai = new UserAgentInfo(userAgent);
  //          commenting out Blackberry at this time as support of touch events is problematic
  //          if (uai.sniffIphone() || uai.sniffAndroid() || uai.sniffBlackberry()
        if (uai.sniffIphone() || uai.sniffAndroid() ||
               uai.sniffIpad() || uai.sniffIpod()) {
            return true;
        }
        return false;
    }

    /**
     *  Some input components may have html5 support for iOS5 such as DateSpinner
     * @param context
     * @return true if request header denotes os 5_0
     */
    public static boolean isIOS5 (FacesContext context) {
        String userAgent = SessionContext.getSessionContext().getUserAgent();
        UserAgentInfo uai = new UserAgentInfo(userAgent);
        if (uai.sniffIOS5()){
            return true;
        }
        return false;
    }

    private static DeviceType checkUserAgentInfo(UserAgentInfo uai) {
        if (uai.sniffIphone() || uai.sniffIpod()) return DeviceType.iphone;
        if (uai.sniffAndroid()) return DeviceType.android;
        if (uai.sniffAndroidTablet()) return DeviceType.honeycomb;
        if (uai.sniffBlackberry()) return DeviceType.bberry;
        if (uai.sniffIpad()) return DeviceType.ipad;
        return DeviceType.DEFAULT;
    }

    public static void createMapOfFile(Map map, HttpServletRequest request, Part part,
                                       String fileName, String contentType, FacesContext facesContext) throws IOException {

        final String UPLOADS_FOLDER = "uploads";
        String FILE_SEPARATOR = System.getProperty("file.separator");
        String folder = CoreUtils.getRealPath(facesContext, FILE_SEPARATOR);
//  	logger.info("path="+folder);
        String sessionId = CoreUtils.getSessionId(facesContext);
        String relativePath = "";

        if (sessionId != null && sessionId.length() > 0) {
            relativePath += FILE_SEPARATOR + UPLOADS_FOLDER + FILE_SEPARATOR + sessionId + FILE_SEPARATOR + fileName;
            folder += UPLOADS_FOLDER + FILE_SEPARATOR + sessionId + FILE_SEPARATOR;
//            logger.info("folder is"+folder);
        } else {
            relativePath += UPLOADS_FOLDER + FILE_SEPARATOR + fileName;
            folder += UPLOADS_FOLDER + FILE_SEPARATOR;
        }
        File dirFile = new File(folder);
        File newFile = new File(dirFile, fileName);
        boolean success = false;
        if (!dirFile.exists()) {
            success = dirFile.mkdirs();
        }
        try {
            part.write(newFile.getAbsolutePath());
        } catch (IOException e) {
            logger.log(Level.WARNING, "Error writing uploaded file to disk ", e);
        }
        map.put("file", newFile);
        map.put("contentType", contentType);
        map.put("relativePath", relativePath);
        if (logger.isLoggable(Level.FINER)) {
            logger.finer("wrote " + newFile.getAbsolutePath());
        }
    }

    public static void createMapOfByteArray(Map map, HttpServletRequest request, Part part,
                                            String contentType, FacesContext facesContext) throws IOException {
        //store in byte[] to map
        int size = (int) part.getSize();

        //assume that container component ensures max size not reached
        int totalRead = 0;
        byte[] fileContents = new byte[size];
        try {
            InputStream is = part.getInputStream();
            while (true) {
                int currentlyRead = is.read(fileContents, totalRead, size - totalRead);
//			    logger.info("   currentlyRead ="+currentlyRead+" size-total="+(size-totalRead));
                if (currentlyRead < 0) {
//			    	logger.info("currentlyRead<0");
                    //file could be done
                    break;
                }
                totalRead += currentlyRead;
                if (totalRead == size) {
                    break;
                }
            }
            map.put("fileInBytes", fileContents);
            map.put("contentType", contentType);
        } catch (IOException e) {
            logger.log(Level.WARNING, "ERROR creating byte array for component", e);
        }
    }

      /**
     * Capture UIParameter (f:param) children of a component
     *  used by commandButton for f:param support
     * @param component The component to work from
     * @return List of UIParameter objects, null if no UIParameter children present
     */
    public static List<UIParameter> captureParameters( UIComponent component) {
        List<UIComponent> children = component.getChildren();
        List<UIParameter>  returnVal = null;
        for (UIComponent child: children) {
            if (child instanceof UIParameter) {
                UIParameter param = (UIParameter) child;
                if (returnVal == null) {
                    returnVal = new ArrayList<UIParameter>();
                }
                returnVal.add( param );
            }
        }
        return returnVal;
    }

    /**
     * Return the name value pairs parameters as a ANSI escaped string
     * formatted in query string parameter format.
     * used by commandButton for f:param support
     * @param children List of children
     * @return a String in the form function(p){name1,value1,name2,value2...});
     */
    public static String asParameterString ( List<UIParameter> children) {
        StringBuffer builder = new StringBuffer();
        builder.append("function(p){");
        for (UIParameter param: children) { //assume all params are strings
            builder.append("p('"+DOMUtils.escapeAnsi(param.getName()) +"'")
                    .append(",'").append(DOMUtils.escapeAnsi(
                    (String)param.getValue() ).replace(' ', '+')).append("');");
        }

        builder.append("}");
        return builder.toString();
    }

}
