let simplyPinnedOptions =
{
    /**
     *
     */
    init : function()
    {
        //GRABBING OTHER TOOLBAR ARRAY FROM BROWSER WINDOW
        var browserWindow = Components
                            .classes["@mozilla.org/appshell/window-mediator;1"]
                            .getService(Components.interfaces.nsIWindowMediator)
                            .getMostRecentWindow("navigator:browser");
        var otherToolbars = browserWindow.simplyPinnedChrome.otherToolbarElems;

        //POPULATING LIST OF OTHER TOOLBARS TO BE DISPLAYED IN OPTIONS PANE
        if(otherToolbars.length == 0)
        {
            //TODO: Ideally, this should hide instead of disable.. Plus the disabling
            // is not very noticeable (not greyed out or anything... maybe should add greying out here)
            document.getElementById("chk_otherToolbars").disabled = true;
            var aLabel = document.createElement("label");
            aLabel.setAttribute("value", "none");
            aLabel.style.paddingLeft = "25px"; //TODO: make this not hardcoded... if possible somehow grab from the checkbox width...
            pane.appendChild(aLabel);
        }
        else
        {
            var pane = document.getElementById("optionsPane");
            for(var i = 0; i < otherToolbars.length; i++)
            {
                var aLabel = document.createElement("label");
                aLabel.setAttribute("value",
                                    otherToolbars[i].getAttribute("toolbarname"));
                aLabel.style.paddingLeft = "25px"; //TODO: make this not hardcoded... if possible somehow grab from the checkbox width...
                pane.appendChild(aLabel);
            }
        }
    }
}

window.addEventListener("load", simplyPinnedOptions.init, false);