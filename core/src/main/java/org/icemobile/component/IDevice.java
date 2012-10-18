package org.icemobile.component;

import java.lang.String;

public interface IDevice extends IMobiComponent{
    
    public static final String CSS_CLASS = "mobi-button mobi-button-default";
    public static final String DISABLED_STYLE_CLASS = " mobi-button-dis";
    public static final String FOR_MSG = "for component was not detected. ";
    /*
      <p> this attribute can be used to override the use of the native
           camera and use the html5 input type="file" control instead.
           Some caution should be used as this will only pertain to the
           camera and camcorder integration and is not supported in all
           devices as of yet.  iOS6 and some android device browsers are
           supported, but it is left up to the developer to use at their
           discretion </p>
     */
    public boolean isUseNative();

    /*
       <p> if the container is used for camera, user can specify a maxwidth
           attribute that will limit the size of the image file uploaded
           to the server
       </p>
     */
    public int getMaxwidth();

    /*
        <p> if the container is used for camera, user can specify a maxwidth
           attribute that will limit the size of the image file uploaded
           to the server. the image will be constrained to fit within
           this dimension. should be used with setMaxheight.
       </p>
     */
    public void setMaxwidth(int width);

    /*
       <p> for camera only.  The native device will compress the image
       such that it fits within the specified minwidth and height
       </p>
     */
    public int getMaxheight();
     /*
       <p>  for camera only.  The native device will compress the image
       such that it fits within the specified minwidth and height
       </p>
     */
    public void setMaxheight(int height);
    /*
       <p> the script that will be executed  depending on container or
           icemobileSX presence
       </p>
     */
    public String getScript(String id, boolean isSX);

    /* <p>  can use this attribute for I8N compliance for camera label
            default is the label attribute
       </p>
     */
    public String getButtonLabel();

    /*
      <p> can set a value for the button label
      </p>
     */
    public void setButtonLabel(String buttonLabel);

     /*  <p> interface uses this for core renderer since JSP has all devices under
           once class.
       </p>
     */
    public String getComponentType();
    /*
        <p> core renderer requies for jsp for icemobileSX
        </p>
     */
    public String getSessionId();

    public String getParams();

}
