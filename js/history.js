var CLMSUI = CLMSUI || {};

CLMSUI.history = { 			
		
			loadSearchList: function () {		
        var dynTable;
        d3.selectAll("button").classed("btn btn-1 btn-1a", true);
				    DynamicTable.destroy("t1");
				    d3.select("#t1").html("");
				
        var params;

        if (d3.select('#mySearches').property("checked")){
         params =  "searches=MINE";
         var opt1 = {
          colTypes: ["alpha","alpha","none", "alpha", "alpha","number","none", "clearCheckboxes", "none"],
          pager: {
          rowsCount: 20
          }
         }
        }
        else {
         params =  "searches=ALL";
         var opt1 = {
          colTypes: ["alpha","alpha","none", "alpha", "alpha","number","alpha", "clearCheckboxes", "none"],
          pager: {
          rowsCount: 20
          }
         }
        }
                
       $.ajax({
            type:"POST",
            url:"./php/searches.php", 
            data: params,
            contentType: "application/x-www-form-urlencoded",
            dataType: 'json',
            success: function(response, responseType, xmlhttp){
                if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    var d3sel = d3.select("#t1");
                    d3sel.html(""); //
                    var tbody = d3sel.append("tbody");
                    //console.log ("rights", response.userRights);

                    d3.select("#username").text(response.user);
                    d3.select("#newSearch").style("display", response.userRights.canAddNewSearch ? null : "none");
                    d3.select("#scopeOptions").style("display", response.userRights.canSeeAll ? null : "none");

                    var userOnly = d3.select('#mySearches').property("checked");
                    //console.log ("data", response.data);
                    var rows = tbody.selectAll("tr").data(response.data)
                        .enter()
                        .append("tr")
                    ;

                    var makeLink = function (id, sid, php, label) {
                         return "<a id='"+id+"' href='./"+php+"?sid="+sid+"'>"+label+"</a>";
                    }

                    var cellStyles = {
                        aggregate: "center",
                        name: "varWidthCell",
                        //file_name: "varWidthCell"
                    }
                    var modifiers = {
                        name: function(d) { 
                            var name = d.status === "completed"
                                ? makeLink(d.name, d.id+"-"+d.random_id, "network.php", d.name)
                                : "<span class='unviewableSearch'>"+d.name+"</span>"
                            ;
                            return name + " ["+d.status+"]"; 
                        },
                        notes: function (d) {
                            return d.notes ? d.notes.substring(0,16)+"<div style='display:none'>"+d.notes+"</div>" : "";
                        },
                        validate: function(d) {
                            return makeLink(d.name, d.id+"-"+d.random_id, "validate.php", "validate");
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
                            return d.user_name === response.user || response.userRights.isSuperUser ? "<button class='deleteButton'>Delete</button>" : "";
                        }
                    };

                    var cells = rows.selectAll("td").data(function(d) { 
                        var cs = d3.entries(modifiers);
                        cs.forEach(function(entry) { entry.value = d; });
                        return cs;
                    });
                    cells.enter()
                        .append("td")
                        .html (function(d) { return modifiers[d.key](d.value); })
                        .attr ("class", function(d) { return cellStyles[d.key]; })
                        .filter (function(d) { return d.key === "notes"; })
                        .attr("title", function(d) {
                            return d.value[d.key];
                        })
                    ;

                    dynTable = new DynamicTable("t1", opt1);
                    //console.log ("dynTable", dynTable);
                    d3.selectAll("th").data(d3.entries(modifiers))
                        .attr ("class", function(d) { return cellStyles[d.key]; })
                    ;
                    d3.selectAll(".tool-7").style("width", userOnly ? "0px" : "90px");
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
                            //deleteRowVisibly (d); // for testing without doing database delete

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
            }
       });
			},
				
    aggregate: function () {
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
            //console.log ("vals", values.join(","));
            window.open("./network.php?sid="+values.join(','), "_self");
        }
    },

    clearAggregationCheckboxes: function () {
        d3.selectAll(".aggregateCheckbox").property("value", "");
			 }

};