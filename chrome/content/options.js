let SPOptions =
{
    /**
     * Variables used for keeping track of original hotkeys used to determine
     *  the if a restart is required.
     */
    origCtrlMod  : true,
    origAltMod   : true,
    origShiftMod : true,
    origKeyStr   : "t",
    
    init : function()
    {
        //GRABBING OTHER TOOLBARS ARRAY FROM BROWSER WINDOW
        var browserWindow = Components
            .classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator)
            .getMostRecentWindow("navigator:browser");
        var otherToolbars = browserWindow.SPChrome.otherToolbarElems;

        //POPULATING LIST OF OTHER TOOLBARS TO BE DISPLAYED IN OPTIONS PANE
        if(otherToolbars.length == 0)
            document.getElementById("chk_otherToolbars").style.display = "none";
        else
        {
            otherToolbars.forEach
            (
                function(tlbr)
                {
                    var lbl = document.createElement("label");
                    lbl.setAttribute("value", tlbr.getAttribute("toolbarname"));
                    lbl.setAttribute("class", "indent");
                    document.getElementById("simplypinned-grp-enable-toolbars")
                        .appendChild(lbl);
                },
                this
            );
        }
        
        //STORING ORIGINAL HOTKEY
        SPOptions.origCtrlMod =
            document.getElementById("chk_modifier-control").checked;
        SPOptions.origAltMod =
            document.getElementById("chk_modifier-alt").checked;
        SPOptions.origShiftMod =
            document.getElementById("chk_modifier-shift").checked;
        SPOptions.origKeyStr =
            document.getElementById("simplypinned-txt-toggle-key").value;
        
        window.removeEventListener("load", SPOptions.init, false);
    },
    
    onAccept : function()
    {
        var strBundle = document.getElementById("simplypinned-options-bundle");
        
        var newCtrlMod = document.getElementById("chk_modifier-control").checked;
        var newAltMod = document.getElementById("chk_modifier-alt").checked;
        var newShiftMod = document.getElementById("chk_modifier-shift").checked;
        var newKeyStr = document.getElementById("simplypinned-txt-toggle-key").value;
        
        var restartReq =
            (SPOptions.origCtrlMod  != newCtrlMod ) ||
            (SPOptions.origAltMod   != newAltMod  ) ||
            (SPOptions.origShiftMod != newShiftMod) ||
            (SPOptions.origKeyStr   != newKeyStr  );
            
        if(newKeyStr == "" || (!newCtrlMod && !newAltMod && !newShiftMod))
        {
            window.openDialog("chrome://simplypinned/content/generic-msg.xul",
                "invalidHotkeyWindow",
                "chrome,dialog,centerscreen,modal,resizable=no",
                strBundle.getString("invalidHotkey"));
                
            return false;
        }
        else if(restartReq)
        {
            window.open("chrome://simplypinned/content/restart-msg.xul",
                "reqRestartWindow",
                "chrome,dialog,centerscreen,modal,resizable=no");
            
            return true;
        }
        
        return true;
    }
}

window.addEventListener("load", SPOptions.init, false);