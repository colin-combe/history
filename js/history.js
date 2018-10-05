/*jslint browser: true, white: true, stupid: true, vars: true*/
var CLMSUI = CLMSUI || {};

CLMSUI.history = {

    makeResultsUrl: function (sid, params) {
        return "../xi3/network.php?upload="+sid+params;
    },

	defaultValues: {
		visibility: {
			"Visualise Data": true,
			"Spectra Only": true,
			"Peak List Files": true,
			"Analysis Software": true,
			// "Provider": false,
			// "Audits": false,
			// "Samples": false,
			// "Analyses": false,
			// "Protocols": false,
			// "Bib. Refs": false,
			// "Spectra Formats": false,
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

        var columnSettings = {
			filename:{columnName: "Visualise Data", type: "alpha", headerTooltip: "", visible: true, removable: true},
            validate:{columnName: "Spectra Only", type: "none", headerTooltip: "", visible: true, removable: true},
            peak_list_file_names:{columnName: "Peak List Files", type: "alpha", headerTooltip: "", visible: true, removable: true},
            analysis_software:{columnName: "Analysis Software", type: "alpha", headerTooltip: "", visible: true, removable: true},
            provider:{columnName: "Provider", type: "alpha", headerTooltip: "", visible: true, removable: true},
            audits:{columnName: "Audits", type: "alpha", headerTooltip: "", visible: true, removable: true},
            samples:{columnName: "Samples", type: "alpha", headerTooltip: "", visible: true, removable: true},
            analyses:{columnName: "Analyses", type: "alpha", headerTooltip: "", visible: true, removable: true},
            protocol:{columnName: "Protocols", type: "alpha", headerTooltip: "", visible: true, removable: true},
            bib:{columnName: "Bib. Refs", type: "alpha", headerTooltip: "", visible: true, removable: true},
            spectra_formats:{columnName: "Spectra Formats", type: "alpha", headerTooltip: "", visible: true, removable: true},
            upload_time:{columnName: "Upload Time", type: "alpha", headerTooltip: "", visible: true, removable: true},
            contains_crosslinks:{columnName: "Crosslinks", type: "boolean", headerTooltip: "", visible: true, removable: true},
            upload_error:{columnName: "Upload Error", type: "alpha", headerTooltip: "", visible: true, removable: true},
            error_type:{columnName: "Error Type", type: "alpha", headerTooltip: "", visible: true, removable: true},
            upload_warnings:{columnName: "Upload Warnings", type: "alpha", headerTooltip: "", visible: true, removable: true},
            origin:{columnName: "Pride URL", type: "alpha", headerTooltip: "", visible: true, removable: true},
            ident_count:{columnName: "Ident. Count", type: "numeric", headerTooltip: "", visible: true, removable: true},
            ident_file_size:{columnName: "Ident. File Size", type: "numeric", headerTooltip: "", visible: true, removable: true},
            zipped_peak_list_file_size:{columnName: "Zipped Peak List Size", type: "numeric", headerTooltip: "", visible: true, removable: true},
            aggregate:{columnName: "Agg Group", type: "clearCheckboxes", headerTooltip: "Assign numbers to searches to make groups within an aggregated search", visible: true, removable: false},
            hidden:{columnName: "Delete", type: "none", headerTooltip: "", visible: true, removable: true},
        };


// {"peak_list_file_names":"{}","analysis_software":"{}","provider":"{}","audits":"{}","samples":"{}",
// "analyses":"{}","protocol":"{}","bib":"{}","spectra_formats":"{}","upload_time":"2018-09-26","default_pdb":null,"contains_crosslinks":null,"upload_error":null,"error_type":null,
// "upload_warnings":"{}","origin":"{}","random_id":"74889-02651-89110-99309","deleted":"f","ident_count":null,"ident_file_size":null,"zipped_peak_list_file_size":null}

        // var columnSettings = {
        //     name: {columnName: "Visualise Search", type: "alpha", headerTooltip: "", visible: true, removable: true},
        //     fdr: {columnName: "+FDR", type: "none", headerTooltip: "Visualise search with decoys to allow False Discovery Rate calculations", visible: true, removable: true},
		// 	restart: {columnName: "Restart", type: "none", headerTooltip: "", visible: false, removable: true},
        //     notes: {columnName: "Notes", type: "alpha", headerTooltip: "", visible: true, removable: true},
        //     validate: {columnName: "Validate", type: "none", headerTooltip: "", visible: true, removable: true},
        //     filename: {columnName: "Sequence", type: "alpha", headerTooltip: "", visible: true, removable: true},
        //     enzyme: {columnName: "Enzyme", type: "alpha", headerTooltip: "", visible: false, removable: true},
        //     crosslinkers: {columnName: "Cross-Linkers", type: "alpha", headerTooltip: "", visible: false, removable: true},
		// 	base_new: {columnName: "Base New", type: "none", headerTooltip: "Base a New Search's parameters on this Search", visible: false, removable: true},
        //     submit_date: {columnName: "Submit Date", type: "alpha", headerTooltip: "", visible: true, removable: true},
        //     id: {columnName: "ID", type: "alpha", headerTooltip: "", visible: true, removable: true},
        //     user_name: {columnName: "User", type: "alpha", headerTooltip: "", visible: true, removable: true},
        //     aggregate: {columnName: "Agg Group", type: "clearCheckboxes", headerTooltip: "Assign numbers to searches to make groups within an aggregated search", visible: true, removable: false},
        //     //delete: {name: "Delete", type: "deleteHiddenSearchesOption", tooltip: "", visible: true, removable: true},
		// 	hidden: {columnName: "Delete", type: "boolean", headerTooltip: "", visible: true, removable: true},
		// };

		// Set visibilities of columns according to cookies or default values
		d3.entries(columnSettings).forEach (function (columnEntry) {
			columnEntry.value.visible = initialValues.visibility[columnEntry.value.columnName];
		}, this);


        var pluck = function (data, prop) {
            return data.map (function (d) { return d[prop]; });
        };


        if (d3.select(".container #clmsErrorBox").empty()) {
            d3.select(".container")
                .append("div")
                .attr ("id", "clmsErrorBox")
                .text("You Currently Have No Searches in the xiView Database.")
            ;
        }

       $.ajax({
            type:"POST",
            url:"./php/xiUI_uploads.php",
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


						d3.select("#aggSearch").on ("click", function () {
							self.aggregate (response.data, false);
						});
						d3.select("#aggFDRSearch").on ("click", function () {
							self.aggregate (response.data, true);
						});

                        d3.select("#username").text("(" + response.user + ")");

                        var makeResultsLink = function (sid, params, label) {
                             return "<a href='"+CLMSUI.history.makeResultsUrl(sid, params)+"'>"+label+"</a>";
                        };

                        var makeValidationLink = function (sid, params, label) {
                             return "<a href='"+makeValidationUrl(sid, params)+"'>"+label+"</a>";
                        };

                        var makeValidationUrl = function (sid, params) {
                             return "../xi3/validate.php?upload="+sid+params;
                        };

                        var isTruthy = function (val) {
                            return val === true || val === "t" || val === "true";
                        };

						var tooltipHelper = function (d, field) {
							return d.value.id + ": " + d.value[field];
						}
                        var jsonTooltipHelper = function (d, field) {
							return JSON.stringify(d.value[field], null, 4);
						}
                        var tooltips = {
                            filename: function(d) { return tooltipHelper (d, "filename"); },
                            peak_list_file_names: function (d) { return jsonTooltipHelper (d, "peak_list_file_names");},
                            analysis_software: function (d) { return jsonTooltipHelper (d, "analysis_software");},
                            provider: function (d) {  return jsonTooltipHelper (d, "provider"); },
                            audits: function (d) {  return jsonTooltipHelper (d, "audits"); },
                            samples: function (d) {  return jsonTooltipHelper (d, "samples"); },
                            analyses: function (d) {  return jsonTooltipHelper (d, "analyses"); },
                            protocol: function (d) {  return jsonTooltipHelper (d, "protocol"); },
                            bib: function (d) {  return jsonTooltipHelper (d, "bib"); },
                            spectra_formats: function (d) {  return jsonTooltipHelper (d, "spectra_formats"); },

                            upload_time: function (d) { return d.value.upload_time; },
                            upload_error: function (d) { return d.upload_error; },
                            error_type: function (d) { return d.error_type; },
                            upload_warnings: function (d) { return jsonTooltipHelper (d, "upload_warnings"); },
                            origin: function (d) { return d.origin; },
                            ident_count: function (d) { return d.ident_count; },
                            ident_file_size: function (d) { return d.ident_file_size; },
                            zipped_peak_list_file_size: function (d) { return d.zipped_peak_list_file_size; }
                        };

                        var cellStyles = {
                            //name: "varWidthCell",
                            filename: "varWidthCell2",
                        };

                        var cellHeaderOnlyStyles = {
                            //fdr: "dottedBorder",
                        };

                        var cellWidths = {
                            filename: "20em",
                            peak_list_file_names: "20em",
                            validate: "5em",
                            aggregate: "6em",
                            hidden: "5em",
                        };

						var isErrorMsg = function (msg) {
							return (msg.substr(0,4) === "XiDB" || msg.substr(0,10) === "UNFINISHED");
						};

                        var modifiers = {
                            filename: function(d) {
                                var completed = true;//d.status === "completed";
								var name = d.filename;//d.name.length < 200 ? d.name : (d.name.substring (0, 200) + "…");
                                var nameHtml = completed ? makeResultsLink (d.id+"-"+d.random_id, "", name)
                                    : "<span class='unviewableSearch'>"+name+"</span>"
                                ;
                                // var error = !completed && d.status.substring(0,4) === "XiDB";
                                return nameHtml;// + (error ? "<span class='xierror'>" : "") + " ["+d.status.substring(0,16)+"]" + (error ? "</span>" : "")
                                    /*+ (d.status.length <= 16 ? "" : "<div style='display:none'>"+d.status+"</div>")*/;
                            },
                            validate: function (d) {
                                return  makeValidationLink (d.id+"-"+d.random_id, "", "View Spectra");
                            },
                            peak_list_file_names: function (d) {
                                return d.peak_list_file_names;
                            },
                            analysis_software: function (d) {
                                //return d.analysis_software;
                                var text = "";
                                for (var i = 0; i < d.analysis_software.length; i++) {
                                    if (i > 0) {
                                        text = text + "; ";
                                    }
                                    var software = d.analysis_software[i];
                                    text = text + (software.name? software.name : software.id);
                                    text = text + " " + software.version;
                                }
                                return text;
                            },
                            provider: function (d) {
                                return d.provider.ContactRole? d.provider.ContactRole[0].contact_ref : "";
                            },
                            audits: function (d) {
                                var text = ""
                                if (d.audits.Person && d.audits.Person.name) {
                                    text += d.audits.Person.name;
                                }
                                if (d.audits.Organization &&  d.audits.Organization.name) {
                                    if (text != "") {text += " "}
                                    text += d.audits.Organization.name;
                                }
                                return text;
                            },
                            samples: function (d) {
                                var text = ""
                                for (var i = 0; i < d.samples.length; i++) {
                                    if (text != "") {
                                        text += "; ";
                                    }
                                    var sample = d.samples[i];
                                    if (sample["sample name"]) {
                                        text += sample["sample name"];
                                    } else if (sample.id) {
                                        text += sample.id;
                                    } else if (sample.name) {
                                        text += sample.name;
                                    }
                                }
                                return text;
                            },
                            analyses: function (d) { return JSON.stringify(d.analyses); },
                            protocol: function (d) { return JSON.stringify(d.protocol); },
                            bib: function (d) {return JSON.stringify(d.bib); },
                            spectra_formats: function (d) { JSON.stringify(d.spectra_formats); },

                            upload_time: function (d) { return d.upload_time; },
                            contains_crosslinks: function (d) { return isTruthy(d.contains_crosslinks); },
                            upload_error: function (d) { return d.upload_error; },
                            error_type: function (d) { return d.error_type; },
                            upload_warnings: function (d) {
                                var text = ""
                                for (var i = 0; i < d.upload_warnings.length; i++) {
                                    if (text != "") {
                                        text += "; ";
                                    }
                                    text += d.upload_warnings[i].type;
                                }
                                return text;
                            },
                            origin: function (d) { return d.origin; },
                            ident_count: function (d) { return d.ident_count; },
                            ident_file_size: function (d) { return d.ident_file_size; },
                            zipped_peak_list_file_size: function (d) { return d.zipped_peak_list_file_size; },

                            aggregate: function(d) {
								var completed = true;//d.status === "completed";
                                return completed ? "<input type='number' pattern='\\d*' class='aggregateInput' id='agg_"+d.id+"-"+d.random_id+"' maxlength='1' min='1' max='9'"+(d.aggregate ? " value='"+d.aggregate+"'" : "") + ">" : "";
                            },
                            hidden: function(d) {
                                return "<button class='deleteButton unpadButton'>Delete</button>";
                            }
                        };


						var propertyNames = ["cellStyle", "dataToHTMLModifier", "tooltip"];
						[cellStyles, modifiers, tooltips].forEach (function (obj, i) {
							d3.entries(obj).forEach (function (entry) {
								columnSettings[entry.key][propertyNames[i]] = entry.value;
							});
						});


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
                        //sanitise (response.data);
                        //var b = performance.now() - a;
                        //console.log ("sanity in", b, "ms.");

                        /* Everything up to this point helps generates the dynamic table */

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


                        // Add a multiple select widget for column visibility
						function addColumnSelector (containerSelector, d3table, dispatch) {
							var newtd = containerSelector;
							newtd.append("span").text("Show Columns");
							var datum = newtd.datum();
							var removableColumns = d3.entries(datum).filter (function (d) {
								return d.value.removable;
							});
							newtd.append("select")
								.property("multiple", true)
								.selectAll("option")
								.data(removableColumns, function(d) {return d.key; })
									.enter()
									.append("option")
									.text (function(d) { return d.value.columnName; })
									.property ("value", function(d) { return d.key; })
									.property ("selected", function (d) { return d.value.visible; })
							;
							$(newtd.select("select").node()).multipleSelect ({
								selectAll: false,
								onClick: function (view) {
									// hide/show column chosen by user
									var key = view.value;
									datum[key].visible = view.checked;
									d3table.showColumn (d3table.getColumnIndex(key) + 1, view.checked);
									dispatch.columnHiding (view.label, view.checked);
								}
							});
						};


						function applyHeaderStyling (headers) {
							var title = headers.select("svg").select("title");
							if (title.empty()) {
								title = headers.select("svg").append("title");
							}
							title.text(function(d) { return "Sort table by "+columnSettings[d.key].columnName; });

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
                                    };
                                    //deleteRowVisibly (d); // alternative to following code for testing without doing database delete

                                    // Ajax delete/restore call
                                     var doDelete = function() {
                                        $.ajax({
                                            type: "POST",
                                            url:"./php/deleteSearch.php",
                                            data: {searchID: d.id+"-"+d.random_id},
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

                                    var basicMsg = "Delete" + " Upload "+d.filename+"?";
                                    var msg = basicMsg + "<br>This action cannot be undone (by yourself or anyone else).<br>Are You Sure?";

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
							// addRestartButtonFunctionality (rowSelection);
							// addBaseNewButtonFunctionality (rowSelection);
							//addValidationFunctionality (rowSelection);
							addAggregateFunctionality (rowSelection);
							// updateHiddenRowStates (rowSelection);
						};


						var d3tableElem = d3.select(".container").append("div")
							.datum({
								data: response.data || [],
								columnSettings: columnSettings,
								columnOrder: d3.keys(columnSettings),
							})
						;
						var d3table = CLMSUI.d3Table ();
						d3table (d3tableElem);
						applyHeaderStyling (d3table.getHeaderCells());
						console.log ("d3table", d3table);

						// set initial filters
						var keyedFilters = {};
						d3.keys(columnSettings).forEach (function (columnKey) {
							var findex = d3table.getColumnIndex (columnKey);
							keyedFilters[columnKey] = initialValues.filters[findex];
						});

						d3table
							.filter(keyedFilters)
							.postUpdate (empowerRows)
						;

						// set initial sort
						if (initialValues.sort && initialValues.sort.column) {
							d3table
								.orderKey (d3table.columnOrder()[initialValues.sort.column])
								.orderDir (initialValues.sort.sortDesc ? "desc" : "asc")
								.sort()
							;
						}
						d3table.update();

						var dispatch = d3table.dispatch();
						dispatch.on ("columnHiding", storeColumnHiding);
						dispatch.on ("filtering", storeFiltering);
						dispatch.on ("ordering", storeOrdering);

						// add column selector, header entries has initial visibilities incorporated
						addColumnSelector (d3tableElem.select("div.d3tableControls").datum(columnSettings), d3table, dispatch);

						// hide delete filter if not superuser as pointless
						//d3table.showFilterCell ("hidden", response.userRights.isSuperUser);

						// allows css trick to highlight filter inputs with content so more visible to user
						d3.selectAll(".d3table-filterInput").property("required", true);

						// add clear aggregation button to specific header
						var aggregateColumn = d3table.getColumnIndex("aggregate") + 1;
						var aggButtonCell = d3tableElem.selectAll("thead tr:nth-child(2)").select("th:nth-child("+aggregateColumn+")");
						addClearAggInputsButton (
							aggButtonCell,
							function() { return d3table.getAllRowsSelection(); },
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
	},

    deleteAccountDialog: function (){
        CLMSUI.jqdialogs.areYouSureDialog("Delete_account", "Delete account and all data - are your sure?", "Delete Account", "DELETE EVERYTHING", "CANCEL", function() {alert("ok, its gone");});
    }

};
