var CLMSUI = CLMSUI || {};

CLMSUI.history = { 	
                
    makeResultsUrl: function (sid, params) {
        return "../xi3/network.php?sid="+sid+params;
    },
		
    loadSearchList: function () {		
       var dynTable;
       d3.selectAll("button").classed("btn btn-1 btn-1a", true);
       DynamicTable.destroy("t1");
        
        //$("#t1, #pagerTable").empty();
       d3.selectAll("#t1, #pagerTable").html("");

       var params;
       var opt1 = {
           pager: {rowsCount: 20},
           pagerElem: d3.select("#pagerTable").node(),
           colNames: ["Visualise Search", "+FDR", "Notes", "Validate", "Sequence", "Submit Date", "ID", "User", "Agg Group", "Delete"],
           colTypes: ["alpha", "none", "alpha", "none", "alpha", "alpha", "number", "alpha", "clearCheckboxes", "none"],
           colTooltips: ["", "Visualise search with decoys to allow False Discovery Rate calculations", "", "", "", "", "", "", "Use numbers to divide searches into groups within an aggregated search", ""],
           bespokeColumnSetups: {
               clearCheckboxes: function (dynamicTable, elem) {
                    // button to clear aggregation checkboxes
                   d3.select(elem)
                        .append("button")
                        .text ("Clear")
                        .attr ("class", "btn btn-1 btn-1a clearChx unpadButton")
                        .on ("click", function () {
                            CLMSUI.history.clearAggregationCheckboxes();
                        })
                   ;
               }
           },
       };
       
       if (d3.select('#mySearches').property("checked")){
           params = "searches=MINE";
           var removeIndex = opt1.colNames.indexOf ("User");
           opt1.colNames.splice (removeIndex, 1);
           opt1.colTypes.splice (removeIndex, 1);
           opt1.colTooltips.splice (removeIndex, 1);
       } else {
           params = "searches=ALL";
       }
                
        if (d3.select(".container #clmsErrorBox").empty()) {
            d3.select(".container")
                .append("div")
                .attr ("id", "clmsErrorBox")
                .style ("transform", "scale(0.5)")
                .text("You Currently Have No Searches in the Xi Database.")
            ;
        }
              
        CLMSUI.history.anyAggGroupsDefined (false);
                
       $.ajax({
            type:"POST",
            url:"./php/searches.php", 
            data: params,
            contentType: "application/x-www-form-urlencoded",
            dataType: 'json',
            success: function(response, responseType, xmlhttp) {
                if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    console.log ("response", response, responseType);
                    if (response.redirect) {
                        console.log ("yo");
                        window.location.replace (response.redirect);
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

                        var userOnly = d3.select('#mySearches').property("checked");


                        var makeResultsLink = function (sid, params, label) {
                             return "<a href='"+CLMSUI.history.makeResultsUrl(sid, params)+"'>"+label+"</a>";
                        };


                        var makeValidationUrl = function (sid, params) {
                             return "../xi3/validate.php?sid="+sid+params;
                        };


                        var makeValidationLink = function (sid, params, label) {
                             return "<a href='"+makeValidationUrl(sid, params)+"'>"+label+"</a>";
                        };


                        var tooltips = {
                            notes: function(d) { return d.value.notes; },
                            name: function(d) { return d.value.status; },
                            file_name: function(d) { return d.value.file_name; },
                        };

                        var cellStyles = {
                            name: "varWidthCell", 
                            file_name: "varWidthCell2",
                        };

                        var cellHeaderOnlyStyles = {
                            fdr: "dottedBorder",  
                            valLinears: "dottedBorder",
                        };

                        var cellWidths = {
                            //name: "20em",
                            notes: "8em",
                            fdr: "4em",
                            validate: "5em",
                            valLinears: "5em",
                            //file_name: "15em",
                            submit_date: "10em",
                            id: "4em",
                            user_name: "6em",
                            aggregate: "6em",
                            delete: "5em",
                        };

                        var modifiers = {
                            name: function(d) { 
                                var completed = d.status === "completed";
                                var name = completed
                                    ? makeResultsLink (d.id+"-"+d.random_id, "", d.name)
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
                            validate: function(d) {
                                return "<span class='validateButton fauxLink'>Validate</span>";
                            },
                            /*
                            validate: function(d) {
                                return makeValidationLink (d.id+"-"+d.random_id, "&unval=1", "validate");
                            },
                            valLinears:  function(d) {
                                return makeValidationLink (d.id+"-"+d.random_id, "&unval=1&linears=1", "+Linears");
                            },
                            */
                            file_name: function (d) {
                                return d.file_name.slice(1,-1); // remove brackets returned by sql query
                            },
                            submit_date: function(d) {
                                return d.submit_date.substring(0, d.submit_date.indexOf("."));
                            },
                            id: function(d) { return d.id; },
                            user_name: function(d) { return !userOnly ? d.user_name : ""; },
                            aggregate: function(d) {
                                return "<input type='number' pattern='\\d*' class='aggregateCheckbox' id='agg_"+d.id+"-"+d.random_id+"' maxlength='1' min='1' max='9'>";
                            },
                            delete: function(d) {
                                return d.user_name === response.user || response.userRights.isSuperUser ? "<button class='deleteButton unpadButton'>Delete</button>" : "";
                            }
                        };



                        d3.select("#clmsErrorBox").style("display", response.data ? "none" : "block");    // hide no searches message box if data is returned

                        var d3sel = d3.select("#t1");
                        //d3sel.html(""); // commented out 'cos already empty
                        var tbody = d3sel.append("tbody");

                        //console.log ("rights", response.userRights);
                        //console.log ("data", response.data);

                        var rows = tbody.selectAll("tr").data(response.data)
                            .enter()
                            .append("tr")
                        ;

                        // make d3 entry style list of above, removing user_name if just user's own searches
                        var cellFunctions = d3.entries(modifiers);
                        if (userOnly) {
                            var removeIndex = cellFunctions.map(function(cellf) { return cellf.key; }).indexOf ("user_name");
                            cellFunctions.splice (removeIndex, 1);
                        }

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

                        /* Everything up to this point helps generates the dynamic table */

                        if (response.data) {
                            dynTable = new DynamicTable("t1", opt1);
                        }

                        /* Everything after this point includes content generated by the dynamic table */

                        //console.log ("dynTable", dynTable);
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
                        d3.selectAll("tbody tr").select("button.deleteButton")
                            .classed("btn btn-1 btn-1a", true)
                            .on ("click", function(d) {

                                var deleteRowVisibly = function (d) {
                                    // delete row from table somehow
                                    var thisID = d.id;
                                    var selRows = d3.selectAll("tbody tr").filter(function(d) { return d.id === thisID; });

                                    // dynTable has internal object 'rows' which maintains list of rows
                                    // - we need to remove the node from that array and from the dom (using d3)
                                    // as dynTable.pager reads rows from the dom to calculate a new page
                                    var dynRowIndex = dynTable.rows.indexOf (selRows.node());
                                    if (dynRowIndex >= 0) {
                                        dynTable.rows.splice (dynRowIndex, 1);
                                        selRows.remove();
                                        dynTable.pager (dynTable.currentPage);
                                    }
                                };
                                //deleteRowVisibly (d); // alternative to following code for testing without doing database delete

                                 var doDelete = function() {
                                    $.ajax({
                                        type: "POST",
                                        url:"./php/deleteSearch.php", 
                                        data: {searchID: d.id},
                                        dataType: 'json',
                                        success: function (response, responseType, xmlhttp) {
                                            deleteRowVisibly (d);
                                        }
                                    });
                                };
                                CLMSUI.jqdialogs.areYouSureDialog ("popErrorDialog", "Deleting this search cannot be undone (by yourself).<br>Are You Sure?", "Please Confirm", "Delete this Search", "Cancel this Action", doDelete);
                            })
                        ;

                        var lowScore = "&lowestScore=2";
                        d3.selectAll("tbody tr").select(".validateButton")
                            //.classed("btn-1a", true)
                            .on ("click", function (d) {
                                var deltaUrls = ["", "&decoys=1"+lowScore, "&linears=1"+lowScore, "&decoys=1&linears=1"+lowScore];
                                var baseUrls = deltaUrls.map (function (deltaUrl) {
                                   return makeValidationUrl (d.id+"-"+d.random_id, "&unval=1"+deltaUrl);
                                });

                                CLMSUI.jqdialogs.choicesDialog ("popChoiceDialog", "Choose Option", "Validate "+d.id, 
                                    ["Validate", "Validate with Decoys", "Validate with Linears", "Validate with Decoys & Linears"], 
                                    baseUrls
                                );
                            })
                        ;

                        d3.selectAll(".aggregateCheckbox")
                            .on ("input", function() {
                                this.value = this.value.slice (0,1); // equiv to maxlength for text
                                CLMSUI.history.anyAggGroupsDefined (this.value ? true : undefined);
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
				
    aggregate: function (unvalAndDecoys) {
        var values = [];
        d3.selectAll(".aggregateCheckbox")
            .each (function () {
                var val = this.value;
                if (val) {
                    if (isNaN(val)) {
                        alert("Group identifiers must be a single digit.");
                    } else {
                        values.push(this.id.substring(4) + "-" + val);
                    }
                }
            })
        ;
        if (!values.length) alert ("Cannot aggregate: no selection - use text field in right most table column.");
        else {
            var url = CLMSUI.history.makeResultsUrl (values.join(','), unvalAndDecoys ? "&unval=1&decoys=1" : "");
            window.open(url, "_self");
        }
    },

    clearAggregationCheckboxes: function () {
        d3.selectAll(".aggregateCheckbox").property("value", "");
        CLMSUI.history.anyAggGroupsDefined (false);
    },
    
    anyAggGroupsDefined: function (anySelected) {
        if (anySelected === undefined) {
             anySelected = d3.selectAll(".aggregateCheckbox").filter (function() { return this.value; }).size() > 0;
        }

        d3.selectAll("#aggSearch,#aggFDRSearch").property("disabled", !anySelected);
    },
    
    anonForScreenshot: function () {
        // Anon usernames, search names, currnt user. Remember to filter to completed searches only.
        d3.select("tbody").selectAll("td:nth-child(8)").text(function() { return ["bert", "bob", "allan", "audrey", "fiona"][Math.floor(Math.random() * 5)]; });
        d3.select("tbody").selectAll("td:nth-child(1) a").text(
            function() { return "anonymised "+(d3.shuffle("abcdefghijklmnopqrstuvwxyz".split("")).join("").substring(Math.ceil(Math.random()*25))); }
        );
        d3.select("#username").text("A Xi User");
    },
};
