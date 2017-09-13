/*jslint browser: true, white: true, stupid: true, vars: true*/
var CLMSUI = CLMSUI || {};

CLMSUI.history = { 	
                
    makeResultsUrl: function (sid, params) {
        return "../xi3/network.php?sid="+sid+params;
    },
		
    loadSearchList: function () {		
       var dynTable;
       d3.selectAll("button").classed("btn btn-1 btn-1a", true);
       DynamicTable.destroy("t1");
        
        var self = this;
        d3.selectAll("#t1, #pagerTable").html("");
        d3.select("#aggSearch").on ("click", function () {
            self.aggregate (dynTable, false);
        });
        d3.select("#aggFDRSearch").on ("click", function () {
            self.aggregate (dynTable, true);
        });

        var columnMetaData = [
            {name: "Visualise Search", type: "alpha", tooltip: "", visible: true, removable: true},
            {name: "+FDR", type: "none", tooltip: "Visualise search with decoys to allow False Discovery Rate calculations", visible: true, removable: true},
            {name: "Notes", type: "alpha", tooltip: "", visible: true, removable: true},
            {name: "Validate", type: "none", tooltip: "", visible: true, removable: true},
            {name: "Sequence", type: "alpha", tooltip: "", visible: true, removable: true},
            {name: "Enzyme", type: "alpha", tooltip: "", visible: false, removable: true},
            {name: "Cross-Linkers", type: "alpha", tooltip: "", visible: false, removable: true},
            {name: "Submit Date", type: "alpha", tooltip: "", visible: true, removable: true},
            {name: "ID", type: "number", tooltip: "", visible: true, removable: true},
            {name: "User", type: "alpha", tooltip: "", visible: true, removable: true},
            {name: "Agg Group", type: "clearCheckboxes", tooltip: "Use numbers to divide searches into groups within an aggregated search", visible: true, removable: false},
            {name: "Delete", type: "deleteHiddenSearchesOption", tooltip: "", visible: true, removable: true},
        ];
        
        var pluck = function (data, prop) {
            return data.map (function (d) { return d[prop]; });   
        };
              
        var userOnly = d3.select('#mySearches').property("checked");
        var params = userOnly ? "searches=MINE" : "searches=ALL";
             
        if (d3.select(".container #clmsErrorBox").empty()) {
            d3.select(".container")
                .append("div")
                .attr ("id", "clmsErrorBox")
                .text("You Currently Have No Searches in the Xi Database.")
            ;
        }
              
        CLMSUI.history.anyAggGroupsDefined (dynTable, false);
                
       $.ajax({
            type:"POST",
            url:"./php/searches.php", 
            data: params,
            contentType: "application/x-www-form-urlencoded",
            dataType: 'json',
            success: function(response, responseType, xmlhttp) {
                if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    //console.log ("response", response, responseType);
                    if (response.redirect) {
                        window.location.replace (response.redirect);
                    }
                    else if (response.status === "fail") {
                        d3.select("#clmsErrorBox").text(response.error || "Database Error");
                        console.log ("response error", response);
                    }
                    else {

                         // This is a catch until new usergui is rolled out */
                        if (response.utilsLogout) {
                            d3.select("#logout")
                                .attr ("onclick", null)
                                .on ("click", function () {
                                    window.location.replace ("../../util/logout.php");    
                                })
                            ;
                        }

                        var userHasRights = function (type) {
                            return response.userRights && response.userRights[type];
                        };

                        d3.select("#username").text(response.user);
                        d3.selectAll("#newSearch").style("display", userHasRights ("canAddNewSearch") ? null : "none");
                        d3.selectAll("#userGUI,#logout").style("display", userHasRights ("doesUserGUIExist") ? null : "none");
                        d3.selectAll("#scopeOptions").style("display", userHasRights ("canSeeAll") ? null : "none");


                        var makeResultsLink = function (sid, params, label) {
                             return "<a href='"+CLMSUI.history.makeResultsUrl(sid, params)+"'>"+label+"</a>";
                        };


                        var makeValidationUrl = function (sid, params) {
                             return "../xi3/validate.php?sid="+sid+params;
                        };  
                        
                        var isTruthy = function (val) {
                            return val === true || val === "t" || val === "true";
                        };

                        var tooltips = {
                            notes: function(d) { return d.value.notes; },
                            name: function(d) { return d.value.status; },
                            file_name: function(d) { return d.value.file_name; },
                            enzyme: function(d) { return d.value.enzyme; },
                            crosslinkers: function(d) { return d.value.crosslinkers; },
                        };

                        var cellStyles = {
                            name: "varWidthCell", 
                            file_name: "varWidthCell2",
                        };

                        var cellHeaderOnlyStyles = {
                            fdr: "dottedBorder",  
                        };

                        var cellWidths = {
                            //name: "20em",
                            notes: "8em",
                            fdr: "4em",
                            validate: "5em",
                            //file_name: "15em",
                            submit_date: "10em",
                            id: "4em",
                            enzyme: "5em",
                            crosslinkers: "7em",
                            user_name: "6em",
                            aggregate: "6em",
                            delete: "5em",
                        };

                        var modifiers = {
                            name: function(d) { 
                                var completed = d.status === "completed";
                                var name = completed ? makeResultsLink (d.id+"-"+d.random_id, "", d.name)
                                    : "<span class='unviewableSearch'>"+d.name+"</span>"
                                ;
                                var error = !completed && d.status.substring(0,4) === "XiDB";
                                return name + (error ? "<span class='xierror'>" : "") + " ["+d.status.substring(0,16)+"]" + (error ? "</span>" : "") + 
                                    (d.status.length <= 16 ? "" : "<div style='display:none'>"+d.status+"</div>"); 
                            },
                            fdr: function (d) {
                                var unuseable = d.status.substring(0,4) === "XiDB" || d.status !== "completed";
                                return unuseable ? "" : makeResultsLink (d.id+"-"+d.random_id, "&decoys=1&unval=1", "+FDR");
                            },
                            notes: function (d) {
                                // Let fixed column width take care of only showing the first few characters
                                return d.notes; // ? d.notes.substring(0,16)+"<div style='display:none'>"+d.notes+"</div>" : "";
                            },
                            validate: function () {
                                return "<span class='validateButton fauxLink'>Validate</span>";
                            },
                            file_name: function (d) {
                                return d.file_name;
                            },
                            enzyme: function (d) { return d.enzyme; },
                            crosslinkers: function (d) { return d.crosslinkers; },
                            submit_date: function(d) {
                                return d.submit_date.substring(0, d.submit_date.indexOf("."));
                            },
                            id: function(d) { return d.id; },
                            user_name: function(d) { return d.user_name; },
                            aggregate: function(d) {
                                return "<input type='number' pattern='\\d*' class='aggregateCheckbox' id='agg_"+d.id+"-"+d.random_id+"' maxlength='1' min='1' max='9'>";
                            },
                            delete: function(d) {
                                return d.user_name === response.user || response.userRights.isSuperUser ? "<button class='deleteButton unpadButton'>"+(isTruthy(d.hidden) ? "Restore" : "Delete")+"</button>" : "";
                            }
                        };


                        d3.select("#clmsErrorBox").style("display", response.data ? "none" : "block");    // hide no searches message box if data is returned

                        var d3sel = d3.select("#t1");
                        //d3sel.html(""); // commented out 'cos already empty
                        var tbody = d3sel.append("tbody");

                        //console.log ("rights", response.userRights);
                        //console.log ("data", response.data);
                        
                        // Sanitise, get rid of html, comment characters that could be exploited
                        var sanitise = function (data) {
                            var escapeHtml = function (html) {
                                var fn = function(tag) {
                                    var charsToReplace = {
                                        '&': '&amp;',
                                        '<': '&lt;',
                                        '>': '&gt;',
                                        '"': '&#34;',
                                    };
                                    return charsToReplace[tag] || tag;
                                };
                                return html ? html.replace(/[&<>"]/g, fn) : html;
                            };

                            if (data.length) {
                                var keys = d3.set (d3.keys (data[0]));
                                ["id", "submit_date", "status", "random_id"].forEach (function (notkey) {
                                    keys.remove (notkey);   // database generated fields so not an issue
                                });
                                keys = keys.values();
                                //console.log ("keys", keys);
                                data.forEach (function (row) {
                                    for (var k = 0; k < keys.length; k++) {
                                        var kk = keys[k];
                                        row[kk] = escapeHtml (row[kk]);
                                    }
                                });
                            }
                        };
                        //var a = performance.now();
                        sanitise (response.data);
                        //var b = performance.now() - a;
                        //console.log ("sanity in", b, "ms.");


                        var rows = tbody.selectAll("tr").data(response.data)
                            .enter()
                            .append("tr")
                        ;
                        rows.filter(function(d) { return isTruthy(d.hidden); }).style("background", "#ddd");

                        // make d3 entry style list of above, removing user_name if just user's own searches
                        var cellFunctions = d3.entries(modifiers);

                        var cells = rows.selectAll("td").data(function(d) { 
                            return cellFunctions.map(function(entry) { return {key: entry.key, value: d}; });
                        });
                        cells.enter()
                            .append("td")
                            .html (function(d) { 
                                    return modifiers[d.key](d.value);
                            })
                            .attr ("class", function(d) { return cellStyles[d.key]; })
                            .filter (function(d) { return tooltips[d.key]; })
                            .attr("title", function(d) {
                                var v = tooltips[d.key](d);
                                return v ? d.value.id+": "+v : "";
                            })
                        ;
                        
                        cells.select("input.aggregateCheckbox");

                        /* Everything up to this point helps generates the dynamic table */
                        
                        if (userOnly) {
                            var hideIndex = pluck(columnMetaData, "name").indexOf ("User");
                            columnMetaData[hideIndex].visible = false;
                        }
                        
                        var setupFinalDeletionDialog = function (response) {
                            var dialog = CLMSUI.jqdialogs.choicesDialog (
                                "popChoiceDialog", 
                                response.deadSearches+" Searches marked for deletion."
                                +"<br>"+response.acqFilesizes.length+" associated Acqusition files."
                                +"<br>"+response.seqFilesizes.length+" associated Sequence files."
                                +"<br><br>Deletion actions below may take several minutes.",
                                "⚠ Search Deletion", 
                                ["⚠ Delete These Searches", "⚠ Delete These Searches and Files"], 
                                [{}, {deleteFiles: true}],
                                function (postOptions) {
                                    var waitDialogID = "databaseLoading";
                                    CLMSUI.jqdialogs.waitDialog (waitDialogID, "This will take a while...", "Deleting Searches");
                                    /*
                                     $.ajax({
                                        type: "POST",
                                        url:"./php/queryDeletedSearches.php", 
                                        data: postOptions || {},
                                        dataType: 'json',
                                        success: function (response, responseType, xmlhttp) {
                                            console.log ("lol", response);
                                            CLMSUI.jqdialogs.killWaitDialog (waitDialogID);
                                            CLMSUI.history.loadSearchList();
                                        },
                                     });
                                     */
                                    // testing dialogs
                                    setTimeout (function() { 
                                        CLMSUI.jqdialogs.killWaitDialog (waitDialogID); 
                                        CLMSUI.history.loadSearchList();
                                    }, 3000);
                                    return true;
                                }
                            );
                        };
                        
                        var opt1 = {
                           pager: {rowsCount: 20},
                           pagerElem: d3.select("#pagerTable").node(),
                           colNames: pluck (columnMetaData, "name"),
                           colTypes: pluck (columnMetaData, "type"),
                           colTooltips: pluck (columnMetaData, "tooltip"),
                           colVisible: pluck (columnMetaData, "visible"),
                           colRemovable: pluck (columnMetaData, "removable"),

                            // Add functionality to headers in dynamic table
                           bespokeColumnSetups: {
                               clearCheckboxes: function (dynamicTable, elem) {
                                    // button to clear aggregation checkboxes
                                   d3.select(elem)
                                        .append("button")
                                        .text ("Clear ↓")
                                        .attr ("class", "btn btn-1 btn-1a clearChx unpadButton")
                                        .attr ("title", "Clear all searches chosen for aggregation")
                                        .on ("click", function () {
                                            CLMSUI.history.clearAggregationCheckboxes (dynTable);
                                        })
                                   ;
                               },
                               deleteHiddenSearchesOption: function (dynamicTable, elem) {
                                   d3.select(elem)
                                        .append("button")
                                        .text ("INFO ↓")
                                        .attr ("class", "btn btn-1 btn-1a unpadButton")
                                        .attr ("title", "Info on all searches marked for delete and associated files")
                                        .style ("display", response.userRights.isSuperUser ? null : "none") 
                                        .on ("click", function () {
                                            $.ajax({
                                                type: "POST",
                                                url:"./php/queryDeletedSearches.php", 
                                                data: {},
                                                dataType: 'json',
                                                success: function (response, responseType, xmlhttp) {
                                                    setupFinalDeletionDialog (response);
                                                }
                                            });
                                        })
                                    ;
                               },
                           },
                       };

                        if (response.data) {
                            dynTable = new DynamicTable("t1", opt1);
                            console.log ("dd", dynTable);
                        }

                        /* Everything after this point includes content generated by the dynamic table */
                        
                        // helper function for next bit
                        var displayColumn = function (columnIndex, show) {
                            d3.select("#t1").selectAll("td:nth-child("+columnIndex+"), th:nth-child("+columnIndex+")").style("display", show ? null : "none");
                        };
                        
                        // Add a multiple select widget for column visibility
                        var pagerRow = d3.select("#pagerTable tr");
                        pagerRow.select(".dynamic-table-pagerbar").attr("colspan", "1");
                        var newtd = pagerRow.append("td");
                        newtd.append("span").text("Show Columns");
                        var removableColumns = opt1.colNames.map (function (name, i) {
                            return {name: name, vis: opt1.colVisible[i]};
                        }).filter (function (obj, i) { 
                            return opt1.colRemovable[i];
                        });
                        newtd.append("select")
                            .property("multiple", true)
                            .selectAll("option")
                            .data(removableColumns, function(d) {return d.name; })
                                .enter()
                                .append("option")
                                .text (function(d) { return d.name; })
                                .property ("selected", function (d) { return d.vis; })
                        ;
                        $(newtd.select("select").node()).multipleSelect ({  
                            selectAll: false,
                            onClick: function(view) {
                                // hide/show column chosen by user
                                var index = opt1.colNames.indexOf (view.value) + 1; // elements are 1-indexed in css selectors
                                displayColumn (index, view.checked);
                            }
                        });
                        
                        // hide columns that are hid by default
                        opt1.colVisible.forEach (function (vis, i) {
                            if (!vis) {
                                displayColumn (i + 1, false);
                            }
                        });
                        
                        
                        
                        CLMSUI.history.anyAggGroupsDefined (dynTable, false);   // disable clear button as well to start with

                        var headers = d3.selectAll("th").data(cellFunctions);
                        headers.attr("title", function (d,i) {
                            return opt1.colTooltips[i];   
                        });
                        headers
                            .filter (function(d) { return cellStyles[d.key]; })
                            .each (function(d) {
                                d3.select(this).classed (cellStyles[d.key], true);
                            })
                        ;
                        headers
                            .filter (function(d) { return cellHeaderOnlyStyles[d.key]; })
                            .each (function(d) {
                                d3.select(this).classed (cellHeaderOnlyStyles[d.key], true);
                            })
                        ;
                        headers
                            .filter (function(d) { return cellWidths[d.key]; })
                            .each (function(d) {
                                d3.select(this).style("width", cellWidths[d.key]);
                            })
                        ;
                        
                        
                        // Add functionality to buttons / links in table
                        
                        var addDeleteButtonFunctionality = function (selection) {
                            selection.select("button.deleteButton")
                                .classed("btn btn-1 btn-1a", true)
                                .on ("click", function(d) {
                                    //console.log ("d", d);

                                    // Post deletion/restoration code
                                    var deleteRowVisibly = function (d) {
                                        // delete row from table somehow
                                        var thisID = d.id;
                                        var selRows = d3.selectAll("tbody tr").filter(function(d) { return d.id === thisID; });

                                        // if superuser change state of delete/restore button otherwise remove row from view
                                        if (response.userRights.isSuperUser) {
                                            // reset text and state of button
                                            selRows.selectAll("td").html (function(d) { 
                                                return modifiers[d.key](d.value);
                                            });
                                            addDeleteButtonFunctionality (selRows); // restore functionality for this row
                                            selRows.style("background", function(d) { return isTruthy(d.hidden) ? "#ddd" : null});
                                        } else {
                                            // dynTable has internal object 'rows' which maintains list of rows
                                            // - we need to remove the node from that array and from the dom (using d3)
                                            // as dynTable.pager reads rows from the dom to calculate a new page
                                            var dynRowIndex = dynTable.rows.indexOf (selRows.node());
                                            if (dynRowIndex >= 0) {
                                                dynTable.rows.splice (dynRowIndex, 1);
                                                selRows.remove();
                                                dynTable.pager (dynTable.currentPage);
                                            }
                                        }
                                    };
                                    //deleteRowVisibly (d); // alternative to following code for testing without doing database delete

                                    // Ajax delete/restore call
                                     var doDelete = function() {
                                        $.ajax({
                                            type: "POST",
                                            url:"./php/deleteSearch.php", 
                                            data: {searchID: d.id, setHiddenState: !isTruthy(d.hidden)},
                                            dataType: 'json',
                                            success: function (response, responseType, xmlhttp) {
                                                if (response.status === "success") {
                                                    console.log ("response", response);
                                                    d.hidden = response.newHiddenState;
                                                    deleteRowVisibly (d);
                                                }
                                            }
                                        });
                                    };
                                
                                    var basicMsg = (isTruthy(d.hidden) ? "Restore" : "Delete") + " Search "+d.id+"?";
                                    var msg = isTruthy(d.hidden) ?
                                        (response.userRights.isSuperUser ? basicMsg : "You don't have permission for this action") :
                                        (response.userRights.isSuperUser ? basicMsg+"<br>(As a superuser you can restore this search later)" : basicMsg+"<br>This action cannot be undone (by yourself).<br>Are You Sure?")
                                    ;
                                
                                    // Dialog
                                    CLMSUI.jqdialogs.areYouSureDialog (
                                        "popChoiceDialog", 
                                        msg, 
                                        "Please Confirm", "Yes, "+(isTruthy(d.hidden) ? "Restore" : "Delete") + " this Search", "No, Cancel this Action", 
                                        doDelete
                                    );
                                })
                            ;
                        };
                        addDeleteButtonFunctionality (d3.selectAll("tbody tr"));
                        

                        var lowScore = "&lowestScore=2";
                        d3.selectAll("tbody tr").select(".validateButton")
                            //.classed("btn-1a", true)
                            .on ("click", function (d) {
                                var deltaUrls = ["", "&decoys=1"+lowScore, "&linears=1"+lowScore, "&decoys=1&linears=1"+lowScore];
                                var baseUrls = deltaUrls.map (function (deltaUrl) {
                                   return makeValidationUrl (d.id+"-"+d.random_id, "&unval=1"+deltaUrl);
                                });

                                CLMSUI.jqdialogs.choicesDialog ("popChoiceDialog", "Choose Validation Option", "Validate "+d.id, 
                                    ["Validate", "Validate with Decoys", "Validate with Linears", "Validate with Decoys & Linears"], 
                                    baseUrls
                                );
                            })
                        ;

                        d3.selectAll(".aggregateCheckbox")
                            .on ("input", function(d) {
                                // set value to 0-9
                                this.value = this.value.slice (0,1); // equiv to maxlength for text
                                // set backing data to this value
                                d.value[d.key] = this.value;
                                CLMSUI.history.anyAggGroupsDefined (dynTable, this.value ? true : undefined);
                            })
                        ;
                    }
                }
            }, 
           error: function () {
                console.log ("error", arguments);
               //window.location.href = "../../xi3/login.html";
           }
       });
    },
				
    aggregate: function (dynTable, unvalAndDecoys) {
        var values = [];
        // do selectAll on dynTable.rows so filtered out rows are included
        d3.selectAll(dynTable.rows).selectAll(".aggregateCheckbox")
            .each (function (d) {
                var val = d.value[d.key];   // this.value; // get from backing data now rather than dom element
                if (val) {
                    if (isNaN(val) || val.length > 1) {
                        alert("Group identifiers must be a single digit.");
                    } else {
                        values.push (d.value.id +"-" + d.value.random_id + "-" + val);
                    }
                }
            })
        ;
        if (!values.length) { alert ("Cannot aggregate: no selection - use text field in right most table column."); }
        else {
            var url = CLMSUI.history.makeResultsUrl (values.join(','), unvalAndDecoys ? "&unval=1&decoys=1" : "");
            window.open (url, "_self");
            //console.log ("URL", url);
        }
    },

    clearAggregationCheckboxes: function (dynTable) {
        // do selectAll on dynTable.rows so filtered out rows are included
        d3.selectAll(dynTable.rows).selectAll(".aggregateCheckbox")
            // clear value and backing data
            .property("value", "")
            .each (function(d) {
                if (d) {
                    d.value[d.key] = undefined;
                }
            })
        ;
        CLMSUI.history.anyAggGroupsDefined (dynTable, false);
    },
    
    anyAggGroupsDefined: function (dynTable, anySelected) {
        if (anySelected === undefined || anySelected === true) {
            var sel = d3.selectAll(dynTable.rows).selectAll(".aggregateCheckbox").filter (function() { return this.value; });
            anySelected = sel.size() > 0;  
            var groups = d3.nest().key(function(d) { return d.value; }).entries(d3.merge(sel));
            d3.selectAll("#selectedCounter").text(sel.size()+" Selected across "+groups.length+(groups.length > 1 ? " Groups" : " Group"));
        }

        d3.selectAll("#aggSearch,#aggFDRSearch,.clearChx").property("disabled", !anySelected);
        d3.selectAll("#selectedCounter")
            .style ("visibility", anySelected ? "visible" : null)
        ;
    },
    
    anonForScreenshot: function () {
        // Anon usernames, search names, current user. Remember to filter to completed searches only.
        d3.select("tbody").selectAll("td:nth-child(8)").text(function() { return ["bert", "bob", "allan", "audrey", "fiona"][Math.floor(Math.random() * 5)]; });
        d3.select("tbody").selectAll("td:nth-child(1) a").text(
            function() { return "anonymised "+(d3.shuffle("abcdefghijklmnopqrstuvwxyz".split("")).join("").substring(Math.ceil(Math.random()*25))); }
        );
        d3.select("#username").text("A Xi User");
    },
};
