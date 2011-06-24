let simplyPinnedOptions =
{
    //TODO: fix the bug where you can create a new custom toolbar and it
    //  1) doesn't have its name show up in the options screen (but the 
    //     other toolbars label does appear)
    //  2) doesn't have its name show up in the options screen without a restart
    
    //TODO: make LEFT_PADDING not hardcoded... somehow grab width from the checkbox?
    LEFT_PADDING : "25px",
    
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
                aLabel.style.paddingLeft = LEFT_PADDING;
                document.getElementById("optionsPane").appendChild(aLabel);
            }
        }
    }
}

window.addEventListener("load", simplyPinnedOptions.init, false);