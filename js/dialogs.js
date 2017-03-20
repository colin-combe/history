var CLMSUI = CLMSUI || {};

CLMSUI.jqdialogs = {
    constructDialogMessage: function (dialogID, msg, title) {
        var dialog = d3.select("body").select("#"+dialogID);
        if (dialog.empty()) {
            dialog = d3.select("body").append("div").attr("id", dialogID);
        }
        dialog.selectAll("p").remove();
        dialog
            .attr("id", dialogID)
            .attr("title", title)
            .selectAll("p")
            .data(msg.split("<br>"))
            .enter()
                .append("p")
                .html (function(d) { return d; })
        ;
    },
    
    errorDialog: function (dialogID, msg, title) {
        msg = msg.concat("<br><A href='https://github.com/Rappsilber-Laboratory/' target='_blank'>Rappsilber Lab GitHub</A>");
        CLMSUI.jqdialogs.constructDialogMessage (dialogID, msg, title || "Database Error");

        $("#"+dialogID).dialog({
            modal:true,
        });
    },
    
    areYouSureDialog: function (dialogID, msg, title, yesText, noText, yesFunc) {
        CLMSUI.jqdialogs.constructDialogMessage (dialogID, msg, title || "Confirm");
        
        function hardClose () {
             $(this).dialog("close").dialog("destroy").remove();
        }
        
        function yesAndHardClose () {
            hardClose.call (this);  // need to do it this way to pass on 'this' context
            yesFunc();
        }

        $("#"+dialogID).dialog({
            modal: true,
            open: function () {
                $('.ui-dialog :button').blur(); // http://stackoverflow.com/questions/1793592/jquery-ui-dialog-button-focus
            },
            buttons: [
                { text: yesText, click: yesAndHardClose },
                { text: noText, click: hardClose }
            ]
        });
    }, 
    
    choicesDialog: function (dialogID, msg, title, choices, links) {
        CLMSUI.jqdialogs.constructDialogMessage (dialogID, msg, title || "Confirm");
        
        function redirect (link) {
            var dialog = $("#"+dialogID)[0];
            console.log ("this", this, dialog);
            hardClose.call(dialog);
            window.open (link, '_blank');
        }
        function hardClose () {
            console.log ("cthis", this);
             $(this).dialog("close").dialog("destroy").remove();
        }
        
        var buttons = choices.map (function (choice, i) {
            return {text: choice, click: function(){ redirect (links[i]); } };
        }, this);
        buttons.push ({text: "Cancel", click: hardClose});
        
        $("#"+dialogID).dialog({
            modal: true,
            open: function () {
                $('.ui-dialog :button').blur(); // http://stackoverflow.com/questions/1793592/jquery-ui-dialog-button-focus
            },
            buttons: buttons,
            title: title,
        });
    }
};

