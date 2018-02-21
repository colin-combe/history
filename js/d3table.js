/*jslint browser: true, white: true, stupid: true, vars: true*/
var CLMSUI = CLMSUI || {};

CLMSUI.d3Table = function () {
	var data = [];
	var filteredData = [];
	var filter = [];
	var orderColumn = null;
	var orderDirs = ["asc", "desc", "none"];
	var orderDir = orderDirs[0];
	var page = 0;
	var pageSize = 20;
	var keyOrder = ["key1", "key2"];
	var selection = null;
	var postUpdateFunc = null;
	var dataToHTMLModifiers = {};
	var pageCount = Math.ceil (filteredData.length / pageSize);
	
	function my (mySelection) {	// data in selection should be 2d-array [[]]
		selection = mySelection;
		data = selection.datum().data;
		filteredData = data;
		keyOrder = selection.datum().keyOrder;
		
		if (selection.select("thead").empty()) {
			selection.append("thead").selectAll("tr").data([0,1]).enter().append("tr");
			selection.append("tbody");
		}
		
		var headerEntries = selection.datum().headerEntries;
		
		var headerCells = selection.select("thead tr:first-child").selectAll("th").data(headerEntries);
		headerCells.exit().remove();
		headerCells.enter().append("th").append("span");

		headerCells.each (function (d) {
			d3.select(this).select("span")
				.text (d.value.name)
				.attr ("title", d.value.tooltip)
			;
		});
		
		var filterCells = selection.select("thead tr:nth-child(2)").selectAll("th").data(headerEntries);
		filterCells.exit().remove();
		var newFilters = filterCells.enter().append("th");
		newFilters.append("input")
			.attr("class", "filterInput")
			.attr("type", "text")
			.property("value", function(d) { return filter[d.value.filterID]; })
			.on ("input", function (d) {
				var filter = my.filter();
				filter[d.key] = d3.select(this).property("value");
				console.log ("my", my);
				my.filter(filter).update();
			})
		;
		newFilters.append("svg").attr("class", "arrow");
		
		console.log ("data", data, filteredData);
	}
	
	my.update = function () {
		var pageData = filteredData.slice (page * pageSize, (page + 1) * pageSize);
		var ko = this.keyOrder();
		var modifiers = this.dataToHTMLModifiers();
		
		var rows = selection.select("tbody").selectAll("tr").data(pageData);
		rows.exit().remove();
		rows.enter().append("tr");
		
		var cells = rows.selectAll("td").data (function (d) { return ko.map (function (k) { return {key: k, value: d}; }); });
		
		cells.enter().append("td");
		
		cells.html (function(d) { return modifiers[d.key] ? modifiers[d.key](d.value) : d.value[d.key]; });	
		
		if (this.postUpdateFunc()) {
			this.postUpdateFunc()(rows);
		}
	};
	
	my.keyOrder = function (value) {
		if (!arguments.length) { return keyOrder; }
		keyOrder = value;
		return my;
	};
	
	my.dataToHTMLModifiers = function (value) {
		if (!arguments.length) { return dataToHTMLModifiers; }
		dataToHTMLModifiers = value;
		return my;
	};
	
	my.filter = function (value) {
		if (!arguments.length) { return filter; }
		filter = value;
		var ko = this.keyOrder();
		
		filteredData = data.filter (function (rowdata) {
			var pass = true;
			for (var n = 0; n < ko.length; n++) {
				var key = ko[n];
				if (filter[key] && rowdata[key].search(filter[key]) < 0) {
					pass = false;
					break;
				}
			}
			return pass;
		});
		
		pageCount = Math.ceil (filteredData.length / pageSize);
		my.page(0);
		
		// update filter inputs with new filters
		var filterCells = selection.select("thead tr:nth-child(2)").selectAll("th");
		filterCells.select("input").property("value", function (d) {
			return filter[d.key];	
		});
		
		//console.log ("fd", filteredData);
		
		return my;
	};
	
	my.orderColumn = function (value) {
		if (!arguments.length) { return orderColumn; }
		if (value !== orderColumn) {
			value = orderColumn;
			orderDir = "asc";
		} else {
			var index = orderDirs.indexOf(orderDir);
			orderDir = orderDirs[(index + 1) % orderDirs.length];
		}
		return my;
	};
	
	my.page = function (value) {
		if (!arguments.length) { return page; }
		page = value;
		return my;
	};
	
	my.pageSize = function (value) {
		if (!arguments.length) { return pageSize; }
		pageSize = value;
		pageCount = filteredData.length / pageSize;
		return my;
	};
	
	my.postUpdateFunc = function (value) {
		if (!arguments.length) { return postUpdateFunc; }
		postUpdateFunc = value;
		return my;
	};
	
	return my;
};