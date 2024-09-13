import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as d3 from 'd3-force-3d'
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import ForceGraph3D from '3d-force-graph';


const cyContainer = document.getElementById('cy');
const container = document.getElementById('threejs-container');

const cy = cytoscape({
    container: document.getElementById('cy'),
    elements: elements,
    layout: {
        name: 'fcose',
        padding: 1, // padding around the graph
        avoidOverlap: true, // ensures nodes do not overlap
        nodeDimensionsIncludeLabels: true, // consider node labels when calculating spacing
        spacingFactor: 1.1, // increases space between nodes
        nodeRepulsion: 4500, // repulsion strength between nodes
        idealEdgeLength: 100, // ideal edge length for the layout
        edgeElasticity: 0.45, // elasticity of edges
        gravity: 0.25, // gravity force to keep nodes together
        numIter: 2500, // number of iterations to run the layout
        tilingPaddingVertical: 10, // vertical padding for tiling (for groups of nodes)
        tilingPaddingHorizontal: 10, // horizontal padding for tiling (for groups of nodes)
        animate: true, // whether to animate the layout
        fit: true, // fit the graph to the viewport
        randomize: true, // randomize the initial positions of nodes
        initialEnergyOnIncremental: 0.5, // energy level for incremental layout changes
        animationEasing: 'ease-out',
    },
    style: [
        {
            selector: 'node',
            style: {
                'shape': 'square',
                'background-color': '#007bff',
                'background-opacity': 0,
                'border-width': 2,
                'border-color': 'transparent',
                'border-opacity': 0,
                'width': 200,
                'height': 100,
                'text-valign': 'center',
                'text-halign': 'center'
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 3,
                'line-color': '#ccc',
                'target-arrow-color': '#ccc',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier'
            }
        },
        {
            selector: ':parent',
            style: {
                'background-opacity': 0.333,
                'border-color': '#fbbc05',
                'padding': 30
            }
        }
    ],
});

// Run the layout and gather the node positions
cy.layout({
    name: 'fcose',
    padding: 1, // padding around the graph
    avoidOverlap: true, // ensures nodes do not overlap
    nodeDimensionsIncludeLabels: true, // consider node labels when calculating spacing
    spacingFactor: 1.1, // increases space between nodes
    nodeRepulsion: 4500, // repulsion strength between nodes
    idealEdgeLength: 100, // ideal edge length for the layout
    edgeElasticity: 0.45, // elasticity of edges
    gravity: 0.25, // gravity force to keep nodes together
    numIter: 2500, // number of iterations to run the layout
    tilingPaddingVertical: 10, // vertical padding for tiling (for groups of nodes)
    tilingPaddingHorizontal: 10, // horizontal padding for tiling (for groups of nodes)
    animate: true, // whether to animate the layout
    fit: true, // fit the graph to the viewport
    randomize: true, // randomize the initial positions of nodes
    initialEnergyOnIncremental: 0.5, // energy level for incremental layout changes
    animationEasing: 'ease-out',
}).run();
// set nodeHtmlLabel for your Cy instance
cy.nodeHtmlLabel([
    {
        query: 'node',
        valign: "center",
        halign: "center",
        valignBox: "center",
        halignBox: "center",
        tpl: function (data) {
            let htmlcontent = '<div class="cy-title__p1"><strong>' + data.id + '</strong>';
            if (data.description) {
                htmlcontent += '<p>' + data.description + '</p>';
            }
            htmlcontent += '</div>'
            return htmlcontent;
        }
    },
    {
        query: ':parent',
        valign: "center",
        halign: "center",
        valignBox: "center",
        halignBox: "center",
        tpl: function (data) {
            return '';
        }
    },
]);

const fg = ForceGraph3D({
    extraRenderers: [new CSS2DRenderer(), new CSS3DRenderer()],
    // controlType: 'orbit'
})
    (container)
    .backgroundColor('#ffffff')
    .linkDirectionalParticles(2)
    .linkDirectionalParticleSpeed(0.005)
    .nodeRelSize(50)
    .cooldownTicks(0)
    .linkColor(() => '#000000') // Set black links
    .nodeAutoColorBy('group') // Automatically color nodes by a group attribute (if exists)
    .d3Force('charge', null); // Disable default force-directed layout for manual positioning


function cytoscapeToForceGraph(cy) {
    const nodes = cy.nodes().map(node => ({
        id: node.id(),
        x: node.position().x,
        y: node.position().y,
        z: node.position().z || 0,
    }));

    const links = cy.edges().map(edge => ({
        source: edge.source().id(),
        target: edge.target().id()
    }));

    return { nodes, links };
}


