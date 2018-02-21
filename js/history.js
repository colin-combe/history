/*jslint browser: true, white: true, stupid: true, vars: true*/
var CLMSUI = CLMSUI || {};

CLMSUI.history = { 
                
    makeResultsUrl: function (sid, params) {
        return "../xi3/network.php?sid="+sid+params;
    },
	
	defaultValues: {
		visibility: {
			"Visualise Search": true,
			"+FDR": true,
			"Restart": false,
			"Notes": true,
			"Validate": true,
			"Sequence": true,
			"Enzyme": false,
			"Cross-Linkers": false,
			"Submit Date": true,
			"ID": true,
			"User": true,
			"Agg Group": true,
			"Delete": true,
		},
		filters: {},
		searchScope: "mySearches",
		sort: {
			column: null,
			sortDesc: null
		},
	},
	
	tempValues: {},	// store user values temporarily, in case they decide to 'keep' later on
	
	getInitialValues: function () {
		var cookieValues = this.getCookieValue() || {};
		//console.log ("cookieValues", cookieValues);
		var currentRadio = d3.select("#scopeOptions").selectAll("input[type='radio']")
			.filter (function (d,i) {
				return d3.select(this).property("checked");
			})
		;
		// cookieValues overwrites currentRadio which overwites initialValues
		return $.extend ({}, this.defaultValues, {searchScope: currentRadio.size() === 1 ? currentRadio.attr("id") : undefined}, cookieValues);
	},
	
	init: function () {
		var self = this;
		d3.select("#scopeOptions").selectAll("input[type='radio']")
			.on ("change", function () {
				self.updateCookie ("searchScope", d3.select(this).attr("id"));
				self.loadSearchList();
			})
		;
		
		var initialValues = this.getInitialValues();	// get default / cookie values
		this.tempValues = initialValues;
		d3.select("#"+initialValues.searchScope).property("checked", true);
		
		if (!CLMSUI.history.canLocalStorage) {
			d3.select("#rememberOption").style("display", "none");
		}
		d3.select("#rememberOption input[type='checkbox']").property("checked", this.youMayRememberMe());
	},
	
		
    loadSearchList: function () {	
	 	var initialValues = this.getInitialValues();	// get default / cookie values

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
            {name: "Visualise Search", type: "alpha", tooltip: "", visible: true, removable: true, filterID: "name", id: "name"},
            {name: "+FDR", type: "none", tooltip: "Visualise search with decoys to allow False Discovery Rate calculations", visible: true, removable: true, id: "fdr"},
			{name: "Restart", type: "none", tooltip: "", visible: false, removable: true, id: "restart"},
            {name: "Notes", type: "alpha", tooltip: "", visible: true, removable: true, filterID: "notes", id: "notes"},
            {name: "Validate", type: "none", tooltip: "", visible: true, removable: true, id: "validate"},
            {name: "Sequence", type: "alpha", tooltip: "", visible: true, removable: true, filterID: "file_name", id: "file_name"},
            {name: "Enzyme", type: "alpha", tooltip: "", visible: false, removable: true, filterID: "enzyme", id: "enzyme"},
            {name: "Cross-Linkers", type: "alpha", tooltip: "", visible: false, removable: true, filterID: "crosslinkers", id: "crosslinkers"},
            {name: "Submit Date", type: "alpha", tooltip: "", visible: true, removable: true, filterID: "submit_date", id: "submit_date"},
            {name: "ID", type: "number", tooltip: "", visible: true, removable: true, filterID: "id", id: "id"},
            {name: "User", type: "alpha", tooltip: "", visible: true, removable: true, filterID: "user_name", id: "user_name"},
            {name: "Agg Group", type: "clearCheckboxes", tooltip: "Assign numbers to searches to make groups within an aggregated search", visible: true, removable: false, id: "aggregate"},
            //{name: "Delete", type: "deleteHiddenSearchesOption", tooltip: "", visible: true, removable: true},
			{name: "Delete", type: "none", tooltip: "", visible: true, removable: true, id: "delete"},
        ];
		
		// Set visibilities of columns according to cookies or default values
		columnMetaData.forEach (function (column) {
			column.visible = initialValues.visibility[column.name];
		}, this);
		
        
        var pluck = function (data, prop) {
            return data.map (function (d) { return d[prop]; });   
        };
		
              
        var userOnly = initialValues.searchScope === "mySearches";
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
                    console.log ("response", response, responseType);
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
							restart: "5em",
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
								var name = d.name.length < 200 ? d.name : (d.name.substring (0, 200) + "…");
                                var nameHtml = completed ? makeResultsLink (d.id+"-"+d.random_id, "", name)
                                    : "<span class='unviewableSearch'>"+name+"</span>"
                                ;
                                var error = !completed && d.status.substring(0,4) === "XiDB";
                                return nameHtml + (error ? "<span class='xierror'>" : "") + " ["+d.status.substring(0,16)+"]" + (error ? "</span>" : "") /*+ 
                                    (d.status.length <= 16 ? "" : "<div style='display:none'>"+d.status+"</div>")*/; 
                            },
                            fdr: function (d) {
                                var unuseable = d.status.substring(0,4) === "XiDB" || d.status !== "completed";
                                return unuseable ? "" : makeResultsLink (d.id+"-"+d.random_id, "&decoys=1&unval=1", "+FDR");
                            },
							restart: function(d) {
								// add restart button for user if search executing and not completed
								// let user use judgement
                                return (d.user_name === response.user || response.userRights.isSuperUser) && (isTruthy(d.is_executing) && !isTruthy(d.completed)) ? "<button class='restartButton unpadButton'>Restart</button>" : "";
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
                        
                        // make d3 entry style list of above, removing user_name if just user's own searches
                        var cellFunctions = d3.entries(modifiers);

						var updateRows = function (rows) {
							rows.classed("hiddenSearch", function(d) { return isTruthy(d.hidden); });
							
							var cells = rows.selectAll("td").data(function(d) { 
								return cellFunctions.map(function(entry) { return {key: entry.key, value: d}; });
							});
							//var ttdiv = d3.select("div.tooltip");
							// add new cells if appropriate (i.e. at initialisation)
							cells.enter().append("td");
								
							// update cells with data
							cells
								.html (function(d) { 
										return modifiers[d.key](d.value);
								})
								.attr ("class", function(d) { return cellStyles[d.key]; })
								.filter (function(d) { return tooltips[d.key]; })
								.attr ("title", function(d) {
									var v = tooltips[d.key](d);
									return v ? d.value.id+": "+v : "";
								})
								/*
								.on ("mouseover", function (d) {
									ttdiv.transition()		
										.duration(200)		
										.style("opacity", .9)
										.style("left", (d3.event.pageX) + "px")		
										.style("top", (d3.event.pageY - 28) + "px");	
									;		
									ttdiv.select("P.tooltipTitle").text(d.key);
									ttdiv.select("P.tooltipContents").text(tooltips[d.key](d));
								})
								.on("mouseout", function() {		
									ttdiv.transition()		
										.duration(500)		
										.style("opacity", 0)
									;	
								})
								*/
							;

							// push table cell data down to checkbox
							cells.select("input.aggregateCheckbox");
						}
						updateRows (rows);
                        
                       

                        /* Everything up to this point helps generates the dynamic table */
                        
                        if (userOnly) {
                            var hideIndex = pluck(columnMetaData, "name").indexOf ("User");
                            columnMetaData[hideIndex].visible = false;
                        }
                        
						// not used (and not linked to any deadly php functions so dont worry)
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
							postToolbarClick: function (evt) {
								var sort = self.getCookieValue("sort");
								if (sort) {
									sort.column = dynTable.sortColumn;
									sort.sortDesc = dynTable.desc;
									self.updateCookie ("sort", sort);
								}
							},
							postFilterRows: function (evt) {
								var filters = self.getCookieValue("filters");
								if (filters) {
									var dfilters = dynTable.filters;
									var fobj = {};
									dfilters.forEach (function (df, i) {
										if (df !== "none" && df.value) {
											fobj[i] = df.value;
										}
									});
									self.updateCookie ("filters", fobj);
								}
								//hideColumns();
							},
                       };

                        if (response.data) {
                            dynTable = new DynamicTable("t1", opt1);
							if (initialValues.sort && initialValues.sort.column) {
								dynTable.sort (initialValues.sort.column, initialValues.sort.sortDesc);	// default sort
							}
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
								
								// cookie store if allowed
								var visibilities = self.getCookieValue("visibility");
								if (visibilities) {
									visibilities[view.value] = view.checked;
									self.updateCookie ("visibility", visibilities);
								}
                            }
                        });
                        
						
						function hideColumns () {
							// hide columns that are hid by default
							opt1.colVisible.forEach (function (vis, i) {
								if (!vis) {
									displayColumn (i + 1, false);
								}
							});
						}
						hideColumns();
						
           
                        CLMSUI.history.anyAggGroupsDefined (dynTable, false);   // disable clear button as well to start with

                        var headers = d3.selectAll("th").data(cellFunctions);
						function applyHeaderStyling (headers) {
							console.log ("headers", headers);
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
						};
						applyHeaderStyling (headers);
                        
                        
						// hidden row state can change when restore/delete pressed or when restart pressed
						function updateHiddenRowStates (selectedRows) {
							// reset button text and row appearance
							selectedRows.selectAll(".deleteButton").text (function(d) {
								return isTruthy(d.hidden) ? "Restore" : "Delete";
							});
                            selectedRows.classed ("hiddenSearch", function(d) { return isTruthy(d.hidden); });
						}
						
						
						var allRows = d3.selectAll("tbody tr");
						
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
											updateHiddenRowStates (selRows);
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
                        
						
						var addRestartButtonFunctionality = function (selection) {
                            selection.select("button.restartButton")
                                .classed("btn btn-1 btn-1a", true)
                                .on ("click", function(d) {
									// Post restart code
                                    var updateCurrentRow = function (currentData, newData) {
                                        var thisID = currentData.id;
										// select correct row
                                        var selRows = d3.selectAll("tbody tr").filter(function(d) { return d.id === thisID; });	
										d3.keys(currentData).forEach (function (key) {	// copy new data points to row data
											var newVal = newData[0][key];
											if (newVal !== undefined) {
												currentData[key] = newVal;
											}
										});
										updateRows (selRows);	// then update this row and the cells in it
										empowerRows (selRows);	// set buttons up in updated row
										//updateHiddenRowStates (selRows);	// update the hidden state of the row
                                    };
                                    //updateCurrentRow (d, {}); // alternative to following code for testing without doing database actions

                                    // Ajax restart call
                                     var doRestart = function() {

										 $.ajax({
                                            type: "POST",
                                            url:"./php/restartSearch.php", 
                                            data: {searchID: d.id},
                                            dataType: 'json',
                                            success: function (response, responseType, xmlhttp) {
                                                if (response.status === "success") {
                                                    //console.log ("response", response);
                                                    updateCurrentRow (d, response.result);
                                                }
                                            },
											 error: function (jqxhr, text, error) {
												 console.log ("error", arguments);
											 }
                                        });
										
                                    };
                                
									var dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', minute: 'numeric', hour: 'numeric', second: 'numeric' };
									var dateStr = new Date(Date.parse(d.submit_date)).toLocaleDateString("en-GB-u-hc-h23", dateOptions)
                                    var msg = "Restart Search "+d.id+"?<br>Originally Submitted: "+dateStr;
                                    // Dialog
                                    CLMSUI.jqdialogs.areYouSureDialog (
                                        "popChoiceDialog", 
                                        msg, 
                                        "Please Confirm", "Yes, Restart this Search", "No, Cancel this Action", 
                                        doRestart
                                    );
                                })
                            ;
                        };
						
						
						var addValidationFunctionality = function (selection) {
							var lowScore = "&lowestScore=2";
							selection.select(".validateButton")
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
						};
						
						
						var addAggregateFunctionality = function (selection) {
							selection.selectAll(".aggregateCheckbox")
								.on ("input", function(d) {
									// set value to 0-9
									this.value = this.value.slice (0,1); // equiv to maxlength for text
									// set backing data to this value
									d.value[d.key] = this.value;
									CLMSUI.history.anyAggGroupsDefined (dynTable, this.value ? true : undefined);
								})
							;
						};
						
						
						var empowerRows = function (rowSelection) {
							addDeleteButtonFunctionality (rowSelection);
							addRestartButtonFunctionality (rowSelection);
							addValidationFunctionality (rowSelection);
							addAggregateFunctionality (rowSelection);
						};
						empowerRows (allRows);
						
						// do initial row filtering after all buttons have been extended/styled and columns hidden
						// If we don't those operations don't happen to the filtered rows, causing problems later
						function initialRowFilter () {
							if (initialValues.filters) {
								var fEntries = d3.entries(initialValues.filters);
								var first;
								fEntries.forEach (function (fEntry) {
									var dynFilter = dynTable.filters[fEntry.key];
									if (dynFilter && dynFilter !== "none") {
										dynFilter.value = fEntry.value;
										if (!first) {
											first = dynFilter;
										}
									}
								});
								if (first) {
									dynTable.filterRows({target: first});
								}
							}
						}
						initialRowFilter();

						/*
						var d3tab = d3.select(".container").append("table")
							.attr("class", "d3table")
							.datum({
								data: response.data, 
								headerEntries: columnMetaData.map (function (cmd) { return {key: cmd.id, value: cmd}; }), 
								keyOrder: d3.keys(modifiers),
							})
						;
						var table = CLMSUI.d3Table ();
						table (d3tab);
						applyHeaderStyling (d3tab.select("thead tr:first-child").selectAll("th"));
						console.log ("table", table);
						
						table
							.filter({name: "myco"})
							.dataToHTMLModifiers (modifiers)
							.postUpdateFunc (empowerRows)
							.update()
						;
						*/
						
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
	
	/*
	getCookieValue: function (field) {
		if (this.cookieContext.Cookies !== undefined) {
			var xiCookie = this.cookieContext.Cookies.getJSON("xiHistory");
			if (xiCookie) {
				return field ? xiCookie[field] : xiCookie;
			}
		}
		return undefined;
	},
	
	updateCookie: function (field, value) {
		if (this.cookieContext.Cookies !== undefined) {
			var xiCookie = this.cookieContext.Cookies.getJSON("xiHistory");
			if (xiCookie) {
				xiCookie[field] = value;
				this.cookieContext.Cookies.set("xiHistory", xiCookie);
			}
		}
	},
	*/
	
	getCookieValue: function (field, force) {
		if (force || this.youMayRememberMe()) {
			var xiCookie = localStorage.getItem ("xiHistory");
			if (xiCookie) {
				xiCookie = JSON.parse (xiCookie);
				return field ? xiCookie[field] : xiCookie;
			}
		}
		
		return this.tempValues[field];
	},
	
	updateCookie: function (field, value, force) {
		if (force || this.youMayRememberMe()) {
			var xiCookie = localStorage.getItem("xiHistory");
			if (!xiCookie) {
				//consolelog ()
				localStorage.setItem ("xiHistory", JSON.stringify(this.tempValues));
				xiCookie = localStorage.getItem("xiHistory");
			}
			xiCookie = JSON.parse (xiCookie);
			xiCookie[field] = value;
			localStorage.setItem ("xiHistory", JSON.stringify(xiCookie));
		}
		
		this.tempValues[field] = value;	// store values temporarily in case the user decides to press 'keep' later on
	},
	
	/*
	askCookiePermission: function (context) {
		this.cookieContext = context;
		var self = this;
		
		if (this.cookieContext.Cookies !== undefined && this.cookieContext.Cookies.get("xiHistory") === undefined) {
			CLMSUI.jqdialogs.areYouSureDialog (
				"popChoiceDialog", 
				"Can we use cookies to track your preferences on this page?", 
				"Cookies", "Yes", "No", 
				function () {
					self.cookieContext.Cookies.set("xiHistory", 
						self.defaultValues, 
						{ expires : 365 }
					);
				}
			);
		}
	},
	*/
	
	// is local storage viable?
	canLocalStorage: function () {
		try {
			localStorage.setItem ('mod', 'mod');
			localStorage.removeItem ('mod');
			return true;
		} catch(e) {
			return false;
		}
	},
	
	
	youMayRememberMe: function () {
		if (this.canLocalStorage()) {
			return this.getCookieValue ("rememberMe", true) || false;
		}
		return false;
	},
	
	
	setRemember: function (event) {
		if (this.canLocalStorage()) {
			this.updateCookie ("rememberMe", event.target.checked ? true : false, true);
			if (this.youMayRememberMe()) {
				localStorage.setItem ("xiHistory", JSON.stringify(this.tempValues));	// write temp values into localstorage if keep switched to on
			}
		}
	}
};
