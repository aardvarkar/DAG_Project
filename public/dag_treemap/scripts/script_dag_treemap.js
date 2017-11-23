// The treemap is based on Mike Bostocks, model: https://bost.ocks.org/mike/treemap/

d3.select('input[value="sumbyCount"]').property("checked", true);

d3.json("/dag_treemap/biological_process.json", function(data1) {
    d3.json("/dag_treemap/data_treemap_dag.json", function(data2) {

	// DAG: extract the nodes that for the intersection between the descendant of the representative and the ancestors of the term
	function create_graph_nodes (node_root, nodes_leaves) {
	    // Determine the intersection of each nodes_leaves ancestors with the node_root descendant
	    var inter_nodes = [];
	    var leaves_id = [];
	    nodes_leaves.forEach(function(element){
		for (var i = element.ancestor.length-1; i > -1; i--){
		    if (inter_nodes.indexOf(element.ancestor[i]) == -1 && node_root.descendant.indexOf(element.ancestor[i]) != -1){
			inter_nodes.push(element.ancestor[i]);
		    }
		}
		leaves_id.push(element.id);
	    });

	    // Create an array containing all the wanted nodes
	    var all_nodes = [].concat(nodes_leaves)
	    data1.Class.forEach(function(element){
		if (inter_nodes.indexOf(element.id) != -1){
		    all_nodes.push({id:element.id, name:element.name, ancestor:element.ancestor, descendant:element.descendant, children:element.children});
		}
	    });
	    if (all_nodes.indexOf(node_root) == -1){
		all_nodes.push(node_root);
	    }
	    return all_nodes;
	}


	// Treemap

	var defaults = {
	    margin: {top: 24, right: 0, bottom: 0, left: 0},
	    rootname: "TOP",
	    format: ",d",
	    title: "",
	    width: $(window).width(),
	    height: ($(window).height()/2)
	};

	function main(o, data) {
	    var root,
		opts = $.extend(true, {}, defaults, o),
		formatNumber = d3.format(opts.format),
		rname = opts.rootname,
		margin = opts.margin,
		theight = 6 + 16;

	    $('#chart').width(opts.width).height(opts.height);
	    var width = opts.width - margin.left - margin.right,
		height = opts.height - margin.top - margin.bottom - theight,
		transitioning,
		first_time = true;

	    var color = d3.scale.category20c();

	    var x = d3.scale.linear()
		.domain([0, width])
		.range([0, width]);

	    var y = d3.scale.linear()
		.domain([0, height])
		.range([0, height]);

	    var treemap = d3.layout.treemap()
		.children(function(d, depth) { return depth ? null : d._children; })
		.sort(function(a, b) { return a.value - b.value; })
		.ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
		.round(false);

	    var svg = d3.select("#chart").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.bottom + margin.top)
		.style("margin-left", -margin.left + "px")
		.style("margin.right", -margin.right + "px")
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.style("shape-rendering", "crispEdges");

	    var grandparent = svg.append("g")
		.attr("class", "grandparent");

	    grandparent.append("rect")
		.attr("y", -margin.top)
		.attr("width", width)
		.attr("height", margin.top);

	    grandparent.append("text")
		.attr("x", 6)
		.attr("y", 6 - margin.top)
		.attr("dy", ".75em");

	    if (data instanceof Array) {
		root = { key: rname, values: data };
	    } else {
		root = data;
	    }

	    initialize(root);
	    accumulate(root);
	    layout(root);
	    g_res_init = display(root);
	    var active_node = root;

	    if (window.parent !== window) {
		var myheight = document.documentElement.scrollHeight || document.body.scrollHeight;
		window.parent.postMessage({height: myheight}, '*');
	    }

	    dag_expand_collapse(termes_in_cluster_nodes, representative_nodes, root_node);

	    function initialize(root) {
		root.x = root.y = 0;
		root.dx = width;
		root.dy = height;
		root.depth = 0;
	    }

	    // Aggregate the values for internal nodes. This is normally done by the
	    // treemap layout, but not here because of our custom implementation.
	    // We also take a snapshot of the original children (_children) to avoid
	    // the children being overwritten when when layout is computed.

	    function accumulate(d) {
		if (d._children = d.values){
		    d.value = d.values.reduce(function(p, v) { return p + accumulate(v); }, 0);
		}
		return d.value;
	    }

	    // Compute the treemap layout recursively such that each group of siblings
	    // uses the same size (1×1) rather than the dimensions of the parent cell.
	    // This optimizes the layout for the current zoom state. Note that a wrapper
	    // object is created for the parent node for each group of siblings so that
	    // the parent’s dimensions are not discarded as we recurse. Since each group
	    // of sibling was laid out in 1×1, we must rescale to fit using absolute
	    // coordinates. This lets us use a viewport to zoom.
	    function layout(d) {
		if (d._children) {
		    treemap.nodes({_children: d._children});
		    d._children.forEach(function(c) {
			c.x = d.x + c.x * d.dx;
			c.y = d.y + c.y * d.dy;
			c.dx *= d.dx;
			c.dy *= d.dy;
			c.parent = d;
			layout(c);
		    });
		}
	    }

	    function display(d) {
		active_node = d;
		
		grandparent
		    .datum(d.parent)
		    .on("click", transition)
		    .select("text")
		    .text(name(d));

		var g1 = svg.insert("g", ".grandparent")
		    .datum(d)
		    .attr("class", "depth");

		var g = g1.selectAll("g")
		    .data(d._children)
		    .enter().append("g");

		g.filter(function(d) { return d._children; })
		    .classed("children", true)
		    .on("click", transition);

		var children = g.selectAll(".child")
		    .data(function(d) { return d._children || [d]; })
		    .enter().append("g");

		if (d3.select('input[name="size_rect"]:checked').node().value == "sumbyCount") {
		    children.append("rect")
			.attr("class", "child")
			.call(rect)
			.append("title")
			.text(function(d) { var rounded_value = String(d.parent.value).substring(0,8); return d.parent.key + " (" + "nb of genes :" + rounded_value + ")"; });
		}
		else if (d3.select('input[name="size_rect"]:checked').node().value == "sumbyIC") {
		    children.append("rect")
			.attr("class", "child")
			.call(rect)
			.append("title")
			.text(function(d) { var rounded_value = String(d.parent.value-1).substring(0,8); return d.parent.key + " (" + "IC : " + rounded_value + ")"; });
		}
		else {
		    children.append("rect")
			.attr("class", "child")
			.call(rect)
			.append("title")
			.text(function(d) { var rounded_value = String(d.parent.value-1).substring(0,8); return d.parent.key + " (" + "depth : " + rounded_value + ")"; });
		}
		
		g.append("rect")
		    .attr("class", "parent")
		    .call(rect);

		var t = g.append("text")
		    .attr("class", "ptext")
		    .attr("dy", ".75em")

		t.append("tspan")
		    .text(function(d) { return d.key; });
		
		t.call(text);

		g.selectAll("rect")
		    .style("fill", function(d) { return color(d.key); });


		return [g, g1];
	    }

	    function transition(d) {
		if (transitioning || !d) return;
		transitioning = true;

		if (first_time == true){
		    first_time = false;
		    g1 = g_res_init[1];
		}
		else {
		    g1 = g_res_next;
		}
		
		var g_res = display(d),
		    g2 = g_res[0],
		    t1 = g1.transition().duration(750),
		    t2 = g2.transition().duration(750);
		
		// Update the domain only after entering new elements.
		x.domain([d.x, d.x + d.dx]);
		y.domain([d.y, d.y + d.dy]);
		
		// Enable anti-aliasing during the transition.
		svg.style("shape-rendering", null);

		// Draw child nodes on top of parent nodes.
		svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

		// Fade-in entering text.
		g2.selectAll("text").style("fill-opacity", 0);

		// Transition to the new view.
		t1.selectAll(".ptext").call(text).style("fill-opacity", 0);
		t2.selectAll(".ptext").call(text).style("fill-opacity", 1);
		t1.selectAll("rect").call(rect);
		t2.selectAll("rect").call(rect);
		
		// Remove the old node when the transition is finished.
		t1.remove().each("end", function() {
		    svg.style("shape-rendering", "crispEdges");
		    transitioning = false;
		});
		g_res_next = g_res[1];

		// interact with the DAG
		if (d.depth == 1 && representative_names.indexOf(d.key) != -1){
		    var clicked_id = "";
		    var element00= {};
		    representative_nodes.forEach(function(element){
			if (element.name == d.key){
			    clicked_id = element.id;
			    element00 = element;
			}
		    });
		    dag_expand(termes_in_cluster_nodes, representative_nodes, root_node, clicked_id, element00);
		}
		else if (d.depth == 0){
		    state = 0;
		    render(inner, g_dag);
		    dag_expand_collapse(termes_in_cluster_nodes, representative_nodes, root_node);
		}
		else {
		    var clicked_id = "";
		    var element00= {};
		    termes_in_cluster_nodes.forEach(function(element){
			if (element.name == d.key){
			    clicked_id = element.id;
			    element00 = element;
			}
		    });
		    dag_expand_termes(termes_in_cluster_nodes, representative_nodes, root_node, clicked_id, element00);
		}
	    }

	    function wraptext(text){
                father = text;
                text.each(function() {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")),
                    width =  0;
                       
                       text.attr("y", function(d){ width = x(d.x + d.dx) - x(d.x); return text.attr("y"); })
                     
                    res = "";
                    var tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
                while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    line.push('...');
                    break;
                }
                }
                text.text(line.join(" "));
            });
            }
	    function text(text) {
		text.selectAll("tspan")
		    .attr("x", function(d) { return x(d.x) + 6; })
		text.attr("x", function(d) { return x(d.x) + 6; })
		    .attr("y", function(d) { return y(d.y) + 6; })
                    .call(wraptext)
		
	    }

	    function rect(rect) {
		rect.attr("x", function(d) { return x(d.x); })
		    .attr("y", function(d) { return y(d.y); })
		    .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
		    .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
	    }

	    function name(d) {
		if (d.parent){
		    if (d3.select('input[name="size_rect"]:checked').node().value == "sumbyCount") {
			return name(d.parent) + " / " + d.key + " (" + formatNumber(d.value) + ")";
		    }
		    else {
			var rounded_value = String(d.value-1).substring(0,8);
			return name(d.parent) + " / " + d.key + " (" + rounded_value + ")";
		    }
		}
		else {
		    return d.key;
		}
	    }


	    // FUNCTION DAG


	    // function that choose to expand or collapse the dag when clicking on a node
	    function dag_expand_collapse (termes_in_cluster_nodes, representative_nodes, root_node){
		// we interact with the node
		var YoN = "no";
		svg_dag.selectAll("g.node").on("click", function(clicked_id) {
		    if (state !=0 && clicked_id == root_node.id){
			transition(root);
		    }
		    else {
			representative_nodes.forEach(function(element00){
			    if (state == 0 && element00.id == clicked_id){
				YoN = "yes";
				root._children.forEach(function(child){
				    if (child.key == element00.name) {
					transition(child);
				    }
				});
			    }
			    else if (state == 1 && element00.id == clicked_id){
				YoN = "yes";
				transition(root);
			    }
			    else if (state == 2 && element00.id == clicked_id){
				root._children.forEach(function(child){
				    if (child.key == element00.name) {
					transition(child);
				    }
				});
				YoN = "yes";
				transition(root);
			    }
			});
			if (YoN == "no") {
			    termes_in_cluster_nodes.forEach(function(element00){
				if (element00.id == clicked_id) {
				    root._children.forEach(function(child){
					child._children.forEach(function(grandchild){
					    if (grandchild.key == element00.name) {
						transition(grandchild);
					    }
					});
				    });
				}
			    });
			}	    
		    }
		});
	    }

	    // function that expand nodes from representative
	    function dag_expand (termes_in_cluster_nodes, representative_nodes, root_node, clicked_id, element00) {
		state = 1;
		// Create a new directed graph
		var g2 = new dagreD3.graphlib.Graph().setGraph({rankdir: "BT"})
		    .setDefaultEdgeLabel(function () {
			return {};
		    });
		// Find the root the terms and retrieve their ancestors and descendants
		var termes_nodes = [];
		var termes_nodes_name = [];
		var representative = element00;
		data2.Class.forEach(function(element){
		    if (element00.name == element.name){
			element.termes.forEach(function(element2){
			    var tmp_terme_node = {id:element2.id, name:element2.name, ancestor:element2.ancestor, descendant:element2.descendant, children:element2.children};
			    termes_nodes.push(tmp_terme_node);
			    termes_nodes_name.push(element2.name);
			});
		    }
		});
		// Determine the interaction of each representatives ancestors with the root descendant
		var all_nodes = create_graph_nodes(representative, termes_nodes);

		// Retrieve the nodes id in an array
		all_id = [];
		all_nodes.forEach(function(element){
		    all_id.push(element.id);
		});
		// Create the graph
		all_nodes.forEach(function(element){
		    if (element.name == element00.name) {
			g2.setNode(element.id, {label: element.name, style: "fill: #33FF33"}); // #33FF33 = green
		    }
		    else if (termes_nodes_name.indexOf(element.name) != -1) {
			g2.setNode(element.id, {label: element.name, style: "fill: #1e88e5"}); // #1e88e5 = blue
		    }
		    else {
			g2.setNode(element.id, {label: element.name, style:"fill: #fff176"}); // #fff176 = yellow
		    }
		    element.children.forEach(function(element2){
			if (all_id.indexOf(element2) != -1){
			    g2.setEdge(element2, element.id);
			}
		    });
		});
		// Run the renderer. This is what draws the final graph.
		render(inner, g2);
		dag_expand_collapse(termes_in_cluster_nodes, representative_nodes, root_node);
	    }

	    function dag_expand_termes (termes_in_cluster_nodes, representative_nodes, root_node, clicked_id, element00) {
		state = 2;
		// Create a new directed graph
		var g2 = new dagreD3.graphlib.Graph().setGraph({rankdir: "BT"})
		    .setDefaultEdgeLabel(function () {
			return {};
		    });
		// Determine the interaction of each representatives ancestors with the root descendant
		var all_nodes = create_graph_nodes(root_node, [element00], data1);
		// Retrieve the nodes id in an array
		all_id = [];
		all_nodes.forEach(function(element){
		    all_id.push(element.id);
		});

		representative_name_tmp = [];
		representative_nodes.forEach(function(element){
		    representative_name_tmp.push(element.name);
		});

		termes_cluster_representative_name_tmp = [];
		termes_in_cluster_nodes.forEach(function(element){
		    termes_cluster_representative_name_tmp.push(element.name);
		});		
		// Create the graph
		all_nodes.forEach(function(element){
		    if (element.name == element00.name) {
			g2.setNode(element.id, {label: element.name, style: "fill: #1e88e5"}); // #1e88e5 = blue
		    }
		    else if (element.name == root_node.name) {
			g2.setNode(element.id, {label: element.name, style: "fill: #ff7043"}); //  #f5cba7 = orange
		    }
		    else if (representative_name_tmp.indexOf(element.name) != -1){
			g2.setNode(element.id, {label: element.name, style: "fill: #33FF33"}); // #33FF33= green
		    }
		    else if (termes_cluster_representative_name_tmp.indexOf(element.name) != -1){
			g2.setNode(element.id, {label: element.name, style: "fill: #33FF33"}); // #33FF33= green
		    }
		    else {
			g2.setNode(element.id, {label: element.name, style:"fill: #fff176"}); // #fff176 = yellow
		    }
		    element.children.forEach(function(element2){
			if (all_id.indexOf(element2) != -1){
			    g2.setEdge(element2, element.id);
			}
		    });
		});
		// Run the renderer. This is what draws the final graph.
		render(inner, g2);
		dag_expand_collapse(termes_in_cluster_nodes, representative_nodes, root_node);
	    }
	    
	    // Input gestion
	    d3.selectAll("input")
		.data([sumbyCount, sumbyIC, sumbyDepth], function(d) { return d ? d.name : this.value; })
		.on("change", changed);
	    
	    function changed(sum) {
		sum();
	    }

	    // Change the size of element of the treemap to correspond to the number of genes
	    function sumbyCount(d) {
		root.values.forEach(function(element){
		    element.value = element.nb_gene;
		    element.values.forEach(function(element2){
			element2.value = element2.nb_gene;
		    });
		});
		layout(root);
		transition(active_node);
	    }

	    // Change the size of element of the treemap to correspond to IC
	    function sumbyIC(d) {
		root.values.forEach(function(element){
		    element.value = element.ic + 1;
		    element.values.forEach(function(element2){
			element2.value = element2.ic + 1;
		    });
		});
		layout(root);
		transition(active_node);
	    }

	    // Change the size of element of the treemap to correspond to the depth
	    function sumbyDepth(d) {
		root.values.forEach(function(element){
		    element.value = element.depth_go + 1;
		    element.values.forEach(function(element2){
			element2.value = element2.depth_go + 1;
		    });
		});
		layout(root);
		transition(active_node);
	    }	    
	}
	

	//DAG

	var width = $(window).width();
	var height = ($(window).height()/2);
	var holder = d3.select("#chartdag")
	    .append("svg")
	    .attr("width", width)    
	    .attr("height", height)
	    .append("g").attr("translate(40, 30)");
	
	// Create a new directed graph
	var g_dag = new dagreD3.graphlib.Graph().setGraph({rankdir: "BT"})
	    .setDefaultEdgeLabel(function () {
		return {};
	    });
	
	// Find the root and the representatives and retrieve their ancestors and descendants
	var root_node = {};
	var representative_nodes = [];
	var representative_names = [];
	var termes_in_cluster_nodes = [];
	var termes_in_cluster_names = [];
	data2.Class.forEach(function(element){
	    var tmp_representative_node = {id:element.id, name:element.name, ancestor:element.ancestor, descendant:element.descendant, children:element.children};
	    representative_nodes.push(tmp_representative_node);
	    representative_names.push(element.name);
	    element.termes.forEach(function(element2){
		var tmp_termes_in_cluster_node = {id:element2.id, name:element2.name, ancestor:element2.ancestor, descendant:element2.descendant, children:element2.children};
		termes_in_cluster_nodes.push(tmp_termes_in_cluster_node);
		if (termes_in_cluster_names.indexOf(element2.name) == -1){
		    termes_in_cluster_names.push(element2.name);
		}
	    });
	});
	data1.Class.forEach(function(element){
	    if (element.Depth == 0.0){
		root_node = {id:element.id, name:element.name, ancestor:element.ancestor, descendant:element.descendant, children:element.children};
	    }
	});
	// Determine the interaction of each representatives ancestors with the root descendant
	var all_nodes = create_graph_nodes(root_node, representative_nodes);

	// Retrieve the nodes id in an array
	all_id = [];
	all_nodes.forEach(function(element){
	    all_id.push(element.id);
	});

	// Create the graph
	all_nodes.forEach(function(element){
	    if (element.name == root_node.name) {
		g_dag.setNode(element.id, {label: element.name, style: "fill: #ff7043"}); //  #f5cba7 = orange
	    }
	    else if (representative_names.indexOf(element.name) != -1) {
		g_dag.setNode(element.id, {label: element.name, style: "fill: #33FF33"}); // #33FF33= green
	    }
	    else {
		g_dag.setNode(element.id, {label: element.name, style:"fill: #fff176"}); // #fff176 = yellow
	    }
	    element.children.forEach(function(element2){
		if (all_id.indexOf(element2) != -1){
		    g_dag.setEdge(element2, element.id);
		}
	    });
	});	

	// Change the style of the nodes
	g_dag.nodes().forEach(function (v) {
	    var node = g_dag.node(v);
	    node.rx = node.ry = 5;
	});	
	// Create the renderer
	var render = new dagreD3.render();
	// Set up an SVG group so that we can translate the final graph.
	var svg_dag = d3.select("svg"),
	    inner = svg_dag.append("g");
	// Set up zoom support
	var zoom = d3.behavior.zoom().on("zoom", function () {
	    inner.attr("transform", "translate(" + d3.event.translate + ")" +
		       "scale(" + d3.event.scale + ")");
	});
	svg_dag.call(zoom);
	// Run the renderer. This is what draws the final graph.
	render(inner, g_dag);
	var state = 0;


	//  TREEMAP
	
	// Create the data structure of the treemap from data_treemap_dag.json
	var treemap_data = [];
	data2.Class.forEach(function(element){
	    var tmp_node_treemap = {key:element.name, value:0, depth_go:element.Depth, ic:element.ICNuno, values:[]};	    
	    element.termes.forEach(function(element2){
		var tmp_node_treemap2 = {key:element2.name, value:element2.genes.length, nb_gene:element2.genes.length, depth_go:element2.Depth, ic:element2.ICNuno, values:[]};
		element2.genes.forEach(function(element3){
		    var tmp_node_treemap3 = {key:element3.name, value:1};
		    tmp_node_treemap2.values.push(tmp_node_treemap3);
		});
		tmp_node_treemap.values.push(tmp_node_treemap2);
	    });
	    treemap_data.push(tmp_node_treemap);
	});	
	treemap_data.forEach(function(element){
	    element.values.forEach(function(element2){
		element.value = element.value + element2.value;
		element.nb_gene = element.value;
	    });
	});
	;
	main({title: "Gene Ontology"}, {key: root_node.name, values: treemap_data});
	
    });
});