// Function to smoothly update node positions in ForceGraph3D
function smoothUpdate(targetNodes) {
    const currentNodes = fg.graphData().nodes;
    const duration = 1000; // Animation duration in milliseconds
    const steps = 60; // Number of steps for smoothness
    const interval = duration / steps;
    let currentStep = 0;

    function interpolate() {
      currentStep++;
      if (currentStep > steps) return;

      targetNodes.forEach(targetNode => {
        const currentNode = currentNodes.find(node => node.id === targetNode.id);
        if (currentNode) {
          // Linear interpolation
          currentNode.x += (targetNode.x - currentNode.x) / (steps - currentStep + 1);
          currentNode.y += (targetNode.y - currentNode.y) / (steps - currentStep + 1);
          currentNode.z += (targetNode.z - currentNode.z) / (steps - currentStep + 1);
        }
      });

      fg.refresh(); // Re-render the graph with updated positions
      setTimeout(interpolate, interval);
    }

    interpolate();
  }

// Update ForceGraph3D with smooth transitions
function updateForceGraph() {
    const newData = cytoscapeToForceGraph(cy);

    // Update ForceGraph3D with new data to ensure synchronization
    fg.graphData({
        nodes: newData.nodes,
        links: newData.links
    });

    // Smoothly update positions if nodes exist in the current graph
    smoothUpdate(newData.nodes);
}



// Initial update
updateForceGraph();

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
scene.background = new THREE.Color(0xffffff)
camera.near = 0.1;
camera.far = 10000;
camera.updateProjectionMatrix();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;
controls.enableRotate = true;
const threeJSNodes = {}
const threeJSEdges = {}
const boundingBox = new THREE.Box3();
// Extract nodes from Cytoscape.js and add them to the Three.js scene
const nodePositions = cy.nodes().map(node => {
    return {
        id: node.id(),
        x: node.position('x'),
        y: node.position('y'),
        z: 0 // Random Z value for 3D depth
    };
});

// Create Three.js objects for nodes
nodePositions.forEach(position => {
    const geometry = new THREE.SphereGeometry(15, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x0074D9 });
    const node = new THREE.Mesh(geometry, material);

    node.position.set(position.x, position.y, position.z);
    scene.add(node);
    threeJSNodes[position.id] = node

    // Save node reference in the position object for later use in edges
    position.threeObject = node;
    boundingBox.expandByPoint(node.position);

});

// Create edges based on Cytoscape.js edges
cy.edges().forEach(edge => {
    const sourceNode = nodePositions.find(n => n.id === edge.source().id());
    const targetNode = nodePositions.find(n => n.id === edge.target().id());

    const material = new THREE.LineBasicMaterial({ color: 0xFF4136 });
    const points = [
        new THREE.Vector3(sourceNode.x, sourceNode.y, sourceNode.z),
        new THREE.Vector3(targetNode.x, targetNode.y, targetNode.z)
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    threeJSEdges[edge.id()] = line
});


const center = boundingBox.getCenter(new THREE.Vector3());
const size = boundingBox.getSize(new THREE.Vector3());
const maxDim = Math.max(size.x, size.y, size.z);
const fitOffset = 1;
const distance = maxDim / (2 * Math.tan(Math.PI * camera.fov / 360)) * fitOffset;
camera.position.set(center.x, center.y, center.z + distance);
camera.lookAt(center);
controls.target.copy(center);
controls.update();

// Render loop
// function animate() {
//     requestAnimationFrame(animate);
//     Object.values(threeJSNodes).forEach(node => {
//         node.lookAt(camera.position);
//     });
//     controls.update();
//     renderer.render(scene, camera);
// }

// animate();

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});


// Toggle switch functionality
const toggleView = document.getElementById('toggle-view');
let is3D = false;
let isFcose = true;

const updateView = () => {
    if (is3D) {
        cyContainer.style.display = 'none';
        container.style.display = 'block';
    } else {
        cyContainer.style.display = 'block';
        container.style.display = 'none';
    }
};


toggleView.addEventListener('change', () => {
    is3D = !is3D;
    updateView();
});

document.getElementById("randomizeButton").addEventListener("click", function () {
    var layout = cy.layout({
        name: 'random',
        animate: true,
        animationDuration: 1000
    });
    layout.run();

    // After Cytoscape layout update
    cy.on('layoutstop', function () {
        // Switch back to fcose layout after 10 seconds
        setTimeout(() => {
            updateForceGraph()
        }, 0);
    });
    randomizeButton.classList.remove('btn-secondary');
    randomizeButton.classList.add('btn-primary');
    fcoseButton.classList.remove('btn-primary');
    fcoseButton.classList.add('btn-secondary');
    isFcose = false
});

