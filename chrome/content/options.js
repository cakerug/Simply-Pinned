let simplyPinnedOptions =
{
    init : function()
    {
        //GRABBING OTHER TOOLBARS ARRAY FROM BROWSER WINDOW
        var browserWindow = Components
                            .classes["@mozilla.org/appshell/window-mediator;1"]
                            .getService(Components.interfaces.nsIWindowMediator)
                            .getMostRecentWindow("navigator:browser");
        var otherToolbars = browserWindow.simplyPinnedChrome.otherToolbarElems;

        //POPULATING LIST OF OTHER TOOLBARS TO BE DISPLAYED IN OPTIONS PANE
        if(otherToolbars.length == 0)
        {
            document.getElementById("chk_otherToolbars").style.display = "none";
        }
        else
        {
            for(var i = 0; i < otherToolbars.length; i++)
            {
                var aLabel = document.createElement("label");
                aLabel.setAttribute("value",
                                    otherToolbars[i].getAttribute("toolbarname"));
                aLabel.style.paddingLeft = "25px"; //TODO: make this not hardcoded... if possible somehow grab from the checkbox width...
                document.getElementById("optionsPane").appendChild(aLabel);
            }
        }
    }
}

window.addEventListener("load", simplyPinnedOptions.init, false);