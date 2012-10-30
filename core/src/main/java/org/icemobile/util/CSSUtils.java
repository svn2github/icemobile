package org.icemobile.util;

import javax.servlet.http.HttpServletRequest;

public class CSSUtils {
    
    public static final String CSS_COMPRESSION_POSTFIX = "-min";
    
    /* Common CSS Class Names */
    public static final String HIDDEN = "ui-screen-hidden";
    
    /* Mobi Style Classes */
    public static final String STYLECLASS_BUTTON = "mobi-button";
    public static final String STYLECLASS_BUTTON_DISABLED = " mobi-button-dis";
    public static final String STYLECLASS_BUTTON_ATTENTION = "mobi-button-attention";
    public static final String STYLECLASS_BUTTON_IMPORTANT = "mobi-button-important";
    public static final String STYLECLASS_BUTTON_BACK = "mobi-button-back";
    
    /* jQuery Mobile Classes */
    /* Collapsible */
    //div
    public static final String STYLECLASS_COLLAPSIBLESET = "ui-collapsible-set";
       //div
    public static final String STYLECLASS_COLLAPSIBLE = "ui-collapsible";
    public static final String STYLECLASS_COLLAPSED = "ui-collapsible-collapsed";
    public static final String STYLECLASS_COLLAPSIBLEINSET = "ui-collapsible-inset"; //if inset
          //h2
    public static final String STYLECLASS_COLLAPSIBLEHEADING = "ui-collapsible-heading";
    public static final String STYLECLASS_COLLAPSIBLEHEADINGTOGGLE = "ui-collapsible-heading-toggle";
       //div
    public static final String STYLECLASS_COLLAPSIBLECONTENT = "ui-collapsible-content";
    
    public enum Theme{ IPAD, IPHONE, BBERRY, ANDROID, HONEYCOMB, LIGHTNING;
        public String fileName(){
            return this.name().toLowerCase();
        }
        public static Theme getEnum(String val){
            if( val == null ){
                return null;
            }
            Theme result = null;
            try{
                result = Theme.valueOf(val.toUpperCase());
            }
            catch(IllegalArgumentException e){}
            return result;
        }
    }
    public enum View{ LARGE, SMALL;
        public static View getEnum(String val){
            if( val == null ){
                return null;
            }
            View result = null;
            try{
                result = View.valueOf(val.toUpperCase());
            }
            catch(IllegalArgumentException e){}
            return result;
        }
    }
    
    /**
     * Derive the appropriate theme for the request. 
     * 
     * If the targetView is supplied, the theme is derived based on the specified
     * view along with the the detected platform. If the targetView 
     * is not supplied, the theme is determined from the browser form factor 
     * and platform.
     * @param targetView The target view, 'small' or 'large'
     * @param request The servlet request
     * @return The theme name
     */
    public static Theme deriveTheme(String targetView, HttpServletRequest request) {

        ClientDescriptor client = ClientDescriptor.getInstance(request);
        Theme theme = null;
        View view = View.getEnum(targetView);
        if( view == null ){
            view = client.isHandheldBrowser() ? View.SMALL : View.LARGE;
        }
        
        if (client.isBlackBerryOS()) {
            theme = Theme.BBERRY;
        } 
        else if (client.isAndroidOS()) {
            if (view == View.SMALL) {
                theme = Theme.ANDROID;
            }
            else if( view == View.LARGE ){
                theme = Theme.HONEYCOMB;
            }
        } 
        else if (client.isIOS()) {
            if (view == View.SMALL) {
                theme = Theme.IPHONE;
            }
            else if( view == View.LARGE ){
                theme = Theme.IPAD;
            }
        } 
        else if( client.isIEBrowser()){ 
            theme = Theme.LIGHTNING;
        }
        else{
            theme = Theme.IPAD; //default for all others
        }
        return theme;
    }
    
    /**
     * Derive the appropriate theme for the request. 
     * 
     * The theme is automatically determined from the browser form factor 
     * and platform.
     * @param request
     * @return
     */
    public static Theme deriveTheme(HttpServletRequest request){
        return deriveTheme(null, request);
    }
    
    public static String getThemeCSSFileName(Theme theme, boolean production){
        return theme.fileName() + (production ? CSS_COMPRESSION_POSTFIX : "") + ".css";
    }


}