document.getElementById("fcoseButton").addEventListener("click", function () {
    var layout = cy.layout({
        name: 'fcose',
        padding: 1, // padding around the graph
        avoidOverlap: true, // ensures nodes do not overlap
        nodeDimensionsIncludeLabels: true, // consider node labels when calculating spacing
        spacingFactor: isFcose ? 1 : 1.1, // increases space between nodes
        nodeRepulsion: 4500, // repulsion strength between nodes
        idealEdgeLength: 100, // ideal edge length for the layout
        edgeElasticity: 0.45, // elasticity of edges
        gravity: 0.25, // gravity force to keep nodes together
        numIter: 2500, // number of iterations to run the layout
        tilingPaddingVertical: 10, // vertical padding for tiling (for groups of nodes)
        tilingPaddingHorizontal: 10, // horizontal padding for tiling (for groups of nodes)
        animate: true, // whether to animate the layout
        fit: true, // fit the graph to the viewport
        randomize: !isFcose, // randomize the initial positions of nodes
        initialEnergyOnIncremental: isFcose ? 0 : 0.5, // energy level for incremental layout changes
        animationEasing: 'ease-out',
    });
    layout.run();

    // After Cytoscape layout update
    cy.on('layoutstop', function () {
        // Switch back to fcose layout after 10 seconds
        setTimeout(() => {
            updateForceGraph()
        }, 0);
    });
    fcoseButton.classList.remove('btn-secondary');
    fcoseButton.classList.add('btn-primary');
    randomizeButton.classList.remove('btn-primary');
    randomizeButton.classList.add('btn-secondary');
    isFcose = true
});

// Function to update Three.js nodes and edges based on Cytoscape layout
function updateThreeJSFromCytoscape(cytoscapeInstance) {
    // Listen for when the layout stops            
    cytoscapeInstance.on('layoutstop', () => {
        // Debug: Check if Cytoscape layout positions are ready
        console.log('Cytoscape layout stopped, updating Three.js...');

        // Update nodes first
        cytoscapeInstance.nodes().forEach(node => {
            const id = node.id();
            const pos = node.position();
            const threeNode = threeJSNodes[id]; // Find the corresponding Three.js node

            if (threeNode && threeNode.position) {
                // Smoothly animate node movement to new position
                animateNodeMovement(threeNode, pos);
            } else {
                console.error(`Node ${id} not found or lacks a position property.`);
            }
        });

        // Update edges
        cytoscapeInstance.edges().forEach(edge => {
            const source = edge.source().id();
            const target = edge.target().id();

            // Get the corresponding source and target nodes in Three.js
            const sourceNode = threeJSNodes[source];
            const targetNode = threeJSNodes[target];

            if (sourceNode && targetNode) {
                const edgeObject = threeJSEdges[edge.id()]; // Your stored line object with BufferGeometry

                if (edgeObject && edgeObject.geometry.isBufferGeometry) {
                    // Update the edge geometry positions
                    updateEdgePosition(edgeObject.geometry, sourceNode.position, targetNode.position);
                } else {
                    console.error(`Edge ${edge.id()} does not exist in Three.js scene or is not a BufferGeometry.`);
                }
            }
        });

        // Debug: Confirm update completion
        console.log('Three.js update completed.');
    });
}

// Function to animate node movement
function animateNodeMovement(node, targetPosition) {
    const duration = 1000; // Duration in milliseconds
    const start = node.position.clone();
    const end = new THREE.Vector3(targetPosition.x, targetPosition.y, 0); // Update Z to 0 if 2D

    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1); // Clamp progress between 0 and 1

        node.position.lerpVectors(start, end, progress);

        if (progress < 1) {
            requestAnimationFrame(animate); // Continue animation
        }
    }

    animate();
}

// Function to update edge positions in BufferGeometry
function updateEdgePosition(geometry, sourcePosition, targetPosition) {
    const positions = geometry.attributes.position.array;

    // Update the positions array with the new coordinates
    positions[0] = sourcePosition.x;
    positions[1] = sourcePosition.y;
    positions[2] = sourcePosition.z || 0; // Assuming z is 0 for 2D layouts

    positions[3] = targetPosition.x;
    positions[4] = targetPosition.y;
    positions[5] = targetPosition.z || 0; // Assuming z is 0 for 2D layouts

    // Mark the position attribute as needing an update
    geometry.attributes.position.needsUpdate = true;
}