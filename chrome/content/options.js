let simplyPinnedOptions =
{
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
            otherToolbars.forEach
            (
                function(tlbr)
                {
                    var lbl = document.createElement("label");
                    lbl.setAttribute("value", tlbr.getAttribute("toolbarname"));
                    lbl.style.paddingLeft = simplyPinnedOptions.LEFT_PADDING;
                    document.getElementById("optionsPane").appendChild(lbl);
                },
                this
            );
        }
    }
}

window.addEventListener("load", simplyPinnedOptions.init, false);