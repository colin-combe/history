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
			.filter (function () {
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

		d3.selectAll(".d3tableContainer").remove();
       	d3.selectAll("button").classed("btn btn-1 btn-1a", true);
        
        var self = this;

        var columnMetaData = [
            {name: "Visualise Search", type: "alpha", tooltip: "", visible: true, removable: true, id: "name"},
            {name: "+FDR", type: "none", tooltip: "Visualise search with decoys to allow False Discovery Rate calculations", visible: true, removable: true, id: "fdr"},
			{name: "Restart", type: "none", tooltip: "", visible: false, removable: true, id: "restart"},
            {name: "Notes", type: "alpha", tooltip: "", visible: true, removable: true, id: "notes"},
            {name: "Validsate", type: "none", tooltip: "", visible: true, removable: true, id: "validate"},
            {name: "Sequence", type: "alpha", tooltip: "", visible: true, removable: true, id: "file_name"},
            {name: "Enzyme", type: "alpha", tooltip: "", visible: false, removable: true, id: "enzyme"},
            {name: "Cross-Linkers", type: "alpha", tooltip: "", visible: false, removable: true, id: "crosslinkers"},
            {name: "Submit Date", type: "alpha", tooltip: "", visible: true, removable: true, id: "submit_date"},
            {name: "ID", type: "alpha", tooltip: "", visible: true, removable: true, id: "id"},
            {name: "User", type: "alpha", tooltip: "", visible: true, removable: true, id: "user_name"},
            {name: "Agg Group", type: "clearCheckboxes", tooltip: "Assign numbers to searches to make groups within an aggregated search", visible: true, removable: false, id: "aggregate"},
            //{name: "Delete", type: "deleteHiddenSearchesOption", tooltip: "", visible: true, removable: true},
			{name: "Delete", type: "boolean", tooltip: "", visible: true, removable: true, id: "hidden"},
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
						
						d3.select("#aggSearch").on ("click", function () {
							self.aggregate (response.data, false);
						});
						d3.select("#aggFDRSearch").on ("click", function () {
							self.aggregate (response.data, true);
						});

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
                            hidden: "5em",
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
								var completed = d.status === "completed";
                                return completed ? "<input type='number' pattern='\\d*' class='aggregateInput' id='agg_"+d.id+"-"+d.random_id+"' maxlength='1' min='1' max='9'"+(d.aggregate ? " value='"+d.aggregate+"'" : "") + ">" : "";
                            },
                            hidden: function(d) {
                                return d.user_name === response.user || response.userRights.isSuperUser ? "<button class='deleteButton unpadButton'>"+(isTruthy(d.hidden) ? "Restore" : "Delete")+"</button>" : "";
                            }
                        };


                        d3.select("#clmsErrorBox").style("display", response.data ? "none" : "block");    // hide no searches message box if data is returned

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
						
						// button to clear aggregation checkboxes
						function addClearAggInputsButton (buttonContainer, d3rowFunc, data) {
							buttonContainer
								.append("button")
								.text ("Clear ↓")
								.attr ("class", "btn btn-1 btn-1a clearChx unpadButton")
								.attr ("title", "Clear all searches chosen for aggregation")
								.on ("click", function () {
									CLMSUI.history.clearAggregationInputs (d3rowFunc(), data);
								})
                        	;
						}
						
						// cookie store if allowed
						function storeColumnHiding (value, checked) {
							var visibilities = self.getCookieValue("visibility");
							if (visibilities) {
								visibilities[value] = checked;
								self.updateCookie ("visibility", visibilities);
							}
						}
						
						function storeOrdering (sortColumn, sortDesc) {
							var sort = self.getCookieValue("sort");
							if (sort) {
								sort.column = sortColumn;
								sort.sortDesc = sortDesc;
								self.updateCookie ("sort", sort);
							}
						}
						
						function storeFiltering (filterVals) {
							var filters = self.getCookieValue("filters");
							if (filters) {
								var dfilters = filterVals;
								var fobj = {};
								dfilters.forEach (function (df, i) {
									if (df !== "none" && df.value) {
										fobj[i] = df.value;
									}
								});
								self.updateCookie ("filters", fobj);
							}
						}
                        
					

                        // helper function for next bit
                        var displayColumn = function (columnIndex, show, table) {
                            table.selectAll("td:nth-child("+columnIndex+"), th:nth-child("+columnIndex+")").style("display", show ? null : "none");
                        };
                        
                        // Add a multiple select widget for column visibility
						function addColumnSelector (containerSelector, table, dispatch) {
							var newtd = containerSelector;
							newtd.append("span").text("Show Columns");
							var datum = newtd.datum();
							var removableColumns = datum.filter (function (d) { 
								return d.value.removable;
							});
							newtd.append("select")
								.property("multiple", true)
								.selectAll("option")
								.data(removableColumns, function(d) {return d.key; })
									.enter()
									.append("option")
									.text (function(d) { return d.value.name; })
									.property ("value", function(d) { return d.name; })
									.property ("selected", function (d) { return d.value.visible; })
							;
							$(newtd.select("select").node()).multipleSelect ({  
								selectAll: false,
								onClick: function (view) {
									// hide/show column chosen by user
									var colNames = pluck (columnMetaData, "name");
									var index = colNames.indexOf (view.value) + 1; // elements are 1-indexed in css selectors
									var indexPoint = datum.filter (function (d) {
										return d.value.name === view.value;
									}).forEach (function(d) {
										d.value.visible = view.checked;
									});
									displayColumn (index, view.checked, table);

									dispatch.columnHiding (view.value, view.checked);
								}
							});
						};
						
						
						function hideColumns (table) {
							// hide columns that are hid by default
							columnMetaData.forEach (function (d, i) {
								if (!d.visible) {
									displayColumn (i + 1, false, table);
								}
							});
						}


						function applyHeaderStyling (headers) {
							headers.attr("title", function (d,i) {
								return columnMetaData[i].tooltip;   
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
						   
                        
						// hidden row state can change when restore/delete pressed or when restart pressed
						function updateHiddenRowStates (selectedRows) {
							// reset button text and row appearance
							selectedRows.selectAll(".deleteButton").text (function(d) {
								return isTruthy(d.hidden) ? "Restore" : "Delete";
							});
                            selectedRows.classed ("hiddenSearch", function(d) { return isTruthy(d.hidden); });
						}
						
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
											var index = pluck(response.data, "id").indexOf(d.id);
											if (index >= 0) {
												response.data.splice (index, 1);
												table.filter(table.filter()).update();
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
										table.update();
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
							selection.select(".aggregateInput")
								.on ("input", function(d) {
									// set value to 0-9
									this.value = this.value.slice (0,1); // equiv to maxlength for text
									// set backing data to this value
									if (d.value) { 
										d.value[d.key] = this.value;
									} else {
										d.aggregate = this.value;
									}
									CLMSUI.history.anyAggGroupsDefined (response.data, this.value ? true : undefined);
								})
							;
						};
						
						
						var empowerRows = function (rowSelection) {
							addDeleteButtonFunctionality (rowSelection);
							addRestartButtonFunctionality (rowSelection);
							addValidationFunctionality (rowSelection);
							addAggregateFunctionality (rowSelection);
							updateHiddenRowStates (rowSelection);
						};
						
						
						var headerEntries = columnMetaData.map (function (cmd) { return {key: cmd.id, value: cmd}; });
						var d3tab = d3.select(".container").append("div").attr("class", "d3tableContainer")
							.datum({
								data: response.data, 
								headerEntries: headerEntries, 
								cellStyles: cellStyles,
								tooltips: tooltips,
								columnOrder: headerEntries.map (function (hentry) { return hentry.key; }),
							})
						;
						var table = CLMSUI.d3Table ();
						table (d3tab);
						applyHeaderStyling (d3tab.selectAll("thead tr:first-child").selectAll("th"));
						console.log ("table", table);
						
						// set initial filters
						var keyedFilters = {};
						headerEntries.forEach (function (hentry) {
							var findex = table.getColumnIndex (hentry.key);
							//console.log (hentry, "ind", findex, initialValues.filters);
							keyedFilters[hentry.key] = {value: initialValues.filters[findex], type: hentry.value.type}	
						});
						//console.log ("keyedFilters", keyedFilters);
						
						table
							.filter(keyedFilters)
							.dataToHTMLModifiers (modifiers)
							.postUpdateFunc (empowerRows)
						;
						
						// set initial sort
						if (initialValues.sort && initialValues.sort.column) {
							table
								.orderKey (headerEntries[initialValues.sort.column].key)
								.orderDir (initialValues.sort.sortDesc ? "desc" : "asc")
								.sort()
							;
						}
						table.update();
						
						var dispatch = table.dispatch();
						dispatch.on ("columnHiding", storeColumnHiding);
						dispatch.on ("filtering", storeFiltering);
						dispatch.on ("ordering", storeOrdering);
						
						// add column selector, header entries has initial visibilities incorporated
						addColumnSelector (d3tab.select("div.d3tableControls").datum(headerEntries), d3tab);
						
						// hide delete filter if not superuser as pointless
						table.showHeaderFilter ("hidden", response.userRights.isSuperUser);
						
						// add clear aggregation button to specific header
						var aggregateColumn = table.getColumnIndex("aggregate") + 1;
						var aggButtonCell = d3tab.selectAll("thead tr:nth-child(2)").select("th:nth-child("+aggregateColumn+")");
						addClearAggInputsButton (
							aggButtonCell,
							function() { return d3tab.selectAll("tbody tr"); }, 
							response.data
						);
						CLMSUI.history.anyAggGroupsDefined (response.data, false);   // disable clear button as well to start with
						
                    }
                }
            }, 
           error: function () {
                console.log ("error", arguments);
               //window.location.href = "../../xi3/login.html";
           }
       });
    },
				
    aggregate: function (tableData, fdrCapable) {
		var values = tableData
			.filter (function (d) {
				var valid = false;
				var agg = d.aggregate;
				if (agg) {
					valid = !(isNaN(agg) || agg.length > 1);
					if (!valid) { alert ("Group identifiers must be a single digit."); }
				}
				return valid; 
			})
			.map (function (d) { return d.id +"-" + d.random_id + "-" + d.aggregate})
		;

        if (!values.length) { alert ("Cannot aggregate: no selection - use text field in right most table column."); }
        else {
            var url = CLMSUI.history.makeResultsUrl (values.join(','), fdrCapable ? "&unval=1&decoys=1" : "");
            window.open (url, "_self");
            //console.log ("URL", url);
        }
    },

    clearAggregationInputs: function (d3TableRows, data) {
        d3TableRows.selectAll(".aggregateInput").property("value", "");
		data.forEach (function (d) { d.aggregate = ""; });
        CLMSUI.history.anyAggGroupsDefined (data, false);
    },
    
    anyAggGroupsDefined: function (tableData, anySelected) {
        if (anySelected === undefined || anySelected === true) {
            var sel = tableData.filter (function(d) { return d.aggregate; });
            anySelected = sel.length > 0;  
            var groups = d3.nest().key(function(d) { return d.aggregate; }).entries(sel);
            d3.selectAll("#selectedCounter").text(sel.length+" Selected across "+groups.length+(groups.length > 1 ? " Groups" : " Group"));
        }

        d3.selectAll("#aggSearch,#aggFDRSearch,.clearChx").property("disabled", !anySelected);
        d3.selectAll("#selectedCounter")
            .style ("visibility", anySelected ? "visible" : null)
        ;
    },
    
    anonForScreenshot: function () {
        // Anon usernames, search names, current user. Remember to filter to completed searches only.
        d3.selectAll("tbody").selectAll("td:nth-child(8)").text(function() { return ["bert", "bob", "allan", "audrey", "fiona"][Math.floor(Math.random() * 5)]; });
        d3.selectAll("tbody").selectAll("td:nth-child(1) a").text(
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
