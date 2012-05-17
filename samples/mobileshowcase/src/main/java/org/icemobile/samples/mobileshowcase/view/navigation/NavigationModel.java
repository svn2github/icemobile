package org.icemobile.samples.mobileshowcase.view.navigation;

import org.icefaces.util.JavaScriptRunner;
import org.icemobile.samples.mobileshowcase.util.FacesUtils;
import org.icemobile.samples.mobileshowcase.view.metadata.context.ExampleImpl;

import javax.faces.bean.ManagedBean;
import javax.faces.bean.SessionScoped;
import javax.faces.context.FacesContext;
import java.io.Serializable;
import java.util.Stack;

/**
 * Navigation stack test for using a content Stack component.  Normally only the
 * selectedPanel instance variable would be needed to manipulate the selected
 * panel in the panelStack.  But in this example we want to also keep have
 * the notion of a back button on a small display which requires us to also
 * keep a stack of recently visited panel id's.
 */
@ManagedBean(name = NavigationModel.BEAN_NAME)
@SessionScoped
public class NavigationModel implements Serializable {

    public static final String BEAN_NAME = "navigationModel";

    // currently selected panel and stack to keep track of history
    private String selectedPanel;
    private Stack<String> history = new Stack<String>();

    // Destination stores title information for display purposes.
    private Destination selectedDestination;
    // Selected example represents the currently selected example bean.
    private ExampleImpl selectedExample;
    // home destination, if stack is empty
    public static final Destination DESTINATION_HOME =
            new Destination(
                    "content.home.title", "content.home.title", "content.home.title");

    /**
     * Navigate to the selectedPanelId as well as save a reference to the current
     * Example bean defined by beanName.
     *
     * @param selectedPanelId panelId to to make visible
     * @param beanName        bean name of the currently selected example
     * @return always null, no jsf navigation.
     */
    public String navigateTo(String selectedPanelId, String beanName) {
        // add previous location to history.
        history.push(this.selectedPanel);
        this.selectedPanel = selectedPanelId;
        // assign the selected example
        selectedExample = (ExampleImpl) FacesUtils.getManagedBean(beanName);
        if (selectedExample != null) {
            selectedDestination = selectedExample.getDestination();
        } else {
            selectedDestination = DESTINATION_HOME;
        }
        scrollToTopOfPage();
        return null;
    }

    /**
     * Checks to see if back navigation is possible.
     *
     * @return true if back navigation is possible, otherwise false.
     */
    public boolean isCanGoBack() {
        return !history.isEmpty();
    }

    /**
     * Checks to see if the history stack has a state that can be restored.  If
     * true the selected panel is set accordingly.
     *
     * @return null, no JSF navigation.
     */
    public String goBack() {
        if (!history.isEmpty()) {
            selectedPanel = history.pop();
        }
        if (history.isEmpty()) {
            selectedDestination = DESTINATION_HOME;
        }
        scrollToTopOfPage();
        return null;
    }

    /**
     * Gets the currently selected panel.
     *
     * @return selected panel.
     */
    public String getSelectedPanel() {
        return selectedPanel;
    }

    public void setSelectedPanel(String selectedPanel) {
        this.selectedPanel = selectedPanel;
    }

    /**
     * Gets the currently selected destination, if none then the home destination
     * is returned by default.
     *
     * @return gets the selected destination, if null, the DESTINATION_HOME
     *         constant is resturned.
     */
    public Destination getSelectedDestination() {
        if (selectedDestination != null) {
            return selectedDestination;
        } else {
            return DESTINATION_HOME;
        }
    }

    public ExampleImpl getSelectedExample() {
        return selectedExample;
    }

    // make sure we scroll to the top of the page.
    private void scrollToTopOfPage() {
        JavaScriptRunner.runScript(FacesContext.getCurrentInstance(), "javascript:scroll(0,0);");
    }
}
