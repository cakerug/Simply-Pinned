let SimplyPinnedRestart =
{
    restartFirefox : function()
    {
        var nsIAppStartup = Components.interfaces.nsIAppStartup;
        
        var cancelQuit = Components.classes["@mozilla.org/supports-PRBool;1"]
            .createInstance(Components.interfaces.nsISupportsPRBool);
            
        var gObserverService = Components
            .classes["@mozilla.org/observer-service;1"]
            .getService(Components.interfaces.nsIObserverService);
            
        gObserverService.notifyObservers(cancelQuit,
            "quit-application-requested",
            "restart");
            
        if (cancelQuit.data) //somebody cancelled restart request
            return;
            
        Components.classes["@mozilla.org/toolkit/app-startup;1"]
            .getService(nsIAppStartup)
            .quit(nsIAppStartup.eRestart | nsIAppStartup.eAttemptQuit);
    }
}