var CLMSUI = CLMSUI || {};

CLMSUI.history = { 			
		
			loadSearchList: function () {		
                var dynTable;
                d3.selectAll("button").classed("btn btn-1 btn-1a", true);
                        DynamicTable.destroy("t1");
                        d3.select("#t1").html("");

                var params;
                var opt1;
                if (d3.select('#mySearches').property("checked")){
                 params =  "searches=MINE";
                    opt1 = {
                 colNames: ["View Search", "Notes", "Validate", "Sequence", "Submit Date", "ID", "Agg Group", "Delete"],
                  colTypes: ["alpha","alpha","none", "alpha", "alpha","number","clearCheckboxes", "none"],
                  pager: {
                    rowsCount: 20
                  }
                 };
                }
                else {
                 params =  "searches=ALL";
                 opt1 = {
                  colNames: ["View Search", "Notes", "Validate", "Sequence", "Submit Date", "ID", "User", "Agg Group", "Delete"],
                  colTypes: ["alpha","alpha","none", "alpha", "alpha","number","alpha", "clearCheckboxes", "none"],
                  pager: {
                    rowsCount: 20
                  }
                 };
        }
                
        if (d3.select(".container #clmsErrorBox").empty()) {
            d3.select(".container")
                .append("div")
                .attr ("id", "clmsErrorBox")
                .style ("transform", "scale(0.5)")
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
                    
                    d3.select("#username").text(response.user);
                    d3.select("#newSearch").style("display", response.userRights.canAddNewSearch ? null : "none");
                    d3.select("#scopeOptions").style("display", response.userRights.canSeeAll ? null : "none");

                    var userOnly = d3.select('#mySearches').property("checked");
                    
                    var makeResultsLink = function (id, sid, php, label) {
                         return "<a id='"+id+"' href='../xi3/"+php+"?sid="+sid+"'>"+label+"</a> "
                         + "<a id='"+id+"FDR' href='../xi3/"+php+"?sid="+sid+"&decoys=1&unval=1'>(with FDR)</a>";
                    };

					var makeValidationLink = function (id, sid, php, label) {
                         return "<a id='"+id+"' href='../xi3/"+php+"?sid="+sid+"&unval=1'>"+label+"</a> "
                          + "<a id='"+id+"' href='../xi3/"+php+"?sid="+sid+"&unval=1&linears=1'>(with Linears)</a>";
                    };
                    
                    var tooltips = d3.map ([
                        {name: "notes", func: function(d) { return d.value["notes"]; }},
                        {name: "name", func: function(d) { return d.value["status"]; }},
                    ], function (d) { return d.name; });

                    var cellStyles = {
                        aggregate: "center",
                        name: "varWidthCell",
                        //file_name: "varWidthCell"
                    };
      
                    var modifiers = {
                        name: function(d) { 
                            var name = d.status === "completed"
                                ? makeResultsLink(d.name, d.id+"-"+d.random_id, "network.php", d.name)
                                : "<span class='unviewableSearch'>"+d.name+"</span>"
                            ;
                            var error = d.status.substring(0,4) === "XiDB";
                            var sp1 = error ? "<span class='xierror'>" : "";
                            var sp2 = error ? "</span>" : "";
                            return name + sp1 + " ["+d.status.substring(0,16)+"]" + sp2 + "<div style='display:none'>"+d.status+"</div>"; 
                        },
                        notes: function (d) {
                            return d.notes ? d.notes.substring(0,16)+"<div style='display:none'>"+d.notes+"</div>" : "";
                        },
                        validate: function(d) {
                            return makeValidationLink(d.name, d.id+"-"+d.random_id, "validate.php", "validate");
                        },
                        file_name: function (d) {
                            return d.file_name;
                        },
                        submit_date: function(d) {
                            return d.submit_date.substring(0, d.submit_date.indexOf("."));
                        },
                        id: function(d) { return d.id; },
                        user_name: function(d) { return !userOnly ? d.user_name : ""; },
                        aggregate: function(d) {
                            return "<input type='text' pattern='\\d*' class='aggregateCheckbox' id='agg_"+d.id+"-"+d.random_id+"' maxlength='1'>";
                        },
                        delete: function(d) {
                            return d.user_name === response.user || response.userRights.isSuperUser ? "<button class='deleteButton unpadButton'>Delete</button>" : "";
                        }
                    };
                    

                    
                    d3.select("#clmsErrorBox").style("display", response.data ? "none" : "block");    // hide no searches message box if data is returned
                    
                    var d3sel = d3.select("#t1");
                    d3sel.html(""); //
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
                        cellFunctions.splice (6, 1);
                    }

                    var cells = rows.selectAll("td").data(function(d) { 
                        return cellFunctions.map(function(entry) { return {key: entry.key, value: d}; });
                    });
                    cells.enter()
                        .append("td")
                        .html (function(d) { return modifiers[d.key](d.value); })
                        .attr ("class", function(d) { return cellStyles[d.key]; })
                        .filter (function(d) { return tooltips.has (d.key); })
                        .attr("title", function(d) {
                            return d.value["id"]+": "+tooltips.get(d.key).func(d);
                        })
                    ;

                    if (response.data) {
                        dynTable = new DynamicTable("t1", opt1);
                    }
                    
                    
                    //console.log ("dynTable", dynTable);
                    d3.selectAll("th").data(cellFunctions)
                        .filter (function(d) { return cellStyles[d.key]; })
                        .each (function(d) {
                            var klass = cellStyles[d.key];
                            d3.select(this).classed (klass, true);
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
                            }
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
            var url = "../xi3/network.php?sid="+values.join(',');
            if (unvalAndDecoys) {
				url = url + "&unval=1&decoys=1";
			}
            window.open(url, "_self");
        }
    },

    clearAggregationCheckboxes: function () {
        d3.selectAll(".aggregateCheckbox").property("value", "");
    }
};
